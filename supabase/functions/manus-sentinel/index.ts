// 🛡️ Manus Sentinel — Watchdog 24x7 com auto-correção, simulação e escalonamento
// Modo padrão (cron): verifica, aplica correções e envia WhatsApp (com escalonamento de 2 níveis).
// Modo simulação (dry_run=true): NÃO aplica correções nem envia mensagens reais — apenas registra resultado.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

type Severity = "green" | "yellow" | "red";
interface Issue { code: string; severity: Severity; detail: string; }
interface Correction { code: string; action: string; ok: boolean; detail?: string; }
interface Escalation {
  issue_code: string;
  level: 1 | 2;
  channel: string;
  target: string;
  ok: boolean;
  reason: string;
}

interface Profile {
  err_critical_max: number;
  err_total_max: number;
  queue_stuck_minutes: number;
  queue_stuck_max: number;
  conv_drop_ratio: number;
  conv_min_baseline: number;
  cron_overdue_max: number;
  mp_error_rate_max: number;
}
const DEFAULTS: Profile = {
  err_critical_max: 0, err_total_max: 20, queue_stuck_minutes: 30, queue_stuck_max: 0,
  conv_drop_ratio: 0.5, conv_min_baseline: 5, cron_overdue_max: 0, mp_error_rate_max: 0.1,
};

async function sendWhatsApp(phone: string, message: string, dryRun: boolean) {
  if (dryRun) return true;
  const { shouldSilenceAdminAlert } = await import("../_shared/admin-alert-guard.ts");
  if (shouldSilenceAdminAlert("manus-sentinel")) return true;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/evolution-api-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
      body: JSON.stringify({ phone, message }),
    });
    return res.ok;
  } catch { return false; }
}

