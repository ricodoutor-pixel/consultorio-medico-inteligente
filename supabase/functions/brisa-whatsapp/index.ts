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
  if (lower.includes("paciente") || lower.includes("consulta") || lower.includes("triagem") || lower.includes("medico prescritor")) return "paciente";
  if (lower.includes("medico") || lower.includes("doutor") || lower.includes("profissional") || lower.includes("crm")) return "medico";
  if (lower.includes("lojista") || lower.includes("loja") || lower.includes("produto") || lower.includes("shopping")) return "lojista";
  if (lower.includes("ebook") || lower.includes("e-book") || lower.includes("material") || lower.includes("baixar")) return "ebook";
  return "default";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "Enf_Brisa";

    if (!LOVABLE_API_KEY || !EVO_URL || !EVO_KEY) {
      return new Response(JSON.stringify({ error: "Missing credentials" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse webhook body (Evolution sends JSON; tolerate URL-encoded too)
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

    // Detect visitor intent
    const intent = detectIntent(incomingText);

    let replyText: string;

    if (intent !== "default" && BRISA_WELCOME[intent]) {
      const welcome = BRISA_WELCOME[intent];
      replyText = `${welcome.message}\n\n👉 ${welcome.link}\n\nSe tiver dúvidas sobre a plataforma, estou aqui para ajudar! 💚`;
    } else {
      // Use AI for general questions
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Você é a Enfermeira Brisa, assistente virtual da Planta & Raiz — plataforma de telemedicina especializada em Cannabis Medicinal. 
Regras:
- Seja acolhedora, empática e profissional
- Máximo 300 caracteres na resposta  
- Use 1-2 emojis relevantes
- Sempre direcione para o site: ${SITE_BASE}
- Nunca dê diagnósticos ou prescrições
- Se perguntarem sobre consulta: direcione para ${SITE_BASE}/quiz-triagem
- Se perguntarem sobre preços: consultas a partir de R$ 30
- Se perguntarem sobre médicos: direcione para ${SITE_BASE}/profissionais
- Assine como "Enf. Brisa 🌿"`,
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
    const phoneClean = (from.replace(/\D/g, "") || "").replace(/^@.*$/, "");
    const evoResponse = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
      body: JSON.stringify({ number: phoneClean, text: replyText, delay: 1200 }),
    });

    const evoData = await evoResponse.json().catch(() => ({}));

    if (!evoResponse.ok) {
      console.error("[Brisa WhatsApp] Evolution send failed:", JSON.stringify(evoData));
    }

    // Log interaction
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("ai_events").insert({
      ai_name: "brisa_coo",
      event_type: "whatsapp_reply",
      status: twilioResponse.ok ? "completed" : "failed",
      input_data: { from, message: incomingText, intent, message_sid: messageSid },
      output_data: { reply: replyText, twilio_sid: twilioData?.sid },
    });

    // Respond to Twilio webhook with TwiML (empty to avoid double-send)
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { ...corsHeaders, "Content-Type": "text/xml" }, status: 200 }
    );
  } catch (e) {
    console.error("[Brisa WhatsApp] Error:", e);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { "Content-Type": "text/xml" }, status: 200 }
    );
  }
});
