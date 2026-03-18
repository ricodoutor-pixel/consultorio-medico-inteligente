import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Users, Stethoscope, Loader2, Bitcoin, Crown, Store, Building2, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BTCPaymentModal } from "@/components/BTCPaymentModal";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const Precos = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [btcModal, setBtcModal] = useState<{ open: boolean; planName: string; planId: string; amount: string }>({ open: false, planName: "", planId: "", amount: "" });

  const plans = [
    {
      id: "usuario",
      name: "Usuário",
      price: "R$ 29",
      priceValue: 2900,
      period: "/mês",
      tag: "PACIENTE",
      icon: Heart,
      description: "Isenção de taxa no shopping e prioridade de triagem com a Brisa IA.",
      features: [
        "Isenção de taxa de 5% no Shopping",
        "Prioridade na triagem Brisa IA",
        "Chat IA 24/7 ilimitado",
        "Biblioteca Científica completa",
        "Prontuário digital criptografado",
        "Recomendações personalizadas",
      ],
      highlighted: false,
      checkoutUrl: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=71c153e9de1147f796c4e9354cbaa88a",
    },
    {
      id: "lojista-pro",
      name: "Lojista Pro",
      price: "R$ 49",
      priceValue: 4900,
      period: "/mês",
      tag: "VENDEDOR",
      icon: Store,
      description: "Taxa de venda zero e destaque nas recomendações do Verdinho.",
      features: [
        "Taxa de venda ZERO no Shopping",
        "Destaque nas recomendações IA",
        "Até 10 produtos cadastrados",
        "3 fotos por produto",
        "Dashboard de vendas em tempo real",
        "Suporte prioritário Verdinho",
        "Selo de loja verificada",
      ],
      highlighted: false,
      checkoutUrl: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=9d541916b1324a15a78155fa74371013",
    },
    {
      id: "medico-vip",
      name: "Médico VIP",
      price: "R$ 99",
      priceValue: 9900,
      period: "/mês",
      tag: "MAIS POPULAR",
      icon: Stethoscope,
      description: "Receba 100% do valor da consulta + selo de verificação premium.",
      features: [
        "100% do valor da consulta (taxa zero)",
        "Selo de Médico Verificado",
        "Telemedicina ilimitada",
        "Prontuário digital ilimitado",
        "Receitas digitais com assinatura",
        "Publicação na Biblioteca Científica",
        "Painel de ganhos e indicações",
        "Suporte dedicado 24/7",
      ],
      highlighted: true,
      checkoutUrl: "",
      useDynamicCheckout: true,
    },
    {
      id: "empresa-parceiros",
      name: "Empresa & Parceiros",
      price: "R$ 149",
      priceValue: 14900,
      period: "/mês",
      tag: "ENTERPRISE",
      icon: Building2,
      description: "Banners publicitários, relatórios de mercado e API white-label.",
      features: [
        "Banners publicitários na plataforma",
        "Relatórios de mercado mensais",
        "API de integração white-label",
        "Painel administrativo dedicado",
        "Onboarding e treinamento",
        "Suporte 24/7 com gerente de conta",
        "SLA garantido 99.9%",
      ],
      highlighted: false,
      checkoutUrl: "https://mpago.la/1JsFwQs",
    },
    {
      id: "clinica-familia",
      name: "Clínica Família",
      price: "R$ 195",
      priceValue: 19500,
      period: "/mês",
      tag: "PREMIUM",
      icon: Crown,
      description: "Todos os benefícios + 5 perfis familiares + isenção de taxa de saque.",
      features: [
        "Todos os benefícios anteriores",
        "Até 5 perfis familiares",
        "Isenção total de taxa de saque",
        "Taxa ZERO em consultas e shopping",
        "Compartilhamento de prontuários",
        "Relatórios de saúde mensais",
        "Acesso prioritário a novos recursos",
        "Gerente de conta dedicado",
      ],
      highlighted: false,
      checkoutUrl: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=97dee2a0d53c462f95296d83a1e1ce61",
    },
  ];

  const handleDynamicCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { planId, payerEmail: "" },
      });
      if (error) throw error;
      if (data?.init_point) {
        window.open(data.init_point, "_blank");
      } else {
        toast.error("Erro ao gerar link de pagamento");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="mb-16 text-center" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-black text-foreground mb-4 tracking-tight">
              Planos <span className="text-gradient-green">SaaS</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Escolha o plano ideal para seu perfil. Pagamento via Pix (Mercado Pago) ou BTC.
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 max-w-7xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <motion.div key={plan.id} variants={fadeUp}>
                  <Card className={`relative h-full border-border transition-all hover:-translate-y-1 ${plan.highlighted ? 'border-primary/50 glow-green scale-[1.03]' : ''} ${plan.id === 'clinica-familia' ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-background' : ''} ${plan.id === 'empresa-parceiros' ? 'border-secondary/40 bg-gradient-purple' : ''}`}>
                    {plan.tag && (
                      <div className={`absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-black ${
                        plan.highlighted ? 'bg-gradient-green border border-green text-primary' :
                        plan.id === 'clinica-familia' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' :
                        plan.id === 'empresa-parceiros' ? 'bg-secondary/20 border border-secondary/30 text-secondary' :
                        'bg-card border border-border text-muted-foreground'
                      }`}>
                        {plan.tag}
                      </div>
                    )}
                    <CardContent className="p-5">
                      <Icon size={28} className={`mb-2 ${
                        plan.highlighted ? 'text-primary' :
                        plan.id === 'clinica-familia' ? 'text-amber-400' :
                        plan.id === 'empresa-parceiros' ? 'text-secondary' :
                        'text-muted-foreground'
                      }`} />
                      <h3 className="text-lg font-display font-black text-foreground mb-1">{plan.name}</h3>
                      <div className="mb-2">
                        <span className={`text-3xl font-display font-black ${
                          plan.highlighted ? 'text-gradient-green' :
                          plan.id === 'clinica-familia' ? 'text-amber-400' :
                          plan.id === 'empresa-parceiros' ? 'text-gradient-purple' :
                          'text-foreground'
                        }`}>{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{plan.description}</p>
                      <ul className="space-y-2 mb-5">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${
                              plan.highlighted ? 'text-primary' :
                              plan.id === 'clinica-familia' ? 'text-amber-400' :
                              plan.id === 'empresa-parceiros' ? 'text-secondary' :
                              'text-primary/60'
                            }`} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {(plan as any).useDynamicCheckout ? (
                        <Button
                          className="w-full font-black rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                          onClick={() => handleDynamicCheckout(plan.id)}
                          disabled={loadingPlan === plan.id}
                        >
                          {loadingPlan === plan.id ? (
                            <><Loader2 size={14} className="mr-2 animate-spin" /> Gerando...</>
                          ) : (
                            <>Assinar <ArrowRight size={14} className="ml-1" /></>
                          )}
                        </Button>
                      ) : (
                        <Button
                          className={`w-full font-black rounded-2xl text-sm ${
                            plan.id === 'clinica-familia' ? 'bg-amber-500 text-black hover:bg-amber-400' :
                            plan.id === 'empresa-parceiros' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' :
                            plan.highlighted ? 'bg-primary text-primary-foreground' :
                            'bg-gradient-green border border-green text-primary hover:bg-primary/20'
                          }`}
                          asChild
                        >
                          <a href={plan.checkoutUrl} target="_blank" rel="noopener noreferrer">
                            Assinar <ArrowRight size={14} className="ml-1" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full mt-2 font-black rounded-2xl border-amber-500/40 text-amber-500 hover:bg-amber-500/10 text-xs h-8"
                        onClick={() => setBtcModal({ open: true, planName: plan.name, planId: plan.id, amount: plan.price })}
                      >
                        <Bitcoin size={12} className="mr-1" /> Pagar BTC
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Comparison highlights */}
          <motion.div className="mt-12 flex flex-wrap justify-center gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            {["✓ Pagamento via Pix", "✓ Cancelamento livre", "✓ Conformidade LGPD", "✓ Frete grátis obrigatório", "✓ Comissão por indicação"].map((item, i) => (
              <span key={i} className="text-sm font-bold text-muted-foreground">{item}</span>
            ))}
          </motion.div>

          <motion.div className="mt-8 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <motion.a
              href="https://doutorpark.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-display font-black text-lg cursor-pointer border-2 border-transparent"
              style={{
                background: 'linear-gradient(135deg, hsl(45 100% 50%), hsl(30 100% 55%), hsl(15 100% 50%))',
                color: '#1a0a00',
                boxShadow: '0 0 30px hsl(45 100% 50% / 0.5), 0 0 60px hsl(30 100% 55% / 0.3), 0 4px 20px rgba(0,0,0,0.3)',
              }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
            >
              🌿 Invista Em Cannabis Medicinal <ArrowRight size={22} />
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Affiliate section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple pointer-events-none opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Users size={48} className="text-secondary mb-4 mx-auto" />
            <h2 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
              Programa de <span className="text-gradient-purple">Afiliados</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed font-medium">
              Ganhe comissão sobre vendas reais — 3 níveis de indicação.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { level: "Nível 1", pct: "50%", desc: "comissão direta" },
                { level: "Nível 2", pct: "5%", desc: "sub-indicação" },
                { level: "Nível 3", pct: "2%", desc: "rede expandida" },
              ].map((l, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{l.level}</p>
                    <p className="text-2xl font-display font-black text-gradient-purple">{l.pct}</p>
                    <p className="text-xs text-muted-foreground">{l.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Taxa de saque: 5% (isento para Plano Clínica Família)</p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 hero-glow">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-black text-foreground mb-6 tracking-tight">
            Ainda tem dúvidas?
          </h2>
          <Button size="lg" className="font-black bg-primary text-primary-foreground rounded-2xl h-14 px-8" asChild>
            <Link to="/falar-com-especialista">
              Falar com Especialista <ArrowRight size={20} className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
      <BTCPaymentModal
        open={btcModal.open}
        onClose={() => setBtcModal({ ...btcModal, open: false })}
        planName={btcModal.planName}
        planId={btcModal.planId}
        amount={btcModal.amount}
      />
    </div>
  );
};

export default Precos;
