import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { userChannel } from "@/lib/realtime-channels";

export interface SubscriptionInfo {
  isActive: boolean;
  isLoading: boolean;
  status: string | null;
  priceId: string | null;
  productId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  tier: "free" | "essencial" | "premium" | "vip";
  marketplaceDiscount: number; // percentage
}

const TIER_MAP: Record<string, { tier: SubscriptionInfo["tier"]; discount: number }> = {
  // Planos universais (R$ 99/mês) — paciente, médico e lojista
  plano_paciente: { tier: "premium", discount: 15 },
  plano_medico: { tier: "vip", discount: 15 },
  plano_lojista: { tier: "vip", discount: 15 },
  // Legados
  essencial_mensal: { tier: "essencial", discount: 5 },
  premium_mensal: { tier: "premium", discount: 15 },
  vip_mensal: { tier: "vip", discount: 25 },
};


export function useSubscription(): SubscriptionInfo {
  const [info, setInfo] = useState<SubscriptionInfo>({
    isActive: false,
    isLoading: true,
    status: null,
    priceId: null,
    productId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    tier: "free",
    marketplaceDiscount: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setInfo(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const env = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN?.startsWith("pk_test_") ? "sandbox" : "live";

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", env)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (!sub) {
        setInfo(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const isStillActive = sub.current_period_end
        ? new Date(sub.current_period_end) > new Date()
        : true;

      const tierInfo = TIER_MAP[sub.price_id] || { tier: "essencial" as const, discount: 5 };

      setInfo({
        isActive: isStillActive,
        isLoading: false,
        status: sub.status,
        priceId: sub.price_id,
        productId: sub.product_id,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end || false,
        stripeSubscriptionId: sub.stripe_subscription_id,
        stripeCustomerId: sub.stripe_customer_id,
        tier: tierInfo.tier,
        marketplaceDiscount: tierInfo.discount,
      });
    }

    fetch();

    // Listen for realtime changes — channel name MUST follow the
    // realtime.messages RLS naming convention (user:<auth.uid>:...).
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (cancelled || !uid) return;
      channel = supabase
        .channel(userChannel(uid, "subscription-changes"))
        .on("postgres_changes", {
          event: "*", schema: "public", table: "subscriptions",
          filter: `user_id=eq.${uid}`,
        }, () => { fetch(); })
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return info;
}
