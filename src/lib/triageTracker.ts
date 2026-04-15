/**
 * Triage Abandonment Tracker — tracks when users start triage
 * and notifies backend if they don't convert within 15 minutes
 */
import { supabase } from "@/integrations/supabase/client";

const TRIAGE_SESSION_KEY = "plr_triage_session";

export function startTriageTracking(patientPhone?: string, patientName?: string) {
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem(TRIAGE_SESSION_KEY, sessionId);

  // Fire and forget - notify backend
  supabase.functions.invoke("brisa-triage-closer", {
    body: {
      action: "track_start",
      session_id: sessionId,
      patient_phone: patientPhone || null,
      patient_name: patientName || null,
    },
  }).catch(() => {});

  return sessionId;
}

export function markTriageConverted() {
  const sessionId = sessionStorage.getItem(TRIAGE_SESSION_KEY);
  if (!sessionId) return;

  supabase.functions.invoke("brisa-triage-closer", {
    body: { action: "track_conversion", session_id: sessionId },
  }).catch(() => {});

  sessionStorage.removeItem(TRIAGE_SESSION_KEY);
}

export function getTriageSessionId(): string | null {
  return sessionStorage.getItem(TRIAGE_SESSION_KEY);
}
