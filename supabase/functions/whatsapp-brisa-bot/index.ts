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

const BRISA_SYSTEM_PROMPT = `Você é a Enfª Brisa, especialista em Cannabis Medicinal da Planta y Raiz (MEGA CLÍNICA DIGITAL).
Atende pacientes via WhatsApp em nome do Dr. Edilson Bezerra (CRM 10963).

REGRAS CRÍTICAS:
- NUNCA use "Consulta" — diga "Orientação Técnica" (R$30 / US$10, 20 min via WhatsApp).
- Seja acolhedora, técnica e direta. Use no máximo 4 linhas por resposta.
- Conformidade RDC 660/2022 da ANVISA.
- Para fechar venda: oriente pagar via PIX e enviar comprovante aqui.
- Site: https://plantayraiz.com.br
- Em casos graves (suicídio, dor aguda, emergência) → escalar IMEDIATO para Dr. Edilson e dizer "vou chamar o doutor agora mesmo".
- Triagem: pergunte sintomas, há quanto tempo, tratamentos atuais.
- Idioma: responda no idioma da pessoa (pt-BR padrão).

OFERTA PRINCIPAL: Orientação Técnica R$30 com Dr. Edilson via WhatsApp.`;

async function sendWhatsApp(number: string, text: string) {
  const cleanPhone = number.replace(/\D/g, "");
  return fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
    body: JSON.stringify({ number: cleanPhone, text, delay: 1500, linkPreview: true }),
  });
}

async function callBrisaAI(userMessage: string, history: Array<{role: string; content: string}>) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
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
    const errBody = await resp.text();
    console.error("[brisa-bot] AI error", resp.status, errBody);
    return "Olá! 🌱 Sou a Enfª Brisa. Estou com instabilidade rápida — me conta seu nome e o que está sentindo que já te encaminho ao Dr. Edilson.";
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "Olá! Sou a Enfª Brisa. Como posso te ajudar hoje?";
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
    const messageText: string =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.imageMessage?.caption ||
      "";

    if (!phone || !messageText) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist inbound message + load short history
    await supabase.from("whatsapp_conversations").insert({
      phone, direction: "inbound", message: messageText, raw: data,
    }).then(() => {}).catch(() => {});

    const { data: rows } = await supabase
      .from("whatsapp_conversations")
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

    await supabase.from("whatsapp_conversations").insert({
      phone, direction: "outbound", message: reply, raw: { ai: true },
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
