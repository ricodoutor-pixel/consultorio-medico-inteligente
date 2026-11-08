import { createClient } from "npm:@supabase/supabase-js@2";
import { fixedConsultationPrice } from "../_shared/consultation-price.ts";
import {
  FALLBACK_DESCRIPTOR,
  formatPaymentName,
  getPaymentServices,
  resolveDisplayName,
  type PaymentService,
} from "../_shared/payment-catalog.ts";

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
 * Nomes exibidos ao pagador, valores e descritor da fatura vêm da tabela
 * única public.payment_services (ver _shared/payment-catalog.ts).
 * Tabela oficial 2026-08-03:
 *  serviços → Orientação R$30 · Retorno R$90 · Chat R$100 · Vídeo R$150
 *  planos   → 3 planos universais (paciente/médico/lojista) a R$99/mês
 */

/** Taxas oficiais de intermediação. */
const FEE_TELEMEDICINE = 0.07; // 7% plataforma / 93% profissional
const FEE_MARKETPLACE = 0.05; // 5% plataforma / 95% lojista
const round2 = (v: number) => Math.round(Number(v) * 100) / 100;

/** SKUs legados → novos (mantém links antigos funcionando com o preço correto). */
const LEGACY_SKU_MAP: Record<string, string> = {
  consulta_emergencia: "consulta_video",
  essencial_mensal: "plano_paciente",
  premium_mensal: "plano_paciente",
  vip_mensal: "plano_medico",
};

