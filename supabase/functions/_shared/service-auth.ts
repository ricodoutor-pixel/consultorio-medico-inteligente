/**
 * Shared service-role auth guard for internal/cron edge functions.
 *
 * Accepts:
 *  - Bearer SUPABASE_SERVICE_ROLE_KEY
 *  - Bearer/x-cron-secret matching BRISA_CEO_SECRET_KEY (env)
 *  - x-cron-secret matching the vault value of BRISA_CEO_SECRET_KEY
 *    (loaded once at module init via top-level await — keeps the guard sync)
 */

const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CRON_ENV = Deno.env.get("BRISA_CEO_SECRET_KEY") || "";

async function loadVaultSecret(): Promise<string> {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url || !SERVICE) return "";
  try {
    const r = await fetch(`${url}/rest/v1/rpc/private_get_brisa_cron_secret`, {
      method: "POST",
      headers: {
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!r.ok) { await r.text(); return ""; }
    return (await r.text()).trim().replace(/^"|"$/g, "");
  } catch {
    return "";
  }
}

const CRON_VAULT = await loadVaultSecret();

export function requireServiceAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const xCron = req.headers.get("x-cron-secret") || "";

  const ok =
    (SERVICE && auth === SERVICE) ||
    (CRON_ENV && (auth === CRON_ENV || xCron === CRON_ENV)) ||
    (CRON_VAULT && (auth === CRON_VAULT || xCron === CRON_VAULT));

  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}
