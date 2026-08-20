// Plan Renewal Engine — cobrança recorrente automática dos 3 planos universais (R$ 99/mês).
// Roda em cron: gera PIX no Mercado Pago para assinaturas com next_billing_at vencido,
// notifica o assinante e registra o resultado. O webhook mercadopago-webhook confirma
// o pagamento e reativa/estende o período.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")!;

const PLAN_SKUS = ["plano_paciente", "plano_medico", "plano_lojista"];

async function createPixCharge(amount: number, externalRef: string, payerEmail: string, title: string) {
  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": externalRef,
    },
    body: JSON.stringify({
      transaction_amount: Number(amount.toFixed(2)),
      description: `Planta y Raiz — ${title} (renovação mensal)`,
      payment_method_id: "pix",
      payer: { email: payerEmail || "noreply@plantayraiz.com.br" },
      external_reference: externalRef,
      notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `MP error ${res.status}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const results: Array<Record<string, unknown>> = [];

  try {
    const { data: dueSubs, error } = await supabase
      .from("health_subscriptions")
      .select("id, user_id, plan_type, plan_name, amount, next_billing_at, status")
      .eq("status", "active")
      .in("plan_type", PLAN_SKUS)
      .lte("next_billing_at", new Date().toISOString())
      .limit(200);

    if (error) throw error;

    for (const sub of dueSubs ?? []) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", sub.user_id)
          .maybeSingle();

        // external_reference no formato esperado pelo webhook: `<sku>:<user_id>:<ts>`
        const externalRef = `${sub.plan_type}:${sub.user_id}:${Date.now()}`;
        const charge = await createPixCharge(
          Number(sub.amount ?? 99),
          externalRef,
          (profile as { email?: string } | null)?.email ?? "noreply@plantayraiz.com.br",
          sub.plan_name ?? "Plano Planta y Raiz",
        );

        const qrCode = charge?.point_of_interaction?.transaction_data?.qr_code ?? null;
        const ticketUrl = charge?.point_of_interaction?.transaction_data?.ticket_url ?? null;

        // Reagenda a próxima tentativa em 3 dias; o webhook estende +30 dias ao aprovar.
        const retryAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        await supabase
          .from("health_subscriptions")
          .update({
            external_subscription_id: String(charge.id),
            next_billing_at: retryAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);

        await supabase.from("notifications").insert({
          user_id: sub.user_id,
          title: `💳 Renovação do ${sub.plan_name ?? "seu plano"}`,
          message: `PIX de R$ ${Number(sub.amount ?? 99).toFixed(2)} gerado para a renovação mensal. Pague para manter seu acesso ativo.`,
          type: "subscription_renewal",
          action_url: ticketUrl ?? "/dashboard",
        });

        results.push({
          subscription_id: sub.id,
          user_id: sub.user_id,
          plan: sub.plan_type,
          status: "charged",
          mp_payment_id: String(charge.id),
          has_qr: Boolean(qrCode),
        });
      } catch (e) {
        results.push({
          subscription_id: sub.id,
          user_id: sub.user_id,
          plan: sub.plan_type,
          status: "failed",
          error: (e as Error)?.message ?? "unknown",
        });
      }
    }

    await supabase.from("ai_events").insert({
      event_type: "plan_renewal_engine_run",
      payload: { processed: results.length, results },
    });

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[plan-renewal-engine]", err);
    return new Response(JSON.stringify({ ok: false, error: (err as Error)?.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
