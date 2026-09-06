import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;


  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Revenue metrics
    const { data: todayPayments } = await supabase
      .from("payment_webhooks")
      .select("amount, status")
      .eq("status", "approved")
      .gte("created_at", startOfDay.toISOString());

    const { data: monthPayments } = await supabase
      .from("payment_webhooks")
      .select("amount, status")
      .eq("status", "approved")
      .gte("created_at", startOfMonth.toISOString());

    const todayRevenue = todayPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const monthRevenue = monthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // 2. Consultation metrics
    const { count: todayConsultations } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString());

    const { count: monthConsultations } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());

    // 3. Conversion funnel
    const { count: totalTriages } = await supabase
      .from("brisa_triages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());

    const { count: completedTriages } = await supabase
      .from("brisa_triages")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", startOfMonth.toISOString());

    const conversionRate = totalTriages ? ((completedTriages || 0) / totalTriages * 100) : 0;

    // 4. Doctor supply metrics
    const { count: onlineDoctors } = await supabase
      .from("doctors")
      .select("*", { count: "exact", head: true })
      .eq("is_online", true)
      .eq("is_verified", true);

    const { count: totalDoctors } = await supabase
      .from("doctors")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true);

    // 5. Prescription velocity
    const { count: monthPrescriptions } = await supabase
      .from("prescriptions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());

    // 6. Active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from("medical_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // 7. NPS score
    const { data: npsData } = await supabase
      .from("nps_analytics")
      .select("nps_score")
      .order("created_at", { ascending: false })
      .limit(1);

    // 8. Pending orders & recovery
    const { count: pendingRecovery } = await supabase
      .from("recovery_campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .gte("created_at", startOfMonth.toISOString());

    // Build autonomous report
    const report = {
      timestamp: now.toISOString(),
      revenue: {
        today: todayRevenue,
        month: monthRevenue,
        projected_month: monthRevenue > 0 ? (monthRevenue / now.getDate()) * 30 : 0,
        avg_ticket: monthConsultations ? monthRevenue / monthConsultations : 0,
      },
      consultations: {
        today: todayConsultations || 0,
        month: monthConsultations || 0,
        projected_month: monthConsultations ? Math.round((monthConsultations / now.getDate()) * 30) : 0,
      },
      funnel: {
        triages: totalTriages || 0,
        completed: completedTriages || 0,
        conversion_rate: Math.round(conversionRate * 100) / 100,
      },
      supply: {
        online_doctors: onlineDoctors || 0,
        total_doctors: totalDoctors || 0,
        utilization: totalDoctors ? ((onlineDoctors || 0) / totalDoctors * 100) : 0,
      },
      prescriptions: {
        month: monthPrescriptions || 0,
        daily_avg: monthPrescriptions ? Math.round((monthPrescriptions / now.getDate()) * 10) / 10 : 0,
      },
      subscriptions: {
        active: activeSubscriptions || 0,
        mrr: (activeSubscriptions || 0) * 149, // avg subscription value
      },
      health: {
        nps: npsData?.[0]?.nps_score || 0,
        pending_recovery: pendingRecovery || 0,
      },
      autonomy_score: calculateAutonomyScore({
        conversionRate,
        onlineDoctors: onlineDoctors || 0,
        activeSubscriptions: activeSubscriptions || 0,
        monthRevenue,
        nps: npsData?.[0]?.nps_score || 0,
      }),
    };

    // Store report as notification for admin
    await supabase.from("notifications").insert({
      user_id: "00000000-0000-0000-0000-000000000000", // System/admin
      type: "revenue_report",
      title: `📊 Relatório Autônomo - R$ ${todayRevenue.toFixed(2)} hoje`,
      message: `Faturamento mês: R$ ${monthRevenue.toFixed(2)} | Projeção: R$ ${report.revenue.projected_month.toFixed(2)} | Conversão: ${conversionRate.toFixed(1)}% | Docs online: ${onlineDoctors}/${totalDoctors}`,
      metadata: report,
    });

    return new Response(JSON.stringify({ success: true, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("revenue-tracker error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateAutonomyScore(metrics: {
  conversionRate: number;
  onlineDoctors: number;
  activeSubscriptions: number;
  monthRevenue: number;
  nps: number;
}): { score: number; level: string; bottlenecks: string[] } {
  let score = 0;
  const bottlenecks: string[] = [];

  // Conversion (25 pts)
  if (metrics.conversionRate >= 45) score += 25;
  else if (metrics.conversionRate >= 30) score += 15;
  else { score += 5; bottlenecks.push("Conversão abaixo de 30%"); }

  // Doctor supply (25 pts)
  if (metrics.onlineDoctors >= 10) score += 25;
  else if (metrics.onlineDoctors >= 5) score += 15;
  else { score += 5; bottlenecks.push("Poucos médicos online"); }

  // Revenue (25 pts)
  if (metrics.monthRevenue >= 100000) score += 25;
  else if (metrics.monthRevenue >= 50000) score += 15;
  else { score += 5; bottlenecks.push("Faturamento abaixo da meta"); }

  // Subscriptions + NPS (25 pts)
  if (metrics.activeSubscriptions >= 100 && metrics.nps >= 70) score += 25;
  else if (metrics.activeSubscriptions >= 50) score += 15;
  else { score += 5; bottlenecks.push("Poucas assinaturas ativas"); }

  const level = score >= 90 ? "🚀 MÁQUINA AUTÔNOMA"
    : score >= 70 ? "⚡ ALTA PERFORMANCE"
    : score >= 50 ? "📈 CRESCIMENTO"
    : "🔧 OTIMIZAÇÃO NECESSÁRIA";

  return { score, level, bottlenecks };
}
