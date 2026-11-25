// Regras puras do checkout expresso (sem login), compartilhadas com os testes.

export const EXPRESS_TERMS_VERSION = "2026-11-25";
export const EXPRESS_PRODUCTS = ["orientacao_tecnica", "consulta_chat", "consulta_video", "consulta_premium", "retorno_consulta"] as const;
export type ExpressProduct = typeof EXPRESS_PRODUCTS[number];

export const onlyDigits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export function isValidCpf(value: unknown): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

/** WhatsApp em E.164 sem "+": DDI 55 por padrão para números brasileiros de 10/11 dígitos. */
export function normalizeWhatsapp(value: unknown): string | null {
  let d = onlyDigits(value);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d.length >= 12 && d.length <= 15 ? d : null;
}

export const isValidEmail = (v: unknown) =>
  /^[^\s@]{1,64}@[^\s@]{1,190}\.[A-Za-z]{2,24}$/.test(String(v ?? "").trim());

export interface ExpressInput {
  full_name: string;
  whatsapp: string;
  cpf: string;
  email: string;
  product: ExpressProduct;
  accepted: { terms: boolean; privacy: boolean; telemedicine: boolean };
}

/** Valida e normaliza o formulário; devolve o motivo em português quando algo falta. */
export function validateExpressInput(body: any): { ok: true; value: ExpressInput } | { ok: false; error: string } {
  const full_name = String(body?.full_name ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (full_name.split(" ").filter(Boolean).length < 2) return { ok: false, error: "Informe nome e sobrenome." };
  const whatsapp = normalizeWhatsapp(body?.whatsapp);
  if (!whatsapp) return { ok: false, error: "WhatsApp inválido." };
  if (!isValidCpf(body?.cpf)) return { ok: false, error: "CPF inválido." };
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, error: "E-mail inválido." };
  const product = String(body?.product ?? "orientacao_tecnica") as ExpressProduct;
  if (!EXPRESS_PRODUCTS.includes(product)) return { ok: false, error: "Produto inválido." };
  const a = body?.accepted ?? {};
  if (a.terms !== true || a.privacy !== true || a.telemedicine !== true) {
    return { ok: false, error: "É preciso aceitar os Termos, a Política de Privacidade e o Termo de Telemedicina." };
  }
  return {
    ok: true,
    value: { full_name, whatsapp, cpf: onlyDigits(body.cpf), email, product, accepted: { terms: true, privacy: true, telemedicine: true } },
  };
}
