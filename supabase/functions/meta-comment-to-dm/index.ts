/**
 * meta-comment-to-dm
 * Webhook Meta (Instagram/Facebook) — captura comentários com keywords
 * e responde + puxa autor para DM (Private Reply API)
 *
 * Flow:
 *  1. Recebe webhook do Meta (feed/comments)
 *  2. Valida HMAC X-Hub-Signature-256
 *  3. Filtra por keyword (PROTOCOLO, QUERO, INFO, CANNABIS, RECEITA, PRECO)
 *  4. Dedup por comment_id
 *  5. Rate-limit por author_id (3/hora)
 *  6. Responde comentário publicamente (curto, sem CRM/Dr.)
 *  7. Envia Private Reply → abre DM
 *  8. Cria contato unificado + log conversa
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  upsertUnifiedContact,
  logUnifiedMessage,
} from "../_shared/brisa-memory.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";
const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") ?? "plantayraiz-verify";
const FB_PAGE_TOKEN = Deno.env.get("FB_PAGE_ACCESS_TOKEN") ?? "";
const IG_PAGE_TOKEN = Deno.env.get("IG_PAGE_ACCESS_TOKEN") ?? FB_PAGE_TOKEN;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const KEYWORDS = ["PROTOCOLO", "QUERO", "INFO", "CANNABIS", "RECEITA", "PRECO", "PREÇO", "COMO FAZ"];

const PUBLIC_REPLY =
  "Oi! Já te chamei no Direct/Inbox com as informações da Planta y Raíz. Confere lá 🌱";

const DM_OPENER =
  "Olá! Sou a Enfª Brisa da Planta y Raíz — plataforma de saúde digital especializada em terapias integrativas. " +
  "Vi seu comentário e estou aqui para te orientar. Pra começar, me confirma: você busca informação para você ou para alguém da família?";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function verifyHmac(req: Request, raw: string): Promise<boolean> {
  if (!META_APP_SECRET) return true; // dev mode
  const sig = req.headers.get("x-hub-signature-256");
  if (!sig?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(META_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256=${hex}` === sig;
}

function matchKeyword(text: string): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();
  return KEYWORDS.find((k) => upper.includes(k)) ?? null;
}

async function isDuplicate(commentId: string): Promise<boolean> {
  const { data } = await supabase
    .from("webhook_idempotency")
    .select("id")
    .eq("provider", "meta_comment")
    .eq("idempotency_key", commentId)
    .maybeSingle();
  if (data) return true;
  await supabase
    .from("webhook_idempotency")
    .insert({ provider: "meta_comment", idempotency_key: commentId });
  return false;
}

async function checkRateLimit(authorId: string): Promise<boolean> {
  const { data } = await supabase.rpc("check_edge_rate_limit", {
    p_bucket: "meta_comment_author",
    p_key: authorId,
    p_max_hits: 3,
    p_window_seconds: 3600,
  });
  return data === true;
}

async function replyToComment(commentId: string, message: string, isInstagram: boolean) {
  const token = isInstagram ? IG_PAGE_TOKEN : FB_PAGE_TOKEN;
  if (!token) return { ok: false, reason: "no_page_token" };
  const url = `https://graph.facebook.com/v18.0/${commentId}/comments`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: token }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: json };
}

async function privateReply(commentId: string, message: string, isInstagram: boolean) {
  const token = isInstagram ? IG_PAGE_TOKEN : FB_PAGE_TOKEN;
  if (!token) return { ok: false, reason: "no_page_token" };
  const pageId = isInstagram ? "me" : "me";
  const url = `https://graph.facebook.com/v18.0/${pageId}/messages?access_token=${token}`;
  const body = {
    recipient: { comment_id: commentId },
    message: { text: message },
    messaging_type: "RESPONSE",
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: json };
}

async function handleComment(entry: any, isInstagram: boolean) {
  const change = entry.changes?.[0];
  const value = change?.value;
  if (!value) return { skipped: "no_value" };

  const commentId: string = value.comment_id ?? value.id;
  const authorId: string = value.from?.id ?? value.sender_id ?? "unknown";
  const authorName: string = value.from?.name ?? value.from?.username ?? "Visitante";
  const text: string = value.message ?? value.text ?? "";

  if (!commentId || !text) return { skipped: "no_content" };

  const keyword = matchKeyword(text);
  if (!keyword) return { skipped: "no_keyword", text };

  if (await isDuplicate(commentId)) return { skipped: "duplicate", commentId };

  if (!(await checkRateLimit(authorId))) {
    return { skipped: "rate_limited", authorId };
  }

  const channel = isInstagram ? "ig_comment" : "fb_comment";

  // 1. Cria contato unificado
  const contactId = await upsertUnifiedContact({
    channel: channel as any,
    instagramId: isInstagram ? authorId : undefined,
    instagramUsername: isInstagram ? value.from?.username : undefined,
    facebookPsid: isInstagram ? undefined : authorId,
    displayName: authorName,
  });

  // 2. Loga o comentário recebido
  if (contactId) {
    await logUnifiedMessage({
      contactId,
      channel: channel as any,
      direction: "inbound",
      content: text,
      externalId: commentId,
      intent: `keyword_${keyword.toLowerCase()}`,
      raw: value,
    });
  }

  // 3. Responde publicamente no comentário
  const publicReply = await replyToComment(commentId, PUBLIC_REPLY, isInstagram);

  // 4. Puxa para DM (Private Reply)
  const dmResult = await privateReply(commentId, DM_OPENER, isInstagram);

  // 5. Loga as ações outbound
  if (contactId) {
    await logUnifiedMessage({
      contactId,
      channel: channel as any,
      direction: "outbound",
      content: PUBLIC_REPLY,
      intent: "public_acknowledge",
    });
    await logUnifiedMessage({
      contactId,
      channel: isInstagram ? "instagram_dm" : "messenger" as any,
      direction: "outbound",
      content: DM_OPENER,
      intent: "dm_opener",
    });
  }

  return {
    ok: true,
    commentId,
    keyword,
    contactId,
    publicReply: publicReply.ok,
    dm: dmResult.ok,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // GET = Meta webhook verification challenge
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200, headers: corsHeaders });
    }
    return new Response("forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  const raw = await req.text();
  const validHmac = await verifyHmac(req, raw);
  if (!validHmac) {
    console.warn("[meta-comment-to-dm] invalid HMAC");
    return new Response(JSON.stringify({ error: "invalid_signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400, headers: corsHeaders });
  }

  const results: any[] = [];
  for (const entry of body.entry ?? []) {
    const isInstagram = body.object === "instagram";
    try {
      const r = await handleComment(entry, isInstagram);
      results.push(r);
    } catch (e) {
      console.error("[meta-comment-to-dm] entry error:", e);
      results.push({ error: String(e) });
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
