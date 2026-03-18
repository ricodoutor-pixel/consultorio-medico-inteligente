import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Leaf, Stethoscope, ShoppingBag, Users, Star, Shield, Zap, ArrowRight, TrendingUp, MessageSquare, ClipboardList, Smartphone, Gift, BookOpen, Video, UserPlus, Globe, Download, HeartPulse, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import heroPhoneMockup from "@/assets/hero-phone-mockup.png"; 
import triagemPatient from "@/assets/triagem-patient.png";
import consultaChat from "@/assets/consulta-chat.png";
import triagemForm from "@/assets/triagem-form.png";
import testimonialMaria from "@/assets/testimonial-maria.jpg";
import testimonialRoberto from "@/assets/testimonial-roberto.jpg";
import testimonialJuliana from "@/assets/testimonial-juliana.jpg";
import testimonialAntonio from "@/assets/testimonial-antonio.jpg";
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
  { n: "5", title: "Compre seu tratamento", desc: "Acesse nossas lojas parceiras e compre seus medicamentos com receita digital e frete grátis.", img: triagemPatient },
];

const testimonialData = [
  {
    name: "Dona Maria",
    age: "62 anos",
    condition: "Artrite Reumatoide",
    quote: "Depois de 8 anos sofrendo com artrite, o óleo de CBD mudou minha vida. Reduzi 70% dos analgésicos e voltei a fazer crochê.",
    image: testimonialMaria,
  },
  {
    name: "Roberto",
    age: "45 anos",
    condition: "Epilepsia do filho",
    quote: "Meu filho tinha 15 crises por semana. Com o tratamento prescrito aqui, as crises reduziram para 2 por mês. Divisor de águas!",
    image: testimonialRoberto,
  },
  {
    name: "Juliana",
    age: "34 anos",
    condition: "Ansiedade e Insônia",
    quote: "Tomava 3 remédios para dormir. A psiquiatra da plataforma ajustou meu protocolo com CBD e em 3 meses consegui dormir naturalmente.",
    image: testimonialJuliana,
  },
  {
    name: "Sr. Antônio",
    age: "71 anos",
    condition: "Parkinson",
    quote: "Os tremores melhoraram muito. Consigo comer sozinho de novo. A telemedicina facilitou porque não preciso sair de casa.",
    image: testimonialAntonio,
  },
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

      {/* Hero Section */}
      <section className="hero-glow pt-24 pb-16 md:pt-32 md:pb-28 min-h-[95vh] flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Text Content */}
            <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col">
              <motion.div variants={fadeUp} className="mb-6">
                <GlobalComplianceBadge />
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-col gap-2 mb-8">
                <div className="inline-flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-2 bg-gradient-green border border-green rounded-full px-4 py-2 text-sm font-bold text-primary shadow-lg shadow-green/20">
                    <Leaf size={16} />
                    PLATAFORMA POPULAR • SAÚDE • SHOPPING
                  </span>
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
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1.1] mb-6 tracking-tight"
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

              <motion.p variants={fadeUp} className="text-base md:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed font-medium">
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
              </motion.div>
            </motion.div>

            {/* Phone Mockup Area */}
            <motion.div
              className="relative flex flex-col justify-center items-center gap-6"
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            >
              {/* Cadastro Gratuito Button - Above Phone */}
              <Link to="/cadastro">
                <motion.span 
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-black hover:bg-primary/90 transition-all transform hover:scale-105 cursor-pointer shadow-xl shadow-primary/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <UserPlus size={20} />
                  CADASTRO GRATUITO
                </motion.span>
              </Link>

              <div className="relative group w-full flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-[80px] opacity-40 group-hover:opacity-70 transition duration-1000"></div>
                  <img
                    src={heroPhoneMockup}
                    alt="Planta y Raiz App - Diretório de Profissionais e Crescimento da Indústria Cannabis no Brasil"
                    className="w-[364px] md:w-[494px] lg:w-[572px] relative z-10 transition-transform duration-700 hover:scale-[1.03]"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
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

      {/* Como Funciona — 5 Passos */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6">Tratamento em <span className="text-gradient-purple">5 Passos</span></h2>
            <p className="text-lg text-muted-foreground font-medium">Sua jornada completa, do diagnóstico à entrega do medicamento, com economia e segurança total.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <motion.div key={i} className="relative p-6 rounded-3xl bg-card/30 border border-border hover:border-primary/20 transition-all group" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div className="mb-4 relative h-40 overflow-hidden rounded-2xl">
                  <img src={step.img} alt={step.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-lg font-black shadow-lg">
                    {step.n}
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos Reais */}
      <section className="py-20 md:py-32 bg-card/10 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6">Histórias <span className="text-gradient-green">Reais</span></h2>
            <p className="text-lg text-muted-foreground font-medium">Vidas transformadas pela cannabis medicinal com acompanhamento profissional.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonialData.map((t, i) => (
              <motion.div 
                key={i} 
                className="relative p-6 rounded-3xl bg-background/60 border border-border hover:border-primary/30 transition-all backdrop-blur-sm"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Quote size={24} className="text-primary/30 mb-4" />
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <img 
                    src={t.image} 
                    alt={t.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}, {t.age}</p>
                    <p className="text-xs text-primary font-semibold">{t.condition}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mercado em Crescimento */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-8 leading-tight">Mercado em <span className="text-gradient-green">Expansão</span></h2>
              <p className="text-lg text-muted-foreground mb-8 font-medium">A Planta y Raiz lidera a democratização do acesso, com crescimento exponencial projetado para os próximos anos.</p>
              <div className="space-y-4">
                {[
                  { label: "Crescimento de Usuários", val: "280% ao ano" },
                  { label: "Economia Gerada para Pacientes", val: "R$ 1.2M em 2024" },
                  { label: "Taxa de Retenção", val: "92% de satisfação" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="text-primary w-5 h-5" />
                    <span className="text-sm font-bold text-foreground">{item.label}: <span className="text-primary">{item.val}</span></span>
                  </div>
                ))}
              </div>
            </motion.div>
            <Card className="p-6 border-border bg-background/50 backdrop-blur-sm">
              <h3 className="text-sm font-black mb-6 uppercase tracking-widest text-muted-foreground">Projeção de Usuários (2021-2026)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                      itemStyle={{ color: "hsl(var(--primary))", fontWeight: "bold" }}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const CheckCircle2 = ({ className, ...props }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Index;
