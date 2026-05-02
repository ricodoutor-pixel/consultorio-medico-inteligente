import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Leaf, Users, Star, ArrowRight, TrendingUp, UserPlus, Download, Quote } from "lucide-react";
import { motion } from "framer-motion";
import CannabisMarketChart from "@/components/CannabisMarketChart";
import { Link } from "react-router-dom";
import { HeroCarousel } from "@/components/HeroCarousel";
import { LocalMapSection } from "@/components/LocalMapSection";
import triagemPatient from "@/assets/triagem-patient.png";
import consultaChat from "@/assets/consulta-chat.png";
import triagemForm from "@/assets/triagem-form.png";
import testimonialMaria from "@/assets/testimonial-maria.jpg";
import testimonialRoberto from "@/assets/testimonial-roberto.jpg";
import testimonialJuliana from "@/assets/testimonial-juliana.jpg";
import testimonialAntonio from "@/assets/testimonial-antonio.jpg";
import { GlobalComplianceBadge } from "@/components/GlobalComplianceBadge";
import { PWAInstallSection } from "@/components/PWAInstallSection";
import WhatsAppButton from "@/components/WhatsAppButton";

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
  { n: "4", title: "Receba atendimento", desc: "O profissional recebe seu resumo e inicia o atendimento (chat ou vídeo).", img: triagemPatient },
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


