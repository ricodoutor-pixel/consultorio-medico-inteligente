// One-shot admin bootstrap for Dra. Olivia Zimeri (Bolivia)
// POST: { email, password, full_name, ... } -> creates auth user + profile + doctor + role
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
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1) Create auth user (email confirmed)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: "doctor", country },
    });
    if (createErr) throw createErr;
    const userId = created.user!.id;

    // 2) Upsert profile
    await supabase.from("profiles").upsert({
      id: userId,
      full_name,
      phone: whatsapp ?? null,
      country,
      user_type: "doctor",
      signup_role: "doctor",
      avatar_url: avatar_url ?? null,
    });

    // 3) Insert doctor row
    const { error: docErr } = await supabase.from("doctors").insert({
      user_id: userId,
      crm: "OLIVIA-BO-2026",
      crm_state: "BO",
      specialty,
      bio: bio ?? "Especialista en Medicina Integrativa. Directora Técnica de Planta y Raiz para Bolivia. Atención humanizada con enfoque en cannabis medicinal y salud integral.",
      consultation_price,
      document_type: "ci",
      country,
      city,
      is_verified: true,
      is_online: true,
      is_available: true,
      kyc_status: "approved",
      plan_tier: "premium",
    });
    if (docErr) throw docErr;

    // 4) Role
    await supabase.from("user_roles").insert({ user_id: userId, role: "user" });

    return new Response(
      JSON.stringify({ ok: true, user_id: userId, email, message: "Doctor created" }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
