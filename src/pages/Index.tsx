import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Leaf, Stethoscope, ShoppingBag, Users, Star, ChevronRight, Play, Shield, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const Index = () => {
  const testimonials = [
    { name: "Mariana S.", age: "32 anos", quote: "Melhorei o sono e a ansiedade com orientação profissional. Processo super simples." },
    { name: "Rafael M.", age: "28 anos", quote: "Consulta por chat e tudo registrado. Bem mais prático que ir presencialmente." },
    { name: "Juliana P.", age: "41 anos", quote: "Encontrei produtos e alternativas em um único lugar, com preço justo." },
    { name: "André L.", age: "36 anos", quote: "Transparência e suporte. Isso me deu confiança para iniciar o tratamento." },
    { name: "Patrícia R.", age: "30 anos", quote: "Jornada simples: triagem, consulta e acompanhamento. Recomendo!" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[600px] h-[400px] rounded-full bg-secondary/10 blur-[120px]" />
          <div className="absolute top-[25%] right-[10%] w-[500px] h-[350px] rounded-full bg-primary/10 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div className="max-w-4xl mx-auto text-center" initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-gradient-gold border border-gold rounded-full px-4 py-2 text-sm font-bold text-primary mb-6">
              <Leaf size={16} />
              PLATAFORMA COMPLETA • SAÚDE • MARKETPLACE
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-6">
              Universalize o acesso à{" "}
              <span className="text-gradient-gold">cannabis medicinal</span>{" "}
              com experiência premium
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Triagem inteligente, escolha do profissional mais qualificado, consulta por vídeo, prescrição quando aplicável e marketplace completo. Tudo via Pix.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground animate-pulse-gold" asChild>
                <a href="https://wa.me/5511987131241?text=Olá!%20Quero%20assinar%20a%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
                  Assinar e Iniciar <ArrowRight size={20} className="ml-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg border-border hover:bg-muted" asChild>
                <a href="/como-funciona">
                  <Play size={18} className="mr-2" /> Ver Como Funciona
                </a>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
              {["PWA Android", "Pix Mercado Pago", "Consulta + Receita", "Marketplace Multi-vendor", "Indicação por Venda Real"].map((pill) => (
                <span key={pill} className="px-3 py-1.5 rounded-full text-xs font-bold text-muted-foreground border border-border bg-card/50">
                  {pill}
                </span>
              ))}
            </motion.div>

            <motion.p variants={fadeUp} className="mt-6 text-xs text-muted-foreground max-w-lg mx-auto">
              ● Transparência total: plataforma baseada em serviços/produtos reais. Prescrição depende de avaliação individual.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Como Funciona</h2>
            <p className="text-muted-foreground text-lg">Fluxo simples e rápido — do cadastro à entrega</p>
          </motion.div>

          <motion.div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { step: "1", icon: Zap, title: "Triagem Inteligente", desc: "Questionário guiado com IA que gera resumo automático para o profissional — sem diagnóstico, apenas organização." },
              { step: "2", icon: Stethoscope, title: "Consulta + Receita", desc: "Escolha o profissional, pague via Pix e consulte por chat ou vídeo. Receita e documentos ficam no app." },
              { step: "3", icon: ShoppingBag, title: "Marketplace + Acompanhamento", desc: "Produtos, lojas parceiras, suplementos e bem-estar. Mais opções e preço justo para quem precisa." },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp}>
                <Card className="h-full border-border hover:border-primary/30 transition-colors group">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-green border border-green flex items-center justify-center mb-4 font-display font-bold text-secondary">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Ecossistema Completo</h2>
            <p className="text-muted-foreground text-lg">Telemedicina + Marketplace + Profissionais + Assinatura + Indicação</p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { icon: Stethoscope, title: "Telemedicina", desc: "Chat + vídeo, prontuário, anexos e recibos. Tudo em conformidade.", color: "primary" },
              { icon: ShoppingBag, title: "Marketplace Multi-vendor", desc: "Lojas, farmácias, suplementos e bem-estar. Checkout via Pix.", color: "secondary" },
              { icon: Users, title: "Profissionais Verificados", desc: "Currículo, documentos, especialidades, avaliações e ranking.", color: "primary" },
              { icon: Shield, title: "Segurança & LGPD", desc: "Criptografia, consentimentos e dados protegidos por lei.", color: "secondary" },
              { icon: Star, title: "Programa de Indicação", desc: "Comissão por venda real — assinatura, consulta ou marketplace.", color: "primary" },
              { icon: Zap, title: "IA & Automações", desc: "Triagem com IA, suporte inteligente, detecção de compliance.", color: "secondary" },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border hover:border-primary/30 transition-all hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${f.color === 'primary' ? 'bg-gradient-gold border-gold' : 'bg-gradient-green border-green'} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <f.icon size={24} className={f.color === 'primary' ? 'text-primary' : 'text-secondary'} />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Relatos de Pacientes</h2>
            <p className="text-muted-foreground">Experiências reais de quem já usa a plataforma</p>
          </motion.div>

          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/40 to-primary/30 border border-border flex items-center justify-center font-bold text-sm text-foreground">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.age}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">"{t.quote}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Plans preview */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Planos com <span className="text-gradient-gold">Preço Justo</span>
            </h2>
            <p className="text-muted-foreground">Modelo sustentável para manter acesso democrático</p>
          </motion.div>

          <motion.div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { name: "Start", price: "R$ 29,90", tag: "", features: ["Acesso ao app + suporte", "Biblioteca de conteúdos", "Cupons em parceiros"] },
              { name: "Pro", price: "R$ 59,90", tag: "POPULAR", features: ["Benefícios Start", "Prioridade no suporte", "Consulta com desconto"] },
              { name: "Império", price: "R$ 99,90", tag: "VIP", features: ["Benefícios Pro", "Concierge (humano+IA)", "Acesso VIP a parceiros"] },
            ].map((plan, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className={`h-full relative border-border ${i === 1 ? 'border-primary/50 glow-gold' : ''}`}>
                  {plan.tag && (
                    <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-gold border border-gold text-primary text-xs font-bold">
                      {plan.tag}
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="font-display font-bold text-foreground mb-1">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-display font-bold text-gradient-gold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm"> /mês</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full bg-gradient-to-r from-primary/20 to-primary/10 border border-gold text-primary hover:from-primary/30 font-bold" asChild>
                      <a href={`https://wa.me/5511987131241?text=Olá!%20Quero%20assinar%20o%20plano%20${plan.name}%20da%20Planta%20%26%20Raiz`} target="_blank" rel="noopener noreferrer">
                        Assinar via Pix
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-8">
            <Button variant="link" className="text-primary font-bold" asChild>
              <a href="/planos">Ver todos os detalhes dos planos <ChevronRight size={16} /></a>
            </Button>
          </div>
        </div>
      </section>

      {/* Lead capture CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <motion.div className="max-w-2xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
              Comece Sua Jornada <span className="text-gradient-green">Agora</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Receba o link do app e inicie seu tratamento com profissionais qualificados
            </p>
            <Button size="lg" className="text-lg font-bold bg-gradient-to-r from-secondary/20 to-secondary/10 border border-green text-secondary hover:from-secondary/30" asChild>
              <a href="https://wa.me/5511987131241?text=Olá!%20Quero%20acessar%20a%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
                Quero Acessar Agora <ArrowRight size={20} className="ml-2" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
