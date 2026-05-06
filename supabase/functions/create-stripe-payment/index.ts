import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      appointmentId,
      doctorName = "Dr. Edilson Bezerra",
      patientEmail,
      description = "Orientação Técnica Internacional - Planta y Raiz",
      amount = 10, // USD
      currency = "USD",
      environment,
    } = body || {};

    const env: StripeEnv = (environment === "live" ? "live" : "sandbox");
    const stripe = createStripeClient(env);

    const origin = req.headers.get("origin") || "https://www.plantayraiz.com.br";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      ...(patientEmail ? { customer_email: patientEmail } : {}),
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: `Orientação Técnica - ${doctorName}`, description },
          unit_amount: Math.round(Number(amount) * 100),
        },
        quantity: 1,
      }],
      metadata: {
        appointmentId: appointmentId ?? "",
        doctorName,
        type: "orientacao_tecnica_internacional",
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: session.client_secret,
        url: session.url,
        sessionId: session.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[create-stripe-payment]", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
