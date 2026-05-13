// 💰 Guardião Financeiro — Reconciliação automática Mercado Pago
// Cron: diário 02:00 UTC. Audita splits + detecta chargebacks.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")!;
const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");

const PLATFORM_FEE_RATE = 0.07; // 7% consultas/orientação
const DIVERGENCE_TOLERANCE = 0.01; // R$ 0,01
const CHARGEBACK_ALERT_THRESHOLD = 0.02; // 2% do faturamento

interface Divergence {
  order_id: string;
  mp_payment_id: string;
  expected_amount: number;
  actual_amount: number;
  expected_platform_fee: number;
  actual_platform_fee: number;
  expected_doctor_payout: number;
  actual_doctor_payout: number;
  status: string;
  diff: number;
}

async function discord(content: string, level: "info" | "warn" | "critical" = "info") {
  if (!DISCORD_WEBHOOK_URL) return;
  const emoji = level === "critical" ? "🔴" : level === "warn" ? "🟡" : "🟢";
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `${emoji} **[Guardião Financeiro]** ${content}` }),
    });
  } catch (e) {
    console.error("Discord webhook error", e);
  }
}

async function fetchMpPayment(paymentId: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });
  if (!res.ok) return null;
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;


  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const startedAt = new Date();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const divergences: Divergence[] = [];
  let chargebacks = 0;
  let totalRevenue = 0;
  let auditedCount = 0;

  // 1. Audita orientacao_tecnica_orders aprovadas nas últimas 24h
  const { data: orders, error } = await supabase
    .from("orientacao_tecnica_orders")
    .select("id, mp_payment_id, amount, platform_fee, doctor_payout, status, created_at")
    .in("status", ["approved", "paid"])
    .gte("created_at", since)
    .not("mp_payment_id", "is", null);

  if (error) {
    await discord(`Erro consultando orders: ${error.message}`, "critical");
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  for (const order of orders ?? []) {
    auditedCount++;
    const mp = await fetchMpPayment(order.mp_payment_id!);
    if (!mp) continue;

    const actualAmount = Number(mp.transaction_amount ?? 0);
    const mpStatus = mp.status as string;

    // Detecta chargebacks/refunds
    if (["refunded", "charged_back", "cancelled"].includes(mpStatus) && order.status === "approved") {
      chargebacks++;
      await supabase.from("audit_log").insert({
        action: "chargeback_detected",
        table_name: "orientacao_tecnica_orders",
        record_id: order.id,
        old_data: { order_status: order.status },
        new_data: { mp_status: mpStatus, mp_payment_id: order.mp_payment_id, amount: actualAmount },
      });
      continue;
    }

    if (mpStatus !== "approved") continue;

    totalRevenue += actualAmount;

    // Recalcula split esperado
    const expectedFee = Math.round(actualAmount * PLATFORM_FEE_RATE * 100) / 100;
    const expectedPayout = Math.round((actualAmount - expectedFee) * 100) / 100;
    const recordedAmount = Number(order.amount ?? 0);
    const recordedFee = Number(order.platform_fee ?? 0);
    const recordedPayout = Number(order.doctor_payout ?? 0);

    const diff =
      Math.abs(actualAmount - recordedAmount) +
      Math.abs(expectedFee - recordedFee) +
      Math.abs(expectedPayout - recordedPayout);

    if (diff > DIVERGENCE_TOLERANCE) {
      const div: Divergence = {
        order_id: order.id,
        mp_payment_id: order.mp_payment_id!,
        expected_amount: actualAmount,
        actual_amount: recordedAmount,
        expected_platform_fee: expectedFee,
        actual_platform_fee: recordedFee,
        expected_doctor_payout: expectedPayout,
        actual_doctor_payout: recordedPayout,
        status: mpStatus,
        diff: Math.round(diff * 100) / 100,
      };
      divergences.push(div);

      await supabase.from("audit_log").insert({
        action: "financial_divergence_detected",
        table_name: "orientacao_tecnica_orders",
        record_id: order.id,
        old_data: { recorded: { amount: recordedAmount, fee: recordedFee, payout: recordedPayout } },
        new_data: {
          mp: { amount: actualAmount, expected_fee: expectedFee, expected_payout: expectedPayout },
          diff: div.diff,
          mp_payment_id: order.mp_payment_id,
        },
      });
    }
  }

  // 2. Alertas Discord
  const chargebackRate = totalRevenue > 0 ? chargebacks / (orders?.length ?? 1) : 0;
  const summary =
    `Reconciliação concluída em ${((Date.now() - startedAt.getTime()) / 1000).toFixed(1)}s\n` +
    `• Pedidos auditados: **${auditedCount}**\n` +
    `• Faturamento confirmado: **R$ ${totalRevenue.toFixed(2)}**\n` +
    `• Divergências: **${divergences.length}**\n` +
    `• Chargebacks: **${chargebacks}** (${(chargebackRate * 100).toFixed(2)}%)`;

  if (divergences.length > 0) {
    await discord(`${summary}\n⚠️ Divergências em: ${divergences.map((d) => d.order_id).slice(0, 5).join(", ")}`, "critical");
  } else if (chargebackRate > CHARGEBACK_ALERT_THRESHOLD) {
    await discord(`${summary}\n⚠️ Taxa de chargeback acima de ${(CHARGEBACK_ALERT_THRESHOLD * 100).toFixed(0)}% — risco MP suspender conta!`, "critical");
  } else {
    await discord(summary, "info");
  }

  return new Response(
    JSON.stringify({
      ok: true,
      audited: auditedCount,
      revenue: totalRevenue,
      divergences: divergences.length,
      chargebacks,
      chargeback_rate: chargebackRate,
      details: divergences,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
