import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado. Faça login primeiro." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { items, total, description, coupon_code } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Carrinho vazio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!total || typeof total !== "number" || total <= 0) {
      return new Response(JSON.stringify({ error: "Valor inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Token Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = "https://consultorio-medico-inteligente.lovable.app";

    // Validate items server-side: check prices from vendor_products
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const productIds = items.map((i: { product_id?: string }) => i.product_id).filter(Boolean);

    let validatedTotal = 0;
    const mpItems = [];

    if (productIds.length > 0) {
      const { data: products } = await serviceClient
        .from("vendor_products")
        .select("id, name, price, is_active, vendor_id")
        .in("id", productIds)
        .eq("is_active", true);

      const productMap = new Map((products || []).map(p => [p.id, p]));

      for (const item of items) {
        const product = item.product_id ? productMap.get(item.product_id) : null;
        const price = product ? Number(product.price) : Number(item.price);
        const title = product ? product.name : item.title;
        const qty = Math.max(1, Math.floor(item.quantity || 1));

        mpItems.push({
          title: String(title).substring(0, 255),
          quantity: qty,
          unit_price: price,
          currency_id: "BRL",
        });
        validatedTotal += price * qty;
      }
    } else {
      // Fallback for items without product_id
      for (const item of items) {
        const qty = Math.max(1, Math.floor(item.quantity || 1));
        mpItems.push({
          title: String(item.title).substring(0, 255),
          quantity: qty,
          unit_price: Number(item.price),
          currency_id: "BRL",
        });
        validatedTotal += Number(item.price) * qty;
      }
    }

    // Apply coupon discount if provided
    let discountAmount = 0;
    if (coupon_code) {
      // TODO: Validate coupon from coupons table when available
      console.log(`[create-cart-payment] Coupon code received: ${coupon_code}`);
    }

    const finalTotal = validatedTotal - discountAmount;

    // Calculate marketplace split: 10% platform fee
    const platformFeeRate = 0.10;
    const platformFee = Math.round(finalTotal * platformFeeRate * 100) / 100;

    const externalRef = `cart-${user.id}-${Date.now()}`;

    const preference = {
      items: mpItems,
      payer: {
        email: user.email || undefined,
      },
      back_urls: {
        success: `${siteUrl}/payment/success`,
        failure: `${siteUrl}/payment/failure`,
        pending: `${siteUrl}/payment/pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: externalRef,
      statement_descriptor: "PLANTA E RAIZ",
      marketplace_fee: platformFee,
      metadata: {
        type: "marketplace",
        buyer_id: user.id,
        items_count: mpItems.length,
        coupon_code: coupon_code || null,
      },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errText = await mpResponse.text();
      console.error("[create-cart-payment] MP error:", mpResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao criar pagamento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpResponse.json();

    // Only return production init_point
    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      preference_id: mpData.id,
      total: finalTotal,
      platform_fee: platformFee,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[create-cart-payment] error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
