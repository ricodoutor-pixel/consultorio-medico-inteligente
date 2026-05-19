/**
 * Shared service-role auth guard for internal/cron edge functions.
 *
 * Accepts ONLY:
 *  - Bearer SUPABASE_SERVICE_ROLE_KEY   (real service role)
 *  - Bearer BRISA_CEO_SECRET_KEY        (shared cron secret)
 *  - Header x-cron-secret matching BRISA_CEO_SECRET_KEY
 *
 * The public anon / publishable key is NOT accepted — it would let any
 * frontend visitor invoke privileged internal endpoints.
 *
 * Returns 401 Response if none match, else null.
 */
export function requireServiceAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const cronSecret = Deno.env.get("BRISA_CEO_SECRET_KEY") || "";

  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const xCron = req.headers.get("x-cron-secret") || "";

  const ok =
    (service && auth === service) ||
    (cronSecret && (auth === cronSecret || xCron === cronSecret));



  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}
