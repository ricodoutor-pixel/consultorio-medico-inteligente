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
    // Require auth
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    const callerId = claims?.claims?.sub as string | undefined;
    if (claimsErr || !callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { priceId, quantity, customerEmail, returnUrl, environment, cartToken } = body;
    const userId = callerId; // never trust client-provided userId

    const env = (environment || 'sandbox') as StripeEnv;
    const stripe = createStripeClient(env);

    let lineItems: any[];
    let mode: string;
    let resolvedAmount: number | null = null;

    if (cartToken && typeof cartToken === "string") {
      // Dynamic pricing — resolve from prescription_carts server-side
      const { data: cart, error: cartErr } = await supabase
        .from("prescription_carts")
        .select("id, patient_id, total_amount, status")
        .eq("cart_token", cartToken)
        .maybeSingle();
      if (cartErr || !cart) {
        return new Response(JSON.stringify({ error: "Cart not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (cart.patient_id !== userId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (cart.status !== "pending") {
        return new Response(JSON.stringify({ error: "Cart is not pending" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      resolvedAmount = Math.max(100, Math.round(Number(cart.total_amount || 0) * 100));
      lineItems = [{
        price_data: {
          currency: "brl",
          product_data: { name: "Carrinho de Prescrição Médica" },
          unit_amount: resolvedAmount,
        },
        quantity: 1,
      }];
      mode = "payment";
    } else {
      // Standard: resolve via Stripe lookup_keys
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
      metadata: { userId, ...(cartToken && { cartToken }) },
      ...(mode === "subscription" && { subscription_data: { metadata: { userId } } }),
    });

    await supabase.from("audit_log").insert({
      user_id: userId,
      action: "checkout_session_created",
      table_name: "subscriptions",
      record_id: session.id,
      new_data: { priceId: priceId || "dynamic", environment: env, cartToken: cartToken || null, amount: resolvedAmount },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CREATE-CHECKOUT]", error);
    return new Response(JSON.stringify({ error: "Checkout creation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
