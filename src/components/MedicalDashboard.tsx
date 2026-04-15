import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Video, FileText, History, User, MessageCircle, Clock, Pill, Stethoscope, Brain, AlertTriangle } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  cpf: string;
  age: number;
  waitTime: number;
  tags: string[];
  avatar?: string;
  urgency: "low" | "medium" | "high";
  symptoms?: string;
}

const WAITING_ROOM: Patient[] = [
  { id: "1", name: "Maria Silva", cpf: "***.***.789-01", age: 45, waitTime: 3, tags: ["Dor Crônica", "Retorno"], urgency: "medium", symptoms: "Lombalgia persistente, insônia" },
  { id: "2", name: "João Santos", cpf: "***.***.456-78", age: 32, waitTime: 8, tags: ["Ansiedade", "1ª Consulta"], urgency: "low", symptoms: "Ansiedade generalizada, pânico noturno" },
  { id: "3", name: "Ana Costa", cpf: "***.***.123-45", age: 58, waitTime: 1, tags: ["Epilepsia", "Urgente"], urgency: "high", symptoms: "Crises refratárias, 3x/semana" },
  { id: "4", name: "Carlos Oliveira", cpf: "***.***.321-00", age: 67, waitTime: 12, tags: ["Parkinson", "Retorno"], urgency: "medium", symptoms: "Tremores, rigidez muscular" },
];

const MOCK_PATIENT = WAITING_ROOM[0];

export function MedicalDashboard() {
  const [activePatient, setActivePatient] = useState<Patient>(MOCK_PATIENT);
  const [notes, setNotes] = useState("");

  const urgencyColor = {
    low: "text-primary",
    medium: "text-[hsl(var(--warning,45_100%_50%))]",
    high: "text-destructive",
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Sidebar: Fila de Espera */}
      <aside className="w-72 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2 px-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Sala de Espera</h2>
          <Badge variant="secondary" className="ml-auto">{WAITING_ROOM.length}</Badge>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {WAITING_ROOM.map((p) => (
            <Card
              key={p.id}
              onClick={() => setActivePatient(p)}
              className={`cursor-pointer p-3 transition-colors border-border/40 ${
                activePatient.id === p.id
                  ? "bg-primary/10 border-primary/40"
                  : "bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium truncate">{p.name}</span>
                <span className={`text-xs flex items-center gap-1 ${urgencyColor[p.urgency]}`}>
                  <Clock className="h-3 w-3" />
                  {p.waitTime} min
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                    {t}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </aside>

      {/* Main: Prontuário e Atendimento */}
      <main className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Header do paciente */}
        <Card className="p-4 bg-card border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{activePatient.name}</h1>
                <p className="text-sm text-muted-foreground">
                  CPF: {activePatient.cpf} • Idade: {activePatient.age} anos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="gap-2">
                <Video className="h-4 w-4" /> Iniciar Teleconsulta
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" /> Chat
              </Button>
            </div>
          </div>
        </Card>

        {/* Content grid */}
        <section className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Anamnese & Notas */}
          <Card className="bg-card border-border/40 p-5 flex flex-col">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Anamnese &amp; Notas
            </h3>

            {activePatient.symptoms && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30 mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Queixa principal (Triagem Brisa):</p>
                <p className="text-sm">{activePatient.symptoms}</p>
              </div>
            )}

            <Textarea
              placeholder="Digite suas notas clínicas aqui..."
              className="flex-1 min-h-[120px] resize-none bg-background/50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Histórico
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Brain className="h-3.5 w-3.5" /> Sugestão IA
              </Button>
            </div>
          </Card>

          {/* Prescrição Digital */}
          <Card className="bg-card border-border/40 p-5 flex flex-col">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Prescrição Digital
            </h3>

            <div className="space-y-3 flex-1">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <Brain className="h-4 w-4" /> Protocolo Sugerido (IA):
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  CBD Full Spectrum 10% — 1 gota/kg/dia, sublingual, 2x ao dia
                </p>
              </div>

              {activePatient.urgency === "high" && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">
                    Paciente com urgência alta. Considere dose de ataque.
                  </p>
                </div>
              )}

              <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">
                + Adicionar Item do Marketplace
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-border/30">
              <Button className="w-full py-5 font-bold text-base">
                Finalizar e Assinar Digitalmente
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default MedicalDashboard;
