// ╔══════════════════════════════════════════════════════════════════════╗
// ║  🌿 ENFERMEIRA BRISA — WhatsApp Bot PRODUÇÃO v2026.7               ║
// ║  Planta y Raiz Ltda · Supabase Edge Function                       ║
// ║                                                                      ║
// ║  ✅ Anti-loop: fromMe === true → ignorado imediatamente             ║
// ║  ✅ Anti-timeout: HTTP 200 retornado antes da IA processar          ║
// ║  ✅ IA: Gemini 1.5 Pro (direto) + Gemini 2.5 Flash (fallback)      ║
// ║  ✅ Canal primário: WAHA (Railway) · Fallback: Evolution API        ║
// ║  ✅ Persona Brisa completa — CFM/ANVISA compliant                   ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
};

// ── Variáveis de ambiente ─────────────────────────────────────────────────
const GEMINI_API_KEY        = Deno.env.get("GEMINI_API_KEY") || "";
const LOVABLE_API_KEY       = Deno.env.get("LOVABLE_API_KEY") || "";
const WAHA_API_URL          = (Deno.env.get("WAHA_API_URL") || "waha-production-4e9c.up.railway.app").replace(/\/$/,"");
const WAHA_API_KEY          = Deno.env.get("WAHA_API_KEY") || "planta123";
const WAHA_SESSION          = Deno.env.get("WAHA_SESSION") || "default";
const EVOLUTION_API_URL     = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/,"");
const EVOLUTION_API_KEY     = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVOLUTION_INSTANCE    = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz_nova";
const ADMIN_PHONE           = Deno.env.get("ADMIN_PHONE_BR") || "";

// ── Persona Brisa (CFM/ANVISA compliant) ─────────────────────────────────
const BRISA_PERSONA = `Você é a Brisa — Enfermeira Consultora e Especialista em Cannabis Medicinal da Planta y Raiz Ltda.

COMPLIANCE MESTRE (INEGOCIÁVEL): A Planta y Raiz Ltda (CNAE 6209-1/00) atua ESTRITAMENTE como plataforma de intermediação tecnológica. A plataforma NÃO fabrica, NÃO produz, NÃO importa, NÃO distribui, NÃO entrega, NÃO comercializa e NÃO vende nenhum produto farmacêutico. A plataforma NÃO pratica atos médicos, NÃO emite diagnósticos e NÃO prescreve.

TOM E ESTILO (WhatsApp):
• Frases CURTAS — máximo 4 linhas por mensagem, como quem digita no celular
• Empático, acolhedor, técnico e profissional
• PROIBIDO: "amor", "querido", "meu bem", "meu coração"
• Emoji com parcimônia: 🌿 ou ✅ quando apropriado
• Português brasileiro natural

SEGURANÇA CLÍNICA:
• Para emergências → oriente SAMU 192 IMEDIATAMENTE
• Nunca prescreve, nunca dá diagnóstico, nunca promete cura
• Para casos complexos → "Vou chamar nossa equipe humana pra te atender"
• Dentro das normas ANVISA RDC 660/2022, RDC 327/2019 e CFM 2.314/2022

OFERTA (quando perguntarem):
• Orientação Técnica: R$30 (Brasil) ou US$10 (internacional)
• Realizada pelo Dr. Edilson Bezerra (CRM-SP 10963)
• Link: https://plantayraiz.com.br
• PIX ou cartão aceitos`;

// ── Parser de payload WAHA ────────────────────────────────────────────────
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
  // WAHA payload format
  const event  = String(body?.event ?? "").toLowerCase();
  const payload = (body?.payload ?? body) as Record<string,unknown>;

  const chatId     = String(payload?.from ?? payload?.chatId ?? payload?.id ?? "");
  const fromMe     = Boolean(payload?.fromMe ?? payload?.from_me ?? false);
  const text       = String(payload?.body ?? payload?.text ?? payload?.caption ?? "").trim();
  const senderName = String(payload?.senderName ?? payload?.notifyName ?? payload?._data?.notifyName ?? "") || null;

  return {
    chatId,
    phone: chatId.replace(/@.*/, "").replace(/\D/g, ""),
    fromMe,
    text,
    senderName,
    isGroup: chatId.includes("@g.us") || chatId.includes("-"),
    isStatus: chatId === "status@broadcast",
    event,
  };
}

// ── Geração de resposta Gemini ────────────────────────────────────────────
async function generateReply(userText: string, phone: string, name: string | null): Promise<string> {
  const ctx = name ? `[${name} | ${phone}]` : `[${phone}]`;
  const userContent = `${ctx}\n${userText}`;

  // Tentativa 1: Lovable AI Gateway (Gemini 2.5 Flash — mais rápido)
  if (LOVABLE_API_KEY) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 22000);
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          max_tokens: 400, temperature: 0.7,
          messages: [
            { role: "system", content: BRISA_PERSONA },
            { role: "user", content: userContent },
          ],
        }),
      });
      clearTimeout(t);
      if (r.ok) {
        const j = await r.json() as {choices?:Array<{message?:{content?:string}}>};
        const reply = j?.choices?.[0]?.message?.content?.trim();
        if (reply) { console.log("[brisa] IA: lovable-gateway"); return reply; }
      }
      console.warn(`[brisa] Lovable Gateway ${r.status} — tentando Gemini 1.5 Pro direto`);
    } catch(e) { console.warn("[brisa] Lovable timeout:", e); }
  }

  // Tentativa 2: Gemini 1.5 Pro direto (conforme solicitado)
  if (GEMINI_API_KEY) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25000);
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST", signal: ctrl.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: BRISA_PERSONA }] },
            contents: [{ role: "user", parts: [{ text: userContent }] }],
            generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
          }),
        }
      );
      clearTimeout(t);
      if (r.ok) {
        const j = await r.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>};
        const reply = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) { console.log("[brisa] IA: gemini-1.5-pro-direct"); return reply; }
      }
      console.warn(`[brisa] Gemini direto ${r.status}`);
    } catch(e) { console.warn("[brisa] Gemini timeout:", e); }
  }

  // Fallback texto estático
  return "Olá! Sou a Enfª Brisa 🌿 da Planta y Raiz. Estou com instabilidade técnica agora. Em instantes retorno. Ou acesse: https://plantayraiz.com.br";
}

