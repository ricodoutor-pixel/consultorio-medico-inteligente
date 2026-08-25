import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Check, Zap, Building2, Stethoscope, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    id: "free",
    name: "Plano Free",
    price: 0,
    priceUSD: 0,
    icon: Stethoscope,
    color: "border-border/50",
    highlight: false,
    vip: false,
    multiplier: "1.0×",
    tagline: "GRATUITO",
    features: [
      "Taxa sobre consulta",
      "Prontuário básico",
      "Sem selo de destaque"
    ],
  },
  {
    id: "basic",
    name: "Plano VIP",
    price: 99,
    priceUSD: 19,
    icon: Sparkles,
    color: "border-primary/40",
    highlight: true,
    vip: true,
    multiplier: "1.5×",
    tagline: "TAXA ZERO",
    features: [
      "Taxa de intermediação 0%",
      "Selo VIP no Perfil",
      "Prioridade na triagem IA"
    ],
  },
  {
    id: "professional",
    name: "Profissional",
    price: 299,
    priceUSD: 59,
    icon: Crown,
    color: "border-emerald-500/40",
    highlight: false,
    vip: true,
    multiplier: "2.0×",
    tagline: "COMPLETO",
    features: [
      "Todas as vantagens VIP",
      "Dashboard BI Completo",
      "Gestão de pacientes"
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 599,
    priceUSD: 119,
    icon: Crown,
    color: "border-amber-500/40",
    highlight: false,
    vip: true,
    multiplier: "3.0×",
    tagline: "EXCLUSIVO",
    features: [
      "Todas as vantagens Profissional",
      "Prioridade Ouro na Busca",
      "Suporte Especializado 24h"
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 1500,
    priceUSD: 299,
    icon: Building2,
    color: "border-purple-500/40",
    highlight: false,
    vip: true,
    multiplier: "5.0×",
    tagline: "CORPORATE",
    features: [
      "Multiclínicas",
      "Whitelabel",
      "Integração API"
    ],
  }
];



interface Props {
  doctorId: string;
  currentTier: string;
  onTierChange?: (tier: string) => void;
}

export const DoctorSubscriptionPlans = ({ doctorId, currentTier, onTierChange }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, amount: number | null) => {
    if (planId === "enterprise") {
      window.open(
        `https://wa.me/5511991363154?text=${encodeURIComponent("Olá! Tenho interesse no Plano Enterprise para médicos.")}`,
        "_blank"
      );
      return;
    }

    setLoading(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Faça login primeiro", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-doctor-subscription", {
        body: { planId, doctorId },
      });

      if (error) throw error;
      if (data?.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err: any) {
      toast({ title: "Erro ao processar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const simulateTierChange = (planId: string) => {
    onTierChange?.(planId);
  };

  return (
    <div>
      <h3 className="font-display font-black text-xl text-foreground mb-1 flex items-center gap-2">
        <Crown size={20} className="text-amber-400" /> Planos de Assinatura Médica
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Escolha seu plano e aumente sua participação na distribuição de renda.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
        {PLANS.map((plan) => {
          const isActive = plan.id === currentTier;
          return (
            <motion.div key={plan.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
              onHoverStart={() => simulateTierChange(plan.id)}
              onHoverEnd={() => simulateTierChange(currentTier)}
            >
              <Card
                className={`relative overflow-hidden transition-all ${plan.color} ${
                  plan.highlight ? "ring-2 ring-primary/50 shadow-lg shadow-primary/10" : ""
                } ${isActive ? "ring-2 ring-primary/60" : ""}`}
              >
                {plan.vip && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-emerald-400" />
                )}
                {isActive && (
                  <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px]">
                    Atual
                  </Badge>
                )}
                {plan.tagline && !isActive && (
                  <Badge className="absolute top-3 right-3 text-[10px] font-black bg-primary/20 text-primary border-primary/30">
                    {plan.tagline}
                  </Badge>
                )}
                <CardContent className="p-5">
                  <plan.icon
                    size={28}
                    className={plan.vip ? "text-primary" : "text-muted-foreground"}
                  />
                  <h4 className="font-display font-black text-lg text-foreground mt-3 flex items-center gap-2">
                    {plan.name}
                    {plan.vip && <Sparkles size={14} className="text-primary" />}
                  </h4>
                  <div className="mt-1 mb-4">
                    {plan.price > 0 ? (
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl font-display font-black text-foreground">
                          R$ {plan.price}
                          <span className="text-xs text-muted-foreground font-normal">/mês</span>
                        </span>
                        <span className="text-xs text-muted-foreground">ou US$ {plan.priceUSD}/mês</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-display font-black text-foreground">
                        Grátis
                        <span className="text-xs text-muted-foreground font-normal ml-2">taxa 7% por consulta</span>
                      </span>
                    )}
                  </div>


                  <Badge className="bg-amber-500/10 text-amber-400 text-xs mb-4 border-amber-500/20">
                    Multiplicador {plan.multiplier}
                  </Badge>

                  <ul className="space-y-2 mb-5">
                    {plan.features.map((f, i) => (
                      <li key={i} className={`flex items-start gap-2 text-xs ${
                        f.startsWith("✨") ? "text-primary font-bold" : "text-muted-foreground"
                      }`}>
                        <Check size={12} className="text-primary mt-0.5 shrink-0" />
                        {f.replace("✨ ", "")}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full rounded-xl text-sm font-bold ${
                      plan.vip && !isActive
                        ? "bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-600 hover:to-primary text-white"
                        : plan.id === "premium" && !isActive
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                        : ""
                    }`}
                    variant={plan.vip || plan.id === "premium" ? "default" : isActive ? "outline" : "default"}
                    disabled={isActive || loading === plan.id}
                    onClick={() => handleSubscribe(plan.id, plan.price)}
                  >
                    {loading === plan.id
                      ? "Processando..."
                      : isActive
                      ? "Plano Atual"
                      : plan.id === "enterprise"
                      ? "Falar com Vendas"
                      : "Assinar Agora"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* VIP Explanation */}
      <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={24} className="text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="font-display font-black text-foreground mb-1">Plano Médico VIP — Taxa Zero</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No Plano VIP, você retém <span className="text-primary font-bold">100% dos seus honorários</span>. 
              A taxa de intermediação é <span className="text-primary font-bold">0%</span> — a tecnologia trabalha para você. 
              Concentre-se no que importa: cuidar dos seus pacientes. A plataforma cuida do resto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
