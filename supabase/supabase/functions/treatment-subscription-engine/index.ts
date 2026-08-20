// Treatment Subscription Engine — R$ 79/mês recurrent charge orchestrator
// Runs on cron: charges due subscriptions via Mercado Pago PIX, logs results.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")!;

interface ChargeResult {
  subscription_id: string;
  patient_id: string;
  status: "charged" | "failed" | "skipped";
  mp_payment_id?: string;
  error?: string;
}

async function createMpPixCharge(amount: number, externalRef: string, payerEmail: string) {
  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": externalRef,
    },
    body: JSON.stringify({
      transaction_amount: amount,
      description: "Planta y Raiz — Assinatura Tratamento Mensal",
      payment_method_id: "pix",
      payer: { email: payerEmail || "noreply@plantayraiz.com.br" },
      external_reference: externalRef,
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
  const results: ChargeResult[] = [];

  try {
    const { data: dueSubs, error } = await supabase
      .from("treatment_subscriptions")
      .select("id, patient_id, monthly_amount, next_charge_at, metadata")
      .eq("status", "active")
      .lte("next_charge_at", new Date().toISOString())
      .limit(100);

    if (error) throw error;

    for (const sub of dueSubs ?? []) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", sub.patient_id)
          .maybeSingle();

        const externalRef = `sub_${sub.id}_${Date.now()}`;
        const charge = await createMpPixCharge(
          Number(sub.monthly_amount ?? 79),
          externalRef,
          (profile as any)?.email ?? "noreply@plantayraiz.com.br",
        );

        const nextCharge = new Date();
        nextCharge.setMonth(nextCharge.getMonth() + 1);

        await supabase
          .from("treatment_subscriptions")
          .update({
            last_charge_at: new Date().toISOString(),
            next_charge_at: nextCharge.toISOString(),
            mp_subscription_id: String(charge.id),
            metadata: { ...(sub.metadata ?? {}), last_charge_status: charge.status },
          })
          .eq("id", sub.id);

        results.push({
          subscription_id: sub.id,
          patient_id: sub.patient_id,
          status: "charged",
          mp_payment_id: String(charge.id),
        });
      } catch (e: any) {
        results.push({
          subscription_id: sub.id,
          patient_id: sub.patient_id,
          status: "failed",
          error: e?.message ?? "unknown",
        });
      }
    }

    // Log run
    await supabase.from("ai_events").insert({
      event_type: "treatment_subscription_engine_run",
      payload: { processed: results.length, results },
    });

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[treatment-subscription-engine]", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
