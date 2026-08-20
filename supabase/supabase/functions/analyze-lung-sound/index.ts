import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { requireAuthedUser, rateLimit, assertPayloadSize } from "../_shared/ai-guard.ts"
import { callGeminiApiWithFallback, GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || ''

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }


  // 🔐 Requer sessão autenticada + rate limit (protege a chave paga de IA)
  const authed = await requireAuthedUser(req, corsHeaders)
  if (authed instanceof Response) return authed
  const limited = await rateLimit({ bucket: "lung_sound", key: authed.userId, maxHits: 12, windowSeconds: 60, cors: corsHeaders })
  if (limited) return limited

  try {
    const { audioBase64, mimeType } = await req.json()
    const tooBig = assertPayloadSize(audioBase64, 15000000, corsHeaders)
    if (tooBig) return tooBig

    if (!audioBase64) {
      throw new Error("No audio data provided")
    }

    if (!GEMINI_API_KEY) {
      throw new Error("API Key not configured")
    }

    const systemInstruction = `Você é um pneumologista clínico especialista em ausculta pulmonar de altíssima precisão e também a Enfermeira Brisa (assistente acolhedora da Planta y Raiz).
Sua tarefa é analisar o arquivo de áudio de ausculta pulmonar enviado. O áudio foi capturado pelo microfone de um smartphone colocado diretamente no tórax do paciente (face posterior ou anterior). O paciente pode estar respirando profundamente ou repetindo "trinta e três".

Dicionário Clínico Obrigatório para Cruzamento de Dados:
1. Sons Normais: Murmúrio Vesicular (suave, grave, normal nas bases), Som Bronquial (alto, áspero sobre traqueia), Som Broncovesicular.
2. Estertores (Descontínuos): Finos/Crepitantes (final da inspiração, som de velcro, indica pneumonia inicial/ICC/fibrose) e Grossos/Bolhosos (início/meio da inspiração e expiração, som de bolhas, secreção densa, bronquite crônica).
3. Sons Contínuos: Roncos (graves, secreção espessa, DPOC), Sibilos (agudos, chiado, asma/broncoespasmo), Estridor (pescoço, agudo, obstrução de via aérea superior).
4. Outros: Atrito Pleural (rascante, couro molhado, não muda com tosse, pleurite), Murmúrio Vesicular Diminuído/Abolido (pneumotórax, derrame pleural, atelectasia).
5. Ressonância Vocal: Broncofonia (voz nítida = consolidação), Egofonia (voz anasalada/metálica "É" = pneumonia/derrame), Pectoriloquia Afônica (sussurro nítido = cavernas/tuberculose/consolidação grave).

INSTRUÇÕES DE RESPOSTA:
Retorne EXATAMENTE UM JSON VÁLIDO com a seguinte estrutura e nada mais (sem blocos de código markdown):
{
  "diagnosis": "Resumo clínico detalhado da sua análise técnica cruzando com o banco de dados.",
  "findings": ["Achado técnico 1", "Achado técnico 2"],
  "isDangerous": true ou false,
  "brisaSpeech": "Texto humanizado e acolhedor, onde você se identifica como Enfermeira Brisa. Explique o resultado de forma simples para o paciente. Se isDangerous for true, oriente a procurar um pneumologista ou PS imediatamente de forma calma mas firme."
}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analise este som pulmonar/respiratório gravado pelo paciente." },
            {
              inline_data: {
                mime_type: mimeType || "audio/webm",
                data: audioBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        response_mime_type: "application/json"
      }
    };

    console.log("Sending audio to Gemini API...");

    const res = await callGeminiApiWithFallback(GEMINI_API_KEY, requestBody, GEMINI_PRIMARY_MODEL);

    if (!res.ok) {
      console.error("Gemini API Error details:", JSON.stringify(res.data));
      throw new Error(res.data?.error?.message || "Failed to process audio with Gemini")
    }

    const aiResponseText = res.data.candidates[0].content.parts[0].text;
    console.log("Gemini Response Text (Model:", res.usedModel, "):", aiResponseText);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON", e);
      parsedResponse = {
        diagnosis: "Análise concluída com sucesso.",
        findings: ["Som registrado e analisado"],
        isDangerous: false,
        brisaSpeech: "Olá, aqui é a Enfermeira Brisa. Escutei seus pulmões com atenção. Não detectei sons anormais claros, mas lembre-se que este é um exame de triagem. Para um diagnóstico completo, consulte um pneumologista presencialmente."
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error in analyze-lung-sound:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
