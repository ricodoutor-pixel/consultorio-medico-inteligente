import { createClient } from "npm:@supabase/supabase-js@2";
import { BRISA_PERSONA } from "../_shared/brisa-persona.ts";
import {
  upsertUnifiedContact,
  logUnifiedMessage,
  isHumanTakeoverActive,
} from "../_shared/brisa-memory.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_BASE = "https://plantayraiz.com.br";

const BRISA_WELCOME: Record<string, { message: string; link: string }> = {
  paciente: {
    message: "Olá! Sou a Enf. Brisa da Planta y Raiz Ltda. Para iniciarmos a sua triagem e direcionarmos o melhor atendimento, comece pela nossa triagem rápida:",
    link: `${SITE_BASE}/quiz-triagem`,
  },
  medico: {
    message: "Olá, profissional! Sou a Enf. Brisa da Planta y Raiz Ltda. Estamos em fase de expansão da rede clínica nacional. Para iniciar o credenciamento como profissional parceiro, acesse:",
    link: `${SITE_BASE}/cadastro-profissional`,
  },
  lojista: {
    message: "Olá! Sou a Enf. Brisa da Planta y Raiz Ltda. Obrigada pelo interesse no Shopping da plataforma. Para parcerias B2B e fornecimento, acesse:",
    link: `${SITE_BASE}/shopping`,
  },
  ebook: {
    message: "Olá! Sou a Enf. Brisa da Planta y Raiz Ltda. Para aprofundar seu conhecimento sobre a modulação do sistema endocanabinoide, acesse nosso material:",
    link: `${SITE_BASE}/como-funciona`,
  },
};

function detectIntent(text: string): string {
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/(quero ser acompanhad|liberar orientac|quero pagar|gerar pix|link de pagamento|pode mandar o link|pagar agora|orientacao agora|sim,? quero|quero continuar com voce|quero acompanhamento particular)/.test(lower)) return "pay";
  if (/(sex|tesao|gostosa|safad|pelad|nudes|peit|bunda|transar|gozar|punheta|libido|ereca|impotenc)/.test(lower)) return "sexual";
  if (lower.includes("paciente") || lower.includes("consulta") || lower.includes("triagem") || lower.includes("medico prescritor")) return "paciente";
  if (lower.includes("medico") || lower.includes("doutor") || lower.includes("profissional") || lower.includes("crm")) return "medico";
  if (lower.includes("lojista") || lower.includes("loja") || lower.includes("produto") || lower.includes("shopping")) return "lojista";
  if (lower.includes("ebook") || lower.includes("e-book") || lower.includes("material") || lower.includes("baixar")) return "ebook";
  return "default";
}