// ── Envio WAHA (primário) ─────────────────────────────────────────────────
async function sendWAHA(chatId: string, text: string): Promise<{ok:boolean, status?:number, error?:string}> {
  try {
    const base = WAHA_API_URL.startsWith("http") ? WAHA_API_URL : `https://${WAHA_API_URL}`;
    const r = await fetch(`${base}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Api-Key": WAHA_API_KEY,
      },
      body: JSON.stringify({ session: WAHA_SESSION, chatId, text }),
    });
    return { ok: r.ok, status: r.status };
  } catch(e) { return { ok: false, error: String(e) }; }
}

// ── Envio Evolution (fallback) ────────────────────────────────────────────
async function sendEvolution(phone: string, text: string): Promise<{ok:boolean, status?:number, error?:string}> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return { ok: false, error: "no_evolution" };
  try {
    const base = EVOLUTION_API_URL.startsWith("http") ? EVOLUTION_API_URL : `https://${EVOLUTION_API_URL}`;
    const r = await fetch(`${base}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: phone, text, options: { delay: 1200, presence: "composing" } }),
    });
    return { ok: r.ok, status: r.status };
  } catch(e) { return { ok: false, error: String(e) }; }
}

// ── Envio com fallback automático ─────────────────────────────────────────
async function sendMessage(chatId: string, phone: string, text: string): Promise<{provider:string, ok:boolean}> {
  const waha = await sendWAHA(chatId, text);
  if (waha.ok) return { provider: "waha", ok: true };
  console.warn(`[brisa] WAHA falhou (${waha.status}/${waha.error}) → tentando Evolution`);
  const ev = await sendEvolution(phone, text);
  return { provider: "evolution", ok: ev.ok };
}

// ── Handler principal ─────────────────────────────────────────────────────
serve(async (req: Request): Promise<Response> => {

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Health check GET
  if (req.method === "GET") {
    return new Response(JSON.stringify({
      ok: true,
      service: "whatsapp-brisa-bot",
      version: "2026.7-prod",
      waha: WAHA_API_URL,
      session: WAHA_SESSION,
      ai: LOVABLE_API_KEY ? "lovable-gateway+gemini-1.5-pro" : (GEMINI_API_KEY ? "gemini-1.5-pro" : "fallback-only"),
      evolution_configured: Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY),
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse do payload
  let body: Record<string,unknown> = {};
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid_json" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  }); }

  const parsed = parseWAHA(body);
  const { chatId, phone, fromMe, text, senderName, isGroup, isStatus, event } = parsed;

  // ✅ ANTI-LOOP: mensagens enviadas pelo próprio bot
  if (fromMe) {
    console.log(`[brisa] ANTI-LOOP: ignorando fromMe=true → ${chatId}`);
    return new Response(JSON.stringify({ ok: true, ignored: true, reason: "fromMe" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Ignorar grupos, status e eventos sem texto
  if (isGroup)  return new Response(JSON.stringify({ ok: true, ignored: true, reason: "group" }),  { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (isStatus) return new Response(JSON.stringify({ ok: true, ignored: true, reason: "status" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (event && !event.includes("message")) return new Response(JSON.stringify({ ok: true, ignored: true, reason: `event:${event}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!chatId || !text) return new Response(JSON.stringify({ ok: true, ignored: true, reason: "no_text" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  // ✅ ANTI-TIMEOUT: retorna 200 imediatamente, IA e envio rodam em background
  const background = async () => {
    try {
      console.log(`[brisa] Mensagem de ${phone} (${senderName ?? "?"}): "${text.slice(0, 100)}"`);
      const reply = await generateReply(text, phone, senderName);
      const send  = await sendMessage(chatId, phone, reply);
      console.log(`[brisa] Enviado via ${send.provider} (ok=${send.ok}): "${reply.slice(0, 80)}"`);
    } catch(e) {
      console.error("[brisa] background error:", e);
    }
  };

  // EdgeRuntime.waitUntil garante execução mesmo após retornar a Response
  const runtime = (globalThis as unknown as {EdgeRuntime?: {waitUntil?: (p: Promise<unknown>) => void}}).EdgeRuntime;
  if (runtime?.waitUntil) {
    runtime.waitUntil(background());
  } else {
    background().catch(console.error);
  }

  return new Response(
    JSON.stringify({ ok: true, queued: true, phone, event }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
