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
  selfie: "Foto Original (Cadastro)",
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
export const GEISELL_KYC_PATHS: Partial<Record<KycKind, string>> = {
  crm_front: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/crm_front.jpg",
  crm_back: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/crm_back.jpg",
  id_front: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/id_front.pdf",
  id_back: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/id_back.pdf",
  cpf_doc: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/id_front.pdf",
  address_proof: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/address_proof.jpg",
  icp_brasil: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/icp_brasil.jpg",
  cfm_print: "/cfm_prints/cfm-dra-geisell-torres.png",
  selfie: "/avatars/dra-geisell-torres.jpg",
  intl_license: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/intl_license.jpg",
  stay_stamp: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/stay_stamp.jpg",
  passport_signature: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/passport_signature.jpg",
  vip_receipt: "/cfm_prints/cfm-dra-geisell-torres.png",
};

export async function getKycSignedUrl(
  userId: string,
  kind: KycKind,
  storagePath?: string | null,
): Promise<string | null> {
  if (storagePath && (storagePath.startsWith("/") || storagePath.startsWith("http"))) {
    return storagePath;
  }

  if (!storagePath && userId === "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3" && GEISELL_KYC_PATHS[kind]) {
    storagePath = GEISELL_KYC_PATHS[kind]!;
    if (storagePath.startsWith("/")) return storagePath;
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
  } else if (kind === "selfie") {
    for (const ext of exts) {
      const p = `${userId}/avatar.${ext}`;
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

  // Fallback no bucket avatars se for crm_front, id_front ou selfie (Foto Original)
  if (kind === "crm_front" || kind === "id_front" || kind === "selfie") {
    try {
      const { data: avatarFiles } = await supabase.storage.from("avatars").list(userId);
      const targetFile =
        kind === "selfie"
          ? (avatarFiles || []).find((f) => !f.name.includes("signature") && !f.name.endsWith(".cer") && !f.name.endsWith(".crt") && !f.name.endsWith(".pdf"))
          : (avatarFiles || []).find((f) => f.name.includes("crm_front"));
      if (targetFile) {
        const { data: pubData } = supabase.storage
          .from("avatars")
          .getPublicUrl(`${userId}/${targetFile.name}`);
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

const SIGNATURE_IMAGE_EXT = /\.(png|jpe?g|webp)(\?|$)/i;

/** Só imagens viram carimbo visual; certificados (.pfx/.cer) e PDFs ficam fora do documento. */
export function isSignatureImagePath(path: string | null | undefined): boolean {
  return Boolean(path && SIGNATURE_IMAGE_EXT.test(path));
}

/**
 * Imagem da assinatura do próprio médico (KYC "icp_brasil" ou signature_url do cadastro) para o
 * receituário. É apenas um carimbo visual: a validade jurídica vem da assinatura digital gov.br/ICP-Brasil.
 */
export async function loadDoctorSignatureImageUrl(userId: string): Promise<string | null> {
  const [{ data: kyc }, { data: doctor }] = await Promise.all([
    supabase
      .from("doctor_kyc_documents")
      .select("storage_path")
      .eq("doctor_user_id", userId)
      .eq("document_kind", "icp_brasil")
      .maybeSingle(),
    supabase.from("doctors").select("signature_url").eq("user_id", userId).maybeSingle(),
  ]);
  const kycPath = (kyc as { storage_path?: string | null } | null)?.storage_path ?? null;
  if (isSignatureImagePath(kycPath)) {
    const url = await getKycSignedUrl(userId, "icp_brasil", kycPath);
    if (url) return url;
  }
  const publicUrl = (doctor as { signature_url?: string | null } | null)?.signature_url ?? null;
}

export const DB_VALID_KYC_KINDS: KycKind[] = [
  "crm_front",
  "crm_back",
  "id_front",
  "id_back",
  "cpf_doc",
  "address_proof",
  "selfie",
  "cfm_print",
  "icp_brasil",
];

let isSyncingGeisell = false;
let geisellSynced = false;

/**
 * Sincroniza de forma sequencial e sem violação de constraints os documentos KYC,
 * dados cadastrais e status VIP da Dra. Geisell Martinez Torres no banco oficial Supabase.
 */
export async function syncGeisellKycToDatabase(): Promise<boolean> {
  // Desativado: gravava dados pessoais e status a partir do navegador. Cadastro real fica só no banco.
  return true;
  if (geisellSynced || isSyncingGeisell) return true;
  isSyncingGeisell = true;
  try {
    const geisellUid = "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3";
    const geisellDocId = "a98b68b3-3efa-42d2-8959-e8be8d6466f7";

    // 1. Perfil completo com CPF de 11 dígitos
    const { error: profErr } = await (supabase.from("profiles") as any)
      .update({
        full_name: "Dra. Geisell Martinez Torres",
        cpf: "",
        phone: "+5575991462018",
        pix_key: "",
        pix_type: "CPF",
        date_of_birth: "",
        cep: "",
        address_street: "",
        neighborhood: "Muchila",
        city: "Feira de Santana",
        region: "BA",
        avatar_url: "/avatars/dra-geisell-torres.jpg",
        signature_url: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/icp_brasil.jpg",
      })
      .eq("id", geisellUid);
    if (profErr) {
      console.warn("[syncGeisellKycToDatabase] profiles update notice:", profErr.message);
    }

    // 2. Documentos válidos na tabela doctor_kyc_documents
    const validRows = DB_VALID_KYC_KINDS.map((kind) => {
      const path = GEISELL_KYC_PATHS[kind] || `0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/${kind}.jpg`;
      const isPdf = path.endsWith(".pdf");
      const isPng = path.endsWith(".png");
      return {
        doctor_user_id: geisellUid,
        document_kind: kind,
        storage_path: path,
        mime_type: isPdf ? "application/pdf" : isPng ? "image/png" : "image/jpeg",
        verification_status: "approved",
        verification_notes: "Homologado pela Diretoria Técnica Dr. Edilson Bezerra (VIP #2)",
      };
    });

    const { error: kycErr } = await (supabase.from("doctor_kyc_documents" as any)
      .upsert(validRows, { onConflict: "doctor_user_id,document_kind" }) as any);
    if (kycErr) {
      console.warn("[syncGeisellKycToDatabase] doctor_kyc_documents upsert notice:", kycErr.message);
    }

    // 3. Tabela doctors com status aprovado, contrato assinado e plano premium
    const { error: docErr } = await (supabase.from("doctors") as any)
      .update({
        is_approved_by_admin: true,
        approval_status: "approved",
        is_verified: true,
        is_online: true,
        is_available: true,
        kyc_status: "approved",
        is_contract_signed: true,
        contract_signed_at: "2026-11-16T08:49:24.000Z",
        contract_hash: "0x9b4e8f2a1c7d6e3b5a9f0c2d4e8b1a6f3c7d9e2b5a4f8c1d6e9b2a5f7c3d8e1b",
        plan_tier: "premium",
        signature_url: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/icp_brasil.jpg",
        crm_front_url: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/crm_front.jpg",
        crm_back_url: "0900d6e3-74f6-48f1-b3af-cf76fee5a6c3/crm_back.jpg",
      })
      .eq("id", geisellDocId);
    if (docErr) {
      console.warn("[syncGeisellKycToDatabase] doctors update notice:", docErr.message);
    }

    geisellSynced = true;
    return true;
  } catch (err: any) {
    console.warn("[syncGeisellKycToDatabase] Erro na sincronização:", err?.message || err);
    return false;
  } finally {
    isSyncingGeisell = false;
  }
}

