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
const EVOLUTION_INSTANCE = encodeURIComponent(Deno.env.get("EVOLUTION_INSTANCE") || "Enf Brisa Bot whats");
const EVOLUTION_WEBHOOK_SECRET = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") || "";
// 🔑 IA: Lovable AI Gateway (preferido) com fallback para Gemini direto.
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const GEMINI_API_KEY =
  Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
  Deno.env.get("GEMINI_API_KEY") ||
  "";
const HAS_AI_KEY = !!(LOVABLE_API_KEY || GEMINI_API_KEY);
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_AI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const BRISA_MODEL = "google/gemini-2.5-flash";
const BRISA_LITE_MODEL = "google/gemini-2.5-flash-lite";
const stripPrefix = (m: string) => m.replace(/^google\//, "");

function shouldAvoidGeminiFallback(status: number): boolean {
  return status === 402 || status === 429;
}

// Lovable AI Gateway primeiro (cota maior + sem 429 do free tier).
// Se falhar (402/429/5xx) e existir GEMINI_API_KEY, cai pra Gemini direto.
async function aiChat(body: Record<string, unknown>): Promise<Response | null> {
  if (!HAS_AI_KEY) return null;
  const model = String((body as Record<string, unknown>).model || BRISA_MODEL);

  if (LOVABLE_API_KEY) {
    try {
      const res = await fetch(LOVABLE_AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, model: model.startsWith("google/") ? model : `google/${stripPrefix(model)}` }),
      });
      if (res.ok) return res;
      console.error("[brisa-bot] Lovable AI Gateway status", res.status);
      if (shouldAvoidGeminiFallback(res.status)) return res;
      if (!GEMINI_API_KEY) return res; // sem fallback, devolve a resposta de erro
    } catch (e) {
      console.error("[brisa-bot] Lovable AI exception", String(e));
      if (!GEMINI_API_KEY) return null;
    }
  }

  if (GEMINI_API_KEY) {
    try {
      return await fetch(GEMINI_AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, model: stripPrefix(model) }),
      });
    } catch (e) {
      console.error("[brisa-bot] Gemini direct exception", String(e));
      return null;
    }
  }
  return null;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

import {
  BRISA_PERSONA,
  BRISA_WELCOME_MESSAGE,
  BRISA_HARASSMENT_BLOCK,
  BRISA_FALLBACK_MESSAGE,
  containsHarassment,
} from "../_shared/brisa-persona.ts";
import {
  upsertUnifiedContact,
  logUnifiedMessage,
  isHumanTakeoverActive,
  getRecentHistory,
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

// === MODO WHATSAPP (canal Evolution) ===
- Você está no WhatsApp. Escreva como pessoa, não como bot.
- Mensagens curtas: 1 a 4 linhas. Quase nunca mais.
- Se já se apresentou nesta conversa (veja o histórico), NÃO se apresente de novo. Continue de onde parou.
- Verificação 18+: só peça antes de mandar link de pagamento, e de forma leve: "Antes de te mandar o link, só pra confirmar: você tem mais de 18, né?"
- Áudios recebidos chegam com prefixo "[🎙️ áudio transcrito]" — responda como se tivesse ESCUTADO, sem citar o prefixo, em tom natural de quem ouviu mesmo.
- Quando responder a um áudio do paciente, sua resposta de texto também será sintetizada em voz feminina natural (ElevenLabs) — escreva pensando que vai ser FALADO: frases fluídas, sem listas, sem markdown, sem URLs longas.
- Atendimento por vídeo: apenas dentro da plataforma após cadastro e pagamento da Orientação Técnica.
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

type AudioUnderstanding = {
  transcript: string;
  needsAudioReply: boolean;
  seniorCareStyle: boolean;
  notes: string;
};

async function transcribeAudio(base64Audio: string, mimeType: string): Promise<AudioUnderstanding> {
  if (!HAS_AI_KEY) return { transcript: "", needsAudioReply: true, seniorCareStyle: false, notes: "" };
  try {
    const fmt = mimeType.includes("mp3") || mimeType.includes("mpeg") ? "mp3" : "wav";
    const resp = await aiChat({
      model: BRISA_MODEL,
      response_format: { type: "json_object" },
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Analise este áudio em português brasileiro e responda APENAS JSON com as chaves transcript, needs_audio_reply, senior_care_style e notes. Em transcript, escreva a fala literal. Em needs_audio_reply, marque true quando a pessoa deixar claro que prefere ouvir a resposta. Em senior_care_style, marque true quando houver sinais de idade avançada, fala lenta, confusão, fragilidade, dificuldade para ler ou necessidade de condução mais paciente. Em notes, resuma em uma frase curta o tipo de acolhimento ideal.",
          },
          { type: "input_audio", input_audio: { data: base64Audio, format: fmt } },
        ],
      }],
    });
    if (!resp || !resp.ok) {
      console.error("[brisa-bot] STT error", resp?.status, await resp?.text().catch(() => ""));
      return { transcript: "", needsAudioReply: true, seniorCareStyle: false, notes: "" };
    }
    const data = await resp.json();
    const raw = (data?.choices?.[0]?.message?.content || "").trim();
    try {
      const parsed = JSON.parse(raw);
      return {
        transcript: String(parsed?.transcript || "").trim(),
        needsAudioReply: Boolean(parsed?.needs_audio_reply),
        seniorCareStyle: Boolean(parsed?.senior_care_style),
        notes: String(parsed?.notes || "").trim(),
      };
    } catch {
      return { transcript: raw, needsAudioReply: true, seniorCareStyle: false, notes: "" };
    }
  } catch (e) {
    console.error("[brisa-bot] transcribeAudio failed", e);
    return { transcript: "", needsAudioReply: true, seniorCareStyle: false, notes: "" };
  }
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
  const response = await fetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
    body: JSON.stringify({
      number: cleanPhone,
      audioMessage: { audio: base64Audio },
      options: { delay: 1200, presence: "recording", encoding: true },
    }),
  });
  if (!response.ok) {
    console.error("[brisa-bot] sendWhatsAppAudio failed", response.status, await response.text().catch(() => ""));
  }
  return response;
}

