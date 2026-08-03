/**
 * Planta y Raiz — Tabela de Preços Universal (fonte única de verdade)
 * Decisão de produto (2026-08-03):
 *  - Serviços clínicos: Orientação Técnica R$30 · Retorno R$90 · Chat R$100 · Vídeo R$150
 *  - Apenas 3 planos universais, todos R$99/mês: Paciente, Médico e Lojista
 *  - Toda receita sai obrigatoriamente com assinatura digital (Gov.br, ICP-Brasil ou ClickSign).
 *    Médicos sem assinatura própria usam o serviço da plataforma incluso no plano.
 *  - Pagamento 100% Mercado Pago (PIX, cartão e boleto), com valor e produto personalizados.
 */

export type ServiceSku =
  | "orientacao_tecnica"
  | "retorno_consulta"
  | "consulta_chat"
  | "consulta_video";

export type PlanSku = "plano_paciente" | "plano_medico" | "plano_lojista";

export interface PricedItem {
  sku: ServiceSku | PlanSku;
  name: string;
  price: number;
  description: string;
  recurring?: boolean;
}

export const SERVICES: Record<ServiceSku, PricedItem> = {
  orientacao_tecnica: {
    sku: "orientacao_tecnica",
    name: "Orientação Técnica",
    price: 30,
    description: "Orientação técnica documentada com selo digital.",
  },
  retorno_consulta: {
    sku: "retorno_consulta",
    name: "Retorno",
    price: 90,
    description: "Retorno com o mesmo profissional, ajuste de conduta e renovação de receita.",
  },
  consulta_chat: {
    sku: "consulta_chat",
    name: "Consulta por Chat",
    price: 100,
    description: "Atendimento por chat com receita assinada digitalmente.",
  },
  consulta_video: {
    sku: "consulta_video",
    name: "Consulta por Vídeo",
    price: 150,
    description: "Consulta completa por vídeo, com receita e assinatura digital.",
  },
};

export const UNIVERSAL_PLAN_PRICE = 99;

export const UNIVERSAL_PLANS: PricedItem[] = [
  {
    sku: "plano_paciente",
    name: "Plano Paciente",
    price: UNIVERSAL_PLAN_PRICE,
    recurring: true,
    description: "Acompanhamento contínuo, descontos no Shopping e prioridade na triagem.",
  },
  {
    sku: "plano_medico",
    name: "Plano Médico",
    price: UNIVERSAL_PLAN_PRICE,
    recurring: true,
    description: "Taxa zero de intermediação e assinatura digital da plataforma inclusa.",
  },
  {
    sku: "plano_lojista",
    name: "Plano Lojista",
    price: UNIVERSAL_PLAN_PRICE,
    recurring: true,
    description: "Vitrine no Shopping, repasses automáticos e painel de vendas.",
  },
];

export const PLAN_FEATURES: Record<PlanSku, string[]> = {
  plano_paciente: [
    "Brisa IA 24h para triagem e dúvidas",
    "Prioridade na fila de atendimento",
    "Descontos no Shopping",
    "Renovação de receita facilitada",
    "Histórico clínico completo",
  ],
  plano_medico: [
    "Taxa de intermediação 0% — retenha 100%",
    "Assinatura digital da plataforma inclusa (para quem não tem Gov.br/ICP)",
    "Consultório virtual com vídeo e chat",
    "Prontuário e prescrição digital",
    "Repasses via Pix e painel financeiro",
  ],
  plano_lojista: [
    "Vitrine de produtos no Shopping",
    "Repasses automáticos via Mercado Pago",
    "Painel de vendas e estoque",
    "Selo de loja verificada",
    "Participação no programa de indicações",
  ],
};

/** Aviso obrigatório de compliance para prescrição. */
export const SIGNATURE_NOTICE =
  "Nenhuma receita é emitida sem assinatura digital válida (Gov.br, ICP-Brasil ou ClickSign).";

export const formatBRL = (v: number) =>
  `R$ ${v.toFixed(2).replace(".", ",").replace(/,00$/, "")}`;
