import { supabase } from "@/integrations/supabase/client";
import { professionals } from "@/data/professionals";
import { resolveRoutingDoctor } from "@/lib/consultation-routing";
import {
  FALLBACK_SERVICES,
  formatPaymentName,
  normalizeReceiverName,
  OFFICIAL_RECEIVER_NAME,
  resolveConsultationSku,
} from "../../supabase/functions/_shared/payment-catalog";
import {
  expectedConsultationPrice,
  validateConsultationPaymentGuard,
} from "../../supabase/functions/_shared/consultation-price";

export type ConsultationMode = "video" | "chat" | "retorno" | "premium";
export type ConsultationSku =
  | "consulta_video"
  | "consulta_chat"
  | "retorno_consulta"
  | "consulta_premium";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function consultationModeFromSku(skuOrMode?: string | null): ConsultationMode {
  const sku = resolveConsultationSku(skuOrMode);
  if (sku === "consulta_chat") return "chat";
  if (sku === "retorno_consulta") return "retorno";
  if (sku === "consulta_premium") return "premium";
  return "video";
}

export function consultationSkuFromMode(modeOrSku: string): ConsultationSku {
  return (resolveConsultationSku(modeOrSku) as ConsultationSku) || "consulta_video";
}

export function consultationCatalogItem(modeOrSku: string, customPremiumPrice?: number | null) {
  const sku = consultationSkuFromMode(modeOrSku);
  const entry = FALLBACK_SERVICES[sku] || FALLBACK_SERVICES.consulta_video;
  const price = expectedConsultationPrice(sku, customPremiumPrice, FALLBACK_SERVICES) ?? entry.amount_brl;
  return {
    sku,
    mode: consultationModeFromSku(sku),
    displayName: formatPaymentName(entry.display_name),
    shortName: entry.display_name.replace(/\s*—\s*Planta y Raiz$/i, "").trim(),
    price,
    descriptor: entry.descriptor,
  };
}

/** Resolve o UUID real do médico (a partir de UUID direto ou identificador da vitrine). */
export async function resolveConsultationDoctorUuid(doctorOrProId?: string | null): Promise<string | null> {
  if (!doctorOrProId) return null;
  const raw = doctorOrProId.trim();
  if (UUID_RE.test(raw)) return raw;

  const local = professionals.find(
    (p) => p.id === raw || p.dbId === raw || (p.dbId && `db-${p.dbId}` === raw),
  );
  if (local?.dbId && UUID_RE.test(local.dbId)) return local.dbId;

  const crmDigits = String(local?.crm || raw).match(/\d{3,}/)?.[0];
  if (crmDigits) {
    try {
      const { data } = await supabase
        .from("doctors_public")
        .select("id, crm")
        .ilike("crm", `%${crmDigits}%`)
        .limit(1);
      const foundId = Array.isArray(data) ? data[0]?.id : (data as any)?.id;
      if (foundId && UUID_RE.test(String(foundId))) return String(foundId);
    } catch {
      // ignore lookup error and fallback below
    }
  }
  return null;
}

