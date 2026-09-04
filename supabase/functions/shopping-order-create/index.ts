import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://plantayraiz.com.br",
  "https://www.plantayraiz.com.br",
  "https://consultorio-medico-inteligente.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });

/** Catálogo autoritativo do Shopping (o cliente NUNCA envia preço). */
const SHOP_CATALOG: Record<string, { title: string; price: number; vendor: string }> = {
  "prod-1": { title: "Óleo CBD Isolado 1000mg", price: 289.9, vendor: "Verde Vida Farmácia" },
  "prod-2": { title: "Cápsulas CBD 25mg (30un)", price: 199.9, vendor: "Cannabis Pharma BR" },
  "prod-3": { title: "Tintura Full Spectrum 30ml", price: 349.9, vendor: "Nature Lab Canábica" },
  "prod-4": { title: "Spray Sublingual CBD 500mg", price: 219.9, vendor: "Botânica Medicinal" },
  "prod-5": { title: "Gomas CBD + Melatonina (30un)", price: 129.9, vendor: "Sleep Well Brasil" },
  "prod-6": { title: "Óleo CBD Sleep 500mg", price: 259.9, vendor: "Verde Vida Farmácia" },
  "prod-7": { title: "Creme Tópico CBD 120g", price: 149.9, vendor: "Nature Lab Canábica" },
  "prod-8": { title: "Gel Muscular CBD 100ml", price: 119.9, vendor: "Cannabis Pharma BR" },
  "prod-9": { title: "Adesivos Transdérmicos CBD (10un)", price: 189.9, vendor: "Botânica Medicinal" },
  "prod-10": { title: "Ômega 3 + CBD (60 cáps)", price: 159.9, vendor: "Verde Vida Farmácia" },
};

const REGION_BY_STATE: Record<string, "SE" | "S" | "CO" | "NE" | "N"> = {
  SP: "SE", RJ: "SE", MG: "SE", ES: "SE",
  PR: "S", SC: "S", RS: "S",
  DF: "CO", GO: "CO", MT: "CO", MS: "CO",
  BA: "NE", SE: "NE", AL: "NE", PE: "NE", PB: "NE", RN: "NE", CE: "NE", PI: "NE", MA: "NE",
  AM: "N", PA: "N", AC: "N", RO: "N", RR: "N", AP: "N", TO: "N",
};
const REGION_TABLE: Record<string, { pac: [number, number]; sedex: [number, number] }> = {
  SE: { pac: [18.9, 5], sedex: [32.9, 2] },
  S: { pac: [22.9, 6], sedex: [38.9, 3] },
  CO: { pac: [26.9, 7], sedex: [44.9, 3] },
  NE: { pac: [29.9, 9], sedex: [52.9, 4] },
  N: { pac: [34.9, 12], sedex: [64.9, 5] },
};
const FREE_SHIPPING_THRESHOLD = 350;
const TAX_RATE = 0.1;
const FEE_MARKETPLACE = 0.05;
const round2 = (n: number) => Math.round(n * 100) / 100;

async function serverShipping(cep: string, subtotal: number, service: string) {
  let state: string | undefined;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (!data?.erro) state = data.uf;
    }
  } catch { /* fallback SE */ }
  const table = REGION_TABLE[(state && REGION_BY_STATE[state]) || "SE"];
  const isSedex = String(service || "").toUpperCase().includes("SEDEX");
  if (isSedex) return { price: table.sedex[0], days: table.sedex[1], service: "SEDEX" };
  return {
    price: subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : table.pac[0],
    days: table.pac[1],
    service: "PAC",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(req, { error: "Unauthorized" }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: authData, error: authError } = await anon.auth.getUser();
    if (authError || !authData?.user) return json(req, { error: "Unauthorized" }, 401);
    const userId = authData.user.id;

    const body = await req.json();
    const rawItems = Array.isArray(body?.items) ? body.items : [];
    if (rawItems.length === 0 || rawItems.length > 30) {
      return json(req, { error: "Carrinho inválido" }, 400);
    }
    const cep = String(body?.cep || "").replace(/\D/g, "").slice(0, 8);
    if (cep.length !== 8) return json(req, { error: "Informe um CEP válido para calcular o frete." }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Produtos reais de lojistas homologados têm prioridade sobre o catálogo estático.
    const ids: string[] = rawItems
      .map((i: { product_id?: string }) => String(i?.product_id || ""))
      .filter(Boolean);
    const uuidIds = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    let dbProducts: Array<{ id: string; name: string; price: number; vendor_id: string }> = [];
    if (uuidIds.length > 0) {
      const { data } = await supabase
        .from("vendor_products")
        .select("id, name, price, vendor_id")
        .in("id", uuidIds)
        .eq("is_active", true);
      dbProducts = (data || []) as typeof dbProducts;
    }
    const dbMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    let vendorId: string | null = null;
    const items: Array<Record<string, unknown>> = [];

    for (const raw of rawItems) {
      const productId = String(raw?.product_id || "");
      const qty = Math.min(20, Math.max(1, Math.floor(Number(raw?.quantity) || 1)));
      const db = dbMap.get(productId);
      const stat = SHOP_CATALOG[productId];
      if (!db && !stat) return json(req, { error: `Produto inválido: ${productId}` }, 400);
      const title = db ? db.name : stat!.title;
      const price = Number(db ? db.price : stat!.price);
      if (db?.vendor_id && !vendorId) vendorId = db.vendor_id;
      subtotal += price * qty;
      items.push({ product_id: productId, title, unit_price: price, quantity: qty });
    }
    subtotal = round2(subtotal);

    const ship = await serverShipping(cep, subtotal, body?.shipping_service);
    const tax = round2(subtotal * TAX_RATE);
    const total = round2(subtotal + tax + ship.price);
    const platformFee = round2(subtotal * FEE_MARKETPLACE);
    const vendorNet = round2(total - platformFee);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        items,
        subtotal,
        total,
        status: "pending",
        vendor_id: vendorId,
        shipping_cep: cep,
        shipping_carrier: "Correios",
        shipping_method: ship.service,
        shipping_cost: ship.price,
        shipping_days: ship.days,
        shipping_deadline_days: ship.days,
        platform_fee: platformFee,
        vendor_net_amount: vendorNet,
        split_details: {
          model: "marketplace_95_5",
          gross_amount: total,
          products_amount: subtotal,
          tax_amount: tax,
          shipping_amount: ship.price,
          platform_fee: platformFee,
          vendor_net_amount: vendorNet,
          vendor_id: vendorId,
        },
      })
      .select("id, subtotal, total, shipping_cost, shipping_method, shipping_days, platform_fee, vendor_net_amount")
      .single();

    if (error || !order) {
      console.error("[shopping-order-create] insert failed:", error);
      return json(req, { error: "Não foi possível criar o pedido." }, 500);
    }

    return json(req, { order_id: order.id, ...order, tax });
  } catch (e) {
    console.error("[shopping-order-create] error:", e);
    return json(req, { error: "Erro interno" }, 500);
  }
});