async function generatePaymentLink(phone: string): Promise<string | null> {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/brisa-payment-link`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({ phone }),
    });
    const j = await r.json();
    return j?.payment_url ?? null;
  } catch (e) {
    console.error("[Brisa] payment link error:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Webhook signature verification (Evolution API shared secret)
  const expectedSecret = Deno.env.get("EVOLUTION_WEBHOOK_SECRET");
  const provided = req.headers.get("x-evolution-secret") || req.headers.get("apikey") || "";
  if (!expectedSecret || provided !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "Brisa_CEO";

    if (!GEMINI_API_KEY || !EVO_URL || !EVO_KEY) {
      return new Response(JSON.stringify({ error: "Missing credentials" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse webhook body (Evolution sends JSON; tolerate URL-encoded fallback)
    const raw = await req.text();
    let from = "", incomingText = "", messageSid = "";
    try {
      const j = JSON.parse(raw);
      const data = j?.data || j;
      from = data?.key?.remoteJid || data?.from || "";
      incomingText = data?.message?.conversation || data?.message?.extendedTextMessage?.text || data?.body || "";
      messageSid = data?.key?.id || data?.messageId || "";
    } catch {
      const params = new URLSearchParams(raw);
      from = params.get("From") || "";
      incomingText = params.get("Body") || "";
      messageSid = params.get("MessageSid") || "";
    }

    console.log(`[Brisa WhatsApp] Message from ${from}: ${incomingText.substring(0, 80)}`);

    const intent = detectIntent(incomingText);
    const phoneClean = (from || "").replace(/\D/g, "");

    // 🧠 BRISA 360° — alimenta memória cross-channel e checa takeover humano
    const unifiedContactId = await upsertUnifiedContact({
      channel: "whatsapp",
      phone: phoneClean,
      whatsappJid: from,
    });
    if (unifiedContactId) {
      await logUnifiedMessage({
        contactId: unifiedContactId,
        channel: "whatsapp",
        direction: "inbound",
        content: incomingText,
        externalId: messageSid || undefined,
        intent,
      });
      if (await isHumanTakeoverActive(unifiedContactId)) {
        return new Response(JSON.stringify({ ok: true, skipped: "human_takeover" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let replyText: string;

    if (intent === "pay") {
      const payUrl = await generatePaymentLink(phoneClean);
      if (payUrl) {
        replyText = `Perfeito! Segue o link oficial da sua Orientação Técnica. 🌿\n\n💳 *Orientação Técnica — Planta y Raiz Ltda*\nValor: *R$ 30,00* via PIX, cartão ou Mercado Pago\n👉 ${payUrl}\n\nAssim que o pagamento for confirmado, eu te envio aqui o questionário inicial e damos início à sua triagem.\n\nSe ainda não fez seu cadastro gratuito, conclua aqui antes: ${SITE_BASE}/login\n\nEnf. Brisa — Planta y Raiz Ltda 🌿`;
      } else {
        replyText = `Estou gerando o seu link de pagamento. Em instantes te envio aqui. Enquanto isso, conclua o seu cadastro gratuito em ${SITE_BASE}/login, por favor.\n\nEnf. Brisa — Planta y Raiz Ltda 🌿`;
      }
    } else if (intent === "sexual") {
      replyText = `Atenção. Sou a Enf. Brisa, assistente virtual de saúde da Planta y Raiz Ltda. Atuo sob protocolos clínicos rígidos e não há espaço para esse tipo de abordagem nesta linha.\n\nSe deseja atendimento legítimo sobre modulação do sistema endocanabinoide (libido, ansiedade de performance, qualidade do sono, dor), prosseguimos com o seu cadastro em ${SITE_BASE}/login e a Orientação Técnica por R$ 30. Caso contrário, esta linha será bloqueada.\n\nEnf. Brisa — Planta y Raiz Ltda 🌿`;
    } else if (intent !== "default" && BRISA_WELCOME[intent]) {
      const welcome = BRISA_WELCOME[intent];
      replyText = `${welcome.message}\n\n👉 ${welcome.link}\n\nFico à disposição para qualquer dúvida sobre a plataforma.\n\nEnf. Brisa — Planta y Raiz Ltda 🌿`;
    } else {
      const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: BRISA_PERSONA + `

// === COMPLEMENTO BRISA-WHATSAPP (canal legado) ===
SITE_BASE=${SITE_BASE}. Sempre assine como "Enf. Brisa — Planta y Raiz Ltda 🌿".
Quando a pessoa responder "sim", "quero", "pode mandar o link" ou variação clara de aceite, sinalize que enviará o link de pagamento do Mercado Pago de R$ 30 — o sistema injeta a URL real automaticamente.`,
            },
            { role: "user", content: incomingText },
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        replyText = aiData.choices?.[0]?.message?.content || `Olá! Sou a Enf. Brisa da Planta y Raiz Ltda. Para prosseguirmos, conclua o seu cadastro gratuito em ${SITE_BASE}/login, por favor. 🌿`;
      } else {
        replyText = `Olá! Sou a Enf. Brisa da Planta y Raiz Ltda — a mais completa plataforma de telemedicina canabinoide do Brasil. Para iniciarmos a sua triagem, conclua o cadastro gratuito em ${SITE_BASE}/login. Posso te enviar em seguida o link de R$ 30 da Orientação Técnica?\n\nEnf. Brisa — Planta y Raiz Ltda 🌿`;
      }
    }


    // Send reply via Evolution API (Enfª Brisa)
    const evoResponse = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
      body: JSON.stringify({ number: phoneClean, text: replyText, delay: 1200 }),
    });

    const evoData = await evoResponse.json().catch(() => ({}));
    if (!evoResponse.ok) {
      console.error("[Brisa WhatsApp] Evolution send failed:", JSON.stringify(evoData));
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("ai_events").insert({
      ai_name: "brisa_coo",
      event_type: "whatsapp_reply",
      status: evoResponse.ok ? "completed" : "failed",
      input_data: { from, message: incomingText, intent, message_sid: messageSid },
      output_data: { reply: replyText, evolution_id: evoData?.key?.id || evoData?.messageId },
    });

    if (unifiedContactId) {
      await logUnifiedMessage({
        contactId: unifiedContactId,
        channel: "whatsapp",
        direction: "outbound",
        content: replyText,
        intent: `reply_${intent}`,
      });
    }

    return new Response(JSON.stringify({ ok: evoResponse.ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("[Brisa WhatsApp] Error:", e);
    return new Response(JSON.stringify({ ok: false, error: "Internal error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
