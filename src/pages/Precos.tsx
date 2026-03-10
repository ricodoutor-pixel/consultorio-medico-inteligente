import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Users, Stethoscope, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const Precos = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const plans = [
    {
      id: "essencial",
      name: "Essencial",
      price: "R$ 50",
      priceValue: 5000,
      period: "/mês",
      tag: "START",
      description: "Acesso à biblioteca científica + Chat IA 24/7 + pré-entrevista gratuita.",
      features: [
        "Acesso à biblioteca científica",
        "Chat IA 24/7",
        "Pré-entrevista gratuita",
        "Recomendações personalizadas",
      ],
      highlighted: false,
      checkoutUrl: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=71c153e9de1147f796c4e9354cbaa88a",
    },
    {
      id: "acesso",
      name: "Acesso",
      price: "R$ 100",
      priceValue: 10000,
      period: "/mês",
      tag: "MAIS POPULAR",
      description: "Tudo do Essencial + consultas com profissionais + prontuário digital criptografado.",
      features: [
        "Tudo do Essencial",
        "Consultas com profissionais (1ª grátis)",
        "Prontuário digital criptografado",
        "Receitas digitais assinadas",
        "Histórico de consultas",
        "Suporte prioritário",
      ],
      highlighted: true,
      checkoutUrl: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=9d541916b1324a15a78155fa74371013",
    },
    {
      id: "familia",
      name: "Família",
      price: "R$ 250",
      priceValue: 25000,
      period: "/mês",
      tag: "MELHOR VALOR",
      description: "Tudo do Acesso + até 5 membros + relatórios de saúde mensais.",
      features: [
        "Tudo do Acesso",
        "Até 5 membros da família",
        "Compartilhamento seguro de prontuários",
        "15% desconto em consultas adicionais",
        "Acesso prioritário a novos profissionais",
        "Relatórios de saúde mensais",
      ],
      highlighted: false,
      checkoutUrl: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=97dee2a0d53c462f95296d83a1e1ce61",
    },
    {
      id: "empresas",
      name: "Empresas & Parceiros",
      price: "R$ 300",
      priceValue: 30000,
      period: "/mês",
      tag: "ENTERPRISE",
      description: "Plano completo para clínicas, farmácias, associações e parceiros estratégicos.",
      features: [
        "Tudo do Família (ilimitado)",
        "API de integração white-label",
        "Painel administrativo dedicado",
        "Onboarding e treinamento exclusivo",
        "Suporte 24/7 com gerente de conta",
        "Relatórios analíticos avançados",
        "SLA garantido de 99.9%",
        "Integração com sistemas próprios",
      ],
      highlighted: false,
      checkoutUrl: "https://mpago.la/1JsFwQs",
    },
    {
      id: "consultorio-virtual",
      name: "Consultório Virtual",
      price: "R$ 150",
      priceValue: 15000,
      period: "/mês",
      tag: "PARA MÉDICOS",
      description: "Plataforma completa de telemedicina para médicos de todo o mundo. Atenda, publique e cresça.",
      features: [
        "Uso irrestrito da telemedicina",
        "Publicação de estudos na Biblioteca Científica",
        "Acesso total à Comunidade Científica",
        "Link de referência para pacientes agendarem",
        "Consultório virtual para atendimentos externos",
        "Prontuário digital ilimitado",
        "Receitas digitais com assinatura",
        "Painel de ganhos e indicações",
        "Suporte dedicado para médicos",
      ],
      highlighted: false,
      checkoutUrl: "",
      isDoctor: true,
      useDynamicCheckout: true,
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
          <motion.div className="mb-16" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-black text-foreground mb-4 tracking-tight">
              Planos <span className="text-gradient-green">Populares</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-medium">
              Escolha um plano e clique em Assinar para ir ao pagamento Pix (Mercado Pago).
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {plans.map((plan) => {
              const isDoctor = (plan as any).isDoctor;
              return (
              <motion.div key={plan.id} variants={fadeUp}>
                <Card className={`relative h-full border-border ${plan.highlighted ? 'border-primary/50 glow-green scale-[1.03]' : ''} ${plan.id === 'empresas' ? 'border-secondary/40 bg-gradient-purple' : ''} ${isDoctor ? 'border-blue-500/50 bg-gradient-to-b from-blue-950/30 to-background' : ''}`}>
                  {plan.tag && (
                    <div className={`absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-black ${plan.highlighted ? 'bg-gradient-green border border-green text-primary' : plan.id === 'empresas' ? 'bg-secondary/20 border border-secondary/30 text-secondary' : isDoctor ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400' : 'bg-card border border-border text-muted-foreground'}`}>
                      {isDoctor && <Stethoscope size={12} className="inline mr-1 -mt-0.5" />}
                      {plan.tag}
                    </div>
                  )}
                  <CardContent className="p-6">
                    {isDoctor && <Stethoscope size={28} className="text-blue-400 mb-2" />}
                    <h3 className="text-xl font-display font-black text-foreground mb-1">{plan.name}</h3>
                    <div className="mb-2">
                      <span className={`text-4xl font-display font-black ${isDoctor ? 'text-blue-400' : plan.id === 'empresas' ? 'text-gradient-purple text-2xl' : 'text-gradient-green'}`}>{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 size={16} className={`${isDoctor ? 'text-blue-400' : plan.id === 'empresas' ? 'text-secondary' : 'text-primary'} shrink-0 mt-0.5`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {(plan as any).useDynamicCheckout ? (
                      <Button
                        className={`w-full font-black rounded-2xl bg-blue-500 text-white hover:bg-blue-600`}
                        onClick={() => handleDynamicCheckout(plan.id)}
                        disabled={loadingPlan === plan.id}
                      >
                        {loadingPlan === plan.id ? (
                          <><Loader2 size={16} className="mr-2 animate-spin" /> Gerando link...</>
                        ) : (
                          <>Assinar Consultório <ArrowRight size={16} className="ml-2" /></>
                        )}
                      </Button>
                    ) : (
                      <Button
                        className={`w-full font-black rounded-2xl ${plan.id === 'empresas' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : plan.highlighted ? 'bg-primary text-primary-foreground' : 'bg-gradient-green border border-green text-primary hover:bg-primary/20'}`}
                        asChild
                      >
                        <a href={plan.checkoutUrl} target="_blank" rel="noopener noreferrer">
                          Assinar Agora <ArrowRight size={16} className="ml-2" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              );
            })}
          </motion.div>

          <motion.div className="mt-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="flex flex-wrap gap-6 mb-8">
              {["✓ Pagamento via Pix", "✓ Cancelamento livre", "✓ Conformidade LGPD", "✓ Comissão por indicação"].map((item, i) => (
                <span key={i} className="text-sm font-bold text-muted-foreground">{item}</span>
              ))}
            </div>
            <motion.a
              href="https://doutorpark.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-display font-black text-lg cursor-pointer border-2 border-transparent"
              style={{
                background: 'linear-gradient(135deg, hsl(45 100% 50%), hsl(30 100% 55%), hsl(15 100% 50%))',
                color: '#1a0a00',
                boxShadow: '0 0 30px hsl(45 100% 50% / 0.5), 0 0 60px hsl(30 100% 55% / 0.3), 0 4px 20px rgba(0,0,0,0.3)',
                textShadow: '0 1px 2px rgba(255,255,255,0.3)',
              }}
              whileHover={{ scale: 1.07, boxShadow: '0 0 50px hsl(45 100% 50% / 0.7), 0 0 80px hsl(30 100% 55% / 0.4), 0 8px 30px rgba(0,0,0,0.4)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300 }}
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
          <motion.div className="max-w-3xl" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Users size={48} className="text-secondary mb-4" />
            <h2 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
              Programa de <span className="text-gradient-purple">Indicação</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed font-medium">
              Ganhe comissão por venda real — assinaturas, consultas ou Shopping. Sem promessa de retorno financeiro.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { level: "1º Nível", pct: "25%", desc: "da taxa da plataforma" },
                { level: "2º Nível", pct: "10%", desc: "da taxa da plataforma" },
                { level: "3º Nível", pct: "5%", desc: "da taxa da plataforma" },
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
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
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
    </div>
  );
};

export default Precos;
