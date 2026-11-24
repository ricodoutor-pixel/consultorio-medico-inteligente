// Planta y Raiz: router for the Edge Functions running on our VPS (supabase/edge-runtime).
// Serves POST/GET /functions/v1/<name> (or /<name>) by starting an isolated worker from
// /home/deno/functions/<name>/index.ts. JWT checking follows supabase/config.toml
// (verify_jwt; when a function has no entry, the check is on, as on hosted Supabase).
import * as jose from "https://deno.land/x/jose@v4.15.9/index.ts";

const FUNCTIONS_DIR = "/home/deno/functions";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "";
const PUBLIC_KEYS = [Deno.env.get("SUPABASE_ANON_KEY"), Deno.env.get("SUPABASE_PUBLISHABLE_KEY")]
  .filter((k): k is string => !!k);
const WORKER_ENV = Object.entries(Deno.env.toObject());

// Reads [functions.<name>] verify_jwt from config.toml (a plain line parser, no dependency).
function loadVerifyMap(): Map<string, boolean> {
  const map = new Map<string, boolean>();
  try {
    let current = "";
    for (const raw of Deno.readTextFileSync("/home/deno/config.toml").split("\n")) {
      const line = raw.trim();
      const sec = line.match(/^\[functions\.([A-Za-z0-9_-]+)\]$/);
      if (sec) { current = sec[1]; continue; }
      if (line.startsWith("[")) { current = ""; continue; }
      const v = line.match(/^verify_jwt\s*=\s*(true|false)/);
      if (current && v) map.set(current, v[1] === "true");
    }
  } catch (e) {
    console.error("[router] config.toml unreadable; every function will require JWT", e);
  }
  return map;
}
const VERIFY = loadVerifyMap();

const jwks = SUPABASE_URL
  ? jose.createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  : null;

async function isValidJwt(token: string): Promise<boolean> {
  if (PUBLIC_KEYS.includes(token)) return true; // publishable/anon key = anonymous call, same as hosted
  try {
    const { alg } = jose.decodeProtectedHeader(token);
    if (alg === "HS256") {
      if (!JWT_SECRET) return false;
      await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      return true;
    }
    if (!jwks) return false;
    await jose.jwtVerify(token, jwks);
    return true;
  } catch {
    return false;
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/functions\/v1/, "").split("/").filter(Boolean);
  const name = parts[0] ?? "";

  if (name === "_health") return json(200, { ok: true });
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(name) || name.startsWith("_")) return json(404, { error: "function not found" });

  const servicePath = `${FUNCTIONS_DIR}/${name}`;
  try {
    Deno.statSync(`${servicePath}/index.ts`);
  } catch {
    return json(404, { error: "function not found" });
  }

  // Preflight never needs a token; each function answers OPTIONS with its own CORS rules.
  if (req.method !== "OPTIONS" && (VERIFY.get(name) ?? true)) {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token || !(await isValidJwt(token))) return json(401, { msg: "Invalid JWT" });
  }

  try {
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath,
      memoryLimitMb: 256,
      workerTimeoutMs: 150_000, // same wall clock as the hosted free plan
      noModuleCache: false,
      envVars: WORKER_ENV,
      forceCreate: false,
    });
    return await worker.fetch(req);
  } catch (e) {
    console.error(`[router] ${name} failed`, e);
    return json(500, { error: "function crashed", function: name });
  }
});
