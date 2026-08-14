import { supabase } from "@/integrations/supabase/client";

export const KYC_BUCKET = "doctor-kyc-documents";

export type KycKind =
  | "crm_front"
  | "crm_back"
  | "id_front"
  | "id_back"
  | "cpf_doc"
  | "address_proof"
  | "selfie";

export const KYC_LABELS: Record<KycKind, string> = {
  crm_front: "CRM — Frente",
  crm_back: "CRM — Verso",
  id_front: "RG / CNH — Frente",
  id_back: "RG / CNH — Verso",
  cpf_doc: "Documento do CPF",
  address_proof: "Comprovante de endereço (CEP)",
  selfie: "Selfie de conferência",
};

/** Documentos obrigatórios para liberar o card médico */
export const KYC_REQUIRED: KycKind[] = [
  "crm_front",
  "crm_back",
  "id_front",
  "cpf_doc",
  "address_proof",
];

/**
 * Gera uma URL assinada (bucket privado) para o documento anexado no cadastro.
 * Aceita o storage_path registrado em doctor_kyc_documents; se ausente,
 * tenta as extensões usuais dentro da pasta do próprio médico.
 */
export async function getKycSignedUrl(
  userId: string,
  kind: KycKind,
  storagePath?: string | null,
): Promise<string | null> {
  const candidates = storagePath
    ? [storagePath]
    : ["jpg", "jpeg", "png", "webp", "pdf"].map((ext) => `${userId}/${kind}.${ext}`);

  for (const path of candidates) {
    const { data, error } = await supabase.storage
      .from(KYC_BUCKET)
      .createSignedUrl(path, 60 * 10);
    if (!error && data?.signedUrl) return data.signedUrl;
  }
  return null;
}
