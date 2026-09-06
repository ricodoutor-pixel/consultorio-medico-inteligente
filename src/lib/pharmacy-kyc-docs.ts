import { supabase } from "@/integrations/supabase/client";

export const PHARMACY_KYC_BUCKET = "pharmacy-kyc-documents";

export type PharmacyKycKind =
  | "foto_fachada"
  | "logo_empresa"
  | "contrato_social_pdf"
  | "cartao_cnpj"
  | "alvara_sanitario"
  | "crf_responsavel"
  | "comprovante_endereco";

export const PHARMACY_KYC_LABELS: Record<PharmacyKycKind, string> = {
  foto_fachada: "Foto da Fachada / Loja Física",
  logo_empresa: "Logomarca Oficial (Catálogo Shopping)",
  contrato_social_pdf: "Contrato Social / Razão Social (PDF)",
  cartao_cnpj: "Cartão CNPJ / Registro Fiscal (Tax ID)",
  alvara_sanitario: "Alvará Sanitário / Autorização ANVISA (AFE)",
  crf_responsavel: "Certidão CRF / Farmacêutico Responsável",
  comprovante_endereco: "Comprovante de Endereço Comercial",
};

/** Documentos essenciais para liberar a loja no Shopping */
export const PHARMACY_KYC_REQUIRED: PharmacyKycKind[] = [
  "foto_fachada",
  "logo_empresa",
  "contrato_social_pdf",
  "cartao_cnpj",
  "alvara_sanitario",
];

export interface PharmacyRecord {
  id: string;
  user_id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  anvisa_auth: string;
  farmaceutico_crf?: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  logo_url?: string;
  is_approved: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  kyc_docs?: Array<{
    id: string;
    document_kind: PharmacyKycKind;
    storage_path?: string;
    file_url?: string;
    is_verified?: boolean;
  }>;
}

/** Farmácia de Teste Oficial da Planta y Raíz */
export const TEST_PHARMACY_DATA: PharmacyRecord = {
  id: "test-pharmacy-planta-y-raiz",
  user_id: "00000000-0000-0000-0000-000000000001",
  razao_social: "Planta y Raíz Farmácia & Dispensário Internacional Ltda",
  nome_fantasia: "Farmácia Planta y Raíz (Loja Oficial)",
  cnpj: "48.823.154/0001-92",
  anvisa_auth: "AFE-ANVISA 7.82941.2 / 2026",
  farmaceutico_crf: "Dra. Suelen Naves Rodrigues — CRF/SP 49354",
  email: "contato@plantayraiz.com.br",
  phone: "+55 11 99136-3154",
  city: "São Paulo",
  state: "SP",
  country: "BR",
  logo_url: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400&q=80",
  is_approved: true,
  status: "approved",
  created_at: new Date().toISOString(),
  kyc_docs: [
    {
      id: "doc-1",
      document_kind: "foto_fachada",
      file_url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
      is_verified: true,
    },
    {
      id: "doc-2",
      document_kind: "logo_empresa",
      file_url: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400&q=80",
      is_verified: true,
    },
    {
      id: "doc-3",
      document_kind: "contrato_social_pdf",
      file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
      is_verified: true,
    },
    {
      id: "doc-4",
      document_kind: "cartao_cnpj",
      file_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
      is_verified: true,
    },
    {
      id: "doc-5",
      document_kind: "alvara_sanitario",
      file_url: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&q=80",
      is_verified: true,
    },
    {
      id: "doc-6",
      document_kind: "crf_responsavel",
      file_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
      is_verified: true,
    },
    {
      id: "doc-7",
      document_kind: "comprovante_endereco",
      file_url: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80",
      is_verified: true,
    },
  ],
};

/**
 * Retorna URL assinada do Supabase ou URL direta para o documento KYC da farmácia
 */
export async function getPharmacyKycUrl(
  userId: string,
  kind: PharmacyKycKind,
  storagePath?: string | null,
  fallbackUrl?: string | null
): Promise<string | null> {
  if (fallbackUrl) return fallbackUrl;
  if (!userId) return null;

  if (storagePath && (storagePath.startsWith("http://") || storagePath.startsWith("https://"))) {
    return storagePath;
  }

  const candidates = storagePath
    ? [storagePath]
    : ["jpg", "jpeg", "png", "webp", "pdf"].map((ext) => `${userId}/${kind}.${ext}`);

  for (const path of candidates) {
    try {
      const { data } = await supabase.storage
        .from(PHARMACY_KYC_BUCKET)
        .createSignedUrl(path, 60 * 15);
      if (data?.signedUrl) return data.signedUrl;
    } catch {
      // continua procurando
    }
  }

  return null;
}
