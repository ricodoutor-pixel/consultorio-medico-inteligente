import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Check, Zap, Building2, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    id: "basic",
    name: "Básico",
    price: 99,
    icon: Stethoscope,
    color: "border-zinc-500/30",
    highlight: false,
    multiplier: "1.0×",
    features: [
      "Perfil na plataforma",
      "Até 20 consultas/mês",
      "Suporte por email",
      "Participação base nos lucros",
    ],
  },
  {
    id: "professional",
    name: "Profissional",
    price: 299,
    icon: Zap,
    color: "border-blue-500/30",
    highlight: false,
    multiplier: "1.2×",
    features: [
      "Tudo do Básico",
      "Consultas ilimitadas",
      "Destaque no ranking",
      "1.2× multiplicador de lucros",
      "Relatórios avançados",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 599,
    icon: Crown,
    color: "border-amber-500/40",
    highlight: true,
    multiplier: "1.5×",
    features: [
      "Tudo do Profissional",
      "Prioridade na triagem",
      "1.5× multiplicador de lucros",
      "Selo Premium no perfil",
      "Mentoria exclusiva",
      "API WhatsApp dedicada",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    icon: Building2,
    color: "border-purple-500/40",
    highlight: false,
    multiplier: "2.0×",
    features: [
      "Tudo do Premium",
      "2.0× multiplicador de lucros",
      "Gestão de clínica",
      "Múltiplos profissionais",
      "SLA garantido",
      "Gerente de conta dedicado",
    ],
  },
];

export const DoctorSubscriptionPlans = ({
  doctorId,
  currentTier,
}: {
  doctorId: string;
  currentTier: string;
}) => {
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

      // Call edge function to create Mercado Pago preference
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

  return (
    <div>
      <h3 className="font-display font-black text-xl text-foreground mb-1 flex items-center gap-2">
        <Crown size={20} className="text-amber-400" /> Planos de Assinatura Médica
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Escolha seu plano e aumente sua participação na distribuição de renda.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isActive = plan.id === currentTier;
          return (
            <motion.div key={plan.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card
                className={`relative overflow-hidden transition-all ${plan.color} ${
                  plan.highlight ? "ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/10" : ""
                } ${isActive ? "ring-2 ring-primary/60" : ""}`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                )}
                {isActive && (
                  <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px]">
                    Atual
                  </Badge>
                )}
                <CardContent className="p-5">
                  <plan.icon
                    size={28}
                    className={
                      plan.id === "premium"
                        ? "text-amber-400"
                        : plan.id === "enterprise"
                        ? "text-purple-400"
                        : plan.id === "professional"
                        ? "text-blue-400"
                        : "text-muted-foreground"
                    }
                  />
                  <h4 className="font-display font-black text-lg text-foreground mt-3">{plan.name}</h4>
                  <div className="mt-1 mb-4">
                    {plan.price ? (
                      <span className="text-2xl font-display font-black text-foreground">
                        R$ {plan.price}
                        <span className="text-xs text-muted-foreground font-normal">/mês</span>
                      </span>
                    ) : (
                      <span className="text-lg font-display font-black text-purple-400">Sob consulta</span>
                    )}
                  </div>

                  <Badge className="bg-amber-500/10 text-amber-400 text-xs mb-4 border-amber-500/20">
                    Multiplicador {plan.multiplier}
                  </Badge>

                  <ul className="space-y-2 mb-5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check size={12} className="text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full rounded-xl text-sm font-bold ${
                      plan.highlight
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                        : ""
                    }`}
                    variant={plan.highlight ? "default" : isActive ? "outline" : "default"}
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
    </div>
  );
};
