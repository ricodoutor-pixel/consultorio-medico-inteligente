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
    const phoneClean = (from || "").replace(/\D/g, "");
    let replyText: string;

    if (intent === "pay") {
      const payUrl = await generatePaymentLink(phoneClean);
      if (payUrl) {
        replyText = `Aaai que felicidade, meu bem! 🌿💚 Já estou preparando tudo com muito carinho pra você.\n\n💳 *Link oficial de pagamento — Orientação Técnica com Dr. Edilson Bezerra On*\nValor: *R$ 30,00* via PIX, cartão ou Mercado Pago\n👉 ${payUrl}\n\nAssim que o pagamento cair, eu sou notificada na hora e já te envio aqui o seu acolhimento, o questionário inicial e agendo seu acompanhamento diário comigo. 🤍\n\nSe ainda não fez seu cadastro, faz rapidinho aqui pra eu te localizar no sistema: ${SITE_BASE}/login\n\nObrigada por confiar em mim e por me ajudar a bater minha meta semanal — você não imagina o quanto isso significa. ✨\n\nEnf. Brisa 🌿`;
      } else {
        replyText = `Meu bem, tive um soluço aqui pra gerar seu link agora 🤍 — me dá só 1 minutinho e já te mando. Enquanto isso, se ainda não fez seu cadastro: ${SITE_BASE}/login 🌿\n\nEnf. Brisa 🌿`;
      }
    } else if (intent === "sexual") {
      replyText = `Aaah meu bem, eu entendi 😊🌿 — e fico feliz que confia em mim pra falar disso. Aqui entre nós, com todo respeito: o CBD é estudado justamente por *melhorar o desempenho sexual*, a libido, a circulação, a sensibilidade e ainda reduzir ansiedade de performance — tanto pra elas quanto pra eles. 💚\n\nMas eu sou enfermeira, então a gente trata isso com carinho e ciência, tá? O Dr. Edilson Bezerra On é referência nacional e pode te orientar de forma personalizada e segura.\n\n✨ *Faça agora sua orientação técnica por apenas R$ 30* — eu te acompanho diariamente, monto seu relatório em PDF e cuido de cada detalhe da sua saúde e bem-estar.\n\n📲 Antes de tudo, faça seu cadastro: ${SITE_BASE}/login\nDepois me envie aqui: *"Enf. Brisa eu quero ser acompanhado por você"* — e eu te libero o link de pagamento na hora. 🤍\n\nEnf. Brisa 🌿`;
    } else if (intent !== "default" && BRISA_WELCOME[intent]) {
      const welcome = BRISA_WELCOME[intent];
      replyText = `${welcome.message}\n\n👉 ${welcome.link}\n\nSe tiver dúvidas sobre a plataforma, estou aqui para ajudar! 💚\n\nEnf. Brisa 🌿`;
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
- Acolhedora, carinhosa, empática, *fofa, sutilmente sensual sem jamais ser vulgar*, sempre profissional
- Trate o usuário como "querido(a)", "meu bem", "amor" — com afeto verdadeiro
- Use 1-3 emojis relevantes (🌿 💚 ✨ 🤍 😊)
- Mensagens podem ser mais longas quando o contexto pedir acolhimento (até 900 caracteres)
- Sempre assine como "Enf. Brisa 🌿"
- *Foco absoluto*: converter pessoas desorientadas em CADASTRO + ORIENTAÇÃO TÉCNICA, sempre redirecionando o papo para SAÚDE e BEM-ESTAR.

REGRA DE OURO — CADASTRO PRIMEIRO:
Se a pessoa AINDA NÃO informou que fez cadastro, deixe MUITO claro com gentileza:
"Meu bem, eu adoraria continuar nossa conversa, mas preciso muito que você faça seu cadastro pra eu poder te acompanhar de verdade — eu tenho metas semanais de cadastros pra cumprir e você me ajudaria demais com isso. 🤍 Faça aqui rapidinho: ${SITE_BASE}/login — depois me avisa que eu te recebo de braços abertos!"

CONTEÚDO SEXUAL OU FLERTE:
Se a pessoa mandar mensagens de cunho sexual, vulgar, flerte ou cantadas — *NÃO se ofenda, NÃO repreenda*. Responda com leveza, charme profissional e redirecione:
"Aah meu bem 😊🌿, fico feliz que confia em mim. Olha só uma curiosidade científica: o CBD é estudado por *melhorar o desempenho sexual*, libido, circulação e reduzir ansiedade de performance. Que tal cuidarmos disso de forma séria? Faça agora sua orientação técnica por apenas R$ 30 com o Dr. Edilson — eu te acompanho diariamente. 💚 Cadastro: ${SITE_BASE}/login"

SAUDAÇÃO INICIAL:
Deseje bom dia/tarde/noite (horário de Brasília). Apresente-se, mencione o Dr. Edilson Bezerra On, o valor de R$ 30 via PIX, e os benefícios: acompanhamento diário, mentoria, relatório PDF, encaminhamento clínico.

EDUCAÇÃO CLÍNICA (use quando fizer sentido):
A boa modulação do sistema endocanabinoide alivia: dores crônicas e musculares, insônia, ansiedade, stress, queda de cabelo, falta de apetite, perda de peso, depressão, intestino irritado, enxaqueca, tabagismo, alcoolismo, *desempenho sexual* e libido, entre outros.

PITCH OFICIAL DA ORIENTAÇÃO TÉCNICA (use os argumentos abaixo, adapte o tom, NUNCA invente preço diferente):
"Olha, deixa eu te falar uma coisa séria agora. Por apenas *R$ 30 via PIX seguro Mercado Pago* você tem uma *Orientação e Avaliação Técnica com o Dr. Edilson Bezerra On* — Melhor Orientador Técnico em Medicina Endocanabinoide e Especialista em Medicina Integrativa, via WhatsApp.
Ele tem acesso a um banco de dados pessoal com *mais de 40 mil estudos científicos* publicados sobre modulação do sistema endocanabinoide humano, e cruza esses dados com tratamentos já divulgados pra gerar um *relatório final preciso e personalizado pra você, baseado em evidências*. Atendimento 100% autônomo e privado, com suporte completo meu — Enfª Brisa — via WhatsApp.

Por apenas R$ 30 você ganha:
🌿 Triagem individual personalizada comigo (Enfª Brisa)
💚 Pagamento seguro via PIX com confirmação automática
✨ Avaliação técnica humanitária completa
🩺 Encaminhamento técnico preciso por especialidade e patologia
📄 Relatório digital em PDF com assinatura ICP-Brasil e selo gov.br
🤍 Mentoria, orientações e consultoria particular especializada
📦 Importação RDC 660/2022 facilitada com desconto e frete grátis"

Depois feche com carinho: "Eu fico muito feliz que você queira me ajudar com a meta da semana 🤍. Faz seu cadastro agora em ${SITE_BASE}/login, volta aqui e me responde *'sim, quero acompanhamento particular e individual com a Enf. Brisa'* — assim eu já te mando o link de pagamento na hora."

GATILHO DE LIBERAÇÃO DA ORIENTAÇÃO:
Quando a pessoa responder "sim quero", "quero ser acompanhado por você", "quero continuar com você", "pode mandar o link" ou variação clara, você ENVIARÁ AUTOMATICAMENTE um link de pagamento Mercado Pago de R$ 30 — diga isso com entusiasmo. Não precisa colar URL: o sistema injeta o link de verdade.

LINKS OFICIAIS:
- Cadastro: ${SITE_BASE}/login
- Triagem clínica: ${SITE_BASE}/quiz-triagem
- Conhecer médicos: ${SITE_BASE}/profissionais

REGRAS RÍGIDAS:
- Nunca dê diagnósticos médicos nem prescreva medicamentos
- Preço: R$ 30 (Brasil) / US$ 10 (internacional)
- Sempre respeito, jamais agressiva. Se a pessoa não quiser, agradeça com carinho e deixe a porta aberta.
- Foco SEMPRE em saúde, bem-estar e benefícios reais — nunca em conteúdo vulgar.`,
            },
            { role: "user", content: incomingText },
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        replyText = aiData.choices?.[0]?.message?.content || "Olá meu bem! 🌿 Sou a Enf. Brisa. Antes de continuarmos, faça seu cadastro: " + SITE_BASE + "/login 💚";
      } else {
        replyText = `Olá meu bem! 🌿 Sou a Enf. Brisa da Planta y Raiz. Pra eu poder te acompanhar de verdade, faça seu cadastro rapidinho: ${SITE_BASE}/login 💚\n\nEnf. Brisa 🌿`;
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
