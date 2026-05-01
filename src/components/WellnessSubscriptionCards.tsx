import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Heart, Sparkles, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WELLNESS_PLANS, type WellnessPlan } from "@/lib/domination-services";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";

const PLAN_ICONS: Record<string, typeof Heart> = {
  basic: Heart,
  pro: Sparkles,
  premium: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  basic: "text-blue-400",
  pro: "text-primary",
  premium: "text-amber-400",
};

// Map wellness plan IDs to Stripe price lookup_keys
const STRIPE_PRICE_MAP: Record<string, string> = {
  basic: "essencial_mensal",
  pro: "premium_mensal",
  premium: "vip_mensal",
};

export function WellnessSubscriptionCards() {
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSubscribe = (plan: WellnessPlan) => {
    if (!user) {
      toast.error("Faça login para assinar.", {
        action: { label: "Login", onClick: () => window.location.href = "/login" },
      });
      return;
    }
    setActivePlan(plan.id);
  };

  if (activePlan) {
    const plan = WELLNESS_PLANS.find(p => p.id === activePlan);
    const stripePriceId = STRIPE_PRICE_MAP[activePlan];

    if (!plan || !stripePriceId) return null;

    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Button variant="ghost" onClick={() => setActivePlan(null)}>
          ← Voltar aos planos
        </Button>
        <h3 className="text-xl font-bold text-center">Assinatura {plan.name}</h3>
        <div className="rounded-xl overflow-hidden border border-border">
          <StripeEmbeddedCheckout
            priceId={stripePriceId}
            customerEmail={user?.email}
            userId={user?.id}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-display font-black text-foreground">
          Planos <span className="text-gradient-green">Bem-Estar</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cuidado contínuo com orientação técnicas, descontos e suporte 24h
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {WELLNESS_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id] || Heart;
          const color = PLAN_COLORS[plan.id] || "text-primary";
          const isHighlighted = plan.id === "pro";

          return (
            <Card
              key={plan.id}
              className={`relative border-border transition-all hover:-translate-y-1 ${
                isHighlighted ? "border-primary/50 glow-green" : ""
              }`}
            >
              {isHighlighted && (
                <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-black bg-gradient-green border border-primary/30 text-primary">
                  RECOMENDADO
                </div>
              )}
              <CardContent className="p-5">
                <Icon size={24} className={`${color} mb-2`} />
                <h3 className="text-lg font-display font-black text-foreground">{plan.name}</h3>
                <div className="mb-3">
                  <span className={`text-3xl font-display font-black ${isHighlighted ? "text-gradient-green" : "text-foreground"}`}>
                    R$ {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                {plan.maxOrientação Técnications > 0 && (
                  <Badge className="bg-primary/10 text-primary text-[10px] mb-3">
                    {plan.maxOrientação Técnications} orientação técnica{plan.maxOrientação Técnications > 1 ? "s" : ""}/mês inclusa{plan.maxOrientação Técnications > 1 ? "s" : ""}
                  </Badge>
                )}

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Badge className="bg-secondary/10 text-secondary text-[10px] mb-3">
                  {(plan.productDiscount * 100).toFixed(0)}% desconto em produtos
                </Badge>

                <Button
                  className={`w-full rounded-xl font-bold ${isHighlighted ? "bg-primary hover:bg-primary/90" : ""}`}
                  variant={isHighlighted ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan)}
                >
                  Assinar Agora
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
