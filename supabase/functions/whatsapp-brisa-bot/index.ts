// whatsapp-brisa-bot v2026.7.3 - com log de diagnostico + modo simulacao (isSimulation)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsApp } from "../_shared/evolution.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const WAHA_API_URL    = (Deno.env.get("WAHA_API_URL") || "waha-production-4e9c.up.railway.app").replace(/\/$/,"");
const WAHA_API_KEY    = Deno.env.get("WAHA_API_KEY") || "planta123";
const WAHA_SESSION    = Deno.env.get("WAHA_SESSION") || "default";
const SB_URL = Deno.env.get("SUPABASE_URL") || "";
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886";

const BRISA_PERSONA = `Voce e a Brisa - Enfermeira Consultora e Especialista em Cannabis Medicinal da Planta y Raiz Ltda.

COMPLIANCE MESTRE (INEGOCIAVEL): A Planta y Raiz Ltda (CNAE 6209-1/00) atua ESTRITAMENTE como plataforma de intermediacao tecnologica. A plataforma NAO fabrica, NAO produz, NAO importa, NAO distribui, NAO entrega, NAO comercializa e NAO vende nenhum produto farmaceutico. A plataforma NAO pratica atos medicos, NAO emite diagnosticos e NAO prescreve.

TOM E ESTILO (WhatsApp):
- Frases CURTAS, maximo 4 linhas por mensagem
- Empatico, acolhedor, tecnico e profissional
- PROIBIDO: "amor", "querido", "meu bem", "meu coracao"
- Emoji com parcimonia
- Portugues brasileiro natural

SEGURANCA CLINICA:
- Para emergencias, oriente SAMU 192 IMEDIATAMENTE
- Nunca prescreve, nunca da diagnostico, nunca promete cura
- Para casos complexos, diga que vai chamar a equipe humana
- Dentro das normas ANVISA RDC 660/2022, RDC 327/2019 e CFM 2.314/2022

OFERTA (quando perguntarem):
- Orientacao Tecnica: R$30 (Brasil) ou US$10 (internacional)
- Realizada pelo Dr. Edilson Bezerra (CRM-CE 10963)
- Link: https://plantayraiz.com.br`;

interface ParsedMsg {
  chatId: string;
  phone: string;
  fromMe: boolean;
  text: string;
  senderName: string | null;
  isGroup: boolean;
  isStatus: boolean;
  event: string;
}

function parseWAHA(body: Record<string,unknown>): ParsedMsg {
  const event   = String(body?.event ?? "").toLowerCase();
  const payload = (body?.payload ?? body) as Record<string,unknown>;

  const chatId     = String(payload?.from ?? payload?.chatId ?? payload?.id ?? "");
  const fromMe     = Boolean(payload?.fromMe ?? payload?.from_me ?? false);
  const text       = String(payload?.body ?? payload?.text ?? payload?.caption ?? "").trim();
  const senderName = String(payload?.senderName ?? payload?.notifyName ?? payload?._data?.notifyName ?? "") || null;

  return {
    chatId,
    phone: chatId.replace(/@.*/, "").replace(/[^0-9]/g, ""),
    fromMe,
    text,
    senderName,
    isGroup: chatId.includes("@g.us") || chatId.includes("-"),
    isStatus: chatId === "status@broadcast",
    event,
  };
}

async function logMsg(row: Record<string, unknown>) {
  if (!SB_URL || !SB_KEY) return;
  try {
    await fetch(`${SB_URL}/rest/v1/whatsapp_messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SB_KEY,
        "Authorization": `Bearer ${SB_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(row),
    });
  } catch (e) {
    console.error("[brisa] logMsg falhou:", e);
  }
}

async function isAdminRequest(req: Request): Promise<boolean> {
  if (!SB_URL || !SB_KEY) return false;
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token === SB_KEY) return false;

  try {
    const supabase = createClient(SB_URL, SB_KEY);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (userError || !userId) return false;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    return !error && data?.role === "admin";
  } catch (e) {
    console.error("[brisa] admin auth check failed:", e);
    return false;
  }
}

