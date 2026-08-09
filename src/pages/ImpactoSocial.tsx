import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, MapPin, Stethoscope, BookOpen, DollarSign, TrendingUp, Globe, Leaf } from "lucide-react";

const metrics = [
  { icon: Users, label: "Pacientes Atendidos", value: "12.450", growth: "+23%", color: "text-primary" },
  { icon: Stethoscope, label: "Médicos na Plataforma", value: "185", growth: "+15%", color: "text-blue-400" },
  { icon: Heart, label: "Orientações Técnicas Voluntárias", value: "1.230", growth: "+40%", color: "text-pink-400" },
  { icon: MapPin, label: "Cidades Alcançadas", value: "340", growth: "+18%", color: "text-yellow-400" },
  { icon: BookOpen, label: "Artigos Publicados", value: "520", growth: "+12%", color: "text-purple-400" },
  { icon: DollarSign, label: "Economia ao Paciente", value: "R$ 2.8M", growth: "+30%", color: "text-green-400" },
];

const goals = [
  { label: "Meta 2026: 20.000 pacientes atendidos", progress: 62 },
  { label: "Meta 2026: 300 médicos cadastrados", progress: 61 },
  { label: "Meta 2026: Cobertura em todos os 26 estados", progress: 69 },
  { label: "Meta 2026: 2.000 consultas voluntárias", progress: 61 },
];

const impactStories = [
  {
    name: "Dona Maria, 68 anos",
    location: "Belém, PA",
    story: "Após 3 anos de dor crônica, encontrou alívio com cannabis medicinal prescrita via telemedicina. Nunca teria acesso a um especialista sem a plataforma.",
  },
  {
    name: "Pedro, 12 anos",
    location: "Recife, PE",
    story: "Diagnosticado com epilepsia refratária, Pedro reduziu as crises em 80% após tratamento com CBD prescrito por um médico voluntário.",
  },
  {
    name: "Sandra, 45 anos",
    location: "Manaus, AM",
    story: "Profissional de saúde que se capacitou nos cursos gratuitos e hoje atende pacientes em sua comunidade com cannabis medicinal.",
  },
];

export default function ImpactoSocial() {
  return (
    <>
      <SEO title="Impacto Social | Planta & Raiz" description="Relatório transparente de impacto social da Planta & Raiz. Veja como estamos democratizando o acesso à cannabis medicinal." />
      <Navbar />
      <main className="min-h-dvh bg-background pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Globe size={14} className="mr-1" /> Relatório Transparente
            </Badge>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4">
              Nosso <span className="text-primary">Impacto Social</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Acreditamos que saúde de qualidade é um direito. Veja como a Planta & Raiz está transformando vidas em todo o Brasil.
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {metrics.map((m) => (
              <Card key={m.label} className="bg-card border-border">
                <CardContent className="p-5 text-center">
                  <m.icon size={28} className={`${m.color} mx-auto mb-2`} />
                  <p className="text-2xl md:text-3xl font-black text-foreground">{m.value}</p>
                  <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                  <Badge variant="outline" className="text-[10px] text-green-400 border-green-500/30">
                    <TrendingUp size={10} className="mr-1" /> {m.growth}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Goals */}
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Leaf size={20} className="text-primary" /> Metas 2026
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {goals.map((g) => (
              <Card key={g.label} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">{g.label}</p>
                    <span className="text-sm font-bold text-primary">{g.progress}%</span>
                  </div>
                  <Progress value={g.progress} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stories */}
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Heart size={20} className="text-pink-400" /> Histórias de Impacto
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {impactStories.map((s, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="text-4xl mb-3">💚</div>
                  <p className="text-sm text-muted-foreground italic mb-4">"{s.story}"</p>
                  <p className="font-bold text-foreground text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={10} /> {s.location}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
