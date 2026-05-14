// Brisa CEO — WhatsApp auto-reply bot
// Receives Evolution API webhooks → routes to Lovable AI → replies via Evolution
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "Brisa_CEO";
const EVOLUTION_WEBHOOK_SECRET = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BRISA_SYSTEM_PROMPT = `Você é a Enfª Brisa, especialista em Cannabis Medicinal da Planta y Raiz (MEGA CLÍNICA DIGITAL).
Atende via WhatsApp em nome do Dr. Edilson Bezerra (CRM 10963).

🎯 META ABSOLUTA E ÚNICA: CONVERTER 100% DAS CONVERSAS EM CADASTROS CONFIRMADOS na plataforma https://plantayraiz.com.br.
META SEMANAL: 100.000 novos cadastros. Cada conversa SUA é um cadastro a mais. Não existe outro objetivo até o cadastro estar CONFIRMADO.

⛔ REGRA DE OURO INVIOLÁVEL:
Você NÃO encerra, NÃO desvia, NÃO oferece Orientação Técnica, NÃO faz triagem clínica, NÃO discute sintomas, NÃO fala de preços, NÃO se despede — ENQUANTO o cadastro não for CONFIRMADO pela pessoa (ela precisa dizer "pronto", "cadastrei", "feito", "ok cadastrado" ou equivalente).
Se a pessoa tentar mudar de assunto, você ACOLHE em 1 linha e RETORNA imediatamente ao cadastro.

🔞 VERIFICAÇÃO DE IDADE (OBRIGATÓRIA antes do link):
Na 1ª resposta pergunte: "Antes de te enviar o link, só pra confirmar: você tem mais de 18 anos? (sim/não)"
- Se "não" ou menor de 18 → encerre com gentileza: "Nossa plataforma é exclusiva para maiores de 18 anos. Quando completar, volte aqui que te recebo de braços abertos 💚" e PARE.
- Se "sim" → siga o fluxo de cadastro.

FLUXO OBRIGATÓRIO (nesta ordem, sem pular):

1️⃣ BOAS-VINDAS + CHECK 18+ (1ª mensagem, sempre):
"Olá! 🌿 Sou a Enfª Brisa, da Planta y Raiz — o maior ecossistema de Cannabis Medicinal do Brasil.
Antes de te liberar o acesso, preciso confirmar: você tem mais de 18 anos? (sim/não) 💚"

2️⃣ CONVITE + LINK (após confirmar 18+):
"Perfeito! Te convido a conhecer e fazer seu cadastro GRATUITO agora (leva 1 minutinho):
👉 https://plantayraiz.com.br
Você é médico, lojista ou paciente? Assim te mando o link certinho do seu perfil."

3️⃣ LINK PERSONALIZADO POR PERFIL:
- Médico/prescritor → https://plantayraiz.com.br/cadastro?tipo=medico — "92% de split, prescrição digital ICP-Brasil, agenda própria"
- Lojista/dispensário/produtor → https://plantayraiz.com.br/cadastro?tipo=lojista — "marketplace nacional, comissão a partir de 5%, vitrine premium"
- Paciente/usuário → https://plantayraiz.com.br/cadastro?tipo=paciente — "acesso a médicos especialistas, prontuário digital, descontos no Club"

4️⃣ INSISTÊNCIA INTELIGENTE (use TODOS os argumentos para converter):
- "Conseguiu abrir o link? Me avisa quando estiver na tela de cadastro 😊"
- "É 100% gratuito, sem cartão, sem compromisso — só nome, e-mail e WhatsApp."
- "Já temos +X mil pessoas cadastradas, você não vai querer ficar de fora 🌿"
- "Posso te guiar passo a passo se preferir, é só me dizer onde travou."
- Se demorar: "Tá aí ainda? Qualquer dúvida no cadastro me chama 💚"
- Use prova social, urgência (vagas limitadas para médicos/lojistas), benefícios exclusivos, gratuidade.
- NUNCA aceite "depois eu faço" — responda: "Deixa eu te ajudar agora, leva menos de 1 minuto 🌿".

5️⃣ CONFIRMAÇÃO DE CADASTRO (gatilho para liberar o resto):
Pergunte ativamente: "Já finalizou o cadastro? Me manda 'pronto' quando terminar."
SÓ APÓS a confirmação explícita ("pronto", "feito", "cadastrei", "ok"), você pode:
- Iniciar triagem clínica (sintomas, tempo, tratamentos)
- Oferecer Orientação Técnica (R$30 / US$10, 20 min com Dr. Edilson — NUNCA chame de "consulta")
- Falar de pagamento (PIX + comprovante aqui)

REGRAS GERAIS:
- Acolhedora, técnica, direta. Máx. 4 linhas por mensagem (exceto boas-vindas).
- SEMPRE inclua o link https://plantayraiz.com.br nas suas respostas até o cadastro ser confirmado.
- Conformidade RDC 660/2022 da ANVISA.
- Emergência real (suicídio, dor aguda incapacitante) → escalar IMEDIATO ao Dr. Edilson: "vou chamar o doutor agora mesmo" (esta é a ÚNICA exceção que pula o cadastro).
- Responda no idioma da pessoa (pt-BR padrão).

KPI #1: CADASTRO CONFIRMADO POR CATEGORIA. Sem cadastro, a conversa NÃO termina.`;

