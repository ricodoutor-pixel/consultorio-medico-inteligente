import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Star, ShieldCheck, Moon, Brain, Flame, MessageCircle, CheckCircle, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-ansiedade-saude-mental.jpg";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const testimonials = [
  { name: "Ana L.", age: 34, text: "Depois de anos com ansiolíticos, finalmente encontrei equilíbrio com o CBD. Durmo tranquila e acordo disposta.", stars: 5 },
  { name: "Felipe R.", age: 28, text: "O burnout quase acabou com minha carreira. O tratamento canabinoide me devolveu a clareza mental que eu precisava.", stars: 5 },
  { name: "Juliana M.", age: 42, text: "Minha insônia crônica de 8 anos melhorou em 3 semanas. Sem efeitos colaterais, sem dependência.", stars: 5 },
  { name: "Carlos D.", age: 55, text: "A ansiedade generalizada controlava minha vida. Com o protocolo da Planta & Raiz, recuperei minha liberdade.", stars: 5 },
];

const faqs = [
  { q: "O CBD vicia?", a: "Não. O CBD (Canabidiol) não possui propriedades aditivas. A Organização Mundial da Saúde (OMS) reconhece que o CBD não apresenta potencial de abuso ou dependência. Ele atua modulando o sistema endocanabinoide de forma equilibrada." },
  { q: "Vou ficar 'dopado' com o tratamento?", a: "Não. O CBD é um composto não-psicotrópico. Diferente do THC recreativo, o CBD medicinal não causa alteração de consciência, euforia ou comprometimento cognitivo. Você continua 100% funcional." },
  { q: "Como é feita a prescrição digital?", a: "Após a orientação técnica online, o médico emite uma prescrição digital com assinatura eletrônica ICP-Brasil, válida em todo o Brasil. O documento segue os protocolos da ANVISA (RDC 660/2022) e é enviado diretamente ao seu e-mail." },
  { q: "O tratamento com cannabis para ansiedade é legalizado?", a: "Sim. A ANVISA regulamenta o uso medicinal de cannabis no Brasil. A prescrição é feita por médico habilitado com receita tipo B, seguindo protocolos rigorosos de segurança e eficácia." },
  { q: "Quanto tempo leva para sentir os efeitos no sono e na ansiedade?", a: "A maioria dos pacientes relata melhora significativa na qualidade do sono entre 1 a 3 semanas. Para ansiedade, os efeitos costumam ser percebidos entre 2 a 4 semanas de uso contínuo." },
  { q: "Posso usar CBD junto com meu antidepressivo?", a: "A interação medicamentosa deve ser avaliada pelo médico durante a orientação técnica online. Em muitos casos, o CBD pode ser utilizado de forma complementar, mas a dosagem precisa ser ajustada individualmente." },
];

