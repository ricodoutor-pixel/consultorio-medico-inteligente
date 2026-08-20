// Renova o Facebook/Instagram long-lived token (60 dias) usando App Secret.
// Rodar 1x/semana via pg_cron. Armazena no Supabase em meta_token_storage.
// fb-page-token.ts deve preferir esse token sobre env var.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH = "https://graph.facebook.com/v19.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const APP_ID = Deno.env.get("FACEBOOK_APP_ID") || "931014069567110";
  const APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET") || "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (!APP_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: "FACEBOOK_APP_SECRET missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1) Pega o token atual: DB primeiro, env como fallback
  const { data: stored } = await supabase
    .from("meta_token_storage")
    .select("token, expires_at")
    .eq("id", "facebook_page")
    .maybeSingle();

  const currentToken = stored?.token || Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN") || "";
  if (!currentToken) {
    return new Response(JSON.stringify({ ok: false, error: "No current token to refresh" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2) Troca por long-lived (60 dias)
  const exchangeUrl = `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token` +
    `&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${currentToken}`;

  const r1 = await fetch(exchangeUrl);
  const j1 = await r1.json();
  if (!r1.ok || !j1.access_token) {
    await supabase.from("ai_events").insert({
      ai_name: "refresh_meta_token", event_type: "exchange_failed", status: "error",
      output_data: { error: j1 },
    });
    await supabase.from("manus_growth_logs").insert({
      phase: "infra_maintenance",
      action: "refresh_meta_token",
      status: "error",
      error_message: JSON.stringify(j1).slice(0, 500),
    });
    return new Response(JSON.stringify({ ok: false, stage: "exchange", error: j1 }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const longLivedUserToken = j1.access_token as string;
  const expiresInSec = (j1.expires_in as number) || 60 * 24 * 3600;
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();

  // 3) Deriva Page token (não expira quando vem de user long-lived)
  const PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID") || "1104301376097224";
  const r2 = await fetch(`${GRAPH}/me/accounts?access_token=${longLivedUserToken}`);
  const j2 = await r2.json();
  const page = j2?.data?.find((p: { id: string }) => p.id === PAGE_ID);
  const pageToken = page?.access_token || longLivedUserToken;

  // 4) Persiste
  const { error: upsertErr } = await supabase.from("meta_token_storage").upsert({
    id: "facebook_page",
    token: pageToken,
    user_token: longLivedUserToken,
    expires_at: expiresAt,
    refreshed_at: new Date().toISOString(),
  });

  if (upsertErr) {
    return new Response(JSON.stringify({ ok: false, stage: "persist", error: upsertErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabase.from("ai_events").insert({
    ai_name: "refresh_meta_token", event_type: "token_refreshed", status: "completed",
    output_data: { expires_at: expiresAt, page_id: PAGE_ID, derived_page_token: !!page?.access_token },
  });

  // Log no painel admin Manus Growth
  await supabase.from("manus_growth_logs").insert({
    phase: "infra_maintenance",
    action: "refresh_meta_token",
    status: "success",
    after_state: {
      expires_at: expiresAt,
      page_id: PAGE_ID,
      derived_page_token: !!page?.access_token,
      next_refresh_due: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    },
  });

  return new Response(JSON.stringify({
    ok: true, expires_at: expiresAt, page_id: PAGE_ID, derived_page_token: !!page?.access_token,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
