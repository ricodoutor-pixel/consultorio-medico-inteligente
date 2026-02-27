import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const Precos = () => {
  const plans = [
    {
      id: "essencial",
      name: "Essencial",
      price: "R$ 50",
      priceValue: 5000,
      period: "/mês",
      tag: "START",
      description: "Acesso à biblioteca científica + Chat IA Verdinho 24/7 + pré-entrevista gratuita.",
      features: [
        "Acesso à biblioteca científica",
        "Chat IA Verdinho 24/7",
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
  ];

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

          <motion.div className="grid md:grid-cols-3 gap-6 max-w-5xl" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {plans.map((plan) => (
              <motion.div key={plan.id} variants={fadeUp}>
                <Card className={`relative h-full border-border ${plan.highlighted ? 'border-primary/50 glow-green scale-[1.03]' : ''}`}>
                  {plan.tag && (
                    <div className={`absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-black ${plan.highlighted ? 'bg-gradient-green border border-green text-primary' : 'bg-card border border-border text-muted-foreground'}`}>
                      {plan.tag}
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-display font-black text-foreground mb-1">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-display font-black text-gradient-green">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full font-black rounded-2xl ${plan.highlighted ? 'bg-primary text-primary-foreground' : 'bg-gradient-green border border-green text-primary hover:bg-primary/20'}`}
                      asChild
                    >
                      <a href={(plan as any).checkoutUrl} target="_blank" rel="noopener noreferrer">
                        Assinar Agora
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="mt-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="flex flex-wrap gap-6">
              {["✓ Pagamento via Pix", "✓ Cancelamento livre", "✓ Conformidade LGPD", "✓ Comissão por indicação"].map((item, i) => (
                <span key={i} className="text-sm font-bold text-muted-foreground">{item}</span>
              ))}
            </div>
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
