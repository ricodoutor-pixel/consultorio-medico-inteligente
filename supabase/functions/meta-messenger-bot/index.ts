// Meta Messenger + Instagram Direct bot — Enfª Brisa
// Public webhook (verify_jwt=false). Validates X-Hub-Signature-256 with FACEBOOK_APP_SECRET.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const FB_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET")!;
const FB_PAGE_TOKEN = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN")!;
const IG_BUSINESS_ID = Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID") ?? "";
// Verify tokens accepted by the Meta webhook handshake.
// Includes the dedicated Meta token shared with the Meta App config and a fallback to the shared Evolution secret.
const META_VERIFY_TOKEN_FIXED = "K0baZDESt89Cb9fI2I0Zskh+8Jtv2PpzgfQEScUfCFU=";
const VERIFY_TOKENS = [
  META_VERIFY_TOKEN_FIXED,
  Deno.env.get("EVOLUTION_WEBHOOK_SECRET") ?? "",
].filter(Boolean);
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") ?? "";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") ?? "";
const DR_EDILSON_WA = "5511987131241";

const BRISA_SYSTEM = `Você é a Enfermeira Brisa da Planta y Raiz (telemedicina cannabis medicinal).
Tom: acolhedor, profissional, claro. Use português BR. Mensagens curtas (até 3 linhas) com emoji moderado 🌿.
Funções:
- Acolher e triar sintomas
- Explicar a Orientação Técnica do Dr. Edilson (CRM 10963) — R$ 30 via PIX, PDF com selo gov.br
- Direcionar ao link https://plantayraiz.com.br quando apropriado
- Para sintomas graves (dor torácica, suicídio, hemorragia, desmaio) responda calmamente E sinalize urgência
NUNCA prescreva. NUNCA prometa cura. Sempre LGPD-friendly.`;

const RED_FLAGS = ["suicíd", "suicid", "me matar", "dor no peito", "dor torácica", "sangramento", "hemorragia", "desmaio", "convuls", "falta de ar grave", "overdose"];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function verifySignature(req: Request, raw: string): Promise<boolean> {
  const sig = req.headers.get("x-hub-signature-256");
  if (!sig || !sig.startsWith("sha256=") || !FB_APP_SECRET) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(FB_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const expected = "sha256=" + Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, "0")).join("");
  return expected === sig;
}

async function callBrisaAI(userMsg: string): Promise<string> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: BRISA_SYSTEM },
        { role: "user", content: userMsg },
      ],
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    console.error("AI Gateway error", r.status, t);
    return "Oi! Sou a Enfª Brisa 🌿 Tive uma instabilidade aqui. Pode me contar de novo o que está sentindo?";
  }
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || "Estou aqui pra te ajudar 🌿";
}

async function sendMessenger(recipientId: string, text: string) {
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${FB_PAGE_TOKEN}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text },
    }),
  });
}

async function sendInstagram(recipientId: string, text: string) {
  // Instagram uses the same /me/messages endpoint when token has IG permissions
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${FB_PAGE_TOKEN}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}

async function notifyDoctorRedFlag(channel: string, senderId: string, msg: string) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) return;
  try {
    await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({
        number: DR_EDILSON_WA,
        text: `🚨 RED FLAG (${channel})\nRemetente: ${senderId}\nMensagem: ${msg.slice(0, 400)}`,
      }),
    });
  } catch (e) {
    console.error("notifyDoctor failed", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Meta verification handshake
  if (req.method === "GET") {
    const u = new URL(req.url);
    const mode = u.searchParams.get("hub.mode");
    const token = u.searchParams.get("hub.verify_token");
    const challenge = u.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token && VERIFY_TOKENS.includes(token)) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const raw = await req.text();
  const ok = await verifySignature(req, raw);
  if (!ok) {
    console.warn("Invalid signature");
    return new Response("Invalid signature", { status: 401, headers: corsHeaders });
  }

  let body: any;
  try { body = JSON.parse(raw); } catch { return new Response("bad json", { status: 400, headers: corsHeaders }); }

  // Always 200 quickly; process async
  const entries = body?.entry ?? [];
  (async () => {
    for (const entry of entries) {
      const messaging = entry.messaging ?? [];
      for (const ev of messaging) {
        try {
          const senderId = ev.sender?.id;
          const text: string | undefined = ev.message?.text;
          if (!senderId || !text || ev.message?.is_echo) continue;

          // Detect channel: IG entries usually have entry.id == IG_BUSINESS_ID
          const channel = (IG_BUSINESS_ID && entry.id === IG_BUSINESS_ID) ? "instagram" : "messenger";

          // Dedup / rate-limit per sender (10 min window)
          const { data: allowed } = await supabase.rpc("check_edge_rate_limit", {
            p_bucket: `meta_${channel}`,
            p_key: senderId,
            p_max_hits: 20,
            p_window_seconds: 600,
          });
          if (allowed === false) continue;

          const lower = text.toLowerCase();
          const isRed = RED_FLAGS.some(f => lower.includes(f));

          const reply = await callBrisaAI(text);

          if (channel === "instagram") await sendInstagram(senderId, reply);
          else await sendMessenger(senderId, reply);

          if (isRed) await notifyDoctorRedFlag(channel, senderId, text);

          await supabase.from("meta_messenger_log").insert({
            channel, sender_id: senderId, message_in: text, reply_out: reply, red_flag: isRed,
          });
        } catch (e) {
          console.error("event handler error", e);
          await supabase.from("meta_messenger_log").insert({
            channel: "messenger", sender_id: ev?.sender?.id ?? "unknown",
            message_in: ev?.message?.text ?? null, error: String(e),
          });
        }
      }
    }
  })();

  return new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders });
});
