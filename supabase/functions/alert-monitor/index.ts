// ============================================================================
// ALERT MONITOR — Watchdog Edge Functions + Prescription Dispatch Latency
// Dispara alerta no Discord SRE quando:
//  - Erros 401/403/404/409 ultrapassam thresholds em janela de 5min
//  - Envio de prescrição (brisa-prescription-dispatch) excede latência ou falha
// Executado via pg_cron a cada 5 minutos com service_role.
// ============================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

import { requireServiceAuth } from "../_shared/service-auth.ts";

// Thresholds (janela de 5min)
const HTTP_WARN = 10;     // ≥10 erros do MESMO status = WARNING
const HTTP_CRIT = 30;     // ≥30 = CRITICAL
const RX_LAT_WARN_MS = 8000;   // p95 acima disto = WARNING
const RX_LAT_CRIT_MS = 15000;  // p95 acima disto = CRITICAL
const RX_FAIL_RATE_CRIT = 0.20; // >20% falhas = CRITICAL
const WATCHED_STATUSES = [401, 403, 404, 409];

async function sendDiscord(
  supabase: ReturnType<typeof createClient>,
  level: "WARNING" | "CRITICAL",
  title: string,
  description: string,
  fields: { name: string; value: string; inline?: boolean }[],
) {
  try {
    await supabase.functions.invoke("sre-alert", {
      body: { level, title, description, fields },
    });
  } catch (e) {
    console.error("[alert-monitor] sre-alert failed", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const since = new Date(Date.now() - 5 * 60_000).toISOString();
  const sinceRx = new Date(Date.now() - 30 * 60_000).toISOString();
  const alerts: string[] = [];

  // ---------- 1) HTTP 4xx em edge functions ----------
  // Convenção: edge functions registram falhas em error_logs com
  // source='edge_function', metadata.status_code = <int>, metadata.fn = '<name>'
  const { data: httpErrs, error: httpErr } = await supabase
    .from("error_logs")
    .select("metadata, created_at")
    .eq("source", "edge_function")
    .gte("created_at", since)
    .limit(2000);

  if (httpErr) console.error("[alert-monitor] error_logs query failed", httpErr);

  const byStatus: Record<number, { count: number; fns: Record<string, number> }> = {};
  for (const row of httpErrs ?? []) {
    const sc = Number((row.metadata as any)?.status_code);
    if (!WATCHED_STATUSES.includes(sc)) continue;
    const fn = String((row.metadata as any)?.fn ?? "unknown");
    byStatus[sc] ??= { count: 0, fns: {} };
    byStatus[sc].count += 1;
    byStatus[sc].fns[fn] = (byStatus[sc].fns[fn] ?? 0) + 1;
  }

  for (const sc of WATCHED_STATUSES) {
    const b = byStatus[sc];
    if (!b) continue;
    let level: "WARNING" | "CRITICAL" | null = null;
    if (b.count >= HTTP_CRIT) level = "CRITICAL";
    else if (b.count >= HTTP_WARN) level = "WARNING";
    if (!level) continue;
    const topFns = Object.entries(b.fns)
      .sort((a, b2) => b2[1] - a[1])
      .slice(0, 5)
      .map(([fn, n]) => `${fn}: ${n}`)
      .join("\n");
    await sendDiscord(
      supabase,
      level,
      `Pico de HTTP ${sc} em edge functions`,
      `${b.count} ocorrências nos últimos 5min (threshold ${level === "CRITICAL" ? HTTP_CRIT : HTTP_WARN}).`,
      [
        { name: "Status", value: String(sc), inline: true },
        { name: "Total", value: String(b.count), inline: true },
        { name: "Top funções", value: topFns || "n/d" },
      ],
    );
    alerts.push(`http_${sc}=${b.count}`);
  }

  // ---------- 2) Latência / falha do brisa-prescription-dispatch ----------
  const { data: rxEvents } = await supabase
    .from("ai_events")
    .select("status, duration_ms, output_data, created_at")
    .eq("ai_name", "brisa_coo")
    .eq("event_type", "whatsapp_delivered")
    .gte("created_at", sinceRx)
    .limit(500);

  const total = rxEvents?.length ?? 0;
  if (total >= 5) {
    const failed = (rxEvents ?? []).filter((e) => e.status !== "completed").length;
    const failRate = failed / total;
    const durations = (rxEvents ?? [])
      .map((e) => Number(e.duration_ms ?? 0))
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
    const p95 =
      durations.length > 0
        ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))]
        : 0;

    let level: "WARNING" | "CRITICAL" | null = null;
    const reasons: string[] = [];
    if (failRate >= RX_FAIL_RATE_CRIT) {
      level = "CRITICAL";
      reasons.push(`fail_rate=${(failRate * 100).toFixed(1)}%`);
    }
    if (p95 >= RX_LAT_CRIT_MS) {
      level = "CRITICAL";
      reasons.push(`p95=${p95}ms`);
    } else if (p95 >= RX_LAT_WARN_MS) {
      level = level ?? "WARNING";
      reasons.push(`p95=${p95}ms`);
    }
    if (level) {
      await sendDiscord(
        supabase,
        level,
        "Brisa Prescription Dispatch degradado",
        `Janela 30min — ${reasons.join(", ")}`,
        [
          { name: "Total envios", value: String(total), inline: true },
          { name: "Falhas", value: `${failed}`, inline: true },
          { name: "p95 latência", value: `${p95}ms`, inline: true },
          { name: "Fail rate", value: `${(failRate * 100).toFixed(1)}%`, inline: true },
          { name: "Warn / Crit", value: `${RX_LAT_WARN_MS}ms / ${RX_LAT_CRIT_MS}ms`, inline: true },
        ],
      );
      alerts.push(`rx_${level.toLowerCase()}`);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, alerts, window_min: 5 }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
