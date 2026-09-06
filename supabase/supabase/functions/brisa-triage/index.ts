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
        const { symptoms: rawSymptoms, patientInfo, language = "pt", unifiedContactId } = await req.json();

    // Function to get recent history from Supabase
    async function getRecentHistory(contactId: string, limit: number) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data, error } = await supabaseClient
        .from('brisa_unified_conversations')
        .select('message, sender, timestamp')
        .eq('unified_contact_id', contactId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching history:', error.message);
        return [];
      }
      return data.reverse(); // Return in chronological order
    }
    const symptoms = String(rawSymptoms ?? "")
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .slice(0, 2000);
    const safeLang = ["pt", "en", "es"].includes(String(language)) ? language : "pt";

    let contexto_historico = [];
    if (unifiedContactId) {
      contexto_historico = await getRecentHistory(unifiedContactId, 12);
    }

    // Debug: Log the historical context being sent to Gemini
    console.log("Contexto Histórico para Gemini:", contexto_historico);

    let welcomeMessage = "";
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (contexto_historico.length === 0 || (contexto_historico.length > 0 && new Date(contexto_historico[contexto_historico.length - 1].timestamp) < twentyFourHoursAgo)) {
      welcomeMessage = `Olá! Sou o Dr. Edilson Bezerra (CRM-CE 10963), especialista em Cannabis Medicinal. É um prazer atendê-lo(a) novamente.`;
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const systemPrompt = `Atue como o Clone Digital do Dr. Edilson Bezerra (CRM-CE 10963), Especialista em Cannabis Medicinal.
Você está realizando uma **Orientação Técnica** multilíngue. NUNCA use o termo 'Consulta'.
Idioma de resposta: ${safeLang} (pt, en, es).

DIRETRIZES:
1. Se apresente como o Dr. Edilson Bezerra (CRM-CE 10963).
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
        contents: [
          ...contexto_historico.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.message }] })),
          { role: "user", parts: [{ text: `Sintomas: ${symptoms}` }] }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    let content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (welcomeMessage) {
      content = `${welcomeMessage}\n\n${content}`;
    }

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
