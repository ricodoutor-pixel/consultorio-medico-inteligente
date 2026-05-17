/**
 * Shared service-role auth guard for internal/cron edge functions.
 *
 * Accepts any of:
 *  - Bearer SUPABASE_SERVICE_ROLE_KEY  (real service role)
 *  - Bearer SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEY  (used by pg_cron / pg_net)
 *  - Bearer BRISA_CEO_SECRET_KEY  (shared cron secret)
 *  - Header x-cron-secret matching BRISA_CEO_SECRET_KEY
 *
 * Returns 401 Response if none match, else null.
 */
export function requireServiceAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const cronSecret = Deno.env.get("BRISA_CEO_SECRET_KEY") || "";
  // Public anon JWT (safe to embed — already exposed in client). Used by pg_cron callers.
  const PUBLIC_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ";

  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const xCron = req.headers.get("x-cron-secret") || "";

  const ok =
    (service && auth === service) ||
    (anon && auth === anon) ||
    (cronSecret && (auth === cronSecret || xCron === cronSecret));

  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}
