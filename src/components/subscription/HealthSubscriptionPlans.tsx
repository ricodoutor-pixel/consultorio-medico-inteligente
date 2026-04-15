import { useState } from "react";
import { Check, Crown, Leaf, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const PLANS = [
  {
    id: "basic",
    name: "Essencial",
    price: 49.9,
    icon: Leaf,
    badge: null,
    features: [
      "Acesso 24h à Brisa IA",
      "5% desconto no Marketplace",
      "Suporte prioritário via WhatsApp",
      "Prontuário digital completo",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 99.9,
    icon: Crown,
    badge: "Mais Popular",
    features: [
      "Tudo do Essencial",
      "15% desconto no Marketplace",
      "1 consulta trimestral inclusa",
      "Acesso ao Club Planta y Raiz",
      "Receita com renovação automática",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    price: 199.9,
    icon: Sparkles,
    badge: "Exclusivo",
    features: [
      "Tudo do Premium",
      "25% desconto no Marketplace",
      "1 consulta mensal inclusa",
      "Médico dedicado",
      "Fila prioritária 24/7",
      "Acesso antecipado a novos produtos",
    ],
  },
];

export function HealthSubscriptionPlans() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Faça login para assinar", variant: "destructive" });
        return;
      }

      const plan = PLANS.find(p => p.id === planId)!;
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      const { error } = await supabase.from("health_subscriptions").insert({
        user_id: user.id,
        plan_type: planId,
        plan_name: plan.name,
        amount: plan.price,
        billing_cycle: "monthly",
        next_billing_at: nextBilling.toISOString(),
      });

      if (error) throw error;

      toast({ title: `Assinatura ${plan.name} ativada!`, description: "Bem-vindo ao clube de saúde." });
    } catch (err) {
      toast({ title: "Erro ao assinar", description: String(err), variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLANS.map((plan, i) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className={`relative border-border/50 bg-card/80 backdrop-blur-sm h-full flex flex-col ${
            plan.badge ? "border-primary/50 shadow-lg shadow-primary/10" : ""
          }`}>
            {plan.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                <Zap className="w-3 h-3 mr-1" />
                {plan.badge}
              </Badge>
            )}
            <CardHeader className="text-center pb-2">
              <plan.icon className="w-10 h-10 mx-auto text-primary mb-2" />
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                <span className="text-muted-foreground text-sm">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-2 flex-1 mb-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-primary hover:bg-primary/90 font-bold"
                disabled={loading !== null}
                onClick={() => handleSubscribe(plan.id)}
              >
                {loading === plan.id ? "Processando..." : "Assinar Agora"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
