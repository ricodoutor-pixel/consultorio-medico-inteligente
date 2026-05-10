// 🩺 Cron Master Health-Check + Auto-Healing (Fase 2)
// 1. Verifica todos os crons ativos
// 2. Tenta re-executar crons falhados/atrasados (auto-heal)
// 3. Só alerta no Discord se persistir após o retry
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");

// Janelas customizadas (semanais/mensais)
const LONG_INTERVAL_JOBS: Record<string, number> = {
  "anvisa-guardian-weekly": 24 * 8,
  "crm-guardian-monthly": 24 * 32,
};
const DEFAULT_WINDOW_HOURS = 26;

// 🔧 Mapa jobname → edge function path para auto-healing
const JOB_TO_FUNCTION: Record<string, string> = {
  auto_renewal_daily: "auto-renewal",
  prescription_expiry_notify: "prescription-expiry-notify",
  revenue_tracker_daily: "revenue-tracker",
  "anvisa-guardian-weekly": "anvisa-guardian",
  "crm-guardian-monthly": "crm-guardian",
  "financial-reconciliation-daily": "financial-reconciliation",
  "meta-capi-sync": "send-meta-capi",
  "appointment-automation-cron": "appointment-automation",
  "nps-auto-dispatch-cron": "nps-auto-dispatch",
  "doctor-onboarding-cron": "doctor-onboarding-automation",
  "brisa-triage-closer-cron": "brisa-triage-closer",
  "system-monitor-cron": "system-monitor",
  "recovery-engine-cron": "recovery-engine",
  "cart-recovery-cron": "cart-recovery",
  "pharmacy-cart-recovery-cron": "pharmacy-cart-recovery",
  "queue-match-cron": "queue-match",
  "job-queue-cron": "job-queue",
};

async function discord(content: string, level: "info" | "warn" | "critical" = "info") {
  if (!DISCORD_WEBHOOK_URL) return;
  const emoji = level === "critical" ? "🔴" : level === "warn" ? "🟡" : "🟢";
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `${emoji} **[Cron Master]** ${content}` }),
    });
  } catch (e) {
    console.error("Discord webhook error", e);
  }
}

// 🔧 Tenta re-executar uma cron via fetch direto na edge function
async function attemptHeal(
  jobname: string,
): Promise<{ healed: boolean; status: number | null; error?: string; fnPath?: string }> {
  const fnPath = JOB_TO_FUNCTION[jobname];
  if (!fnPath) return { healed: false, status: null, error: "no_mapping" };

  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${fnPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ triggered_by: "cron-master-auto-heal", at: new Date().toISOString() }),
    });
    // Drain body to free socket
    const txt = await r.text().catch(() => "");
    return {
      healed: r.ok,
      status: r.status,
      error: r.ok ? undefined : txt.slice(0, 200),
      fnPath,
    };
  } catch (e) {
    return { healed: false, status: null, error: String(e), fnPath };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: jobs, error } = await supabase.rpc("get_cron_health", {
    _window_hours: DEFAULT_WINDOW_HOURS,
  });

  if (error) {
    await discord(`Falha ao consultar get_cron_health: ${error.message}`, "critical");
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const unhealthy: any[] = [];
  const healthy: any[] = [];

  for (const j of jobs ?? []) {
    const windowH = LONG_INTERVAL_JOBS[j.jobname] ?? DEFAULT_WINDOW_HOURS;
    const isOverdue =
      !j.last_run_at || (j.hours_since_last_run !== null && j.hours_since_last_run > windowH);
    const isFailed = j.last_status && !["succeeded", "running"].includes(String(j.last_status));

    if (isFailed || isOverdue) {
      unhealthy.push({ ...j, _kind: isFailed ? "failed" : "overdue" });
    } else {
      healthy.push(j);
    }
  }

  // 🔧 Tentativa de auto-heal
  const healed: any[] = [];
  const stillBroken: any[] = [];

  for (const j of unhealthy) {
    const result = await attemptHeal(j.jobname);

    await supabase.from("audit_log").insert({
      action: "cron_auto_heal_attempt",
      table_name: "cron.job",
      record_id: "00000000-0000-0000-0000-000000000000",
      new_data: {
        jobname: j.jobname,
        kind: j._kind,
        last_status: j.last_status,
        hours_since_last_run: j.hours_since_last_run,
        heal_result: result,
      },
    });

    if (result.healed) {
      healed.push({ ...j, heal: result });
    } else {
      stillBroken.push({ ...j, heal: result });
      await supabase.from("audit_log").insert({
        action: j._kind === "failed" ? "cron_job_failed" : "cron_job_overdue",
        table_name: "cron.job",
        record_id: "00000000-0000-0000-0000-000000000000",
        new_data: {
          jobname: j.jobname,
          schedule: j.schedule,
          last_run_at: j.last_run_at,
          last_status: j.last_status,
          hours_since_last_run: j.hours_since_last_run,
          heal_attempt: result,
        },
      });
    }
  }

  const total = (jobs ?? []).length;
  let level: "info" | "warn" | "critical" = "info";
  if (stillBroken.length > 0) level = "critical";
  else if (healed.length > 0) level = "warn";

  let summary =
    `Health-check + Auto-Healing concluído\n` +
    `• Total: **${total}** | ✅ Saudáveis: **${healthy.length}** | 🔧 Curados: **${healed.length}** | 🔴 Persistem: **${stillBroken.length}**`;

  if (healed.length > 0) {
    summary +=
      `\n\n**🔧 Auto-curados:**\n` +
      healed
        .map((j) => `• \`${j.jobname}\` (${j._kind}) → fn \`${j.heal.fnPath}\` ${j.heal.status}`)
        .join("\n");
  }
  if (stillBroken.length > 0) {
    summary +=
      `\n\n**🔴 Persistem após retry:**\n` +
      stillBroken
        .map(
          (j) =>
            `• \`${j.jobname}\` (${j._kind}) — retry ${j.heal.status ?? "N/A"} ${j.heal.error ? `→ ${j.heal.error.slice(0, 80)}` : ""}`,
        )
        .join("\n");
  }

  // Só envia Discord se houver algo a reportar
  if (healed.length > 0 || stillBroken.length > 0) {
    await discord(summary, level);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      total,
      healthy: healthy.length,
      healed: healed.length,
      still_broken: stillBroken.length,
      details: { healed, stillBroken, healthy },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
