/**
 * BRISA HEALTH CHECK
 * --------------------------------------------------------------
 * Endpoint público (admin-only via verificação de role) que reporta
 * o status em tempo real dos secrets, webhooks e bots da Brisa 360°.
 *
 * Resposta:
 *   {
 *     secrets:  { name, ok, source }[],
 *     webhooks: { name, ok, url, hint }[],
 *     bots:     { name, ok, lastSeen }[],
 *     overall:  "green" | "yellow" | "red",
 *     checkedAt: ISO
 *   }
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { metaSecretsHealth } from "../_shared/meta-secrets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function hasEnv(...names: string[]): { ok: boolean; source: string } {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v && v.length > 0) return { ok: true, source: n };
  }
  return { ok: false, source: names[0] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Auth: só admins
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: userData } = await supabase.auth.getUser(jwt);
  const uid = userData?.user?.id;
  if (!uid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── 1. SECRETS
  const meta = metaSecretsHealth();
  const secrets = [
    { name: "META_APP_SECRET", ok: meta.META_APP_SECRET, hint: "Facebook Developers → App Settings → Basic" },
    { name: "FB_PAGE_ACCESS_TOKEN", ok: meta.FB_PAGE_ACCESS_TOKEN, hint: "Graph API Explorer → Page Token permanente" },
    { name: "IG_PAGE_ACCESS_TOKEN", ok: meta.IG_PAGE_ACCESS_TOKEN, hint: "Mesma página FB com IG Business vinculado" },
    { name: "EVOLUTION_API_URL", ok: hasEnv("EVOLUTION_API_URL").ok, hint: "URL da Evolution API (WhatsApp)" },
    { name: "EVOLUTION_API_KEY", ok: hasEnv("EVOLUTION_API_KEY").ok, hint: "API key da instância Brisa_CEO" },
    { name: "EVOLUTION_WEBHOOK_SECRET", ok: hasEnv("EVOLUTION_WEBHOOK_SECRET").ok, hint: "Shared secret do webhook Evolution" },
    { name: "GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY", ok: hasEnv("GOOGLE_GENERATIVE_AI_API_KEY", "GEMINI_API_KEY").ok, hint: "Motor de IA da Brisa (Google Gemini direto)" },
    { name: "MERCADO_PAGO_ACCESS_TOKEN", ok: hasEnv("MERCADO_PAGO_ACCESS_TOKEN").ok, hint: "Geração de links PIX R$30" },
  ];

  // ── 2. WEBHOOKS (ping HEAD nas próprias edge functions)
  const base = Deno.env.get("SUPABASE_URL")!;
  const webhookList = [
    { name: "meta-comment-to-dm", url: `${base}/functions/v1/meta-comment-to-dm`, hint: "Configurar no Meta Developer Console (verify token: plantayraiz-verify)" },
    { name: "whatsapp-brisa-bot", url: `${base}/functions/v1/whatsapp-brisa-bot`, hint: "Evolution API → Settings → Webhook URL" },
    { name: "brisa-whatsapp", url: `${base}/functions/v1/brisa-whatsapp`, hint: "Webhook legado WhatsApp" },
    { name: "meta-messenger-bot", url: `${base}/functions/v1/meta-messenger-bot`, hint: "Messenger + Instagram DM webhook" },
  ];
  const webhooks = await Promise.all(
    webhookList.map(async (w) => {
      try {
        const r = await fetch(w.url, { method: "OPTIONS", signal: AbortSignal.timeout(3000) });
        // 200/204/401/405 = endpoint vivo. 5xx ou network error = down.
        return { ...w, ok: r.status < 500 };
      } catch {
        return { ...w, ok: false };
      }
    }),
  );

  // ── 3. BOTS — última mensagem registrada por canal
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: lastMsgs } = await supabase
    .from("brisa_unified_conversations")
    .select("channel, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  const byChannel = new Map<string, string>();
  for (const m of lastMsgs ?? []) {
    if (!byChannel.has(m.channel)) byChannel.set(m.channel, m.created_at);
  }
  const bots = [
    { name: "WhatsApp (Evolution)", channel: "whatsapp" },
    { name: "Instagram DM", channel: "instagram_dm" },
    { name: "Messenger", channel: "messenger" },
    { name: "Comentários FB/IG", channel: "ig_comment" },
  ].map((b) => ({
    name: b.name,
    lastSeen: byChannel.get(b.channel) ?? null,
    ok: byChannel.has(b.channel),
  }));

  // ── Overall
  const failingSecrets = secrets.filter((s) => !s.ok).length;
  const failingWebhooks = webhooks.filter((w) => !w.ok).length;
  let overall: "green" | "yellow" | "red" = "green";
  if (failingWebhooks > 0 || failingSecrets >= 3) overall = "red";
  else if (failingSecrets > 0) overall = "yellow";

  return new Response(
    JSON.stringify({
      overall,
      secrets,
      webhooks,
      bots,
      checkedAt: new Date().toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
