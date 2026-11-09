import { supabase } from "@/integrations/supabase/client";

/** Only a persisted referral_links code is shareable. Never synthesize a fallback. */
export async function loadPermanentReferralCode(userId: string): Promise<string> {
  const { data, error } = await supabase.rpc("ensure_referral_code", { _user_id: userId });
  if (error || typeof data !== "string" || !data.trim()) {
    throw new Error("Não foi possível carregar seu link de indicação. Tente de novo.");
  }
  return data;
}