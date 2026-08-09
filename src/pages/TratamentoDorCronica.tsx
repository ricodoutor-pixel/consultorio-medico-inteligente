import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Star, ShieldCheck, Clock, Heart, MessageCircle, CheckCircle, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-dor-cronica.jpg";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const testimonials = [
  { name: "Maria S.", age: 58, text: "Voltei a caminhar sem desconforto após 3 meses de tratamento com CBD. Minha fibromialgia era insuportável.", stars: 5 },
  { name: "Roberto M.", age: 64, text: "A dor neuropática me impedia de dormir. Com o acompanhamento da Planta & Raiz, recuperei minha qualidade de vida.", stars: 5 },
  { name: "Carla P.", age: 45, text: "Sofri com artrite por 10 anos. O tratamento canabinoide reduziu minha dor em 80%. Recomendo a todos.", stars: 5 },
  { name: "José A.", age: 71, text: "Depois de tentar diversos medicamentos tradicionais, finalmente encontrei alívio real com a medicina canabinoide.", stars: 5 },
];

const faqs = [
  { q: "Como funciona a consulta para dor crônica?", a: "Você realiza uma orientação técnica online com um médico especialista em medicina canabinoide. Ele analisa seu histórico, exames e sintomas para criar um protocolo personalizado de tratamento com CBD e/ou THC." },
  { q: "O tratamento com cannabis medicinal é legalizado pela ANVISA?", a: "Sim. A ANVISA regulamenta o uso de produtos à base de cannabis para fins medicinais no Brasil desde 2015 (RDC 17/2015, atualizada pela RDC 660/2022). A prescrição é feita por médico habilitado com receita tipo B." },
  { q: "Quanto custa a consulta?", a: "A orientação técnica online na Planta & Raiz começa a partir de R$30, com pagamento via Pix. Não há custos ocultos." },
  { q: "Quais condições de dor crônica podem ser tratadas?", a: "Fibromialgia, artrite reumatoide, dores neuropáticas, enxaqueca crônica, dor oncológica, dor pós-operatória e outras condições resistentes a tratamentos convencionais." },
  { q: "Preciso de receita médica?", a: "Sim. O médico da Planta & Raiz emite uma prescrição digital com assinatura eletrônica, válida em todo o Brasil, seguindo os protocolos da ANVISA." },
  { q: "Em quanto tempo sentirei os efeitos?", a: "Os efeitos variam conforme a condição. Muitos pacientes relatam melhora significativa entre 2 a 6 semanas de tratamento contínuo." },
];

