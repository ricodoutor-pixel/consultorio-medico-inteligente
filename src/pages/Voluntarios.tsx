import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Clock, Award, Stethoscope, Globe, HandHeart, TrendingUp } from "lucide-react";

const stats = [
  { icon: Stethoscope, label: "Médicos Voluntários", value: "47" },
  { icon: Users, label: "Pacientes Atendidos", value: "1.230" },
  { icon: Clock, label: "Horas Doadas", value: "3.450" },
  { icon: Globe, label: "Estados Cobertos", value: "18" },
];

const volunteers = [
  { name: "Dra. Fernanda Lima", specialty: "Neurologia", hours: 120, patients: 85, state: "SP" },
  { name: "Dr. Roberto Alves", specialty: "Psiquiatria", hours: 95, patients: 62, state: "RJ" },
  { name: "Dra. Camila Souza", specialty: "Reumatologia", hours: 88, patients: 54, state: "MG" },
  { name: "Dr. André Costa", specialty: "Clínica Geral", hours: 76, patients: 48, state: "BA" },
  { name: "Dra. Juliana Santos", specialty: "Oncologia", hours: 65, patients: 40, state: "RS" },
  { name: "Dr. Marcos Oliveira", specialty: "Geriatria", hours: 58, patients: 35, state: "PR" },
];

export default function Voluntarios() {
  return (
    <>
      <SEO title="Médicos Voluntários | Planta & Raiz" description="Programa de médicos voluntários para pacientes que não podem pagar. Junte-se a nós e faça a diferença." />
      <Navbar />
      <main className="min-h-dvh bg-background pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-pink-500/20 text-pink-400 border-pink-500/30">
              <Heart size={14} className="mr-1" /> Impacto Social
            </Badge>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4">
              Médicos <span className="text-primary">Voluntários</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Conectamos médicos voluntários com pacientes que não podem pagar por consultas. Saúde de qualidade é um direito de todos.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-card border-border text-center">
                <CardContent className="p-6">
                  <stat.icon size={28} className="text-primary mx-auto mb-2" />
                  <p className="text-2xl font-black text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How it works */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-6 text-center">Como Funciona</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: HandHeart, title: "Cadastre-se", desc: "Médico se registra como voluntário informando especialidade e disponibilidade." },
                { icon: Users, title: "Matching", desc: "Sistema conecta automaticamente com pacientes que precisam de atendimento." },
                { icon: Award, title: "Certificado", desc: "Receba certificado de voluntariado e reconhecimento público na plataforma." },
              ].map((step, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                      <step.icon size={24} className="text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Top Volunteers */}
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" /> Destaques do Mês
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {volunteers.map((v, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/30 transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Stethoscope size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-sm">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{v.specialty} • {v.state}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span><Clock size={10} className="inline mr-1" />{v.hours}h</span>
                      <span><Users size={10} className="inline mr-1" />{v.patients} pacientes</span>
                    </div>
                  </div>
                  {i < 3 && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">🏆 Top {i + 1}</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" className="font-black text-lg px-10">
              <Heart size={20} className="mr-2" /> Quero Ser Voluntário
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
