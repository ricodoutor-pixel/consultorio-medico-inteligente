import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Brisa Retention Engine
 * Automated patient follow-up, win-back, restock alerts, and crisis detection.
 * Actions: follow_up | win_back | restock_alert | crisis_check | retention_metrics
 */

const FOLLOWUP_RULES = [
  {
    id: "d7_acolhimento",
    daysAfter: 7,
    message: (name: string) =>
      `Olá ${name}! Aqui é a Brisa 🌿 Passando para saber como foi sua primeira semana com o protocolo do Dr. Edilson. Alguma dúvida sobre a administração das gotas? Estou aqui para te ajudar! 💚`,
  },
  {
    id: "d30_estoque",
    daysAfter: 30,
    message: (name: string) =>
      `Oi ${name}! 🌿 Notei que seu frasco deve estar chegando ao fim. Para não interromper seu progresso, quer que eu gere o link para reposição no nosso Shopping? 🛒\n\n👉 https://plantayraiz.com.br/shopping?utm_source=brisa_ia&utm_medium=whatsapp&utm_campaign=restock_d30`,
  },
  {
    id: "d60_renovacao",
    daysAfter: 60,
    message: (name: string) =>
      `Olá ${name}! 🌿 Sua próxima consulta de acompanhamento está se aproximando. É essencial para ajustarmos a dose e garantir os melhores resultados. Posso te enviar os horários disponíveis? 📅\n\n👉 https://plantayraiz.com.br/falar-com-especialista?utm_source=brisa_ia&utm_medium=whatsapp&utm_campaign=renewal_d60`,
  },
];