const Index = () => {
  useEffect(() => {
    document.title = "Planta y Raiz - Telemedicina Cannabis Medicinal | Orientações Técnicas a partir de R$30";
    // ManyChat widget (ID 11227069) é injetado centralizadamente via <ManyChatWidget /> após consentimento LGPD.
  }, []);

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Navbar />

      {/* Hero Section - Otimizado para Mobile/Desktop */}
      <section className="hero-glow section-padding min-h-[70dvh] lg:min-h-[85dvh] flex items-start overflow-hidden pt-24 md:pt-32 pb-12 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-14 items-start">
            
            {/* Text Content */}
            <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col justify-center">

              <motion.h1 
                variants={fadeUp} 
                className="text-[clamp(2rem,6vw+0.5rem,4.5rem)] font-display font-black leading-[0.95] mb-4 tracking-tight"
              >
                <span className="text-gradient-green">Mais que Acesso,</span>
                <br />
                <span className="text-gradient-purple animate-[starPulse_3s_ease-in-out_infinite] hover:scale-[2] transition-transform duration-700 ease-in-out origin-left inline-block cursor-pointer drop-shadow-[0_0_20px_hsl(280,80%,65%)] hover:drop-shadow-[0_0_40px_hsl(280,80%,75%)]">Equidade.</span>
              </motion.h1>

              <motion.div variants={fadeUp} className="max-w-2xl mb-4">
                <div className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                  Democratizando a telemedicina e terapias canabinoides para transformar vidas, no mundo todo. 🌎<span className="inline-flex align-middle ml-1"><GlobalComplianceBadge /></span>
                </div>
              </motion.div>

              {/* Texto institucional - visível apenas em desktop */}
              <motion.div 
                variants={fadeUp} 
                className="hidden lg:block max-w-2xl mb-2 relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-[hsl(280,80%,65%)]/8 to-[hsl(190,90%,50%)]/10 rounded-2xl blur-xl"></div>
                <p className="relative leading-[1.8] font-display font-black text-xl xl:text-2xl 2xl:text-[1.7rem] tracking-wide">
                  <span className="text-primary drop-shadow-[0_0_8px_hsl(142,70%,45%/0.4)]">Referência No Tratamento Com Cannabis Medicinal No Brasil,</span>{' '}
                  <span className="text-[hsl(25,95%,60%)] drop-shadow-[0_0_8px_hsl(25,95%,60%/0.3)]">a Planta y Raiz está Promovendo a Equidade</span>{' '}
                  <span className="text-[hsl(280,80%,65%)] drop-shadow-[0_0_8px_hsl(280,80%,65%/0.3)]">e Realmente democratizando o acesso ao tratamento,</span>{' '}
                  <span className="text-[hsl(190,90%,50%)] drop-shadow-[0_0_8px_hsl(190,90%,50%/0.3)]">Canabinoide oferecendo consultas com especialistas</span>{' '}
                  <span className="text-[hsl(45,90%,55%)] drop-shadow-[0_0_8px_hsl(45,90%,55%/0.3)]">por apenas R$30.</span>{' '}
                  <span className="text-[hsl(340,85%,60%)] drop-shadow-[0_0_10px_hsl(340,85%,60%/0.4)]">Venha Você Também Fazer Parte!</span>
                </p>
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
              <Link to="/cadastro" className="self-center">
                <motion.span 
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-black hover:bg-primary/90 transition-all transform hover:scale-105 cursor-pointer shadow-xl shadow-primary/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <UserPlus size={20} />
                  CADASTRO GRATUITO
                </motion.span>
              </Link>

              <div className="relative group w-full flex flex-col items-center mt-8 lg:mt-0">
                <div className="relative scale-90 sm:scale-100 transition-transform duration-500">
                  <div className="absolute -inset-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-[80px] opacity-40 group-hover:opacity-70 transition duration-1000"></div>
                  <div className="relative z-10">
                    <HeroCarousel />
                  </div>
                </div>
                {/* Texto institucional abaixo do carrossel - apenas mobile */}
                <p className="mt-8 text-center leading-relaxed font-display font-bold text-[clamp(0.85rem,2vw,1.1rem)] max-w-full lg:hidden mx-auto px-4 bg-card/30 p-6 rounded-3xl border border-border/50 backdrop-blur-sm">
                  <span className="text-primary">Referência No Tratamento Com Cannabis Medicinal No Brasil,</span>{' '}
                  <span className="text-[hsl(25,95%,60%)]">a Planta y Raiz está Promovendo a Equidade</span>{' '}
                  <span className="text-[hsl(280,80%,65%)]">e Realmente democratizando o acesso ao tratamento,</span>{' '}
                  <span className="text-[hsl(190,90%,50%)]">Canabinoide oferecendo consultas com especialistas</span>{' '}
                  <span className="text-[hsl(45,90%,55%)]">por apenas R$30.</span>{' '}
                  <span className="text-[hsl(340,85%,60%)]">Venha Você Também Fazer Parte!</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Live Stats */}
      <section className="section-padding border-b border-border bg-card/20 backdrop-blur-md">
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
                    <p className="text-[clamp(1.25rem,3vw,2rem)] font-display font-black text-foreground">{stat.value}</p>
                    <span className="text-[clamp(0.6rem,1.2vw,0.75rem)] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Como Funciona — 5 Passos */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
            <h2 className="font-display font-black mb-4 md:mb-6">Tratamento em <span className="text-gradient-purple">5 Passos</span></h2>
            <p className="text-muted-foreground font-medium">Sua jornada completa, do diagnóstico à entrega do medicamento, com economia e segurança total.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-10">
            {steps.map((step, i) => (
              <motion.div key={i} className="relative p-4 md:p-6 rounded-2xl md:rounded-3xl bg-card/30 border border-border hover:border-primary/20 transition-all group" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div className="mb-3 md:mb-4 relative h-28 md:h-40 overflow-hidden rounded-xl md:rounded-2xl">
                  <img src={step.img} alt={step.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-lg font-black shadow-lg">
                    {step.n}
                  </div>
                </div>
                <h3 className="text-sm md:text-base lg:text-lg font-bold mb-1 md:mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-xs md:text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button size="lg" className="text-sm sm:text-base font-black h-12 sm:h-14 px-6 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105" asChild>
              <Link to="/profissionais">
                🎯 Iniciar Orientação Técnica <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      {/* Patologias section follows */}

      {/* Seleção de Patologias */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="font-display font-black mb-4">
              Selecione as suas <span className="text-gradient-green">patologias</span>
            </h2>
            <p className="text-muted-foreground font-medium">
              Inicie seu tratamento com cannabis medicinal ainda hoje!
            </p>
            <p className="text-base text-muted-foreground mt-2">
              Para qual condição você busca um tratamento?
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {[
              { name: "Alcoolismo", bg: "bg-emerald-600", shadow: "shadow-emerald-600/30" },
              { name: "Alzheimer", bg: "bg-violet-600", shadow: "shadow-violet-600/30" },
              { name: "Perda de peso", bg: "bg-amber-500", shadow: "shadow-amber-500/30" },
              { name: "Obesidade", bg: "bg-orange-600", shadow: "shadow-orange-600/30" },
              { name: "Anorexia", bg: "bg-rose-500", shadow: "shadow-rose-500/30" },
              { name: "Ansiedade", bg: "bg-sky-500", shadow: "shadow-sky-500/30" },
              { name: "Autismo", bg: "bg-indigo-500", shadow: "shadow-indigo-500/30" },
              { name: "Crohn", bg: "bg-teal-600", shadow: "shadow-teal-600/30" },
              { name: "Depressão", bg: "bg-blue-600", shadow: "shadow-blue-600/30" },
              { name: "Dores", bg: "bg-red-500", shadow: "shadow-red-500/30" },
              { name: "Epilepsia", bg: "bg-purple-600", shadow: "shadow-purple-600/30" },
              { name: "Enxaqueca", bg: "bg-fuchsia-500", shadow: "shadow-fuchsia-500/30" },
              { name: "Fibromialgia", bg: "bg-pink-500", shadow: "shadow-pink-500/30" },
              { name: "Insônia", bg: "bg-cyan-600", shadow: "shadow-cyan-600/30" },
              { name: "Intestino irritável", bg: "bg-lime-600", shadow: "shadow-lime-600/30" },
              { name: "Tabagismo", bg: "bg-yellow-600", shadow: "shadow-yellow-600/30" },
              { name: "TDAH", bg: "bg-blue-500", shadow: "shadow-blue-500/30" },
              { name: "Parkinson", bg: "bg-green-700", shadow: "shadow-green-700/30" },
            ].map((item, index) => (
              <Link
                key={item.name}
                to={`/telemedicina`}
                onClick={() => sessionStorage.setItem("triage_condition", item.name)}
                className={`px-3 py-2 md:px-5 md:py-3 rounded-full ${item.bg} text-white font-bold text-xs md:text-sm shadow-lg ${item.shadow} hover:scale-105 transition-all duration-300 hover:animate-none`}
                style={{
                  animation: `twinkle ${6 + (index % 5) * 1.5}s ease-in-out ${(index * 0.8) % 7}s infinite`,
                }}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos Reais */}
      <section className="section-padding bg-card/10 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
            <h2 className="font-display font-black mb-4 md:mb-6">Histórias <span className="text-gradient-green">Reais</span></h2>
            <p className="text-muted-foreground font-medium">Vidas transformadas pela cannabis medicinal com acompanhamento profissional.</p>
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
                    loading="lazy"
                    decoding="async"
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

      {/* Instalação do App PWA - Dr. Verdinho na tela inicial */}
      <PWAInstallSection />

      {/* Mercado Cannabis Medicinal - Projeção Interativa */}
      <CannabisMarketChart />

      <LocalMapSection />

      <Footer />

      {/* Botão flutuante da Enfermeira Brisa (WhatsApp) */}
      <WhatsAppButton />
    </div>
  );
};

export default Index;
