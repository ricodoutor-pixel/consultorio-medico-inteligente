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
// IA agora 100% via Google Gemini direto (ver _shared/brisa-ai.ts). Sem Lovable AI Gateway.
import {
  META_APP_SECRET as FB_APP_SECRET,
  FB_PAGE_ACCESS_TOKEN,
  IG_PAGE_ACCESS_TOKEN,
} from "../_shared/meta-secrets.ts";
const FB_PAGE_TOKEN = FB_PAGE_ACCESS_TOKEN;
const IG_PAGE_TOKEN = IG_PAGE_ACCESS_TOKEN || FB_PAGE_ACCESS_TOKEN;
const IG_BUSINESS_ID = Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID") ?? "";
// Verify tokens accepted by the Meta webhook handshake.
// Sourced exclusively from secrets — never hardcode.
const VERIFY_TOKENS = [
  Deno.env.get("META_WEBHOOK_VERIFY_TOKEN") ?? "",
  Deno.env.get("EVOLUTION_WEBHOOK_SECRET") ?? "",
].filter(Boolean);
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") ?? "";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") ?? "";
const DR_EDILSON_WA = "5511987131241";

import {
  BRISA_PERSONA,
  BRISA_WELCOME_MESSAGE,
  BRISA_HARASSMENT_BLOCK,
  containsHarassment,
  isFirstContactOrStale,
} from "../_shared/brisa-persona.ts";
import {
  upsertUnifiedContact,
  logUnifiedMessage,
  isHumanTakeoverActive,
} from "../_shared/brisa-memory.ts";

const BRISA_SYSTEM = BRISA_PERSONA + `

// === COMPLEMENTO META MESSENGER / INSTAGRAM DM ===
Mensagens curtas (até 3 linhas), tom de DM, 1-2 emojis.
Em red flags (suicídio, dor torácica, hemorragia, desmaio, convulsão): acolha + oriente SAMU 192, depois retome cadastro.
NUNCA prescreva. NUNCA prometa cura. LGPD-friendly.`;

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

import { processar_triagem_brisa, BRISA_SYSTEM_PROMPT } from "../_shared/brisa-ai.ts";

async function callBrisaAI(userMsg: string, senderId: string, channel: string): Promise<string> {
  const sysPrompt = BRISA_SYSTEM_PROMPT + `

// === COMPLEMENTO META MESSENGER / INSTAGRAM DM ===
Mensagens curtas (até 3 linhas), tom de DM, 1-2 emojis.
Em red flags (suicídio, dor torácica, hemorragia, desmaio, convulsão): acolha + oriente SAMU 192, depois retome cadastro.
NUNCA prescreva. NUNCA prometa cura. LGPD-friendly.`;
  const r = await processar_triagem_brisa(userMsg, senderId, channel, { systemPrompt: sysPrompt });
  return r.reply || "Oi! Sou a Enfª Brisa 🌿 Tive uma instabilidade aqui. Pode me contar de novo o que está sentindo?";
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
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${IG_PAGE_TOKEN}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}

