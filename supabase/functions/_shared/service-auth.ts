/**
 * Shared service-role auth guard for internal/cron edge functions.
 *
 * Returns a Response (401) if the request does NOT carry a valid bearer
 * matching SUPABASE_SERVICE_ROLE_KEY, otherwise returns null.
 */
export function requireServiceAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const auth = req.headers.get("Authorization") || "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}
