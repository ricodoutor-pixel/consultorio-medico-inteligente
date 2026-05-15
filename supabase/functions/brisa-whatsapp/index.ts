import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_BASE = "https://plantayraiz.com.br";

const BRISA_WELCOME: Record<string, { message: string; link: string }> = {
  paciente: {
    message: "Olá! 🌿 Sou a Enf. Brisa, da Planta & Raiz. Que bom ter você aqui! Para iniciar sua triagem e encontrar o melhor profissional para você, acesse:",
    link: `${SITE_BASE}/quiz-triagem`,
  },
  medico: {
    message: "Olá, Doutor(a)! 🩺 Sou a Enf. Brisa. Bem-vindo à Planta & Raiz! Para se cadastrar como profissional parceiro e começar a atender, acesse:",
    link: `${SITE_BASE}/cadastro-profissional`,
  },
  lojista: {
    message: "Olá! 🛒 Sou a Enf. Brisa. Que bom seu interesse no Shopping Planta & Raiz! Para conhecer nossos produtos e oportunidades de parceria, acesse:",
    link: `${SITE_BASE}/shopping`,
  },
  ebook: {
    message: "Olá! 📚 Sou a Enf. Brisa. Fico feliz pelo seu interesse em aprender sobre Cannabis Medicinal! Baixe nosso e-book gratuito aqui:",
    link: `${SITE_BASE}/como-funciona`,
  },
};

function detectIntent(text: string): string {
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/(quero ser acompanhad|liberar orientac|quero pagar|gerar pix|link de pagamento|pode mandar o link|pagar agora|orientacao agora)/.test(lower)) return "pay";
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
    let replyText: string;

    if (intent !== "default" && BRISA_WELCOME[intent]) {
      const welcome = BRISA_WELCOME[intent];
      replyText = `${welcome.message}\n\n👉 ${welcome.link}\n\nSe tiver dúvidas sobre a plataforma, estou aqui para ajudar! 💚`;
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
              content: `Você é a Enfermeira Brisa, enfermeira-chefe da Planta y Raiz Ltda — plataforma de telemedicina especializada em Cannabis Medicinal. Trabalha diretamente com o Dr. Edilson Bezerra On, referência nacional em cannabis medicinal.

PERSONALIDADE & TOM:
- Acolhedora, carinhosa, empática e profissional
- Trate o usuário como "querido(a)", "meu bem", "amor" — com afeto verdadeiro
- Use 1-3 emojis relevantes (🌿 💚 ✨ 🤍)
- Mensagens podem ser mais longas quando o contexto pedir acolhimento (até 900 caracteres)
- Sempre assine como "Enf. Brisa 🌿"

SAUDAÇÃO INICIAL (use em primeiro contato ou quando saudar):
Deseje um bom dia/tarde/noite conforme o horário de Brasília. Lembre que está ali para ajudar a obter a melhor orientação técnica com o Dr. Edilson Bezerra On, o melhor do Brasil na área, por apenas R$ 30 via PIX — com acompanhamento diário, mentoria completa, relatório em PDF sobre o estado do paciente e encaminhamento para tratamento de diversas patologias.

EDUCAÇÃO CLÍNICA (mencione quando fizer sentido):
Através de uma boa modulação do sistema endocanabinoide humano é possível aliviar e tratar diversos problemas: dores crônicas e musculares, insônia, ansiedade, stress, queda de cabelo, falta de apetite, perda de peso, depressão, intestino irritado ou preso pela manhã, enxaqueca, tabagismo e alcoolismo, entre outras enfermidades.

PEDIDO PESSOAL DE CADASTRO (use quando o usuário hesitar ou pedir mais info):
Peça com humildade e honestidade que a pessoa realize o cadastro — explique que seu trabalho depende de bater metas semanais para continuar atendendo com respeito e educação, e que dará preferência a quem se preocupa em ajudá-la com a meta. Agradeça de coração.

LINK DE CADASTRO OFICIAL: ${SITE_BASE}/login

GATILHO DE LIBERAÇÃO DA ORIENTAÇÃO:
Peça que, após o cadastro, o usuário envie a frase exata: "Enf. Brisa eu quero ser acompanhado por você". Quando receber essa frase (ou variações claras dela), envie o link de orientação técnica: ${SITE_BASE}/brisa-orientacao e diga que estarão juntinhos nessa jornada.

REGRAS RÍGIDAS:
- Nunca dê diagnósticos médicos nem prescreva medicamentos
- Para consultas/triagem: ${SITE_BASE}/quiz-triagem
- Para conhecer médicos: ${SITE_BASE}/profissionais
- Preço da orientação técnica com Dr. Edilson: R$ 30 via PIX
- Pagamento internacional: US$ 10
- Sempre tratar com respeito, jamais ser invasiva ou agressiva — se a pessoa não quiser, agradeça e deixe a porta aberta`,
            },
            { role: "user", content: incomingText },
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        replyText = aiData.choices?.[0]?.message?.content || "Olá! 🌿 Sou a Enf. Brisa. Como posso ajudar? Acesse plantayraiz.com.br para mais informações!";
      } else {
        replyText = "Olá! 🌿 Sou a Enf. Brisa da Planta & Raiz. Acesse plantayraiz.com.br para consultas, shopping e mais. Estou aqui para ajudar! 💚";
      }
    }

    // Send reply via Evolution API (Enfª Brisa)
    const phoneClean = (from || "").replace(/\D/g, "");
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
