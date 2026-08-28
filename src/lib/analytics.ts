/**
 * Planta & Raiz — Analytics Bridge
 * Meta Pixel + CleverTap + GTM dataLayer
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      page: () => void;
      track: (eventName: string, properties?: Record<string, unknown>) => void;
      identify: (params: Record<string, unknown>) => void;
    };
    clevertap?: { event: { push: (name: string, props?: Record<string, unknown>) => void } };
    dataLayer?: Record<string, unknown>[];
  }
}

type EventProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Universal track function — fans out to Meta Pixel, TikTok Pixel, CleverTap, and GTM dataLayer.
 */
export function trackEvent(eventName: string, properties?: EventProperties): void {
  try {
    // GTM dataLayer (always available via GA4 setup)
    window.dataLayer?.push({ event: eventName, ...properties });

    // Meta Pixel
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", eventName, properties);
    }

    // TikTok Pixel (ID: DA8R8N3C77UBCVGL01RG)
    if (typeof window.ttq?.track === "function") {
      const tikTokMap: Record<string, string> = {
        PageView: "ViewContent",
        Medical_Signup_Started: "CompleteRegistration",
        KYC_Validation_Success: "CompleteRegistration",
        Consultation_Booked: "PlaceAnOrder",
        Checkout_Started: "InitiateCheckout",
      };
      const ttEvent = tikTokMap[eventName] || eventName;
      window.ttq.track(ttEvent, properties as Record<string, unknown>);
    }

    // CleverTap
    if (window.clevertap?.event?.push) {
      window.clevertap.event.push(eventName, properties ?? {});
    }

    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${eventName}`, properties);
    }
  } catch (err) {
    console.warn("[Analytics] Error tracking event:", err);
  }
}

// ─── Medical KYC Funnel Events ─────────────────────────────────────────

export function trackMedicalSignupStarted() {
  trackEvent("Medical_Signup_Started", { timestamp: Date.now() });
}

export function trackKYCSubmissionAttempt(documentType: string) {
  trackEvent("KYC_Submission_Attempt", { document_type: documentType, timestamp: Date.now() });
}

export function trackKYCValidationFailed(errorType: string, reason: string) {
  trackEvent("KYC_Validation_Failed", {
    error_type: errorType,
    reason,
    timestamp: Date.now(),
  });
}

export function trackKYCValidationSuccess(documentType: string) {
  trackEvent("KYC_Validation_Success", {
    document_type: documentType,
    timestamp: Date.now(),
  });
}

// ─── General Page / Commerce Events ────────────────────────────────────

export function trackPageView(page: string) {
  trackEvent("PageView", { page });
}

export function trackConsultationBooked(doctorId: string, amount: number) {
  trackEvent("Consultation_Booked", { doctor_id: doctorId, amount });
}

export function trackCheckoutStarted(value: number) {
  trackEvent("Checkout_Started", { value });
}
