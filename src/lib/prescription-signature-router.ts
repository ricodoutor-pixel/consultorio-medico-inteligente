/**
 * 🔏 Roteador de Assinatura Digital — Planta y Raiz
 *
 * Regra de Negócio (Dr. Edilson — Comando Supremo):
 *  • Dra. Suelen Naves Rodrigues (CRM-PR 49354) → assinatura GOV.BR (ICP-Brasil nativo).
 *  • Demais médicos com CRM válido    → ClickSign (e-mail + token).
 *
 * Após a assinatura, o PDF da receita em papel timbrado é despachado
 * automaticamente pela Enfª Brisa via WhatsApp para o celular do paciente.
 */

import { supabase } from "@/integrations/supabase/client";
import { generatePrescriptionPDF, type PrescriptionData } from "@/lib/prescriptionPDF";

const DR_EDILSON_CRM = "10963";

export type SignatureProvider = "gov.br" | "clicksign";

export interface SignAndDispatchInput {
  prescription: PrescriptionData;
  prescriptionId?: string;
  doctor: {
    crm: string;
    crmState: string;
    name: string;
    email: string;
  };
  patient: {
    name: string;
    whatsapp: string; // +55DDDNNNNNNNNN
  };
  appointmentId?: string;
}

export interface SignAndDispatchResult {
  success: boolean;
  provider: SignatureProvider;
  documentKey?: string;
  signatureUrl?: string;
  prescriptionUrl?: string;
  dispatchSid?: string;
  error?: string;
}

/** Decide o provider conforme o CRM do médico prescritor. */
export function resolveSignatureProvider(doctorCRM: string): SignatureProvider {
  return doctorCRM.replace(/\D/g, "") === DR_EDILSON_CRM ? "gov.br" : "clicksign";
}

async function pdfToBase64(docPromise: ReturnType<typeof generatePrescriptionPDF>): Promise<string> {
  const doc = await docPromise;
  // jsPDF datauristring → strip "data:application/pdf;filename=...;base64,"
  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1] ?? "";
}

/**
 * Assina e despacha a receita.
 * Fluxo:
 *  1. Gera PDF timbrado (selo gov.br + hash)
 *  2. Roteia para gov.br (Dr. Edilson) ou ClickSign (demais)
 *  3. Dispara Enfª Brisa → WhatsApp paciente com link da receita
 */
export async function signAndDispatchPrescription(
  input: SignAndDispatchInput
): Promise<SignAndDispatchResult> {
  const provider = resolveSignatureProvider(input.doctor.crm);
  const pdfDoc = generatePrescriptionPDF(input.prescription);
  const contentBase64 = await pdfToBase64(pdfDoc);
  const filename = `receita_${input.patient.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;

  let documentKey: string | undefined;
  let signatureUrl: string | undefined;
  let prescriptionUrl: string | undefined;

  try {
    if (provider === "gov.br") {
      // Dr. Edilson: assinatura ICP-Brasil via gov.br (selo já embutido no PDF)
      const { data, error } = await supabase.functions.invoke("govbr-prescription-sign", {
        body: {
          prescriptionId: input.prescriptionId,
          documentPath: filename,
          contentBase64,
          doctorCRM: input.doctor.crm,
          doctorName: input.doctor.name,
          patientName: input.patient.name,
        },
      });
      if (error) throw error;
      documentKey = data?.document_key;
      prescriptionUrl = data?.signed_pdf_url;
    } else {
      // Demais médicos: ClickSign
      const { data, error } = await supabase.functions.invoke("clicksign-prescription", {
        body: {
          action: "upload_and_sign",
          prescriptionId: input.prescriptionId,
          documentPath: filename,
          contentBase64,
          doctorEmail: input.doctor.email,
          doctorName: input.doctor.name,
          patientName: input.patient.name,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ClickSign");
      documentKey = data.document_key;
      signatureUrl = data.signature_url;
      prescriptionUrl = data.signature_url;
    }

    // Despacho automático via Enfª Brisa (WhatsApp)
    let dispatchSid: string | undefined;
    if (input.patient.whatsapp && prescriptionUrl) {
      const { data: dispatch } = await supabase.functions.invoke("brisa-prescription-dispatch", {
        body: {
          patient_phone: input.patient.whatsapp,
          patient_name: input.patient.name,
          doctor_name: input.doctor.name,
          prescription_url: prescriptionUrl,
          appointment_id: input.appointmentId,
        },
      });
      dispatchSid = dispatch?.sid;
    }

    return {
      success: true,
      provider,
      documentKey,
      signatureUrl,
      prescriptionUrl,
      dispatchSid,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[signAndDispatchPrescription]", provider, error);
    return { success: false, provider, error };
  }
}
