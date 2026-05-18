// Public endpoint — generates a Mercado Pago R$30 PIX/checkout link for
// "Orientação Técnica com Dr. Edilson Bezerra On" that Enf. Brisa shares via WhatsApp.
// No JWT required: leads come from WhatsApp without an active session.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://plantayraiz.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const MP = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP) {
      return new Response(JSON.stringify({ error: "MP token missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any = {};
    try { body = await req.json(); } catch { /* allow empty */ }
    const { phone = "", name = "", email = "" } = body || {};

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supaService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // SECURITY: IP rate limit to prevent MP API quota abuse
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

    const preference = {
      items: [{
        title: "Orientação Técnica — Dr. Edilson Bezerra On",
        description: "Avaliação técnica em Cannabis Medicinal com acompanhamento da Enf. Brisa, relatório PDF e encaminhamento clínico.",
        quantity: 1,
        unit_price: 30.0,
        currency_id: "BRL",
        category_id: "services",
      }],
      payer: { name: name || undefined, email: email || undefined },
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }], // sem boleto, foco em PIX/cartão
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
      metadata: { source: "brisa_whatsapp", product: "orientacao_tecnica", phone, name },
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${MP}`, "Content-Type": "application/json" },
      body: JSON.stringify(preference),
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error("[brisa-payment-link] MP error:", mpData);
      return new Response(JSON.stringify({ error: "MP failed", details: mpData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort log
    try {
      const supa = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supa.from("ai_events").insert({
        ai_name: "brisa_coo",
        event_type: "payment_link_generated",
        status: "completed",
        input_data: { phone, name, email },
        output_data: { preference_id: mpData.id, init_point: mpData.init_point, external_reference: externalRef },
      });
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({
      ok: true,
      payment_url: mpData.init_point,
      preference_id: mpData.id,
      external_reference: externalRef,
      amount: 30.0,
      currency: "BRL",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    console.error("[brisa-payment-link] error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
