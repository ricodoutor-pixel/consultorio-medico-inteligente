import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { priceId, quantity, customerEmail, userId, returnUrl, environment, cartToken, dynamicAmount } = body;

    const env = (environment || 'sandbox') as StripeEnv;
    const stripe = createStripeClient(env);

    let lineItems: any[];
    let mode: string;

    if (dynamicAmount && typeof dynamicAmount === "number" && dynamicAmount >= 100) {
      // Dynamic pricing for prescription carts (amount in centavos)
      lineItems = [{
        price_data: {
          currency: "brl",
          product_data: { name: "Carrinho de Prescrição Médica" },
          unit_amount: dynamicAmount,
        },
        quantity: 1,
      }];
      mode = "payment";
    } else {
      // Standard: resolve human-readable price via lookup_keys
      if (!priceId || typeof priceId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
        return new Response(JSON.stringify({ error: "Invalid priceId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const prices = await stripe.prices.list({ lookup_keys: [priceId] });
      if (!prices.data.length) {
        return new Response(JSON.stringify({ error: "Price not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === "recurring";
      mode = isRecurring ? "subscription" : "payment";
      lineItems = [{ price: stripePrice.id, quantity: quantity || 1 }];
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode,
      ui_mode: "embedded",
      return_url: returnUrl || `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      ...(customerEmail && { customer_email: customerEmail }),
      ...(userId && {
        metadata: { userId, ...(cartToken && { cartToken }) },
        ...(mode === "subscription" && { subscription_data: { metadata: { userId } } }),
      }),
    });

    // Log to audit
    await supabase.from("audit_log").insert({
      user_id: userId || "anonymous",
      action: "checkout_session_created",
      table_name: "subscriptions",
      record_id: session.id,
      new_data: { priceId: priceId || "dynamic", environment: env, cartToken: cartToken || null, dynamicAmount },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-CHECKOUT]", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
