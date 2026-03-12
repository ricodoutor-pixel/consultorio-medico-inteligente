import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Leaf, Stethoscope, ShoppingBag, Users, Star, Shield, Zap, ArrowRight, TrendingUp, MessageSquare, ClipboardList, Smartphone, Gift, BookOpen, Video, UserPlus, Globe, Download, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import { testimonials } from "@/data/testimonials";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import heroPhoneMockup from "@/assets/hero-hand-phone.png";
import triagemPatient from "@/assets/triagem-patient.png";
import consultaChat from "@/assets/consulta-chat.png";
import triagemForm from "@/assets/triagem-form.png";

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

      {/* Hero */}
      <section className="hero-glow pt-24 pb-16 md:pt-32 md:pb-28">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} className="flex flex-col gap-2 mb-8">
                <div className="inline-flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-2 bg-gradient-green border border-green rounded-full px-4 py-2 text-sm font-bold text-primary">
                    <Leaf size={16} />
                    PLATAFORMA POPULAR • SAÚDE • SHOPPING
                  </span>
                  <Link to="/cadastro">
                    <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-black hover:bg-primary/90 transition-colors cursor-pointer animate-pulse">
                      <UserPlus size={16} />
                      CADASTRO
                    </span>
                  </Link>
                </div>
                <motion.span 
                  animate={{ 
                    textShadow: ["0px 0px 4px rgba(218, 165, 32, 0.3)", "0px 0px 12px rgba(218, 165, 32, 0.8)", "0px 0px 4px rgba(218, 165, 32, 0.3)"],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                 className="text-[10px] md:text-xs font-bold tracking-wide text-[hsl(var(--gold))] leading-relaxed max-w-2xl"
                >
                  HUB COMPLETO • SAÚDE • POPULAR • INFORMAÇÃO • CONSULTA • ESPECIALISTAS • FARMÁCIAS • IMPORTADORES • PRODUTORES • SERVIÇOS • OPÇÕES • PREÇOS JUSTOS • COMUNIDADE • GANHOS • FAMÍLIA
                </motion.span>
              </motion.div>

              <motion.h1 
                variants={fadeUp} 
                className="text-3xl md:text-5xl lg:text-6xl font-display font-black leading-[1.1] mb-8 tracking-tight"
              >
                <span className="text-foreground">Democratizando o </span>
                <span className="text-gradient-green">Acesso</span>
                <span className="text-foreground"> a </span>
                <span className="text-gradient-purple">Telemedicina</span>
                <span className="text-foreground">, </span>
                <span className="text-gradient-gold">Suprimentos</span>
                <span className="text-foreground"> e </span>
                <span className="text-gradient-green">Medicamentos</span>
                <span className="text-foreground"> à Base De </span>
                <span className="text-gradient-purple">Cannabis</span>
                <span className="text-foreground"> Em Todo </span>
                <span className="text-gradient-gold">el Mundo</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-base md:text-lg text-muted-foreground max-w-3xl mb-10 leading-relaxed font-medium">
                Conectamos pacientes a profissionais habilitados, usamos o que há de mais novo em tecnologia — inteligência artificial e teleatendimento via vídeo e chat, direto na plataforma — aliado ao Shopping de bem-estar com preços populares. Você escolhe o especialista, faz uma pré-entrevista, paga via Pix seguro Mercado Pago e segue para o atendimento. Receba sua receita e volte ao Shopping, com centenas de farmácias e produtores autorizados pela ANVISA, oferecendo os melhores preços com frete grátis para todo o Brasil.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button size="lg" className="text-base font-black h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl" asChild>
                  <Link to="/profissionais">
                    Ver Profissionais <ArrowRight size={20} className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base font-black h-14 px-8 border-border hover:bg-muted rounded-2xl" asChild>
                  <Link to="/shopping">
                    Abrir Shopping <ShoppingBag size={18} className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" className="text-base font-black h-14 px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-2xl" asChild>
                  <Link to="/planos">
                    Começar agora <ArrowRight size={20} className="ml-2" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                {["Preços populares", "Pix Mercado Pago", "Teleatendimento", "Shopping multi-vendor", "Foco baixa renda"].map((pill) => (
                  <span key={pill} className="px-4 py-2 rounded-full text-xs font-bold text-muted-foreground border border-border bg-card/60">
                    {pill}
                  </span>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} className="mt-6 px-4 py-3 rounded-2xl border border-primary/20 bg-primary/5 max-w-3xl">
                <p className="text-xs text-muted-foreground font-medium">
                  ⚠️ Conteúdo educativo. Prescrição e conduta clínica dependem de avaliação individual por profissional habilitado.
                </p>
              </motion.div>
            </motion.div>

            {/* Phone Mockup */}
            <motion.div
              className="hidden lg:flex justify-center"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
            >
              <img
                src={heroPhoneMockup}
                alt="Planta & Raiz — App de consulta e medicamentos à base de cannabis"
                className="w-[340px] xl:w-[400px] drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-12 md:py-16 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { value: "45K+", label: "Usuários Ativos", icon: Users },
              { value: "4.9★", label: "Avaliação Média", icon: Star },
              { value: "125K+", label: "Downloads App", icon: Download },
              { value: "R$6.3M", label: "Projeção Anual", icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border text-center hover:border-primary/20 transition-colors">
                  <CardContent className="p-5">
                    <stat.icon size={24} className="text-primary mx-auto mb-2" />
                    <p className="text-2xl md:text-3xl font-display font-black text-foreground">{stat.value}</p>
                    <span className="text-xs text-muted-foreground font-bold uppercase">{stat.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Hub Navigation */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div className="mb-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-tight">
              Ecossistema <span className="text-gradient-purple">Completo</span>
            </h2>
            <p className="text-muted-foreground font-medium mt-2">Tudo que você precisa em um só lugar.</p>
          </motion.div>

          <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { icon: Stethoscope, label: "Telemedicina", to: "/telemedicina", color: "green" },
              { icon: BookOpen, label: "Biblioteca", to: "/biblioteca", color: "purple" },
              { icon: ShoppingBag, label: "Shopping", to: "/shopping", color: "green" },
              { icon: Users, label: "Comunidade", to: "/comunidade", color: "purple" },
              { icon: Gift, label: "Afiliados", to: "/afiliados", color: "gold" },
              { icon: HeartPulse, label: "Meu Painel", to: "/dashboard", color: "green" },
            ].map((hub, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link to={hub.to}>
                  <Card className="border-border hover:border-primary/30 transition-all hover:-translate-y-1 cursor-pointer group">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                        hub.color === "green" ? "bg-gradient-green border border-green" :
                        hub.color === "purple" ? "bg-gradient-purple border border-purple" :
                        "bg-gradient-gold border border-gold"
                      }`}>
                        <hub.icon size={22} className={hub.color === "green" ? "text-primary" : hub.color === "purple" ? "text-secondary" : "text-[hsl(45,76%,52%)]"} />
                      </div>
                      <p className="font-bold text-sm text-foreground">{hub.label}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Step by step — with visual images */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div className="mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl md:text-6xl font-display font-black text-foreground tracking-tight leading-tight">
              SIGA O <span className="text-gradient-green">PASSO A PASSO</span>
            </h2>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {steps.map((s, i) => (
              <motion.div key={s.n} variants={fadeUp} className="space-y-4">
                {i === 0 && (
                  <img src={triagemPatient} alt="Paciente usando a plataforma" className="w-full h-32 object-cover rounded-2xl border border-border mb-2" />
                )}
                {i === 1 && (
                  <img src={triagemForm} alt="Triagem emocional" className="w-full h-32 object-cover object-top rounded-2xl border border-border mb-2" />
                )}
                {i === 3 && (
                  <img src={consultaChat} alt="Consulta com especialista" className="w-full h-32 object-cover rounded-2xl border border-border mb-2" />
                )}
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
              RELATOS <span className="text-gradient-purple">REAIS</span>
            </h2>
            <p className="text-muted-foreground font-medium">Histórias de pacientes que transformaram suas vidas com cannabis medicinal.</p>
          </motion.div>

          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={t.imageUrl} alt={`${t.name}`} className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/20" />
                      <div>
                        <p className="font-black text-sm text-foreground">{t.name}</p>
                        <p className="text-xs text-primary font-bold">{t.topic}</p>
                        <p className="text-[10px] text-muted-foreground">{t.age}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">"{t.quote}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
            * Relatos baseados em experiências reais. Nomes e fotos ilustrativos por privacidade. Resultados variam individualmente.
          </p>
        </div>
      </section>

      {/* Market Chart */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div className="mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center">
                <TrendingUp size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-tight">Mercado em <span className="text-gradient-green">Crescimento</span></h2>
                <p className="text-muted-foreground font-medium text-sm">Cannabis medicinal global — projeções até 2028 (em bilhões USD)</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Card className="border-border max-w-5xl overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-xs font-bold text-muted-foreground">Valor de Mercado</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                      <span className="text-xs font-black text-primary">+2.300% em 8 anos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display font-black text-foreground">US$ 67.4B</p>
                    <p className="text-xs text-muted-foreground">Projeção 2028</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={marketData}>
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152 80% 45%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(152 80% 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" vertical={false} />
                    <XAxis dataKey="year" stroke="hsl(240 10% 68%)" fontSize={12} fontWeight={700} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(240 10% 68%)" fontSize={12} fontWeight={700} tickFormatter={(v) => `$${v}B`} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(240 15% 7%)", border: "1px solid hsl(152 80% 45% / 0.3)", borderRadius: "16px", color: "hsl(240 10% 93%)", padding: "12px 16px" }}
                      formatter={(value: number) => [`US$ ${value}B`, "Valor de mercado"]}
                      labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                    />
                    <Area type="monotone" dataKey="valor" stroke="hsl(152 80% 45%)" strokeWidth={3} fill="url(#colorValor)" dot={{ fill: "hsl(152 80% 45%)", strokeWidth: 2, r: 5, stroke: "hsl(240 15% 7%)" }} activeDot={{ r: 8, fill: "hsl(152 80% 45%)", stroke: "hsl(240 15% 7%)", strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    Fontes: Grand View Research, Fortune Business Insights, BDSA (2024)
                  </p>
                  <div className="flex gap-2">
                    {["CAGR 34%", "150+ países", "Regulação em expansão"].map(tag => (
                      <span key={tag} className="px-2 py-1 text-[10px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">{tag}</span>
                    ))}
                  </div>
                </div>
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
              Acesse profissionais habilitados, telemedicina com IA e o Shopping com preços populares. Pagamento 100% via Pix.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="font-black h-14 px-8 bg-primary text-primary-foreground rounded-2xl" asChild>
                <Link to="/telemedicina">
                  Iniciar Consulta IA <HeartPulse size={18} className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="font-black h-14 px-8 border-primary/30 text-primary rounded-2xl" asChild>
                <Link to="/cadastro">
                  Cadastre-se Grátis <UserPlus size={18} className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="font-black h-14 px-8 border-border rounded-2xl" asChild>
                <Link to="/afiliados">
                  Seja Afiliado <Gift size={18} className="ml-2" />
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
