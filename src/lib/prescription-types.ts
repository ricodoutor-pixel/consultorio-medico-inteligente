/**
 * 💊 Tipos de receituário — Planta y Raiz
 * Base regulatória: Portaria SVS/MS 344/1998, RDC 660/2022 e RDC 327/2019.
 *
 *  • Receituário Simples          → produtos sem THC relevante (isento de retenção)
 *  • Receita de Controle Especial → 2 vias, THC até 0,2% (lista C1)
 *  • Notificação de Receita "B"   → THC acima de 0,2% (talonário azul físico retido)
 */

export type PrescriptionType = "simples" | "controle_especial_c1" | "notificacao_b";

export interface PrescriptionTypeMeta {
  value: PrescriptionType;
  label: string;
  shortLabel: string;
  copies: number;
  requiresPhysicalNotification: boolean;
  requiresDigitalSignature: boolean;
  description: string;
  legalBasis: string;
}

export const PRESCRIPTION_TYPES: PrescriptionTypeMeta[] = [
  {
    value: "simples",
    label: "Receituário Simples",
    shortLabel: "Simples",
    copies: 1,
    requiresPhysicalNotification: false,
    requiresDigitalSignature: true,
    description:
      "Para produtos de cannabis sem teor relevante de THC (predominância de CBD). Uma via, sem retenção.",
    legalBasis: "RDC 660/2022 · RDC 327/2019",
  },
  {
    value: "controle_especial_c1",
    label: "Receita de Controle Especial (C1) — 2 vias",
    shortLabel: "Controle Especial C1",
    copies: 2,
    requiresPhysicalNotification: false,
    requiresDigitalSignature: true,
    description:
      "Obrigatória para produtos de cannabis com THC até 0,2%. Emitida em duas vias (1ª via retida pela farmácia, 2ª via do paciente) com assinatura digital ICP-Brasil válida.",
    legalBasis: "Portaria SVS/MS 344/1998 — Lista C1",
  },
  {
    value: "notificacao_b",
    label: "Notificação de Receita B (talonário azul)",
    shortLabel: "Notificação B",
    copies: 2,
    requiresPhysicalNotification: true,
    requiresDigitalSignature: true,
    description:
      "Formulações com THC superior a 0,2% exigem Notificação de Receita B numerada, emitida em talonário físico e retida pela farmácia. O documento digital serve apenas como cópia de acompanhamento clínico.",
    legalBasis: "Portaria SVS/MS 344/1998 — Lista B1",
  },
];

export function getPrescriptionTypeMeta(type: PrescriptionType): PrescriptionTypeMeta {
  return PRESCRIPTION_TYPES.find((t) => t.value === type) ?? PRESCRIPTION_TYPES[0];
}

/** Sugere o tipo de receituário a partir do teor de THC declarado (% m/m). */
export function suggestPrescriptionType(thcPercentage: number): PrescriptionType {
  if (!Number.isFinite(thcPercentage) || thcPercentage <= 0) return "simples";
  if (thcPercentage <= 0.2) return "controle_especial_c1";
  return "notificacao_b";
}

/** Código público de verificação da receita (usado no QR Code). */
export function generateVerificationCode(): string {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `PYR-${raw.slice(0, 12).toUpperCase()}`;
}

/** URL pública de verificação (exibida no QR Code e no rodapé do PDF). */
export function buildVerificationUrl(verificationCode: string): string {
  return `https://www.plantayraiz.com.br/verificar-receita?c=${encodeURIComponent(verificationCode)}`;
}