async function generateReply(userText: string, phone: string, name: string | null): Promise<{text: string, source: string}> {
  const ctx = name ? `[${name} | ${phone}]` : `[${phone}]`;
  const userContent = `${ctx}\n${userText}`;

  if (!GEMINI_API_KEY) {
    return { text: "Ola! Sou a Enfa Brisa da Planta y Raiz. Estou com instabilidade tecnica agora. Em instantes retorno. Ou acesse: https://plantayraiz.com.br", source: "fallback:no_key" };
  }

import { callGeminiApiWithFallback, GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts";

  try {
    const payload = {
      system_instruction: { parts: [{ text: BRISA_PERSONA }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
    };

    const res = await callGeminiApiWithFallback(GEMINI_API_KEY, payload, GEMINI_PRIMARY_MODEL);
    if (res.ok) {
      const reply = res.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (reply) return { text: reply, source: res.usedModel };
      return { text: "Ola! Sou a Enfa Brisa da Planta y Raiz. Estou com instabilidade tecnica agora. Em instantes retorno.", source: "fallback:empty_candidate" };
    } else {
      console.error(`Gemini API HTTP ${res.status}:`, res.data);
      return { text: "Ola! Sou a Enfa Brisa da Planta y Raiz. Estou com instabilidade tecnica agora. Em instantes retorno.", source: `fallback:http_${res.status}` };
    }
  } catch(e) {
    return { text: "Ola! Sou a Enfa Brisa da Planta y Raiz. Estou com instabilidade tecnica agora. Em instantes retorno.", source: `fallback:exception:${String(e).slice(0,180)}` };
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 7000): Promise<{ ok: boolean; status: number; body: string; error?: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort("timeout"), timeoutMs);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    const body = await r.text().catch(() => "");
    return { ok: r.ok, status: r.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: "", error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(t);
  }
}

function chatIdFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return phone.includes("@") ? phone : `${digits}@c.us`;
}

async function sendWAHA(chatId: string, text: string): Promise<{ok:boolean, status?:number, error?:string, provider:string}> {
  const base = WAHA_API_URL.startsWith("http") ? WAHA_API_URL : `https://${WAHA_API_URL}`;
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Api-Key": WAHA_API_KEY,
  };
  const body = JSON.stringify({ session: WAHA_SESSION, chatId, text });

  const primary = await fetchWithTimeout(`${base}/api/sendText`, {
      method: "POST",
      headers,
      body,
    }, 7000);
  if (primary.ok) return { ok: true, status: primary.status, provider: "waha:/api/sendText" };

  const sessionRoute = await fetchWithTimeout(`${base}/api/${encodeURIComponent(WAHA_SESSION)}/sendText`, {
    method: "POST",
    headers,
    body: JSON.stringify({ chatId, text }),
  }, 7000);
  if (sessionRoute.ok) return { ok: true, status: sessionRoute.status, provider: "waha:/api/{session}/sendText" };

  const fallback = await sendWhatsApp(chatId.replace(/@.*/, ""), text);
  if (fallback.ok) return { ok: true, status: fallback.status, provider: "evolution:fallback" };

  const twilio = await sendTwilioWhatsApp(chatId.replace(/@.*/, ""), text);
  if (twilio.ok) return { ok: true, status: twilio.status, provider: "twilio:fallback" };

  const primaryError = primary.error || primary.body.slice(0, 220);
  const sessionError = sessionRoute.error || sessionRoute.body.slice(0, 220);
  return {
    ok: false,
    status: primary.status || sessionRoute.status || fallback.status || twilio.status,
    provider: "failed:waha+evolution",
    error: `waha_primary=${primary.status}:${primaryError} | waha_session=${sessionRoute.status}:${sessionError} | evolution=${fallback.status || 0}:${fallback.error || "failed"} | twilio=${twilio.status || 0}:${twilio.error || "failed"}`.slice(0, 500),
  };
}

async function sendTwilioWhatsApp(phone: string, text: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { ok: false, error: "twilio_not_configured" };
  }

  const digits = phone.replace(/\D/g, "");
  const to = digits.startsWith("+") ? `whatsapp:${digits}` : `whatsapp:+${digits}`;
  const body = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: to,
    Body: text,
  });

  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const res = await fetchWithTimeout(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
    9000,
  );

  return {
    ok: res.ok,
    status: res.status,
    error: res.ok ? undefined : (res.error || res.body.slice(0, 300)),
  };
}


// 🔐 Verificação do segredo compartilhado do webhook (anti-spoof)
const WAHA_WEBHOOK_SECRET = Deno.env.get("WAHA_WEBHOOK_SECRET") || "";
function webhookSecretOk(req: Request): boolean {
  if (!WAHA_WEBHOOK_SECRET) return false;
  const hdr = req.headers.get("x-webhook-secret") || req.headers.get("x-api-key") || "";
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  return hdr === WAHA_WEBHOOK_SECRET || auth === WAHA_WEBHOOK_SECRET;
}