const TratamentoDorCronica = () => {
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(f => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const medicalSchema = {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      name: "Tratamento de Dor Crônica com Cannabis Medicinal",
      about: {
        "@type": "MedicalCondition",
        name: "Dor Crônica",
        associatedAnatomy: { "@type": "AnatomicalStructure", name: "Sistema Nervoso Central" },
      },
      specialty: { "@type": "MedicalSpecialty", name: "Medicina Canabinoide" },
      lastReviewed: "2026-04-14",
    };
    const serviceSchema = {
      "@context": "https://schema.org",
      "@type": "MedicalBusiness",
      name: "Planta & Raiz — Tratamento de Dor Crônica",
      description: "Orientação Técnica Online especializada em tratamento de dor crônica com cannabis medicinal em São Paulo.",
      url: "https://plantayraiz.com.br/tratamento-dor-cronica",
      telephone: "+55-11-99136-3154",
      priceRange: "R$30 - R$200",
      address: { "@type": "PostalAddress", streetAddress: "Av. Paulista, 1000", addressLocality: "São Paulo", addressRegion: "SP", postalCode: "01310-100", addressCountry: "BR" },
      geo: { "@type": "GeoCoordinates", latitude: -23.5632, longitude: -46.6542 },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "3200" },
      medicalSpecialty: ["CannabinoidMedicine", "PainManagement"],
      availableService: { "@type": "MedicalTherapy", name: "Tratamento Canabinoide para Dor Crônica", description: "Protocolo médico personalizado com CBD e THC para alívio de dores crônicas resistentes." },
    };

    const ids = ["faq-ld", "medical-ld", "service-ld"];
    const schemas = [faqSchema, medicalSchema, serviceSchema];
    ids.forEach((id, i) => {
      let el = document.getElementById(id);
      if (!el) { el = document.createElement("script"); el.id = id; el.setAttribute("type", "application/ld+json"); document.head.appendChild(el); }
      el.textContent = JSON.stringify(schemas[i]);
    });
    return () => ids.forEach(id => document.getElementById(id)?.remove());
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4">
                <ShieldCheck size={14} /> ANVISA Regulamentado
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Tratamento de <span className="text-primary">Dor Crônica</span> com Cannabis Medicinal em São Paulo
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-xl">
                Médicos especialistas em medicina canabinoide. Orientação Técnica Online a partir de <strong className="text-primary">R$30</strong> com prescrição digital ANVISA.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl">
                  <Link to="/agendamento">Agendar Orientação Técnica por R$30 <ArrowRight size={16} className="ml-1" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                  <a href="https://wa.me/5511991363154?text=Olá, tenho dúvida sobre tratamento de dor crônica" target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={16} className="mr-1" /> Pergunte à Brisa IA
                  </a>
                </Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
              <img src={heroImg} alt="Sistema endocanabinoide e tratamento de dor crônica com cannabis medicinal" width={1280} height={720} fetchpriority="high" className="rounded-2xl shadow-xl border border-primary/10 w-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Educativo — Sistema Endocanabinoide */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Como a Medicina Canabinoide atua no alívio de dores resistentes</h2>
          <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
            <p>O <strong className="text-foreground">Sistema Endocanabinoide (SEC)</strong> é um complexo sistema de sinalização celular presente em todo o corpo humano. Ele regula funções essenciais como dor, inflamação, humor e sono através de receptores CB1 e CB2.</p>
            <p>O <strong className="text-foreground">CBD (Canabidiol)</strong> e o <strong className="text-foreground">THC (Tetrahidrocanabinol)</strong> são fitocannabinoides que interagem diretamente com esses receptores, modulando a percepção de dor e reduzindo processos inflamatórios crônicos.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Heart, title: "Fibromialgia", desc: "Redução significativa da dor difusa e melhora do sono em pacientes refratários." },
              { icon: ShieldCheck, title: "Artrite Reumatoide", desc: "Ação anti-inflamatória que diminui a rigidez articular e o desconforto diário." },
              { icon: Leaf, title: "Dores Neuropáticas", desc: "Modulação dos sinais nervosos para alívio de dores persistentes e queimação." },
            ].map((item, i) => (
              <Card key={i} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <item.icon className="text-primary mb-3" size={28} />
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Intermediário */}
      <section className="py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 md:p-8 max-w-2xl mx-auto">
            <p className="text-lg font-bold text-foreground mb-2">Atendimento prioritário para pacientes de São Paulo</p>
            <p className="text-muted-foreground text-sm mb-4">Av. Paulista, 1000 — Orientação Técnica Online 24/7 com médicos especializados</p>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl">
              <Link to="/agendamento">Agendar Orientação Técnica por R$30 <ArrowRight size={16} className="ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">O que dizem nossos pacientes sobre o tratamento de dor</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={14} className="text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-3">"{t.text}"</p>
                  <p className="text-xs font-bold text-foreground">{t.name} <span className="text-muted-foreground font-normal">— {t.age} anos</span></p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Perguntas Frequentes sobre Dor Crônica e Cannabis</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl px-4 bg-card">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final + Brisa */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 p-8">
            <CheckCircle className="text-primary mx-auto mb-3" size={32} />
            <h2 className="text-xl md:text-2xl font-bold mb-2">Pronto para aliviar sua dor?</h2>
            <p className="text-muted-foreground text-sm mb-6">Converse com um de nossos especialistas e descubra o protocolo ideal para o seu caso.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl">
                <Link to="/agendamento">Agendar Orientação Técnica por R$30 <ArrowRight size={16} className="ml-1" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                <a href="https://wa.me/5511991363154?text=Dúvida sobre meu caso de dor crônica" target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={16} className="mr-1" /> Dúvida? Pergunte à Brisa
                </a>
              </Button>
            </div>
            <div className="mt-6">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-primary rounded-xl">
                <Link to="/" className="flex items-center gap-2">
                  <ArrowRight size={14} className="rotate-180" /> Ir para a Plataforma Planta y Raiz
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TratamentoDorCronica;
