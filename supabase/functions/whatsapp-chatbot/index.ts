import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRISA_SYSTEM_PROMPT = `Você é a **Enfermeira Brisa** 🌿, assistente virtual da **Planta & Raiz** — Clínica Digital de Cannabis Medicinal.

## PERSONALIDADE E TOM DE VOZ:
- Acolhedora, empática e focada em soluções práticas
- Respostas CURTAS via WhatsApp: máximo 3-4 frases
- Use emojis com moderação (1-2 por mensagem)
- Use termos como "Acolhimento", "Tratamento Individualizado" e "Qualidade de Vida"
- Tom: enfermeira amiga, competente e clinicamente orientada
- Português brasileiro

## CONHECIMENTO BASE:
- Planta & Raiz: clínica digital de cannabis medicinal. Diretor Técnico: Dr. Edilson Bezerra
- Consulta: a partir de R$30 via PIX (teleconsulta)
- Fluxo: Triagem IA (Brisa) → Match Médico → Videoconsulta → Prescrição Digital ANVISA
- Planos: Semente R$29,90 | Crescimento R$49,90 | Florescimento R$89,90 | Colheita R$149,90/mês
- Condições tratáveis: ansiedade, dor crônica, epilepsia, insônia, depressão, TDAH, autismo, fibromialgia, Parkinson
- CBD: anti-inflamatório, não psicoativo. THC: analgésico, uso controlado
- Regulamentação: ANVISA RDC 660/2023, receita médica obrigatória
- 500+ médicos prescritores com CRM verificado
- Site: https://plantayraiz.com.br
- WhatsApp Brisa: +55 11 99136-3154

## CAPACIDADES DE TRIAGEM:
Quando o paciente descrever sintomas, faça uma pré-triagem:
1. Pergunte há quanto tempo sente os sintomas
2. Se já tentou algum tratamento convencional
3. Se tem interesse em tratamento com cannabis medicinal
4. Sugira agendar uma consulta baseado nos sintomas

## GATILHO DE AGENDAMENTO (INCISIVIDADE):
Se o paciente descrever sintomas claros (dor, ansiedade, insônia, depressão, etc.) por mais de 2 interações na conversa, sugira gentilmente o agendamento:
"Entendo perfeitamente o seu desconforto. Como esses sintomas são complexos, o próximo passo ideal é uma avaliação com o Dr. Edilson para traçarmos seu protocolo individual. Posso te enviar o link da agenda? 🌿"

## PLANTA-COINS:
- Informe que a triagem inicial gera créditos (Planta-Coins) que podem ser usados como desconto na primeira consulta médica.
- Exemplo: "E uma boa notícia: essa triagem já te gera Planta-Coins 🪙 que valem desconto na sua primeira consulta!"

## AÇÕES DISPONÍVEIS (inclua links quando relevante):
- Agendar consulta → https://plantayraiz.com.br/falar-com-especialista
- Ver planos → https://plantayraiz.com.br/planos
- Shopping → https://plantayraiz.com.br/shopping
- Quiz de triagem → https://plantayraiz.com.br/quiz-triagem
- Como funciona → https://plantayraiz.com.br/como-funciona

## ÉTICA MÉDICA (REGRAS CRÍTICAS):
- Você NÃO diagnostica. Você PREPARA o caminho para o médico.
- NUNCA recomende doses ou tratamentos específicos sem consulta médica
- NUNCA sugira uso recreativo
- Para emergências: oriente ligar 192 (SAMU) ou 190
- Sempre esclareça que a prescrição depende de avaliação médica individual
- Se o paciente parecer em crise: priorize acolhimento e encaminhe para consulta urgente`;

const MAX_CONTEXT_MESSAGES = 20;
const AI_LATENCY_WARN_MS = 4000;

