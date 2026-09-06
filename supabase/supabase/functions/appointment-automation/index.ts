import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

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
  const formatted = phone.startsWith("+") ? phone : phone.startsWith("55") ? `+${phone}` : `+55${phone}`;
  return mcPost("/subscriber/findBySystemField", { field_name: "phone", field_value: formatted });
}

async function sendMsg(subscriberId: string, text: string) {
  return mcPost("/sending/sendContent", {
    subscriber_id: subscriberId,
    data: { version: "v2", content: { messages: [{ type: "text", text }] } },
  });
}

async function tagSub(subscriberId: string, tag: string) {
  return mcPost("/subscriber/addTag", { subscriber_id: subscriberId, tag_name: tag });
}

async function setField(subscriberId: string, field: string, value: string) {
  return mcPost("/subscriber/setCustomField", { subscriber_id: subscriberId, field_name: field, field_value: value });
}

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Appointment Automation Engine
 * Runs on cron schedule to handle:
 * - Send confirmations for newly created appointments
 * - 24h reminders
 * - 1h reminders
 * - 30min access link delivery
 * - No-show detection
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const guard = requireServiceAuth(req, corsHeaders);
  if (guard) return guard;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const results = { confirmations: 0, reminders_24h: 0, reminders_1h: 0, access_links: 0, no_shows: 0, errors: 0 };

    // ── 1. New appointments needing confirmation (created in last 10min, not yet confirmed via ManyChat)
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const { data: newAppts } = await supabase
      .from("appointments")
      .select("id, scheduled_at, doctor_id, patient_id, status")
      .eq("status", "scheduled")
      .gte("created_at", tenMinAgo);

    for (const appt of newAppts || []) {
      try {
        const [{ data: doctor }, { data: patient }] = await Promise.all([
          supabase.from("doctors").select("id, crm, specialty, user_id").eq("id", appt.doctor_id).single(),
          supabase.from("profiles").select("id, full_name, phone").eq("id", appt.patient_id).single(),
        ]);

        if (!patient?.phone) continue;

        const { data: docProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", doctor?.user_id)
          .single();

        const date = new Date(appt.scheduled_at);
        const formatted = date.toLocaleDateString("pt-BR") + " às " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        const mc = await findSub(patient.phone);
        if (mc?.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSub(mc.data.id, "consulta_agendada"),
            setField(mc.data.id, "proxima_consulta", formatted),
            setField(mc.data.id, "medico_nome", docProfile?.full_name || "Especialista"),
            sendMsg(mc.data.id, `✅ Consulta confirmada!\n\n👨‍⚕️ Dr(a). ${docProfile?.full_name || "Especialista"}\n📅 ${formatted}\n\nVocê receberá o link de acesso 30 minutos antes. Até lá! 🌿`),
          ]);
          results.confirmations++;
        }
      } catch (e) { console.error("Confirmation error:", e); results.errors++; }
    }

    // ── 2. 24h reminders
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(tomorrow.getTime() - 30 * 60 * 1000).toISOString();
    const tomorrowEnd = new Date(tomorrow.getTime() + 30 * 60 * 1000).toISOString();

    const { data: tomorrowAppts } = await supabase
      .from("appointments")
      .select("id, scheduled_at, doctor_id, patient_id")
      .eq("status", "scheduled")
      .gte("scheduled_at", tomorrowStart)
      .lte("scheduled_at", tomorrowEnd);

    for (const appt of tomorrowAppts || []) {
      try {
        const { data: patient } = await supabase.from("profiles").select("full_name, phone").eq("id", appt.patient_id).single();
        if (!patient?.phone) continue;

        const { data: doctor } = await supabase.from("doctors").select("user_id").eq("id", appt.doctor_id).single();
        const { data: docProfile } = await supabase.from("profiles").select("full_name").eq("id", doctor?.user_id).single();

        const mc = await findSub(patient.phone);
        if (mc?.status === "success" && mc.data?.id) {
          await sendMsg(mc.data.id, `⏰ Lembrete: sua consulta com Dr(a). ${docProfile?.full_name || "Especialista"} é amanhã!\n\nPrepare suas dúvidas e documentos. Estamos aqui para você! 🌿`);
          results.reminders_24h++;
        }
      } catch (e) { console.error("24h reminder error:", e); results.errors++; }
    }

    // ── 3. 1h reminders
    const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourStart = new Date(oneHour.getTime() - 5 * 60 * 1000).toISOString();
    const oneHourEnd = new Date(oneHour.getTime() + 5 * 60 * 1000).toISOString();

    const { data: soonAppts } = await supabase
      .from("appointments")
      .select("id, scheduled_at, doctor_id, patient_id")
      .eq("status", "scheduled")
      .gte("scheduled_at", oneHourStart)
      .lte("scheduled_at", oneHourEnd);

    for (const appt of soonAppts || []) {
      try {
        const { data: patient } = await supabase.from("profiles").select("full_name, phone").eq("id", appt.patient_id).single();
        if (!patient?.phone) continue;

        const { data: doctor } = await supabase.from("doctors").select("user_id").eq("id", appt.doctor_id).single();
        const { data: docProfile } = await supabase.from("profiles").select("full_name").eq("id", doctor?.user_id).single();

        const mc = await findSub(patient.phone);
        if (mc?.status === "success" && mc.data?.id) {
          await sendMsg(mc.data.id, `🔔 Falta 1 hora para sua consulta com Dr(a). ${docProfile?.full_name || "Especialista"}!\n\nVerifique sua conexão de internet e prepare um ambiente tranquilo.`);
          results.reminders_1h++;
        }
      } catch (e) { console.error("1h reminder error:", e); results.errors++; }
    }

    // ── 4. 30min access links
    const thirtyMin = new Date(now.getTime() + 30 * 60 * 1000);
    const thirtyStart = new Date(thirtyMin.getTime() - 5 * 60 * 1000).toISOString();
    const thirtyEnd = new Date(thirtyMin.getTime() + 5 * 60 * 1000).toISOString();

    const { data: imminentAppts } = await supabase
      .from("appointments")
      .select("id, scheduled_at, doctor_id, patient_id")
      .eq("status", "scheduled")
      .gte("scheduled_at", thirtyStart)
      .lte("scheduled_at", thirtyEnd);

    for (const appt of imminentAppts || []) {
      try {
        const { data: patient } = await supabase.from("profiles").select("full_name, phone").eq("id", appt.patient_id).single();
        if (!patient?.phone) continue;

        const { data: doctor } = await supabase.from("doctors").select("user_id").eq("id", appt.doctor_id).single();
        const { data: docProfile } = await supabase.from("profiles").select("full_name").eq("id", doctor?.user_id).single();

        const accessLink = `https://plantayraiz.com.br/video-call?appointment=${appt.id}`;

        const mc = await findSub(patient.phone);
        if (mc?.status === "success" && mc.data?.id) {
          await sendMsg(mc.data.id, `🟢 Sua consulta começa em 30 minutos!\n\n🔗 Acesse aqui: ${accessLink}\n\nDr(a). ${docProfile?.full_name || "Especialista"} está te esperando!`);
          results.access_links++;
        }

        // Update appointment status
        await supabase.from("appointments").update({ status: "confirmed" }).eq("id", appt.id);
      } catch (e) { console.error("Access link error:", e); results.errors++; }
    }

    // ── 5. No-show detection (scheduled but past by 15min+)
    const fifteenAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    const { data: noShows } = await supabase
      .from("appointments")
      .select("id, patient_id, doctor_id")
      .in("status", ["scheduled", "confirmed"])
      .lte("scheduled_at", fifteenAgo)
      .gte("scheduled_at", twoHoursAgo);

    for (const appt of noShows || []) {
      try {
        const { data: patient } = await supabase.from("profiles").select("phone").eq("id", appt.patient_id).single();
        if (!patient?.phone) continue;

        const mc = await findSub(patient.phone);
        if (mc?.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSub(mc.data.id, "no_show"),
            sendMsg(mc.data.id, "😕 Notamos que você não compareceu à consulta. Tudo bem? Podemos reagendar para outro horário! Responda 'SIM' para reagendar."),
          ]);
        }

        await supabase.from("appointments").update({ status: "no_show" }).eq("id", appt.id);
        results.no_shows++;
      } catch (e) { console.error("No-show error:", e); results.errors++; }
    }

    console.log("📅 Appointment automation results:", results);
    return jsonRes({ success: true, ...results, timestamp: now.toISOString() });
  } catch (error) {
    console.error("Appointment automation error:", error);
    return jsonRes({ error: "Internal server error" }, 500);
  }
});
