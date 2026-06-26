// One-shot admin bootstrap (idempotent) for Dra. Olivia Zimeri (Bolivia)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const {
      email,
      password,
      full_name,
      whatsapp,
      country = "BO",
      city = "Cochabamba",
      specialty = "Medicina Integrativa",
      bio,
      consultation_price = 50,
      avatar_url,
    } = body;

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "email, password, full_name required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find or create user
    let userId: string | undefined;
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name, role: "doctor", country },
    });

    if (createErr) {
      // already exists -> find via listUsers paginated
      let page = 1;
      while (!userId) {
        const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        if (listErr) throw listErr;
        const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (found) userId = found.id;
        if (!list.users.length || list.users.length < 200) break;
        page++;
      }
      if (!userId) throw createErr;
      // reset password
      await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      userId = created.user!.id;
    }

    // Upsert profile
    await supabase.from("profiles").upsert({
      id: userId, full_name, phone: whatsapp ?? null, country,
      user_type: "doctor", signup_role: "doctor", avatar_url: avatar_url ?? null,
    });

    // Upsert doctor (check existing)
    const { data: existingDoc } = await supabase.from("doctors").select("id").eq("user_id", userId).maybeSingle();
    const doctorPayload = {
      user_id: userId,
      crm: "OLIVIA-BO-2026",
      crm_state: "BO",
      specialty,
      bio: bio ?? "Especialista en Medicina Integrativa. Directora Técnica de Planta y Raiz para Bolivia.",
      consultation_price,
      document_type: "ci",
      country, city,
      is_verified: true, is_online: true, is_available: true,
      kyc_status: "verified", plan_tier: "premium",
    };
    if (existingDoc) {
      await supabase.from("doctors").update(doctorPayload).eq("id", existingDoc.id);
    } else {
      const { error: docErr } = await supabase.from("doctors").insert(doctorPayload);
      if (docErr) throw docErr;
    }

    // Role (idempotent)
    await supabase.from("user_roles").upsert({ user_id: userId, role: "user" }, { onConflict: "user_id,role" });

    return new Response(
      JSON.stringify({ ok: true, user_id: userId, email, message: "Doctor ready" }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
