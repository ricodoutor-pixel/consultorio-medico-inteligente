import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Star, Shield, Clock, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const CONDITIONS: Record<string, {
  title: string;
  h1: string;
  metaDesc: string;
  heroText: string;
  symptoms: string[];
  benefits: string[];
  studies: { title: string; source: string; year: string }[];
  faq: { q: string; a: string }[];
}> = {
  "dor-cronica": {
    title: "Tratamento Cannabis para Dor Crônica | Planta & Raiz",
    h1: "Tratamento com Cannabis Medicinal para Dor Crônica",
    metaDesc: "Alivie a dor crônica com cannabis medicinal. Orientação Técnica online com médicos especializados. Prescrição digital em até 24h. Planta & Raiz.",
    heroText: "Mais de 37% dos pacientes com dor crônica relatam melhora significativa com cannabis medicinal. Consulte um especialista hoje.",
    symptoms: ["Fibromialgia", "Dor neuropática", "Artrite", "Enxaqueca crônica", "Dor lombar"],
    benefits: ["Redução de até 30% no uso de opioides", "Melhora na qualidade do sono", "Anti-inflamatório natural", "Menor risco de dependência"],
    studies: [
      { title: "Cannabinoids for Chronic Pain: A Systematic Review", source: "JAMA", year: "2023" },
      { title: "Cannabis-Based Medicines in Neuropathic Pain", source: "Cochrane Library", year: "2024" },
    ],
    faq: [
      { q: "Cannabis substitui analgésicos?", a: "Não substitui automaticamente, mas pode reduzir a necessidade de opioides sob supervisão médica." },
      { q: "Quanto tempo leva para sentir efeito?", a: "Óleos sublinguais costumam agir em 15-45 minutos. Efeitos terapêuticos plenos em 2-4 semanas de uso contínuo." },
    ],
  },
  "ansiedade": {
    title: "Cannabis Medicinal para Ansiedade | Planta & Raiz",
    h1: "Tratamento com Cannabis Medicinal para Ansiedade",
    metaDesc: "Trate ansiedade com CBD e cannabis medicinal. Médicos especializados online. Receita digital segura. Planta & Raiz.",
    heroText: "O CBD tem demonstrado efeitos ansiolíticos em estudos clínicos. Converse com um especialista e inicie seu tratamento.",
    symptoms: ["Ansiedade generalizada", "Transtorno do pânico", "Ansiedade social", "TEPT", "Insônia por ansiedade"],
    benefits: ["Efeito ansiolítico sem dependência", "Melhora no sono", "Redução de crises de pânico", "Compatível com outros tratamentos"],
    studies: [
      { title: "Cannabidiol in Anxiety and Sleep", source: "The Permanente Journal", year: "2023" },
      { title: "CBD for Social Anxiety Disorder", source: "Neuropsychopharmacology", year: "2024" },
    ],
    faq: [
      { q: "CBD causa dependência?", a: "Não. O CBD não é viciante e não causa síndrome de abstinência, conforme a OMS." },
      { q: "Posso usar junto com antidepressivos?", a: "Pode haver interações. O médico avaliará seu caso e ajustará as dosagens de forma segura." },
    ],
  },
  "insonia": {
    title: "Cannabis Medicinal para Insônia | Planta & Raiz",
    h1: "Tratamento com Cannabis Medicinal para Insônia",
    metaDesc: "Durma melhor com cannabis medicinal. Médicos online especializados em distúrbios do sono. Prescrição em 24h. Planta & Raiz.",
    heroText: "Mais de 70% dos pacientes reportam melhora na qualidade do sono com cannabis medicinal nas primeiras semanas.",
    symptoms: ["Insônia crônica", "Dificuldade para iniciar o sono", "Despertar noturno", "Sono não reparador", "Apneia leve"],
    benefits: ["Indução natural do sono", "Melhora nos ciclos REM", "Sem efeito ressaca matinal", "Alternativa a benzodiazepínicos"],
    studies: [
      { title: "Cannabis, Cannabinoids, and Sleep", source: "Sleep Medicine Reviews", year: "2023" },
    ],
    faq: [
      { q: "THC ou CBD para insônia?", a: "Depende do perfil. CBD relaxa sem sedação. THC em baixa dose pode induzir o sono. O médico define o melhor protocolo." },
    ],
  },
  "epilepsia": {
    title: "Cannabis Medicinal para Epilepsia | Planta & Raiz",
    h1: "Tratamento com Cannabis Medicinal para Epilepsia",
    metaDesc: "Cannabis medicinal para epilepsia refratária. Médicos especializados. Prescrição digital ANVISA. Planta & Raiz.",
    heroText: "O CBD é aprovado pela ANVISA para epilepsias refratárias. Tratamento com acompanhamento médico especializado.",
    symptoms: ["Epilepsia refratária", "Síndrome de Dravet", "Síndrome de Lennox-Gastaut", "Crises parciais", "Espasmos infantis"],
    benefits: ["Redução de até 50% nas crises", "Aprovado pela ANVISA (Epidiolex)", "Seguro para uso pediátrico", "Melhora cognitiva associada"],
    studies: [
      { title: "Cannabidiol in Dravet Syndrome", source: "NEJM", year: "2022" },
      { title: "Long-term CBD Use in Pediatric Epilepsy", source: "Epilepsia", year: "2024" },
    ],
    faq: [
      { q: "Crianças podem usar?", a: "Sim. O Epidiolex (CBD) é aprovado para uso pediátrico em epilepsias específicas, com acompanhamento neurológico." },
    ],
  },
};

