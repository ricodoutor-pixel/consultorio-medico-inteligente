/**
 * daily-patient-followup
 *
 * Cron diária. Para cada paciente com consulta nos últimos 30 dias:
 *  - Regra 1: receita vence em 7 dias → alerta para a Brisa notificar.
 *  - Regra 2: 2x por semana (terça e sexta) envia check-in de saúde nos primeiros 30d.
 *
 * Disparado via pg_cron / endpoint manual. Service role.
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE");

async function sendBrisaWhatsApp(phone: string, message: string) {
  if (!EVO_URL || !EVO_KEY || !EVO_INSTANCE || !phone) return false;
  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
      body: JSON.stringify({ number: phone.replace(/\D/g, ""), text: message }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

import { requireServiceAuth } from "../_shared/service-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const now = new Date();
    const dow = now.getUTCDay(); // 0=Sun .. 6=Sat
    const isCheckinDay = dow === 2 || dow === 5; // ter / sex

    // ─── REGRA 1: receitas vencendo em 7 dias ───────────────────────
    const in7 = new Date(Date.now() + 7 * 86400_000).toISOString();
    const nowIso = now.toISOString();

    const { data: expiring } = await supabase
      .from("prescriptions")
      .select("id, patient_id, valid_until, doctor_id")
      .eq("status", "active")
      .gt("valid_until", nowIso)
      .lt("valid_until", in7)
      .limit(200);

    let alertsCreated = 0;
    for (const rx of expiring || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", rx.patient_id)
        .maybeSingle();

      await supabase.from("notifications").insert({
        user_id: rx.patient_id,
        title: "📋 Sua receita vence em 7 dias",
        message: "A Enfª Brisa pode te ajudar a renovar sua prescrição em 1 clique.",
        type: "prescription_renewal",
        action_url: "/consulta-rapida",
      });

      // Alerta para a Brisa centralizada
      await sendBrisaWhatsApp(
        "5511991363154",
        `🔔 Brisa: receita do paciente ${profile?.full_name ?? rx.patient_id} vence em 7 dias. Acionar follow-up.`,
      );
      alertsCreated++;
    }

    // ─── REGRA 2: check-in 2x/semana nos primeiros 30 dias ─────────
    let checkinsSent = 0;
    if (isCheckinDay) {
      const last30 = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data: recent } = await supabase
        .from("consultations")
        .select("patient_id, created_at")
        .gte("created_at", last30)
        .limit(500);

      const seen = new Set<string>();
      for (const c of recent || []) {
        if (seen.has(c.patient_id)) continue;
        seen.add(c.patient_id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .eq("id", c.patient_id)
          .maybeSingle();

        await supabase.from("notifications").insert({
          user_id: c.patient_id,
          title: "💚 Check-in de Saúde — Enfª Brisa",
          message: "Como você está se sentindo desde a sua última consulta? Responda para ajustarmos seu tratamento.",
          type: "health_checkin",
          action_url: "/dashboard-paciente",
        });

        if (profile?.phone) {
          await sendBrisaWhatsApp(
            profile.phone,
            `Olá ${profile.full_name?.split(" ")[0] ?? ""}! Aqui é a Enfª Brisa 🌿\n\nComo você está se sentindo desde a sua última consulta? Conta pra mim para eu te orientar melhor.`,
          );
        }
        checkinsSent++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, expiring_alerts: alertsCreated, checkins_sent: checkinsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[daily-patient-followup]", err);
    return new Response(JSON.stringify({ ok: false, error: "Erro interno. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
