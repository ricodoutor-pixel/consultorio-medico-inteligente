// ╔══════════════════════════════════════════════════════════════════════╗
// ║  🌿 ENFERMEIRA BRISA — WhatsApp Bot PRODUÇÃO v2026.7.1              ║
// ║  Planta y Raiz Ltda · Supabase Edge Function                       ║
// ║                                                                      ║
// ║  ✅ Anti-loop: fromMe === true → ignorado imediatamente             ║
// ║  ✅ Anti-timeout: HTTP 200 retornado antes da IA processar          ║
// ║  ✅ IA: gemini-1.5-pro EXCLUSIVO (Lovable Gateway removido)         ║
// ║  ✅ Canal: 100% WAHA — Evolution API removida deste handler         ║
// ║  ✅ Persona Brisa completa — CFM/ANVISA compliant                   ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
};

// ── Variáveis de ambiente ─────────────────────────────────────────────────
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const WAHA_API_URL    = (Deno.env.get("WAHA_API_URL") || "waha-production-4e9c.up.railway.app").replace(/\/$/,"");
const WAHA_API_KEY    = Deno.env.get("WAHA_API_KEY") || "planta123";
const WAHA_SESSION    = Deno.env.get("WAHA_SESSION") || "default";

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

// ── Parser de payload WAHA (evento message / message.any) ────────────────
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
    phone: chatId.replace(/@.*/, "").replace(/\D/g, ""),
    fromMe,
    text,
    senderName,
    isGroup: chatId.includes("@g.us") || chatId.includes("-"),
    isStatus: chatId === "status@broadcast",
    event,
  };
}

// ── Geração de resposta — gemini-1.5-pro EXCLUSIVO ────────────────────────
async function generateReply(userText: string, phone: string, name: string | null): Promise<string> {
  const ctx = name ? `[${name} | ${phone}]` : `[${phone}]`;
  const userContent = `${ctx}\n${userText}`;

  if (!GEMINI_API_KEY) {
    console.error("[brisa] GEMINI_API_KEY ausente — sem fallback de IA configurado");
    return "Olá! Sou a Enfª Brisa 🌿 da Planta y Raiz. Estou com instabilidade técnica agora. Em instantes retorno. Ou acesse: https://plantayraiz.com.br";
  }

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
      if (reply) { console.log("[brisa] IA: gemini-1.5-pro"); return reply; }
    } else {
      console.error(`[brisa] gemini-1.5-pro HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);
    }
  } catch(e) { console.warn("[brisa] gemini-1.5-pro timeout/erro:", e); }

  return "Olá! Sou a Enfª Brisa 🌿 da Planta y Raiz. Estou com instabilidade técnica agora. Em instantes retorno. Ou acesse: https://plantayraiz.com.br";
}

// ── Envio via WAHA (único canal — Evolution removida) ─────────────────────
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
    if (!r.ok) console.error(`[brisa] WAHA HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);
    return { ok: r.ok, status: r.status };
  } catch(e) { return { ok: false, error: String(e) }; }
}

// ── Handler principal ─────────────────────────────────────────────────────
serve(async (req: Request): Promise<Response> => {

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({
      ok: true,
      service: "whatsapp-brisa-bot",
      version: "2026.7.1-prod",
      waha: WAHA_API_URL,
      session: WAHA_SESSION,
      ai: "gemini-1.5-pro (exclusivo)",
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Record<string,unknown> = {};
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid_json" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  }); }

  const { chatId, phone, fromMe, text, senderName, isGroup, isStatus, event } = parseWAHA(body);

  if (fromMe) {
    console.log(`[brisa] ANTI-LOOP: ignorando fromMe=true → ${chatId}`);
    return new Response(JSON.stringify({ ok: true, ignored: true, reason: "fromMe" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (isGroup)  return new Response(JSON.stringify({ ok: true, ignored: true, reason: "group" }),  { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (isStatus) return new Response(JSON.stringify({ ok: true, ignored: true, reason: "status" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (event && !event.includes("message")) return new Response(JSON.stringify({ ok: true, ignored: true, reason: `event:${event}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!chatId || !text) return new Response(JSON.stringify({ ok: true, ignored: true, reason: "no_text" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const background = async () => {
    try {
      console.log(`[brisa] Mensagem de ${phone} (${senderName ?? "?"}): "${text.slice(0, 100)}"`);
      const reply = await generateReply(text, phone, senderName);
      const send  = await sendWAHA(chatId, reply);
      console.log(`[brisa] Enviado via WAHA (ok=${send.ok}): "${reply.slice(0, 80)}"`);
    } catch(e) {
      console.error("[brisa] background error:", e);
    }
  };

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