const TratamentoAnsiedadeSaudeMental = () => {
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
      name: "Tratamento com Cannabis Medicinal para Ansiedade e Insônia",
      about: {
        "@type": "MedicalCondition",
        name: "Transtornos de Ansiedade e Insônia",
        associatedAnatomy: { "@type": "AnatomicalStructure", name: "Sistema Nervoso Central" },
      },
      specialty: { "@type": "MedicalSpecialty", name: "Medicina Canabinoide — Saúde Mental" },
      lastReviewed: "2026-04-14",
    };
    const serviceSchema = {
      "@context": "https://schema.org",
      "@type": "MedicalBusiness",
      name: "Planta & Raiz — Tratamento de Ansiedade e Saúde Mental",
      description: "Orientação Técnica Online especializada em tratamento de ansiedade, insônia e saúde mental com cannabis medicinal em São Paulo.",
      url: "https://plantayraiz.com.br/tratamento-ansiedade-saude-mental",
      telephone: "+55-11-99136-3154",
      priceRange: "R$30 - R$200",
      address: { "@type": "PostalAddress", streetAddress: "Av. Paulista, 1000", addressLocality: "São Paulo", addressRegion: "SP", postalCode: "01310-100", addressCountry: "BR" },
      geo: { "@type": "GeoCoordinates", latitude: -23.5632, longitude: -46.6542 },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "3200" },
      medicalSpecialty: ["CannabinoidMedicine", "Psychiatry", "SleepMedicine"],
      availableService: { "@type": "MedicalTherapy", name: "Tratamento Canabinoide para Ansiedade e Insônia", description: "Protocolo médico personalizado com CBD para alívio de ansiedade, insônia crônica e burnout." },
    };

    const ids = ["faq-mental-ld", "medical-mental-ld", "service-mental-ld"];
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
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-4">
                <ShieldCheck size={14} /> ANVISA Regulamentado
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Tratamento com <span className="text-primary">Cannabis Medicinal</span> para Ansiedade e Insônia em São Paulo
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-xl">
                Protocolo médico personalizado com CBD para equilíbrio emocional e qualidade do sono. Orientação Técnica Online a partir de <strong className="text-primary">R$30</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl">
                  <a href="https://wa.me/5511991363154?text=Olá Brisa, quero agendar uma Orientação Técnica de Saúde Mental (R$30)." target="_blank" rel="noopener noreferrer">Agendar Orientação Técnica de Saúde Mental - R$30 <ArrowRight size={16} className="ml-1" /></a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                  <a href="https://wa.me/5511991363154?text=Olá, gostaria de saber mais sobre tratamento para ansiedade com cannabis medicinal" target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={16} className="mr-1" /> Pergunte à Brisa IA
                  </a>
                </Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
              <img src={heroImg} alt="Tratamento de ansiedade e insônia com cannabis medicinal CBD em São Paulo" width={1280} height={720} fetchpriority="high" className="rounded-2xl shadow-xl border border-blue-500/10 w-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Educativo — CBD e Saúde Mental */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Como o CBD auxilia no equilíbrio do humor e na regulação do sono</h2>
          <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
            <p>O <strong className="text-foreground">Canabidiol (CBD)</strong> atua diretamente no sistema endocanabinoide e nos receptores serotoninérgicos (5-HT1A), modulando a resposta ao estresse e promovendo sensação de calma sem efeitos psicotrópicos.</p>
            <p>Estudos clínicos demonstram que o CBD pode <strong className="text-foreground">reduzir o cortisol</strong> (hormônio do estresse), <strong className="text-foreground">melhorar a arquitetura do sono</strong> (fases REM e profundo) e <strong className="text-foreground">restaurar o equilíbrio do sistema nervoso autônomo</strong>.</p>
          </div>

          {/* Condition Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Brain, title: "Ansiedade Generalizada (TAG)", desc: "Modulação do cortisol e ativação dos receptores 5-HT1A para redução de preocupação excessiva e tensão muscular crônica.", color: "text-blue-400" },
              { icon: Moon, title: "Insônia Crônica", desc: "Regulação do ciclo circadiano e melhora da higiene do sono, promovendo fases de sono profundo mais longas e restauradoras.", color: "text-indigo-400" },
              { icon: Flame, title: "Burnout e Estresse", desc: "Restauração da homeostase do sistema nervoso, combatendo exaustão emocional, despersonalização e fadiga cognitiva.", color: "text-amber-400" },
            ].map((item, i) => (
              <Card key={i} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <item.icon className={`${item.color} mb-3`} size={28} />
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
          <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-6 md:p-8 max-w-2xl mx-auto">
            <p className="text-lg font-bold text-foreground mb-2">Sentindo-se sobrecarregado?</p>
            <p className="text-muted-foreground text-sm mb-4">Faça uma pré-triagem gratuita com a IA Brisa e descubra como a medicina canabinoide pode ajudar.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl">
                <a href="https://wa.me/5511991363154?text=Olá Brisa, quero agendar minha Orientação Técnica (R$30)." target="_blank" rel="noopener noreferrer">Agendar Orientação Técnica - R$30 <ArrowRight size={16} className="ml-1" /></a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                <a href="https://wa.me/5511991363154?text=Gostaria de fazer uma pré-triagem para ansiedade" target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={16} className="mr-1" /> Triagem com Brisa IA
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Histórias reais de pacientes que recuperaram o equilíbrio</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Perguntas Frequentes sobre CBD, Ansiedade e Sono</h2>
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

      {/* CTA Final */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-primary/10 border border-primary/20 p-8">
            <CheckCircle className="text-primary mx-auto mb-3" size={32} />
            <h2 className="text-xl md:text-2xl font-bold mb-2">Pronto para recuperar sua tranquilidade?</h2>
            <p className="text-muted-foreground text-sm mb-6">Converse com um especialista e descubra como o CBD pode transformar sua qualidade de vida.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl">
                <a href="https://wa.me/5511991363154?text=Olá Brisa, quero agendar minha Orientação Técnica (R$30)." target="_blank" rel="noopener noreferrer">Agendar Orientação Técnica - R$30 <ArrowRight size={16} className="ml-1" /></a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                <a href="https://wa.me/5511991363154?text=Dúvida sobre tratamento para ansiedade e insônia com CBD" target="_blank" rel="noopener noreferrer">
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

export default TratamentoAnsiedadeSaudeMental;
