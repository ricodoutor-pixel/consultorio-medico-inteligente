// Public endpoint that returns the Sentry DSN for client init.
// DSNs are public by design (safe to embed in browsers).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "public, max-age=3600",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const dsn = Deno.env.get("SENTRY_DSN") ?? "";
  return new Response(JSON.stringify({ dsn, environment: Deno.env.get("DENO_DEPLOYMENT_ID") ? "production" : "preview" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
