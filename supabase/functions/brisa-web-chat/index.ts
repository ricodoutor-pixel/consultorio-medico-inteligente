import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || '';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { messages, leadInfo } = await req.json();

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API Key missing" }), { status: 500, headers: cors });
    }

    const systemPrompt = `Você é a Enfª Brisa 🌿, assistente virtual autônoma da Planta y Raiz.
Você está no canal Web de Emergência (Fallback de Atendimento).
Aja de forma empática, profissional e acolhedora.
Contexto do paciente atual:
- Nome: ${leadInfo?.name || 'Não informado'}
- WhatsApp: ${leadInfo?.phone || 'Não informado'}
- Categoria de Suporte: ${leadInfo?.category || 'Geral'}

Lembre-se: não dê diagnósticos nem prescreva medicamentos. O objetivo é triar a solicitação e informar que a equipe de saúde, sob a supervisão da Dra. Suelen Naves Rodrigues, entrará em contato.`;

    const geminiMessages = [
      { role: "system", parts: [{ text: systemPrompt }] },
      ...messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }))
    ];

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          maxOutputTokens: 450,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini erro:", errorText);
      throw new Error(`Erro no Gemini: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, tive uma instabilidade. Como posso ajudar?";

    return new Response(JSON.stringify({ text: reply }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Erro na função brisa-web-chat:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });
  }
});
