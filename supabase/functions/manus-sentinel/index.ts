// 🛡️ Manus Sentinel — Watchdog 24x7 com auto-correção e alerta WhatsApp
// Roda a cada 15min: audita erros, pagamentos, fila, conversão. Aplica correções e reporta ao Dr. Edilson.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";

type Severity = "green" | "yellow" | "red";
interface Issue { code: string; severity: Severity; detail: string; }
interface Correction { code: string; action: string; ok: boolean; detail?: string; }

async function sendWhatsApp(message: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/evolution-api-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({ phone: ADMIN_WHATSAPP, message }),
    });
    return res.ok;
  } catch (e) {
    console.error("[Sentinel] WhatsApp send failed", e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const t0 = Date.now();
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const issues: Issue[] = [];
  const corrections: Correction[] = [];
  const checks: Record<string, unknown> = {};

  try {
    // 1. ERROS RECENTES (últimas 15min)
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: errs } = await supa
      .from("error_logs")
      .select("severity, message, created_at")
      .gte("created_at", since)
      .limit(200);
    const critical = (errs || []).filter((e: any) => e.severity === "critical").length;
    const errorCount = errs?.length ?? 0;
    checks.errors_15min = { total: errorCount, critical };
    if (critical > 0) issues.push({ code: "ERR_CRITICAL", severity: "red", detail: `${critical} erros críticos em 15min` });
    else if (errorCount > 20) issues.push({ code: "ERR_HIGH", severity: "yellow", detail: `${errorCount} erros não-críticos em 15min` });

    // 2. PAGAMENTOS — Mercado Pago health
    const { data: mp } = await supa
      .from("payment_provider_health")
      .select("status, latency_ms, error_rate, checked_at")
      .eq("provider", "mercado_pago")
      .order("checked_at", { ascending: false })
      .limit(1);
    const mpHealth = mp?.[0];
    checks.mercado_pago = mpHealth || null;
    if (mpHealth?.status === "down") {
      issues.push({ code: "MP_DOWN", severity: "red", detail: "Mercado Pago OFFLINE" });
      // AUTO-CORREÇÃO: ativar PIX direto (contingency)
      const { error: cErr } = await supa
        .from("payment_contingency_config")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("is_active", false);
      corrections.push({ code: "MP_DOWN", action: "Ativado PIX direto (contingência)", ok: !cErr, detail: cErr?.message });
    } else if (mpHealth?.error_rate && Number(mpHealth.error_rate) > 0.1) {
      issues.push({ code: "MP_DEGRADED", severity: "yellow", detail: `MP error_rate ${(Number(mpHealth.error_rate) * 100).toFixed(1)}%` });
    }

    // 3. FILA DE CONSULTA TRAVADA (>30min sem movimento)
    const { count: queueStuck } = await supa
      .from("consultation_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "waiting")
      .lt("updated_at", new Date(Date.now() - 30 * 60 * 1000).toISOString());
    checks.queue_stuck = queueStuck ?? 0;
    if ((queueStuck ?? 0) > 0) issues.push({ code: "QUEUE_STUCK", severity: "red", detail: `${queueStuck} pacientes >30min na fila` });

    // 4. CONVERSÃO — leads última hora vs hora anterior
    const h1 = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const h2 = new Date(Date.now() - 120 * 60 * 1000).toISOString();
    const { count: leadsNow } = await supa.from("leads").select("id", { count: "exact", head: true }).gte("created_at", h1);
    const { count: leadsPrev } = await supa.from("leads").select("id", { count: "exact", head: true }).gte("created_at", h2).lt("created_at", h1);
    checks.leads = { last_hour: leadsNow, prev_hour: leadsPrev };
    if ((leadsPrev ?? 0) >= 5 && (leadsNow ?? 0) < (leadsPrev ?? 0) * 0.5) {
      issues.push({ code: "CONV_DROP", severity: "yellow", detail: `Queda 50%+ em leads: ${leadsPrev}→${leadsNow}` });
    }

    // 5. CRON HEALTH (jobs atrasados)
    const { data: cronHealth } = await supa.rpc("get_cron_health");
    const overdue = (cronHealth || []).filter((c: any) => c.is_overdue);
    checks.cron_overdue = overdue.length;
    if (overdue.length > 0) issues.push({ code: "CRON_OVERDUE", severity: "yellow", detail: `${overdue.length} cron jobs atrasados` });

    // Status geral
    const hasRed = issues.some((i) => i.severity === "red");
    const hasYellow = issues.some((i) => i.severity === "yellow");
    const overall: Severity = hasRed ? "red" : hasYellow ? "yellow" : "green";

    // WhatsApp APENAS se houver problemas ou correções aplicadas
    let waSent = false;
    if (overall !== "green") {
      const emoji = overall === "red" ? "🚨" : "⚠️";
      const lines = [
        `${emoji} *Sentinela 24x7 — Planta y Raiz*`,
        `Status: *${overall.toUpperCase()}*`,
        ``,
        `*Problemas (${issues.length}):*`,
        ...issues.map((i) => `• [${i.severity.toUpperCase()}] ${i.code}: ${i.detail}`),
      ];
      if (corrections.length > 0) {
        lines.push(``, `*Correções aplicadas (${corrections.length}):*`);
        corrections.forEach((c) => lines.push(`${c.ok ? "✅" : "❌"} ${c.action}`));
      }
      lines.push(``, `${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
      waSent = await sendWhatsApp(lines.join("\n"));
    }

    await supa.from("manus_sentinel_runs").insert({
      overall_status: overall,
      checks, issues, corrections,
      whatsapp_sent: waSent,
      duration_ms: Date.now() - t0,
    });

    return new Response(
      JSON.stringify({ ok: true, overall, issues: issues.length, corrections: corrections.length, whatsapp_sent: waSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("[Sentinel] FATAL", e);
    await supa.from("manus_sentinel_runs").insert({
      overall_status: "red",
      checks, issues: [{ code: "SENTINEL_FATAL", severity: "red", detail: e?.message || String(e) }],
      corrections, whatsapp_sent: false, duration_ms: Date.now() - t0,
    });
    await sendWhatsApp(`🚨 Sentinela FALHOU: ${e?.message || e}`);
    return new Response(JSON.stringify({ ok: false, error: e?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
