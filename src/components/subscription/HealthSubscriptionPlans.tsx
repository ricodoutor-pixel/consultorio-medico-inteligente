import { useState, useEffect } from "react";
import { Check, Crown, Leaf, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
// framer-motion removido — animações na montagem desperdiçavam recursos em mobile.
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { getStripeEnvironment } from "@/lib/stripe";

const PLANS = [
  {
    id: "basic",
    name: "Essencial",
    price: 49.9,
    priceId: "essencial_mensal",
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
    priceId: "premium_mensal",
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
    priceId: "vip_mensal",
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
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSubscribe = (planId: string) => {
    if (!user) {
      toast({ title: "Faça login para assinar", variant: "destructive" });
      return;
    }
    setActivePlan(planId);
  };

  if (activePlan) {
    const plan = PLANS.find(p => p.id === activePlan)!;
    return (
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" onClick={() => setActivePlan(null)} className="mb-4">
          ← Voltar aos planos
        </Button>
        <h3 className="text-xl font-bold mb-4 text-center">Assinatura {plan.name}</h3>
        <div className="rounded-xl overflow-hidden border border-border">
          <StripeEmbeddedCheckout
            priceId={plan.priceId}
            customerEmail={user?.email}
            userId={user?.id}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLANS.map((plan, i) => (
        <div key={plan.id}>
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
                onClick={() => handleSubscribe(plan.id)}
              >
                Assinar Agora
              </Button>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
