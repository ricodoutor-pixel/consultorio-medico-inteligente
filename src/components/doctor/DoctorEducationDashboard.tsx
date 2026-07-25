import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, BookOpen, Download, Lock, Star } from "lucide-react";
import { toast } from "sonner";

export const DoctorEducationDashboard = () => {
  const modules = [
    {
      id: 1,
      title: "Medicina Canabinoide na Prática",
      description: "Aprenda a prescrever, titular doses e manejar efeitos colaterais de forma segura.",
      type: "video",
      duration: "4h 30m",
      locked: false,
      progress: 60,
    },
    {
      id: 2,
      title: "Protocolos Endocanabinoides Avançados",
      description: "Casos clínicos complexos em Neurologia e Psiquiatria.",
      type: "video",
      duration: "6h 15m",
      locked: true,
      requirement: "Nível Prata",
    },
    {
      id: 3,
      title: "Guia de Interações Medicamentosas",
      description: "Material de apoio rápido para consulta em consultório.",
      type: "ebook",
      pages: "45 páginas",
      locked: false,
    },
    {
      id: 4,
      title: "Aprovação Anvisa: Passo a Passo",
      description: "Como auxiliar seu paciente no processo de autorização excepcional da Anvisa.",
      type: "ebook",
      pages: "22 páginas",
      locked: false,
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black font-display text-emerald-800">Educação Continuada</h2>
        <p className="text-muted-foreground text-sm">Capacitação constante para prescrição segura e baseada em evidências.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <Card key={mod.id} className={`overflow-hidden flex flex-col ${mod.locked ? 'opacity-80 grayscale-[0.5]' : 'hover:border-primary/50 transition-colors'}`}>
            <div className="h-32 bg-muted relative flex items-center justify-center border-b">
              {mod.type === 'video' ? (
                <PlayCircle className="w-12 h-12 text-muted-foreground/30" />
              ) : (
                <BookOpen className="w-12 h-12 text-muted-foreground/30" />
              )}
              {mod.locked && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center flex-col text-white backdrop-blur-[2px]">
                  <Lock className="w-8 h-8 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">{mod.requirement}</span>
                </div>
              )}
            </div>
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={mod.type === 'video' ? 'default' : 'secondary'} className="text-[10px]">
                  {mod.type === 'video' ? 'Videoaula' : 'E-book'}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  {mod.type === 'video' ? mod.duration : mod.pages}
                </span>
              </div>
              <h3 className="font-bold text-base leading-tight mb-2">{mod.title}</h3>
              <p className="text-xs text-muted-foreground flex-1 mb-4">{mod.description}</p>
              
              {!mod.locked ? (
                <div className="mt-auto">
                  {mod.type === 'video' && mod.progress !== undefined && (
                    <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${mod.progress}%` }}></div>
                    </div>
                  )}
                  <Button className="w-full" variant={mod.type === 'video' ? 'default' : 'outline'} onClick={() => {
                    if(mod.type === 'ebook') toast.success("Download iniciado!");
                    else toast.success("Abrindo player de vídeo...");
                  }}>
                    {mod.type === 'video' ? (
                      <><PlayCircle className="w-4 h-4 mr-2" /> {mod.progress && mod.progress > 0 ? 'Continuar' : 'Assistir'}</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2" /> Baixar PDF</>
                    )}
                  </Button>
                </div>
              ) : (
                <Button className="w-full mt-auto" variant="secondary" disabled>
                  Desbloqueie subindo de nível
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
