// One-shot trigger that invokes brisa-ig-auto-post or brisa-fb-auto-post.
// Requires authentication: ?token=BRISA_CEO_SECRET_KEY OR Bearer service-role/cron secret.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const secret = Deno.env.get("BRISA_CEO_SECRET_KEY") || "";
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const url = new URL(req.url);

  // Accept ?token=… as an additional auth path; otherwise enforce service auth.
  const providedToken = url.searchParams.get("token") || "";
  const tokenOk = secret && providedToken === secret;
  if (!tokenOk) {
    const unauth = requireServiceAuth(req, cors);
    if (unauth) return unauth;
  }

  if (!secret) {
    return new Response(JSON.stringify({ error: "BRISA_CEO_SECRET_KEY not set in runtime" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const target = url.searchParams.get("target") || "ig";
  const fn = target === "fb" ? "brisa-fb-auto-post" : "brisa-ig-auto-post";
  const endpoint = `${supabaseUrl}/functions/v1/${fn}`;

  const started = Date.now();
  let status = 0;
  let body: unknown = null;
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": secret, Authorization: `Bearer ${secret}` },
      body: "{}",
    });
    status = r.status;
    body = await r.json().catch(async () => ({ raw: await r.text() }));
  } catch (e) {
    body = { fetch_error: String(e) };
  }
  const latency = Date.now() - started;

  try {
    const sb = createClient(supabaseUrl, svc);
    await sb.from("ai_events").insert({
      ai_name: "brisa_manual_trigger",
      event_type: `manual_${target}_post`,
      status: status >= 200 && status < 300 ? "completed" : "error",
      output_data: { http_status: status, latency_ms: latency, response: body, target, fn },
    });
  } catch (e) {
    console.error("ai_events insert failed:", e);
  }

  return new Response(JSON.stringify({ ok: status >= 200 && status < 300, status, latency_ms: latency, response: body }), {
    status: 200, headers: { ...cors, "Content-Type": "application/json" },
  });
});
