import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { callGeminiApiWithFallback, GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || ''

serve(async (req) => {
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

    if (!res.ok) {
      throw new Error(res.data?.error?.message || "Failed to process chat with Gemini AI")
    }

    const answer = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar a resposta agora.";

    return new Response(JSON.stringify({ answer, model: res.usedModel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error in chat-brisa:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
