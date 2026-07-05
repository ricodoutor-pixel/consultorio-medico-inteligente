// Internal uptime monitor — pings critical routes, logs status, opens alerts on failure
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = "https://plantayraiz.com.br";
const ROUTES = ["/", "/planos-tratamento", "/quiz-triagem"];
const TIMEOUT_MS = 10_000;

async function ping(route: string) {
  const url = `${BASE}${route}`;
  const started = Date.now();
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: ctl.signal });
    clearTimeout(t);
    const latency = Date.now() - started;
    return { route, url, status_code: res.status, latency_ms: latency, is_up: res.ok, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (e: any) {
    clearTimeout(t);
    return { route, url, status_code: null, latency_ms: Date.now() - started, is_up: false, error: e?.message ?? "fetch_failed" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;


  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results = await Promise.all(ROUTES.map(ping));

  await supabase.from("uptime_log").insert(results);

  // Open alerts for routes that are down (and don't already have an unresolved alert)
  for (const r of results) {
    if (r.is_up) continue;
    const { data: existing } = await supabase
      .from("uptime_alerts")
      .select("id")
      .eq("route", r.route)
      .is("resolved_at", null)
      .limit(1);
    if (!existing?.length) {
      await supabase.from("uptime_alerts").insert({
        route: r.route, status_code: r.status_code, error: r.error,
      });
      // Discord SRE webhook (optional)
      const hook = Deno.env.get("DISCORD_SRE_WEBHOOK_URL");
      if (hook) {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: `🚨 **UPTIME ALERT** — ${r.url} está fora do ar (${r.error})` }),
        }).catch(() => {});
      }
    }
  }

  // Auto-resolve alerts for routes that are back up
  for (const r of results) {
    if (!r.is_up) continue;
    await supabase
      .from("uptime_alerts")
      .update({ resolved_at: new Date().toISOString() })
      .eq("route", r.route)
      .is("resolved_at", null);
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
