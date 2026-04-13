import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Heart, Sparkles, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WELLNESS_PLANS, type WellnessPlan } from "@/lib/domination-services";

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

export function WellnessSubscriptionCards() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: WellnessPlan) => {
    setLoadingPlan(plan.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Faça login para assinar.", {
          action: { label: "Login", onClick: () => window.location.href = "/login" },
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          planId: `wellness-${plan.id}`,
          planName: plan.name,
          amount: plan.price,
          email: session.user.email,
          userId: session.user.id,
        },
      });

      if (error) {
        console.error("Subscription error:", error);
        toast.error("Erro ao processar assinatura. Tente novamente.");
        return;
      }

      if (data?.init_point) {
        toast.success("Redirecionando para o Mercado Pago...");
        window.location.href = data.init_point;
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.error("Erro ao gerar link de pagamento");
      }
    } catch (err) {
      console.error("Subscription error:", err);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-display font-black text-foreground">
          Planos <span className="text-gradient-green">Bem-Estar</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cuidado contínuo com consultas, descontos e suporte 24h
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

                {plan.maxConsultations > 0 && (
                  <Badge className="bg-primary/10 text-primary text-[10px] mb-3">
                    {plan.maxConsultations} consulta{plan.maxConsultations > 1 ? "s" : ""}/mês inclusa{plan.maxConsultations > 1 ? "s" : ""}
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
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? (
                    <><Loader2 size={14} className="animate-spin mr-2" /> Processando...</>
                  ) : (
                    "Assinar Agora"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
