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
// 🔑 Lovable AI Gateway — usa LOVABLE_API_KEY já configurada (sem chave externa).
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const BRISA_MODEL = "google/gemini-2.5-flash";
const BRISA_LITE_MODEL = "google/gemini-2.5-flash-lite";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

import {
  BRISA_PERSONA,
  BRISA_WELCOME_MESSAGE,
  BRISA_HARASSMENT_BLOCK,
  BRISA_FALLBACK_MESSAGE,
  containsHarassment,
  isFirstContactOrStale,
} from "../_shared/brisa-persona.ts";
import {
  upsertUnifiedContact,
  logUnifiedMessage,
  isHumanTakeoverActive,
} from "../_shared/brisa-memory.ts";

async function logGrowth(action: string, phase: string, state: Record<string, unknown>) {
  try {
    await supabase.from("manus_growth_logs").insert({
      phase,
      action,
      after_state: state,
      status: "ok",
    });
  } catch (e) {
    console.error("[brisa-bot] manus_growth_logs insert failed", e);
  }
}

const BRISA_WHATSAPP_SUFFIX = `

// === COMPLEMENTO WHATSAPP (canal Evolution) ===
- Mensagens CURTAS (2-4 frases máximo), tom de WhatsApp corporativo.
- Verificação 18+ obrigatória antes de enviar link de pagamento: "Antes do link, confirme por favor: você tem mais de 18 anos? (sim/não)" — se "não", encerre cordialmente.
- Áudios recebidos chegam com prefixo "[🎙️ áudio transcrito]" — responda como se tivesse escutado, sem citar o prefixo.
- Pode responder em áudio (TTS) quando o paciente enviar áudio ou pedir explicitamente.
- Atendimento por vídeo: apenas dentro da plataforma após o cadastro e pagamento da Orientação Técnica.
`;

const BRISA_STATIC_PROMPT = BRISA_PERSONA + BRISA_WHATSAPP_SUFFIX;

// 🎛️ Prompt dinâmico — consulta system_settings (cache 60s)
let _promptCache: { value: string; at: number } = { value: BRISA_STATIC_PROMPT, at: 0 };
async function getBrisaSystemPrompt(): Promise<string> {
  const now = Date.now();
  if (now - _promptCache.at < 60_000) return _promptCache.value;
  try {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "brisa_system_prompt")
      .maybeSingle();
    const override = (data?.value as any)?.prompt;
    const pricing = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "brisa_pricing")
      .maybeSingle();
    const p = (pricing.data?.value as any) || {};
    const pricingLine = `\n[PREÇOS ATUAIS] Orientação Técnica: R$ ${p.orientacao_tecnica_brl ?? 30} (BR) / US$ ${p.orientacao_tecnica_usd ?? 10} (intl).`;
    const base = (override && typeof override === "string" && override.trim().length > 50)
      ? override + BRISA_WHATSAPP_SUFFIX
      : BRISA_STATIC_PROMPT;
    _promptCache = { value: base + pricingLine, at: now };
  } catch (e) {
    console.error("[brisa-bot] getBrisaSystemPrompt failed", e);
    _promptCache = { value: BRISA_STATIC_PROMPT, at: now };
  }
  return _promptCache.value;
}

async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  if (!LOVABLE_API_KEY) return "";
  try {
    const fmt = mimeType.includes("mp3") || mimeType.includes("mpeg") ? "mp3" : "wav";
    const resp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: BRISA_MODEL,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Transcreva exatamente este áudio em português brasileiro. Responda APENAS com a transcrição, sem comentários." },
            { type: "input_audio", input_audio: { data: base64Audio, format: fmt } },
          ],
        }],
      }),
    });
    if (!resp.ok) { console.error("[brisa-bot] STT error", resp.status, await resp.text().catch(() => "")); return ""; }
    const data = await resp.json();
    return (data?.choices?.[0]?.message?.content || "").trim();
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
    body: JSON.stringify({ number: cleanPhone, text, delay: 1500, linkPreview: false }),
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

