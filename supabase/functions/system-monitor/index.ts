import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// SYSTEM MONITOR — Monitoramento & Alertas (substitui Sentry)
// Planta & Raiz 3.0 — Observability Layer
// ============================================================================

const THRESHOLDS = {
  error_rate: 0.05,         // 5% — critical
  payment_failure_rate: 0.10, // 10% — critical
  nps_low: 5,               // Score < 5 — warning
  webhook_failure: 3,       // 3 falhas consecutivas — critical
  job_dead_count: 10,       // 10 dead jobs — warning
};

interface Alert {
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  metric_value: number;
  threshold: number;
  timestamp: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;


  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action || "check";

    // CHECK — verificação completa de saúde
    if (action === "check") {
      const alerts: Alert[] = [];
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
      const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();

      // 1. Payment failure rate (last hour)
      const { count: totalPayments } = await supabase
        .from("payment_webhooks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneHourAgo);

      const { count: failedPayments } = await supabase
        .from("payment_webhooks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneHourAgo)
        .in("status", ["failed", "rejected", "cancelled"]);

      const paymentFailureRate = (totalPayments && totalPayments > 0)
        ? (failedPayments || 0) / totalPayments
        : 0;

      if (paymentFailureRate > THRESHOLDS.payment_failure_rate) {
        alerts.push({
          type: "payment_failure",
          severity: "critical",
          message: `Taxa de falha de pagamento alta: ${(paymentFailureRate * 100).toFixed(1)}%`,
          metric_value: paymentFailureRate,
          threshold: THRESHOLDS.payment_failure_rate,
          timestamp: now.toISOString(),
        });
      }

      // 2. Low NPS scores (last 24h)
      const { data: lowNps } = await supabase
        .from("nps_responses")
        .select("score, professional_id")
        .gte("created_at", oneDayAgo)
        .lt("score", THRESHOLDS.nps_low);

      if (lowNps && lowNps.length > 3) {
        alerts.push({
          type: "nps_low",
          severity: "warning",
          message: `${lowNps.length} avaliações NPS baixas (<${THRESHOLDS.nps_low}) nas últimas 24h`,
          metric_value: lowNps.length,
          threshold: 3,
          timestamp: now.toISOString(),
        });
      }

      // 3. Dead jobs in queue
      const { count: deadJobs } = await supabase
        .from("job_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "dead");

      if ((deadJobs || 0) > THRESHOLDS.job_dead_count) {
        alerts.push({
          type: "dead_jobs",
          severity: "warning",
          message: `${deadJobs} jobs falharam permanentemente na fila`,
          metric_value: deadJobs || 0,
          threshold: THRESHOLDS.job_dead_count,
          timestamp: now.toISOString(),
        });
      }

      // 4. Escrow stuck (held > 48h without release)
      const twoDaysAgo = new Date(now.getTime() - 48 * 3600000).toISOString();
      const { count: stuckEscrows } = await supabase
        .from("escrow_transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "held")
        .lt("created_at", twoDaysAgo);

      if ((stuckEscrows || 0) > 0) {
        alerts.push({
          type: "stuck_escrow",
          severity: "critical",
          message: `${stuckEscrows} transações escrow travadas há mais de 48h`,
          metric_value: stuckEscrows || 0,
          threshold: 0,
          timestamp: now.toISOString(),
        });
      }

      // 5. Doctors offline check
      const { count: totalDoctors } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", true);

      const { count: onlineDoctors } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("is_online", true);

      if (totalDoctors && totalDoctors > 0 && (onlineDoctors || 0) === 0) {
        alerts.push({
          type: "no_doctors_online",
          severity: "warning",
          message: "Nenhum médico online no momento",
          metric_value: 0,
          threshold: 1,
          timestamp: now.toISOString(),
        });
      }

      // Store alerts in DB
      if (alerts.length > 0) {
        await supabase.from("system_alerts").insert(
          alerts.map(a => ({
            alert_type: a.type,
            severity: a.severity,
            message: a.message,
            metric_value: a.metric_value,
            threshold_value: a.threshold,
            resolved: false,
          }))
        );

        // Notify admins for critical alerts
        const criticalAlerts = alerts.filter(a => a.severity === "critical");
        if (criticalAlerts.length > 0) {
          // Get admin users
          const { data: admins } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");

          if (admins) {
            for (const admin of admins) {
              await supabase.from("notifications").insert({
                user_id: admin.user_id,
                title: "🚨 Alerta Crítico do Sistema",
                message: criticalAlerts.map(a => a.message).join(" | "),
                type: "system_alert",
              });
            }
          }
        }
      }

      // Build health summary
      const { count: totalConsultations24h } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo);

      const { count: completedConsultations24h } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo)
        .eq("status", "completed");

      const { count: pendingJobs } = await supabase
        .from("job_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const overallStatus = alerts.some(a => a.severity === "critical")
        ? "critical"
        : alerts.some(a => a.severity === "warning")
          ? "warning"
          : "healthy";

      return new Response(JSON.stringify({
        status: overallStatus,
        timestamp: now.toISOString(),
        alerts,
        metrics: {
          payments: { total: totalPayments || 0, failed: failedPayments || 0, failureRate: paymentFailureRate },
          nps: { lowScores24h: lowNps?.length || 0 },
          jobs: { pending: pendingJobs || 0, dead: deadJobs || 0 },
          escrow: { stuck: stuckEscrows || 0 },
          doctors: { total: totalDoctors || 0, online: onlineDoctors || 0 },
          consultations24h: { total: totalConsultations24h || 0, completed: completedConsultations24h || 0 },
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // LOG_ERROR — registrar erro do client-side
    if (action === "log_error") {
      const { error_message, stack, context, endpoint, user_id } = body;

      await supabase.from("system_errors").insert({
        error_message: error_message || "Unknown error",
        stack: stack || null,
        context: context || null,
        endpoint: endpoint || null,
        user_id: user_id || null,
        resolved: false,
      });

      return new Response(JSON.stringify({ logged: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RESOLVE_ALERT
    if (action === "resolve_alert") {
      const { alert_id } = body;
      await supabase.from("system_alerts").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", alert_id);

      return new Response(JSON.stringify({ resolved: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DASHBOARD — dados para o painel de monitoramento
    if (action === "dashboard") {
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

      const { data: recentAlerts } = await supabase
        .from("system_alerts")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: recentErrors } = await supabase
        .from("system_errors")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: jobStats } = await supabase
        .from("job_queue")
        .select("queue, status")
        .gte("created_at", oneDayAgo);

      // Aggregate job stats
      const queueStats: Record<string, Record<string, number>> = {};
      if (jobStats) {
        for (const j of jobStats) {
          if (!queueStats[j.queue]) queueStats[j.queue] = {};
          queueStats[j.queue][j.status] = (queueStats[j.queue][j.status] || 0) + 1;
        }
      }

      return new Response(JSON.stringify({
        alerts: recentAlerts || [],
        errors: recentErrors || [],
        jobQueues: queueStats,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Monitor error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
