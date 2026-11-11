// Accepts internal service/cron callers, or a signed-in user holding the server-side admin role.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "./service-auth.ts";

export async function getCallerUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  try {
    const c = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data, error } = await c.auth.getClaims(auth.slice(7).trim());
    return error ? null : (data?.claims?.sub as string) ?? null;
  } catch { return null; }
}

export async function isAdmin(userId: string): Promise<boolean> {
  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await svc.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

export async function requireAdminOrService(req: Request, corsHeaders: Record<string, string>): Promise<Response | null> {
  if (requireServiceAuth(req, corsHeaders) === null) return null;
  const uid = await getCallerUserId(req);
  if (uid && await isAdmin(uid)) return null;
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