// 🎙️ ElevenLabs TTS — voz feminina sensual PT-BR (Laura) p/ Brisa, masculina firme (George) p/ Dr. Edilson
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY") || "";
const VOICE_BRISA = "FGY2WhTYpPnrIDTdsKH5";   // Laura — feminina jovem, calorosa
const VOICE_EDILSON = "JBFqnCBsd6RMkjVDRZzb"; // George — masculina firme, profissional

async function synthesizeVoice(text: string, voiceId: string): Promise<string | null> {
  // Tenta ElevenLabs primeiro
  if (ELEVENLABS_API_KEY) {
    try {
      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
      });
      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
        return btoa(binary);
      }
    } catch (e) { console.error("[brisa-bot] ElevenLabs failed", e); }
  }
  return null;
}

function sanitizeForSpeech(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\*/g, "")
    .replace(/#/g, "")
    .trim();
}

async function sendVoiceReply(phone: string, text: string, preferredVoiceId = VOICE_BRISA): Promise<boolean> {
  const spoken = sanitizeForSpeech(text);
  if (!spoken) return false;
  const audioB64 = await synthesizeVoice(spoken, preferredVoiceId);
  if (!audioB64) return false;
  const response = await sendWhatsAppAudio(phone, audioB64);
  return !!response?.ok;
}

function extractLinkLine(text: string): string | null {
  const re = /(https?:\/\/\S+|(?:www\.)?[a-z0-9-]+\.(?:com\.br|com|br|net|org|app|io|me)(?:\/\S*)?)/i;
  const m = text.match(re);
  if (!m) return null;
  const line = text.split(/\n+/).find(l => l.includes(m[0])) || m[0];
  return line.trim();
}

async function classifySentiment(text: string): Promise<{ sentiment_score: number; is_negative: boolean }> {
  if (!HAS_AI_KEY) return { sentiment_score: 0.5, is_negative: false };
  try {
    const resp = await aiChat({
      model: BRISA_LITE_MODEL,
      messages: [
        { role: "system", content: "Você classifica sentimento de mensagens em pt-BR. score: 0 (muito negativo) a 1 (muito positivo). is_negative=true se score<0.4. Responda APENAS JSON: {\"score\":number,\"is_negative\":boolean}" },
        { role: "user", content: text.slice(0, 2000) },
      ],
      response_format: { type: "json_object" },
    });
    if (!resp || !resp.ok) return { sentiment_score: 0.5, is_negative: false };
    const data = await resp.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}");
    const score = Math.max(0, Math.min(1, Number(parsed.score) || 0.5));
    return { sentiment_score: score, is_negative: Boolean(parsed.is_negative) || score < 0.4 };
  } catch { return { sentiment_score: 0.5, is_negative: false }; }
}

