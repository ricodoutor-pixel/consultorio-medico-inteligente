import { getCorsHeaders } from "../_shared/cors.ts";

interface ShippingDimensions {
  height?: number;
  width?: number;
  length?: number;
}

interface ShippingQuoteRequest {
  origin_cep?: string;
  destination_cep: string;
  weight?: number; // em kg
  dimensions?: ShippingDimensions;
  declared_value?: number;
  cart_total?: number;
}

interface ShippingOption {
  id: string;
  name: string;
  company: string;
  price: number;
  delivery_time: number;
  currency: string;
  refrigerated?: boolean;
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body: ShippingQuoteRequest = await req.json().catch(() => ({}) as ShippingQuoteRequest);
    const destinationCep = String(body.destination_cep || "").replace(/\D/g, "");

    if (destinationCep.length !== 8) {
      return new Response(
        JSON.stringify({ error: "CEP de destino inválido (deve conter 8 dígitos numéricos)" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const originCep = String(body.origin_cep || "04571010").replace(/\D/g, "");
    const weight = Number(body.weight || 0.35); // peso padrão de fitocanabinoide / frasco
    const declaredValue = Number(body.declared_value || body.cart_total || 0);
    const dimensions = {
      height: body.dimensions?.height || 8,
      width: body.dimensions?.width || 12,
      length: body.dimensions?.length || 18,
    };

    // 1. Tentar Melhor Envio API se token configurado no ambiente
    const MELHOR_ENVIO_TOKEN = Deno.env.get("MELHOR_ENVIO_TOKEN");
    if (MELHOR_ENVIO_TOKEN) {
      try {
        const meResponse = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${MELHOR_ENVIO_TOKEN}`,
            "User-Agent": "Planta y Raiz Logistica (contato@plantayraiz.com.br)",
          },
          body: JSON.stringify({
            from: { postal_code: originCep },
            to: { postal_code: destinationCep },
            package: {
              height: dimensions.height,
              width: dimensions.width,
              length: dimensions.length,
              weight: weight,
            },
            options: {
              insurance_value: declaredValue,
              receipt: false,
              own_hand: true,
            },
          }),
        });

        if (meResponse.ok) {
          const meData = await meResponse.json();
          if (Array.isArray(meData) && meData.length > 0) {
            const mappedOptions: ShippingOption[] = meData
              .filter((item: any) => !item.error && item.price)
              .map((item: any) => ({
                id: String(item.id || item.name).toLowerCase(),
                name: item.name,
                company: item.company?.name || "Transportadora",
                price: Number(item.price),
                delivery_time: Number(item.delivery_time || item.custom_delivery_time || 5),
                currency: "BRL",
                refrigerated: item.name?.toLowerCase().includes("expresso") || false,
              }));

            if (mappedOptions.length > 0) {
              return new Response(
                JSON.stringify({
                  success: true,
                  source: "melhor_envio",
                  origin_cep: originCep,
                  destination_cep: destinationCep,
                  options: mappedOptions,
                }),
                { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
              );
            }
          }
        }
      } catch (meErr) {
        console.warn("[shipping-quote] Melhor Envio API fallback triggered:", meErr);
      }
    }

    // 2. Fallback Paramétrico Conforme Faixas de CEP dos Correios / Logística Nacional
    const destPrefix = parseInt(destinationCep.substring(0, 2), 10);
    const isSameCitySP = destPrefix >= 1 && destPrefix <= 5; // SP Capital
    const isStateSP = destPrefix >= 6 && destPrefix <= 19; // SP Grande SP / Interior
    const isSudeste = (destPrefix >= 20 && destPrefix <= 28) || (destPrefix >= 30 && destPrefix <= 39); // RJ / ES / MG
    const isSul = destPrefix >= 80 && destPrefix <= 99; // PR / SC / RS
    const isCentroOeste = destPrefix >= 70 && destPrefix <= 79; // DF / GO / MT / MS
    const isNordeste = destPrefix >= 40 && destPrefix <= 65; // BA / PE / CE etc.
    
    // Regras de Preço & Prazo
    let pacPrice = 24.90;
    let pacDays = 7;
    let sedexPrice = 38.50;
    let sedexDays = 3;
    let jadlogPrice = 29.90;
    let jadlogDays = 5;

    if (isSameCitySP) {
      pacPrice = 14.90;
      pacDays = 3;
      sedexPrice = 22.50;
      sedexDays = 1;
      jadlogPrice = 18.90;
      jadlogDays = 2;
    } else if (isStateSP) {
      pacPrice = 18.90;
      pacDays = 4;
      sedexPrice = 28.50;
      sedexDays = 2;
      jadlogPrice = 22.90;
      jadlogDays = 3;
    } else if (isSudeste) {
      pacPrice = 22.90;
      pacDays = 5;
      sedexPrice = 36.90;
      sedexDays = 2;
      jadlogPrice = 26.50;
      jadlogDays = 4;
    } else if (isSul) {
      pacPrice = 26.90;
      pacDays = 6;
      sedexPrice = 42.50;
      sedexDays = 3;
      jadlogPrice = 31.90;
      jadlogDays = 5;
    } else if (isCentroOeste) {
      pacPrice = 29.90;
      pacDays = 7;
      sedexPrice = 48.00;
      sedexDays = 3;
      jadlogPrice = 34.50;
      jadlogDays = 5;
    } else if (isNordeste) {
      pacPrice = 34.90;
      pacDays = 8;
      sedexPrice = 56.00;
      sedexDays = 4;
      jadlogPrice = 39.90;
      jadlogDays = 6;
    } else {
      // Norte e regiões remotas
      pacPrice = 42.90;
      pacDays = 10;
      sedexPrice = 68.00;
      sedexDays = 4;
      jadlogPrice = 49.90;
      jadlogDays = 8;
    }

    // Frete grátis para compras acima de R$ 250 no PAC
    if (declaredValue >= 250) {
      pacPrice = 0;
    }

    const options: ShippingOption[] = [
      {
        id: "pac",
        name: "PAC",
        company: "Correios",
        price: Number(pacPrice.toFixed(2)),
        delivery_time: pacDays,
        currency: "BRL",
        refrigerated: false,
      },
      {
        id: "sedex",
        name: "SEDEX Expresso",
        company: "Correios",
        price: Number(sedexPrice.toFixed(2)),
        delivery_time: sedexDays,
        currency: "BRL",
        refrigerated: false,
      },
      {
        id: "jadlog",
        name: "Jadlog Package",
        company: "Jadlog",
        price: Number(jadlogPrice.toFixed(2)),
        delivery_time: jadlogDays,
        currency: "BRL",
        refrigerated: false,
      },
    ];

    // Entrega Expressa Refrigerada Local para SP Capital e Região Metropolitana
    if (isSameCitySP || destPrefix === 6 || destPrefix === 7 || destPrefix === 8 || destPrefix === 9) {
      options.unshift({
        id: "pyr_express",
        name: "Expresso Crio-Pharma (Mesmo Dia)",
        company: "Planta y Raíz Frota Própria",
        price: 29.90,
        delivery_time: 1,
        currency: "BRL",
        refrigerated: true,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: "correios_jadlog_regional",
        origin_cep: originCep,
        destination_cep: destinationCep,
        weight_kg: weight,
        options,
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[shipping-quote] Internal error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro interno ao cotar frete" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