/** SKUs da Orientação Técnica (web). */
const isOrientacaoSku = (sku: unknown): sku is string =>
  typeof sku === "string" && sku.startsWith("orientacao");

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
      description: directDesc,
      triage,
      payment_method: requestedPaymentMethod,
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


    // Catálogo único de nomes/valores (tabela payment_services, com espelho de segurança).
    const catalog = await getPaymentServices(supabase);

    let title: string;
    let amount: number;
    let descriptor = FALLBACK_DESCRIPTOR;
    let externalReference: string;
    let type = "sku";
    let marketplaceFee: number | null = null;
    let collectorId: string | number | null = null;
    let splitDetails: Record<string, unknown> | null = null;

    if (orderId && typeof orderId === "string") {
      // Shopping / Club (camisetas, canecas, souvenirs, produtos): valor SEMPRE do banco.
      const { data: order } = await supabase
        .from("orders")
        .select("id, user_id, vendor_id, subtotal, shipping_cost, total, status")
        .eq("id", orderId)
        .maybeSingle();
      if (!order) return json({ error: "Pedido não encontrado" }, 404, req);
      if (order.user_id !== userId) return json({ error: "Forbidden" }, 403, req);
      if (order.status && !["pending", "awaiting_payment"].includes(String(order.status))) {
        return json({ error: "Pedido não está aguardando pagamento" }, 400, req);
      }

      const productsTotal = round2(Number(order.subtotal || 0));
      const shipping = round2(Number(order.shipping_cost || 0));
      amount = round2(Number(order.total || productsTotal + shipping));
      if (!(amount > 0)) return json({ error: "Pedido sem valor válido" }, 400, req);

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

      title = "Pedido Shopping — Planta y Raiz";
      externalReference = `order:${order.id}`;
      type = "marketplace_order";
    } else if (cartToken && typeof cartToken === "string") {
      const { data: cart } = await supabase
        .from("prescription_carts")
        .select("id, patient_id, total_amount, status, cart_token")
        .eq("cart_token", cartToken)
        .maybeSingle();
      if (!cart) return json({ error: "Carrinho não encontrado" }, 404, req);
      if (cart.patient_id !== userId) return json({ error: "Forbidden" }, 403, req);
      if (cart.status !== "pending") return json({ error: "Carrinho não está pendente" }, 400, req);
      amount = round2(Number(cart.total_amount || 0));
      if (!(amount > 0)) return json({ error: "Carrinho sem valor válido" }, 400, req);
      title = "Compra com Prescrição — Planta y Raiz";
      externalReference = `cart:${cart.id}`;
      type = "prescription_cart";
    } else if (appointmentId && typeof appointmentId === "string") {
      const { data: appt } = await supabase
        .from("appointments")
        .select("id, amount, patient_id, doctor_id, status, type")
        .eq("id", appointmentId)
        .maybeSingle();
      if (!appt) return json({ error: "Consulta não encontrada" }, 404, req);
      if (appt.patient_id !== userId) return json({ error: "Forbidden" }, 403, req);
      const fixedPrice = fixedConsultationPrice(appt.type);
      amount = fixedPrice ?? round2(Number(appt.amount || 0));
      if (fixedPrice !== null && Number(appt.amount) !== fixedPrice) {
        const { error: priceError } = await supabase.from("appointments")
          .update({ amount: fixedPrice }).eq("id", appt.id).eq("payment_status", "pending");
        if (priceError) return json({ error: "Não foi possível registrar o valor da consulta" }, 500, req);
      }
      if (!(amount > 0)) return json({ error: "Consulta sem valor válido" }, 400, req);
      title = appt.type === "video"
        ? resolveDisplayName(catalog, "consulta_video")
        : appt.type === "chat"
        ? resolveDisplayName(catalog, "consulta_chat")
        : "Consulta médica — Planta y Raiz";
      externalReference = `appointment:${appt.id}`;
      type = "consultation";

      marketplaceFee = round2(amount * FEE_TELEMEDICINE);
      if (appt.doctor_id) {
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
      const item: PaymentService | undefined = typeof sku === "string" ? catalog[sku] : undefined;

      if (!item || !item.active) return json({ error: "SKU inválido" }, 400, req);
      title = resolveDisplayName(catalog, sku as string);
      descriptor = item.descriptor || FALLBACK_DESCRIPTOR;
      amount = item.amount_brl;
      // Consulta Premium é o único serviço com valor definido pelo profissional.
      if (sku === "consulta_premium" && typeof doctorId === "string") {
        const { data: doc } = await supabase
          .from("doctors")
          .select("price_video_chat")
          .eq("id", doctorId)
          .maybeSingle();
        const custom = Number(doc?.price_video_chat || 0);
        if (custom >= 100 && custom <= 2000) amount = round2(custom);
      }
      externalReference = `${sku}:${userId}:${Date.now()}`;
      type = item.recurring ? "subscription" : "sku";

      // Serviços de telemedicina avulsos também seguem o split 93/7
      const isTelemedSku = typeof sku === "string" &&
        (sku.startsWith("consulta") || sku.startsWith("orientacao") || sku.startsWith("retorno"));
      if (isTelemedSku && !item.recurring) {
        marketplaceFee = round2(amount * FEE_TELEMEDICINE);
        if (typeof doctorId === "string" && !isOrientacaoSku(sku)) {
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

    title = formatPaymentName(title);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const siteUrl = "https://www.plantayraiz.com.br";
    const isAllowedSuccess = typeof returnUrl === "string" && ALLOWED_ORIGINS.some((origin) => returnUrl.startsWith(origin));
    const success = isAllowedSuccess
      ? returnUrl
      : `${siteUrl}/payment-success`;

    // Se o usuário logado for o próprio vendedor/admin da conta Mercado Pago (ex.: contato@plantayraiz.com.br),
    // omitimos o payer.email para que o Mercado Pago permita a qualquer usuário pagar sem erro de autofaturamento.
    const isSellerEmail = typeof authData.user.email === "string" && authData.user.email.toLowerCase().includes("plantayraiz");
    const payerEmail = (!isSellerEmail && authData.user.email) ? authData.user.email : undefined;

    const preference = {
      items: [{ title, quantity: 1, unit_price: Number(amount.toFixed(2)), currency_id: "BRL" }],
      payer: payerEmail ? { email: payerEmail } : {},
      back_urls: {
        success,
        failure: `${siteUrl}/payment/failure`,
        pending: `${siteUrl}/payment/pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: externalReference,
      statement_descriptor: descriptor,
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

    // Nome do paciente para o checkout / Pix
    const tTriage = (triage ?? {}) as Record<string, unknown>;
    const userMeta = (authData.user.user_metadata ?? {}) as Record<string, unknown>;
    const patientName = String(tTriage.nome || userMeta.full_name || authData.user.email?.split("@")[0] || "Paciente").trim().slice(0, 120);

    const isPixDirect = requestedPaymentMethod === "pix";
    let endpoint = isPixDirect
      ? "https://api.mercadopago.com/v1/payments"
      : "https://api.mercadopago.com/checkout/preferences";
    let bodyData: any = preference;

    // Use Mercado Pago Payments API for direct PIX
    if (isPixDirect) {
      const pFirst = patientName.split(" ")[0] || "Paciente";
      const pLast = patientName.split(" ").slice(1).join(" ") || "Cliente";
      bodyData = {
        transaction_amount: Number(amount.toFixed(2)),
        description: title,
        payment_method_id: "pix",
        payer: {
          email: payerEmail || (isSellerEmail ? "cliente@plantayraiz.com.br" : (authData.user.email || "contato@plantayraiz.com.br")),
          first_name: pFirst,
          last_name: pLast,
        },
        external_reference: externalReference,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        metadata: {
          type,
          user_id: userId,
          sku: sku ?? null,
          order_id: orderId ?? null,
        },
      };
    } else if (type === "subscription") {
      // Use Mercado Pago Subscriptions API for recurring plans
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

    // Pagamento primeiro: pedido persistido antes da chamada MP; triagem após webhook.
    const isOrientacaoOrder = type === "sku" && isOrientacaoSku(sku);
    if (isOrientacaoOrder) {
      const t = tTriage;
      const meta = userMeta;
      let patientPhone = String(t.whatsapp ?? t.telefone ?? t.phone ?? meta.phone ?? meta.whatsapp ?? "").replace(/\D/g, "");
      if (!/^\d{10,15}$/.test(patientPhone)) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("whatsapp, phone")
          .eq("id", userId)
          .maybeSingle();
        patientPhone = String((prof as any)?.whatsapp || (prof as any)?.phone || "").replace(/\D/g, "");
      }
      const platformFee = round2(amount * FEE_TELEMEDICINE);
      const nowIso = new Date().toISOString();

      const { error: orderErr } = await supabase.from("orientacao_tecnica_orders").insert({
        external_reference: externalReference,
        user_id: userId,
        patient_name: patientName.length >= 2 ? patientName : "Paciente",
        patient_whatsapp: /^\d{10,15}$/.test(patientPhone) ? patientPhone : "",
        patient_email: authData.user.email || null,
        amount,
        platform_fee: platformFee,
        doctor_payout: round2(amount - platformFee),
        payment_method: isPixDirect ? "pix" : "mercadopago",
        status: "pending",
        currency: "BRL",
        topic: "Orientação Técnica",
        triagem: {},
        flow_status: "aguardando_pagamento",
        created_at: nowIso,
        updated_at: nowIso,
      });
      if (orderErr) {
        console.error("[mp-checkout] order_save_failed", { code: orderErr.code, message: orderErr.message, details: orderErr.details, hint: orderErr.hint });
        return json({ error: "order_save_failed" }, 500, req);
      }
    }

    const mpResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": externalReference,
      },
      body: JSON.stringify(bodyData),
    });

    if (!mpResponse.ok) {
      const mpError = await mpResponse.json().catch(() => ({}));
      console.error("[mp-checkout] payment_generation_failed", { status: mpResponse.status, code: mpError.error, causes: mpError.cause?.map((c: any) => c.code) });
      if (isOrientacaoOrder) {
        await supabase.from("orientacao_tecnica_orders")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("external_reference", externalReference);
      }
      return json({ error: "Erro ao criar pagamento no Mercado Pago" }, 502);
    }

    const mpData = await mpResponse.json();

    if (isPixDirect) {
      const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;
      const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url;

      if (isOrientacaoOrder) {
        await supabase.from("orientacao_tecnica_orders")
          .update({
            mp_payment_id: String(mpData.id),
            qr_code: qrCode,
            qr_code_base64: qrCodeBase64,
            ticket_url: ticketUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("external_reference", externalReference);
      }

      await supabase.from("audit_log").insert({
        user_id: userId,
        action: "mp_pix_created",
        table_name: "orientacao_tecnica_orders",
        record_id: String(mpData.id),
        new_data: { type, amount, external_reference: externalReference, payment_id: mpData.id, description: title },
      });

      console.info("[mp-checkout] pix_created", { amount, payment_id: mpData.id, status: mpData.status, description: title });
      return json({
        success: true,
        payment_method: "pix",
        payment_id: mpData.id,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
        external_reference: externalReference,
        amount,
        description: title,
        split: splitDetails,
      });
    }

    if (isOrientacaoOrder) {
      await supabase.from("orientacao_tecnica_orders")
        .update({ mp_preference_id: String(mpData.id), updated_at: new Date().toISOString() })
        .eq("external_reference", externalReference);
    }

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
      external_reference: externalReference,
      amount,
      split: splitDetails,
    });

  } catch (e) {
    console.error("[mp-checkout]", e);
    return json({ error: "Erro interno" }, 500);
  }
});
