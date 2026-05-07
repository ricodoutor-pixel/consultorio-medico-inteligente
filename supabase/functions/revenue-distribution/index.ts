import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISTRIBUTION_RATE = 0.10; // 10% dos lucros

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

    const url = new URL(req.url);
    const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));
    const doctorId = url.searchParams.get("doctorId");

    // 1. Calculate total platform revenue from completed consultations this month
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: completedAppointments } = await supabase
      .from("appointments")
      .select("amount, doctor_id")
      .eq("status", "completed")
      .eq("payment_status", "paid")
      .gte("scheduled_at", startDate)
      .lte("scheduled_at", endDate);

    const totalRevenue = (completedAppointments || []).reduce((sum, a) => sum + (a.amount || 0), 0);
    const distributionPool = totalRevenue * DISTRIBUTION_RATE;

    // 2. Get all active doctors with their performance metrics
    const { data: metrics } = await supabase
      .from("doctor_performance_metrics")
      .select("*, doctors!inner(user_id, is_online)")
      .eq("month", month)
      .eq("year", year);

    // 3. Calculate weighted scores using the formula:
    // Peso = (Consultas × 0.5) + (HorasOnline × 0.3) + (Avaliação × 0.2)
    const doctorScores = (metrics || []).map((m) => ({
      doctor_id: m.doctor_id,
      consultations: m.consultations_count,
      hoursOnline: Number(m.hours_online),
      rating: Number(m.average_rating),
      tierMultiplier: Number(m.tier_multiplier),
      baseScore: (m.consultations_count * 0.5) + (Number(m.hours_online) * 0.3) + (Number(m.average_rating) * 0.2),
      weightedScore: Number(m.weighted_score),
    }));

    const totalWeightedScore = doctorScores.reduce((sum, d) => sum + d.weightedScore, 0);

    const distribution = doctorScores.map((d) => {
      const share = totalWeightedScore > 0 ? (d.weightedScore / totalWeightedScore) : 0;
      const estimatedAmount = distributionPool * share;
      return {
        ...d,
        sharePercentage: Math.round(share * 10000) / 100,
        estimatedAmount: Math.round(estimatedAmount * 100) / 100,
      };
    }).sort((a, b) => b.weightedScore - a.weightedScore);

    // If a specific doctor is requested, return their data
    let myDistribution = null;
    if (doctorId) {
      myDistribution = distribution.find((d) => d.doctor_id === doctorId) || null;
    }

    // Update pool record if exists
    const { data: existingPool } = await supabase.from("revenue_distribution_pool")
      .select("id").eq("month", month).eq("year", year).maybeSingle();
    
    if (existingPool) {
      await supabase.from("revenue_distribution_pool")
        .update({ total_pool: Math.round(distributionPool * 100) / 100 })
        .eq("id", existingPool.id);
    }

    return new Response(
      JSON.stringify({
        summary: {
          month,
          year,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          distributionRate: `${DISTRIBUTION_RATE * 100}%`,
          distributionPool: Math.round(distributionPool * 100) / 100,
          totalDoctors: distribution.length,
          totalWeightedScore: Math.round(totalWeightedScore * 100) / 100,
        },
        myDistribution,
        topDoctors: distribution.slice(0, 10),
        formula: {
          description: "Peso = (Consultas × 0.5) + (HorasOnline × 0.3) + (Avaliação × 0.2) × Multiplicador do Plano",
          multipliers: {
            basic: "1.0x",
            professional: "1.2x",
            premium: "1.5x",
            enterprise: "2.0x",
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Revenue distribution error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
