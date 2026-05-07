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


  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    const { month, year, dryRun = true } = await req.json();
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    // 1. Check if already distributed this month
    const { data: existingPayouts } = await supabase
      .from("payout_history")
      .select("id")
      .eq("period_month", targetMonth)
      .eq("period_year", targetYear)
      .eq("status", "completed")
      .limit(1);

    if (existingPayouts && existingPayouts.length > 0 && !dryRun) {
      return new Response(JSON.stringify({
        error: "Distribuição já foi realizada para este período",
        alreadyPaid: true,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Calculate total revenue from completed consultations
    const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString();
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString();

    const { data: completedAppointments } = await supabase
      .from("appointments")
      .select("amount, doctor_id")
      .eq("status", "completed")
      .eq("payment_status", "paid")
      .gte("scheduled_at", startDate)
      .lte("scheduled_at", endDate);

    const totalRevenue = (completedAppointments || []).reduce((sum, a) => sum + (a.amount || 0), 0);
    const distributionPool = totalRevenue * DISTRIBUTION_RATE;

    if (distributionPool <= 0) {
      return new Response(JSON.stringify({
        message: "Nenhuma receita de consultas para distribuir",
        totalRevenue: 0,
        distributionPool: 0,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Get performance metrics with doctor data
    const { data: metrics } = await supabase
      .from("doctor_performance_metrics")
      .select("*, doctors!inner(id, user_id, is_verified)")
      .eq("month", targetMonth)
      .eq("year", targetYear);

    // Fetch financial data separately (isolated table)
    const doctorIds = (metrics || []).map(m => m.doctor_id);
    const { data: financialData } = await supabase
      .from("doctors_financial")
      .select("doctor_id, pix_key")
      .in("doctor_id", doctorIds);
    const pixMap = new Map((financialData || []).map(f => [f.doctor_id, f.pix_key]));

    if (!metrics || metrics.length === 0) {
      return new Response(JSON.stringify({
        message: "Nenhum médico com métricas para este período",
        distributionPool,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Calculate shares
    const totalWeightedScore = metrics.reduce((sum, m) => sum + Number(m.weighted_score), 0);

    const payoutPlan = metrics.map((m) => {
      const share = totalWeightedScore > 0 ? (Number(m.weighted_score) / totalWeightedScore) : 0;
      const amount = Math.round(distributionPool * share * 100) / 100;
      return {
        doctor_id: m.doctor_id,
        user_id: m.doctors.user_id,
        pix_key: pixMap.get(m.doctor_id) || null,
        is_verified: m.doctors.is_verified,
        consultations: m.consultations_count,
        hoursOnline: Number(m.hours_online),
        weightedScore: Number(m.weighted_score),
        sharePercentage: Math.round(share * 10000) / 100,
        amount,
      };
    }).filter((p) => p.amount >= 1.00) // Min R$ 1.00
      .sort((a, b) => b.amount - a.amount);

    // 5. If dry run, return the plan without executing
    if (dryRun) {
      return new Response(JSON.stringify({
        dryRun: true,
        summary: {
          month: targetMonth,
          year: targetYear,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          distributionPool: Math.round(distributionPool * 100) / 100,
          totalDoctors: payoutPlan.length,
          totalWeightedScore: Math.round(totalWeightedScore * 100) / 100,
          doctorsWithPix: payoutPlan.filter((p) => p.pix_key).length,
          doctorsWithoutPix: payoutPlan.filter((p) => !p.pix_key).length,
        },
        payouts: payoutPlan.map((p) => ({
          doctor_id: p.doctor_id,
          amount: p.amount,
          sharePercentage: p.sharePercentage,
          hasPix: !!p.pix_key,
          consultations: p.consultations,
          hoursOnline: p.hoursOnline,
        })),
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 6. Execute Pix payouts via Mercado Pago
    const results = [];

    for (const payout of payoutPlan) {
      const payoutRecord: any = {
        doctor_id: payout.doctor_id,
        user_id: payout.user_id,
        amount: payout.amount,
        pix_key: payout.pix_key || "não_cadastrada",
        period_month: targetMonth,
        period_year: targetYear,
        weighted_score: payout.weightedScore,
        share_percentage: payout.sharePercentage,
      };

      if (!payout.pix_key) {
        payoutRecord.status = "failed";
        payoutRecord.error_message = "Chave Pix não cadastrada";
        results.push({ ...payoutRecord, success: false });
        await supabase.from("payout_history").insert(payoutRecord);
        continue;
      }

      if (!payout.is_verified) {
        payoutRecord.status = "failed";
        payoutRecord.error_message = "Médico não verificado";
        results.push({ ...payoutRecord, success: false });
        await supabase.from("payout_history").insert(payoutRecord);
        continue;
      }

      // Attempt Mercado Pago Pix transfer
      if (MERCADO_PAGO_ACCESS_TOKEN) {
        try {
          const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
              "X-Idempotency-Key": `payout-${payout.doctor_id}-${targetMonth}-${targetYear}`,
            },
            body: JSON.stringify({
              transaction_amount: payout.amount,
              description: `Distribuição 10% lucros - ${targetMonth}/${targetYear} - Planta y Raiz`,
              payment_method_id: "pix",
              payer: {
                email: "financeiro@plantayraiz.com.br",
              },
              point_of_interaction: {
                type: "PIX_TRANSFER",
                transaction_data: {
                  pix_key: payout.pix_key,
                },
              },
            }),
          });

          const mpData = await mpResponse.json();

          if (mpResponse.ok && (mpData.status === "approved" || mpData.status === "pending")) {
            payoutRecord.status = "completed";
            payoutRecord.mercadopago_payment_id = String(mpData.id);
            payoutRecord.processed_at = new Date().toISOString();
            results.push({ ...payoutRecord, success: true, mpStatus: mpData.status });
          } else {
            payoutRecord.status = "failed";
            payoutRecord.error_message = mpData.message || `MP status: ${mpData.status}`;
            results.push({ ...payoutRecord, success: false, mpError: mpData });
          }
        } catch (err) {
          payoutRecord.status = "failed";
          const errMsg = err instanceof Error ? err.message : String(err);
          payoutRecord.error_message = `Erro de rede: ${errMsg}`;
          results.push({ ...payoutRecord, success: false });
        }
      } else {
        // No MP token — record as pending for manual processing
        payoutRecord.status = "pending_manual";
        payoutRecord.error_message = "Token Mercado Pago não configurado - pagamento manual necessário";
        results.push({ ...payoutRecord, success: false });
      }

      await supabase.from("payout_history").insert(payoutRecord);
    }

    // 7. Update distribution pool status
    await supabase.from("revenue_distribution_pool")
      .update({
        distributed_amount: results.filter((r) => r.success).reduce((s, r) => s + r.amount, 0),
        status: "distributed",
      })
      .eq("month", targetMonth)
      .eq("year", targetYear);

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return new Response(JSON.stringify({
      dryRun: false,
      summary: {
        month: targetMonth,
        year: targetYear,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        distributionPool: Math.round(distributionPool * 100) / 100,
        totalPayouts: results.length,
        successCount,
        failedCount,
        totalPaid: results.filter((r) => r.success).reduce((s, r) => s + r.amount, 0),
      },
      results,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Payout error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
