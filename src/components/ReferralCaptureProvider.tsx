import { useReferralTracking } from "@/hooks/useReferralTracking";

/**
 * Captures ?ref= or ?ref_id= from URL and stores in a 30-day cookie.
 * Must be rendered inside <BrowserRouter>.
 */
export function ReferralCaptureProvider() {
  useReferralTracking();
  return null;
}
