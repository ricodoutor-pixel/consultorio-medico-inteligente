import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const manychatKey = Deno.env.get("MANYCHAT_API_KEY");
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const supabase = createClient(supabaseUrl, serviceKey);

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Find appointments with pending payment > 30 min
    const { data: pendingAppts } = await supabase
      .from("appointments")
      .select(`
        id, patient_id, scheduled_at, amount, doctor_id,
        doctors!appointments_doctor_id_fkey ( id, user_id )
      `)
      .eq("payment_status", "pending")
      .eq("status", "scheduled")
      .lt("created_at", thirtyMinAgo)
      .limit(50);

    let recovered = 0;

    for (const appt of pendingAppts || []) {
      // Get patient info
      const { data: patient } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", appt.patient_id)
        .single();

      if (!patient?.phone) continue;

      // Get doctor name
      const doctorUserId = (appt.doctors as any)?.user_id;
      let doctorName = "nosso especialista";
      if (doctorUserId) {
        const { data: docProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", doctorUserId)
          .single();
        if (docProfile?.full_name) doctorName = docProfile.full_name;
      }

      const paymentLink = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/pagamento/${appt.id}`;
      const message = `Olá ${patient.full_name?.split(" ")[0] || ""}! 🌿 Notamos que sua consulta com ${doctorName} não foi finalizada. Seu horário ainda está reservado por alguns minutos. Conclua aqui: ${paymentLink}`;

      // Try Twilio WhatsApp first
      if (twilioSid && twilioToken) {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const body = new URLSearchParams({
            From: "whatsapp:+5511991363154",
            To: `whatsapp:+55${patient.phone.replace(/\D/g, "")}`,
            Body: message,
          });
          await fetch(twilioUrl, {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
          });
        } catch (e) {
          console.error("Twilio error:", e);
        }
      }

      // Also try ManyChat
      if (manychatKey) {
        try {
          await fetch("https://api.manychat.com/fb/sending/sendFlow", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${manychatKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subscriber_id: patient.phone.replace(/\D/g, ""),
              flow_ns: "appointment_recovery",
            }),
          });
        } catch (e) {
          console.error("ManyChat error:", e);
        }
      }

      // Create in-app notification
      await supabase.from("notifications").insert({
        user_id: appt.patient_id,
        title: "⏰ Finalize seu agendamento!",
        message: `Sua consulta com ${doctorName} ainda não foi paga. Complete o pagamento para garantir seu horário.`,
        type: "payment_reminder",
        action_url: `/pagamento/${appt.id}`,
      });

      // Log recovery campaign
      await supabase.from("recovery_campaigns").insert({
        user_id: appt.patient_id,
        trigger_type: "abandoned_appointment",
        status: "sent",
        message_sent_via: twilioSid ? "whatsapp" : "in_app",
        metadata: { appointment_id: appt.id, doctor_name: doctorName },
      });

      recovered++;
    }

    // Release expired reservations
    const { data: expiredSlots } = await supabase
      .from("doctor_availability")
      .select("id")
      .eq("status", "reserved")
      .lt("reserved_until", new Date().toISOString());

    if (expiredSlots && expiredSlots.length > 0) {
      for (const slot of expiredSlots) {
        await supabase
          .from("doctor_availability")
          .update({ status: "available", reserved_by: null, reserved_until: null })
          .eq("id", slot.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recovered_appointments: recovered,
        expired_slots_released: expiredSlots?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("WhatsApp recovery error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