export async function createConsultationCheckout(
  modeOrSku: ConsultationMode | ConsultationSku,
  triageId: string,
  existingId?: string | null,
  chosenDoctorId?: string | null,
  options?: {
    customPremiumPrice?: number | null;
    paymentMethod?: "pix" | "card";
    returnUrl?: string;
    requestedAmount?: number | null;
  },
) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error("Entre na sua conta para pagar a consulta.");

  const catalogInfo = consultationCatalogItem(modeOrSku, options?.customPremiumPrice);
  const sku = catalogInfo.sku;
  const mode = catalogInfo.mode;
  // Para o banco (appointments.type), mantém compatibilidade com 'video'/'chat' ou modalidade específica.
  const dbType = mode === "retorno" ? "retorno" : mode === "premium" ? "premium" : mode;

  const resolvedChosenDoctor = await resolveConsultationDoctorUuid(chosenDoctorId);
  let appointmentId = existingId || null;

  // Se já existe um appointmentId, confere duplicidade, médico e valor antes de chamar o provedor.
  if (appointmentId) {
    try {
      const q = supabase
        .from("appointments")
        .select("id, payment_status, status, doctor_id, amount, type")
        .eq("id", appointmentId)
        .eq("patient_id", user.id);
      const { data: existingAppt } = await (q.maybeSingle ? q.maybeSingle() : Promise.resolve({ data: null }));
      if (existingAppt) {
        const guard = validateConsultationPaymentGuard({
          paymentStatus: (existingAppt as any).payment_status,
          appointmentStatus: (existingAppt as any).status,
          appointmentDoctorId: (existingAppt as any).doctor_id,
          requestedDoctorId: resolvedChosenDoctor,
          appointmentAmount: (existingAppt as any).amount !== undefined ? Number((existingAppt as any).amount) : null,
          requestedAmount: options?.requestedAmount ?? null,
          expectedAmount: catalogInfo.price,
        });
        if (!guard.ok) {
          throw new Error(guard.error);
        }
      }
    } catch (e) {
      if (
        e instanceof Error &&
        /Pagamento duplicado|Médico divergente|Valor divergente|Valor registrado/i.test(e.message)
      ) {
        throw e;
      }
    }
  } else {
    // Valida se um valor diferente da tabela única foi forçado na chamada
    const preGuard = validateConsultationPaymentGuard({
      requestedAmount: options?.requestedAmount ?? null,
      expectedAmount: catalogInfo.price,
    });
    if (!preGuard.ok) throw new Error(preGuard.error);

    // Médico escolhido no cartão tem prioridade; sem escolha, o servidor indica um cadastro real.
    const doctorId = resolvedChosenDoctor || (await resolveRoutingDoctor())?.doctor_id;
    if (!doctorId) throw new Error("Não há médico disponível para receber a consulta. Tente novamente mais tarde.");

    // Cria apenas o pedido pendente de pagamento — NENHUM médico é avisado nesta etapa (Etapa A).
    // O aviso ao médico sai exclusivamente na Etapa B, após o pagamento ser reconhecido pelo sistema.
    const { data, error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      doctor_id: doctorId,
      scheduled_at: new Date().toISOString(),
      type: dbType,
      amount: catalogInfo.price,
      status: "scheduled",
      payment_status: "pending",
      notes: triageId ? `Triagem: ${triageId}` : "Triagem: pendente (após pagamento)",
    }).select("id").single();
    if (error || !data?.id) throw new Error("Não foi possível registrar a consulta.");
    appointmentId = data.id;
    // Save before requesting checkout: failures remain pending and can be retried.
    try {
      sessionStorage.setItem("telemedicine_pending_checkout", JSON.stringify({ appointmentId, mode, sku, triageId }));
    } catch {
      // sessionStorage may not exist in test environments
    }
  }

  const paymentMethod = options?.paymentMethod ?? "pix";

  // Pix gerado dentro da plataforma (mesmo caminho da Orientação Técnica) — o paciente não sai do site.
  const { data, error } = await supabase.functions.invoke("mp-checkout", {
    body: {
      appointmentId,
      sku,
      triageId,
      payment_method: paymentMethod,
      ...(resolvedChosenDoctor ? { doctorId: resolvedChosenDoctor } : {}),
      ...(options?.returnUrl ? { returnUrl: options.returnUrl } : {}),
      ...(options?.requestedAmount !== undefined && options?.requestedAmount !== null
        ? { amount: options.requestedAmount }
        : {}),
    },
  });

  if (paymentMethod === "card") {
    if (error || !data?.init_point) {
      throw new Error(data?.error || "Não foi possível abrir o pagamento por cartão agora. Tente de novo ou pague com Pix na tela.");
    }
    return {
      appointmentId: appointmentId as string,
      pix: null,
      initPoint: String(data.init_point),
    };
  }

  if (error || data?.error || !data?.qr_code || !data?.qr_code_base64) {
    throw new Error(
      data?.error ||
        "Não foi possível gerar o Pix. Sua consulta continua aguardando pagamento. Tente de novo.",
    );
  }
  return {
    appointmentId: appointmentId as string,
    initPoint: null,
    pix: {
      payment_id: data.payment_id ? String(data.payment_id) : undefined,
      external_reference: data.external_reference ? String(data.external_reference) : `appointment:${appointmentId}`,
      qr_code: String(data.qr_code),
      qr_code_base64: String(data.qr_code_base64),
      description: formatPaymentName(typeof data.description === "string" ? data.description : catalogInfo.displayName),
      amount: Number(data.amount ?? catalogInfo.price),
      receiver_name: normalizeReceiverName(data.receiver_name || OFFICIAL_RECEIVER_NAME),
    },
  };
}

export type ConsultationPix = NonNullable<Awaited<ReturnType<typeof createConsultationCheckout>>["pix"]>;

export async function isConsultationPaid(appointmentId: string): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return false;
  const { data, error } = await supabase.from("appointments")
    .select("payment_status")
    .eq("id", appointmentId)
    .eq("patient_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível conferir o pagamento. Tente novamente.");
  return data?.payment_status === "paid";
}