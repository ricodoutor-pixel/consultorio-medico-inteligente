// ============================================================================
// ALERT MONITOR — Watchdog Edge Functions + Prescription Dispatch Latency
// Dispara alerta no Discord SRE quando:
//  - Erros 401/403/404/409 ultrapassam thresholds em janela de 5min
//  - Envio de prescrição (brisa-prescription-dispatch) excede latência ou falha
// Executado via pg_cron a cada 5 minutos com service_role.
// ============================================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Public read-only watchdog. Lê error_logs/ai_events e dispara sre-alert
// (que tem rate-limit próprio de 30/min/IP). Sem mutação de estado.

// Thresholds (janela de 5min)
const HTTP_WARN = 10;     // ≥10 erros do MESMO status = WARNING
const HTTP_CRIT = 30;     // ≥30 = CRITICAL
const RX_LAT_WARN_MS = 8000;   // p95 acima disto = WARNING
const RX_LAT_CRIT_MS = 15000;  // p95 acima disto = CRITICAL
const RX_FAIL_RATE_CRIT = 0.20; // >20% falhas = CRITICAL
const WATCHED_STATUSES = [401, 403, 404, 409];

async function sendWhatsAppAdmin(title: string, description: string, level: "WARNING" | "CRITICAL" = "CRITICAL") {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const inst = Deno.env.get("EVOLUTION_INSTANCE");
  const to = Deno.env.get("ADMIN_WHATSAPP");
  if (!url || !key || !inst || !to) return;
  const number = to.replace(/\D/g, "");
  const emoji = level === "CRITICAL" ? "🔴 CRÍTICO" : "🟡 ATENÇÃO";
  const ts = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  try {
    await fetch(`${url}/message/sendText/${inst}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({
        number,
        text: `${emoji} *Planta y Raiz — SRE*\n🕐 ${ts} BRT\n\n*${title}*\n\n${description}\n\n📊 Painel: ${Deno.env.get("SITE_URL") || "https://plantayraiz.com.br"}/admin/cron-health\n🩺 SEO: /admin/conversoes-uptime`,
      }),
    });
  } catch (e) {
    console.error("[alert-monitor] whatsapp admin failed", e);
  }
}

// Dedupe: garante 1 alerta por alert_key/dia. Retorna true se foi inserido (novo),
// false se já existia (apenas incrementa contador). Usa data BRT.
async function shouldSendAlert(
  supabase: ReturnType<typeof createClient>,
  alertKey: string,
  level: "WARNING" | "CRITICAL",
  title: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("sre_alert_dedup").insert({
      alert_key: alertKey,
      level,
      title,
    });
    if (!error) return true;
    // Já existe hoje (unique violation) — incrementa contador silenciosamente
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    try {
      await supabase
        .from("sre_alert_dedup")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("alert_key", alertKey)
        .eq("alert_date", today);
    } catch (_) { /* noop */ }
    return false;
  } catch (e) {
    console.error("[alert-monitor] dedup failed — SUPPRESSING to avoid WhatsApp spam", e);
    return false;
  }
}

async function sendDiscord(
  supabase: ReturnType<typeof createClient>,
  level: "WARNING" | "CRITICAL",
  title: string,
  description: string,
  fields: { name: string; value: string; inline?: boolean }[],
  alertKey?: string,
) {
  // Se uma chave foi fornecida e já foi enviado hoje, suprime.
  if (alertKey) {
    const ok = await shouldSendAlert(supabase, alertKey, level, title);
    if (!ok) {
      console.log(`[alert-monitor] suprimido (já enviado hoje): ${alertKey}`);
      return;
    }
  }
  try {
    await supabase.functions.invoke("sre-alert", {
      body: { level, title, description, fields },
    });
  } catch (e) {
    console.error("[alert-monitor] sre-alert failed", e);
  }
  // CRITICAL notifica Dr. Edilson no WhatsApp (formato crítico); WARNING também
  // dispara um aviso amarelo (útil durante a indexação SEO ativa).
  if (level === "CRITICAL") {
    await sendWhatsAppAdmin(title, description, "CRITICAL");
  } else if (level === "WARNING" && alertKey?.startsWith("seo_")) {
    await sendWhatsAppAdmin(title, description, "WARNING");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __unauth = requireServiceAuth(req, corsHeaders);
  if (__unauth) return __unauth;

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
      `http_${sc}_${level}`,
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
        `rx_dispatch_degraded_${level}`,
      );
      alerts.push(`rx_${level.toLowerCase()}`);
    }
  }

  // ---------- 3) Social Auto-Post Cron Health (IG + FB) ----------
  // Se a JWT do cron foi revogada, a função NUNCA executa e nada chega em ai_events.
  // Detectamos a AUSÊNCIA de eventos (70min cobre 2 ciclos de 30min).
  const sinceCron = new Date(Date.now() - 70 * 60_000).toISOString();
  const socialChecks = [
    { ai: "brisa_ig_auto", label: "Instagram auto-post", cron: "brisa-ig-auto-post-30min" },
    { ai: "brisa_fb_auto", label: "Facebook auto-post", cron: "brisa-fb-auto-post-30min" },
  ];
  for (const c of socialChecks) {
    const { data: evs } = await supabase
      .from("ai_events")
      .select("event_type, status, created_at")
      .eq("ai_name", c.ai)
      .gte("created_at", sinceCron)
      .limit(50);
    const total = evs?.length ?? 0;
    const failed = (evs ?? []).filter(
      (e) => String(e.event_type).endsWith("_failed") || e.status === "error",
    ).length;
    if (total === 0) {
      await sendDiscord(
        supabase,
        "CRITICAL",
        `🚨 ${c.label} SEM EXECUÇÃO`,
        `Nenhum evento de \`${c.ai}\` nos últimos 70min. Provável cron quebrado (JWT revogada após rotação) ou função fora do ar.`,
        [
          { name: "Cron", value: c.cron, inline: true },
          { name: "Janela", value: "70min", inline: true },
          { name: "Ação", value: "Rotacionar BRISA_CEO_SECRET_KEY e recriar cron com service_role atual" },
        ],
        `${c.ai}_no_runs`,
      );
      alerts.push(`${c.ai}_no_runs`);
    } else if (failed > 0 && failed === total) {
      await sendDiscord(
        supabase,
        "CRITICAL",
        `🔴 ${c.label} 100% falhando`,
        `Todos os ${total} eventos em 70min falharam.`,
        [{ name: "Cron", value: c.cron, inline: true }, { name: "Falhas", value: String(failed), inline: true }],
        `${c.ai}_all_failed`,
      );
      alerts.push(`${c.ai}_all_failed`);
    }
  }

  // ---------- 4) Comunicação com usuários (WhatsApp/Messenger/IG DM) ----------
  const COMM_FUNCS = [
    "whatsapp-brisa-bot", "brisa-whatsapp", "meta-messenger-bot",
    "twilio-whatsapp", "evolution-api-proxy", "brisa-prescription-dispatch",
  ];
  const commErrs = (httpErrs ?? []).filter((r) =>
    COMM_FUNCS.includes(String((r.metadata as any)?.fn ?? "")),
  );
  if (commErrs.length >= 3) {
    const byFn: Record<string, number> = {};
    for (const r of commErrs) {
      const fn = String((r.metadata as any)?.fn ?? "unknown");
      byFn[fn] = (byFn[fn] ?? 0) + 1;
    }
    const level = commErrs.length >= 10 ? "CRITICAL" : "WARNING";
    await sendDiscord(
      supabase,
      level,
      "📵 Falhas de comunicação com usuários",
      `${commErrs.length} erros em funções de WhatsApp/Messenger nos últimos 5min. Mensagens podem não estar sendo entregues.`,
      [
        { name: "Total", value: String(commErrs.length), inline: true },
        { name: "Por função", value: Object.entries(byFn).map(([k, v]) => `${k}: ${v}`).join("\n") || "n/d" },
      ],
      `comm_failures_${level}`,
    );
    alerts.push(`comm_errs=${commErrs.length}`);
  }

  // ---------- 5) HTTP 401 imediato (signature/auth) — threshold = 1 ----------
  const auth401 = (httpErrs ?? []).filter((r) => Number((r.metadata as any)?.status_code) === 401);
  if (auth401.length >= 1 && !alerts.some((a) => a.startsWith("http_401"))) {
    const fns = [...new Set(auth401.map((r) => String((r.metadata as any)?.fn ?? "unknown")))];
    await sendDiscord(
      supabase,
      "WARNING",
      "🔐 HTTP 401 detectado (signature/auth)",
      `${auth401.length} erro(s) 401 em 5min. JWT/HMAC/Access Token pode ter sido revogado ou rotacionado.`,
      [
        { name: "Funções", value: fns.join(", ").slice(0, 500) || "n/d" },
        { name: "Causas comuns", value: "• service_role rotacionada\n• BRISA_CEO_SECRET_KEY trocada\n• FACEBOOK_PAGE_ACCESS_TOKEN expirou" },
      ],
      "http_401_early",
    );
    alerts.push(`http_401_early=${auth401.length}`);
  }

  // ---------- 6) Páginas SEO-críticas com 404/410 (durante indexação) ----------
  // Se o Googlebot ou usuário bater 404 em uma das 12 rotas priority=1.0 do
  // sitemap-final.xml, o alerta vai DIRETO para o WhatsApp do Dr. Edilson —
  // 1 ocorrência já dispara WARNING (durante indexação ativa cada hit conta).
  const SEO_CRITICAL_PATHS = [
    "/", "/nossa-historia", "/profissionais", "/telemedicina", "/shopping",
    "/saude-verde", "/biblioteca", "/comunidade", "/dashboard", "/afiliados",
    "/planos", "/tratamentos", "/tratamento-dor-cronica",
    "/tratamento-ansiedade-saude-mental", "/como-funciona", "/oferta-especial",
    "/quiz-triagem", "/blog", "/ebook", "/club", "/sitemap-final.xml",
    "/sitemap.xml", "/robots.txt",
  ];
  const { data: seoErrs } = await supabase
    .from("error_logs")
    .select("metadata, created_at")
    .eq("source", "frontend_404")
    .gte("created_at", since)
    .limit(500);

  const byPath: Record<string, number> = {};
  for (const r of seoErrs ?? []) {
    const path = String((r.metadata as any)?.path ?? "");
    if (!SEO_CRITICAL_PATHS.includes(path)) continue;
    byPath[path] = (byPath[path] ?? 0) + 1;
  }
  const seoBreaks = Object.entries(byPath);
  if (seoBreaks.length > 0) {
    const total = seoBreaks.reduce((s, [, n]) => s + n, 0);
    const level = total >= 5 ? "CRITICAL" : "WARNING";
    await sendDiscord(
      supabase,
      level,
      `🌐 404 em página SEO-crítica (indexação em risco)`,
      `${total} hit(s) 404 em rotas priority=1.0 nos últimos 5min. Google pode desindexar.`,
      [
        { name: "Rotas afetadas", value: seoBreaks.map(([p, n]) => `${p}: ${n}`).join("\n") },
        { name: "Ação", value: "Verificar deploy + sitemap-final.xml + roteador React" },
      ],
      `seo_404_${level}`,
    );
    alerts.push(`seo_404=${total}`);
  }

  return new Response(
    JSON.stringify({ ok: true, alerts, window_min: 5 }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
