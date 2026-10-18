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
    title: "Orientação e Telemedicina para Dor Crônica | Planta & Raiz",
    h1: "Telemedicina e Saúde Integrativa para Dor Crônica",
    metaDesc: "Avaliação médica para dor crônica com profissionais habilitados. Teleconsulta online e receita digital se indicada. Planta & Raiz.",
    heroText: "A avaliação médica individualizada define a indicação terapêutica para dor crônica com base em evidências científicas e no histórico clínico.",
    symptoms: ["Fibromialgia", "Dor neuropática", "Artrite", "Enxaqueca crônica", "Dor lombar"],
    benefits: ["Possibilidade de redução de analgésicos sob supervisão médica", "Melhora na rotina de repouso", "Abordagem anti-inflamatória integrativa", "Acompanhamento profissional contínuo"],
    studies: [
      { title: "Cannabinoids for Chronic Pain: A Systematic Review", source: "JAMA", year: "2023" },
      { title: "Cannabis-Based Medicines in Neuropathic Pain", source: "Cochrane Library", year: "2024" },
    ],
    faq: [
      { q: "Cannabis substitui analgésicos?", a: "Não substitui automaticamente, mas pode auxiliar na redução da necessidade sob supervisão médica estrita." },
      { q: "Quanto tempo leva para sentir efeito?", a: "A resposta terapêutica é individual e depende da dosagem ajustada pelo médico assistente." },
    ],
  },
  "ansiedade": {
    title: "Orientação Médica para Ansiedade | Planta & Raiz",
    h1: "Telemedicina e Avaliação Clínica para Ansiedade",
    metaDesc: "Avaliação clínica para ansiedade com médicos especializados. Telemedicina segura e receita digital válida se indicada. Planta & Raiz.",
    heroText: "Estudos clínicos avaliam o papel do CBD e fitoterápicos no suporte à saúde mental. Consulte um médico credenciado.",
    symptoms: ["Ansiedade generalizada", "Transtorno do pânico", "Ansiedade social", "TEPT", "Insônia associada"],
    benefits: ["Suporte clínico individualizado", "Melhora na qualidade do repouso", "Plano terapêutico personalizado", "Acompanhamento com médico assistente"],
    studies: [
      { title: "Cannabidiol in Anxiety and Sleep", source: "The Permanente Journal", year: "2023" },
      { title: "CBD for Social Anxiety Disorder", source: "Neuropsychopharmacology", year: "2024" },
    ],
    faq: [
      { q: "CBD causa dependência?", a: "Não. O canabidiol não possui potencial de dependência física ou síndrome de abstinência, conforme relatórios da OMS." },
      { q: "Posso usar junto com antidepressivos?", a: "Pode haver interações medicamentosas. O médico avaliará detalhadamente suas medicações em uso." },
    ],
  },
  "insonia": {
    title: "Orientação Médica para Insônia | Planta & Raiz",
    h1: "Telemedicina e Avaliação Clínica para Insônia",
    metaDesc: "Avaliação médica para distúrbios do sono com médicos habilitados. Teleconsulta online e conduta individualizada. Planta & Raiz.",
    heroText: "Estudos clínicos avaliam o impacto de canabinoides e hábitos na regulação do ciclo circadiano sob supervisão médica especializada.",
    symptoms: ["Insônia crônica", "Dificuldade para iniciar o sono", "Despertar noturno frequente", "Sono não reparador"],
    benefits: ["Indução fisiológica do relaxamento", "Ajuste na higiene do sono", "Abordagem sem dependência química", "Conduta clínica personalizada"],
    studies: [
      { title: "Cannabis, Cannabinoids, and Sleep", source: "Sleep Medicine Reviews", year: "2023" },
    ],
    faq: [
      { q: "THC ou CBD para insônia?", a: "Depende da avaliação médica individual. O profissional habilitado determina a formulação mais segura para o seu caso." },
    ],
  },
  "epilepsia": {
    title: "Orientação Médica para Epilepsia | Planta & Raiz",
    h1: "Acompanhamento Clínico para Epilepsia Refratária",
    metaDesc: "Telemedicina com médicos habilitados para epilepsias refratárias. Acompanhamento neurológico e prescrição conforme normas ANVISA.",
    heroText: "O CBD é regulamentado pela ANVISA para epilepsias refratárias, devendo ser utilizado com acompanhamento médico rigoroso.",
    symptoms: ["Epilepsia refratária", "Síndrome de Dravet", "Síndrome de Lennox-Gastaut", "Crises focais"],
    benefits: ["Suporte no manejo de crises sob orientação neurológica", "Embasamento regulatório ANVISA", "Acompanhamento contínuo", "Plano de titulação supervisionado"],
    studies: [
      { title: "Cannabidiol in Dravet Syndrome", source: "NEJM", year: "2022" },
      { title: "Long-term CBD Use in Pediatric Epilepsy", source: "Epilepsia", year: "2024" },
    ],
    faq: [
      { q: "Crianças podem usar?", a: "Sim, produtos à base de CBD podem ser prescritos para uso pediátrico em síndromes epilépticas específicas mediante avaliação especializada." },
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
            <Button size="lg" onClick={() => navigate("/telemedicina")}>
              Iniciar Triagem Prévia <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/profissionais")}>
              Ver Médicos Credenciados
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="h-4 w-4 text-primary" /> Resolução CFM nº 2.314/2022</span>
            <span className="flex items-center gap-1"><Shield className="h-4 w-4 text-primary" /> ANVISA RDC 660/2022</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> Prontuário Seguro</span>
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
        <h2 className="text-2xl font-bold mb-4">Agende sua orientação médica</h2>
        <p className="text-muted-foreground mb-6">Atendimento humanizado com médicos especialistas. A prescrição depende de avaliação individual.</p>
        <Button size="lg" onClick={() => navigate("/telemedicina")}>
          Iniciar Triagem Clínica <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      <Footer />
    </div>
  );
};

export default CondicaoTratamento;