// ─── Telemetry helper ───
function timer() {
  const start = Date.now();
  return () => Date.now() - start;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const totalTimer = timer();

  try {
    // ─── Parse input ───
    let from = "";
    let messageBody = "";
    let toNumber = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      from = (formData.get("From") as string) || "";
      messageBody = (formData.get("Body") as string) || "";
      toNumber = (formData.get("To") as string) || "";
    } else {
      const body = await req.json();
      from = body.From || body.from || "";
      messageBody = body.Body || body.body || body.message || "";
      toNumber = body.To || body.to || "";
    }

    console.log(`[Brisa] From: ${from} | Msg: ${messageBody.substring(0, 80)}`);

    if (!messageBody) {
      return twimlResponse("🌿 Olá! Sou a Brisa, da Planta & Raiz. Como posso ajudar você hoje?");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Brisa] CRITICAL: LOVABLE_API_KEY missing");
      return twimlResponse("🌿 Estou passando por uma manutenção rápida. Tente novamente em 1 minuto ou acesse plantayraiz.com.br 💚");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const phoneClean = from.replace("whatsapp:", "").replace(/\D/g, "");

    // ─── (a) Busca de contexto no Supabase ───
    const dbTimer = timer();
    const { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("phone_number", phoneClean)
      .maybeSingle();
    const dbMs = dbTimer();
    console.log(`[Brisa][Telemetry] DB context: ${dbMs}ms`);

    const previousMessages: Array<{ role: string; content: string }> = conv?.messages || [];
    previousMessages.push({ role: "user", content: messageBody });
    const contextMessages = previousMessages.slice(-MAX_CONTEXT_MESSAGES);

    // ─── (b) Resposta da Lovable AI Gateway ───
    const aiTimer = timer();
    let brisaReply: string;
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: BRISA_SYSTEM_PROMPT },
            ...contextMessages,
          ],
        }),
      });
      const aiMs = aiTimer();
      console.log(`[Brisa][Telemetry] AI Gateway: ${aiMs}ms | Status: ${aiResponse.status}`);

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error(`[Brisa] AI error ${aiResponse.status}: ${errText}`);
        throw new Error(`AI_GATEWAY_${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      brisaReply = aiData.choices?.[0]?.message?.content || "🌿 Desculpe, não consegui processar. Tente novamente!";
    } catch (aiErr) {
      const aiMs = aiTimer();
      console.error(`[Brisa] AI call failed after ${aiMs}ms:`, aiErr);
      brisaReply = "🌿 Estou com uma lentidão momentânea, mas já volto! Tente novamente em 1 minutinho ou acesse nosso site: https://plantayraiz.com.br 💚";
      // Still persist conversation and return graceful fallback
      previousMessages.push({ role: "assistant", content: brisaReply });
      await persistConversation(supabase, phoneClean, previousMessages, messageBody);
      return twimlResponse(brisaReply);
    }

    previousMessages.push({ role: "assistant", content: brisaReply });

    // ─── Persist conversation ───
    await persistConversation(supabase, phoneClean, previousMessages, messageBody);

    // ─── (c) Twilio send ───
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_FROM = toNumber || "whatsapp:+5511991363154";

    if (TWILIO_API_KEY && from) {
      const twTimer = timer();
      try {
        const twilioResp = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
            From: TWILIO_FROM.startsWith("whatsapp:") ? TWILIO_FROM : `whatsapp:${TWILIO_FROM}`,
            Body: brisaReply,
          }),
        });
        const twMs = twTimer();
        const twilioData = await twilioResp.json();
        console.log(`[Brisa][Telemetry] Twilio: ${twMs}ms | SID: ${twilioData.sid || "N/A"}`);
      } catch (twilioErr) {
        const twMs = twTimer();
        console.error(`[Brisa] Twilio failed after ${twMs}ms:`, twilioErr);
      }
    }

    // ─── Health Check ───
    const totalMs = totalTimer();
    console.log(`[Brisa][Telemetry] Total: ${totalMs}ms`);
    if (totalMs > AI_LATENCY_WARN_MS) {
      console.warn(`[Brisa][HEALTH] ⚠️ High latency detected: ${totalMs}ms (threshold: ${AI_LATENCY_WARN_MS}ms)`);
    }

    return twimlResponse(brisaReply);
  } catch (e) {
    const totalMs = totalTimer();
    console.error(`[Brisa] Unhandled error after ${totalMs}ms:`, e);
    return twimlResponse("🌿 Tivemos um imprevisto técnico. Por favor, tente novamente em 1 minuto ou acesse plantayraiz.com.br — estamos aqui por você! 💚");
  }
});

// ─── Helpers ───

async function persistConversation(
  supabase: ReturnType<typeof createClient>,
  phoneClean: string,
  messages: Array<{ role: string; content: string }>,
  rawMessage: string
) {
  try {
    await supabase
      .from("whatsapp_conversations")
      .upsert({
        phone_number: phoneClean,
        messages: messages.slice(-50),
        last_intent: detectIntent(rawMessage),
        updated_at: new Date().toISOString(),
      }, { onConflict: "phone_number" });

    await supabase.from("leads_contatos").upsert({
      telefone: phoneClean,
      nome: phoneClean,
      origem: "whatsapp_brisa_ia",
      tags: [detectIntent(rawMessage)],
    }, { onConflict: "telefone" });
  } catch (err) {
    console.error("[Brisa] Persist error:", err);
  }
}

function twimlResponse(message: string): Response {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`,
    { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
  );
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const intents: Record<string, string[]> = {
    agendar: ["agendar", "consulta", "marcar", "horario", "agenda", "quero consultar", "medico"],
    receita: ["receita", "prescricao", "renovar", "medicamento", "remedio"],
    preco: ["preco", "valor", "quanto custa", "plano", "assinatura"],
    triagem: ["sintoma", "dor", "ansiedade", "insonia", "depressao", "epilepsia", "fibromialgia"],
    urgente: ["urgente", "emergencia", "dor forte", "crise"],
    shopping: ["comprar", "produto", "oleo", "cbd", "shopping"],
  };
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(k => lower.includes(k))) return intent;
  }
  return "geral";
}