const CondicaoTratamento = () => {
  const { condicao } = useParams<{ condicao: string }>();
  const navigate = useNavigate();
  const data = CONDITIONS[condicao || ""];

  if (!data) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Condição não encontrada</h1>
          <Button onClick={() => navigate("/tratamentos")}>Ver todas as condições</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: data.title,
    description: data.metaDesc,
    about: { "@type": "MedicalCondition", name: data.h1 },
    provider: {
      "@type": "MedicalOrganization",
      name: "Planta & Raiz",
      url: "https://plantayraiz.com.br",
    },
  };

  return (
    <div className="min-h-dvh bg-background">
      <Helmet>
        <title>{data.title}</title>
        <meta name="description" content={data.metaDesc} />
        <link rel="canonical" href={`https://plantayraiz.com.br/condicao/${condicao}`} />
        <script type="application/ld+json">{JSON.stringify(schemaOrg)}</script>
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/10 to-background">
        <div className="container max-w-4xl text-center">
          <Badge className="mb-4">Cannabis Medicinal</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">{data.h1}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">{data.heroText}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate("/quiz")}>
              Iniciar Avaliação Gratuita <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/falar-com-especialista")}>
              Falar com Especialista
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-primary" /> 4.9/5 avaliação</span>
            <span className="flex items-center gap-1"><Shield className="h-4 w-4 text-primary" /> ANVISA compliant</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> Receita em 24h</span>
          </div>
        </div>
      </section>

      {/* Symptoms */}
      <section className="py-12 container max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">Sintomas tratados</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.symptoms.map((s) => (
            <Card key={s} className="border-border/40">
              <CardContent className="flex items-center gap-2 p-4">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{s}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-muted/30">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Benefícios comprovados</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/40">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studies */}
      <section className="py-12 container max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">Evidência científica</h2>
        <div className="space-y-3">
          {data.studies.map((s) => (
            <div key={s.title} className="p-4 rounded-lg border border-border/40 bg-card">
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.source} · {s.year}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-muted/30">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Perguntas frequentes</h2>
          <div className="space-y-4">
            {data.faq.map((f) => (
              <details key={f.q} className="group p-4 rounded-lg border border-border/40 bg-card">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 container max-w-4xl text-center">
        <h2 className="text-2xl font-bold mb-4">Pronto para iniciar seu tratamento?</h2>
        <p className="text-muted-foreground mb-6">Avaliação gratuita. Prescrição digital em até 24h.</p>
        <Button size="lg" onClick={() => navigate("/quiz")}>
          Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      <Footer />
    </div>
  );
};

export default CondicaoTratamento;
