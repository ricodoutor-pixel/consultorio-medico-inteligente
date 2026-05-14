import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: require either signed-in user JWT or service-role bearer (for WhatsApp/cron)
  const authHeader = req.headers.get("Authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const isServiceRole = !!serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;

  if (!isServiceRole) {
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await userClient.auth.getClaims(token);
      if (error || !data?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const { symptoms: rawSymptoms, patientInfo, language = "pt" } = await req.json();
    const symptoms = String(rawSymptoms ?? "")
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .slice(0, 2000);
    const safeLang = ["pt", "en", "es"].includes(String(language)) ? language : "pt";
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const systemPrompt = `Atue como o Clone Digital do Dr. Edilson Bezerra (CRM 10963), Especialista em Cannabis Medicinal.
Você está realizando uma **Orientação Técnica** multilíngue. NUNCA use o termo 'Consulta'.
Idioma de resposta: ${safeLang} (pt, en, es).

DIRETRIZES:
1. Se apresente como o Dr. Edilson Bezerra.
2. Analise os sintomas sob a ótica da Medicina Canabinoide.
3. Explique como o CBD/THC pode interagir com o Sistema Endocanabinoide do paciente.
4. Gere um Pré-Prontuário detalhado para auditoria.
5. Deixe claro que esta é uma Orientação Técnica de 20 min.

ESTRUTURA:
- Resumo Clínico
- Indicação de Perfil Canabinoide
- Próximos Passos (Aprovação da Enfª Brisa)`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: `Sintomas: ${symptoms}` }] }],
      }),
    });

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ success: true, orientation: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[brisa-triage] error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
