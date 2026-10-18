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
  | "intl_license"
  | "vip_receipt";

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
  vip_receipt: "Comprovante de Assinatura — Plano VIP Mensal",
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
  if (storagePath && (storagePath.startsWith("/") || storagePath.startsWith("http"))) {
    return storagePath;
  }

  // Lista de extensões suportadas
  const exts = ["jpeg", "jpg", "png", "webp", "pdf"];

  // 1. Monta lista ordenada de candidatos sem duplicidades
  const candidates: string[] = [];
  if (storagePath) candidates.push(storagePath);

  // Caminhos padrão para este tipo específico de documento
  for (const ext of exts) {
    const p = `${userId}/${kind}.${ext}`;
    if (!candidates.includes(p)) candidates.push(p);
  }

  // Fallbacks cruzados: muitos médicos enviam sua cédula profissional (CRM) como ID ou vice-versa
  if (kind === "crm_front") {
    for (const ext of exts) {
      const p = `${userId}/id_front.${ext}`;
      if (!candidates.includes(p)) candidates.push(p);
    }
  } else if (kind === "crm_back") {
    for (const ext of exts) {
      const p = `${userId}/id_back.${ext}`;
      if (!candidates.includes(p)) candidates.push(p);
    }
  } else if (kind === "id_front") {
    for (const ext of exts) {
      const p = `${userId}/crm_front.${ext}`;
      if (!candidates.includes(p)) candidates.push(p);
    }
  } else if (kind === "id_back") {
    for (const ext of exts) {
      const p = `${userId}/crm_back.${ext}`;
      if (!candidates.includes(p)) candidates.push(p);
    }
  }

  // Tenta assinar no bucket doctor-kyc-documents
  for (const path of candidates) {
    try {
      const { data, error } = await supabase.storage
        .from(KYC_BUCKET)
        .createSignedUrl(path, 60 * 10);
      if (!error && data?.signedUrl) return data.signedUrl;
    } catch {}
  }

  // Fallback no bucket avatars se for crm_front ou id_front
  if (kind === "crm_front" || kind === "id_front") {
    try {
      const { data: avatarFiles } = await supabase.storage.from("avatars").list(userId);
      const crmAvatar = (avatarFiles || []).find((f) => f.name.includes("crm_front"));
      if (crmAvatar) {
        const { data: pubData } = supabase.storage
          .from("avatars")
          .getPublicUrl(`${userId}/${crmAvatar.name}`);
        if (pubData?.publicUrl) return pubData.publicUrl;
      }
    } catch {}
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
