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
import drEdilsonPhoto from "@/assets/dr-edilson-bezerra.jpg";


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
                  <span className="text-[hsl(190,90%,50%)] drop-shadow-[0_0_8px_hsl(190,90%,50%/0.3)]">Canabinoide oferecendo orientação técnica com relatório digital em PDF</span>{' '}
                  <span className="text-[hsl(45,90%,55%)] drop-shadow-[0_0_8px_hsl(45,90%,55%/0.3)]">por apenas R$30.</span>{' '}
                  <span className="text-[hsl(340,85%,60%)] drop-shadow-[0_0_10px_hsl(340,85%,60%/0.4)]">Venha Você Também Fazer Parte desta revolução!</span>
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
                  <span className="text-[hsl(190,90%,50%)]">Canabinoide oferecendo orientação técnica com relatório digital em PDF</span>{' '}
                  <span className="text-[hsl(45,90%,55%)]">por apenas R$30.</span>{' '}
                  <span className="text-[hsl(340,85%,60%)]">Venha Você Também Fazer Parte desta revolução!</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Como Funciona — 5 Passos (logo após texto institucional do Hero) */}
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

      {/* Dr. Edilson Bezerra — Orientação Técnica Destacada */}
      <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-[hsl(280,80%,65%)]/10 border-y border-primary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs font-black uppercase tracking-wider text-primary">
                ⚕️ Especialista Verificado · CRM 10963
              </span>
            <h2 className="font-display font-black text-3xl md:text-5xl leading-tight">
                Orientação e Avaliação Técnica com{" "}
                <span className="text-gradient-green">Dr. Edilson Bezerra On</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Orientador Técnico em Medicina Endocanabinoide e Especialista em Medicina Integrativa. Persona virtual autônoma (Gemini) trilíngue via WhatsApp, com acesso a banco de dados pessoal de mais de 40 mil estudos científicos publicados sobre modulação do sistema endocanabinoide humano. Cruza dados científicos e tratamentos divulgados para gerar relatório final preciso e personalizado, baseado em evidências. Atendimento educado, otimista e 100% autônomo, com suporte completo da Enfª Brisa via WhatsApp.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><Leaf size={16} className="text-primary mt-0.5 shrink-0" /> Triagem individual personalizada com Enfª Brisa</li>
                <li className="flex items-start gap-2"><Leaf size={16} className="text-primary mt-0.5 shrink-0" /> Pagamento seguro via Pix com confirmação automática</li>
                <li className="flex items-start gap-2"><Leaf size={16} className="text-primary mt-0.5 shrink-0" /> Avaliação técnica humanitária completa</li>
                <li className="flex items-start gap-2"><Leaf size={16} className="text-primary mt-0.5 shrink-0" /> Encaminhamento técnico preciso por especialidade</li>
                <li className="flex items-start gap-2"><Leaf size={16} className="text-primary mt-0.5 shrink-0" /> Relatório digital em PDF com assinatura ICP-Brasil e selo gov.br</li>
                <li className="flex items-start gap-2"><Leaf size={16} className="text-primary mt-0.5 shrink-0" /> Mentoria e consultoria particular especializada</li>
                <li className="flex items-start gap-2"><Leaf size={16} className="text-primary mt-0.5 shrink-0" /> Importação RDC 660/2022 facilitada com desconto e frete grátis</li>
              </ul>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] leading-relaxed text-amber-100/90">
                ⚖️ <strong>Aviso Legal:</strong> O Dr. Edilson Bezerra <strong>não emite receitas, não realiza consultas, não prescreve medicamentos e não fornece diagnósticos</strong> através desta plataforma. O serviço consiste exclusivamente em <strong>orientação técnica educativa</strong> sobre o sistema endocanabinoide, com entrega de <strong>relatório técnico em PDF assinado digitalmente (ICP-Brasil / gov.br)</strong>. Para prescrições, o paciente é encaminhado a profissional habilitado.
              </div>
              {/* Fluxo exclusivo deste card: Enfª Brisa (Triagem) → Pix Seguro Mercado Pago → Orientação Técnica Dr. Edilson Bezerra On */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-background/40 border border-primary/20">
                <div className="text-center">
                  <div className="text-2xl mb-1">👩‍⚕️</div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-primary">1. Enfª Brisa</p>
                  <p className="text-[10px] text-muted-foreground">Triagem IA</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🔒</div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-primary">2. Pix Seguro</p>
                  <p className="text-[10px] text-muted-foreground">Mercado Pago</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">⚕️</div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-primary">3. Dr. Edilson On</p>
                  <p className="text-[10px] text-muted-foreground">Orientação Técnica</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button size="lg" className="text-sm font-black h-14 px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-all" asChild>
                  <a href="https://wa.me/5511991363154?text=Ol%C3%A1%20Enf%C2%AA%20Brisa%2C%20quero%20iniciar%20a%20triagem%20para%20a%20Orienta%C3%A7%C3%A3o%20T%C3%A9cnica%20com%20o%20Dr.%20Edilson%20Bezerra%20On" target="_blank" rel="noopener noreferrer">
                    💬 Iniciar Triagem com Enfª Brisa <ArrowRight size={18} className="ml-2" />
                  </a>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground italic">
                * Fluxo exclusivo deste card: <strong>Enfª Brisa (triagem) → Pix Seguro Mercado Pago → Orientação Técnica com Dr. Edilson Bezerra On</strong>. Nenhum paciente fala direto com o profissional antes do pagamento e auditoria. Pacientes internacionais: US$10.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5 Passos movido para logo após o Hero */}
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
          <div className="flex justify-center mt-10">
            <Button
              size="lg"
              className="text-sm font-black h-14 px-8 bg-white text-gray-900 hover:bg-gray-100 rounded-2xl shadow-xl border border-border hover:scale-105 transition-all"
              asChild
            >
              <a
                href="https://www.google.com/search?sca_esv=b297bba60c9ca3dc&hl=pt-BR&sxsrf=ANbL-n6Z2aCE3ZjDH4pHrO9dp9YGu-2Isg:1778132928455&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOX0TncgJDneqpWemRGvKjzMcejuZczqD7sw4j1K2gfBOmO8mPD7Hql21K2gCtfJ5fPIHTN41mSZHq7nPlncrMwlx4nDLm7uMj-GbSdxRr3IXPi_rYg%3D%3D&q=Planta+y+Raiz+Ltda+Coment%C3%A1rios&sa=X&ved=2ahUKEwi6nMGsvaaUAxX7mZUCHddCNR4Q0bkNegQIIhAF"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Deixe sua avaliação
              </a>
            </Button>
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
