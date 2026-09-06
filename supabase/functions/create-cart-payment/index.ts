import { createClient } from "npm:@supabase/supabase-js@2";
import { CLUB_CATALOG } from "../_shared/club-catalog.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Token Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = "https://consultorio-medico-inteligente.lovable.app";

    // SECURITY: every item MUST reference a real catalog product_id (vendor_products
    // do Shopping ou o catálogo estático `club_*` do Club). Preços vêm sempre do servidor.
    if (!items.every((i: { product_id?: string }) => typeof i.product_id === "string" && i.product_id.length > 0)) {
      return new Response(JSON.stringify({ error: "Todos os itens devem referenciar um produto válido (product_id)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const productIds = items
      .map((i: { product_id: string }) => i.product_id)
      .filter((id: string) => !CLUB_CATALOG[id]);

    let products: Array<{ id: string; name: string; price: number; vendor_id: string }> = [];
    if (productIds.length > 0) {
      const { data, error: productsError } = await serviceClient
        .from("vendor_products")
        .select("id, name, price, is_active, vendor_id")
        .in("id", productIds)
        .eq("is_active", true);

      if (productsError) {
        console.error("[create-cart-payment] product lookup failed:", productsError);
        return new Response(JSON.stringify({ error: "Falha ao validar produtos" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      products = (data || []) as typeof products;
    }

    const productMap = new Map(products.map(p => [p.id, p]));

    let validatedTotal = 0;
    const mpItems = [];

    for (const item of items) {
      const club = CLUB_CATALOG[item.product_id];
      const product = club
        ? { id: item.product_id, name: club.name, price: club.price, vendor_id: null }
        : productMap.get(item.product_id);
      if (!product) {
        return new Response(JSON.stringify({ error: `Produto inválido ou inativo: ${item.product_id}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const price = Number(product.price);
      const qty = Math.max(1, Math.floor(item.quantity || 1));

      mpItems.push({
        title: String(product.name).substring(0, 255),
        quantity: qty,
        unit_price: price,
        currency_id: "BRL",
      });
      validatedTotal += price * qty;
    }


    // Apply coupon discount if provided
    let discountAmount = 0;
    if (coupon_code) {
      // TODO: Validate coupon from coupons table when available
      console.log(`[create-cart-payment] Coupon code received: ${coupon_code}`);
    }

    const finalTotal = validatedTotal - discountAmount;

    // Split do Shopping: 5% de taxa da plataforma (lojista recebe 95%)
    const platformFeeRate = 0.05;
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
        user_id: user.id,
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
