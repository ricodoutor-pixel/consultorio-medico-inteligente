// 🔐 Shared guard for AI-powered edge functions.
// - requireAuthedUser: validates the caller's Supabase JWT and returns the user id
// - rateLimit: per-key (user id or IP) throttle via check_edge_rate_limit RPC
// - clientIp / assertPayloadSize helpers
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export function clientIp(req: Request): string {
  return (
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Validates the Authorization bearer token. Returns the user id or an error Response. */
export async function requireAuthedUser(
  req: Request,
  cors: Record<string, string>,
): Promise<{ userId: string } | Response> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Unauthorized" }, 401, cors);
  }
  const token = auth.slice(7).trim();
  try {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    const { data, error } = await supabase.auth.getClaims(token);
    const sub = data?.claims?.sub as string | undefined;
    if (error || !sub) return json({ error: "Unauthorized" }, 401, cors);
    return { userId: sub };
  } catch {
    return json({ error: "Unauthorized" }, 401, cors);
  }
}

/** Returns true when the user has an admin or doctor role. */
export async function hasClinicalRole(userId: string): Promise<boolean> {
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const [{ data: roles }, { data: doctor }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", userId),
      admin.from("doctors").select("id").eq("user_id", userId).maybeSingle(),
    ]);
    if (doctor) return true;
    return (roles || []).some((r: { role: string }) =>
      r.role === "admin" || r.role === "moderator" || r.role === "doctor"
    );
  } catch {
    return false;
  }
}

/** Throttles by key. Returns an error Response when the limit is exceeded. */
export async function rateLimit(
  opts: {
    bucket: string;
    key: string;
    maxHits?: number;
    windowSeconds?: number;
    cors: Record<string, string>;
    message?: string;
  },
): Promise<Response | null> {
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: ok } = await admin.rpc("check_edge_rate_limit", {
      p_bucket: opts.bucket,
      p_key: opts.key,
      p_max_hits: opts.maxHits ?? 20,
      p_window_seconds: opts.windowSeconds ?? 60,
    });
    if (ok === false) {
      return json(
        { error: opts.message || "Muitas requisições. Tente novamente em instantes." },
        429,
        opts.cors,
      );
    }
  } catch {
    // fail-open on infra error, never block legitimate clinical usage
  }
  return null;
}

/** Rejects oversized payloads before forwarding them to a paid AI provider. */
export function assertPayloadSize(
  value: unknown,
  maxChars: number,
  cors: Record<string, string>,
): Response | null {
  if (typeof value === "string" && value.length > maxChars) {
    return json({ error: "Payload too large" }, 413, cors);
  }
  return null;
}
