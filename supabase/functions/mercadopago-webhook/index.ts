import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const { type, data } = body;

    // Mercado Pago sends notifications with action/type
    const action = body.action || type;
    const paymentId = data?.id || body.data?.id;

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "No payment ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify MercadoPago webhook signature (mandatory)
    const mpWebhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (!mpWebhookSecret || !xSignature) {
      console.error("Missing webhook secret or x-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    {
      const parts = xSignature.split(",");
      const tsPart = parts.find((p: string) => p.trim().startsWith("ts="));
      const v1Part = parts.find((p: string) => p.trim().startsWith("v1="));
      const ts = tsPart?.split("=")?.[1];
      const v1 = v1Part?.split("=")?.[1];

      if (ts && v1) {
        const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(mpWebhookSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sigBuf = await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode(manifest)
        );
        const expected = Array.from(new Uint8Array(sigBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        if (expected !== v1) {
          console.error("Invalid webhook signature");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log("Webhook signature verified successfully");
      }
    }

    // Fetch payment details from Mercado Pago API
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      // Still acknowledge the webhook to prevent retries
      return new Response(JSON.stringify({ status: "received", warning: "MP token not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });

    if (!mpResponse.ok) {
      console.error("MP API error:", mpResponse.status);
      return new Response(JSON.stringify({ status: "received", error: "MP API error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = await mpResponse.json();
    console.log("Payment details:", JSON.stringify({
      id: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      payer_email: payment.payer?.email,
    }));

    // Calculate split
    const totalAmount = payment.transaction_amount || 0;
    const metadata = payment.metadata || {};
    const feeRate = metadata.type === "marketplace" ? 0.05 : 0.07;
    const platformFee = Math.round(totalAmount * feeRate * 100) / 100;
    const doctorPayout = Math.round((totalAmount - platformFee) * 100) / 100;

    // Store webhook event with split info
    const { error: insertError } = await supabase.from("payment_webhooks").insert({
      payment_id: String(payment.id),
      status: payment.status,
      amount: totalAmount,
      payer_email: payment.payer?.email || "unknown",
      raw_data: payment,
      action: action,
      platform_fee: platformFee,
      doctor_payout: doctorPayout,
      split_processed: payment.status === "approved",
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
    }

    // Handle payment status
    const appointmentId = payment.external_reference || metadata.appointment_id;

    if (payment.status === "approved" && appointmentId) {
      console.log(`Payment ${paymentId} approved — R$ ${totalAmount} | Platform: R$ ${platformFee} | Doctor: R$ ${doctorPayout}`);

      // Update appointment status
      await supabase
        .from("appointments")
        .update({ payment_status: "paid", status: "confirmed" })
        .eq("id", appointmentId);

      // Fetch appointment to get patient_id for notification
      const { data: appt } = await supabase
        .from("appointments")
        .select("patient_id, doctor_id")
        .eq("id", appointmentId)
        .single();

      if (appt) {
        // Notify patient that payment was confirmed
        await supabase.from("notifications").insert({
          user_id: appt.patient_id,
          title: "Pagamento Confirmado ✅",
          message: `Seu pagamento de R$ ${totalAmount.toFixed(2)} foi confirmado. Sua consulta está agendada!`,
          type: "payment_confirmed",
          action_url: "/dashboard",
        });
      }
    } else if (payment.status === "rejected") {
      console.log(`Payment ${paymentId} rejected`);
      if (appointmentId) {
        await supabase
          .from("appointments")
          .update({ payment_status: "rejected" })
          .eq("id", appointmentId);
      }
    } else if (payment.status === "pending") {
      console.log(`Payment ${paymentId} pending`);
    }

    return new Response(JSON.stringify({ status: "processed", payment_status: payment.status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
