// One-shot provisioning: create/reset admin contato@plantayraiz.com.br,
// remove all other admin roles. Protected by a shared secret.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-provision-secret",
};

const TARGET_EMAIL = "contato@plantayraiz.com.br";
const TARGET_PASSWORD = "95654045Pa#";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const provided = req.headers.get("x-provision-secret") ?? "";
    const expected = Deno.env.get("PROVISION_ADMIN_SECRET") ?? "plantayraiz-2026-provision";
    if (provided !== expected) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 1. Find or create the target user
    let userId: string | null = null;
    const { data: list } = await supa.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => (u.email ?? "").toLowerCase() === TARGET_EMAIL);

    if (existing) {
      userId = existing.id;
      const { error } = await supa.auth.admin.updateUserById(existing.id, {
        password: TARGET_PASSWORD,
        email_confirm: true,
      });
      if (error) throw new Error(`update: ${error.message}`);
    } else {
      const { data, error } = await supa.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Contato Planta y Raiz", signup_role: "admin" },
      });
      if (error || !data.user) throw new Error(`create: ${error?.message}`);
      userId = data.user.id;
    }

    // 2. Remove all other admins
    const { error: delErr } = await supa
      .from("user_roles")
      .delete()
      .eq("role", "admin")
      .neq("user_id", userId!);
    if (delErr) throw new Error(`delete_roles: ${delErr.message}`);

    // 3. Ensure this user has the admin role
    const { error: upErr } = await supa
      .from("user_roles")
      .upsert({ user_id: userId!, role: "admin" }, { onConflict: "user_id,role" });
    if (upErr) throw new Error(`assign_role: ${upErr.message}`);

    return new Response(
      JSON.stringify({ ok: true, admin_user_id: userId, email: TARGET_EMAIL }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