async function sendEmail(to: string, subject: string, html: string, dryRun: boolean) {
  if (dryRun || !RESEND_API_KEY) return !!dryRun;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "Sentinela <alerts@plantayraiz.com.br>", to, subject, html }),
    });
    return res.ok;
  } catch { return false; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  let dryRun = false;
  let triggeredBy = "cron";
  if (req.method === "POST") {
    try {
      const body = await req.json();
      dryRun = !!body?.dry_run;
      triggeredBy = body?.triggered_by || (dryRun ? "simulation" : "manual");
    } catch { /* ignore */ }
  }

  const t0 = Date.now();
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const issues: Issue[] = [];
  const corrections: Correction[] = [];
  const escalations: Escalation[] = [];
  const checks: Record<string, unknown> = { dry_run: dryRun };

  try {
    // Carrega perfil ativo de monitoramento
    const { data: profileRow } = await supa
      .from("monitoring_profiles")
      .select("*").eq("is_active", true).maybeSingle();
    const profile: Profile = { ...DEFAULTS, ...(profileRow || {}) };
    checks.profile = profileRow?.name || "defaults";

    // 1. Erros
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: errs } = await supa.from("error_logs")
      .select("severity, message, created_at").gte("created_at", since).limit(200);
    const critical = (errs || []).filter((e: any) => e.severity === "critical").length;
    const errorCount = errs?.length ?? 0;
    checks.errors_15min = { total: errorCount, critical };
    if (critical > profile.err_critical_max)
      issues.push({ code: "ERR_CRITICAL", severity: "red", detail: `${critical} erros críticos (limite ${profile.err_critical_max})` });
    else if (errorCount > profile.err_total_max)
      issues.push({ code: "ERR_HIGH", severity: "yellow", detail: `${errorCount} erros (limite ${profile.err_total_max})` });

    // 2. Mercado Pago
    const { data: mp } = await supa.from("payment_provider_health")
      .select("status, latency_ms, error_rate, checked_at")
      .eq("provider", "mercado_pago").order("checked_at", { ascending: false }).limit(1);
    const mpHealth = mp?.[0];
    checks.mercado_pago = mpHealth || null;
    if (mpHealth?.status === "down") {
      issues.push({ code: "MP_DOWN", severity: "red", detail: "Mercado Pago OFFLINE" });
      if (!dryRun) {
        const { error: cErr } = await supa.from("payment_contingency_config")
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq("is_active", false);
        corrections.push({ code: "MP_DOWN", action: "Ativado PIX direto (contingência)", ok: !cErr, detail: cErr?.message });
      } else {
        corrections.push({ code: "MP_DOWN", action: "[SIMULAÇÃO] Ativaria PIX direto", ok: true });
      }
    } else if (mpHealth?.error_rate && Number(mpHealth.error_rate) > profile.mp_error_rate_max) {
      issues.push({ code: "MP_DEGRADED", severity: "yellow", detail: `MP error_rate ${(Number(mpHealth.error_rate) * 100).toFixed(1)}%` });
    }

    // 3. Fila
    const queueCutoff = new Date(Date.now() - profile.queue_stuck_minutes * 60 * 1000).toISOString();
    const { count: queueStuck } = await supa.from("consultation_queue")
      .select("id", { count: "exact", head: true }).eq("status", "waiting").lt("updated_at", queueCutoff);
    checks.queue_stuck = queueStuck ?? 0;
    if ((queueStuck ?? 0) > profile.queue_stuck_max)
      issues.push({ code: "QUEUE_STUCK", severity: "red", detail: `${queueStuck} pacientes >${profile.queue_stuck_minutes}min na fila` });

    // 4. Conversão
    const h1 = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const h2 = new Date(Date.now() - 120 * 60 * 1000).toISOString();
    const { count: leadsNow } = await supa.from("leads").select("id", { count: "exact", head: true }).gte("created_at", h1);
    const { count: leadsPrev } = await supa.from("leads").select("id", { count: "exact", head: true }).gte("created_at", h2).lt("created_at", h1);
    checks.leads = { last_hour: leadsNow, prev_hour: leadsPrev };
    if ((leadsPrev ?? 0) >= profile.conv_min_baseline && (leadsNow ?? 0) < (leadsPrev ?? 0) * profile.conv_drop_ratio) {
      issues.push({ code: "CONV_DROP", severity: "yellow", detail: `Queda em leads: ${leadsPrev}→${leadsNow}` });
    }

    // 5. Cron
    const { data: cronHealth } = await supa.rpc("get_cron_health");
    const overdue = (cronHealth || []).filter((c: any) => c.is_overdue);
    checks.cron_overdue = overdue.length;
    if (overdue.length > profile.cron_overdue_max)
      issues.push({ code: "CRON_OVERDUE", severity: "yellow", detail: `${overdue.length} cron jobs atrasados` });

    const hasRed = issues.some((i) => i.severity === "red");
    const hasYellow = issues.some((i) => i.severity === "yellow");
    const overall: Severity = hasRed ? "red" : hasYellow ? "yellow" : "green";

    // ESCALONAMENTO
    let waSent = false;
    if (overall !== "green") {
      const { data: rules } = await supa.from("sentinel_escalation_rules")
        .select("*").eq("is_active", true);
      const rulesByCode = new Map<string, any>();
      for (const r of rules || []) rulesByCode.set(r.issue_code, r);

      // Contagem de runs consecutivos com o mesmo issue (últimas N execuções não-simuladas)
      const { data: recentRuns } = await supa.from("manus_sentinel_runs")
        .select("issues, ran_at").eq("is_simulation", false)
        .order("ran_at", { ascending: false }).limit(10);

      const codesByConsecutive = new Map<string, number>();
      for (const i of issues) {
        let streak = 1;
        for (const r of recentRuns || []) {
          const arr = (r.issues as any[]) || [];
          if (arr.some((x: any) => x.code === i.code)) streak++;
          else break;
        }
        codesByConsecutive.set(i.code, streak);
      }

      const emoji = overall === "red" ? "🚨" : "⚠️";
      const simTag = dryRun ? "[SIMULAÇÃO] " : "";
      const baseLines = [
        `${emoji} *${simTag}Sentinela 24x7 — Planta y Raiz*`,
        `Status: *${overall.toUpperCase()}*`,
        `Perfil: ${checks.profile}`,
        ``,
        `*Problemas (${issues.length}):*`,
        ...issues.map((i) => `• [${i.severity.toUpperCase()}] ${i.code}: ${i.detail}`),
      ];
      if (corrections.length > 0) {
        baseLines.push(``, `*Correções (${corrections.length}):*`);
        corrections.forEach((c) => baseLines.push(`${c.ok ? "✅" : "❌"} ${c.action}`));
      }
      baseLines.push(``, new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }));
      const msg = baseLines.join("\n");

      // Nível 1: Dr. Edilson (sempre via regra primária da primeira issue OU ADMIN_WHATSAPP padrão)
      const firstIssue = issues[0];
      const primaryRule = rulesByCode.get(firstIssue.code);
      const primaryTarget = primaryRule?.primary_target || ADMIN_WHATSAPP;
      const primaryChannel = primaryRule?.primary_channel || "whatsapp";
      const okPrimary = primaryChannel === "email"
        ? await sendEmail(primaryTarget, `${simTag}Sentinela ${overall.toUpperCase()}`, `<pre>${msg}</pre>`, dryRun)
        : await sendWhatsApp(primaryTarget, msg, dryRun);
      waSent = okPrimary;
      escalations.push({
        issue_code: firstIssue.code, level: 1, channel: primaryChannel, target: primaryTarget,
        ok: okPrimary, reason: dryRun ? "simulation" : "primary notification",
      });

      // Nível 2: escalonamento se persistente e cooldown passou
      for (const i of issues) {
        const rule = rulesByCode.get(i.code);
        if (!rule?.secondary_target) continue;
        const consecutive = codesByConsecutive.get(i.code) || 1;
        if (consecutive < rule.consecutive_threshold) continue;
        if (rule.last_escalated_at && !dryRun) {
          const last = new Date(rule.last_escalated_at).getTime();
          if (Date.now() - last < (rule.cooldown_minutes || 30) * 60 * 1000) continue;
        }
        const okSec = rule.secondary_channel === "email"
          ? await sendEmail(rule.secondary_target, `[ESCALONAMENTO] ${simTag}${i.code}`, `<pre>${msg}</pre>`, dryRun)
          : await sendWhatsApp(rule.secondary_target, `⚠️ ESCALONAMENTO N2 (${consecutive} runs)\n\n${msg}`, dryRun);
        escalations.push({
          issue_code: i.code, level: 2, channel: rule.secondary_channel || "whatsapp",
          target: rule.secondary_target, ok: okSec,
          reason: `consecutive=${consecutive} >= threshold=${rule.consecutive_threshold}`,
        });
        if (!dryRun && okSec) {
          await supa.from("sentinel_escalation_rules")
            .update({ last_escalated_at: new Date().toISOString() }).eq("id", rule.id);
        }
      }
    }

    await supa.from("manus_sentinel_runs").insert({
      overall_status: overall, checks, issues, corrections,
      whatsapp_sent: waSent, duration_ms: Date.now() - t0,
      is_simulation: dryRun, escalations, triggered_by: triggeredBy,
    });

    return new Response(JSON.stringify({
      ok: true, overall, dry_run: dryRun, issues, corrections, escalations,
      whatsapp_sent: waSent, duration_ms: Date.now() - t0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("[Sentinel] FATAL", e);
    await supa.from("manus_sentinel_runs").insert({
      overall_status: "red", checks,
      issues: [{ code: "SENTINEL_FATAL", severity: "red", detail: e?.message || String(e) }],
      corrections, whatsapp_sent: false, duration_ms: Date.now() - t0,
      is_simulation: dryRun, escalations, triggered_by: triggeredBy,
    });
    if (!dryRun) await sendWhatsApp(ADMIN_WHATSAPP, `🚨 Sentinela FALHOU: ${e?.message || e}`, false);
    return new Response(JSON.stringify({ ok: false, error: e?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
