import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side canonical pricing for Orientação Técnica do Dr. Edilson.
// Client-supplied amounts are NEVER trusted — preço sempre derivado do país.
const OT_BR_BRL = 30;
const OT_INTERNATIONAL_USD = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      appointmentId,
      doctorName = "Dr. Edilson Bezerra (CRM-CE 10963)",
      description,
      environment,
      countryCode,
    } = body || {};

    // Server-controlled amount + currency. Brasil = BRL 30, demais países = USD 10.
    const isBrazil = (countryCode || "").toUpperCase() === "BR";
    const amount = isBrazil ? OT_BR_BRL : OT_INTERNATIONAL_USD;
    const currency = isBrazil ? "BRL" : "USD";
    const finalDescription =
      description ||
      (isBrazil
        ? "Orientação Técnica - Planta y Raiz"
        : "Orientação Técnica Internacional - Planta y Raiz");

    const env: StripeEnv = (environment === "live" ? "live" : "sandbox");
    const stripe = createStripeClient(env);

    const origin = req.headers.get("origin") || "https://www.plantayraiz.com.br";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: user.email ?? undefined,
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: `Orientação Técnica - ${doctorName}`, description: finalDescription },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      metadata: {
        appointmentId: appointmentId ?? "",
        doctorName,
        userId: user.id,
        countryCode: countryCode ?? "",
        type: isBrazil ? "orientacao_tecnica_br" : "orientacao_tecnica_internacional",
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
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
