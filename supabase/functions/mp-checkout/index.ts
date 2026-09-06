import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://plantayraiz.com.br",
  "https://www.plantayraiz.com.br",
  "https://consultorio-medico-inteligente.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const json = (body: unknown, status = 200, req?: Request) => {
  const headers = req ? getCorsHeaders(req) : {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
};

/**
 * Catálogo autoritativo (server-side). O cliente NUNCA envia preço.
 * Tabela oficial 2026-08-03:
 *  serviços → Orientação R$30 · Retorno R$90 · Chat R$100 · Vídeo R$150
 *  planos   → 3 planos universais (paciente/médico/lojista) a R$99/mês
 */
const CATALOG: Record<string, { title: string; amount: number; recurring?: boolean }> = {
  orientacao_tecnica: { title: "Orientação Técnica (Planta y Raiz)", amount: 30 },
  orientacao: { title: "Orientação Técnica (Planta y Raiz)", amount: 30 },
  retorno_consulta: { title: "Retorno com o Profissional", amount: 90 },
  consulta_chat: { title: "Consulta por Chat (com receita assinada)", amount: 100 },
  consulta_video: { title: "Consulta por Vídeo (com receita assinada)", amount: 150 },
  consulta_premium: { title: "Consulta Premium (Vídeo + Chat)", amount: 180 },
  consulta_canabinoide: { title: "Consulta Canabinoide Especializada", amount: 250 },
  plano_paciente: { title: "Plano Paciente (mensal)", amount: 99, recurring: true },
  plano_medico: { title: "Plano Médico (mensal)", amount: 99, recurring: true },
  plano_lojista: { title: "Plano Lojista (mensal)", amount: 99, recurring: true },
  plano_basic: { title: "Plano Individual Básico", amount: 49.90, recurring: true },
  plano_professional: { title: "Plano Médico Profissional", amount: 99.90, recurring: true },
  plano_premium: { title: "Plano Saúde Verde Família", amount: 199.90, recurring: true },
  plano_enterprise: { title: "Plano Empresa & Parceiros", amount: 499.90, recurring: true },
};

