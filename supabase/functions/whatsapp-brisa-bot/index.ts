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
// 🔑 IA: Google Gemini DIRETO (sem Lovable AI Gateway).
const GEMINI_API_KEY =
  Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
  Deno.env.get("GEMINI_API_KEY") ||
  "";
const HAS_AI_KEY = !!GEMINI_API_KEY;
const GEMINI_AI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const BRISA_MODEL = "gemini-2.5-flash";
const BRISA_LITE_MODEL = "gemini-2.5-flash-lite";
const stripPrefix = (m: string) => m.replace(/^google\//, "");

// Chamada direta à API do Google Gemini (OpenAI-compat). Sem fallback Lovable.
async function aiChat(body: Record<string, unknown>): Promise<Response | null> {
  if (!GEMINI_API_KEY) return null;
  try {
    return await fetch(GEMINI_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, model: stripPrefix(String((body as Record<string, unknown>).model || BRISA_MODEL)) }),
    });
  } catch (e) {
    console.error("[brisa-bot] Gemini direct exception", String(e));
    return null;
  }
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
const GOOGLE_TTS_SERVICE_ACCOUNT_JSON = Deno.env.get("GOOGLE_TTS_SERVICE_ACCOUNT_JSON") || "";
const VOICE_BRISA = "FGY2WhTYpPnrIDTdsKH5";   // Laura — feminina jovem, calorosa
const VOICE_EDILSON = "JBFqnCBsd6RMkjVDRZzb"; // George — masculina firme, profissional

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

let googleTtsTokenCache: { token: string; expiresAt: number } | null = null;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getGoogleTtsAccessToken(): Promise<string | null> {
  if (!GOOGLE_TTS_SERVICE_ACCOUNT_JSON) return null;
  if (googleTtsTokenCache && googleTtsTokenCache.expiresAt > Date.now() + 60_000) {
    return googleTtsTokenCache.token;
  }
  try {
    const serviceAccount = JSON.parse(GOOGLE_TTS_SERVICE_ACCOUNT_JSON) as GoogleServiceAccount;
    const now = Math.floor(Date.now() / 1000);
    const encoder = new TextEncoder();
    const tokenUri = serviceAccount.token_uri || "https://oauth2.googleapis.com/token";
    const jwtHeader = toBase64Url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
    const jwtPayload = toBase64Url(encoder.encode(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    })));
    const unsignedToken = `${jwtHeader}.${jwtPayload}`;
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBuffer(serviceAccount.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, encoder.encode(unsignedToken));
    const assertion = `${unsignedToken}.${toBase64Url(new Uint8Array(signature))}`;
    const tokenResponse = await fetch(tokenUri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    if (!tokenResponse.ok) {
      console.error("[brisa-bot] Google TTS auth failed", tokenResponse.status, await tokenResponse.text().catch(() => ""));
      return null;
    }
    const tokenData = await tokenResponse.json();
    const token = String(tokenData?.access_token || "");
    const expiresIn = Math.max(300, Number(tokenData?.expires_in) || 3600);
    if (!token) return null;
    googleTtsTokenCache = { token, expiresAt: Date.now() + expiresIn * 1000 };
    return token;
  } catch (e) {
    console.error("[brisa-bot] Google TTS token error", e);
    return null;
  }
}

