import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MANYCHAT_API = "https://api.manychat.com/fb";

async function mcPost(endpoint: string, body: Record<string, unknown>) {
  const key = Deno.env.get("MANYCHAT_API_KEY");
  if (!key) return null;
  const res = await fetch(`${MANYCHAT_API}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function findSub(phone: string) {
  const f = phone.startsWith("+") ? phone : phone.startsWith("55") ? `+${phone}` : `+55${phone}`;
  return mcPost("/subscriber/findBySystemField", { field_name: "phone", field_value: f });
}
async function sendMsg(id: string, text: string) {
  return mcPost("/sending/sendContent", { subscriber_id: id, data: { version: "v2", content: { messages: [{ type: "text", text }] } } });
}
async function tagSub(id: string, tag: string) { return mcPost("/subscriber/addTag", { subscriber_id: id, tag_name: tag }); }
async function removeTag(id: string, tag: string) { return mcPost("/subscriber/removeTag", { subscriber_id: id, tag_name: tag }); }
async function setField(id: string, f: string, v: string) { return mcPost("/subscriber/setCustomField", { subscriber_id: id, field_name: f, field_value: v }); }

/**
 * NPS Auto-Dispatch — triggered by pg_cron every 5 minutes
 * 1. Finds completed consultations → sends NPS via ManyChat + internal notification
 * 2. Detects low NPS scores → creates alerts + notifies doctors/admins via ManyChat
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;


  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const fiveMinAgo = new Date();
    fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);

    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

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
    let mcSent = 0;
    const results: Array<{ appointmentId: string; status: string }> = [];

    for (const appt of completedAppts) {
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

      // Get patient and doctor info for ManyChat
      const [{ data: patient }, { data: doctor }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", appt.patient_id).single(),
        supabase.from("doctors").select("user_id").eq("id", appt.doctor_id).single(),
      ]);

      let docName = "Especialista";
      if (doctor) {
        const { data: docProfile } = await supabase.from("profiles").select("full_name").eq("id", doctor.user_id).single();
        docName = docProfile?.full_name || docName;
      }

      // Send internal notification
      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: appt.patient_id,
        title: "Como foi sua consulta? ⭐",
        message: "Sua opinião é muito importante! Avalie o atendimento e ajude-nos a melhorar.",
        type: "nps_request",
        action_url: `/nps?consultation=${appt.id}&doctor=${appt.doctor_id}`,
        metadata: { appointment_id: appt.id, doctor_id: appt.doctor_id, auto_dispatched: true },
      });

      if (notifErr) {
        console.error(`NPS notification error for ${appt.id}:`, notifErr);
        results.push({ appointmentId: appt.id, status: "error" });
        continue;
      }

      // Send via ManyChat WhatsApp
      if (patient?.phone) {
        const mc = await findSub(patient.phone);
        if (mc?.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSub(mc.data.id, "nps_pendente"),
            setField(mc.data.id, "ultima_consulta_id", appt.id),
            setField(mc.data.id, "medico_nome", docName),
            sendMsg(mc.data.id,
              `⭐ ${patient.full_name || "Olá"}! Como foi sua consulta com Dr(a). ${docName}?\n\nDe 0 a 10, qual nota você daria?\n\nSua opinião é muito importante para melhorarmos! 💚`
            ),
          ]);
          mcSent++;
        }
      }

      dispatched++;
      results.push({ appointmentId: appt.id, status: "dispatched" });
      console.log(`📋 NPS dispatched for appointment ${appt.id} → patient ${appt.patient_id}`);
    }

    // ── Low NPS alerts with ManyChat notifications to doctors
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: recentLowScores } = await supabase
      .from("nps_responses")
      .select("id, professional_id, score, feedback, patient_id")
      .lt("score", 7)
      .gte("created_at", oneHourAgo.toISOString());

    let alertsCreated = 0;

    if (recentLowScores && recentLowScores.length > 0) {
      for (const nps of recentLowScores) {
        const { data: existingAlert } = await supabase
          .from("nps_alerts")
          .select("id")
          .eq("response_id", nps.id)
          .maybeSingle();

        if (existingAlert) continue;

        const severity = nps.score <= 3 ? "critical" : nps.score <= 5 ? "high" : "medium";

        await supabase.from("nps_alerts").insert({
          response_id: nps.id,
          professional_id: nps.professional_id,
          alert_type: nps.score <= 3 ? "critical" : "low_score",
          severity,
          message: `Nota ${nps.score}/10 recebida. Feedback: "${nps.feedback || "Sem comentários"}"`,
          status: "active",
        });
        alertsCreated++;

        // Notify doctor internally + via ManyChat
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

          // Send ManyChat alert to doctor
          const { data: docProfile } = await supabase.from("profiles").select("full_name, phone").eq("id", doctorRecord.user_id).single();
          if (docProfile?.phone) {
            const mc = await findSub(docProfile.phone);
            if (mc?.status === "success" && mc.data?.id) {
              await sendMsg(mc.data.id,
                `⚠️ Dr(a). ${docProfile.full_name}, seu NPS recente ficou em ${nps.score}/10.\n\n${nps.feedback ? `Feedback: "${nps.feedback}"` : ""}\n\nRevise o atendimento para melhorar. Estamos aqui para ajudar! 📞`
              );
            }
          }
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

    return new Response(JSON.stringify({
      success: true,
      dispatched,
      manychat_sent: mcSent,
      checked: completedAppts.length,
      alerts_created: alertsCreated,
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
