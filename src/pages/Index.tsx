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
  { n: "1", title: "Escolha o especialista", desc: "Navegue por categorias, veja avaliações, preços populares e perfis verificados." },
  { n: "2", title: "Pré-entrevista rápida", desc: "Preencha um formulário de 2 minutos com seu objetivo e resumo do caso." },
  { n: "3", title: "Pague via Pix", desc: "Pagamento instantâneo com QR code Mercado Pago. Confirmação automática." },
  { n: "4", title: "Receba atendimento", desc: "O profissional recebe seu resumo e inicia o atendimento (chat ou vídeo)." },
];

const Index = () => {
  useEffect(() => {
    document.title = "Planta y Raiz - Mega Clínica Digital";
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

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                {["Preços populares", "Pix Mercado Pago", "Teleatendimento", "Shopping multi-vendor", "Foco baixa renda"].map((pill) => (
                  <span key={pill} className="px-4 py-2 rounded-full text-xs font-bold text-muted-foreground border border-border bg-card/60 backdrop-blur-sm">
                    {pill}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Phone Mockup Area - Otimizado para Performance */}
            <motion.div
              className="relative flex justify-center items-center"
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: -220 }} 
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            >
              <div className="relative group w-full flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-10 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur-[100px] opacity-50 group-hover:opacity-80 transition duration-1000"></div>
                  <img
                    src={heroPhoneMockup}
                    alt="Planta y Raiz App"
                    className="w-[450px] md:w-[600px] lg:w-[750px] xl:w-[900px] 2xl:w-[1100px] drop-shadow-[0_45px_45px_rgba(0,0,0,0.6)] relative z-10 transition-transform duration-700 hover:scale-[1.03]"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
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

      {/* Como Funciona Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6">Tratamento em <span className="text-gradient-purple">4 Passos</span></h2>
            <p className="text-lg text-muted-foreground font-medium">Sua jornada completa, do diagnóstico à entrega, com economia e segurança total.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} className="relative p-8 rounded-3xl bg-card/30 border border-border hover:border-primary/20 transition-all group" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-black mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  {step.n}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
