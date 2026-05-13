// 🩺 Cron Master Health-Check + Auto-Healing (Fase 2)
// 1. Verifica todos os crons ativos
// 2. Tenta re-executar crons falhados/atrasados (auto-heal)
// 3. Só alerta no Discord se persistir após o retry
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

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
  "infra-self-healing-hourly": "infra-self-healing",
  "hostinger-sync-daily": "hostinger-sync",
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

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;


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

  // 🔧 Tentativa de auto-heal com Circuit Breaker
  const healed: any[] = [];
  const stillBroken: any[] = [];
  const breakerSkipped: any[] = [];
  const breakerOpened: any[] = [];

  for (const j of unhealthy) {
    // Carrega ou cria estado do breaker
    let { data: cb } = await supabase
      .from("cron_circuit_breaker")
      .select("*")
      .eq("job_name", j.jobname)
      .maybeSingle();

    if (!cb) {
      const { data: created } = await supabase
        .from("cron_circuit_breaker")
        .insert({ job_name: j.jobname })
        .select()
        .single();
      cb = created;
    }

    const threshold = cb?.threshold ?? 5;
    const cooldownMin = cb?.cooldown_minutes ?? 30;
    const openedAt = cb?.opened_at ? new Date(cb.opened_at).getTime() : 0;
    const cooldownExpired = openedAt > 0 && Date.now() - openedAt > cooldownMin * 60_000;

    // Breaker OPEN → pula tentativa salvo cooldown expirado (half_open probe)
    if (cb?.state === "open" && !cooldownExpired) {
      breakerSkipped.push({ ...j, breaker: cb });
      await supabase.from("audit_log").insert({
        action: "cron_breaker_open_skip",
        table_name: "cron_circuit_breaker",
        record_id: cb.id,
        new_data: { jobname: j.jobname, consecutive_failures: cb.consecutive_failures },
      });
      continue;
    }

    if (cb?.state === "open" && cooldownExpired) {
      await supabase
        .from("cron_circuit_breaker")
        .update({ state: "half_open" })
        .eq("id", cb.id);
    }

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
        breaker_state_before: cb?.state,
      },
    });

    if (result.healed) {
      healed.push({ ...j, heal: result });
      await supabase
        .from("cron_circuit_breaker")
        .update({
          state: "closed",
          consecutive_failures: 0,
          consecutive_successes: (cb?.consecutive_successes ?? 0) + 1,
          last_success_at: new Date().toISOString(),
          opened_at: null,
          notes: null,
        })
        .eq("id", cb!.id);
    } else {
      stillBroken.push({ ...j, heal: result });
      const newFails = (cb?.consecutive_failures ?? 0) + 1;
      const shouldOpen = newFails >= threshold;
      await supabase
        .from("cron_circuit_breaker")
        .update({
          state: shouldOpen ? "open" : (cb?.state === "half_open" ? "open" : "closed"),
          consecutive_failures: newFails,
          consecutive_successes: 0,
          last_failure_at: new Date().toISOString(),
          opened_at: shouldOpen || cb?.state === "half_open"
            ? new Date().toISOString()
            : cb?.opened_at,
          notes: result.error?.slice(0, 500) ?? null,
        })
        .eq("id", cb!.id);

      if (shouldOpen) breakerOpened.push({ ...j, breaker_failures: newFails });

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
          consecutive_failures: newFails,
          breaker_opened: shouldOpen,
        },
      });
    }
  }

  const total = (jobs ?? []).length;
  let level: "info" | "warn" | "critical" = "info";
  if (stillBroken.length > 0 || breakerOpened.length > 0) level = "critical";
  else if (healed.length > 0 || breakerSkipped.length > 0) level = "warn";

  let summary =
    `Health-check + Auto-Healing + Circuit Breaker\n` +
    `• Total: **${total}** | ✅ **${healthy.length}** | 🔧 **${healed.length}** | 🔴 **${stillBroken.length}** | ⛔ Breaker open: **${breakerSkipped.length}** | 🚨 Novos breakers: **${breakerOpened.length}**`;

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

  if (breakerOpened.length > 0) {
    summary +=
      `\n\n**🚨 Circuit Breakers ABERTOS (cron pausado):**\n` +
      breakerOpened.map((j) => `• \`${j.jobname}\` (${j.breaker_failures} falhas)`).join("\n");
  }
  if (breakerSkipped.length > 0) {
    summary +=
      `\n\n**⛔ Pulados (breaker open):**\n` +
      breakerSkipped.map((j) => `• \`${j.jobname}\``).join("\n");
  }

  if (healed.length > 0 || stillBroken.length > 0 || breakerOpened.length > 0) {
    await discord(summary, level);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      total,
      healthy: healthy.length,
      healed: healed.length,
      still_broken: stillBroken.length,
      breaker_skipped: breakerSkipped.length,
      breaker_opened: breakerOpened.length,
      details: { healed, stillBroken, healthy, breakerSkipped, breakerOpened },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
