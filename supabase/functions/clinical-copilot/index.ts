import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { callGeminiApiWithFallback, GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, patientInfo, notes, triageSummary } = await req.json();
    
    // Auth Check
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Auth" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
       return new Response(JSON.stringify({ error: "Gemini Key Not Configured" }), { status: 500, headers: corsHeaders });
    }

    let systemPrompt = "";
    let userContent = "";

    if (action === "suggest_treatment") {
       systemPrompt = `Atue como Copiloto Clínico especialista em Medicina Canabinoide.
VOCÊ NÃO PRESCREVE. Você sugere rascunhos terapêuticos baseados na RDC 327/2019 da ANVISA para REVISÃO MÉDICA.
O médico tomará a decisão final. Retorne 2 opções de tratamento (Ex: Foco no CBD vs Full Spectrum) baseando-se nos sintomas e notas.
Formate as opções de forma limpa, direta, sem introduções longas.`;
       userContent = `Paciente: ${patientInfo || 'Desconhecido'}\nSintomas/Triagem: ${triageSummary || 'N/A'}\nNotas Atuais do Médico: ${notes || 'N/A'}`;
    } else if (action === "format_soap") {
       systemPrompt = `Atue como transcritor médico. O médico fornecerá anotações rascunhadas.
Sua missão é formatá-las rigorosamente no padrão SOAP:
S: Subjetivo (relato do paciente)
O: Objetivo (exames, sinais vitais)
A: Avaliação (impressão diagnóstica)
P: Plano (conduta terapêutica)
NÃO invente dados. Se uma letra faltar, deixe em branco ou extraia o máximo possível do rascunho.`;
       userContent = `Rascunho do médico:\n${notes}`;
    } else {
       return new Response(JSON.stringify({ error: "Invalid Action" }), { status: 400, headers: corsHeaders });
    }

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
    };

    const res = await callGeminiApiWithFallback(GEMINI_API_KEY, payload, GEMINI_PRIMARY_MODEL);
    
    if (res.ok) {
      const generated = res.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return new Response(JSON.stringify({ success: true, result: generated, source: res.usedModel }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "AI Service Error", details: res.data }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
