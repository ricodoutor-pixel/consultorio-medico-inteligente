// Diagnostic endpoint — DISABLED.
// Previously leaked SHA-256 + length + first/last bytes of BRISA_CEO_SECRET_KEY.
// Kept as a 410 Gone stub to avoid breaking deployed routes.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  return new Response(
    JSON.stringify({ error: "Endpoint disabled for security reasons." }),
    { status: 410, headers: { ...cors, "Content-Type": "application/json" } },
  );
});
