import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Stethoscope, ShoppingBag, Shield, MessageSquare, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const ComoFunciona = () => {
  const steps = [
    {
      icon: Zap,
      title: "1. Cadastro + Triagem",
      desc: "Crie sua conta, responda o questionário guiado e nossa IA gera um resumo para o profissional — sem diagnóstico, apenas organização.",
      items: ["Cadastro simples por telefone ou email", "Questionário de saúde guiado", "Resumo automático com IA", "Consentimentos LGPD"],
    },
    {
      icon: Stethoscope,
      title: "2. Escolha do Profissional + Consulta",
      desc: "Filtre por especialidade, idioma, preço e avaliação. Pague via Pix e consulte por chat ou vídeo diretamente no app.",
      items: ["Filtros avançados (especialidade, preço, avaliação)", "Agenda online em tempo real", "Pagamento Pix com QR code", "Chat + vídeo HD integrado"],
    },
    {
      icon: FileText,
      title: "3. Prescrição + Documentos",
      desc: "Após avaliação individual, o profissional emite prescrição quando aplicável. Tudo fica no seu histórico digital.",
      items: ["Prescrição digital segura", "Histórico completo de documentos", "Anexo de exames e laudos", "Receitas acessíveis a qualquer momento"],
    },
    {
      icon: ShoppingBag,
      title: "4. Marketplace + Entrega",
      desc: "Encontre produtos, suplementos e itens de bem-estar de lojas parceiras verificadas. Checkout via Pix.",
      items: ["Catálogo multi-vendor", "Lojas e farmácias verificadas", "Checkout com Pix Mercado Pago", "Acompanhamento do pedido"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[10%] w-[500px] h-[300px] rounded-full bg-secondary/8 blur-[100px]" />
          <div className="absolute top-[30%] right-[10%] w-[400px] h-[250px] rounded-full bg-primary/8 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div className="text-center mb-16" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              Como <span className="text-gradient-gold">Funciona</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Do cadastro à entrega — um fluxo simples, seguro e transparente
            </p>
          </motion.div>

          <motion.div className="space-y-12 max-w-4xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border hover:border-primary/30 transition-colors overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className={`w-14 h-14 rounded-2xl ${i % 2 === 0 ? 'bg-gradient-gold border-gold' : 'bg-gradient-green border-green'} border flex items-center justify-center shrink-0`}>
                        <step.icon size={28} className={i % 2 === 0 ? 'text-primary' : 'text-secondary'} />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-display font-bold text-foreground mb-3">{step.title}</h2>
                        <p className="text-muted-foreground mb-4 leading-relaxed">{step.desc}</p>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {step.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Security section */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Shield size={48} className="text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Segurança e Compliance</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Seus dados são protegidos com criptografia de ponta. Estamos em total conformidade com a LGPD.
              Prescrição e conduta clínica dependem exclusivamente de avaliação individual por profissional habilitado.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {["LGPD Compliant", "Criptografia E2E", "Antifraude", "Auditoria"].map((badge) => (
                <span key={badge} className="px-4 py-2 rounded-full text-sm font-bold border border-border bg-card text-muted-foreground">
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
            Pronto Para Começar?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Inicie sua jornada de saúde com profissionais qualificados e tecnologia de ponta
          </p>
          <Button size="lg" className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" asChild>
            <a href="https://wa.me/5511987131241?text=Olá!%20Quero%20começar%20na%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
              Começar Agora <ArrowRight size={20} className="ml-2" />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ComoFunciona;
