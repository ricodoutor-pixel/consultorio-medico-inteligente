import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendWhatsApp } from "../_shared/evolution.ts";

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function formatBRL(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

/**
 * Revenue Report Automation
 * Cron: daily at 08:00 + monthly on 1st
 * Sends financial reports to doctors via ManyChat + internal notifications
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;


  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const now = new Date();
    const payload = await req.json().catch(() => ({}));
    const reportType = payload.type || "daily";

    const results = { reports_sent: 0, errors: 0 };

    // Get all active verified doctors
    const { data: doctors } = await supabase
      .from("doctors")
      .select("id, user_id, pix_key, is_verified")
      .eq("is_verified", true);

    for (const doc of doctors || []) {
      try {
        const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", doc.user_id).single();
        if (!profile) continue;

        // Calculate period
        let startDate: string;
        let periodLabel: string;

        if (reportType === "monthly") {
          const firstOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastOfMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = firstOfMonth.toISOString();
          periodLabel = `${firstOfMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
        } else {
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          startDate = yesterday.toISOString().split("T")[0] + "T00:00:00Z";
          periodLabel = yesterday.toLocaleDateString("pt-BR");
        }

        // Count consultations
        const { count: consultations } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("doctor_id", doc.id)
          .eq("status", "completed")
          .gte("updated_at", startDate);

        // Calculate revenue from escrow
        const { data: escrows } = await supabase
          .from("escrow_transactions")
          .select("amount, doctor_payout, platform_fee")
          .eq("doctor_id", doc.id)
          .eq("status", "released")
          .gte("released_at", startDate);

        const totalRevenue = (escrows || []).reduce((s, e) => s + (e.doctor_payout || 0), 0);
        const platformFees = (escrows || []).reduce((s, e) => s + (e.platform_fee || 0), 0);

        // Get NPS average
        const { data: npsData } = await supabase
          .from("nps_responses")
          .select("score")
          .eq("professional_id", doc.id)
          .gte("created_at", startDate);

        const npsAvg = npsData?.length
          ? (npsData.reduce((s, n) => s + n.score, 0) / npsData.length).toFixed(1)
          : "N/A";

        // Get bonuses
        const { data: bonuses } = await supabase
          .from("gamification_bonuses")
          .select("amount")
          .eq("professional_id", doc.id)
          .eq("status", "distributed")
          .gte("distributed_at", startDate);

        const totalBonus = (bonuses || []).reduce((s, b) => s + b.amount, 0);

        // Send via Evolution API (WhatsApp) if phone available
        if (profile.phone) {
          const text = `📊 Relatório ${reportType === "monthly" ? "Mensal" : "Diário"} — ${periodLabel}\n\nDr(a). ${profile.full_name}\n\n👥 Consultas: ${consultations || 0}\n💰 Receita: ${formatBRL(totalRevenue)}\n🏦 Taxa plataforma: ${formatBRL(platformFees)}\n🎁 Bônus NPS: ${formatBRL(totalBonus)}\n⭐ NPS Médio: ${npsAvg}\n\n${Number(npsAvg) >= 8 ? "Excelente trabalho! Continue assim! 🚀" : "Continue melhorando para ganhar mais bônus! 💪"}`;
          await sendWhatsApp(profile.phone, text).catch((e) => console.error("Evolution report error:", e));
        }

        // Save internal notification
        await supabase.from("notifications").insert({
          user_id: doc.user_id,
          title: `Relatório ${reportType === "monthly" ? "Mensal" : "Diário"} — ${periodLabel}`,
          message: `Consultas: ${consultations || 0} | Receita: ${formatBRL(totalRevenue)} | Bônus: ${formatBRL(totalBonus)} | NPS: ${npsAvg}`,
          type: "financial_report",
          action_url: "/dashboard-medico",
        });

        // Update performance metrics (monthly only)
        if (reportType === "monthly") {
          const month = now.getMonth(); // 0-indexed, previous month
          const year = now.getFullYear();

          await supabase.from("doctor_performance_metrics").upsert({
            doctor_id: doc.id,
            month: month === 0 ? 12 : month,
            year: month === 0 ? year - 1 : year,
            consultations_count: consultations || 0,
            average_rating: Number(npsAvg) || 0,
            estimated_share: totalRevenue,
            performance_score: (consultations || 0) * 0.5 + Number(npsAvg || 0) * 0.2,
          }, { onConflict: "doctor_id,month,year" });
        }

        results.reports_sent++;
      } catch (e) { console.error("Report error:", e); results.errors++; }
    }

    // ── Admin summary (monthly)
    if (reportType === "monthly") {
      const { count: totalDoctors } = await supabase.from("doctors").select("id", { count: "exact", head: true }).eq("is_verified", true);
      const { data: allEscrows } = await supabase
        .from("escrow_transactions")
        .select("amount, platform_fee")
        .eq("status", "released")
        .gte("released_at", new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString());

      const totalPlatformRevenue = (allEscrows || []).reduce((s, e) => s + (e.platform_fee || 0), 0);
      const totalGross = (allEscrows || []).reduce((s, e) => s + e.amount, 0);

      console.log(`📈 Monthly Admin Summary: Doctors=${totalDoctors}, Gross=${formatBRL(totalGross)}, Platform=${formatBRL(totalPlatformRevenue)}`);
    }

    console.log(`💰 Revenue report (${reportType}): ${results.reports_sent} sent, ${results.errors} errors`);
    return jsonRes({ success: true, report_type: reportType, ...results, timestamp: now.toISOString() });
  } catch (error) {
    console.error("Revenue report error:", error);
    return jsonRes({ error: "Internal server error" }, 500);
  }
});
