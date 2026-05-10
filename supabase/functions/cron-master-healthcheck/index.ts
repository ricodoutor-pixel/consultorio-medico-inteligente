// 🩺 Cron Master Health-Check — Meta-auditoria diária
// Verifica se todos os crons agendados rodaram e tiveram sucesso nas últimas 24-26h.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");

// Crons que podem rodar com janelas maiores (semanais/mensais) — não alertar se OK
const LONG_INTERVAL_JOBS: Record<string, number> = {
  "anvisa-guardian-weekly": 24 * 8, // 8 dias
  "crm-guardian-monthly": 24 * 32, // 32 dias
};
const DEFAULT_WINDOW_HOURS = 26;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: jobs, error } = await supabase.rpc("get_cron_health", { _window_hours: DEFAULT_WINDOW_HOURS });

  if (error) {
    await discord(`Falha ao consultar get_cron_health: ${error.message}`, "critical");
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const failed: any[] = [];
  const overdue: any[] = [];
  const healthy: any[] = [];

  for (const j of jobs ?? []) {
    const windowH = LONG_INTERVAL_JOBS[j.jobname] ?? DEFAULT_WINDOW_HOURS;
    const isOverdue = !j.last_run_at || (j.hours_since_last_run !== null && j.hours_since_last_run > windowH);
    const isFailed = j.last_status && !["succeeded", "running"].includes(String(j.last_status));

    if (isFailed) failed.push(j);
    else if (isOverdue) overdue.push(j);
    else healthy.push(j);
  }

  // Audit log
  for (const j of [...failed, ...overdue]) {
    await supabase.from("audit_log").insert({
      action: failed.includes(j) ? "cron_job_failed" : "cron_job_overdue",
      table_name: "cron.job",
      record_id: "00000000-0000-0000-0000-000000000000",
      new_data: {
        jobname: j.jobname,
        schedule: j.schedule,
        last_run_at: j.last_run_at,
        last_status: j.last_status,
        hours_since_last_run: j.hours_since_last_run,
      },
    });
  }

  const total = (jobs ?? []).length;
  const summary =
    `Health-check diário concluído\n` +
    `• Total de crons ativos: **${total}**\n` +
    `• ✅ Saudáveis: **${healthy.length}**\n` +
    `• 🟡 Atrasados: **${overdue.length}**\n` +
    `• 🔴 Falhados: **${failed.length}**`;

  let level: "info" | "warn" | "critical" = "info";
  if (failed.length > 0) level = "critical";
  else if (overdue.length > 0) level = "warn";

  let extra = "";
  if (failed.length > 0) {
    extra +=
      `\n\n**🔴 Crons falhados:**\n` +
      failed.map((j) => `• \`${j.jobname}\` (${j.schedule}) — status: \`${j.last_status}\``).join("\n");
  }
  if (overdue.length > 0) {
    extra +=
      `\n\n**🟡 Crons atrasados:**\n` +
      overdue
        .map((j) => `• \`${j.jobname}\` (${j.schedule}) — última: ${j.hours_since_last_run ? j.hours_since_last_run + "h atrás" : "nunca"}`)
        .join("\n");
  }

  await discord(summary + extra, level);

  return new Response(
    JSON.stringify({
      ok: true,
      total,
      healthy: healthy.length,
      overdue: overdue.length,
      failed: failed.length,
      details: { failed, overdue, healthy },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
