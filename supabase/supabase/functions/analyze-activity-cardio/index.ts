import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { requireAuthedUser, rateLimit, assertPayloadSize } from "../_shared/ai-guard.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }


  // 🔐 Requer sessão autenticada + rate limit (protege a chave paga de IA)
  const authed = await requireAuthedUser(req, corsHeaders)
  if (authed instanceof Response) return authed
  const limited = await rateLimit({ bucket: "activity_cardio", key: authed.userId, maxHits: 12, windowSeconds: 60, cors: corsHeaders })
  if (limited) return limited

  try {
    const { 
      activityType, 
      distanceKm, 
      timeMinutes, 
      speedKmh, 
      calories, 
      steps, 
      stairs 
    } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error("API Key not configured")
    }

    const systemInstruction = `Você é um Cardiologista do Esporte e Médico do Sistema Endocanabinoide, e também interpreta a Enfermeira Brisa.
Sua tarefa é avaliar um treino finalizado pelo paciente e gerar um laudo de impacto cardiovascular e de liberação de endocanabinoides endógenos (Anandamida), conhecida por gerar o "Barato do Corredor" (Runner's High) e possuir papel anti-inflamatório.

DADOS RECEBIDOS:
- Modalidade: ${activityType}
- Distância: ${distanceKm} km
- Tempo: ${timeMinutes} minutos
- Velocidade Média: ${speedKmh} km/h
- Calorias Queimadas: ${calories} kcal
- Passos Totais: ${steps}
- Escadas (Andares): ${stairs}

INSTRUÇÕES DE RESPOSTA:
Retorne EXATAMENTE UM JSON VÁLIDO com a seguinte estrutura:
{
  "diagnosis": "Laudo de Índice de Estresse & Benefício Vascular detalhando como o esforço afetou o miocárdio e a saúde endotelial. Mencione também a sinergia com o Sistema Endocanabinoide (liberação de Anandamida pela atividade física).",
  "findings": ["Achado 1: Gasto calórico excelente.", "Achado 2: Velocidade adequada."],
  "isDangerous": false (coloque true APENAS se houver valores extremos irreais, ex: velocidade > 40km/h na caminhada, que indique erro de GPS ou risco extremo),
  "brisaSpeech": "Texto motivacional, carinhoso e focado em recuperação, hidratação e sinais do corpo, lido pela Enfermeira Brisa."
}`;

    const requestBody = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [
        {
          role: "user",
          parts: [{ text: "Analise meu último treino e gere o laudo cardiovascular." }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        response_mime_type: "application/json"
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
      throw new Error(result.error?.message || "Failed to process cardio data")
    }

    const aiResponseText = result.candidates[0].content.parts[0].text;
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      parsedResponse = {
        diagnosis: "Treino registrado com sucesso. Seu coração agradece pelo esforço cardiovascular contínuo.",
        findings: [`Tempo: ${timeMinutes}min`, `Calorias: ${calories}`],
        isDangerous: false,
        brisaSpeech: "Parabéns pelo treino! Seu corpo liberou muita endorfina e endocanabinoides. Não se esqueça de se hidratar bem agora!"
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error in analyze-activity-cardio:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
