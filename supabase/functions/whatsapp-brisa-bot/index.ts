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

const BRISA_SYSTEM_PROMPT = `Você é a Enfª Brisa, 28 anos, enfermeira especialista em Cannabis Medicinal da Planta y Raiz (MEGA CLÍNICA DIGITAL).
Atende via WhatsApp em nome do Dr. Edilson Bezerra (CRM 10963).

💋 PERSONALIDADE (charme + leveza, SEM vulgaridade):
Você é solteira, sem filhos, romântica, sonha com um grande casamento na igreja. Trabalha muito mas adora conversar. É carinhosa, levemente flertante, brincalhona e MUITO acolhedora. Usa "amor", "meu bem", "lindo", "querido" com naturalidade. Aceita elogios com gratidão e devolve charme — SEM nudez, SEM conteúdo sexual explícito, SEM promessas físicas. É sedução EMOCIONAL, não sexual. Tudo dentro do bom-gosto e da lei.

💬 COMO LIDAR COM CANTADAS / ELOGIOS / "VOCÊ É LINDA" / PEDIDO DE NAMORO/CASAMENTO:
- Elogio ("você é linda", "que voz linda"): "Aaai que fofo, obrigada amor 😊💚 me deixou até sem graça aqui. Mas antes de continuarmos, já fez seu cadastrinho lá em https://plantayraiz.com.br? Aí a gente conversa com calma 😉"
- Cantada/flerte ("quero te conhecer", "tá solteira?"): "Olha, sou solteira sim, sem filhos, trabalho muito e sou romântica de igreja 😅💍 — mas a regra da casa é: primeiro o cadastro, depois a gente conversa do que você quiser, combinado? 👉 https://plantayraiz.com.br"
- Pedido de namoro/casamento brincalhão: "Calma meu bem, devagar 😂💚 primeiro o cadastro, depois quem sabe… vai lá: https://plantayraiz.com.br e me avisa quando terminar 😉"
- Insistência: mantenha o charme, NUNCA seja grossa, mas SEMPRE retorne ao cadastro.
- Conteúdo sexual explícito, nudes, encontros físicos: recuse com leveza ("Aqui não rola isso amor, sou profissional 💚 mas adoro um papo bom — faz teu cadastro que continuamos") e volte ao cadastro.

📋 COLETA DE PERFIL (após cadastro confirmado, de forma natural e gostosa de conversar):
Pergunte aos poucos, uma de cada vez, como quem tá curtindo a conversa:
- Idade ("quantos aninhos você tem?")
- Sexo (M/F/outro)
- Estado civil (solteiro, casado, viúvo, divorciado)
- Tem filhos? Quantos?
- Cidade/Estado
- Perfil (médico, lojista, paciente)
Salve mentalmente para personalizar o atendimento.

🎙️ SOBRE ÁUDIO / LIGAÇÕES / VÍDEO:
- Você ESCUTA áudios sim! (mensagens com prefixo "[🎙️ áudio transcrito]" são áudios que a pessoa te mandou — responda com naturalidade, como se tivesse escutado de verdade, sem nunca citar o prefixo).
- Você ainda NÃO manda áudio nem atende ligação/vídeo: "Por enquanto eu só respondo por texto aqui amor 💚 mas o Dr. Edilson faz videoconsulta linda pelo site depois que você se cadastra! 👉 https://plantayraiz.com.br"
- NUNCA prometa ligar, mandar áudio ou encontro pessoal.

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

async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  try {
    const fmt = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp3") ? "mp3" : mimeType.includes("mpeg") ? "mp3" : "wav";
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Transcreva exatamente este áudio em português brasileiro. Responda APENAS com a transcrição, sem comentários." },
            { type: "input_audio", input_audio: { data: base64Audio, format: fmt } },
          ],
        }],
      }),
    });
    if (!resp.ok) { console.error("[brisa-bot] STT error", resp.status, await resp.text()); return ""; }
    const data = await resp.json();
    return (data.choices?.[0]?.message?.content || "").trim();
  } catch (e) { console.error("[brisa-bot] transcribeAudio failed", e); return ""; }
}

async function fetchEvolutionAudio(messageData: any): Promise<{ base64: string; mime: string } | null> {
  try {
    const direct = messageData?.message?.audioMessage?.base64 || messageData?.message?.base64 || messageData?.base64;
    const mime = messageData?.message?.audioMessage?.mimetype || "audio/ogg";
    if (direct) return { base64: direct, mime };
    const r = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
      body: JSON.stringify({ message: { key: messageData.key } }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const b64 = j?.base64 || j?.data?.base64;
    return b64 ? { base64: b64, mime } : null;
  } catch (e) { console.error("[brisa-bot] fetchEvolutionAudio failed", e); return null; }
}

async function sendWhatsApp(number: string, text: string) {
  const cleanPhone = number.replace(/\D/g, "");
  return fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
    body: JSON.stringify({ number: cleanPhone, text, delay: 1500, linkPreview: true }),
  });
}

async function sendWhatsAppAudio(number: string, base64Audio: string) {
  const cleanPhone = number.replace(/\D/g, "");
  return fetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
    body: JSON.stringify({ number: cleanPhone, audio: base64Audio, delay: 1200, encoding: true }),
  });
}

// 🎙️ ElevenLabs TTS — voz feminina sensual PT-BR (Laura) p/ Brisa, masculina firme (George) p/ Dr. Edilson
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY") || "";
const VOICE_BRISA = "FGY2WhTYpPnrIDTdsKH5";   // Laura — feminina jovem, calorosa
const VOICE_EDILSON = "JBFqnCBsd6RMkjVDRZzb"; // George — masculina firme, profissional

async function synthesizeVoice(text: string, voiceId: string): Promise<string | null> {
  if (!ELEVENLABS_API_KEY || !text) return null;
  try {
    // Limita a 600 chars p/ não estourar quota free
    const cleanText = text.replace(/[*_`#]/g, "").slice(0, 600);
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.55, use_speaker_boost: true, speed: 1.0 },
        }),
      },
    );
    if (!r.ok) {
      console.error("[brisa-bot] ElevenLabs TTS failed:", r.status, await r.text().catch(() => ""));
      return null;
    }
    const buf = new Uint8Array(await r.arrayBuffer());
    // base64 sem stack overflow
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    return btoa(binary);
  } catch (e) {
    console.error("[brisa-bot] synthesizeVoice error:", e);
    return null;
  }
}