async function synthesizeVoiceWithGoogle(text: string, voiceId: string): Promise<string | null> {
  const token = await getGoogleTtsAccessToken();
  if (!token || !text) return null;
  try {
    const isEdilson = voiceId === VOICE_EDILSON;
    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text: text.replace(/[*_`#]/g, "").slice(0, 900) },
        voice: {
          languageCode: "pt-BR",
          ssmlGender: isEdilson ? "MALE" : "FEMALE",
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: isEdilson ? 0.98 : 1.01,
          pitch: isEdilson ? -1 : 1,
        },
      }),
    });
    if (!response.ok) {
      console.error("[brisa-bot] Google TTS failed", response.status, await response.text().catch(() => ""));
      return null;
    }
    const data = await response.json();
    return String(data?.audioContent || "") || null;
  } catch (e) {
    console.error("[brisa-bot] Google TTS synth error", e);
    return null;
  }
}

async function synthesizeVoice(text: string, voiceId: string): Promise<string | null> {
  if (!text) return null;
  if (!ELEVENLABS_API_KEY) return await synthesizeVoiceWithGoogle(text, voiceId);
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
          // eleven_turbo_v2_5 → PT-BR mais natural, menos "metálico", latência baixa
          model_id: "eleven_turbo_v2_5",
          // stability 0.35 = mais expressiva e variável (humana, com respiração)
          // similarity 0.85 = preserva o timbre feminino da Laura
          // style 0.65 = entonação rica, pausas naturais
          voice_settings: { stability: 0.35, similarity_boost: 0.85, style: 0.65, use_speaker_boost: true, speed: 1.02 },
        }),
      },
    );
    if (!r.ok) {
      console.error("[brisa-bot] ElevenLabs TTS failed:", r.status, await r.text().catch(() => ""));
      const googleAudio = await synthesizeVoiceWithGoogle(cleanText, voiceId);
      if (googleAudio) console.log("[brisa-bot] Google TTS fallback used after ElevenLabs failure");
      return googleAudio;
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
    return await synthesizeVoiceWithGoogle(text, voiceId);
  }
}

const AUDIO_REPLY_PATTERNS = /\b([aá]udio|voz|ouvir|escutar|me fala|fale comigo|manda.*[aá]udio|responde.*[aá]udio|n[aã]o sei ler|n[aã]o consigo ler|tenho dificuldade pra ler|sou idos[oa]|sou senhor|sou senhora|fale devagar|explica devagar)\b/i;

function shouldUseAudioReply(text: string, history: Array<{ role: string; content: string }>, audioUnderstanding: AudioUnderstanding | null): boolean {
  if (text.startsWith("[🎙️ áudio transcrito]")) return true;
  if (audioUnderstanding?.needsAudioReply) return true;
  if (AUDIO_REPLY_PATTERNS.test(text)) return true;
  return history.slice(-6).some((item) => item.role === "user" && AUDIO_REPLY_PATTERNS.test(item.content || ""));
}

function shouldUseSeniorCareStyle(text: string, history: Array<{ role: string; content: string }>, audioUnderstanding: AudioUnderstanding | null): boolean {
  if (audioUnderstanding?.seniorCareStyle) return true;
  if (/\b(idos[oa]|senhor[ae]?|aposentad[oa]|n[aã]o sei ler|n[aã]o consigo ler|fale devagar|explica devagar|tenho dificuldade pra ler)\b/i.test(text)) return true;
  return history.slice(-6).some((item) => item.role === "user" && /\b(idos[oa]|senhor[ae]?|aposentad[oa]|n[aã]o sei ler|n[aã]o consigo ler|fale devagar|explica devagar|tenho dificuldade pra ler)\b/i.test(item.content || ""));
}

// Remove URLs e markdown da fala — TTS não lê link (fica robótico).
// Substitui por uma frase natural pedindo pra tocar no link enviado por texto.
function sanitizeForSpeech(text: string): string {
  if (!text) return text;
  let cleaned = text;
  // markdown links [label](url) -> label
  cleaned = cleaned.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1");
  // urls cruas (http/https e domínios .com.br soltos)
  const URL_RE = /\b(?:https?:\/\/\S+|(?:www\.)?[a-z0-9-]+\.(?:com|com\.br|br|net|org|app|io|me)(?:\/\S*)?)/gi;
  let hadUrl = false;
  cleaned = cleaned.replace(URL_RE, () => { hadUrl = true; return ""; });
  // limpa pontuação solta deixada pelas remoções
  cleaned = cleaned
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
  if (hadUrl) {
    // Acrescenta cue natural sem ler o endereço
    const cue = " Pra não te confundir com o endereço, é só tocar no link que eu mandei aqui em cima na conversa, tá?";
    cleaned = cleaned.length ? `${cleaned}${cue}` : cue.trim();
  }
  return cleaned;
}

async function sendVoiceReply(phone: string, text: string, preferredVoiceId = VOICE_BRISA): Promise<boolean> {
  const spoken = sanitizeForSpeech(text);
  console.log("[brisa-bot][voice] start", { phone: phone.slice(-4), len_in: text.length, len_spoken: spoken.length, hasEleven: !!ELEVENLABS_API_KEY, hasGoogle: !!GOOGLE_TTS_SERVICE_ACCOUNT_JSON });
  if (!spoken) { console.warn("[brisa-bot][voice] empty spoken text after sanitize"); return false; }
  const t0 = Date.now();
  const audioB64 = await synthesizeVoice(spoken, preferredVoiceId);
  console.log("[brisa-bot][voice] tts done", { ms: Date.now() - t0, bytes_b64: audioB64?.length || 0 });
  if (!audioB64) { console.error("[brisa-bot][voice] synthesizeVoice returned null — TTS falhou (Eleven+Google)"); return false; }
  const response = await sendWhatsAppAudio(phone, audioB64).catch((e) => {
    console.error("[brisa-bot][voice] sendWhatsAppAudio threw", e);
    return null;
  });
  const ok = Boolean(response?.ok);
  console.log("[brisa-bot][voice] evolution result", { ok, status: response?.status });
  return ok;
}

// Extrai apenas a linha que contém URL para enviar como texto curto junto ao áudio
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
        { role: "system", content: "Você classifica sentimento de mensagens em pt-BR. score: 0 (muito negativo, raivoso, sofrimento, suicídio, frustração extrema) a 1 (muito positivo). is_negative=true se score<0.4 ou houver hostilidade/sofrimento. Responda APENAS JSON: {\"score\":number,\"is_negative\":boolean}" },
        { role: "user", content: text.slice(0, 2000) },
      ],
      response_format: { type: "json_object" },
    });
    if (!resp || !resp.ok) {
      console.error("[brisa-bot] sentiment error", resp?.status);
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

import { processar_triagem_brisa } from "../_shared/brisa-ai.ts";

async function callBrisaAI(
  userMessage: string,
  history: Array<{role: string; content: string}>,
  phone: string,
  options?: { seniorCareStyle?: boolean; wantsAudioReply?: boolean; audioNotes?: string },
) {
  if (!HAS_AI_KEY) {
    console.error("[brisa-bot] Nenhuma chave de IA configurada — fallback");
    return BRISA_FALLBACK_MESSAGE;
  }
  let systemPrompt = await getBrisaSystemPrompt();
  if (options?.seniorCareStyle) {
    systemPrompt += `

// === ACOLHIMENTO SÊNIOR / BAIXA LETRABILIDADE ===
- A pessoa pode ser idosa, ter dificuldade para ler ou precisar de mais calma.
- Fale de forma mais paciente, simples e acolhedora, sem infantilizar.
- Dê uma instrução por vez.
- Confirme se a pessoa entendeu antes de avançar para o próximo passo.
- Quando houver link, explique em 1 frase o que vai acontecer ao abrir o link.`;
  }
  if (options?.wantsAudioReply) {
    systemPrompt += `

// === RESPOSTA QUE VAI SER OUVIDA ===
- Esta resposta será enviada também em áudio.
- Escreva como fala humana natural, sem listas longas, sem blocos extensos e sem termos técnicos desnecessários.
- Se precisar passar um link, anuncie antes com uma frase curta e tranquilizadora.`;
  }
  if (options?.audioNotes) {
    systemPrompt += `

// === CONTEXTO DE ESCUTA ===
- Observação do áudio recebido: ${options.audioNotes.slice(0, 220)}`;
  }
  const r = await processar_triagem_brisa(userMessage, phone, "whatsapp", {
    history, model: BRISA_MODEL, systemPrompt,
  });
  return r.reply || BRISA_FALLBACK_MESSAGE;
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
    let audioUnderstanding: AudioUnderstanding | null = null;

    // 🎙️ AUDIO: transcribe if Brisa received a voice message
    const audioMsg = data?.message?.audioMessage;
    if (!messageText && audioMsg) {
      const audio = await fetchEvolutionAudio(data);
      if (audio?.base64) {
        audioUnderstanding = await transcribeAudio(audio.base64, audio.mime);
        if (audioUnderstanding.transcript) {
          messageText = `[🎙️ áudio transcrito] ${audioUnderstanding.transcript}`;
        }
      }
      if (!messageText) {
        const fallbackText = "Ouvi seu áudio, mas ele veio com falha aqui pra mim. Se você quiser, pode mandar outro áudio mais curtinho que eu continuo te acompanhando por aqui. 🌿";
        await sendWhatsApp(phone, fallbackText);
        await sendVoiceReply(phone, fallbackText);
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

    const history = (rows || []).reverse().map((r: any) => ({
      role: r.direction === "inbound" ? "user" : "assistant",
      content: r.message,
    }));

    const wantsAudioReply = shouldUseAudioReply(messageText, history, audioUnderstanding);
    const seniorCareStyle = shouldUseSeniorCareStyle(messageText, history, audioUnderstanding);

    // 🌿 MÓDULO 1 — Boas-vindas APENAS no 1º contato real ou após 24h de silêncio.
    // Se a pessoa pediu áudio, a mesma mensagem de boas-vindas sai também em voz.
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
      if (wantsAudioReply) {
        await sendVoiceReply(phone, BRISA_WELCOME_MESSAGE, VOICE_BRISA);
      }
      await supabase.from("whatsapp_brisa_log").insert({
        phone, direction: "outbound", message: BRISA_WELCOME_MESSAGE,
        raw: { trigger: "welcome_24h", voice: wantsAudioReply },
      });
      if (unifiedContactId) {
        await logUnifiedMessage({
          contactId: unifiedContactId, channel: "whatsapp", direction: "outbound",
          content: BRISA_WELCOME_MESSAGE, intent: "welcome_24h",
          messageType: wantsAudioReply ? "audio" : "text",
        });
      }
      await logGrowth("welcome_sent", "brisa_omnichannel", {
        channel: "whatsapp",
        phone,
        link: "https://plantayraiz.com.br",
        voice: wantsAudioReply,
      });
      return new Response(JSON.stringify({ ok: true, welcome: true, voice: wantsAudioReply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reply = await callBrisaAI(messageText, history, phone, {
      wantsAudioReply,
      seniorCareStyle,
      audioNotes: audioUnderstanding?.notes,
    });

    // 🎙️ Quando usuário pede áudio (ou é idoso/baixa leitura): áudio é a resposta principal.
    // Texto só vai se o áudio falhar OU se houver link (TTS não lê URL — entrega o link em texto curto).
    let audioOk = false;
    if (wantsAudioReply) {
      const isEdilson = /dr\.?\s*edilson|doutor\s*edilson/i.test(reply);
      const voiceId = isEdilson ? VOICE_EDILSON : VOICE_BRISA;
      audioOk = await sendVoiceReply(phone, reply, voiceId);
      console.log("[brisa-bot] audio-first path", { audioOk, voiceId });
      if (audioOk) {
        const linkLine = extractLinkLine(reply);
        if (linkLine) {
          // Manda APENAS a linha com o link, curto, pra acompanhar o áudio
          await sendWhatsApp(phone, linkLine);
        }
      } else {
        // Fallback: áudio falhou → manda texto completo pra não deixar o paciente sem resposta
        console.warn("[brisa-bot] audio failed, falling back to full text");
        await sendWhatsApp(phone, reply);
      }
    } else {
      await sendWhatsApp(phone, reply);
    }

    await supabase.from("whatsapp_brisa_log").insert({
      phone, direction: "outbound", message: reply, raw: {
        ai: true,
        voice: wantsAudioReply,
        audio_sent: audioOk,
        senior_care_style: seniorCareStyle,
        audio_notes: audioUnderstanding?.notes || null,
      },
    }).then(() => {}).catch(() => {});

    if (unifiedContactId) {
      await logUnifiedMessage({
        contactId: unifiedContactId, channel: "whatsapp", direction: "outbound",
        content: reply, intent: "ai_reply",
        messageType: audioOk ? "audio" : "text",
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
