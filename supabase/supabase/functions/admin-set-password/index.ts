// One-shot: set password for a user by email (service-role gated).
// Auth: Bearer SUPABASE_SERVICE_ROLE_KEY or x-cron-secret = BRISA_CEO_SECRET_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const BOOTSTRAP = Deno.env.get("ADMIN_BOOTSTRAP_TOKEN") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const bootstrap = req.headers.get("x-bootstrap-token") || "";
  const bootstrapOk = BOOTSTRAP && bootstrap === BOOTSTRAP;
  if (!bootstrapOk) {
    const unauth = requireServiceAuth(req, corsHeaders);
    if (unauth) return unauth;
  }

  try {
    const { email, password, full_name } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email & password required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Find user paginated
    let userId: string | undefined;
    let page = 1;
    while (!userId) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found) userId = found.id;
      if (!data.users.length || data.users.length < 200) break;
      page++;
    }

    if (!userId) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: full_name ? { full_name } : {},
      });
      if (cErr) throw cErr;
      userId = created.user!.id;
    } else {
      const { error: uErr } = await admin.auth.admin.updateUserById(userId, {
        password, email_confirm: true,
      });
      if (uErr) throw uErr;
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId, email }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
