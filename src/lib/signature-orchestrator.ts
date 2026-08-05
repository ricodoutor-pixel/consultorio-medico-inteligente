/**
 * 🔏 Orquestrador de Assinatura Híbrido — Planta y Raiz
 *
 * Árvore de Decisão:
 *  • CRM-PR 49354 (Dra. Suelen)        → gov.br (selo oficial ICP-Brasil)
 *  • plan_tier === 'VIP' (ou superior: 'premium' / 'enterprise')
 *                                   → ClickSign (assinatura direta na plataforma)
 *  • Demais (Free / Basic / Pro)    → Modal "Assinatura Grátis via ITI"
 *                                     (médico baixa PDF, assina em https://assinador.iti.br/
 *                                     com Gov.br Prata/Ouro e devolve o arquivo)
 *
 * Após qualquer fluxo, a Enfª Brisa (+55 11 99136-3154) despacha o link
 * do PDF assinado para o paciente via Evolution API.
 */

import { supabase } from "@/integrations/supabase/client";
import { generatePrescriptionPDF, type PrescriptionData } from "@/lib/prescriptionPDF";

const DR_EDILSON_CRM = "10963";

export type SignatureRoute = "govbr" | "clicksign" | "iti_free";

export interface SignatureContext {
  prescription: PrescriptionData;
  prescriptionId: string;
  doctor: {
    crm: string;
    crmState: string;
    name: string;
    email: string;
    planTier?: string | null; // 'free' | 'basic' | 'pro' | 'VIP' | 'premium' | 'enterprise'
  };
  patient: {
    name: string;
    whatsapp: string;
  };
  appointmentId?: string;
}

export interface SignatureResult {
  success: boolean;
  route: SignatureRoute;
  documentKey?: string;
  signatureUrl?: string;
  prescriptionUrl?: string;
  /** Para fluxo ITI grátis: PDF base64 a ser baixado pelo médico. */
  unsignedPdfBase64?: string;
  filename?: string;
  error?: string;
}

const VIP_TIERS = new Set(["vip", "premium", "enterprise"]);

export function resolveSignatureRoute(doctor: SignatureContext["doctor"]): SignatureRoute {
  if (doctor.crm.replace(/\D/g, "") === DR_EDILSON_CRM) return "govbr";
  const tier = (doctor.planTier ?? "").toLowerCase();
  if (VIP_TIERS.has(tier)) return "clicksign";
  return "iti_free";
}

async function pdfToBase64(docPromise: ReturnType<typeof generatePrescriptionPDF>): Promise<string> {
  const doc = await docPromise;
  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1] ?? "";
}

async function dispatchToBrisa(
  ctx: SignatureContext,
  prescriptionUrl: string
): Promise<string | undefined> {
  if (!ctx.patient.whatsapp || !prescriptionUrl) return undefined;
  const { data } = await supabase.functions.invoke("brisa-prescription-dispatch", {
    body: {
      patient_phone: ctx.patient.whatsapp,
      patient_name: ctx.patient.name,
      doctor_name: ctx.doctor.name,
      prescription_url: prescriptionUrl,
      appointment_id: ctx.appointmentId,
      prescription_id: ctx.prescriptionId,
    },
  });
  return data?.sid;
}

/**
 * Inicia o fluxo de assinatura conforme o plano do médico.
 * - govbr / clicksign: completam server-side e retornam URL pronta.
 * - iti_free: retorna PDF base64 para download; conclusão depende de
 *   submitFreeSignedPdf() após o upload do médico.
 */
export async function orchestrateSignature(
  ctx: SignatureContext
): Promise<SignatureResult> {
  const route = resolveSignatureRoute(ctx.doctor);
  const pdfDoc = generatePrescriptionPDF(ctx.prescription);
  const contentBase64 = await pdfToBase64(pdfDoc);
  const filename = `receita_${ctx.patient.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;

  try {
    if (route === "govbr") {
      const { data, error } = await supabase.functions.invoke("govbr-prescription-sign", {
        body: {
          prescriptionId: ctx.prescriptionId,
          documentPath: filename,
          contentBase64,
          doctorCRM: ctx.doctor.crm,
          doctorName: ctx.doctor.name,
          patientName: ctx.patient.name,
        },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || "Falha gov.br");
      const url = data.signed_pdf_url;
      await dispatchToBrisa(ctx, url);
      return { success: true, route, documentKey: data.document_key, prescriptionUrl: url };
    }

    if (route === "clicksign") {
      const { data, error } = await supabase.functions.invoke("clicksign-prescription", {
        body: {
          action: "upload_and_sign",
          prescriptionId: ctx.prescriptionId,
          documentPath: filename,
          contentBase64,
          doctorEmail: ctx.doctor.email,
          doctorName: ctx.doctor.name,
          patientName: ctx.patient.name,
        },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || "Falha ClickSign");
      const url = data.signature_url;
      // Brisa só dispara quando ClickSign confirma assinatura (webhook futuro).
      return {
        success: true,
        route,
        documentKey: data.document_key,
        signatureUrl: url,
        prescriptionUrl: url,
      };
    }

    // iti_free: devolve o PDF para o médico baixar e assinar externamente.
    return {
      success: true,
      route,
      unsignedPdfBase64: contentBase64,
      filename,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[orchestrateSignature]", route, error);
    return { success: false, route, error };
  }
}

/**
 * Conclui o fluxo ITI Free: recebe o PDF assinado do médico,
 * envia para a edge function que valida hash, salva no Storage
 * e dispara a Enfª Brisa.
 */
export async function submitFreeSignedPdf(args: {
  prescriptionId: string;
  signedFile: File;
  patient: { name: string; whatsapp: string };
  doctor: { name: string; crm: string };
  appointmentId?: string;
}): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    const buf = await args.signedFile.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    const contentBase64 = btoa(bin);

    const { data, error } = await supabase.functions.invoke("prescription-upload-signed", {
      body: {
        prescriptionId: args.prescriptionId,
        filename: args.signedFile.name || `receita_assinada_${Date.now()}.pdf`,
        contentBase64,
        patient: args.patient,
        doctor: args.doctor,
        appointmentId: args.appointmentId,
      },
    });
    if (error || !data?.success) {
      return { success: false, error: data?.error || error?.message || "Falha upload" };
    }
    return { success: true, signedUrl: data.signed_pdf_url };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro" };
  }
}

export const ITI_SIGNER_URL = "https://assinador.iti.br/";
