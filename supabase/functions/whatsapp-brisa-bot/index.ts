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
// 🔑 Gemini DIRETO (sem cobrar Lovable AI). Usa GEMINI_API_KEY do Google AI Studio.
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_CHAT_MODEL = "gemini-2.0-flash";
const GEMINI_LITE_MODEL = "gemini-2.0-flash-lite";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

import {
  BRISA_PERSONA,
  BRISA_WELCOME_MESSAGE,
  BRISA_HARASSMENT_BLOCK,
  containsHarassment,
  isFirstContactOrStale,
} from "../_shared/brisa-persona.ts";

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

const BRISA_SYSTEM_PROMPT = BRISA_PERSONA + `

// === COMPLEMENTO WHATSAPP (canal Evolution) ===
- Mensagens CURTAS (2-4 frases máximo), tom de WhatsApp.
- Verificação 18+ obrigatória na 1ª resposta: "Antes de te enviar o link, só pra confirmar: você tem mais de 18 anos? (sim/não)" — se "não", encerre gentil.
- Áudios recebidos chegam com prefixo "[🎙️ áudio transcrito]" — responda como se tivesse escutado, sem citar o prefixo.
- Você pode mandar áudio de voz quando o paciente mandar áudio ou pedir pra ouvir sua voz.
- Ligação/vídeo: só com o Dr. Edilson na sala da plataforma depois do cadastro.
`;

async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  try {
    const mime = mimeType.includes("ogg") ? "audio/ogg" : mimeType.includes("mp3") || mimeType.includes("mpeg") ? "audio/mp3" : "audio/wav";
    const resp = await fetch(`${GEMINI_BASE}/${GEMINI_CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: "Transcreva exatamente este áudio em português brasileiro. Responda APENAS com a transcrição, sem comentários." },
            { inline_data: { mime_type: mime, data: base64Audio } },
          ],
        }],
      }),
    });
    if (!resp.ok) { console.error("[brisa-bot] STT error", resp.status, await resp.text()); return ""; }
    const data = await resp.json();
    return (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
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
  try {
    const resp = await fetch(`${GEMINI_BASE}/${GEMINI_LITE_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "Você classifica sentimento de mensagens em pt-BR. score: 0 (muito negativo, raivoso, sofrimento, suicídio, frustração extrema) a 1 (muito positivo, gratidão, alegria). is_negative=true se score<0.4 ou houver hostilidade/sofrimento." }] },
        contents: [{ role: "user", parts: [{ text: text.slice(0, 2000) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              score: { type: "number" },
              is_negative: { type: "boolean" },
            },
            required: ["score", "is_negative"],
          },
        },
      }),
    });
    if (!resp.ok) {
      console.error("[brisa-bot] sentiment error", resp.status);
      return { sentiment_score: 0.5, is_negative: false };
    }
    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(raw);
    const score = Math.max(0, Math.min(1, Number(parsed.score) || 0.5));
    return { sentiment_score: score, is_negative: Boolean(parsed.is_negative) || score < 0.4 };
  } catch (e) {
    console.error("[brisa-bot] classifySentiment failed", e);
    return { sentiment_score: 0.5, is_negative: false };
  }
}

async function callBrisaAI(userMessage: string, history: Array<{role: string; content: string}>) {
  const contents = [
    ...history.slice(-6).map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];
  const resp = await fetch(`${GEMINI_BASE}/${GEMINI_CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: BRISA_SYSTEM_PROMPT }] },
      contents,
    }),
  });
  if (!resp.ok) {
    console.error("[brisa-bot] AI error", resp.status, await resp.text());
    return "Olá amor! 🌱 Sou a Enfª Brisa. Tive uma instabilidade rapidinha — me conta seu nome que já te ajudo 💚";
  }
  const data = await resp.json();
  return (data?.candidates?.[0]?.content?.parts?.[0]?.text || "Olá amor! Como posso te ajudar hoje? 💚").trim();
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

    // Classify sentiment (Gemini) → habilita brisa-crisis-alert
    const { sentiment_score, is_negative } = await classifySentiment(messageText);

    // Persist inbound message com sentiment + load short history
    await supabase.from("whatsapp_brisa_log").insert({
      phone, direction: "inbound", message: messageText, raw: data,
      sentiment_score, is_negative,
    }).then(() => {}).catch(() => {});

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
