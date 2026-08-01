import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AlertTriangle, TrendingDown, CheckCircle2, Stethoscope, Droplets, Moon, Brain, PenTool } from "lucide-react";
import { analyzeTitulationLogs, TitulationLog } from "@/lib/brisaTitulationEngine";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Mock Data
const mockLogs: TitulationLog[] = [
  { date: "2023-10-01", drops: 2, symptomScore: 8, sleepQuality: "bad", sideEffects: "none" },
  { date: "2023-10-02", drops: 2, symptomScore: 8, sleepQuality: "bad", sideEffects: "none" },
  { date: "2023-10-03", drops: 3, symptomScore: 7, sleepQuality: "regular", sideEffects: "mild" },
  { date: "2023-10-04", drops: 3, symptomScore: 7, sleepQuality: "regular", sideEffects: "none" },
  { date: "2023-10-05", drops: 4, symptomScore: 6, sleepQuality: "good", sideEffects: "none" },
  { date: "2023-10-06", drops: 4, symptomScore: 5, sleepQuality: "good", sideEffects: "none" },
  { date: "2023-10-07", drops: 5, symptomScore: 4, sleepQuality: "good", sideEffects: "none" },
];

const mockAlertLogs: TitulationLog[] = [
  ...mockLogs.slice(0, 5),
  { date: "2023-10-06", drops: 5, symptomScore: 6, sleepQuality: "bad", sideEffects: "moderate" },
  { date: "2023-10-07", drops: 6, symptomScore: 7, sleepQuality: "bad", sideEffects: "severe" },
];

interface TitulacaoTrackerCardProps {
  role: "patient" | "doctor";
  simulateAlert?: boolean; // For demo purposes
}

export function TitulacaoTrackerCard({ role, simulateAlert = false }: TitulacaoTrackerCardProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const logs = simulateAlert ? mockAlertLogs : mockLogs;
  const analysis = analyzeTitulationLogs(logs);

  const chartData = logs.map(log => ({
    day: new Date(log.date).getDate(),
    drops: log.drops,
    symptoms: log.symptomScore
  }));

  const handleCheckin = () => {
    setIsOpen(false);
    toast({
      title: "Check-in Registrado!",
      description: "A Brisa IA já atualizou o seu gráfico de evolução.",
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingDown className="text-primary" /> 
              {role === "patient" ? "Meu Diário de Titulação" : "Curva de Titulação (Brisa 2.0)"}
            </CardTitle>
            <CardDescription>
              {role === "patient" 
                ? "Acompanhamento diário da sua adaptação (Dia 7 de 30)" 
                : "Monitoramento autônomo Start Low, Go Slow"}
            </CardDescription>
          </div>
          
          {role === "doctor" && analysis.status === "ALERT_DOCTOR_REVISION" && (
            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1 flex items-center gap-1">
              <AlertTriangle size={14} /> Red Flag
            </Badge>
          )}
          {role === "doctor" && analysis.status === "ON_TRACK" && (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1 flex items-center gap-1">
              <CheckCircle2 size={14} /> Estável
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Doctor Analysis Banner */}
        {role === "doctor" && (
          <div className={`p-4 rounded-xl border ${
            analysis.status === "ALERT_DOCTOR_REVISION" 
              ? "bg-red-500/5 border-red-500/20" 
              : "bg-muted/50 border-border"
          }`}>
            <h4 className={`font-bold flex items-center gap-2 ${
              analysis.status === "ALERT_DOCTOR_REVISION" ? "text-red-500" : "text-foreground"
            }`}>
              <Stethoscope size={16} /> Parecer Brisa IA
            </h4>
            <p className="text-sm mt-1 text-muted-foreground">{analysis.doctorSuggestion}</p>
          </div>
        )}

        {/* Chart */}
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Line yAxisId="left" type="monotone" dataKey="drops" name="Gotas/Dia" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} />
              <Line yAxisId="right" type="monotone" dataKey="symptoms" name="Sintomas (1-10)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
            <span className="text-muted-foreground font-bold">Dose (Gotas)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
            <span className="text-muted-foreground font-bold">Nível do Sintoma</span>
          </div>
        </div>

        {/* Patient Action */}
        {role === "patient" && (
          <div className="pt-4 border-t border-border">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="w-full font-bold h-12 rounded-xl text-md" variant="default">
                  <PenTool className="mr-2" /> Registrar Check-in de Hoje (1 Min)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Check-in Diário (Dia 8)</DialogTitle>
                  <DialogDescription>
                    Como você está se sentindo hoje? Seus dados ajudam seu médico a ajustar a dose perfeita.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="space-y-3">
                    <label className="text-sm font-bold flex items-center gap-2"><Droplets size={16} className="text-primary"/> Quantas gotas tomou hoje no total?</label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="w-10 h-10 rounded-full p-0">-</Button>
                      <span className="text-xl font-black w-12 text-center">5</span>
                      <Button variant="outline" className="w-10 h-10 rounded-full p-0">+</Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold flex items-center gap-2"><Brain size={16} className="text-red-500"/> Nível dos sintomas hoje (0 a 10)</label>
                    <input type="range" min="0" max="10" defaultValue="4" className="w-full accent-primary" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 (Ótimo)</span>
                      <span>10 (Muito Ruim)</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold flex items-center gap-2"><Moon size={16} className="text-indigo-500"/> Como foi o seu sono?</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="bg-green-500/10 border-green-500/20 text-green-600">Bom</Button>
                      <Button variant="outline" className="text-muted-foreground">Regular</Button>
                      <Button variant="outline" className="text-muted-foreground">Ruim</Button>
                    </div>
                  </div>
                </div>

                <Button className="w-full font-bold h-12" onClick={handleCheckin}>
                  Salvar Diário
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
