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

    // Store webhook event in database
    const { error: insertError } = await supabase.from("payment_webhooks").insert({
      payment_id: String(payment.id),
      status: payment.status,
      amount: payment.transaction_amount,
      payer_email: payment.payer?.email || "unknown",
      raw_data: payment,
      action: action,
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
    }

    // Handle payment status
    if (payment.status === "approved") {
      console.log(`Payment ${paymentId} approved — R$ ${payment.transaction_amount}`);
      // Here you would: activate subscription, confirm order, etc.
      // Based on external_reference or metadata from the payment
    } else if (payment.status === "rejected") {
      console.log(`Payment ${paymentId} rejected`);
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
