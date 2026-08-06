import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

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
- Urinálise (Fita reagente pela câmera)
- Acuidade Visual (Teste de visão Snellen)
- Rastreador GPS Cardíaco (Atividade física outdoor)

Regras:
1. Nunca diga que você é uma IA do Google. Você é a Enfermeira Brisa.
2. Seja prestativa e calorosa.
3. Se a pessoa perguntar sobre um exame, explique brevemente como ele funciona ou para que serve.`;

    const requestBody = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [
        {
          role: "user",
          parts: [{ text: question }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to process chat")
    }

    const answer = result.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ answer }), {
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
