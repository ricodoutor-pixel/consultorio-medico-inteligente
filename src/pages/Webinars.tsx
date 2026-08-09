import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video, Play, Bell } from "lucide-react";

const upcomingWebinars = [
  {
    id: 1,
    title: "Cannabis e Dor Crônica: Protocolos Atualizados 2026",
    speaker: "Dra. Ana Paula Ribeiro",
    specialty: "Reumatologia",
    date: "10 Abr 2026",
    time: "19:00",
    duration: "90 min",
    registered: 342,
    maxCapacity: 500,
    tags: ["Dor Crônica", "Protocolos", "Ao Vivo"],
  },
  {
    id: 2,
    title: "Novas Evidências: CBD em Transtornos de Ansiedade",
    speaker: "Dr. Marcus Vinícius Costa",
    specialty: "Psiquiatria",
    date: "14 Abr 2026",
    time: "20:00",
    duration: "60 min",
    registered: 278,
    maxCapacity: 500,
    tags: ["CBD", "Ansiedade", "Evidências"],
  },
  {
    id: 3,
    title: "Legislação Cannabis 2026: O Que Mudou na RDC 660",
    speaker: "Dr. Roberto Mendes",
    specialty: "Direito Médico",
    date: "18 Abr 2026",
    time: "18:30",
    duration: "75 min",
    registered: 456,
    maxCapacity: 500,
    tags: ["Legislação", "ANVISA", "RDC 660"],
  },
];

const pastWebinars = [
  {
    id: 4,
    title: "Epilepsia Refratária e Cannabis: Casos Clínicos",
    speaker: "Dra. Camila Santos",
    date: "28 Mar 2026",
    views: 1200,
    duration: "85 min",
  },
  {
    id: 5,
    title: "Terpenos: O Papel na Eficácia Terapêutica",
    speaker: "Dr. Felipe Oliveira",
    date: "21 Mar 2026",
    views: 890,
    duration: "60 min",
  },
  {
    id: 6,
    title: "Cannabis em Oncologia: Qualidade de Vida",
    speaker: "Dra. Juliana Matos",
    date: "14 Mar 2026",
    views: 1540,
    duration: "90 min",
  },
];

export default function Webinars() {
  return (
    <>
      <SEO title="Webinars | Especialistas em Cannabis Medicinal | Planta & Raiz" description="Participe de webinars semanais gratuitos com especialistas em cannabis medicinal. Ao vivo com Q&A e certificado de participação." />
      <Navbar />
      <main className="min-h-dvh bg-background pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30">
              <Video size={14} className="mr-1" /> Ao Vivo & Gratuito
            </Badge>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4">
              Webinars <span className="text-primary">Semanais</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">Aprenda com os melhores especialistas em cannabis medicinal do Brasil e do mundo.</p>
          </div>

          {/* Upcoming */}
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><Calendar size={20} className="text-primary" /> Próximos Webinars</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {upcomingWebinars.map((w) => (
              <Card key={w.id} className="bg-card border-border hover:border-primary/40 transition-all group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse text-[10px]">🔴 AO VIVO</Badge>
                  </div>
                  <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">{w.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">{w.speaker}</p>
                    <p className="text-xs text-muted-foreground">{w.specialty}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {w.date}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {w.time}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {w.duration}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {w.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] px-2 py-0">{t}</Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Users size={12} className="inline mr-1" /> {w.registered}/{w.maxCapacity} inscritos
                  </div>
                  <Button className="w-full font-bold" size="sm">
                    <Bell size={14} className="mr-1" /> Inscrever-se Grátis
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Past */}
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><Play size={20} className="text-primary" /> Replays Disponíveis</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {pastWebinars.map((w) => (
              <Card key={w.id} className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                    <Play size={40} className="text-primary/50 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">{w.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{w.speaker} • {w.date}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span><Users size={12} className="inline mr-1" />{w.views} visualizações</span>
                    <span><Clock size={12} className="inline mr-1" />{w.duration}</span>
                  </div>
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
