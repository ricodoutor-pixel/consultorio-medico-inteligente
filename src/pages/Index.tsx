import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Leaf, Users, Star, ArrowRight, TrendingUp, 
  UserPlus, Download, Quote, Zap 
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroCarousel } from "@/components/HeroCarousel";
import { LocalMapSection } from "@/components/LocalMapSection";
import { GlobalComplianceBadge } from "@/components/GlobalComplianceBadge";
import { PWAInstallSection } from "@/components/PWAInstallSection";
import CannabisMarketChart from "@/components/CannabisMarketChart";
import WhatsAppButton from "@/components/WhatsAppButton"; // O botão da Brisa

// Assets
import triagemPatient from "@/assets/triagem-patient.png";
import triagemForm from "@/assets/triagem-form.png";
import consultaChat from "@/assets/consulta-chat.png";
import testimonialMaria from "@/assets/testimonial-maria.jpg";
import testimonialRoberto from "@/assets/testimonial-roberto.jpg";
import testimonialJuliana from "@/assets/testimonial-juliana.jpg";
import testimonialAntonio from "@/assets/testimonial-antonio.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const Index = () => {
  useEffect(() => {
    document.title = "Planta y Raiz - Telemedicina Cannabis Medicinal | Consultas a partir de R$30";
    // ManyChat widget é injetado de forma centralizada via <ManyChatWidget /> (ID 11227069),
    // após consentimento LGPD. Não duplicar scripts aqui.
  }, []);

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-glow section-padding min-h-[70dvh] lg:min-h-[85dvh] flex items-start overflow-hidden pt-24 md:pt-32 pb-12 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-14 items-start">
            
            <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col justify-center">
              <motion.h1 
                variants={fadeUp} 
                className="text-[clamp(2rem,6vw+0.5rem,4.5rem)] font-display font-black leading-[0.95] mb-4 tracking-tight"
              >
                <span className="text-gradient-green">Mais que Acesso,</span>
                <br />
                <span className="text-gradient-purple animate-[starPulse_3s_ease-in-out_infinite] hover:scale-[1.1] transition-transform duration-700 origin-left inline-block cursor-pointer drop-shadow-[0_0_20px_hsl(280,80%,65%)]">Equidade.</span>
              </motion.h1>

              <motion.div variants={fadeUp} className="max-w-2xl mb-4">
                <div className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                  Democratizando a telemedicina e terapias canabinoides. 🌎
                  <span className="inline-flex align-middle ml-1"><GlobalComplianceBadge /></span>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="hidden lg:block max-w-2xl mb-2 relative">
                <p className="relative leading-[1.8] font-display font-black text-xl xl:text-2xl tracking-wide">
                  <span className="text-primary">Referência em Cannabis Medicinal,</span>{' '}
                  <span className="text-[hsl(25,95%,60%)]">Promovendo Equidade</span>{' '}
                  <span className="text-[hsl(280,80%,65%)]">e Democratizando o acesso</span>{' '}
                  <span className="text-[hsl(45,90%,55%)]">por apenas R$30.</span>
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative flex flex-col justify-center items-center gap-6"
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <Link to="/cadastro" className="self-center">
                <motion.span 
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-8 py-3 text-sm font-black shadow-xl shadow-primary/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <UserPlus size={20} />
                  CADASTRO GRATUITO
                </motion.span>
              </Link>

              <div className="relative group w-full flex flex-col items-center">
                <HeroCarousel />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-card/20 backdrop-blur-md border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "45K+", label: "Usuários", icon: Users },
              { value: "4.9★", label: "Avaliação", icon: Star },
              { value: "125K+", label: "Downloads", icon: Download },
              { value: "R$6.3M", label: "Projeção", icon: TrendingUp },
            ].map((stat, i) => (
              <Card key={i} className="bg-background/40 border-border">
                <CardContent className="p-5 text-center">
                  <stat.icon size={24} className="text-primary mx-auto mb-2" />
                  <p className="text-2xl font-black">{stat.value}</p>
                  <span className="text-xs font-bold uppercase text-muted-foreground">{stat.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona - Integrado com a Lógica da Brisa */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display font-black text-4xl mb-12">
            Tratamento em <span className="text-gradient-purple">5 Passos</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { n: "1", title: "Triagem com Brisa", desc: "Nossa IA faz a pré-entrevista automática via WhatsApp.", img: triagemForm },
              { n: "2", title: "Escolha o Médico", desc: "Especialistas com consultas a partir de R$30.", img: triagemPatient },
              { n: "3", title: "Pagamento Pix", desc: "Confirmação instantânea pelo Manus CEO.", img: consultaChat },
              { n: "4", title: "Teleconsulta", desc: "Atendimento humano e acolhedor por vídeo.", img: triagemPatient },
              { n: "5", title: "Receita Digital", desc: "Compra direta com o Guardião ANVISA validando tudo.", img: triagemPatient },
            ].map((step, i) => (
              <div key={i} className="bg-card/30 p-4 rounded-3xl border border-border relative">
                <span className="absolute top-2 left-2 bg-primary text-white w-8 h-8 flex items-center justify-center rounded-full font-bold">{step.n}</span>
                <img src={step.img} className="rounded-xl mb-4 h-32 w-full object-cover" alt={step.title} />
                <h3 className="font-bold mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Componentes de Fechamento */}
      <PWAInstallSection />
      <CannabisMarketChart />
      <LocalMapSection />
      <Footer />

      {/* --- O BOTÃO MÁGICO: ENFERMEIRA BRISA --- */}
      {/* Este componente agora chama o fluxo do ManyChat */}
      <WhatsAppButton /> 
    </div>
  );
};

export default Index;
