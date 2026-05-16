import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight funnel tracker.
 * Persiste eventos em `public.funnel_events` (RLS aceita anon com lista branca).
 * Mantém session_id no sessionStorage para reconstruir a jornada.
 */

const SESSION_KEY = "py_funnel_session";

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

export type FunnelName = "protocol_calculator" | "ebook_gate" | "lead_status";

export async function trackFunnelEvent(
  funnel: FunnelName,
  eventName: string,
  metadata: Record<string, unknown> = {},
  leadId?: string,
): Promise<void> {
  try {
    await supabase.from("funnel_events" as any).insert({
      funnel,
      event_name: eventName,
      session_id: getSessionId(),
      lead_id: leadId ?? null,
      metadata,
    } as any);
  } catch (err) {
    // Tracking nunca pode bloquear UX
    console.warn(`[funnel:${funnel}] track failed`, eventName, err);
  }
}
