import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const REFERRAL_COOKIE_KEY = "plr_ref_id";
const REFERRAL_COOKIE_DAYS = 30;

/**
 * Hook to capture referral code from URL and store in cookie.
 * On signup, links the new user to their referrer's tree.
 */
export function useReferralTracking() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Capture ref from URL (?ref=CODE or ?ref_id=CODE)
    const refCode = searchParams.get("ref") || searchParams.get("ref_id");
    if (refCode) {
      setCookie(REFERRAL_COOKIE_KEY, refCode, REFERRAL_COOKIE_DAYS);
      console.log(`[Referral] Captured ref code: ${refCode}`);
    }
  }, [searchParams]);
}

/**
 * Get the stored referral code from cookie
 */
export function getReferralCode(): string | null {
  return getCookie(REFERRAL_COOKIE_KEY);
}

/**
 * After signup, link the new user to their referrer tree.
 * Call this after successful auth.signUp().
 */
export async function linkReferralOnSignup(newUserId: string) {
  const refCode = getReferralCode();
  if (!refCode) return;

  const cleanRef = refCode.trim();

  try {
    // 1. Case-insensitive search by exact code or ilike
    let { data: referrer } = await supabase
      .from("referral_links")
      .select("user_id, referred_by")
      .ilike("code", cleanRef)
      .maybeSingle();

    // 2. Fallback: If not found, try matching by code suffix (e.g. 5WQ65M)
    if (!referrer) {
      const codeSuffix = cleanRef.replace(/^(PLANTA-|PLR-)/i, "");
      if (codeSuffix.length >= 4) {
        const { data: fallbackRef } = await supabase
          .from("referral_links")
          .select("user_id, referred_by")
          .ilike("code", `%${codeSuffix}`)
          .maybeSingle();
        referrer = fallbackRef;
      }
    }

    if (!referrer) {
      console.log("[Referral] Code captured but no DB referrer row found:", cleanRef);
      // Still create a referral_link for new user so they get their own code
      const newCode = generateCode(newUserId);
      await supabase.from("referral_links").insert({
        user_id: newUserId,
        code: newCode,
      });
      return;
    }

    const level1 = referrer.user_id;

    // Find level 2 (referrer's referrer)
    let level2: string | null = null;
    let level3: string | null = null;

    if (referrer.referred_by) {
      level2 = referrer.referred_by;

      const { data: l2Ref } = await supabase
        .from("referral_links")
        .select("referred_by")
        .eq("user_id", referrer.referred_by)
        .maybeSingle();

      if (l2Ref?.referred_by) {
        level3 = l2Ref.referred_by;
      }
    }

    // Generate unique code for the new user
    const newCode = generateCode(newUserId);

    // Create referral_links entry for the new user
    await supabase.from("referral_links").insert({
      user_id: newUserId,
      code: newCode,
      referred_by: level1,
      level1_referrer: level1,
      level2_referrer: level2,
      level3_referrer: level3,
    });

    // Update profiles.referred_by
    await supabase
      .from("profiles")
      .update({ referred_by: level1 } as any)
      .eq("id", newUserId);

    // Clear cookie after successful link
    setCookie(REFERRAL_COOKIE_KEY, "", -1);
    console.log(`[Referral] Linked ${newUserId} → L1:${level1} L2:${level2} L3:${level3}`);
  } catch (error) {
    console.error("[Referral] Error linking referral:", error);
  }
}

function generateCode(userId: string): string {
  const short = userId.replace(/-/g, "").substring(0, 6).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PLR-${short}${rand}`;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
