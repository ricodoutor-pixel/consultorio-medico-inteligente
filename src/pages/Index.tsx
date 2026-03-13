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
import heroPhoneMockup from "@/assets/hero-phone-mockup.png"; 
import triagemPatient from "@/assets/triagem-patient.png";
import consultaChat from "@/assets/consulta-chat.png";
import triagemForm from "@/assets/triagem-form.png";
import { GlobalComplianceBadge } from "@/components/GlobalComplianceBadge";
import { useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const steps = [
  { n: "1", title: "Escolha o especialista", desc: "Navegue por categorias, veja avaliações, preços populares e perfis verificados.", img: triagemPatient },
  { n: "2", title: "Pré-entrevista rápida", desc: "Preencha um formulário de 2 minutos com seu objetivo e resumo do caso.", img: triagemForm },
  { n: "3", title: "Pague via Pix", desc: "Pagamento instantâneo com QR code Mercado Pago. Confirmação automática.", img: consultaChat },
  { n: "4", title: "Receba atendimento", desc: "O profissional recebe seu resumo e inicia o atendimento (chat ou vídeo).", img: heroPhoneMockup },
];

const growthData = [
  { year: "2021", value: 1200 },
  { year: "2022", value: 3500 },
  { year: "2023", value: 8900 },
  { year: "2024", value: 18400 },
  { year: "2025", value: 32000 },
  { year: "2026", value: 45000 },
];

const Index = () => {
  useEffect(() => {
    document.title = "Planta y Raiz - Telemedicina Cannabis Medicinal | Consultas a partir de R$30";
  }, []);

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Navbar />
      <WhatsAppButton />

      {/* Hero Section - PRESERVADO conforme solicitado */}
      <section className="hero-glow pt-24 pb-16 md:pt-32 md:pb-28 min-h-[95vh] flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Text Content */}
            <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col">
              
              {/* Mobile Only: Iniciar Consulta no Topo */}
              <motion.div variants={fadeUp} className="md:hidden mb-6 w-full">
                 <Link to="/telemedicina" className="w-full">
                  <Button className="w-full bg-secondary text-secondary-foreground font-black py-8 rounded-2xl text-xl shadow-2xl animate-pulse border-4 border-background">
                    <Video className="mr-3 w-6 h-6" /> INICIAR CONSULTA
                  </Button>
                </Link>
              </motion.div>

              {/* Selo CFM Acima da Frase */}
              <motion.div variants={fadeUp} className="mb-6">
                <GlobalComplianceBadge variant="hero" />
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-col gap-2 mb-8">
                <div className="inline-flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-2 bg-gradient-green border border-green rounded-full px-4 py-2 text-sm font-bold text-primary shadow-lg shadow-green/20">
                    <Leaf size={16} />
                    PLATAFORMA POPULAR • SAÚDE • SHOPPING
                  </span>
                  <Link to="/cadastro">
                    <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-black hover:bg-primary/90 transition-all transform hover:scale-105 cursor-pointer animate-pulse">
                      <UserPlus size={16} />
                      CADASTRO GRATUITO
                    </span>
                  </Link>
                </div>
                <motion.span 
                  animate={{ 
                    textShadow: ["0px 0px 4px rgba(218, 165, 32, 0.3)", "0px 0px 12px rgba(218, 165, 32, 0.8)", "0px 0px 4px rgba(218, 165, 32, 0.3)"],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                 className="text-[10px] md:text-xs font-bold tracking-wide text-[hsl(var(--gold))] leading-relaxed max-w-2xl mt-2"
                >
                  HUB COMPLETO • SAÚDE • POPULAR • INFORMAÇÃO • CONSULTA • ESPECIALISTAS • FARMÁCIAS • IMPORTADORES • PRODUTORES • SERVIÇOS • OPÇÕES • PREÇOS JUSTOS • COMUNIDADE • GANHOS • FAMÍLIA
                </motion.span>
              </motion.div>

              <motion.h1 
                variants={fadeUp} 
                className="text-4xl md:text-6xl lg:text-7xl font-display font-black leading-[1.05] mb-8 tracking-tight"
              >
                <span className="text-foreground">Acesso </span>
                <span className="text-gradient-green">Democratizado</span>
                <span className="text-foreground"> à </span>
                <span className="text-gradient-purple">Telemedicina</span>
                <span className="text-foreground"> e </span>
                <span className="text-gradient-gold">Medicamentos</span>
                <span className="text-foreground"> de Cannabis em Todo o </span>
                <span className="text-gradient-green">Mundo</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10 leading-relaxed font-medium">
                Conectamos você aos melhores especialistas via vídeo e chat. Pré-entrevista rápida, pagamento seguro via Pix Mercado Pago e acesso direto ao nosso Shopping de bem-estar com preços populares e frete grátis para todo o Brasil.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row flex-wrap gap-4 mb-10">
                <Button size="lg" className="text-base font-black h-16 px-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/20" asChild>
                  <Link to="/profissionais">
                    Ver Especialistas <ArrowRight size={20} className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base font-black h-16 px-8 border-border hover:bg-muted rounded-2xl" asChild>
                  <Link to="/shopping">
                    Abrir Shopping <ShoppingBag size={18} className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-base font-bold h-16 px-8 rounded-2xl text-muted-foreground hover:text-foreground" asChild>
                  <Link to="/planos">Conhecer Planos</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Phone Mockup Area - DNA Restaurado */}
            <motion.div
              className="relative flex justify-center items-center"
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            >
              <div className="relative group w-full flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-10 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur-[100px] opacity-50 group-hover:opacity-80 transition duration-1000"></div>
                  <img
                    src={heroPhoneMockup}
                    alt="Planta y Raiz App"
                    className="w-[320px] md:w-[450px] lg:w-[550px] drop-shadow-[0_45px_45px_rgba(0,0,0,0.6)] relative z-10 transition-transform duration-700 hover:scale-[1.03]"
                    loading="eager"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Stats - DNA Restaurado */}
      <section className="py-12 md:py-16 border-b border-border bg-card/20 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { value: "45K+", label: "Usuários Ativos", icon: Users },
              { value: "4.9★", label: "Avaliação Média", icon: Star },
              { value: "125K+", label: "Downloads App", icon: Download },
              { value: "R$6.3M", label: "Projeção Anual", icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border text-center hover:border-primary/30 transition-all hover:shadow-xl bg-background/40">
                  <CardContent className="p-5">
                    <stat.icon size={24} className="text-primary mx-auto mb-2" />
                    <p className="text-2xl md:text-3xl font-display font-black text-foreground">{stat.value}</p>
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Como Funciona Section - DNA Restaurado com Imagens Originais */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6">Tratamento em <span className="text-gradient-purple">4 Passos</span></h2>
            <p className="text-lg text-muted-foreground font-medium">Sua jornada completa, do diagnóstico à entrega, com economia e segurança total.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} className="relative p-8 rounded-3xl bg-card/30 border border-border hover:border-primary/20 transition-all group" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div className="mb-6 relative h-48 overflow-hidden rounded-2xl">
                  <img src={step.img} alt={step.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-black shadow-lg">
                    {step.n}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mercado em Crescimento - Gráfico Restaurado */}
      <section className="py-20 md:py-32 bg-card/10 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-8 leading-tight">Mercado em <span className="text-gradient-green">Crescimento</span> Exponencial</h2>
              <div className="space-y-6">
                <div className="flex gap-4 p-6 rounded-2xl bg-background/40 border border-border">
                  <div className="w-12 h-12 rounded-xl bg-green/10 flex items-center justify-center text-green flex-shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">+400% ao Ano</h4>
                    <p className="text-sm text-muted-foreground">O setor de cannabis medicinal é o que mais cresce na saúde global.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-6 rounded-2xl bg-background/40 border border-border">
                  <div className="w-12 h-12 rounded-xl bg-purple/10 flex items-center justify-center text-purple flex-shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">Público Fiel</h4>
                    <p className="text-sm text-muted-foreground">Tratamentos contínuos geram recorrência e fidelidade absoluta.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }}
              className="h-[400px] w-full bg-background/60 p-8 rounded-3xl border border-border shadow-2xl"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00FF00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1f3a" vertical={false} />
                  <XAxis dataKey="year" stroke="#4a5568" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4a5568" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0E27', border: '1px solid #1a1f3a', borderRadius: '12px' }}
                    itemStyle={{ color: '#00FF00', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00FF00" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-center text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-widest">Crescimento de Pacientes Habilitados no Brasil (Projeção)</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ / Accordion Section - DNA Restaurado */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6">Dúvidas <span className="text-gradient-gold">Frequentes</span></h2>
            <p className="text-lg text-muted-foreground font-medium">Tudo o que você precisa saber para começar seu tratamento.</p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border border-border bg-card/30 rounded-2xl px-6">
              <AccordionTrigger className="text-left font-bold py-6 hover:no-underline">É legalizado no Brasil?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                Sim. A ANVISA permite a importação e o uso de produtos à base de cannabis mediante prescrição médica e autorização (RDC 660/2022). Nossa plataforma segue 100% as normas vigentes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border border-border bg-card/30 rounded-2xl px-6">
              <AccordionTrigger className="text-left font-bold py-6 hover:no-underline">Como funciona o pagamento?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                Utilizamos o checkout seguro do Mercado Pago. Você pode pagar via Pix com confirmação instantânea ou cartão de crédito em até 12x.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border border-border bg-card/30 rounded-2xl px-6">
              <AccordionTrigger className="text-left font-bold py-6 hover:no-underline">Qual o custo da consulta?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                Temos especialistas com valores populares a partir de R$30, democratizando o acesso à saúde de qualidade para todas as classes sociais.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
