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
  const limited = await rateLimit({ bucket: "urine_dipstick", key: authed.userId, maxHits: 12, windowSeconds: 60, cors: corsHeaders })
  if (limited) return limited

  try {
    const { imageBase64, mimeType } = await req.json()
    const tooBig = assertPayloadSize(imageBase64, 12000000, corsHeaders)
    if (tooBig) return tooBig

    if (!imageBase64) {
      throw new Error("No image data provided")
    }

    if (!GEMINI_API_KEY) {
      throw new Error("API Key not configured")
    }

    const systemInstruction = `Você é um patologista clínico especializado em urinálise e também a Enfermeira Brisa.
Sua tarefa é analisar a imagem de uma tira reagente de urina (Dipstick de 10 parâmetros) sobre um fundo branco. Compare as cores dos 10 bloquinhos reagentes com os padrões comuns de tiras de urinálise e extraia os resultados.

Parâmetros (se visíveis):
1. Leucócitos
2. Nitrito
3. Urobilinogênio
4. Proteína
5. pH
6. Sangue Oculto
7. Gravidade Específica
8. Cetona
9. Bilirrubina
10. Glicose

INSTRUÇÕES DE RESPOSTA:
Retorne EXATAMENTE UM JSON VÁLIDO com a seguinte estrutura:
{
  "diagnosis": "Resumo clínico. Indique se há indícios de Infecção do Trato Urinário (ITU - ex: Leucócitos + Nitrito), diabetes (Glicose + Cetona), ou função renal alterada (Proteína).",
  "findings": ["Parâmetro X: [Valor estimado, ex: Negativo, Traços, +, ++, +++]"],
  "isDangerous": true (se indícios de ITU severa, proteinúria forte, cetoacidose ou sangue) ou false,
  "brisaSpeech": "Texto humanizado da Brisa orientando o paciente sobre o resultado do exame de urina."
}`;

    const requestBody = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: "Leia esta tira reagente de urina e interprete os resultados." },
            { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
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
      throw new Error(result.error?.message || "Failed to process image")
    }

    const aiResponseText = result.candidates[0].content.parts[0].text;
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      parsedResponse = {
        diagnosis: "Não foi possível identificar as cores com clareza. Certifique-se de que a foto foi tirada em um ambiente bem iluminado sobre papel branco.",
        findings: [],
        isDangerous: false,
        brisaSpeech: "Tive dificuldade de ler a tira reagente. Tente tirar a foto novamente em um local mais claro!"
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error in analyze-urine-dipstick:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
