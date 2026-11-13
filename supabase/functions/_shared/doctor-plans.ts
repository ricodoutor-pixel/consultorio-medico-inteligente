/**
 * Planos de assinatura do médico — fonte única para servidor (limites, fila, ferramentas exclusivas,
 * cobrança) e telas. Funções puras (sem Deno) para o vitest e o frontend.
 *
 * Tudo que um plano promete aqui é aplicado no servidor:
 *  - limites diários das ferramentas de IA (doctor-kit-access);
 *  - ordem de prioridade na fila de consultas (consultation-queue: planos maiores recebem a oferta antes);
 *  - ferramentas exclusivas (doctor-pro-tools: liberadas a partir do plano indicado).
 */
export type DoctorPlanKey = "free" | "premium" | "ouro" | "platina" | "diamante" | "elite" | "black";
export type DoctorProTool = "interacoes" | "laudo_anvisa" | "resumo_paciente" | "conteudo_etico" | "plano_terapeutico";

export interface DoctorPlan {
  key: DoctorPlanKey;
  name: string;
  /** SKU em payment_services (null = gratuito) */
  sku: string | null;
  priceBrl: number;
  /** 0 = sem prioridade; quanto maior, antes recebe a oferta de consulta entre os assinantes */
  queueRank: number;
  limits: { copiloto: number; juridico: number; escriba: number; pro: number };
  tagline: string;
}

export const DOCTOR_PLANS: DoctorPlan[] = [
  {
    key: "free", name: "Gratuito", sku: null, priceBrl: 0, queueRank: 0,
    limits: { copiloto: 10, juridico: 0, escriba: 6, pro: 0 },
    tagline: "Consultório Virtual completo; recebe consultas depois dos assinantes.",
  },
  {
    key: "premium", name: "Premium", sku: "plano_medico", priceBrl: 99, queueRank: 1,
    limits: { copiloto: 100, juridico: 10, escriba: 150, pro: 0 },
    tagline: "Kit do Assinante: copiloto, assistente jurídico e escriba com prioridade na fila.",
  },
  {
    key: "ouro", name: "Ouro", sku: "plano_medico_ouro", priceBrl: 199, queueRank: 2,
    limits: { copiloto: 150, juridico: 20, escriba: 200, pro: 20 },
    tagline: "Checagem de interações medicamentosas com canabinoides.",
  },
  {
    key: "platina", name: "Platina", sku: "plano_medico_platina", priceBrl: 349, queueRank: 3,
    limits: { copiloto: 200, juridico: 35, escriba: 300, pro: 40 },
    tagline: "Rascunho de laudo para importação/ANVISA (RDC 660) em segundos.",
  },
  {
    key: "diamante", name: "Diamante", sku: "plano_medico_diamante", priceBrl: 599, queueRank: 4,
    limits: { copiloto: 300, juridico: 50, escriba: 400, pro: 60 },
    tagline: "Resumo clínico pré-consulta a partir de histórico e exames.",
  },
  {
    key: "elite", name: "Elite", sku: "plano_medico_elite", priceBrl: 999, queueRank: 5,
    limits: { copiloto: 500, juridico: 80, escriba: 600, pro: 100 },
    tagline: "Conteúdo educativo para redes dentro das regras de publicidade do CFM.",
  },
  {
    key: "black", name: "Black", sku: "plano_medico_black", priceBrl: 1500, queueRank: 6,
    limits: { copiloto: 1000, juridico: 150, escriba: 1000, pro: 200 },
    tagline: "Plano terapêutico estruturado e os maiores limites, com prioridade máxima na fila.",
  },
];

/** Ferramenta exclusiva → plano mínimo que a libera. */
export const DOCTOR_PRO_TOOLS: Record<DoctorProTool, { minPlan: DoctorPlanKey; title: string; description: string }> = {
  interacoes: {
    minPlan: "ouro",
    title: "Interações medicamentosas",
    description: "Confere interações entre os medicamentos do paciente e canabinoides (CBD/THC), com nível de risco e conduta.",
  },
  laudo_anvisa: {
    minPlan: "platina",
    title: "Laudo para importação/ANVISA",
    description: "Monta o rascunho do relatório médico exigido para importação de produto de cannabis (RDC 660/2022).",
  },
  resumo_paciente: {
    minPlan: "diamante",
    title: "Resumo clínico pré-consulta",
    description: "Transforma histórico, exames e anotações colados em um resumo objetivo com alertas.",
  },
  conteudo_etico: {
    minPlan: "elite",
    title: "Conteúdo educativo ético",
    description: "Gera posts educativos para redes sociais dentro da Resolução CFM 2.336/2023 (sem promessas de resultado).",
  },
  plano_terapeutico: {
    minPlan: "black",
    title: "Plano terapêutico estruturado",
    description: "Propõe titulação, metas, reavaliações e critérios de suspensão para o tratamento canabinoide.",
  },
};

/** Nomes antigos gravados em doctors.plan_tier que equivalem ao Premium (R$ 99). */
const LEGACY_PREMIUM = ["vip", "vip_prescritor", "premium", "basic", "assinante", "pro", "plano_medico", "professional", "standard"];

export function normalizeDoctorPlan(planTier: string | null | undefined): DoctorPlanKey {
  const t = String(planTier ?? "").trim().toLowerCase();
  if (!t || t === "free") return "free";
  if (t === "enterprise") return "elite";
  const direct = DOCTOR_PLANS.find((p) => p.key === t);
  if (direct) return direct.key;
  if (LEGACY_PREMIUM.includes(t)) return "premium";
  return "free";
}

export function doctorPlan(planTier: string | null | undefined): DoctorPlan {
  const key = normalizeDoctorPlan(planTier);
  return DOCTOR_PLANS.find((p) => p.key === key)!;
}

export function doctorPlanBySku(sku: string | null | undefined): DoctorPlan | null {
  return DOCTOR_PLANS.find((p) => p.sku !== null && p.sku === sku) ?? null;
}

export function planRank(planTier: string | null | undefined): number {
  return doctorPlan(planTier).queueRank;
}

export function canUseProTool(planTier: string | null | undefined, tool: DoctorProTool): boolean {
  return planRank(planTier) >= doctorPlan(DOCTOR_PRO_TOOLS[tool].minPlan).queueRank;
}

/** Ferramentas exclusivas liberadas no plano (cumulativas: cada plano leva as dos anteriores). */
export function proToolsForPlan(planTier: string | null | undefined): DoctorProTool[] {
  return (Object.keys(DOCTOR_PRO_TOOLS) as DoctorProTool[]).filter((t) => canUseProTool(planTier, t));
}

export const DOCTOR_PLAN_SKUS: string[] = DOCTOR_PLANS.filter((p) => p.sku).map((p) => p.sku as string);
