import { FALLBACK_SERVICES, resolveConsultationSku, type PaymentService } from "./payment-catalog.ts";

/** Fixed clinical prices are enforced on the server from the single payment_services catalog, never from request amounts. */
export function fixedConsultationPrice(
  typeOrSku: string | null | undefined,
  catalog: Record<string, PaymentService> = FALLBACK_SERVICES,
): number | null {
  const sku = resolveConsultationSku(typeOrSku);
  if (!sku) return null;
  if (sku === "consulta_premium") return null; // Premium allows doctor custom price (validated separately, default 180)
  return catalog[sku]?.amount_brl ?? FALLBACK_SERVICES[sku]?.amount_brl ?? null;
}

export function expectedConsultationPrice(
  typeOrSku: string | null | undefined,
  doctorCustomPremiumPrice?: number | null,
  catalog: Record<string, PaymentService> = FALLBACK_SERVICES,
): number | null {
  const sku = resolveConsultationSku(typeOrSku);
  if (!sku) return null;
  if (sku === "consulta_premium") {
    const custom = Number(doctorCustomPremiumPrice || 0);
    if (custom >= 100 && custom <= 2000) return Math.round(custom * 100) / 100;
  }
  return catalog[sku]?.amount_brl ?? FALLBACK_SERVICES[sku]?.amount_brl ?? null;
}

export interface ConsultationValidationInput {
  paymentStatus?: string | null;
  appointmentStatus?: string | null;
  appointmentDoctorId?: string | null;
  requestedDoctorId?: string | null;
  appointmentAmount?: number | null;
  requestedAmount?: number | null;
  expectedAmount: number | null;
}

export type ConsultationValidationResult =
  | { ok: true; amount: number; reason?: undefined; error?: undefined; status?: undefined }
  | {
      ok: false;
      reason: "duplicate_payment" | "wrong_doctor" | "price_mismatch" | "invalid_service";
      status: number;
      error: string;
    };

/** Bloqueia pagamento duplicado, médico divergente ou valor diferente do da tabela única. */
export function validateConsultationPaymentGuard(input: ConsultationValidationInput): ConsultationValidationResult {
  if (!input.expectedAmount || !(input.expectedAmount > 0)) {
    return {
      ok: false,
      reason: "invalid_service",
      status: 400,
      error: "Serviço de consulta inválido na tabela de preços.",
    };
  }
  if (
    input.paymentStatus === "paid" ||
    input.appointmentStatus === "in_progress" ||
    input.appointmentStatus === "completed"
  ) {
    return {
      ok: false,
      reason: "duplicate_payment",
      status: 409,
      error: "Pagamento duplicado bloqueado: esta consulta já consta como paga.",
    };
  }
  if (
    input.requestedDoctorId &&
    input.appointmentDoctorId &&
    input.requestedDoctorId !== input.appointmentDoctorId
  ) {
    return {
      ok: false,
      reason: "wrong_doctor",
      status: 400,
      error: "Médico divergente do pedido registrado. Operação bloqueada.",
    };
  }
  if (
    input.requestedAmount !== undefined &&
    input.requestedAmount !== null &&
    Math.abs(Number(input.requestedAmount) - input.expectedAmount) > 0.009
  ) {
    return {
      ok: false,
      reason: "price_mismatch",
      status: 400,
      error: `Valor divergente da tabela oficial de serviços (esperado R$ ${input.expectedAmount}).`,
    };
  }
  if (
    input.appointmentAmount !== undefined &&
    input.appointmentAmount !== null &&
    Number(input.appointmentAmount) > 0 &&
    Math.abs(Number(input.appointmentAmount) - input.expectedAmount) > 0.009
  ) {
    return {
      ok: false,
      reason: "price_mismatch",
      status: 400,
      error: `Valor registrado (R$ ${input.appointmentAmount}) difere da tabela oficial (R$ ${input.expectedAmount}).`,
    };
  }
  return { ok: true, amount: input.expectedAmount };
}