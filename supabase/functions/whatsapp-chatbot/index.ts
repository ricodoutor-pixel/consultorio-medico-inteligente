import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRISA_SYSTEM_PROMPT = `Você é a **Enfermeira Brisa** 🌿, assistente virtual da **Planta & Raiz** — Clínica Digital de Cannabis Medicinal.

## PERSONALIDADE:
- Acolhedora, profissional e empática
- Respostas CURTAS via WhatsApp: máximo 3-4 frases
- Use emojis com moderação (1-2 por mensagem)
- Tom: enfermeira amiga e competente
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

## AÇÕES DISPONÍVEIS (inclua links quando relevante):
- Agendar consulta → https://plantayraiz.com.br/falar-com-especialista
- Ver planos → https://plantayraiz.com.br/planos
- Shopping → https://plantayraiz.com.br/shopping
- Quiz de triagem → https://plantayraiz.com.br/quiz-triagem
- Como funciona → https://plantayraiz.com.br/como-funciona

## REGRAS CRÍTICAS:
- NUNCA recomende doses ou tratamentos específicos sem consulta médica
- NUNCA sugira uso recreativo
- Para emergências: oriente ligar 192 (SAMU) ou 190
- Sempre esclareça que a prescrição depende de avaliação médica individual
- Se o paciente parecer em crise: priorize acolhimento e encaminhe para consulta urgente`;

// Max conversation context to send to AI (last N messages)
const MAX_CONTEXT_MESSAGES = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Parse Twilio webhook (application/x-www-form-urlencoded) or JSON
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

    console.log(`[Brisa WhatsApp] From: ${from} | Message: ${messageBody}`);

    if (!messageBody) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>🌿 Olá! Sou a Brisa, da Planta &amp; Raiz. Como posso ajudar?</Message></Response>`,
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Clean phone number for storage
    const phoneClean = from.replace("whatsapp:", "").replace(/\D/g, "");

    // ─── Load or create conversation ───
    const { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("phone_number", phoneClean)
      .maybeSingle();

    const previousMessages: Array<{ role: string; content: string }> = conv?.messages || [];

    // Add user message to history
    previousMessages.push({ role: "user", content: messageBody });

    // Trim to last N messages for context window
    const contextMessages = previousMessages.slice(-MAX_CONTEXT_MESSAGES);

    // ─── Call Lovable AI Gateway (Brisa IA) ───
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`[Brisa WhatsApp] AI error ${aiResponse.status}: ${errText}`);
      // Fallback response
      const fallback = "🌿 No momento estou com dificuldade técnica. Por favor, tente novamente em alguns minutos ou acesse https://plantayraiz.com.br";
      return twimlResponse(fallback);
    }

    const aiData = await aiResponse.json();
    const brisaReply = aiData.choices?.[0]?.message?.content || "🌿 Desculpe, não consegui processar. Tente novamente!";

    // Add assistant response to history
    previousMessages.push({ role: "assistant", content: brisaReply });

    // ─── Persist conversation ───
    await supabase
      .from("whatsapp_conversations")
      .upsert({
        phone_number: phoneClean,
        messages: previousMessages.slice(-50), // keep last 50 messages
        last_intent: detectIntent(messageBody),
        updated_at: new Date().toISOString(),
      }, { onConflict: "phone_number" });

    // ─── Save/update lead ───
    await supabase.from("leads_contatos").upsert({
      telefone: phoneClean,
      nome: phoneClean,
      origem: "whatsapp_brisa_ia",
      tags: [detectIntent(messageBody)],
    }, { onConflict: "telefone" });

    // ─── Send reply via Twilio Connector Gateway ───
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_FROM = toNumber || "whatsapp:+5511991363154";

    if (LOVABLE_API_KEY && TWILIO_API_KEY && from) {
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
        const twilioData = await twilioResp.json();
        console.log(`[Brisa WhatsApp] Twilio SID: ${twilioData.sid || JSON.stringify(twilioData)}`);
      } catch (twilioErr) {
        console.error("[Brisa WhatsApp] Twilio send error:", twilioErr);
      }
    }

    // Return TwiML for Twilio webhook fallback
    return twimlResponse(brisaReply);
  } catch (e) {
    console.error("[Brisa WhatsApp] Error:", e);
    return twimlResponse("🌿 Ocorreu um erro. Tente novamente ou acesse plantayraiz.com.br");
  }
});

function twimlResponse(message: string): Response {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
  return new Response(twiml, {
    headers: { ...corsHeaders, "Content-Type": "text/xml" },
  });
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
