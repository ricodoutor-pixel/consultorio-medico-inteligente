// Public endpoint — generates a Mercado Pago R$30 PIX/checkout link (BR) OR Stripe $10 USD link (International)
// for "Orientação Técnica com Dr. Edilson Bezerra (CRM-CE 10963)" that Enf. Brisa shares via WhatsApp.
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^14.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://plantayraiz.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body: any = {};
    try { body = await req.json(); } catch { /* allow empty */ }
    const { phone = "", name = "", email = "", isInternational = false } = body || {};

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supaService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // SECURITY: IP rate limit
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const { data: ipOk } = await supaService.rpc("check_edge_rate_limit", {
      p_bucket: "brisa_payment_ip", p_key: ip, p_max_hits: 5, p_window_seconds: 600,
    });
    if (ipOk === false) {
      return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const externalRef = `brisa-orientacao-${phone || "anon"}-${Date.now()}`;

    if (isInternational) {
      // STRIPE FLOW (USD)
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_LIVE_API_KEY");
      if (!stripeKey) {
        return new Response(JSON.stringify({ error: "Stripe key missing" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "Technical Guidance - Dr. Edilson Bezerra",
              description: "Technical assessment in Medical Cannabis with Nurse Brisa's follow-up, PDF report and clinical referral.",
            },
            unit_amount: 1000, // $10.00 USD
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${SITE}/payment-success?ref=${externalRef}`,
        cancel_url: `${SITE}/payment-failure?ref=${externalRef}`,
        client_reference_id: externalRef,
        metadata: { source: "brisa_whatsapp", product: "orientacao_tecnica", phone: String(phone), name: String(name) },
        customer_email: email || undefined,
      });

      return new Response(JSON.stringify({
        ok: true,
        payment_url: session.url,
        preference_id: session.id,
        external_reference: externalRef,
        amount: 10.0,
        currency: "USD",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

    } else {
      // MERCADO PAGO FLOW (BRL)
      const MP = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!MP) {
        return new Response(JSON.stringify({ error: "MP token missing" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const preference: any = {
        items: [{
          title: "Orientação Técnica — Dr. Edilson Bezerra (CRM-CE 10963)",
          description: "Avaliação técnica em Cannabis Medicinal com acompanhamento da Enf. Brisa, relatório PDF e encaminhamento clínico.",
          quantity: 1,
          unit_price: 30.0,
          currency_id: "BRL",
          category_id: "services",
        }],
        payment_methods: {
          excluded_payment_types: [{ id: "ticket" }],
          installments: 3,
        },
        back_urls: {
          success: `${SITE}/payment-success?ref=${externalRef}`,
          failure: `${SITE}/payment-failure?ref=${externalRef}`,
          pending: `${SITE}/payment-pending?ref=${externalRef}`,
        },
        auto_return: "approved",
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        external_reference: externalRef,
        statement_descriptor: "PLANTAYRAIZ",
        metadata: { source: "brisa_whatsapp", product: "orientacao_tecnica" },
      };

      if (email) {
        preference.payer = { email };
        if (name) preference.payer.name = name;
      }
      if (phone) preference.metadata.phone = String(phone).substring(0, 250);
      if (name) preference.metadata.name = String(name).substring(0, 250);

      const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: { Authorization: `Bearer ${MP}`, "Content-Type": "application/json" },
        body: JSON.stringify(preference),
      });

      const mpData = await mpRes.json();
      if (!mpRes.ok) {
        return new Response(JSON.stringify({ error: "MP failed", details: mpData }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        payment_url: mpData.init_point,
        preference_id: mpData.id,
        external_reference: externalRef,
        amount: 30.0,
        currency: "BRL",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

  } catch (e) {
    console.error("[brisa-payment-link] error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
