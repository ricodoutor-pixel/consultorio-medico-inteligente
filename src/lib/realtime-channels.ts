/**
 * Realtime Channel Naming Convention
 *
 * Imposed by the RLS policy on `realtime.messages` (migration 20260425174420):
 *   - public:%             → broadcast/public dashboards (anyone)
 *   - user:<auth.uid>%     → patient-scoped events
 *   - doctor:<auth.uid>%   → doctor-scoped events
 *
 * Any channel name that does not match one of these patterns will silently
 * drop events for non-admin users. Always go through these helpers.
 */

import { supabase } from "@/integrations/supabase/client";

/** Channel for data visible to everyone (no auth needed). */
export function publicChannel(name: string) {
  return `public:${name}`;
}

/** Channel scoped to the currently-authenticated patient/user. */
export function userChannel(userId: string, name: string) {
  return `user:${userId}:${name}`;
}

/** Channel scoped to the currently-authenticated doctor. */
export function doctorChannel(userId: string, name: string) {
  return `doctor:${userId}:${name}`;
}

/**
 * Resolve the current auth user id once. Returns null if not signed in
 * (in which case the caller should fall back to publicChannel or skip).
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
