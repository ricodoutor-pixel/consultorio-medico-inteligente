import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { getCallerUserId, isAdmin } from "../_shared/admin-auth.ts";

const redirectTo = "https://plantayraiz.com.br/redefinir-senha";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const headers = { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const userId = await getCallerUserId(req);
    if (!userId || !await isAdmin(userId)) return reply({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return reply({ error: "Unavailable" }, 503);
    const client = createClient(url, key, { auth: { persistSession: false } });
    if (body.action === "list") {
      const { data: doctors, error } = await client.from("doctors")
        .select("id,user_id,crm,crm_state,is_approved_by_admin,approval_status,suspended_at")
        .order("created_at", { ascending: true }).limit(1000);
      if (error) return reply({ error: "Directory unavailable" }, 503);
      const result = [];
      // Only auth administrators receive email addresses; no password or metadata leaves the server.
      for (const doctor of doctors ?? []) {
        const { data, error: authError } = await client.auth.admin.getUserById(doctor.user_id);
        if (authError) return reply({ error: "Account lookup unavailable" }, 503);
        const user = data.user;
        result.push({ ...doctor, email: user?.email ?? null, email_confirmed: !!user?.email_confirmed_at,
          auth_blocked: !!user?.banned_until && Date.parse(user.banned_until) > Date.now() });
      }
      return reply({ doctors: result });
    }
    if (body.action === "reset" && typeof body.doctor_id === "string" && /^[0-9a-f-]{36}$/i.test(body.doctor_id)) {
      const { data: doctor, error } = await client.from("doctors").select("user_id").eq("id", body.doctor_id).maybeSingle();
      if (error || !doctor) return reply({ error: "Doctor not found" }, 404);
      const { data, error: userError } = await client.auth.admin.getUserById(doctor.user_id);
      if (userError || !data.user?.email) return reply({ error: "Account unavailable" }, 503);
      const { error: resetError } = await client.auth.resetPasswordForEmail(data.user.email, { redirectTo });
      if (resetError) return reply({ error: "Reset unavailable", code: resetError.code, status: resetError.status }, resetError.status === 429 ? 429 : 503);
      return reply({ accepted: true });
    }
    return reply({ error: "Invalid request" }, 400);
  } catch { return reply({ error: "Unavailable" }, 503); }
});