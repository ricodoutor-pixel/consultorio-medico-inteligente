/**
 * WhatsApp Brisa Integration — Centralized funnel for Enfª Brisa
 * Number: +55 11 99136-3154
 */
import { trackEvent } from "@/lib/analytics";

export const BRISA_WHATSAPP = "5511991363154";

export const CONSULTATION_TYPES = {
  initial: "Orientação Técnica Inicial",
  followup: "Acompanhamento",
  emergency: "Emergência",
  prescription: "Prescrição",
  adjustment: "Ajuste de Dosagem",
  ansiedade: "tratamento de ansiedade",
  dor_cronica: "tratamento de dor crônica",
  telemedicina: "consulta de telemedicina",
  dashboard: "nova orientação",
  hero: "iniciar triagem",
};

interface BrisaOptions {
  userName?: string;
  doctorName?: string;
  consultationType?: string;
  /** Section/source identifier for tracking (e.g. "hero", "dashboard", "ansiedade") */
  section?: string;
}

function getUTMParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => {
    const v = params.get(k);
    if (v) utm[k] = v;
  });
  return utm;
}

export function generateBrisaWhatsAppURL(opts: BrisaOptions | string = {}, _legacyDoctor?: string, _legacyType?: string): string {
  // Backwards-compat: old signature (userName, doctorName, consultationType)
  const o: BrisaOptions = typeof opts === "string"
    ? { userName: opts, doctorName: _legacyDoctor, consultationType: _legacyType }
    : opts;

  const name = o.userName?.trim() || "paciente";
  let message = `Olá Enfª Brisa, meu nome é ${name}`;

  if (o.section) {
    message += `, vim pela seção ${o.section}`;
  }
  if (o.consultationType) {
    message += ` para ${o.consultationType}`;
  }
  if (o.doctorName) {
    message += ` com o Dr. ${o.doctorName}`;
  }
  message += ".";

  return `https://wa.me/${BRISA_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function openBrisaWhatsApp(opts: BrisaOptions | string = {}, _legacyDoctor?: string, _legacyType?: string): void {
  const o: BrisaOptions = typeof opts === "string"
    ? { userName: opts, doctorName: _legacyDoctor, consultationType: _legacyType }
    : opts;

  const url = generateBrisaWhatsAppURL(o);
  trackBrisaClick(o.section || "unknown", o);
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
}

export function trackBrisaClick(source: string, extra: BrisaOptions = {}): void {
  const utm = getUTMParams();
  trackEvent("iniciar_triagem_brisa", {
    source,
    consultation_type: extra.consultationType ?? null,
    doctor_name: extra.doctorName ?? null,
    has_user_name: extra.userName ? true : false,
    ...utm,
  });
  // Internal conversion log + GA4 conv_whatsapp_click
  import("@/lib/track-conversion").then(({ trackConversion }) => {
    trackConversion("whatsapp_click", source, { ...extra, ...utm });
  }).catch(() => {});
  try {
    (window as any).fbq?.("track", "Contact", { source, ...utm });
  } catch {
    /* noop */
  }
}

// Legacy alias kept for compatibility
export const trackWhatsAppClick = trackBrisaClick;

export async function copyBrisaWhatsAppLink(opts: BrisaOptions = {}): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(generateBrisaWhatsAppURL(opts));
    return true;
  } catch {
    return false;
  }
}

export function useBrisaWhatsApp() {
  return {
    BRISA_WHATSAPP,
    generateBrisaWhatsAppURL,
    openBrisaWhatsApp,
    copyBrisaWhatsAppLink,
    trackBrisaClick,
    CONSULTATION_TYPES,
  };
}

export function isValidWhatsAppNumber(number: string): boolean {
  return /^\d{10,15}$/.test(number.replace(/\D/g, ""));
}

export function formatWhatsAppNumber(number: string): string {
  const cleaned = number.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return number;
}

export default {
  BRISA_WHATSAPP,
  generateBrisaWhatsAppURL,
  openBrisaWhatsApp,
  copyBrisaWhatsAppLink,
  trackBrisaClick,
  trackWhatsAppClick,
  CONSULTATION_TYPES,
  useBrisaWhatsApp,
  isValidWhatsAppNumber,
  formatWhatsAppNumber,
};