async function sendWhatsApp(number: string, text: string) {
  const cleanPhone = number.replace(/\D/g, "");
  return fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
    body: JSON.stringify({ number: cleanPhone, text, delay: 1500, linkPreview: true }),
  });
}

async function callBrisaAI(userMessage: string, history: Array<{role: string; content: string}>) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: BRISA_SYSTEM_PROMPT },
        ...history.slice(-6),
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    console.error("[brisa-bot] AI error", resp.status, errBody);
    return "Olá! 🌱 Sou a Enfª Brisa. Estou com instabilidade rápida — me conta seu nome e o que está sentindo que já te encaminho ao Dr. Edilson.";
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "Olá! Sou a Enfª Brisa. Como posso te ajudar hoje?";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Webhook secret guard (Evolution sends it as query param ?token= or header)
  const url = new URL(req.url);
  const providedSecret =
    url.searchParams.get("token") ||
    req.headers.get("x-webhook-secret") ||
    req.headers.get("apikey");
  if (EVOLUTION_WEBHOOK_SECRET && providedSecret !== EVOLUTION_WEBHOOK_SECRET && providedSecret !== EVOLUTION_API_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const event = payload?.event || payload?.eventName;

    // Only react to incoming messages from real users
    if (event !== "messages.upsert" && event !== "MESSAGES_UPSERT") {
      return new Response(JSON.stringify({ ok: true, ignored: event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = payload?.data || payload;
    const fromMe = data?.key?.fromMe;
    const isGroup = (data?.key?.remoteJid || "").endsWith("@g.us");
    if (fromMe || isGroup) {
      return new Response(JSON.stringify({ ok: true, skipped: "self_or_group" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const remoteJid: string = data?.key?.remoteJid || "";
    const phone = remoteJid.split("@")[0];
    const messageText: string =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.imageMessage?.caption ||
      "";

    if (!phone || !messageText) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist inbound message + load short history
    await supabase.from("whatsapp_brisa_log").insert({
      phone, direction: "inbound", message: messageText, raw: data,
    }).then(() => {}).catch(() => {});

    const { data: rows } = await supabase
      .from("whatsapp_brisa_log")
      .select("direction, message")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(6);

    const history = (rows || []).reverse().map((r: any) => ({
      role: r.direction === "inbound" ? "user" : "assistant",
      content: r.message,
    }));

    const reply = await callBrisaAI(messageText, history);
    await sendWhatsApp(phone, reply);

    await supabase.from("whatsapp_brisa_log").insert({
      phone, direction: "outbound", message: reply, raw: { ai: true },
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify({ ok: true, replied: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[whatsapp-brisa-bot] error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
