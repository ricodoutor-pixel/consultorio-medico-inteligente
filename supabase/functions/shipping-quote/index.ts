// 📦 shipping-quote — Cotação de frete por CEP (Planta y Raiz)
// Body: { cep: string, subtotal?: number, weight_kg?: number, height_cm?, width_cm?, length_cm?, origin_cep? }
// Resposta: { cep, city, state, options: [{ carrier, service, price, days }] }
// Público (anon + autenticado): o carrinho cota o frete antes do login.
import { getCorsHeaders } from "../_shared/cors.ts";

const FREE_SHIPPING_THRESHOLD = 350;
const ORIGIN_CEP_DEFAULT = Deno.env.get("SHIPPING_ORIGIN_CEP") || "01310100";

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

const sanitizeCep = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(0, 8);
const round2 = (n: number) => Math.round(n * 100) / 100;

async function lookupCep(cep: string): Promise<{ city?: string; state?: string }> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!res.ok) return {};
    const data = await res.json();
    if (data?.erro) return {};
    return { city: data.localidade, state: data.uf };
  } catch {
    return {};
  }
}

/** Melhor Envio (opcional). Sem token configurado, cai no cálculo regional. */
async function quoteMelhorEnvio(params: {
  originCep: string;
  cep: string;
  weightKg: number;
  height: number;
  width: number;
  length: number;
  subtotal: number;
}) {
  const token = Deno.env.get("MELHOR_ENVIO_TOKEN");
  if (!token) return null;
  const base = Deno.env.get("MELHOR_ENVIO_API_URL") || "https://melhorenvio.com.br";
  try {
    const res = await fetch(`${base}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Planta y Raiz (contato@plantayraiz.com.br)",
      },
      body: JSON.stringify({
        from: { postal_code: params.originCep },
        to: { postal_code: params.cep },
        package: {
          weight: params.weightKg,
          height: params.height,
          width: params.width,
          length: params.length,
        },
        options: { insurance_value: params.subtotal, receipt: false, own_hand: false },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const options = data
      .filter((o: any) => o?.price && !o?.error)
      .map((o: any) => ({
        carrier: o.company?.name ?? "Transportadora",
        service: o.name ?? "Frete",
        price: round2(Number(o.price)),
        days: Number(o.delivery_time ?? o.custom_delivery_time ?? 7),
      }));
    return options.length ? options : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const cep = sanitizeCep(body.cep);
    if (cep.length !== 8) {
      return new Response(JSON.stringify({ error: "CEP inválido. Informe 8 dígitos." }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const subtotal = Number(body.subtotal ?? 0) || 0;
    const weightKg = Math.max(0.1, Number(body.weight_kg ?? 0.5) || 0.5);
    const height = Math.max(2, Number(body.height_cm ?? 10) || 10);
    const width = Math.max(11, Number(body.width_cm ?? 15) || 15);
    const length = Math.max(16, Number(body.length_cm ?? 20) || 20);
    const originCep = sanitizeCep(body.origin_cep) || ORIGIN_CEP_DEFAULT;

    const { city, state } = await lookupCep(cep);

    const real = await quoteMelhorEnvio({ originCep, cep, weightKg, height, width, length, subtotal });
    if (real) {
      return new Response(JSON.stringify({ cep, city, state, options: real, source: "carrier" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const region = (state && REGION_BY_STATE[state]) || "SE";
    const table = REGION_TABLE[region];
    const multiplier = Math.max(1, Math.ceil(weightKg / 0.5)) * 0.6 + 0.4;
    const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

    const options = [
      {
        carrier: "Correios",
        service: "PAC",
        price: freeShipping ? 0 : round2(table.pac[0] * multiplier),
        days: table.pac[1],
      },
      {
        carrier: "Correios",
        service: "SEDEX",
        price: round2(table.sedex[0] * multiplier),
        days: table.sedex[1],
      },
    ];

    return new Response(JSON.stringify({ cep, city, state, options, source: "regional" }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[shipping-quote]", err);
    return new Response(JSON.stringify({ error: "Falha ao cotar frete" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
