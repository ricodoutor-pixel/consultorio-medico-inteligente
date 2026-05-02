import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, ArrowUpRight, CheckCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "essencial",
    name: "Essencial",
    price: 50,
    features: ["Acesso à plataforma", "1 consulta/mês", "Suporte por chat"],
    color: "hsl(var(--muted-foreground))",
    popular: false,
  },
  {
    id: "acesso",
    name: "Acesso Usuários",
    price: 100,
    features: ["Tudo do Essencial", "3 consultas/mês", "Clube de descontos", "Suporte prioritário"],
    color: "hsl(var(--primary))",
    popular: true,
  },
  {
    id: "familia",
    name: "Família",
    price: 250,
    features: ["Tudo do Acesso", "Até 5 dependentes", "Consultas ilimitadas", "Prescrição digital"],
    color: "hsl(45,76%,52%)",
    popular: false,
  },
  {
    id: "empresas",
    name: "Empresas",
    price: 300,
    features: ["Tudo do Família", "Gestão corporativa", "API dedicada", "Gerente de conta"],
    color: "hsl(200,80%,55%)",
    popular: false,
  },
];

interface PlanUpgradeCardProps {
  currentPlan?: string;
}

export function PlanUpgradeCard({ currentPlan = "essencial" }: PlanUpgradeCardProps) {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch original referrer to preserve lifetime commission tracking
  const { data: referralInfo } = useQuery({
    queryKey: ["my-referral-info"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("referral_links")
        .select("referred_by, level1_referrer, level2_referrer, level3_referrer")
        .eq("user_id", user.id)
        .single();
      return data;
    },
  });

  const handleUpgrade = async (planId: string, planPrice: number) => {
    setUpgrading(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para fazer upgrade");
        navigate("/login");
        return;
      }

      // The referral tree is already stored in referral_links — 
      // any new payment will automatically trigger commissions for the original referrer
      // through the process-affiliate-commissions edge function.
      // We just need to navigate to checkout with the plan info.

      toast.info(`Redirecionando para upgrade do plano ${planId.charAt(0).toUpperCase() + planId.slice(1)}...`);

      // Navigate to checkout with upgrade info
      navigate(`/checkout?upgrade=${planId}&price=${planPrice}&from=${currentPlan}`);
    } catch (error) {
      toast.error("Erro ao processar upgrade. Tente novamente.");
    } finally {
      setUpgrading(null);
    }
  };

  const currentPlanIndex = plans.findIndex((p) => p.id === currentPlan);

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Upgrade de Plano</h3>
            <p className="text-xs text-muted-foreground">Desbloqueie mais benefícios — comissão de afiliado garantida</p>
          </div>
        </div>

        {referralInfo?.referred_by && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-bold">
                Comissão vitalícia ativa — seu afiliado recebe comissão em cada upgrade!
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plans.map((plan, index) => {
            const isCurrentPlan = plan.id === currentPlan;
            const isDowngrade = index <= currentPlanIndex;
            const canUpgrade = !isCurrentPlan && !isDowngrade;

            return (
              <div
                key={plan.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrentPlan
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : canUpgrade
                    ? "border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
                    : "border-border/50 bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" style={{ color: plan.color }} />
                    <span className="font-bold text-sm text-foreground">{plan.name}</span>
                  </div>
                  {isCurrentPlan && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Atual</Badge>
                  )}
                  {plan.popular && !isCurrentPlan && (
                    <Badge className="bg-primary text-primary-foreground text-[10px]">Popular</Badge>
                  )}
                </div>

                <p className="text-2xl font-black text-foreground mb-2">
                  R$ {plan.price}<span className="text-xs font-normal text-muted-foreground">/mês</span>
                </p>

                <ul className="space-y-1 mb-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {canUpgrade && (
                  <Button
                    size="sm"
                    className="w-full font-bold text-xs"
                    onClick={() => handleUpgrade(plan.id, plan.price)}
                    disabled={upgrading === plan.id}
                  >
                    {upgrading === plan.id ? (
                      "Processando..."
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-1" /> Fazer Upgrade
                      </>
                    )}
                  </Button>
                )}

                {isCurrentPlan && (
                  <p className="text-center text-[10px] text-primary font-bold">Seu plano atual</p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-4">
          💡 Ao fazer upgrade, a comissão do afiliado que te indicou é recalculada automaticamente sobre o novo valor.
        </p>
      </CardContent>
    </Card>
  );
}