async function classifySentiment(text: string): Promise<{ sentiment_score: number; is_negative: boolean }> {
  if (!LOVABLE_API_KEY) return { sentiment_score: 0.5, is_negative: false };
  try {
    const resp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: BRISA_LITE_MODEL,
        messages: [
          { role: "system", content: "Você classifica sentimento de mensagens em pt-BR. score: 0 (muito negativo, raivoso, sofrimento, suicídio, frustração extrema) a 1 (muito positivo). is_negative=true se score<0.4 ou houver hostilidade/sofrimento. Responda APENAS JSON: {\"score\":number,\"is_negative\":boolean}" },
          { role: "user", content: text.slice(0, 2000) },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      console.error("[brisa-bot] sentiment error", resp.status);
      return { sentiment_score: 0.5, is_negative: false };
    }
    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const score = Math.max(0, Math.min(1, Number(parsed.score) || 0.5));
    return { sentiment_score: score, is_negative: Boolean(parsed.is_negative) || score < 0.4 };
  } catch (e) {
    console.error("[brisa-bot] classifySentiment failed", e);
    return { sentiment_score: 0.5, is_negative: false };
  }
}

async function callBrisaAI(userMessage: string, history: Array<{role: string; content: string}>) {
  if (!LOVABLE_API_KEY) {
    console.error("[brisa-bot] LOVABLE_API_KEY ausente — usando fallback");
    return BRISA_FALLBACK_MESSAGE;
  }
  const systemPrompt = await getBrisaSystemPrompt();
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map((h) => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content,
    })),
    { role: "user", content: userMessage },
  ];
  const resp = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: BRISA_MODEL, messages }),
  });
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "");
    console.error("[brisa-bot] AI error", resp.status, errBody);
    if (resp.status === 429) return "Muita gente conversando comigo agora 🌿 Pode me chamar de novo em 1 minutinho?";
    if (resp.status === 402) return "Tive uma instabilidade técnica momentânea. Pode me chamar novamente em alguns minutos? 🌿";
    return BRISA_FALLBACK_MESSAGE;
  }
  const data = await resp.json();
  return (data?.choices?.[0]?.message?.content || BRISA_FALLBACK_MESSAGE).trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Webhook secret guard (Evolution sends it as query param ?token= or header)
  const url = new URL(req.url);
  const providedSecret =
    url.searchParams.get("token") ||
    req.headers.get("x-webhook-secret") ||
    req.headers.get("apikey");
  if (!EVOLUTION_WEBHOOK_SECRET || (providedSecret !== EVOLUTION_WEBHOOK_SECRET && providedSecret !== EVOLUTION_API_KEY)) {
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

    // 🔒 IDEMPOTÊNCIA — descarta reprocessamentos do mesmo message id (Evolution costuma retentar)
    const messageId: string = data?.key?.id || data?.messageId || "";
    if (messageId) {
      const { data: dedup, error: dedupErr } = await supabase
        .from("webhook_idempotency")
        .insert({
          provider: "evolution_whatsapp",
          message_id: messageId,
          channel: "whatsapp",
          sender: (data?.key?.remoteJid || "").split("@")[0] || null,
        })
        .select("id")
        .maybeSingle();
      if (dedupErr && (dedupErr as any).code === "23505") {
        return new Response(JSON.stringify({ ok: true, skipped: "duplicate", message_id: messageId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!dedup && !dedupErr) {
        return new Response(JSON.stringify({ ok: true, skipped: "duplicate", message_id: messageId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
        await sendWhatsApp(phone, "Recebi seu áudio, mas não consegui processá-lo. Por gentileza, envie por texto que eu te respondo em seguida. 🌿");
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

    // Classify sentiment (Gemini) → habilita brisa-crisis-alert
    const { sentiment_score, is_negative } = await classifySentiment(messageText);

    // 🧠 BRISA 360° — Memória cross-channel unificada
    const unifiedContactId = await upsertUnifiedContact({
      channel: "whatsapp",
      phone,
      whatsappJid: remoteJid,
      displayName: data?.pushName || undefined,
    });
    if (unifiedContactId) {
      await logUnifiedMessage({
        contactId: unifiedContactId,
        channel: "whatsapp",
        direction: "inbound",
        content: messageText,
        externalId: messageId || undefined,
        messageType: messageText.startsWith("[🎙️ áudio transcrito]") ? "audio" : "text",
        urgency: is_negative ? 0.8 : Math.max(0, 1 - sentiment_score),
        audioTranscript: messageText.startsWith("[🎙️ áudio transcrito]") ? messageText.replace("[🎙️ áudio transcrito] ", "") : undefined,
        raw: { sentiment_score, is_negative },
      });
      // Se humano assumiu o atendimento, NÃO responde com bot
      if (await isHumanTakeoverActive(unifiedContactId)) {
        return new Response(JSON.stringify({ ok: true, skipped: "human_takeover", contact_id: unifiedContactId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Persist inbound message com sentiment + load short history
    // IMPORTANTE: aguardar o insert para que o SELECT abaixo enxergue a msg atual
    // (sem isso, previousInbound vinha undefined e o welcome disparava a cada msg)
    await supabase.from("whatsapp_brisa_log").insert({
      phone, direction: "inbound", message: messageText, raw: data,
      sentiment_score, is_negative,
    });

    // Espelha em audit_log para auditoria centralizada (Manus CEO)
    await supabase.from("audit_log").insert({
      action: "brisa_message_scored",
      table_name: "whatsapp_brisa_log",
      record_id: crypto.randomUUID(),
      new_data: {
        phone, message: messageText.slice(0, 500),
        sentiment_score, is_negative,
        scored_at: new Date().toISOString(),
      },
    }).then(() => {}).catch(() => {});

    const { data: rows } = await supabase
      .from("whatsapp_brisa_log")
      .select("direction, message, created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(8);

    // 🛡️ MÓDULO 2 — Filtro de assédio (corte seco, pré-LLM)
    if (containsHarassment(messageText)) {
      await sendWhatsApp(phone, BRISA_HARASSMENT_BLOCK);
      await supabase.from("whatsapp_brisa_log").insert({
        phone, direction: "outbound", message: BRISA_HARASSMENT_BLOCK,
        raw: { trigger: "harassment_block" },
      }).then(() => {}).catch(() => {});
      if (unifiedContactId) {
        await logUnifiedMessage({
          contactId: unifiedContactId, channel: "whatsapp", direction: "outbound",
          content: BRISA_HARASSMENT_BLOCK, intent: "harassment_block",
        });
      }
      await logGrowth("harassment_block", "brisa_omnichannel", { channel: "whatsapp", phone, message: messageText.slice(0, 300) });
      return new Response(JSON.stringify({ ok: true, blocked: "harassment" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🌿 MÓDULO 1 — Boas-vindas APENAS no 1º contato real ou após 24h de silêncio.
    // Critério à prova de race: olhar o último OUTBOUND de welcome enviado p/ este phone.
    const { data: lastWelcome } = await supabase
      .from("whatsapp_brisa_log")
      .select("created_at")
      .eq("phone", phone)
      .eq("direction", "outbound")
      .contains("raw", { trigger: "welcome_24h" })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const hoursSinceWelcome = lastWelcome?.created_at
      ? (Date.now() - new Date(lastWelcome.created_at).getTime()) / 36e5
      : Infinity;
    if (hoursSinceWelcome >= 24) {
      await sendWhatsApp(phone, BRISA_WELCOME_MESSAGE);
      await supabase.from("whatsapp_brisa_log").insert({
        phone, direction: "outbound", message: BRISA_WELCOME_MESSAGE,
        raw: { trigger: "welcome_24h" },
      });
      if (unifiedContactId) {
        await logUnifiedMessage({
          contactId: unifiedContactId, channel: "whatsapp", direction: "outbound",
          content: BRISA_WELCOME_MESSAGE, intent: "welcome_24h",
        });
      }
      await logGrowth("welcome_sent", "brisa_omnichannel", { channel: "whatsapp", phone, link: "https://plantayraiz.com.br" });
      return new Response(JSON.stringify({ ok: true, welcome: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    if (unifiedContactId) {
      await logUnifiedMessage({
        contactId: unifiedContactId, channel: "whatsapp", direction: "outbound",
        content: reply, intent: "ai_reply",
        messageType: (wasAudio || askedVoice) ? "audio" : "text",
      });
    }

    // Telemetria: detectar se a resposta contém o link de cadastro
    if (/plantayraiz\.com\.br/i.test(reply)) {
      await logGrowth("registration_link_sent", "brisa_omnichannel", { channel: "whatsapp", phone });
    }

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
