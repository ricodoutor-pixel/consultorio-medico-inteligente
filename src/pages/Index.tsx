import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Leaf, Stethoscope, ShoppingBag, Users, Star, Shield, Zap, ArrowRight, TrendingUp, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { testimonials } from "@/data/testimonials";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const marketData = [
  { year: "2020", valor: 2.8 },
  { year: "2021", valor: 4.9 },
  { year: "2022", valor: 7.1 },
  { year: "2023", valor: 12.8 },
  { year: "2024", valor: 18.3 },
  { year: "2025", valor: 28.6 },
  { year: "2026", valor: 38.1 },
  { year: "2027", valor: 52.0 },
  { year: "2028", valor: 67.4 },
];

const steps = [
  { n: "1", title: "Escolha o especialista", desc: "Navegue por categorias, veja avaliações, preços populares e perfis verificados." },
  { n: "2", title: "Pré-entrevista rápida", desc: "Preencha um formulário de 2 minutos com seu objetivo e resumo do caso." },
  { n: "3", title: "Pague via Pix", desc: "Pagamento instantâneo com QR code Mercado Pago. Confirmação automática." },
  { n: "4", title: "Receba atendimento", desc: "O profissional recebe seu resumo e inicia o atendimento (chat ou vídeo)." },
];

const faqs = [
  { q: "A Planta & Raiz vende 'cura' ou faz promessa de resultado?", a: "Não. A plataforma é de intermediação e educação. Qualquer conduta clínica depende de avaliação individual por profissional habilitado." },
  { q: "Como funciona o pagamento via Pix?", a: "Geramos cobrança Pix pela API do Mercado Pago. Você recebe QR code e/ou copia e cola. A confirmação é automática via webhook." },
  { q: "Os profissionais são verificados?", a: "Sim. Todos passam por verificação de documentos, registro profissional e qualificações antes de serem listados." },
  { q: "Posso usar a plataforma sem prescrição?", a: "Sim! Você pode consultar profissionais, usar o Shopping de bem-estar e acessar conteúdos educativos. Prescrição somente quando aplicável." },
  { q: "O que é o Shopping?", a: "É uma vitrine multi-vendor com lojas verificadas, produtos de bem-estar e preços populares. Checkout via Pix Mercado Pago." },
  { q: "A plataforma é defensável legalmente?", a: "Sim. Receita por serviço (consulta, intermediação, assinatura), sem promessa de retorno financeiro. Termos, LGPD e auditoria implementados." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      {/* Hero — Blis-inspired large typography + glow */}
      <section className="hero-glow pt-28 pb-20 md:pt-40 md:pb-32">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="max-w-5xl" initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-gradient-green border border-green rounded-full px-4 py-2 text-sm font-bold text-primary mb-8">
              <Leaf size={16} />
              PLATAFORMA POPULAR DE SAÚDE
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-foreground leading-[1.05] mb-8 tracking-tight">
              Uma nova maneira de{" "}
              <span className="text-gradient-green">acessar</span>{" "}
              saúde e{" "}
              <span className="text-gradient-purple">bem-estar</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-medium">
              Conectamos pacientes a profissionais habilitados e ao Shopping de bem-estar.
              Preços populares, Pix Mercado Pago e atendimento sem burocracia.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button size="lg" className="text-base font-black h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl" asChild>
                <Link to="/falar-com-especialista">
                  Falar com Especialista <ArrowRight size={20} className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base font-black h-14 px-8 border-border hover:bg-muted rounded-2xl" asChild>
                <Link to="/planos">
                  Ver Planos
                </Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              {["Preços populares", "Pix instantâneo", "Profissionais verificados", "Shopping multi-vendor"].map((pill) => (
                <span key={pill} className="px-4 py-2 rounded-full text-xs font-bold text-muted-foreground border border-border bg-card/60">
                  {pill}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Step by step — Blis-inspired numbered horizontal */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div className="mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl md:text-6xl font-display font-black text-foreground tracking-tight leading-tight">
              SIGA O <span className="text-gradient-green">PASSO A PASSO</span>
            </h2>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {steps.map((s) => (
              <motion.div key={s.n} variants={fadeUp} className="space-y-4">
                <div className="step-number">{s.n}</div>
                <h3 className="text-lg font-display font-black text-primary">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="mt-12 flex flex-col sm:flex-row gap-4 items-start" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Button size="lg" className="font-black h-14 px-8 bg-primary text-primary-foreground rounded-2xl" asChild>
              <Link to="/profissionais">Quero iniciar agora <ArrowRight size={20} className="ml-2" /></Link>
            </Button>
            <p className="text-sm text-muted-foreground font-medium mt-2 sm:mt-3">
              A avaliação é feita exclusivamente por profissionais habilitados.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple pointer-events-none opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl md:text-6xl font-display font-black text-foreground tracking-tight mb-4">
              DE <span className="text-gradient-purple">PACIENTE</span> PARA <span className="text-gradient-purple">PACIENTE</span>
            </h2>
            <p className="text-muted-foreground font-medium">Modelos ilustrativos — use depoimentos reais com consentimento documentado.</p>
          </motion.div>

          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={t.imageUrl} alt={`Ilustração - ${t.name}`} className="w-12 h-12 rounded-2xl object-cover border border-border" />
                      <div>
                        <p className="font-black text-sm text-foreground">"{t.name}"</p>
                        <p className="text-xs text-muted-foreground font-medium">{t.age} • {t.topic}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">"{t.quote}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
            * Nomes e fotos ilustrativos (banco de imagens). Em produção, admin troca por depoimentos reais com consentimento.
          </p>
        </div>
      </section>

      {/* Market Chart */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div className="mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={28} className="text-primary" />
              <h2 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-tight">Mercado em Crescimento</h2>
            </div>
            <p className="text-muted-foreground font-medium max-w-2xl">Projeções públicas indicam forte expansão do setor legal de cannabis medicinal globalmente.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Card className="border-border max-w-4xl">
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={marketData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" />
                    <XAxis dataKey="year" stroke="hsl(240 10% 68%)" fontSize={12} fontWeight={600} />
                    <YAxis stroke="hsl(240 10% 68%)" fontSize={12} fontWeight={600} tickFormatter={(v) => `$${v}B`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(240 15% 7%)", border: "1px solid hsl(240 10% 14%)", borderRadius: "14px", color: "hsl(240 10% 93%)" }}
                      formatter={(value: number) => [`US$ ${value}B`, "Valor de mercado"]}
                    />
                    <Bar dataKey="valor" fill="hsl(152 80% 45%)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-4">
                  * Gráfico ilustrativo com base em projeções públicas (Grand View Research, Fortune Business Insights). Valores variam por metodologia.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-green pointer-events-none opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl md:text-5xl font-display font-black text-foreground tracking-tight mb-4">Ecossistema Completo</h2>
            <p className="text-muted-foreground font-medium text-lg">Tudo que você precisa em um só lugar.</p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { icon: Stethoscope, title: "Teleatendimento", desc: "Chat + vídeo quando aplicável. Prontuário, anexos e recibos.", accent: "green" },
              { icon: ShoppingBag, title: "Shopping Multi-vendor", desc: "Lojas, farmácias e suplementos. Checkout Pix com preços populares.", accent: "purple" },
              { icon: Users, title: "Profissionais Verificados", desc: "Documentos, especialidades, avaliações e ranking público.", accent: "green" },
              { icon: Shield, title: "Segurança & LGPD", desc: "Dados protegidos, consentimentos e auditoria completa.", accent: "purple" },
              { icon: Star, title: "Assinatura Popular", desc: "Planos acessíveis com descontos, suporte e benefícios exclusivos.", accent: "green" },
              { icon: Zap, title: "Pix Mercado Pago", desc: "QR code, copia e cola. Confirmação automática via webhook.", accent: "purple" },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border hover:border-primary/30 transition-all hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-2xl ${f.accent === 'green' ? 'bg-gradient-green border-green' : 'bg-gradient-purple border-purple'} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                      <f.icon size={24} className={f.accent === 'green' ? 'text-primary' : 'text-secondary'} />
                    </div>
                    <h3 className="text-lg font-display font-black text-foreground mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div className="mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl md:text-5xl font-display font-black text-foreground tracking-tight mb-4">Dúvidas Frequentes</h2>
          </motion.div>

          <motion.div className="max-w-3xl" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card border border-border rounded-2xl px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <span className="font-black text-foreground text-sm">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 text-sm leading-relaxed font-medium">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <div className="mt-8">
            <Button variant="link" className="text-primary font-bold p-0" asChild>
              <Link to="/faq">Ver todas as perguntas <ArrowRight size={16} className="ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="max-w-3xl" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl md:text-6xl font-display font-black text-foreground tracking-tight mb-6 leading-tight">
              Comece sua jornada <span className="text-gradient-green">agora</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 font-medium">
              Acesse profissionais habilitados e o Shopping com preços populares. Pagamento 100% via Pix.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="font-black h-14 px-8 bg-primary text-primary-foreground rounded-2xl" asChild>
                <Link to="/falar-com-especialista">
                  Falar com Especialista <MessageSquare size={18} className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="font-black h-14 px-8 border-border rounded-2xl" asChild>
                <Link to="/planos">
                  Ver Planos <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground text-center font-medium">
            ⚠️ Conteúdo educativo. Prescrição e conduta clínica dependem de avaliação individual por profissional habilitado.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
