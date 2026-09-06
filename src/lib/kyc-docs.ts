import { supabase } from "@/integrations/supabase/client";

export const KYC_BUCKET = "doctor-kyc-documents";

export type KycKind =
  | "crm_front"
  | "crm_back"
  | "id_front"
  | "id_back"
  | "cpf_doc"
  | "address_proof"
  | "selfie"
  | "cfm_print"
  | "icp_brasil"
  | "passport_signature"
  | "stay_stamp"
  | "intl_license";

export const KYC_LABELS: Record<KycKind, string> = {
  crm_front: "CRM / Registro — Frente",
  crm_back: "CRM / Registro — Verso",
  id_front: "RG / CNH / ID — Frente",
  id_back: "RG / CNH / ID — Verso",
  cpf_doc: "Documento do CPF / Tax ID",
  address_proof: "Comprovante de endereço (CEP/Zip)",
  selfie: "Selfie de conferência",
  cfm_print: "CONF CRM / Conselho",
  icp_brasil: "Assinatura Digital (ICP-Brasil / Certificado)",
  passport_signature: "Passaporte (Foto e Assinatura)",
  stay_stamp: "Carimbo de Permanência / Visto / Licença",
  intl_license: "Licença Médica Internacional",
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

/**
 * Fotos de perfil antigas foram salvas como data:URI (base64) dentro do banco.
 * Elas não vêm na listagem admin (para não pesar a página) e são buscadas
 * sob demanda, uma única vez por sessão, apenas para os médicos afetados.
 */
const inlineAvatarCache = new Map<string, string | null>();

export async function fetchInlineAvatar(userId: string): Promise<string | null> {
  if (inlineAvatarCache.has(userId)) return inlineAvatarCache.get(userId) ?? null;
  const { data, error } = await (supabase.rpc as any)("admin_doctor_inline_avatar", { _id: userId });
  const url = error ? null : ((data as string | null) ?? null);
  inlineAvatarCache.set(userId, url);
  return url;
}
