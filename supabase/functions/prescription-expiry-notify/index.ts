import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;


  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find prescriptions expiring in 7 days
    const { data: expiring7, error: err7 } = await supabase
      .from("prescriptions")
      .select("id, patient_id, valid_until, medications, doctor_id")
      .eq("status", "active")
      .gte("valid_until", now.toISOString())
      .lte("valid_until", in7days.toISOString());

    if (err7) throw err7;

    // Find prescriptions expiring in 3 days (more urgent)
    const { data: expiring3, error: err3 } = await supabase
      .from("prescriptions")
      .select("id, patient_id, valid_until, medications, doctor_id")
      .eq("status", "active")
      .gte("valid_until", now.toISOString())
      .lte("valid_until", in3days.toISOString());

    if (err3) throw err3;

    let notificationsCreated = 0;

    // Send 7-day warning notifications
    for (const rx of (expiring7 || [])) {
      const daysLeft = Math.ceil((new Date(rx.valid_until!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if notification already sent
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", rx.patient_id)
        .eq("type", "prescription_expiry")
        .ilike("message", `%${rx.id}%`)
        .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

      if (existing && existing.length > 0) continue;

      const isUrgent = daysLeft <= 3;

      await supabase.from("notifications").insert({
        user_id: rx.patient_id,
        type: "prescription_expiry",
        title: isUrgent ? "⚠️ Receita vence em breve!" : "📋 Sua receita está vencendo",
        message: isUrgent
          ? `Sua receita vence em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}! Renove agora para não ficar sem medicação. [ID: ${rx.id}]`
          : `Sua receita vence em ${daysLeft} dias. Agende uma renovação com seu médico. [ID: ${rx.id}]`,
        action_url: "/dashboard",
        metadata: { prescription_id: rx.id, days_left: daysLeft, doctor_id: rx.doctor_id },
      });
      notificationsCreated++;
    }

    // Create prescription renewal requests for 3-day urgency
    for (const rx of (expiring3 || [])) {
      const { data: existingReq } = await supabase
        .from("prescription_requests")
        .select("id")
        .eq("patient_id", rx.patient_id)
        .eq("prescription_id", rx.id)
        .eq("status", "pending");

      if (existingReq && existingReq.length > 0) continue;

      await supabase.from("prescription_requests").insert({
        patient_id: rx.patient_id,
        doctor_id: rx.doctor_id,
        prescription_id: rx.id,
        status: "pending",
        notes: "Renovação automática — receita vencendo em 3 dias ou menos.",
      });
    }

    // Send WhatsApp notifications for urgent cases via Evolution API (Enfª Brisa)
    const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

    if (EVO_URL && EVO_KEY) {
      for (const rx of (expiring3 || [])) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .eq("id", rx.patient_id)
          .single();

        if (profile?.phone) {
          try {
            await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: EVO_KEY },
              body: JSON.stringify({
                number: profile.phone.replace(/\D/g, ""),
                text: `🌿 Olá ${profile.full_name || ''}!\n\nSua receita de cannabis medicinal vence em breve.\n\n📋 Renove agora para não ficar sem medicação:\n👉 https://consultorio-medico-inteligente.lovable.app/dashboard\n\n— Equipe Planta & Raiz`,
                delay: 1200,
              }),
            });
          } catch (e) {
            console.error("[prescription-expiry] WhatsApp error:", e);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      expiring_7_days: expiring7?.length || 0,
      expiring_3_days: expiring3?.length || 0,
      notifications_created: notificationsCreated,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[prescription-expiry-notify] Error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
