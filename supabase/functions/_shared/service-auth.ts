/**
 * Shared service-role auth guard for internal/cron edge functions.
 *
 * Accepts:
 *  - Bearer SUPABASE_SERVICE_ROLE_KEY
 *  - Bearer BRISA_CEO_SECRET_KEY (env)
 *  - Header x-cron-secret matching BRISA_CEO_SECRET_KEY (env)
 *  - Header x-cron-secret matching public.private_get_brisa_cron_secret() (vault fallback)
 *
 * The vault fallback uses the service-role key to call the SECURITY DEFINER
 * RPC and pull the canonical secret, so env drift (corrupted/old values)
 * stops blocking legit cron requests.
 */
let _vaultCache: { value: string; at: number } | null = null;

async function readVaultSecret(): Promise<string> {
  const now = Date.now();
  if (_vaultCache && now - _vaultCache.at < 60_000) return _vaultCache.value;

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return "";

  try {
    const r = await fetch(`${url}/rest/v1/rpc/private_get_brisa_cron_secret`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!r.ok) {
      await r.text();
      return "";
    }
    const v = (await r.text()).trim().replace(/^"|"$/g, "");
    _vaultCache = { value: v, at: now };
    return v;
  } catch {
    return "";
  }
}

export async function requireServiceAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const cronEnv = Deno.env.get("BRISA_CEO_SECRET_KEY") || "";
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const xCron = req.headers.get("x-cron-secret") || "";

  let ok =
    (service && auth === service) ||
    (cronEnv && (auth === cronEnv || xCron === cronEnv));

  if (!ok && xCron) {
    const vaultSecret = await readVaultSecret();
    if (vaultSecret && xCron === vaultSecret) ok = true;
  }

  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}
