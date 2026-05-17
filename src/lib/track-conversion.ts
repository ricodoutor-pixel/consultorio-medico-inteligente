/**
 * Conversion tracking — fans out to GTM/GA4 dataLayer + Supabase (real-time dashboard)
 */
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

export type ConversionType =
  | "whatsapp_click"
  | "form_submit"
  | "quiz_started"
  | "quiz_completed"
  | "checkout_started"
  | "checkout_completed";

function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let s = sessionStorage.getItem("pyr_sid");
  if (!s) {
    s = crypto.randomUUID();
    sessionStorage.setItem("pyr_sid", s);
  }
  return s;
}

export async function trackConversion(
  event_type: ConversionType,
  source?: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  // 1) GTM / GA4 (real time)
  trackEvent(`conv_${event_type}`, {
    source: source ?? null,
    ...Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : (v as any)]),
    ),
  });

  // 2) Supabase log (internal dashboard)
  try {
    await supabase.from("conversion_events").insert({
      event_type,
      source: source ?? null,
      session_id: sessionId(),
      metadata,
    });
  } catch {
    /* fire-and-forget */
  }
}
