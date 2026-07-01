// Brisa WhatsApp Bot — Evolution inbound webhook → Lovable AI → reply
// Receives messages.upsert from Evolution and responds autonomously.
// Replaces the n8n flow when n8n is unreachable (522). Production fallback.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { BRISA_PERSONA } from "../_shared/brisa-persona.ts";

let EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
if (EVOLUTION_API_URL && !/^https?:\/\//i.test(EVOLUTION_API_URL)) EVOLUTION_API_URL = `https://${EVOLUTION_API_URL}`;
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz_nova";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const WEBHOOK_SECRET = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") || "";

const SYSTEM_PROMPT = `${BRISA_PERSONA}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PROTOCOLO DE ATENDIMENTO WHATSAPP (v2026.6)
━━━━━━━━━━━━━━━━━━━━━━━━━━
• TRIAGEM INTELIGENTE: identifique agendamento, dúvidas sobre cannabis, suporte pós-consulta ou emergência.
• ÉTICA: você é suporte. Em sintoma grave/emergência → oriente SAMU 192 ou pronto-socorro IMEDIATAMENTE antes de qualquer outra coisa.
• AUTONOMIA: paciente novo → colete nome, idade, motivo. Paciente recorrente → confirme contexto.
• DÚVIDAS CANNABIS: responda com base técnica RDC 660/2022, foco em educação e segurança. Nunca prescreva.
• AGENDAMENTO/ORIENTAÇÃO: apresente PIX R$30 (BR) / US$10 (intl) e o link https://plantayraiz.com.br/oferta-especial.
• DOCUMENTOS (receitas/laudos): solicite dados conforme LGPD, encaminhe ao fluxo seguro.
• NUNCA prometa cura milagrosa. NUNCA prescreva sem médico habilitado.
• Mantenha continuidade do histórico já fornecido.
• Caso complexo demais → escalar para humano: "Vou chamar nossa equipe humana pra te atender em sequência, tá bom?".
• Respostas CURTAS (até 4 linhas), tom WhatsApp, sempre em português brasileiro.`;

async function sendWA(number: string, text: string) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return { ok: false, error: "no_evolution" };
  const r = await fetch(
    `${EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: number.replace(/\D/g, ""), text }),
    },
  );
  return { ok: r.ok, status: r.status, body: (await r.text()).slice(0, 300) };
}

async function aiReply(userText: string, phone: string): Promise<string> {
  if (!LOVABLE_API_KEY) return "Olá! Sou a Enfª Brisa 🌿. Para iniciar sua Orientação Técnica (R$30) acesse: https://plantayraiz.com.br/oferta-especial";
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `[wa:${phone}] ${userText}` },
        ],
      }),
    });
    if (!r.ok) throw new Error(`AI ${r.status}`);
    const j = await r.json();
    return j?.choices?.[0]?.message?.content?.trim() ||
      "Olá! Sou a Enfª Brisa 🌿. Como posso ajudar com sua orientação canábica?";
  } catch (e) {
    console.error("[whatsapp-brisa-bot] ai error", e);
    return "Olá! Sou a Enfª Brisa 🌿. Para iniciar sua Orientação Técnica (R$30) acesse: https://plantayraiz.com.br/oferta-especial";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url0 = new URL(req.url);
  if (req.method === "GET" && url0.searchParams.get("bootstrap") === "1") {
    // One-shot: register THIS function as the Evolution webhook. Requires service-role auth
    // (never expose WEBHOOK_SECRET in responses).
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const xCron = req.headers.get("x-cron-secret") || "";
    if (!SERVICE || (auth !== SERVICE && xCron !== SERVICE)) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const target = `https://${url0.host}/functions/v1/whatsapp-brisa-bot${WEBHOOK_SECRET ? `?secret=${encodeURIComponent(WEBHOOK_SECRET)}` : ""}`;
    const events = ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"];
    const inst = encodeURIComponent(EVOLUTION_INSTANCE);
    const headers = { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY };
    const v2 = await fetch(`${EVOLUTION_API_URL}/webhook/set/${inst}`, {
      method: "POST", headers,
      body: JSON.stringify({ webhook: { url: target, enabled: true, webhookByEvents: false, webhookBase64: false, events } }),
    }).then(async (r) => ({ status: r.status, body: (await r.text()).slice(0, 400) })).catch((e) => ({ status: 0, error: String(e) }));
    const v1 = await fetch(`${EVOLUTION_API_URL}/webhook/set/${inst}`, {
      method: "POST", headers,
      body: JSON.stringify({ url: target, enabled: true, webhook_by_events: false, events }),
    }).then(async (r) => ({ status: r.status, body: (await r.text()).slice(0, 400) })).catch((e) => ({ status: 0, error: String(e) }));
    const find = await fetch(`${EVOLUTION_API_URL}/webhook/find/${inst}`, { headers })
      .then(async (r) => ({ status: r.status, body: (await r.text()).slice(0, 400) })).catch((e) => ({ status: 0, error: String(e) }));
    // NOTE: target intentionally omitted from response to avoid leaking WEBHOOK_SECRET.
    return new Response(JSON.stringify({ ok: true, instance: EVOLUTION_INSTANCE, v2, v1, find }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "whatsapp-brisa-bot", instance: EVOLUTION_INSTANCE }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Mandatory shared-secret check — fail closed if not configured.
  if (!WEBHOOK_SECRET) {
    console.error("[whatsapp-brisa-bot] EVOLUTION_WEBHOOK_SECRET not configured — rejecting request");
    return new Response(JSON.stringify({ error: "webhook_not_configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  {
    const url = new URL(req.url);
    const got =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("apikey") ||
      url.searchParams.get("secret") ||
      url.searchParams.get("token");
    if (got !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  let payload: any = {};
  try { payload = await req.json(); } catch {}

  const event = String(payload?.event || payload?.type || "");
  const data = payload?.data || payload;
  const normalizedEvent = event.toLowerCase();
  const remoteJid: string = data?.key?.remoteJid || data?.remoteJid || "";
  const fromMe: boolean = !!data?.key?.fromMe;
  const text: string =
    data?.message?.conversation ||
    data?.message?.extendedTextMessage?.text ||
    data?.message?.imageMessage?.caption ||
    data?.text || "";

  // Only react to incoming user messages
  if ((normalizedEvent && !normalizedEvent.includes("message")) || fromMe || !remoteJid || !text || remoteJid.endsWith("@g.us")) {
    return new Response(JSON.stringify({ ok: true, ignored: true, event }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const phone = remoteJid.split("@")[0];
  const senderName = data?.pushName || data?.notifyName || null;
  const reply = await aiReply(text, phone);
  const sent = await sendWA(phone, reply);

  // Log + dashboard inbox
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await sb.from("brisa_interaction_logs").insert({
      channel: "whatsapp",
      user_ref: phone,
      status: sent.ok ? "replied" : "send_failed",
      http_status: sent.status ?? 0,
      meta: { event, text: text.slice(0, 500), reply: reply.slice(0, 500), send: sent },
    });
    await sb.from("whatsapp_messages").insert([
      { remote_jid: remoteJid, sender_name: senderName, message_text: text, message_type: "text", direction: "in", status: "received" },
      { remote_jid: remoteJid, sender_name: "Brisa Bot", message_text: reply, message_type: "text", direction: "out", status: sent.ok ? "sent" : "failed" },
    ]);
  } catch (e) { console.error("[whatsapp-brisa-bot] log error", e); }

  return new Response(JSON.stringify({ ok: true, phone, sent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