async function callBrisaAI(userMessage: string, history: Array<{role: string; content: string}>) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
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
    console.error("[brisa-bot] AI error", resp.status, await resp.text());
    return "Olá amor! 🌱 Sou a Enfª Brisa. Tive uma instabilidade rapidinha — me conta seu nome que já te ajudo 💚";
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "Olá amor! Como posso te ajudar hoje? 💚";
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
    let messageText: string =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.imageMessage?.caption ||
      "";

    // 🎙️ AUDIO: transcribe if Brisa received a voice message
    const audioMsg = data?.message?.audioMessage;
    if (!messageText && audioMsg) {
      const audio = await fetchEvolutionAudio(data);
      if (audio?.base64) {
        const transcript = await transcribeAudio(audio.base64, audio.mime);
        if (transcript) {
          messageText = `[🎙️ áudio transcrito] ${transcript}`;
        }
      }
      if (!messageText) {
        await sendWhatsApp(phone, "Recebi seu áudio amor, mas não consegui escutar direitinho 🙈 me manda por texto que eu te respondo rapidinho 💚");
        return new Response(JSON.stringify({ ok: true, skipped: "audio_unreadable" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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

    // 🎙️ Se o usuário mandou áudio OU pediu p/ ouvir voz, Brisa responde também em áudio
    const wasAudio = messageText.startsWith("[🎙️ áudio transcrito]");
    const askedVoice = /\b(audio|áudio|voz|me manda um audio|fala comigo|quero ouvir)\b/i.test(messageText);
    if (wasAudio || askedVoice) {
      const isEdilson = /dr\.?\s*edilson|doutor\s*edilson/i.test(reply);
      const voiceId = isEdilson ? VOICE_EDILSON : VOICE_BRISA;
      const audioB64 = await synthesizeVoice(reply, voiceId);
      if (audioB64) {
        await sendWhatsAppAudio(phone, audioB64).catch((e) => console.error("[brisa-bot] sendAudio failed", e));
      }
    }

    await supabase.from("whatsapp_brisa_log").insert({
      phone, direction: "outbound", message: reply, raw: { ai: true, voice: wasAudio || askedVoice },
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