async function replyComment(commentId: string, text: string) {
  // Funciona para FB Page comments E IG comments (mesmo endpoint Graph)
  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/${commentId}/replies?access_token=${FB_PAGE_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    if (!r.ok) console.error("[meta] reply comment failed", r.status, await r.text());
  } catch (e) {
    console.error("[meta] reply comment error", e);
  }
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

          // 🔒 IDEMPOTÊNCIA — Meta reenvia o mesmo mid em caso de retry/timeout
          const mid: string = ev.message?.mid || "";
          if (mid) {
            const { data: dedup, error: dedupErr } = await supabase
              .from("webhook_idempotency")
              .insert({
                provider: `meta_${channel}`,
                message_id: mid,
                channel,
                sender: senderId,
              })
              .select("id")
              .maybeSingle();
            if ((dedupErr && (dedupErr as any).code === "23505") || (!dedup && !dedupErr)) {
              continue;
            }
          }

          // Dedup / rate-limit per sender (10 min window)
          const { data: allowed } = await supabase.rpc("check_edge_rate_limit", {
            p_bucket: `meta_${channel}`,
            p_key: senderId,
            p_max_hits: 20,
            p_window_seconds: 600,
          });
          if (allowed === false) continue;

          // 🧠 BRISA 360° — memória unificada cross-channel
          const unifiedChannel = channel === "instagram" ? "instagram_dm" : "messenger";
          const unifiedContactId = await upsertUnifiedContact({
            channel: unifiedChannel,
            instagramId: channel === "instagram" ? senderId : undefined,
            facebookPsid: channel === "messenger" ? senderId : undefined,
          });
          if (unifiedContactId) {
            await logUnifiedMessage({
              contactId: unifiedContactId,
              channel: unifiedChannel,
              direction: "inbound",
              content: text,
              externalId: mid || undefined,
            });
            if (await isHumanTakeoverActive(unifiedContactId)) {
              continue; // humano assumiu — bot silencia
            }
          }

          const lower = text.toLowerCase();
          const isRed = RED_FLAGS.some(f => lower.includes(f));

          // 🛡️ MÓDULO 2 — Filtro de assédio (corte seco, pré-LLM)
          if (containsHarassment(text)) {
            if (channel === "instagram") await sendInstagram(senderId, BRISA_HARASSMENT_BLOCK);
            else await sendMessenger(senderId, BRISA_HARASSMENT_BLOCK);
            await supabase.from("meta_messenger_log").insert({
              channel, sender_id: senderId, message_in: text, reply_out: BRISA_HARASSMENT_BLOCK, red_flag: false,
            });
            if (unifiedContactId) {
              await logUnifiedMessage({
                contactId: unifiedContactId, channel: unifiedChannel, direction: "outbound",
                content: BRISA_HARASSMENT_BLOCK, intent: "harassment_block",
              });
            }
            await supabase.from("manus_growth_logs").insert({
              phase: "brisa_omnichannel", action: "harassment_block", status: "ok",
              after_state: { channel, sender_id: senderId, message: text.slice(0, 300) },
            }).then(() => {}).catch(() => {});
            continue;
          }

          // 🌿 MÓDULO 1 — Mensagem oficial de boas-vindas (1º contato ou >24h)
          const { data: lastRow } = await supabase
            .from("meta_messenger_log")
            .select("created_at")
            .eq("sender_id", senderId)
            .eq("channel", channel)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const lastTs = (lastRow as any)?.created_at ?? null;

          let reply: string;
          let trigger = "ai";
          if (isFirstContactOrStale(lastTs)) {
            reply = BRISA_WELCOME_MESSAGE;
            trigger = "welcome_24h";
            await supabase.from("manus_growth_logs").insert({
              phase: "brisa_omnichannel", action: "welcome_sent", status: "ok",
              after_state: { channel, sender_id: senderId, link: "https://plantayraiz.com.br" },
            }).then(() => {}).catch(() => {});
          } else {
            reply = await callBrisaAI(text, senderId, unifiedChannel);
          }

          if (channel === "instagram") await sendInstagram(senderId, reply);
          else await sendMessenger(senderId, reply);

          if (isRed) await notifyDoctorRedFlag(channel, senderId, text);

          await supabase.from("meta_messenger_log").insert({
            channel, sender_id: senderId, message_in: text, reply_out: reply, red_flag: isRed,
          });

          if (unifiedContactId) {
            await logUnifiedMessage({
              contactId: unifiedContactId, channel: unifiedChannel, direction: "outbound",
              content: reply, intent: trigger, urgency: isRed ? 1.0 : undefined,
            });
          }

          if (/plantayraiz\.com\.br/i.test(reply)) {
            await supabase.from("manus_growth_logs").insert({
              phase: "brisa_omnichannel", action: "registration_link_sent", status: "ok",
              after_state: { channel, sender_id: senderId, trigger },
            }).then(() => {}).catch(() => {});
          }
        } catch (e) {
          console.error("event handler error", e);
          await supabase.from("meta_messenger_log").insert({
            channel: "messenger", sender_id: ev?.sender?.id ?? "unknown",
            message_in: ev?.message?.text ?? null, error: String(e),
          });
        }
      }

      // ===== COMENTÁRIOS (FB Page feed + Instagram posts) =====
      const changes = entry.changes ?? [];
      for (const ch of changes) {
        try {
          const field = ch.field;
          const v = ch.value ?? {};
          // FB feed: { item:'comment', verb:'add', comment_id, message, from:{id,name} }
          // IG: { id (comment_id), text, from:{id,username}, media:{id} }
          const isFbComment = field === "feed" && v.item === "comment" && v.verb === "add";
          const isIgComment = field === "comments";
          if (!isFbComment && !isIgComment) continue;

          const channel = isIgComment ? "instagram_comment" : "facebook_comment";
          const commentId: string = v.comment_id || v.id;
          const senderId: string = v.from?.id || "unknown";
          const text: string = v.message || v.text || "";
          if (!commentId || !text) continue;

          // Não responder a si mesmo (evita loop)
          if (senderId === IG_BUSINESS_ID || senderId === Deno.env.get("FACEBOOK_PAGE_ID")) continue;

          // Idempotência
          const { data: dedup, error: dedupErr } = await supabase
            .from("webhook_idempotency")
            .insert({ provider: `meta_${channel}`, message_id: commentId, channel, sender: senderId })
            .select("id")
            .maybeSingle();
          if ((dedupErr && (dedupErr as any).code === "23505") || (!dedup && !dedupErr)) continue;

          // Rate-limit por usuário (5/h para não floodar)
          const { data: allowed } = await supabase.rpc("check_edge_rate_limit", {
            p_bucket: `meta_${channel}`, p_key: senderId, p_max_hits: 5, p_window_seconds: 3600,
          });
          if (allowed === false) continue;

          // Filtro assédio
          if (containsHarassment(text)) {
            await replyComment(commentId, "Comentário removido por violar nossas diretrizes. 🌿");
            continue;
          }

          const lower = text.toLowerCase();
          const isRed = RED_FLAGS.some(f => lower.includes(f));

          // Resposta curta para comentário público (máx 280 chars, sem dados sensíveis)
          const sysComment = BRISA_PERSONA + `
// === COMPLEMENTO COMENTÁRIO PÚBLICO (${channel}) ===
Máx 2 linhas, tom acolhedor, 1 emoji.
NUNCA peça dados pessoais em público.
Convide para conversar no WhatsApp: (11) 99136-3154 ou plantayraiz.com.br.
NUNCA prescreva. NUNCA prometa cura.`;

          let reply: string;
          try {
            const r = await processar_triagem_brisa(text, senderId, channel, { systemPrompt: sysComment });
            reply = (r.reply || "").slice(0, 280) || "Oi 🌿 chama no WhatsApp (11) 99136-3154 que te ajudo!";
          } catch {
            reply = "Oi 🌿 chama no WhatsApp (11) 99136-3154 que te ajudo!";
          }

          await replyComment(commentId, reply);
          if (isRed) await notifyDoctorRedFlag(channel, senderId, text);

          await supabase.from("meta_messenger_log").insert({
            channel, sender_id: senderId, message_in: text, reply_out: reply, red_flag: isRed,
          });

          // 🧠 BRISA 360° — comentário público também alimenta a memória cross-channel
          const cChannel = channel === "instagram_comment" ? "ig_comment" : "fb_comment";
          const cContactId = await upsertUnifiedContact({
            channel: cChannel,
            instagramId: channel === "instagram_comment" ? senderId : undefined,
            facebookPsid: channel === "facebook_comment" ? senderId : undefined,
            instagramUsername: v.from?.username || undefined,
            displayName: v.from?.name || v.from?.username || undefined,
          });
          if (cContactId) {
            await logUnifiedMessage({
              contactId: cContactId, channel: cChannel, direction: "inbound",
              content: text, externalId: commentId,
            });
            await logUnifiedMessage({
              contactId: cContactId, channel: cChannel, direction: "outbound",
              content: reply, intent: "public_comment_reply",
              urgency: isRed ? 1.0 : undefined,
            });
          }
        } catch (e) {
          console.error("[meta] comment handler error", e);
        }
      }
    }
  })();

  return new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders });
});
