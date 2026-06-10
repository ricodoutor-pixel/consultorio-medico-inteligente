// Brisa WhatsApp Bot — Evolution inbound webhook → Lovable AI → reply
// Receives messages.upsert from Evolution and responds autonomously.
// Replaces the n8n flow when n8n is unreachable (522). Production fallback.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const WEBHOOK_SECRET = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") || "";

const SYSTEM_PROMPT = `Você é a Enfª Brisa, da Planta y Raiz — plataforma de telemedicina canábica (CNAE 6209-1/00).
Tom: acolhedor, profissional, objetivo. Sempre em português.
Objetivo: triagem rápida → encaminhar para Orientação Técnica do Dr. Edilson (CRM 10963) por R$30 (BR) / US$10 (intl).
Links: site https://plantayraiz.com.br · pagamento https://plantayraiz.com.br/oferta-especial
Nunca prometa cura. Nunca prescreva. Sempre informe que a prescrição depende de avaliação médica.
Respostas curtas (até 4 linhas) para WhatsApp.`;

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
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "whatsapp-brisa-bot", instance: EVOLUTION_INSTANCE }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Optional shared-secret check
  if (WEBHOOK_SECRET) {
    const got = req.headers.get("x-webhook-secret") || new URL(req.url).searchParams.get("secret");
    if (got !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  let payload: any = {};
  try { payload = await req.json(); } catch {}

  const event = payload?.event || payload?.type;
  const data = payload?.data || payload;
  const remoteJid: string = data?.key?.remoteJid || data?.remoteJid || "";
  const fromMe: boolean = !!data?.key?.fromMe;
  const text: string =
    data?.message?.conversation ||
    data?.message?.extendedTextMessage?.text ||
    data?.message?.imageMessage?.caption ||
    data?.text || "";

  // Only react to incoming user messages
  if (fromMe || !remoteJid || !text || remoteJid.endsWith("@g.us")) {
    return new Response(JSON.stringify({ ok: true, ignored: true, event }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const phone = remoteJid.split("@")[0];
  const reply = await aiReply(text, phone);
  const sent = await sendWA(phone, reply);

  // Log
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await sb.from("brisa_interaction_logs").insert({
      channel: "whatsapp",
      user_ref: phone,
      status: sent.ok ? "replied" : "send_failed",
      http_status: sent.status ?? 0,
      meta: { event, text: text.slice(0, 500), reply: reply.slice(0, 500), send: sent },
    });
  } catch (e) { console.error("[whatsapp-brisa-bot] log error", e); }

  return new Response(JSON.stringify({ ok: true, phone, sent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
