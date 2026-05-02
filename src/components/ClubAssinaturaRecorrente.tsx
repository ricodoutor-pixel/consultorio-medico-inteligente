import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  Crown, Zap, Shield, Star, Check, Loader2, 
  Leaf, Video, ShoppingBag, HeartPulse
} from "lucide-react";

const CLUB_PLANS = [
  {
    id: "usuario",
    name: "Paciente",
    price: 29,
    period: "/mês",
    icon: Leaf,
    color: "from-primary to-primary/80",
    popular: false,
    features: [
      "1 Orientação Técnica/mês com desconto",
      "Acesso ao Club exclusivo",
      "Conteúdo educacional premium",
      "Alertas de receita vencendo",
      "Suporte WhatsApp prioritário",
    ],
  },
  {
    id: "wellness-pro",
    name: "Bem-Estar Pro",
    price: 149,
    period: "/mês",
    icon: HeartPulse,
    color: "from-secondary to-secondary/80",
    popular: true,
    features: [
      "3 Orientações Técnicas/mês incluídas",
      "20% desconto no Shopping",
      "Acompanhamento contínuo IA",
      "Prontuário digital completo",
      "Renovação automática de receita",
      "Acesso a webinars exclusivos",
    ],
  },
  {
    id: "clinica-familia",
    name: "Família Premium",
    price: 195,
    period: "/mês",
    icon: Crown,
    color: "from-[hsl(var(--gold))] to-[hsl(var(--gold-glow))]",
    popular: false,
    features: [
      "Até 5 membros da família",
      "Orientações Técnicas ilimitadas",
      "30% desconto no Shopping",
      "Concierge médico 24/7",
      "Prioridade no matching",
      "Relatórios de evolução",
      "Frete grátis sempre",
    ],
  },
];

export const ClubAssinaturaRecorrente = () => {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Faça login primeiro", description: "Você precisa estar logado para assinar.", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { planId },
      });

      if (error) throw error;

      if (data?.init_point) {
        window.open(data.init_point, "_blank");
        toast({
          title: data.type === "recurring" ? "Assinatura recorrente criada!" : "Redirecionando para pagamento",
          description: "Complete o pagamento na janela aberta.",
        });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="w-4 h-4" /> Club Planta & Raiz
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Assine e economize com saúde
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Planos recorrentes com consultas incluídas, descontos exclusivos e acompanhamento contínuo.
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
        {CLUB_PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
          >
            <Card className={`relative overflow-hidden h-full border-2 transition-all duration-300 ${
              plan.popular ? "border-primary shadow-xl shadow-primary/20 scale-105" : "border-border hover:border-primary/50"
            }`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-secondary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-lg">
                  MAIS POPULAR
                </div>
              )}
              <CardContent className="p-6 flex flex-col h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <plan.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-foreground">R$ {plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full h-12 font-bold gap-2 ${
                    plan.popular
                      ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                      : "bg-card border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Assinar Agora
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Cancele quando quiser</span>
        <span className="flex items-center gap-1"><Star className="w-3 h-3" /> 7 dias grátis</span>
        <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Desconto exclusivo</span>
      </div>
    </section>
  );
};
