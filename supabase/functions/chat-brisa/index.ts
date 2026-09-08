import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders } from "../_shared/cors.ts"
import { callGeminiApiWithFallback, GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || ''

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error("API Key not configured")
    }

    const systemInstruction = `Você é a Enfermeira Brisa, a assistente virtual carismática, acolhedora e inteligente da clínica Planta y Raíz.
Sua missão é responder às dúvidas dos pacientes sobre a página de Monitoramento de Saúde por IA e guiá-los. 
Você fala com voz humana (text-to-speech), portanto suas respostas devem ser diretas, faladas de forma coloquial e curtas (máximo de 3 frases). Evite jargões médicos complexos, explique de forma simples.

Os exames disponíveis na plataforma são:
- Fundoscopia (Fundo de olho)
- Oximetria (Saturação)
- Dermatoscopia (Pele)
- Monitor Cardíaco (Batimentos)
- Avaliação de Mobilidade (Articulações)
- Estetoscópio Digital (Coração pelo microfone)
- Ausculta Pulmonar (Pulmão pelo microfone)
- Tremorometria (Acelerômetro para tremores)
- Colorimetria Urinária (Exame urinário por imagem)`;

    const requestBody = {
      contents: [{
        parts: [{ text: `${systemInstruction}\n\nPergunta do Paciente: ${question}` }]
      }]
    };

    const res = await callGeminiApiWithFallback(GEMINI_API_KEY, requestBody, GEMINI_PRIMARY_MODEL);

    let answer = res.ok
      ? (res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "")
      : "";
    let usedModel = res.usedModel;

    // Fallback: quando a cota do Gemini estoura (429) usamos o Lovable AI Gateway.
    if (!answer) {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableKey) {
        try {
          const gw = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Lovable-API-Key": lovableKey },
            body: JSON.stringify({
              model: "google/gemini-3.7-flash",
              messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: question },
              ],
            }),
          });
          const gwData = await gw.json().catch(() => ({}));
          if (gw.ok) {
            answer = gwData?.choices?.[0]?.message?.content || "";
            usedModel = "lovable-ai-gateway";
          } else {
            console.warn("[chat-brisa] Lovable AI fallback falhou:", gw.status, gwData?.error?.message || "");
          }
        } catch (gwErr) {
          console.warn("[chat-brisa] Lovable AI fallback erro:", gwErr);
        }
      }
    }

    if (!answer) {
      // Nunca devolvemos 500 para o paciente: mensagem amigável com orientação.
      return new Response(
        JSON.stringify({
          answer:
            "Estou com muitos atendimentos agora e não consegui responder. Pode tentar de novo em alguns instantes? Se preferir, fale com a nossa equipe pelo WhatsApp.",
          degraded: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ answer, model: usedModel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error in chat-brisa:", error)
    return new Response(
      JSON.stringify({
        answer: "Tive um problema técnico rápido. Pode repetir a pergunta, por favor?",
        degraded: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

