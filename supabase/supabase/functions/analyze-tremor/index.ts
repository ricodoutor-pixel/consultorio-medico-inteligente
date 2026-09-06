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
  const limited = await rateLimit({ bucket: "tremor", key: authed.userId, maxHits: 12, windowSeconds: 60, cors: corsHeaders })
  if (limited) return limited

  try {
    const { frequencyHz, amplitudeRMS } = await req.json()

    if (frequencyHz === undefined || amplitudeRMS === undefined) {
      throw new Error("Missing frequency or amplitude data")
    }

    if (!GEMINI_API_KEY) {
      throw new Error("API Key not configured")
    }

    const systemInstruction = `Você é um neurologista especialista em distúrbios do movimento e também a Enfermeira Brisa (assistente acolhedora).
Você receberá a Frequência Dominante (Hz) e a Amplitude RMS de um tremor medido pelo acelerômetro de um smartphone mantido em postura estendida.

REFERÊNCIA CLÍNICA PARA TREMOR:
- 3 a 6 Hz: Tremor de Repouso (Fortemente sugestivo de Doença de Parkinson).
- 6 a 12 Hz: Tremor de Ação/Postural (Sugestivo de Tremor Essencial ou Ansiedade/Fisiológico exacerbado).
- Amplitude RMS < 0.5: Tremor fisiológico normal.
- Amplitude RMS 0.5 a 2.0: Tremor leve a moderado.
- Amplitude RMS > 2.0: Tremor severo.

INSTRUÇÕES DE RESPOSTA:
Retorne EXATAMENTE UM JSON VÁLIDO com a seguinte estrutura e nada mais:
{
  "diagnosis": "Diagnóstico neurológico sugerido.",
  "findings": ["Achado 1 (ex: Frequência de 4Hz detectada)", "Achado 2 (ex: Amplitude moderada)"],
  "isDangerous": true ou false (true se amplitude > 2.0 ou se características de Parkinson),
  "brisaSpeech": "Texto humano da Brisa orientando o paciente, sem jargões complexos."
}`;

    const prompt = `Analise os seguintes dados do tremor: Frequência: ${frequencyHz} Hz, Amplitude RMS: ${amplitudeRMS}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: "application/json"
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to process tremor data")
    }

    const aiResponseText = result.candidates[0].content.parts[0].text;
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      parsedResponse = {
        diagnosis: "Análise processada com parâmetros padrão.",
        findings: [`Frequência: ${frequencyHz} Hz`, `Amplitude: ${amplitudeRMS}`],
        isDangerous: amplitudeRMS > 2,
        brisaSpeech: "Analisei seus tremores. Os resultados foram salvos no seu prontuário."
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error in analyze-tremor:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
