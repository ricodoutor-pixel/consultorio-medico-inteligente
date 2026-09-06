import { supabase } from "@/integrations/supabase/client";

export const PATIENT_KYC_BUCKET = "patient-kyc-documents";

export type PatientKycKind =
  | "id_document"
  | "cpf_document"
  | "address_proof"
  | "tcle_consent"
  | "medical_report"
  | "selfie_verification";

export const PATIENT_KYC_LABELS: Record<PatientKycKind, string> = {
  id_document: "Documento de Identidade (RG / CNH / Passaporte)",
  cpf_document: "Cartão CPF / Tax ID",
  address_proof: "Comprovante de Residência (CEP)",
  tcle_consent: "Termo TCLE & Consentimento LGPD (Assinado)",
  medical_report: "Laudo Médico / Histórico Prévio",
  selfie_verification: "Selfie com Documento (Biometria Facial)",
};

export const PATIENT_KYC_REQUIRED: PatientKycKind[] = [
  "id_document",
  "cpf_document",
  "address_proof",
  "tcle_consent",
];

export interface PatientConsultation {
  id: string;
  doctor_name: string;
  doctor_crm: string;
  doctor_specialty: string;
  doctor_avatar?: string;
  date: string;
  time: string;
  type: "video" | "chat" | "presencial";
  status: "completed" | "scheduled" | "in_progress" | "cancelled";
  prescription_issued: boolean;
  notes?: string;
}

export interface PatientPayment {
  id: string;
  description: string;
  amount: number;
  method: "pix" | "credit_card" | "debit_card" | "boleto" | "convenio" | "crypto";
  status: "paid" | "pending" | "refunded";
  date: string;
  gateway?: string;
}

export interface PatientShoppingOrder {
  id: string;
  product_name: string;
  category: "medicamento" | "clube_souvenir" | "suplemento";
  quantity: number;
  total: number;
  pharmacy_name: string;
  date: string;
  tracking_code?: string;
}

export interface PatientRecord {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string;
  email: string;
  phone: string;
  date_of_birth: string;
  city: string;
  state: string;
  country: string;
  avatar_url?: string;
  is_approved: boolean; // Apto para agendamento
  status: "apto" | "pendente" | "bloqueado";
  is_online: boolean;
  last_seen: string;
  created_at: string;
  visit_count_day: number;
  visit_count_week: number;
  visit_count_month: number;
  
  // Cartão Verde
  green_card_active: boolean;
  green_card_number?: string;
  green_card_balance: number;
  
  // Indicação / Afiliados
  referred_by_code?: string;
  referred_by_name?: string;
  friends_referred_count: number;
  
  // Enfermeira Brisa
  brisa_interactions_count: number;
  brisa_last_contact?: string;
  brisa_triage_completed: boolean;
  
  // Histórico
  consultations: PatientConsultation[];
  payments: PatientPayment[];
  shopping_orders: PatientShoppingOrder[];
  
  // Dossiê KYC
  kyc_docs?: Array<{
    id: string;
    document_kind: PatientKycKind;
    storage_path?: string;
    file_url?: string;
    is_verified?: boolean;
  }>;
}

