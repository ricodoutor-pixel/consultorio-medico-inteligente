/**
 * WhatsApp Brisa Integration
 * 
 * Fluxo centralizado para todas as interações com WhatsApp da Enfermeira Brisa
 * Número: 5511991363154
 */

export const BRISA_WHATSAPP = "5511991363154";

/**
 * Gerar URL de WhatsApp com template dinâmico
 */
export function generateBrisaWhatsAppURL(
  userName: string,
  doctorName?: string,
  consultationType?: string
): string {
  let message = `Olá enfermeira Brisa meu nome é ${userName}`;

  if (doctorName) {
    message += `, gostaria de agendar uma consulta online com o Dr. ${doctorName}`;
  } else {
    message += `, gostaria de agendar uma consulta online`;
  }

  if (consultationType) {
    message += ` para ${consultationType}`;
  }

  message += ".";

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${BRISA_WHATSAPP}?text=${encodedMessage}`;
}

/**
 * Tipos de consulta
 */
export const CONSULTATION_TYPES = {
  initial: "Orientação Técnica Inicial",
  followup: "Acompanhamento",
  emergency: "Emergência",
  prescription: "Prescrição",
  adjustment: "Ajuste de Dosagem",
};

/**
 * Abrir WhatsApp em nova aba
 */
export function openBrisaWhatsApp(
  userName: string,
  doctorName?: string,
  consultationType?: string
): void {
  const url = generateBrisaWhatsAppURL(userName, doctorName, consultationType);
  window.open(url, "_blank");
}

/**
 * Copiar link do WhatsApp para clipboard
 */
export async function copyBrisaWhatsAppLink(
  userName: string,
  doctorName?: string,
  consultationType?: string
): Promise<boolean> {
  try {
    const url = generateBrisaWhatsAppURL(userName, doctorName, consultationType);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error("Failed to copy WhatsApp link:", error);
    return false;
  }
}

/**
 * Rastrear clique em WhatsApp (Analytics)
 */
export function trackWhatsAppClick(
  source: string,
  userName?: string,
  doctorName?: string
): void {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "whatsapp_click", {
      source,
      user_name: userName,
      doctor_name: doctorName,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Componente React Hook para WhatsApp
 */
export function useBrisaWhatsApp() {
  return {
    BRISA_WHATSAPP,
    generateBrisaWhatsAppURL,
    openBrisaWhatsApp,
    copyBrisaWhatsAppLink,
    trackWhatsAppClick,
    CONSULTATION_TYPES,
  };
}

/**
 * Validar número de WhatsApp
 */
export function isValidWhatsAppNumber(number: string): boolean {
  const regex = /^\d{10,15}$/;
  return regex.test(number.replace(/\D/g, ""));
}

/**
 * Formatar número de WhatsApp
 */
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
  trackWhatsAppClick,
  CONSULTATION_TYPES,
  useBrisaWhatsApp,
  isValidWhatsAppNumber,
  formatWhatsAppNumber,
};
