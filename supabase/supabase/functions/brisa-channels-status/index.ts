// 🛰️ Brisa Channels Status — verifica saúde de WhatsApp (Evolution), IG & FB (Graph API)
// Chamado pelo painel /admin/brisa-ceo a cada 30s. Retorna 200 OK sempre, com map de status.
import { createClient } from "npm:@supabase/supabase-js@2";
import { breakerSnapshot } from "../_shared/brisa-ai.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";

import { FB_PAGE_ACCESS_TOKEN, IG_PAGE_ACCESS_TOKEN } from "../_shared/meta-secrets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") || "";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
const FB_PAGE_TOKEN = FB_PAGE_ACCESS_TOKEN;
const IG_PAGE_TOKEN = IG_PAGE_ACCESS_TOKEN || FB_PAGE_ACCESS_TOKEN;
const IG_BUSINESS_ID = Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID") || "";
const FB_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID") || "";
const EVOLUTION_WA_DR = "5511987131241";

type Status = { ok: boolean; status: number; latency_ms: number; detail?: string };

async function check(url: string, init?: RequestInit): Promise<Status> {
  const t = Date.now();
  try {
    const r = await fetch(url, init);
    const detail = r.ok ? undefined : (await r.text().catch(() => "")).slice(0, 200);
    return { ok: r.ok, status: r.status, latency_ms: Date.now() - t, detail };
  } catch (e) {
    return { ok: false, status: 0, latency_ms: Date.now() - t, detail: String(e).slice(0, 200) };
  }
}

async function alertDoctor(channelLabel: string, st: Status) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return;
  const { shouldSilenceAdminAlert } = await import("../_shared/admin-alert-guard.ts");
  if (shouldSilenceAdminAlert("brisa-channels-status")) return;
  try {

    await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({
        number: EVOLUTION_WA_DR,
        text: `🛰️ *Brisa Channel DOWN*\nCanal: ${channelLabel}\nHTTP: ${st.status}\nLatência: ${st.latency_ms}ms\nDetalhe: ${st.detail || "—"}`,
      }),
    });
  } catch (e) { console.error("[channels-status] alertDoctor failed", e); }
}

async function isAdminJwt(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data } = await sb.auth.getClaims(auth.replace("Bearer ", ""));
    const uid = data?.claims?.sub;
    if (!uid) return false;
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: row } = await svc.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
    return !!row;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth && !(await isAdminJwt(req))) return unauth;

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // 1) WhatsApp Evolution
  const wa: Status = EVOLUTION_API_URL && EVOLUTION_API_KEY
    ? await check(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`, {
        headers: { apikey: EVOLUTION_API_KEY },
      })
    : { ok: false, status: 0, latency_ms: 0, detail: "no_evolution_creds" };

  // 2) Facebook Page — usa FACEBOOK_PAGE_ID quando disponível
  const fb: Status = FB_PAGE_TOKEN
    ? await check(`https://graph.facebook.com/v19.0/${FB_PAGE_ID || "me"}?fields=id,name&access_token=${FB_PAGE_TOKEN}`)
    : { ok: false, status: 0, latency_ms: 0, detail: "no_fb_creds" };

  // 3) Instagram Business — usa INSTAGRAM_BUSINESS_ACCOUNT_ID (mais confiável que /me)
  const ig: Status = IG_PAGE_TOKEN && IG_BUSINESS_ID
    ? await check(`https://graph.facebook.com/v19.0/${IG_BUSINESS_ID}?fields=id,username&access_token=${IG_PAGE_TOKEN}`)
    : IG_PAGE_TOKEN
    ? await check(`https://graph.facebook.com/v19.0/me?fields=id,username&access_token=${IG_PAGE_TOKEN}`)
    : { ok: false, status: 0, latency_ms: 0, detail: "no_ig_creds" };

  // Alerta o Dr. Edilson quando qualquer canal cai (1x a cada 10min por canal)
  const channels = { whatsapp: wa, facebook: fb, instagram: ig };
  for (const [name, st] of Object.entries(channels)) {
    if (st.ok) continue;
    try {
      const since = new Date(Date.now() - 10 * 60_000).toISOString();
      const { count } = await sb.from("brisa_interaction_logs").select("id", { count: "exact", head: true })
        .eq("channel", "channel_down_alert").eq("user_ref", name).gte("created_at", since);
      if ((count ?? 0) === 0) {
        await alertDoctor(name, st);
        await sb.from("brisa_interaction_logs").insert({
          channel: "channel_down_alert", user_ref: name, status: "alert",
          http_status: st.status, latency_ms: st.latency_ms, error: st.detail,
          meta: { channels_snapshot: channels },
        });
      }
    } catch (e) { console.error("[channels-status] alert dedup failed", e); }
  }

  return new Response(JSON.stringify({
    ok: true,
    checked_at: new Date().toISOString(),
    channels,
    breaker: breakerSnapshot(),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
