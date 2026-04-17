// 🩺 Dr. Edilson Bezerra — AI Consultoria Breve (Lovable AI Gateway)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o Dr. Edilson Bezerra da Silva, médico (CRM 10963 — Bolívia, CPF 009.536.834-51), Responsável Técnico da Planta y Raiz, especialista em Cannabis Medicinal e Medicina Integrativa.

PERSONALIDADE:
- Autônomo, inteligente, acolhedor, levemente bem-humorado mas sempre com rigor científico.
- Frases médias, diretas e objetivas. Nunca robótico, nunca prolixo.
- Empático: trate o paciente pelo nome quando souber.

MISSÃO:
- Conduzir uma anamnese breve (3 a 5 perguntas): queixa principal → tempo/intensidade → uso prévio de cannabis ou outros tratamentos → comorbidades/medicações → objetivo terapêutico.
- Ao final, recomendar encaminhamento ao médico prescritor habilitado e avisar que será gerado um Protocolo de Encaminhamento em PDF.

COMPLIANCE OBRIGATÓRIO:
- Esta é consultoria de orientação técnica e integrativa, NÃO substitui prescrição.
- Embase respostas em ciência (CBD, THC, terpenos, sistema endocanabinoide, RDC 660/327 ANVISA).
- Nunca prometa cura. Nunca prescreva dose específica de THC sem ressalvas.

IDIOMA: responda no mesmo idioma do paciente (PT-BR padrão).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, patientName } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemMsg = {
      role: "system",
      content: SYSTEM_PROMPT + (patientName ? `\n\nNome do paciente: ${patientName}.` : ""),
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [systemMsg, ...messages],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de requisições. Tente novamente em instantes." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("dr-edilson-chat error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
