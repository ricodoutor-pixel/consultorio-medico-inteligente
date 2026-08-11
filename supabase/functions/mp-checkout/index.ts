import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Catálogo autoritativo (server-side). O cliente NUNCA envia preço.
 * Tabela oficial 2026-08-03:
 *  serviços → Orientação R$30 · Retorno R$90 · Chat R$100 · Vídeo R$150
 *  planos   → 3 planos universais (paciente/médico/lojista) a R$99/mês
 */
const CATALOG: Record<string, { title: string; amount: number; recurring?: boolean }> = {
  orientacao_tecnica: { title: "Orientação Técnica (Planta y Raiz)", amount: 30 },
  retorno_consulta: { title: "Retorno com o Profissional", amount: 90 },
  consulta_chat: { title: "Consulta por Chat (com receita assinada)", amount: 100 },
  consulta_video: { title: "Consulta por Vídeo (com receita assinada)", amount: 150 },
  consulta_premium: { title: "Consulta Premium (Vídeo + Chat)", amount: 180 },
  plano_paciente: { title: "Plano Paciente (mensal)", amount: 99, recurring: true },
  plano_medico: { title: "Plano Médico (mensal)", amount: 99, recurring: true },
  plano_lojista: { title: "Plano Lojista (mensal)", amount: 99, recurring: true },
};

/** SKUs legados → novos (mantém links antigos funcionando com o preço correto). */
const LEGACY_SKU_MAP: Record<string, string> = {
  consulta_emergencia: "consulta_video",
  essencial_mensal: "plano_paciente",
  premium_mensal: "plano_paciente",
  vip_mensal: "plano_medico",
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

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

    const { sku: rawSku, cartToken, appointmentId, returnUrl, refCode, doctorId } = await req.json();
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

    if (cartToken && typeof cartToken === "string") {
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
        .select("id, amount, patient_id")
        .eq("id", appointmentId)
        .maybeSingle();
      if (!appt) return json({ error: "Consulta não encontrada" }, 404);
      if (appt.patient_id !== userId) return json({ error: "Forbidden" }, 403);
      title = "Consulta médica — Planta y Raiz";
      amount = Math.max(1, Number(appt.amount || 0));
      externalReference = `appointment:${appt.id}`;
      type = "consultation";
    } else {
      const item = typeof sku === "string" ? CATALOG[sku] : undefined;
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
        cart_token: cartToken ?? null,
        ref_code: typeof refCode === "string" ? refCode : null,
        referrer_id: referrerId,
      },

    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      console.error("[mp-checkout] MP error", mpResponse.status, await mpResponse.text());
      return json({ error: "Erro ao criar pagamento no Mercado Pago" }, 502);
    }

    const mpData = await mpResponse.json();

    await supabase.from("audit_log").insert({
      user_id: userId,
      action: "mp_checkout_created",
      table_name: "payments",
      record_id: String(mpData.id),
      new_data: { type, amount, external_reference: externalReference },
    });

    return json({ init_point: mpData.init_point, preference_id: mpData.id, amount });
  } catch (e) {
    console.error("[mp-checkout]", e);
    return json({ error: "Erro interno" }, 500);
  }
});
