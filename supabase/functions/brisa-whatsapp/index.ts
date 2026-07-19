// Alias for brisa-waha-bot — canonical WAHA WhatsApp entrypoint (migrated from Evolution API, 2026-07-19).
// Kept for backwards compatibility with existing monitoring/health-check references to this path.
// Forwards the raw payload to the canonical WAHA handler internally.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const target = `${Deno.env.get("SUPABASE_URL")}/functions/v1/brisa-waha-bot${url.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": req.headers.get("content-type") || "application/json",
      "x-webhook-secret": req.headers.get("x-webhook-secret") || "",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
  };
  const r = await fetch(target, init);
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
