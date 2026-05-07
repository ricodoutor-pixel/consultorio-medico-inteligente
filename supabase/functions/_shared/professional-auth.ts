import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Allows requests from:
 *  - Service role (SUPABASE_SERVICE_ROLE_KEY bearer)
 *  - The owning professional (auth.uid() === professionalId)
 *  - An admin (user_roles.role = 'admin')
 *
 * Returns null if authorized, otherwise a 401/403 Response.
 */
export async function requireProfessionalAccess(
  req: Request,
  professionalId: string,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const auth = req.headers.get("Authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (serviceKey && token === serviceKey) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const uid = data.claims.sub as string;
  if (uid === professionalId) return null;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .eq("role", "admin")
    .maybeSingle();

  if (roleRow) return null;

  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
