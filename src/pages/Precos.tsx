import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const Precos = () => {
  const plans = [
    {
      name: "Start",
      price: "R$ 29,90",
      period: "/mês",
      tag: "START",
      description: "Acesso básico à plataforma e comunidade",
      features: [
        "Acesso ao app + suporte",
        "Biblioteca de conteúdos",
        "Cupons em parceiros",
        "Link de indicação",
      ],
      highlighted: false,
    },
    {
      name: "Pro",
      price: "R$ 59,90",
      period: "/mês",
      tag: "POPULAR",
      description: "Para quem quer atendimento prioritário",
      features: [
        "Todos benefícios Start",
        "Prioridade no suporte",
        "Consulta com desconto",
        "Relatórios avançados",
        "API de integração",
      ],
      highlighted: true,
    },
    {
      name: "Império",
      price: "R$ 99,90",
      period: "/mês",
      tag: "VIP",
      description: "Experiência premium com concierge dedicado",
      features: [
        "Todos benefícios Pro",
        "Concierge (humano + IA)",
        "Acesso VIP a parceiros",
        "Marketplace com desconto",
        "Gestor dedicado",
        "Treinamento exclusivo",
      ],
      highlighted: false,
    },
  ];

  const faqs = [
    { q: "Posso mudar de plano depois?", a: "Sim! Upgrade ou downgrade a qualquer momento, sem burocracia." },
    { q: "O pagamento é somente via Pix?", a: "Sim. Utilizamos Pix via Mercado Pago com confirmação automática por webhook." },
    { q: "Existe taxa de setup?", a: "Não! Todos os planos são mensais sem taxas adicionais." },
    { q: "Como funciona a indicação?", a: "Você ganha comissão por venda real (assinatura, consulta ou marketplace), com antifraude e auditoria." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              Planos com <span className="text-gradient-gold">Preço Justo</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Modelo sustentável para manter acesso democrático. Pagamento via Pix.
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {plans.map((plan, index) => (
              <motion.div key={index} variants={fadeUp}>
                <Card className={`relative h-full border-border ${plan.highlighted ? 'border-primary/50 glow-gold scale-105' : ''}`}>
                  {plan.tag && (
                    <div className={`absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold ${plan.highlighted ? 'bg-gradient-gold border border-gold text-primary' : 'bg-card border border-border text-muted-foreground'}`}>
                      {plan.tag}
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-display font-bold text-foreground mb-1">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-display font-bold text-gradient-gold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full font-bold ${plan.highlighted ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground' : 'bg-gradient-to-r from-primary/20 to-primary/10 border border-gold text-primary hover:from-primary/30'}`}
                      asChild
                    >
                      <a
                        href={`https://wa.me/5511987131241?text=Olá!%20Quero%20assinar%20o%20plano%20${encodeURIComponent(plan.name)}%20da%20Planta%20%26%20Raiz`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Assinar via Pix
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="mt-12 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="flex flex-wrap justify-center gap-6">
              {["✓ Pagamento via Pix", "✓ Cancelamento a qualquer momento", "✓ Conformidade LGPD", "✓ Comissão por indicação"].map((item, i) => (
                <span key={i} className="text-sm font-bold text-muted-foreground">{item}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Affiliate section */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Users size={48} className="text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Programa de <span className="text-gradient-gold">Indicação</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Ganhe comissão por venda real — assinaturas, consultas ou marketplace. Até 3 níveis de indicação com antifraude e auditoria.
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
                    <p className="text-2xl font-display font-bold text-gradient-gold">{l.pct}</p>
                    <p className="text-xs text-muted-foreground">{l.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {["Antifraude automático", "Sem autoindicação", "Comissão por venda real", "Painel de acompanhamento"].map((item) => (
                <span key={item} className="px-3 py-1.5 rounded-full text-xs font-bold border border-border bg-card text-muted-foreground">{item}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">Dúvidas sobre Planos</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
            Ainda tem dúvidas? Vamos conversar!
          </h2>
          <Button size="lg" className="font-bold bg-gradient-to-r from-secondary/20 to-secondary/10 border border-green text-secondary hover:from-secondary/30" asChild>
            <a href="https://wa.me/5511987131241?text=Olá!%20Tenho%20dúvidas%20sobre%20os%20planos%20da%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
              Falar com Especialista <ArrowRight size={20} className="ml-2" />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Precos;
