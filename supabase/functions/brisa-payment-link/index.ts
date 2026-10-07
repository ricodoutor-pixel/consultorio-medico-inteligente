// Authenticated endpoint for the official R$30 Mercado Pago Orientation flow.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE = "https://plantayraiz.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body: any = {};
    try { body = await req.json(); } catch { /* allow empty */ }
    const { phone = "", name = "", email = "", triageId = null, action = "create", external_reference = "" } = body || {};

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supaService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: authData } = token ? await supaService.auth.getUser(token) : { data: { user: null } };
    const user = authData.user;

    // Guest checkout (oferta-especial via WhatsApp): phone + name only, no triage required.
    if (!user) {
      if (!phone || !name) {
        return new Response(JSON.stringify({ error: "Nome e WhatsApp são obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const guestIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
      const { data: guestIpOk } = await supaService.rpc("check_edge_rate_limit", {
        p_bucket: "brisa_payment_guest_ip", p_key: guestIp, p_max_hits: 5, p_window_seconds: 600,
      });
      if (guestIpOk === false) {
        return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const MP_GUEST = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!MP_GUEST) {
        return new Response(JSON.stringify({ error: "MP token missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const guestRef = `brisa-orientacao-${String(phone).replace(/\D/g, "") || "anon"}-${Date.now()}`;
      const guestPref = {
        items: [{
          title: "Orientação Técnica — Dr. Edilson Bezerra ON",
          description: "Avaliação técnica em Cannabis Medicinal com acompanhamento da Enf. Brisa, relatório PDF e encaminhamento clínico.",
          quantity: 1,
          unit_price: 30.0,
          currency_id: "BRL",
          category_id: "services",
        }],
        payment_methods: { excluded_payment_types: [{ id: "ticket" }], installments: 3 },
        back_urls: {
          success: `${SITE}/payment-success?ref=${guestRef}`,
          failure: `${SITE}/payment-failure?ref=${guestRef}`,
          pending: `${SITE}/payment-pending?ref=${guestRef}`,
        },
        auto_return: "approved",
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        external_reference: guestRef,
        statement_descriptor: "PLANTAYRAIZ",
        metadata: { source: "oferta_especial", product: "orientacao_tecnica", phone: String(phone).substring(0, 250), name: String(name).substring(0, 250) },
      };
      const guestRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: { Authorization: `Bearer ${MP_GUEST}`, "Content-Type": "application/json" },
        body: JSON.stringify(guestPref),
      });
      const guestData = await guestRes.json();
      if (!guestRes.ok) {
        return new Response(JSON.stringify({ error: "MP failed", details: guestData }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        ok: true,
        payment_url: guestData.init_point,
        preference_id: guestData.id,
        external_reference: guestRef,
        amount: 30.0,
        currency: "BRL",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    if (action === "status") {
      if (!external_reference || !String(external_reference).startsWith("brisa-orientacao-")) {
        return new Response(JSON.stringify({ error: "Referência inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: row } = await supaService.from("brisa_orientacao_payments").select("status, external_reference").eq("external_reference", String(external_reference)).eq("patient_user_id", user.id).maybeSingle();
      return new Response(JSON.stringify({ ok: true, status: row?.status || "pending" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!phone || !name || !email || !triageId) {
      return new Response(JSON.stringify({ error: "Triagem completa obrigatória" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: triage } = await supaService.from("brisa_triages").select("id").eq("id", String(triageId)).eq("patient_id", user.id).eq("status", "completed").maybeSingle();
    if (!triage) {
      return new Response(JSON.stringify({ error: "Triagem não encontrada" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    const { error: orderError } = await supaService.from("orientacao_tecnica_orders").insert({
      user_id: user.id,
      patient_name: String(name).slice(0, 160),
      patient_whatsapp: String(phone).replace(/\D/g, "").slice(0, 20),
      patient_email: String(email).slice(0, 255),
      topic: "Orientação Técnica — Dr. Edilson Bezerra ON",
      amount: 30,
      currency: "BRL",
      platform_fee: 2.10,
      doctor_payout: 27.90,
      external_reference: externalRef,
      status: "pending",
      payment_method: "mercado_pago",
      ai_analysis: JSON.stringify({ triage_id: String(triageId) }),
    });
    if (orderError) {
      console.error("[brisa-payment-link] order:", orderError.message);
      return new Response(JSON.stringify({ error: "Não foi possível registrar o pedido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    {
      // MERCADO PAGO FLOW (BRL)
      const MP = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!MP) {
        return new Response(JSON.stringify({ error: "MP token missing" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const preference: any = {
        items: [{
          title: "Orientação Técnica — Dr. Edilson Bezerra ON",
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
        metadata: { source: "brisa_whatsapp", product: "orientacao_tecnica", user_id: user.id, triage_id: String(triageId) },
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
