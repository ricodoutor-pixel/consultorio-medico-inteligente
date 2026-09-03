/**
 * 📦 Cotação de frete por CEP — Planta y Raiz
 *
 * Estratégia:
 *  1. Tenta a Edge Function `shipping-quote` (integração Melhor Envio/Correios com token no servidor).
 *  2. Fallback determinístico por região (ViaCEP → UF) para nunca travar o checkout.
 *
 * O valor integral do frete é repassado à farmácia responsável pela dispensação.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ShippingOption {
  carrier: string;
  service: string;
  price: number;
  days: number;
}

export interface ShippingQuote {
  cep: string;
  city?: string;
  state?: string;
  options: ShippingOption[];
  source: "api" | "fallback";
}

export function sanitizeCep(cep: string): string {
  return (cep || "").replace(/\D/g, "").slice(0, 8);
}

export function isValidCep(cep: string): boolean {
  return sanitizeCep(cep).length === 8;
}

export function formatCep(cep: string): string {
  const c = sanitizeCep(cep);
  return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
}

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

export async function quoteShipping(
  rawCep: string,
  subtotal: number,
  weightKg = 0.5,
): Promise<ShippingQuote> {
  const cep = sanitizeCep(rawCep);
  if (!isValidCep(cep)) throw new Error("CEP inválido. Informe 8 dígitos.");

  // 1) Integração real (token protegido no servidor)
  try {
    const { data, error } = await supabase.functions.invoke("shipping-quote", {
      body: { cep, subtotal, weight_kg: weightKg },
    });
    if (!error && Array.isArray(data?.options) && data.options.length > 0) {
      return {
        cep,
        city: data.city,
        state: data.state,
        options: data.options as ShippingOption[],
        source: "api",
      };
    }
  } catch {
    /* segue para o fallback */
  }

  // 2) Fallback determinístico por região
  const { city, state } = await lookupCep(cep);
  const region = (state && REGION_BY_STATE[state]) || "SE";
  const table = REGION_TABLE[region];
  const multiplier = Math.max(1, Math.ceil(weightKg / 0.5)) * 0.6 + 0.4;
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const options: ShippingOption[] = [
    {
      carrier: "Correios",
      service: "PAC",
      price: freeShipping ? 0 : Math.round(table.pac[0] * multiplier * 100) / 100,
      days: table.pac[1],
    },
    {
      carrier: "Correios",
      service: "SEDEX",
      price: Math.round(table.sedex[0] * multiplier * 100) / 100,
      days: table.sedex[1],
    },
  ];

  return { cep, city, state, options, source: "fallback" };
}