const WINBACK_DAYS = 90;
const CHURN_DAYS = 120;
const RESTOCK_DAYS_BEFORE = 5;
const OIL_DURATION_DAYS = 30; // 30ml lasts ~30 days

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "follow_up";

    const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

    if (!EVO_URL || !EVO_KEY) {
      return jsonResp({ error: "EVOLUTION_API_URL/EVOLUTION_API_KEY missing" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── FOLLOW-UP: D+7, D+30, D+60 ───
    if (action === "follow_up") {
      

      const results: any[] = [];

      for (const rule of FOLLOWUP_RULES) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - rule.daysAfter);
        const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

        // Find appointments completed on the target date
        const { data: appointments } = await supabase
          .from("appointments")
          .select("patient_id, doctor_id, scheduled_at")
          .eq("status", "completed")
          .gte("scheduled_at", dayStart.toISOString())
          .lte("scheduled_at", dayEnd.toISOString());

        for (const appt of appointments || []) {
          // Check opt-out
          const { data: lead } = await supabase
            .from("leads_contatos")
            .select("tags, nome, telefone")
            .eq("telefone", appt.patient_id)
            .maybeSingle();

          const tags: string[] = lead?.tags || [];
          if (tags.includes("no_followup")) continue;

          // Check if already sent this follow-up
          const { count } = await supabase
            .from("ai_events")
            .select("*", { count: "exact", head: true })
            .eq("event_type", `followup_${rule.id}`)
            .eq("user_id", appt.patient_id);

          if ((count || 0) > 0) continue;

          // Get patient phone from whatsapp_conversations
          const { data: conv } = await supabase
            .from("whatsapp_conversations")
            .select("phone_number")
            .eq("phone_number", appt.patient_id)
            .maybeSingle();

          const phone = conv?.phone_number || appt.patient_id;
          if (!phone || phone.length < 10) continue;

          const patientName = lead?.nome || "paciente";
          const firstName = patientName.split(" ")[0];
          const msg = rule.message(firstName);

          // Send via Evolution API (Enfª Brisa)
          try {
            await sendWhatsApp(phone, msg);
            await supabase.from("ai_events").insert({
              ai_name: "brisa_coo",
              event_type: `followup_${rule.id}`,
              status: "completed",
              user_id: appt.patient_id,
              input_data: { rule: rule.id, days_after: rule.daysAfter },
              output_data: { phone: phone.substring(0, 6) + "***" },
            });
            results.push({ patient: phone.substring(0, 6) + "***", rule: rule.id, sent: true });
          } catch (e) {
            results.push({ patient: phone.substring(0, 6) + "***", rule: rule.id, sent: false, error: String(e) });
          }
        }
      }

      return jsonResp({ action: "follow_up", results, count: results.length });
    }

    // ─── WIN-BACK: 90+ days inactive ───
    if (action === "win_back") {
      

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - WINBACK_DAYS);

      const { data: inactiveConvs } = await supabase
        .from("whatsapp_conversations")
        .select("phone_number, updated_at")
        .lt("updated_at", cutoffDate.toISOString())
        .limit(50);

      const results: any[] = [];

      for (const conv of inactiveConvs || []) {
        // Check opt-out
        const { data: lead } = await supabase
          .from("leads_contatos")
          .select("tags, nome")
          .eq("telefone", conv.phone_number)
          .maybeSingle();

        const tags: string[] = lead?.tags || [];
        if (tags.includes("no_followup")) continue;

        // Check if already sent win-back recently
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("ai_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "winback")
          .eq("user_id", conv.phone_number)
          .gte("created_at", thirtyDaysAgo);

        if ((count || 0) > 0) continue;

        const firstName = (lead?.nome || "paciente").split(" ")[0];
        const msg = `Olá ${firstName}! Aqui é a Brisa 🌿 Sentimos sua falta na Planta & Raiz! Como está sua qualidade de vida?\n\nTenho um presente especial: 50 Planta-Coins 🪙 de bônus para sua consulta de retorno! Vamos retomar seu tratamento?\n\n👉 https://plantayraiz.com.br/falar-com-especialista?utm_source=brisa_ia&utm_medium=whatsapp&utm_campaign=winback_d90`;

        try {
          await sendWhatsApp(conv.phone_number, msg);
          await supabase.from("ai_events").insert({
            ai_name: "brisa_coo",
            event_type: "winback",
            status: "completed",
            user_id: conv.phone_number,
            output_data: { phone: conv.phone_number.substring(0, 6) + "***", days_inactive: Math.floor((Date.now() - new Date(conv.updated_at).getTime()) / 86400000) },
          });
          results.push({ phone: conv.phone_number.substring(0, 6) + "***", sent: true });
        } catch (e) {
          results.push({ phone: conv.phone_number.substring(0, 6) + "***", sent: false });
        }
      }

      return jsonResp({ action: "win_back", results, count: results.length });
    }

    // ─── RESTOCK ALERT: 5 days before oil runs out ───
    if (action === "restock_alert") {
      

      const restockTarget = new Date();
      restockTarget.setDate(restockTarget.getDate() - (OIL_DURATION_DAYS - RESTOCK_DAYS_BEFORE));
      const dayStart = new Date(restockTarget); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(restockTarget); dayEnd.setHours(23, 59, 59, 999);

      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, created_at, items")
        .eq("status", "delivered")
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString());

      const results: any[] = [];

      for (const order of orders || []) {
        const { data: lead } = await supabase
          .from("leads_contatos")
          .select("tags, nome, telefone")
          .eq("telefone", order.user_id)
          .maybeSingle();

        const tags: string[] = lead?.tags || [];
        if (tags.includes("no_followup")) continue;

        const { data: conv } = await supabase
          .from("whatsapp_conversations")
          .select("phone_number")
          .eq("phone_number", order.user_id)
          .maybeSingle();

        const phone = conv?.phone_number || lead?.telefone;
        if (!phone) continue;

        const firstName = (lead?.nome || "paciente").split(" ")[0];
        const msg = `Oi ${firstName}! 🌿 Calculamos que seu produto deve estar acabando em cerca de 5 dias. Para não interromper seu tratamento, preparei o link de reposição:\n\n🛒 https://plantayraiz.com.br/shopping?utm_source=brisa_ia&utm_medium=whatsapp&utm_campaign=restock_smart\n\nContinuidade é chave para os melhores resultados! 💚`;

        try {
          await sendWhatsApp(phone, msg);
          results.push({ phone: phone.substring(0, 6) + "***", sent: true });
        } catch {
          results.push({ phone: phone.substring(0, 6) + "***", sent: false });
        }
      }

      return jsonResp({ action: "restock_alert", results, count: results.length });
    }

    // ─── CRISIS CHECK: Negative sentiment spike → alert admin ───
    if (action === "crisis_check") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: convs } = await supabase
        .from("whatsapp_conversations")
        .select("sentiment")
        .gte("updated_at", weekAgo);

      let positive = 0, negative = 0, neutral = 0;
      for (const c of convs || []) {
        if (c.sentiment === "positive") positive++;
        else if (c.sentiment === "negative") negative++;
        else neutral++;
      }

      const total = positive + negative + neutral;
      const negativeRate = total > 0 ? (negative / total) * 100 : 0;
      const isCrisis = negativeRate > 50;

      if (isCrisis) {
        // Send crisis alert to admin (Dr. Edilson)
        const adminPhone = "5511991363154"; // Admin phone
        const crisisMsg = `🚨 ALERTA DE CRISE — Brisa COO\n\nSentimento negativo acima de 50% esta semana:\n• Positivo: ${positive}\n• Neutro: ${neutral}\n• Negativo: ${negative}\n• Taxa negativa: ${negativeRate.toFixed(1)}%\n\nRecomendo revisão dos pontos de atrito.\nRelatório completo: https://plantayraiz.com.br/admin`;

        try {
          await sendWhatsApp(adminPhone, crisisMsg);
        } catch (e) {
          console.error("[Brisa Retention] Crisis alert send failed:", e);
        }

        await supabase.from("ai_events").insert({
          ai_name: "brisa_coo",
          event_type: "crisis_alert",
          status: "completed",
          output_data: { positive, negative, neutral, negativeRate, alert_sent: true },
        });
      }

      return jsonResp({
        action: "crisis_check",
        sentiment: { positive, negative, neutral, total },
        negative_rate: `${negativeRate.toFixed(1)}%`,
        is_crisis: isCrisis,
        alert_sent: isCrisis,
      });
    }

    // ─── RETENTION METRICS ───
    if (action === "retention_metrics") {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const churnCutoff = new Date(now.getTime() - CHURN_DAYS * 24 * 60 * 60 * 1000).toISOString();

      // Patients with 2+ appointments (retention)
      const { data: allPatients } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("status", "completed");

      const patientCounts: Record<string, number> = {};
      for (const a of allPatients || []) {
        patientCounts[a.patient_id] = (patientCounts[a.patient_id] || 0) + 1;
      }
      const totalPatients = Object.keys(patientCounts).length;
      const returningPatients = Object.values(patientCounts).filter(c => c >= 2).length;
      const retentionRate = totalPatients > 0 ? ((returningPatients / totalPatients) * 100).toFixed(1) : "0";

      // Assisted rebuys (follow-up events that led to orders)
      const { count: followupsSent } = await supabase
        .from("ai_events")
        .select("*", { count: "exact", head: true })
        .in("event_type", ["followup_d30_estoque", "restock_alert", "winback"])
        .gte("created_at", thirtyDaysAgo);

      // Churn: patients inactive 120+ days
      const { count: churnCount } = await supabase
        .from("whatsapp_conversations")
        .select("*", { count: "exact", head: true })
        .lt("updated_at", churnCutoff);

      const { count: totalActive } = await supabase
        .from("whatsapp_conversations")
        .select("*", { count: "exact", head: true });

      const churnRate = (totalActive || 0) > 0
        ? (((churnCount || 0) / (totalActive || 1)) * 100).toFixed(1)
        : "0";

      // Crisis status
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentConvs } = await supabase
        .from("whatsapp_conversations")
        .select("sentiment")
        .gte("updated_at", weekAgo);

      let negCount = 0, totalSent = 0;
      for (const c of recentConvs || []) {
        totalSent++;
        if (c.sentiment === "negative") negCount++;
      }

      return jsonResp({
        retention: {
          total_patients: totalPatients,
          returning_patients: returningPatients,
          retention_rate: `${retentionRate}%`,
        },
        rebuys: {
          followups_sent: followupsSent || 0,
        },
        churn: {
          inactive_120d: churnCount || 0,
          total_contacts: totalActive || 0,
          churn_rate: `${churnRate}%`,
        },
        crisis: {
          negative_this_week: negCount,
          total_this_week: totalSent,
          is_crisis: totalSent > 0 && (negCount / totalSent) > 0.5,
        },
      });
    }

    return jsonResp({ error: "Unknown action. Use: follow_up, win_back, restock_alert, crisis_check, retention_metrics" }, 400);
  } catch (e) {
    console.error("[Brisa Retention] Error:", e);
    return jsonResp({ error: "Internal error" }, 500);
  }
});

// ─── Helpers ───

async function sendWhatsApp(phone: string, message: string) {
  const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
  const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
  if (!EVO_URL || !EVO_KEY) throw new Error("Evolution API not configured");

  const resp = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({
      number: phone.replace(/\D/g, ""),
      text: message,
      delay: 1200,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Evolution ${resp.status}: ${err}`);
  }
  return resp.json();
}

function jsonResp(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
      "Content-Type": "application/json",
    },
  });
}