/** SKUs legados → novos (mantém links antigos funcionando com o preço correto). */
const LEGACY_SKU_MAP: Record<string, string> = {
  consulta_emergencia: "consulta_video",
  essencial_mensal: "plano_paciente",
  premium_mensal: "plano_paciente",
  vip_mensal: "plano_medico",
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: authData, error: authError } = await anonClient.auth.getUser();
    if (authError || !authData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = authData.user.id;

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) return json({ error: "Mercado Pago não configurado" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {
      sku: rawSku,
      cartToken,
      appointmentId,
      returnUrl,
      refCode,
      doctorId,
      orderId,
      shipping_cost,
      shipping_cep,
      shipping_carrier,
      shipping_days,
      amount: directAmount,
      description: directDesc
    } = await req.json();
    const sku = typeof rawSku === "string" ? (LEGACY_SKU_MAP[rawSku] ?? rawSku) : rawSku;

    // Programa de indicações (médicos, pacientes e lojistas) — resolvido no servidor.
    let referrerId: string | null = null;
    if (typeof refCode === "string" && refCode.length > 3 && refCode.length < 40) {
      const { data: refRow } = await supabase
        .from("referral_links")
        .select("user_id")
        .eq("code", refCode)
        .maybeSingle();
      if (refRow?.user_id && refRow.user_id !== userId) referrerId = refRow.user_id;
    }


    let title: string;
    let amount: number;
    let externalReference: string;
    let type = "sku";

    if (orderId && typeof orderId === "string") {
      title = directDesc || `Pedido Shopping ${orderId} — Planta y Raiz`;
      const baseAmt = Number(directAmount || 0);
      const shipAmt = Number(shipping_cost || 0);
      amount = Math.max(1, baseAmt + shipAmt);
      externalReference = `order:${orderId}`;
      type = "product_order";
    } else if (cartToken && typeof cartToken === "string") {
      const { data: cart } = await supabase
        .from("prescription_carts")
        .select("id, patient_id, total_amount, status, cart_token")
        .eq("cart_token", cartToken)
        .maybeSingle();
      if (!order) return json({ error: "Pedido não encontrado" }, 404);
      if (order.user_id !== userId) return json({ error: "Forbidden" }, 403);

      const productsTotal = Number(order.subtotal || 0);
      const shipping = Number(order.shipping_cost || 0);
      amount = Math.max(1, round2(Number(order.total || productsTotal + shipping)));
      // A taxa de 5% incide apenas sobre produtos; o frete é repassado 100% ao vendor.
      marketplaceFee = round2(productsTotal * FEE_MARKETPLACE);
      const vendorNet = round2(amount - marketplaceFee);

      if (order.vendor_id) {
        const { data: vendor } = await supabase
          .from("vendors")
          .select("mp_collector_id")
          .eq("id", order.vendor_id)
          .maybeSingle();
        collectorId = (vendor as any)?.mp_collector_id ?? null;
      }

      splitDetails = {
        model: "marketplace_95_5",
        gross_amount: amount,
        products_amount: productsTotal,
        shipping_amount: shipping,
        platform_fee: marketplaceFee,
        vendor_net_amount: vendorNet,
        vendor_id: order.vendor_id ?? null,
        collector_id: collectorId,
      };

      await supabase
        .from("orders")
        .update({
          platform_fee: marketplaceFee,
          vendor_net_amount: vendorNet,
          split_details: splitDetails,
        })
        .eq("id", order.id);

      title = "Pedido Shopping Planta y Raiz";
      externalReference = `order:${order.id}`;
      type = "marketplace_order";
    } else if (cartToken && typeof cartToken === "string") {
      const { data: cart } = await supabase
        .from("prescription_carts")
        .select("id, patient_id, total_amount, status, cart_token")
        .eq("cart_token", cartToken)
        .maybeSingle();
      if (!cart) return json({ error: "Carrinho não encontrado" }, 404);
      if (cart.patient_id !== userId) return json({ error: "Forbidden" }, 403);
      if (cart.status !== "pending") return json({ error: "Carrinho não está pendente" }, 400);
      title = "Carrinho de Prescrição Médica";
      amount = Math.max(1, Number(cart.total_amount || 0));
      externalReference = `cart:${cart.id}`;
      type = "prescription_cart";
    } else if (appointmentId && typeof appointmentId === "string") {
      const { data: appt } = await supabase
        .from("appointments")
        .select("id, amount, patient_id, doctor_id")
        .eq("id", appointmentId)
        .maybeSingle();
      if (!appt) return json({ error: "Consulta não encontrada" }, 404);
      if (appt.patient_id !== userId) return json({ error: "Forbidden" }, 403);
      title = "Consulta médica — Planta y Raiz";
      amount = Math.max(1, Number(appt.amount || 0));
      externalReference = `appointment:${appt.id}`;
      type = "consultation";
    } else {
      let item = typeof sku === "string" ? CATALOG[sku] : undefined;
      
      if (typeof sku === "string" && sku.startsWith("tool_")) {
        if (sku === "tool_combo_tools") {
          item = { title: "Combo 11 Módulos (Consultório Digital)", amount: 97.00 };
        } else {
          item = { title: `Módulo Diagnóstico: ${sku.replace('tool_', '')}`, amount: 29.90 };
        }
      }

      if (!item) return json({ error: "SKU inválido" }, 400);
      title = item.title;
      amount = item.amount;
      // Consulta Premium é o único serviço com valor definido pelo profissional.
      if (sku === "consulta_premium" && typeof doctorId === "string") {
        const { data: doc } = await supabase
          .from("doctors")
          .select("mp_collector_id")
          .eq("id", appt.doctor_id)
          .maybeSingle();
        collectorId = (doc as any)?.mp_collector_id ?? null;
      }
      splitDetails = {
        model: "telemedicine_93_7",
        gross_amount: amount,
        platform_fee: marketplaceFee,
        doctor_net_amount: round2(amount - marketplaceFee),
        doctor_id: appt.doctor_id ?? null,
        collector_id: collectorId,
      };
    } else {
      let item = typeof sku === "string" ? CATALOG[sku] : undefined;
      
      if (typeof sku === "string" && sku.startsWith("tool_")) {
        if (sku === "tool_combo_tools") {
          item = { title: "Combo 11 Módulos (Consultório Digital)", amount: 97.00 };
        } else {
          item = { title: `Módulo Diagnóstico: ${sku.replace('tool_', '')}`, amount: 29.90 };
        }
      }

      if (!item) return json({ error: "SKU inválido" }, 400);
      title = item.title;
      amount = item.amount;
      // Consulta Premium é o único serviço com valor definido pelo profissional.
      if (sku === "consulta_premium" && typeof doctorId === "string") {
        const { data: doc } = await supabase
          .from("doctors")
          .select("price_video_chat")
          .eq("id", doctorId)
          .maybeSingle();
        const custom = Number(doc?.price_video_chat || 0);
        if (custom >= 100 && custom <= 2000) amount = custom;
      }
      externalReference = `${sku}:${userId}:${Date.now()}`;
      type = item.recurring ? "subscription" : "sku";

      // Serviços de telemedicina avulsos também seguem o split 93/7
      const isTelemedSku = typeof sku === "string" &&
        (sku.startsWith("consulta") || sku.startsWith("orientacao") || sku.startsWith("retorno"));
      if (isTelemedSku && !item.recurring) {
        marketplaceFee = round2(amount * FEE_TELEMEDICINE);
        if (typeof doctorId === "string") {
          const { data: doc } = await supabase
            .from("doctors")
            .select("mp_collector_id")
            .eq("id", doctorId)
            .maybeSingle();
          collectorId = (doc as any)?.mp_collector_id ?? null;
        }
        splitDetails = {
          model: "telemedicine_93_7",
          gross_amount: amount,
          platform_fee: marketplaceFee,
          doctor_net_amount: round2(amount - marketplaceFee),
          doctor_id: typeof doctorId === "string" ? doctorId : null,
          collector_id: collectorId,
        };
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const siteUrl = "https://www.plantayraiz.com.br";
    const success = typeof returnUrl === "string" && returnUrl.startsWith(siteUrl)
      ? returnUrl
      : `${siteUrl}/payment-success`;

    const preference = {
      items: [{ title, quantity: 1, unit_price: Number(amount.toFixed(2)), currency_id: "BRL" }],
      payer: { email: authData.user.email ?? undefined },
      back_urls: {
        success,
        failure: `${siteUrl}/payment/failure`,
        pending: `${siteUrl}/payment/pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: externalReference,
      statement_descriptor: "PLANTA Y RAIZ",
      metadata: {
        type,
        user_id: userId,
        sku: sku ?? null,
        order_id: orderId ?? null,
        cart_token: cartToken ?? null,
        ref_code: typeof refCode === "string" ? refCode : null,
        referrer_id: referrerId,
        shipping_cost: Number(shipping_cost || 0),
        shipping_cep: shipping_cep ?? null,
        shipping_carrier: shipping_carrier ?? null,
        shipping_days: shipping_days ?? null,
      },
      // Split nativo na adquirente (Mercado Pago marketplace)
      ...(marketplaceFee !== null ? { marketplace_fee: marketplaceFee } : {}),
      ...(collectorId ? { collector_id: Number(collectorId) || collectorId } : {}),
    };

    let endpoint = "https://api.mercadopago.com/checkout/preferences";
    let bodyData: any = preference;

    // Use Mercado Pago Subscriptions API for recurring plans
    if (type === "subscription") {
      endpoint = "https://api.mercadopago.com/preapproval";
      bodyData = {
        reason: title,
        external_reference: externalReference,
        payer_email: authData.user.email ?? "cliente@plantayraiz.com.br",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: Number(amount.toFixed(2)),
          currency_id: "BRL"
        },
        back_url: success
      };
    }

    const mpResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    if (!mpResponse.ok) {
      console.error("[mp-checkout] MP error", mpResponse.status, await mpResponse.text());
      return json({ error: "Erro ao criar pagamento no Mercado Pago" }, 502);
    }

    const mpData = await mpResponse.json();

    // Comprovante de liquidação direta gravado na transação
    const settlementReceipt = splitDetails
      ? {
          ...splitDetails,
          provider: "mercado_pago",
          preference_id: String(mpData.id),
          created_at: new Date().toISOString(),
        }
      : null;

    if (settlementReceipt && type === "marketplace_order" && typeof orderId === "string") {
      await supabase
        .from("orders")
        .update({ settlement_receipt: settlementReceipt, payment_id: String(mpData.id) })
        .eq("id", orderId);
    }
    if (settlementReceipt && type === "consultation" && typeof appointmentId === "string") {
      await supabase
        .from("payments")
        .update({ split_details: splitDetails, settlement_receipt: settlementReceipt })
        .eq("mp_preference_id", String(mpData.id));
    }

    await supabase.from("audit_log").insert({
      user_id: userId,
      action: "mp_checkout_created",
      table_name: "payments",
      record_id: String(mpData.id),
      new_data: { type, amount, external_reference: externalReference, split: splitDetails },
    });

    return json({
      init_point: mpData.init_point,
      preference_id: mpData.id,
      amount,
      split: splitDetails,
    });
  } catch (e) {
    console.error("[mp-checkout]", e);
    return json({ error: "Erro interno" }, 500);
  }
});
