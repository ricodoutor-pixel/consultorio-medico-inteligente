/**
 * Ferramentas Auxiliares de Monitoramento e Diagnóstico
 * Card no dashboard do médico que permite iniciar uma aferição PPG
 * (frequência cardíaca + estimativa de pressão arterial) antes da consulta.
 * Ao clicar, abre um modal com o monitor PPG e um link rápido para o paciente
 * executar o mesmo teste no celular dele.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import MonitorCardiaco from "@/components/MonitorCardiaco";
import { HeartPulse, Stethoscope, Activity, Share2, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PATIENT_MONITOR_URL = "https://plantayraiz.com.br/monitor-cardiaco";

export function DoctorAuxDiagnosticTools() {
  const [bpOpen, setBpOpen] = useState(false);

  const sharePatientLink = async () => {
    const msg = `Olá! Antes da consulta, peço que faça uma aferição rápida (30s) de frequência cardíaca e estimativa de pressão arterial pelo celular:\n\n${PATIENT_MONITOR_URL}\n\nApós medir, me envie o resultado pelo WhatsApp. — Equipe Planta y Raiz`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    try {
      await navigator.clipboard.writeText(PATIENT_MONITOR_URL);
      toast({ title: "Link copiado", description: "Cole no chat do paciente." });
    } catch {
      // ignore
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="mb-8" aria-labelledby="aux-diag-title">
      <div className="flex items-center justify-between mb-3">
        <h3
          id="aux-diag-title"
          className="font-display font-black text-foreground flex items-center gap-2"
        >
          <Stethoscope size={18} className="text-primary" />
          Ferramentas Auxiliares de Monitoramento e Diagnóstico
        </h3>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          Pré-consulta · prescritores
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aferição PPG + Pressão Arterial */}
        <Card className="border-border hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <HeartPulse size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">
                  Aferição de Pressão Arterial (PPG)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inicia o monitor PPG via câmera. Mede BPM, HRV e gera
                  estimativa de pressão arterial com resumo em tempo real.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setBpOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
                size="sm"
              >
                <Activity size={14} className="mr-1" /> Iniciar aferição agora
              </Button>
              <Button
                onClick={sharePatientLink}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Share2 size={14} className="mr-1" /> Enviar ao paciente
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground flex items-start gap-1.5 leading-relaxed">
              <Info size={11} className="mt-0.5 shrink-0" />
              Estimativa não-invasiva. Não substitui esfigmomanômetro calibrado.
              Use como triagem pré-consulta.
            </p>
          </CardContent>
        </Card>

        {/* Placeholder/estrutura para futuras ferramentas — mantém o grid simétrico */}
        <Card className="border-dashed border-border/60 bg-muted/10">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Em breve:</strong> oximetria
              estimada, frequência respiratória e análise de variabilidade
              autonômica integradas ao prontuário.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal com o monitor PPG ao vivo */}
      <Dialog open={bpOpen} onOpenChange={setBpOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse size={18} className="text-primary" />
              Aferição PPG ao vivo — Pré-consulta
            </DialogTitle>
            <DialogDescription>
              Posicione a câmera traseira sobre o dedo. Em 30 segundos você verá
              o resumo (BPM, HRV, estimativa de pressão arterial e
              classificação).
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <MonitorCardiaco />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default DoctorAuxDiagnosticTools;