/** Paciente de Teste Oficial: Edilson Bezerra da Silva (contato@plantayraiz.com.br) */
export const TEST_PATIENT_DATA: PatientRecord = {
  id: "test-patient-edilson-bezerra",
  user_id: "00000000-0000-0000-0000-000000000002",
  full_name: "Edilson Bezerra da Silva",
  cpf: "009.536.834-51",
  email: "contato@plantayraiz.com.br",
  phone: "+55 11 98713-1241",
  date_of_birth: "1982-05-15",
  city: "São Paulo",
  state: "SP",
  country: "BR",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  is_approved: true,
  status: "apto",
  is_online: true,
  last_seen: new Date().toISOString(),
  created_at: "2026-08-01T10:00:00Z",
  visit_count_day: 4,
  visit_count_week: 18,
  visit_count_month: 42,
  
  // Cartão Verde
  green_card_active: true,
  green_card_number: "PR-CARD-2026-95368",
  green_card_balance: 250.00,
  
  // Indicação
  referred_by_code: "DRA-SUELEN-SP",
  referred_by_name: "Dra. Suelen Naves Rodrigues",
  friends_referred_count: 2,
  
  // Enf. Brisa
  brisa_interactions_count: 7,
  brisa_last_contact: "Hoje, 14:15",
  brisa_triage_completed: true,
  
  // Consultas
  consultations: [
    {
      id: "c-101",
      doctor_name: "Dr. Daniel Kobayashi Colombo",
      doctor_crm: "CRM/SP 142.890",
      doctor_specialty: "Telemedicina Canabinoide & Dor Crônica",
      doctor_avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&q=80",
      date: "24/08/2026",
      time: "14:30",
      type: "video",
      status: "completed",
      prescription_issued: true,
      notes: "Paciente com melhora de 80% nos sintomas de ansiedade e insônia após protocolo com CBD Full Spectrum.",
    },
  ],
  
  // Pagamentos
  payments: [
    {
      id: "pay-101",
      description: "Consulta Telemedicina Canabinoide — Dr. Daniel Colombo",
      amount: 180.00,
      method: "pix",
      status: "paid",
      date: "24/08/2026 14:20",
      gateway: "Mercado Pago (PIX Instantâneo)",
    },
    {
      id: "pay-102",
      description: "Pedido #8942 — Óleo Full Spectrum 1500mg",
      amount: 289.90,
      method: "credit_card",
      status: "paid",
      date: "25/08/2026 10:15",
      gateway: "Stripe International",
    },
    {
      id: "pay-103",
      description: "Camiseta Oficial Planta y Raíz Club",
      amount: 89.00,
      method: "pix",
      status: "paid",
      date: "25/08/2026 10:15",
      gateway: "Mercado Pago",
    }
  ],
  
  // Compras no Shopping
  shopping_orders: [
    {
      id: "ord-8942",
      product_name: "Óleo de Cannabis Full Spectrum 1500mg (30ml)",
      category: "medicamento",
      quantity: 1,
      total: 289.90,
      pharmacy_name: "Farmácia Planta y Raíz (Loja Oficial)",
      date: "25/08/2026",
      tracking_code: "BR948271038SP",
    },
    {
      id: "ord-8943",
      product_name: "Camiseta Oficial Planta y Raíz (Verde Orgânico)",
      category: "clube_souvenir",
      quantity: 1,
      total: 89.00,
      pharmacy_name: "Clube Planta y Raíz (Souvenirs)",
      date: "25/08/2026",
      tracking_code: "BR948271039SP",
    }
  ],
  
  // Dossiê KYC
  kyc_docs: [
    {
      id: "pdoc-1",
      document_kind: "id_document",
      file_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
      is_verified: true,
    },
    {
      id: "pdoc-2",
      document_kind: "cpf_document",
      file_url: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80",
      is_verified: true,
    },
    {
      id: "pdoc-3",
      document_kind: "address_proof",
      file_url: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&q=80",
      is_verified: true,
    },
    {
      id: "pdoc-4",
      document_kind: "tcle_consent",
      file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
      is_verified: true,
    },
    {
      id: "pdoc-5",
      document_kind: "medical_report",
      file_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
      is_verified: true,
    },
    {
      id: "pdoc-6",
      document_kind: "selfie_verification",
      file_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
      is_verified: true,
    },
  ],
};

/**
 * Retorna URL assinada do Supabase ou URL direta para o documento KYC do paciente
 */
export async function getPatientKycUrl(
  userId: string,
  kind: PatientKycKind,
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
        .from(PATIENT_KYC_BUCKET)
        .createSignedUrl(path, 60 * 15);
      if (data?.signedUrl) return data.signedUrl;
    } catch {
      // fallback
    }
  }

  return null;
}