import { processar_triagem_brisa } from "../_shared/brisa-ai.ts";

async function callBrisaAI(
  userMessage: string,
  history: Array<{role: string; content: string}>,
  phone: string,
  options?: { seniorCareStyle?: boolean; wantsAudioReply?: boolean; audioNotes?: string },
) {
  if (!HAS_AI_KEY) return BRISA_FALLBACK_MESSAGE;
  let systemPrompt = await getBrisaSystemPrompt();
  if (options?.seniorCareStyle) {
    systemPrompt += `\n\n// === ACOLHIMENTO SÊNIOR ===\n- Paciente idoso, fale com calma e paciência.`;
  }
  if (options?.wantsAudioReply) {
    systemPrompt += `\n\n// === RESPOSTA EM ÁUDIO ===\n- Resposta será ouvida, seja natural e evite termos técnicos.`;
  }
  const r = await processar_triagem_brisa(userMessage, phone, "whatsapp", {
    history, model: BRISA_MODEL, systemPrompt,
  });
  return r.reply || BRISA_FALLBACK_MESSAGE;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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
        return new Response(JSON.stringify({ ok: true, skipped: "duplicate" }), {
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
    
    let audioUnderstanding: AudioUnderstanding | null = null;
    const audioMsg = data?.message?.audioMessage;
    if (!messageText && audioMsg) {
      const audio = await fetchEvolutionAudio(data);
      if (audio?.base64) {
        audioUnderstanding = await transcribeAudio(audio.base64, audio.mime);
        if (audioUnderstanding.transcript) {
          messageText = `[🎙️ áudio transcrito] ${audioUnderstanding.transcript}`;
        }
      }
    }

    if (!phone || !messageText) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      });
      if (await isHumanTakeoverActive(unifiedContactId)) {
        return new Response(JSON.stringify({ ok: true, skipped: "human_takeover" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 🧠 Recupera Histórico 360° Real
    const rawHistory = unifiedContactId ? await getRecentHistory(unifiedContactId, 14) : [];
    const history = rawHistory.map((h: any) => ({
      role: h.direction === "inbound" ? "user" : "assistant",
      content: h.content,
    }));

    if (containsHarassment(messageText)) {
      await sendWhatsApp(phone, BRISA_HARASSMENT_BLOCK);
      return new Response(JSON.stringify({ ok: true, blocked: "harassment" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🌿 MÓDULO Boas-vindas (apenas se for o primeiro contato ou > 24h)
    const lastOutbound = rawHistory.filter((h: any) => h.direction === "outbound").pop();
    const hoursSinceLastReply = lastOutbound?.created_at
      ? (Date.now() - new Date(lastOutbound.created_at).getTime()) / 36e5
      : Infinity;

    if (hoursSinceLastReply >= 24) {
      await sendWhatsApp(phone, BRISA_WELCOME_MESSAGE);
      if (unifiedContactId) {
        await logUnifiedMessage({
          contactId: unifiedContactId, channel: "whatsapp", direction: "outbound",
          content: BRISA_WELCOME_MESSAGE, intent: "welcome_24h",
        });
      }
      await logGrowth("welcome_sent", "brisa_omnichannel", {
        channel: "whatsapp", phone, link: "https://plantayraiz.com.br",
      });
      // ⚡ NÃO retorna — segue para resposta inteligente do Gemini na mesma rodada
    }

    // ⚡ Gemini Autônomo com Histórico 360°
    const reply = await callBrisaAI(messageText, history, phone, {
      wantsAudioReply: !!audioUnderstanding,
      seniorCareStyle: audioUnderstanding?.seniorCareStyle,
      audioNotes: audioUnderstanding?.notes,
    });

    if (reply) {
      await sendWhatsApp(phone, reply);
      if (unifiedContactId) {
        await logUnifiedMessage({
          contactId: unifiedContactId, channel: "whatsapp", direction: "outbound",
          content: reply,
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[brisa-bot] Global error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
