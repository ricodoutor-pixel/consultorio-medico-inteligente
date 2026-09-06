// 🛡️ Guardião ANVISA Semanal — RDC 660/2022 SLA Watcher
// Cron: domingo 04:00 UTC. Detecta protocolos ANV- pendentes > 7 dias.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");

const SLA_DAYS = 7;
const CRITICAL_DAYS = 14;

async function discord(content: string, level: "info" | "warn" | "critical" = "info") {
  if (!DISCORD_WEBHOOK_URL) return;
  const emoji = level === "critical" ? "🔴" : level === "warn" ? "🟡" : "🟢";
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `${emoji} **[Guardião ANVISA]** ${content}` }),
    });
  } catch (e) {
    console.error("Discord webhook error", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;


  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const slaThreshold = new Date(Date.now() - SLA_DAYS * 86400000).toISOString();
  const criticalThreshold = new Date(Date.now() - CRITICAL_DAYS * 86400000).toISOString();

  // 1. Prescrições com código ANV- pendentes há > 7 dias
  const { data: pending, error } = await supabase
    .from("prescriptions")
    .select("id, patient_id, doctor_id, anvisa_code, status, created_at, signature_date")
    .like("anvisa_code", "ANV-%")
    .in("status", ["pending", "submitted", "processing", "awaiting_anvisa"])
    .lt("created_at", slaThreshold)
    .order("created_at", { ascending: true });

  if (error) {
    await discord(`Erro consultando prescriptions: ${error.message}`, "critical");
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const overdue = pending ?? [];
  const critical = overdue.filter((p) => p.created_at < criticalThreshold);

  // 2. DOU alerts não notificados (RDC nova, suspensão, etc)
  const { data: dou } = await supabase
    .from("anvisa_dou_alerts")
    .select("id, term, title, url, created_at")
    .eq("notified", false)
    .order("created_at", { ascending: false })
    .limit(20);

  const douAlerts = dou ?? [];

  // 3. Audit log entries
  for (const p of overdue) {
    await supabase.from("audit_log").insert({
      action: "anvisa_protocol_overdue",
      table_name: "prescriptions",
      record_id: p.id,
      old_data: { created_at: p.created_at, status: p.status },
      new_data: {
        anvisa_code: p.anvisa_code,
        days_pending: Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000),
        severity: p.created_at < criticalThreshold ? "critical" : "warning",
      },
    });
  }

  // 4. Marca DOU alerts como notificados
  if (douAlerts.length > 0) {
    await supabase.from("anvisa_dou_alerts").update({ notified: true }).in("id", douAlerts.map((d) => d.id));
  }

  // 5. Discord summary
  const summary =
    `Auditoria semanal RDC 660/2022 — concluída\n` +
    `• Protocolos ANV- pendentes >${SLA_DAYS}d: **${overdue.length}**\n` +
    `• 🔴 Críticos (>${CRITICAL_DAYS}d): **${critical.length}**\n` +
    `• 📰 Novas publicações DOU: **${douAlerts.length}**`;

  let level: "info" | "warn" | "critical" = "info";
  if (critical.length > 0) level = "critical";
  else if (overdue.length > 0 || douAlerts.length > 0) level = "warn";

  let extra = "";
  if (critical.length > 0) {
    extra +=
      `\n\n**🔴 Protocolos críticos (top 5):**\n` +
      critical
        .slice(0, 5)
        .map((p) => `• \`${p.anvisa_code}\` — ${Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000)}d (rx: ${p.id.slice(0, 8)})`)
        .join("\n");
  }
  if (douAlerts.length > 0) {
    extra +=
      `\n\n**📰 DOU recentes:**\n` +
      douAlerts.slice(0, 3).map((d) => `• [${d.term}] ${d.title?.slice(0, 80) ?? ""}`).join("\n");
  }

  await discord(summary + extra, level);

  return new Response(
    JSON.stringify({
      ok: true,
      overdue: overdue.length,
      critical: critical.length,
      dou_alerts: douAlerts.length,
      details: { overdue, critical, dou: douAlerts },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
