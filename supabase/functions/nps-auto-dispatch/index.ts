import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

/**
 * NPS Auto-Dispatch — triggered by pg_cron every 5 minutes
 * Finds completed consultations that haven't received NPS yet
 * and sends NPS request notifications to patients.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find appointments that ended 5+ minutes ago but have no NPS response yet
    const fiveMinAgo = new Date();
    fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);

    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    // Get completed appointments in the last 2 hours
    const { data: completedAppts, error: apptErr } = await supabase
      .from("appointments")
      .select("id, patient_id, doctor_id, scheduled_at, duration_minutes")
      .eq("status", "completed")
      .eq("payment_status", "paid")
      .gte("scheduled_at", twoHoursAgo.toISOString())
      .lte("scheduled_at", fiveMinAgo.toISOString());

    if (apptErr) throw apptErr;
    if (!completedAppts || completedAppts.length === 0) {
      return new Response(JSON.stringify({ message: "No consultations to dispatch NPS", dispatched: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let dispatched = 0;
    const results: Array<{ appointmentId: string; status: string }> = [];

    for (const appt of completedAppts) {
      // Check if NPS already submitted for this consultation
      const { data: existingNps } = await supabase
        .from("nps_responses")
        .select("id")
        .eq("consultation_id", appt.id)
        .eq("patient_id", appt.patient_id)
        .maybeSingle();

      if (existingNps) {
        results.push({ appointmentId: appt.id, status: "already_submitted" });
        continue;
      }

      // Check if NPS notification already sent
      const { data: existingNotif } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", appt.patient_id)
        .eq("type", "nps_request")
        .like("action_url", `%consultation=${appt.id}%`)
        .maybeSingle();

      if (existingNotif) {
        results.push({ appointmentId: appt.id, status: "already_notified" });
        continue;
      }

      // Send NPS request notification
      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: appt.patient_id,
        title: "Como foi sua consulta? ⭐",
        message: "Sua opinião é muito importante! Avalie o atendimento e ajude-nos a melhorar.",
        type: "nps_request",
        action_url: `/nps?consultation=${appt.id}&doctor=${appt.doctor_id}`,
        metadata: {
          appointment_id: appt.id,
          doctor_id: appt.doctor_id,
          auto_dispatched: true,
        },
      });

      if (notifErr) {
        console.error(`NPS notification error for ${appt.id}:`, notifErr);
        results.push({ appointmentId: appt.id, status: "error" });
      } else {
        dispatched++;
        results.push({ appointmentId: appt.id, status: "dispatched" });
        console.log(`📋 NPS dispatched for appointment ${appt.id} → patient ${appt.patient_id}`);
      }
    }

    // Also check for low NPS scores and send alerts
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: recentLowScores } = await supabase
      .from("nps_responses")
      .select("id, professional_id, score, feedback, patient_id")
      .lt("score", 7)
      .gte("created_at", oneHourAgo.toISOString());

    if (recentLowScores && recentLowScores.length > 0) {
      for (const nps of recentLowScores) {
        // Check if alert already exists
        const { data: existingAlert } = await supabase
          .from("nps_alerts")
          .select("id")
          .eq("response_id", nps.id)
          .maybeSingle();

        if (!existingAlert) {
          const severity = nps.score <= 3 ? "critical" : nps.score <= 5 ? "high" : "medium";

          await supabase.from("nps_alerts").insert({
            response_id: nps.id,
            professional_id: nps.professional_id,
            alert_type: nps.score <= 3 ? "critical" : "low_score",
            severity,
            message: `Nota ${nps.score}/10 recebida. Feedback: "${nps.feedback || "Sem comentários"}"`,
            status: "active",
          });

          // Notify the doctor
          const { data: doctorRecord } = await supabase
            .from("doctors")
            .select("user_id")
            .eq("id", nps.professional_id)
            .maybeSingle();

          if (doctorRecord) {
            await supabase.from("notifications").insert({
              user_id: doctorRecord.user_id,
              title: severity === "critical" ? "⚠️ Alerta Crítico de NPS" : "📉 NPS Baixo Detectado",
              message: `Paciente avaliou com nota ${nps.score}/10. ${nps.feedback ? `"${nps.feedback}"` : "Revise o atendimento."}`,
              type: "nps_alert",
              action_url: "/dashboard-medico?tab=nps",
            });
          }

          // Notify admins for critical scores
          if (nps.score <= 3) {
            const { data: adminRoles } = await supabase
              .from("user_roles")
              .select("user_id")
              .eq("role", "admin");

            if (adminRoles) {
              for (const admin of adminRoles) {
                await supabase.from("notifications").insert({
                  user_id: admin.user_id,
                  title: "🚨 NPS Crítico — Ação Necessária",
                  message: `Nota ${nps.score}/10 recebida por um médico. Intervenção recomendada.`,
                  type: "nps_critical",
                  action_url: "/admin-master?tab=nps",
                });
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      dispatched,
      checked: completedAppts.length,
      alerts_processed: recentLowScores?.length || 0,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("NPS auto-dispatch error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
