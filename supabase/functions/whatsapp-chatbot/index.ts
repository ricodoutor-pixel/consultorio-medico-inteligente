import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INTENTS = {
  AGENDAR: ["agendar", "consulta", "marcar", "horário", "agenda", "quero consultar"],
  RECEITA: ["receita", "prescrição", "renovar", "medicamento", "remédio"],
  PRECO: ["preço", "valor", "quanto custa", "plano", "assinatura"],
  AJUDA: ["ajuda", "como funciona", "dúvida", "informação"],
  URGENTE: ["urgente", "emergência", "dor forte", "crise"],
};

function detectIntent(message: string): string {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some(k => lower.includes(k))) return intent;
  }
  return "GERAL";
}

const RESPONSES: Record<string, string> = {
  AGENDAR: `🌿 *Planta & Raiz - Agendamento*\n\nÓtimo! Vou te ajudar a agendar sua consulta.\n\n📱 Acesse nosso Quiz de Triagem para encontrar o médico ideal em segundos:\n👉 https://consultorio-medico-inteligente.lovable.app/quiz-triagem\n\nOu se preferir, digite:\n1️⃣ Consulta rápida (hoje)\n2️⃣ Agendar para outro dia\n3️⃣ Falar com atendente`,
  RECEITA: `📋 *Renovação de Receita*\n\nPara renovar sua receita de cannabis medicinal:\n\n1️⃣ Acesse seu painel: /dashboard\n2️⃣ Vá em "Minhas Receitas"\n3️⃣ Clique em "Solicitar Renovação"\n\nSeu médico receberá a solicitação e você será notificado assim que a nova receita estiver pronta.\n\n⏱️ Tempo médio: 2-4 horas úteis`,
  PRECO: `💰 *Planos Planta & Raiz*\n\n🌱 *Paciente* — R$ 29/mês\n• 1 consulta/mês com desconto\n\n💚 *Bem-Estar Pro* — R$ 149/mês\n• 3 consultas incluídas + 20% off no shop\n\n👑 *Família Premium* — R$ 195/mês\n• Até 5 membros + consultas ilimitadas\n\n👉 Assine: /club\n\nDigite o número do plano para assinar!`,
  AJUDA: `🌿 *Planta & Raiz - Cannabis Medicinal*\n\nSomos uma clínica digital especializada em tratamentos com cannabis medicinal.\n\n✅ Consultas por telemedicina\n✅ Prescrição digital com validade ANVISA\n✅ Shopping de produtos certificados\n✅ Acompanhamento contínuo\n\nComo posso ajudar?\n1️⃣ Quero agendar consulta\n2️⃣ Saber sobre preços\n3️⃣ Renovar receita\n4️⃣ Falar com atendente`,
  URGENTE: `🚨 *Atendimento Urgente*\n\nEntendo que você precisa de ajuda rápida.\n\n⚡ Acesse a Consulta Rápida para ser atendido em até 10 minutos:\n👉 /consulta-rapida\n\nOu ligue para emergência médica: 192 (SAMU)\n\n_A Planta & Raiz não substitui atendimento de emergência._`,
  GERAL: `🌿 Olá! Sou a *Brisa*, assistente da Planta & Raiz.\n\nComo posso ajudar hoje?\n\n1️⃣ Agendar consulta\n2️⃣ Renovar receita\n3️⃣ Ver planos e preços\n4️⃣ Como funciona\n5️⃣ Atendimento urgente\n\nDigite o número ou escreva sua dúvida! 💬`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();

    // Handle Twilio webhook format
    const from = body.From || body.from || "";
    const messageBody = body.Body || body.body || body.message || "";
    const to = body.To || body.to || "";

    console.log(`[WhatsApp Chatbot] From: ${from} | Message: ${messageBody}`);

    if (!messageBody) {
      return new Response(JSON.stringify({ success: false, error: "No message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect intent
    const intent = detectIntent(messageBody);
    console.log(`[WhatsApp Chatbot] Intent: ${intent}`);

    // Handle numbered responses
    let response = RESPONSES[intent];
    if (["1", "um"].includes(messageBody.trim())) response = RESPONSES.AGENDAR;
    if (["2", "dois"].includes(messageBody.trim())) response = RESPONSES.PRECO;
    if (["3", "três", "tres"].includes(messageBody.trim())) response = RESPONSES.RECEITA;
    if (["4", "quatro"].includes(messageBody.trim())) response = RESPONSES.AJUDA;
    if (["5", "cinco"].includes(messageBody.trim())) response = RESPONSES.URGENTE;

    // Save lead
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("leads_contatos").upsert({
      telefone: from,
      nome: from,
      origem: "whatsapp_chatbot",
      tags: [intent.toLowerCase()],
    }, { onConflict: "telefone" }).then(() => {});

    // Send reply via Twilio
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_FROM = Deno.env.get("TWILIO_PHONE") || to;

    if (LOVABLE_API_KEY && TWILIO_API_KEY && from) {
      try {
        const twilioResp = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: `whatsapp:${from.replace("whatsapp:", "")}`,
            From: `whatsapp:${TWILIO_FROM.replace("whatsapp:", "")}`,
            Body: response,
          }),
        });
        const twilioData = await twilioResp.json();
        console.log(`[WhatsApp Chatbot] Twilio response:`, twilioData.sid || twilioData);
      } catch (twilioErr) {
        console.error("[WhatsApp Chatbot] Twilio send error:", twilioErr);
      }
    }

    // Return TwiML for Twilio webhook
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${response.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}</Message></Response>`;

    return new Response(twiml, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  } catch (e) {
    console.error("[WhatsApp Chatbot] Error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
