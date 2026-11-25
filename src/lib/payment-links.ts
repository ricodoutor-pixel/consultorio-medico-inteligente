import { SERVICES, type ServiceSku } from "@/lib/pricing";

/** Links curtos de pagamento para WhatsApp. Só redirecionam para os checkouts oficiais;
 *  preço, pagamento e liberação continuam no servidor. */
export const PAYMENT_LINK_PRODUCTS = {
  "orientacao-tecnica": "orientacao_tecnica",
  triagem: "orientacao_tecnica",
  "consulta-chat": "consulta_chat",
  "consulta-video": "consulta_video",
  retorno: "retorno_consulta",
} as const satisfies Record<string, ServiceSku>;

export type PaymentLinkSlug = keyof typeof PAYMENT_LINK_PRODUCTS;
export const PUBLIC_ORIGIN = "https://www.plantayraiz.com.br";

const SAFE = /^[A-Za-z0-9_-]{1,64}$/;
const KEEP = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

export function isPaymentLinkSlug(s: string | undefined): s is PaymentLinkSlug {
  return !!s && Object.prototype.hasOwnProperty.call(PAYMENT_LINK_PRODUCTS, s);
}

/** Destino interno do link curto, preservando campanha, indicação e médico escolhido. */
export function resolvePaymentLink(slug: string | undefined, search: string): string {
  if (!isPaymentLinkSlug(slug)) return "/orientacao-tecnica";
  const sku = PAYMENT_LINK_PRODUCTS[slug];
  const input = new URLSearchParams(search);
  const out = new URLSearchParams();
  for (const k of KEEP) {
    const v = input.get(k);
    if (v && SAFE.test(v)) out.set(k, v);
  }
  const ref = input.get("ref");
  if (ref && SAFE.test(ref)) out.set("indicacao", ref);
  out.set("origem", "whatsapp_link");
  if (sku === "orientacao_tecnica") {
    return `/orientacao-tecnica?${out.toString()}`;
  }
  const pro = input.get("pro");
  if (pro && SAFE.test(pro)) out.set("pro", pro);
  return `/consulta/${sku}?${out.toString()}`;
}

export function buildPaymentLink(slug: PaymentLinkSlug, opts: { campaign?: string; ref?: string; pro?: string } = {}) {
  const p = new URLSearchParams({ utm_source: "whatsapp" });
  if (opts.campaign && SAFE.test(opts.campaign)) p.set("utm_campaign", opts.campaign);
  if (opts.ref && SAFE.test(opts.ref)) p.set("ref", opts.ref);
  if (opts.pro && SAFE.test(opts.pro) && slug !== "orientacao-tecnica" && slug !== "triagem") p.set("pro", opts.pro);
  return `${PUBLIC_ORIGIN}/pagar/${slug}?${p.toString()}`;
}

export function paymentLinkMessage(slug: PaymentLinkSlug, link: string) {
  const item = SERVICES[PAYMENT_LINK_PRODUCTS[slug]];
  const price = item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return `Olá! Aqui é a Enfª Brisa, assistente virtual da Planta y Raiz. Para ${item.name} (${price}), é só clicar e pagar com Pix ou cartão: ${link}. Depois do pagamento confirmado você segue para o atendimento. A indicação de qualquer tratamento depende de avaliação médica individual.`;
}

const ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "origem", "indicacao", "pro"];
/** Origem do link (campanha, indicação, médico) lida da página atual, só com valores seguros. */
export function readAttribution(search: string): Record<string, string> {
  const p = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const k of ATTR_KEYS) {
    const v = p.get(k);
    if (v && SAFE.test(v)) out[k] = v;
  }
  return out;
}
