// Manus CEO — Auditor Noturno Autônomo
// Roda diariamente às 03:00 BRT, varre as últimas 24h, gera relatório
// e envia via WhatsApp para o admin (Dr. Edilson).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";

function fmtBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
}

async function sendWhatsApp(message: string) {
  const { shouldSilenceAdminAlert } = await import("../_shared/admin-alert-guard.ts");
  if (shouldSilenceAdminAlert("manus-ceo-cron")) return true;
  try {

    const r = await fetch(`${SUPABASE_URL}/functions/v1/evolution-api-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({ phone: ADMIN_WHATSAPP, message, type: "text" }),
    });
    return r.ok;
  } catch (e) {
    console.error("[manus-ceo] sendWhatsApp error", e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  try {
    // 1) Audit log volume
    const { data: auditRows } = await supabase
      .from("audit_log")
      .select("action")
      .gte("created_at", since);
    const auditCount = auditRows?.length ?? 0;
    const topActions: Record<string, number> = {};
    (auditRows ?? []).forEach((r: any) => {
      topActions[r.action] = (topActions[r.action] || 0) + 1;
    });
    const topActionsList = Object.entries(topActions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 2) Orientação Técnica funnel
    const { data: orders } = await supabase
      .from("orientacao_tecnica_orders")
      .select("status, amount, created_at")
      .gte("created_at", since);
    const total = orders?.length ?? 0;
    const paid = (orders ?? []).filter((o: any) => o.status === "paid" || o.status === "approved").length;
    const revenue = (orders ?? [])
      .filter((o: any) => o.status === "paid" || o.status === "approved")
      .reduce((s: number, o: any) => s + Number(o.amount || 0), 0);
    const conversion = total > 0 ? (paid / total) * 100 : 0;

    // 3) Brisa volume
    const { count: brisaCount } = await supabase
      .from("whatsapp_brisa_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);

    // 4) Consultas em revisão
    const { count: underReview } = await supabase
      .from("consultation_credit_audit")
      .select("*", { count: "exact", head: true })
      .eq("status", "under_review")
      .gte("created_at", since);

    const metrics = {
      window: "24h",
      audit_log_events: auditCount,
      top_actions: topActionsList,
      ot_orders_total: total,
      ot_orders_paid: paid,
      ot_revenue_brl: revenue,
      ot_conversion_pct: Number(conversion.toFixed(2)),
      brisa_messages: brisaCount ?? 0,
      consultations_under_review: underReview ?? 0,
      generated_at: new Date().toISOString(),
    };

    const md = [
      `🤖 *Manus CEO — Relatório ${today}*`,
      `_Janela: últimas 24h_`,
      ``,
      `💰 *Orientação Técnica*`,
      `• Pedidos: ${total}  |  Pagos: ${paid}`,
      `• Conversão: ${conversion.toFixed(1)}%`,
      `• Receita: ${fmtBRL(revenue)}`,
      ``,
      `🌿 *Brisa WhatsApp*`,
      `• Mensagens: ${brisaCount ?? 0}`,
      ``,
      `🩺 *Consultas em revisão*: ${underReview ?? 0}`,
      ``,
      `📋 *Audit log*: ${auditCount} eventos`,
      ...topActionsList.map(([a, c]) => `   • ${a}: ${c}`),
      ``,
      `_Gerado automaticamente pelo Manus CEO Cron._`,
    ].join("\n");

    // Persist
    const { data: saved } = await supabase
      .from("manus_ceo_reports")
      .insert({
        report_date: today,
        report_type: "nightly",
        metrics,
        markdown: md,
        sent_to: ADMIN_WHATSAPP,
        delivery_status: "pending",
      })
      .select("id")
      .single();

    // Send
    const ok = await sendWhatsApp(md);

    if (saved?.id) {
      await supabase
        .from("manus_ceo_reports")
        .update({ delivery_status: ok ? "sent" : "failed" })
        .eq("id", saved.id);
    }

    return new Response(JSON.stringify({ success: true, metrics, sent: ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[manus-ceo-cron] error", e);
    await sendWhatsApp(`⚠️ Manus CEO Cron falhou: ${String((e as Error).message).slice(0, 200)}`);
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
