import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.42.0@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { symptoms, patientInfo, language = "pt" } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const systemPrompt = `Atue como o Clone Digital do Dr. Edilson Bezerra (CRM 10963), Especialista em Cannabis Medicinal.
Você está realizando uma **Orientação Técnica** multilíngue. NUNCA use o termo 'Consulta'.
Idioma de resposta: ${language} (pt, en, es).

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
        contents: [{ role: "user", parts: [{ text: `System: ${systemPrompt}\n\nSintomas: ${symptoms}` }] }]
      }),
    });

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ success: true, orientation: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
