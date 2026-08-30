import { supabase } from "@/integrations/supabase/client";

export const PHARMACY_PUBLIC_BUCKET = "avatars";
export const PHARMACY_KYC_BUCKET_ID = "pharmacy-kyc-documents";

export interface PharmacyOption {
  id: string;
  nome_fantasia: string;
  logo_url: string | null;
  cidade?: string | null;
}

export interface DispatchPayload {
  vendorId: string;
  patientId: string;
  patientName: string;
  patientWhatsapp?: string | null;
  prescriptionId?: string | null;
  prescriptionPdfUrl: string;
  regulatoryHash: string;
  orderId?: string | null;
  deliveryAddress?: Record<string, unknown> | null;
  dispatchMode: "automatic_1click" | "manual_upload";
}

/** Farmácias homologadas (KYC aprovado) disponíveis para receber receitas */
export async function listApprovedPharmacies(): Promise<PharmacyOption[]> {
  const { data, error } = await (supabase as any)
    .from("vendors")
    .select("id, nome_fantasia, store_name, logo_url, store_logo_url, endereco_completo")
    .eq("is_kyc_approved", true)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((v: any) => ({
    id: v.id,
    nome_fantasia: v.nome_fantasia || v.store_name || "Farmácia Parceira",
    logo_url: v.logo_url || v.store_logo_url || null,
    cidade: v.endereco_completo?.cidade ?? null,
  }));
}

/** Envia a receita assinada para a caixa de entrada da farmácia escolhida */
export async function dispatchPrescriptionToPharmacy(payload: DispatchPayload) {
  const row = {
    vendor_id: payload.vendorId,
    patient_id: payload.patientId,
    patient_name: payload.patientName,
    patient_whatsapp: payload.patientWhatsapp ?? null,
    prescription_id: payload.prescriptionId ?? null,
    prescription_pdf_url: payload.prescriptionPdfUrl,
    regulatory_hash: payload.regulatoryHash,
    order_id: payload.orderId ?? null,
    delivery_address: payload.deliveryAddress ?? null,
    dispatch_mode: payload.dispatchMode,
    status: "recebida",
  };

  const { data, error } = await (supabase as any)
    .from("pharmacy_prescriptions_inbox")
    .insert(row)
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

/** Faz upload de um PDF de receita externo enviado pelo próprio paciente */
export async function uploadPatientPrescriptionPdf(userId: string, file: File) {
  const path = `${userId}/receita-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from("prescriptions").upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = await supabase.storage.from("prescriptions").createSignedUrl(path, 60 * 60 * 24 * 7);
  return { path, url: data?.signedUrl || path };
}

/** Hash regulatório local (fallback quando a receita não possui hash ICP-Brasil) */
export async function computeRegulatoryHash(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-512", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