serve(async (req: Request): Promise<Response> => {

  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({
      ok: true,
      service: "whatsapp-brisa-bot",
      version: "2026.7.4-waha-evolution-failover",
      waha: WAHA_API_URL,
      session: WAHA_SESSION,
      ai: "gemini-1.5-pro (exclusivo)",
      gemini_key_configured: Boolean(GEMINI_API_KEY),
      gemini_key_prefix: GEMINI_API_KEY ? GEMINI_API_KEY.slice(0,4) : null,
      simulation_mode: "POST com { isSimulation: true, text: '...' }",
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 🔐 POSTs só são aceitos com o segredo do webhook OU credencial de serviço/admin
  if (!webhookSecretOk(req)) {
    const unauth = requireServiceAuth(req, corsHeaders);
    if (unauth && !(await isAdminRequest(req))) return unauth;
  }

  let body: Record<string,unknown> = {};
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid_json" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  }); }

  // ── MODO SIMULACAO: bypassa WAHA, retorna a resposta da IA direto no HTTP ──
  const payloadObj = (body?.payload ?? {}) as Record<string, unknown>;
  const isSimulation = Boolean(body?.isSimulation ?? payloadObj?.isSimulation ?? false);
  const action = String(body?.action ?? payloadObj?.action ?? "").trim().toLowerCase();

  if (action === "brisa_on" || action === "send_test") {
    const unauth = requireServiceAuth(req, corsHeaders);
    if (unauth && !(await isAdminRequest(req))) return unauth;

    const target = String(body?.number ?? body?.phone ?? Deno.env.get("ADMIN_WHATSAPP") ?? "5511987131241");
    const text = String(body?.text ?? "Olá Dr. Edilson Bezerra (CRM-CE 10963), estou on!");
    const chatId = chatIdFromPhone(target);
    const send = await sendWAHA(chatId, text);
    await logMsg({
      remote_jid: chatId,
      sender_name: "Brisa Admin Test",
      message_text: text,
      message_type: "text",
      direction: "out",
      status: send.ok ? `sent:${send.provider}` : `send_failed:${send.provider}:${send.status}:${send.error}`,
      from_me: true,
      session: WAHA_SESSION,
    });

    return new Response(JSON.stringify({ ok: send.ok, action, chatId, provider: send.provider, status: send.status, error: send.error }), {
      status: send.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (isSimulation) {
    const simText = String(body?.text ?? body?.message ?? payloadObj?.text ?? payloadObj?.body ?? "").trim();
    const simName = String(body?.name ?? payloadObj?.name ?? body?.senderName ?? "") || null;
    const simPhone = String(body?.phone ?? payloadObj?.phone ?? "simulation") || "simulation";

    if (!simText) {
      return new Response(JSON.stringify({ status: "error", error: "campo 'text' obrigatorio no modo simulacao" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reply = await generateReply(simText, simPhone, simName);
    return new Response(JSON.stringify({
      status: "success",
      isSimulation: true,
      text: reply.text,
      source: reply.source,
      waha_bypassed: true,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  }

  // ── FLUXO DE PRODUCAO NORMAL (WAHA -> Gemini -> WAHA) ──
  const { chatId, phone, fromMe, text, senderName, isGroup, isStatus, event } = parseWAHA(body);

  if (fromMe) {
    return new Response(JSON.stringify({ ok: true, ignored: true, reason: "fromMe" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (isGroup)  return new Response(JSON.stringify({ ok: true, ignored: true, reason: "group" }),  { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (isStatus) return new Response(JSON.stringify({ ok: true, ignored: true, reason: "status" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (event && !event.includes("message")) return new Response(JSON.stringify({ ok: true, ignored: true, reason: `event:${event}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!chatId || !text) return new Response(JSON.stringify({ ok: true, ignored: true, reason: "no_text" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const background = async () => {
    await logMsg({ remote_jid: chatId, sender_name: senderName, message_text: text, message_type: "text", direction: "in", status: "received", from_me: false, session: WAHA_SESSION });

    const reply = await generateReply(text, phone, senderName);
    await logMsg({ remote_jid: chatId, sender_name: senderName, message_text: reply.text, message_type: "text", direction: "out", status: `generated:${reply.source}`, from_me: true, session: WAHA_SESSION });

    const send = await sendWAHA(chatId, reply.text);
    await logMsg({ remote_jid: chatId, sender_name: senderName, message_text: reply.text, message_type: "text", direction: "out", status: send.ok ? `sent:${send.provider}` : `send_failed:${send.provider}:${send.status}:${send.error}`, from_me: true, session: WAHA_SESSION });
  };

  const runtime = (globalThis as unknown as {EdgeRuntime?: {waitUntil?: (p: Promise<unknown>) => void}}).EdgeRuntime;
  if (runtime?.waitUntil) {
    runtime.waitUntil(background());
  } else {
    background().catch((e) => console.error("[brisa] background error:", e));
  }

  return new Response(
    JSON.stringify({ ok: true, queued: true, phone, event }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
