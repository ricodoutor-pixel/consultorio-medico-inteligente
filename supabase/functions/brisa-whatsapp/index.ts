// Alias for whatsapp-brisa-bot — kept for backwards compatibility with monitoring & n8n.
// Forwards the raw payload to the canonical handler internally.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const target = `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-brisa-bot${url.search}`;
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
