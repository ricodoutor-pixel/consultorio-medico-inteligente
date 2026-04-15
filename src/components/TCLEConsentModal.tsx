import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, CheckCircle2 } from "lucide-react";

interface TCLEConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  doctorName?: string;
  patientName?: string;
}

export const TCLEConsentModal = ({ open, onAccept, onDecline, doctorName = "Médico(a)", patientName = "Paciente" }: TCLEConsentModalProps) => {
  const [checks, setChecks] = useState({
    read: false,
    limitations: false,
    privacy: false,
    recording: false,
  });

  const allChecked = Object.values(checks).every(Boolean);
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const autoAcceptedRef = useRef(false);

  useEffect(() => {
    if (allChecked && !autoAcceptedRef.current) {
      autoAcceptedRef.current = true;
      setTimeout(() => onAccept(), 600);
    }
  }, [allChecked, onAccept]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDecline(); }}>
      <DialogContent className="w-[92vw] max-w-lg max-h-[80vh] p-0 gap-0 rounded-xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText size={14} className="text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xs font-bold text-foreground leading-tight">
                Termo de Consentimento (TCLE)
              </DialogTitle>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                CFM Res. nº 2.314/2022 e nº 2.454/2026
              </p>
            </div>
            <Badge variant="outline" className="ml-auto text-[8px] border-primary/30 text-primary px-1 py-0">
              <Shield size={8} className="mr-0.5" /> Válido
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[40vh] px-3 py-2">
          <div className="space-y-2 text-[10px] text-muted-foreground leading-snug">
            <p className="text-foreground font-semibold text-[11px]">
              Prezado(a) {patientName},
            </p>
            <p>
              Este TCLE informa sobre condições, benefícios, limitações e riscos da teleconsulta
              conforme <strong>Res. CFM nº 2.314/2022</strong>, <strong>nº 2.454/2026</strong> e <strong>LGPD</strong>.
            </p>

            <div className="bg-muted/30 border border-border rounded-lg p-2">
              <h3 className="font-bold text-foreground text-[10px] mb-0.5">1. TELECONSULTA</h3>
              <p>Atendimento por áudio/vídeo em tempo real pelo(a) Dr(a). <strong>{doctorName}</strong>.</p>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-2">
              <h3 className="font-bold text-foreground text-[10px] mb-0.5">2. LIMITAÇÕES</h3>
              <p>Não substitui urgência presencial. Exame físico impossível à distância. IA é apoio — decisão é do médico.</p>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-2">
              <h3 className="font-bold text-foreground text-[10px] mb-0.5">3. PRIVACIDADE (LGPD)</h3>
              <p>Dados sensíveis com criptografia AES-256 + TLS 1.3. Vídeo não gravado sem autorização.</p>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-2">
              <h3 className="font-bold text-foreground text-[10px] mb-0.5">4. IA E DIREITOS</h3>
              <p>Transcrição e sugestões por IA (CFM nº 2.454/2026). Você pode revogar consentimento a qualquer momento.</p>
            </div>

            <p className="text-[8px] text-muted-foreground border-t border-border pt-1">
              {today} — Planta & Raiz
            </p>
          </div>
        </ScrollArea>

        <div className="px-3 py-2 border-t border-border space-y-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={checks.read} onCheckedChange={(v) => setChecks(p => ({ ...p, read: !!v }))} className="h-4 w-4" />
              <span className="text-[10px] text-muted-foreground leading-tight">Li e compreendi este TCLE.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={checks.limitations} onCheckedChange={(v) => setChecks(p => ({ ...p, limitations: !!v }))} className="h-4 w-4" />
              <span className="text-[10px] text-muted-foreground leading-tight">Ciente das limitações da teleconsulta.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={checks.privacy} onCheckedChange={(v) => setChecks(p => ({ ...p, privacy: !!v }))} className="h-4 w-4" />
              <span className="text-[10px] text-muted-foreground leading-tight">Autorizo tratamento dos meus dados (LGPD).</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={checks.recording} onCheckedChange={(v) => setChecks(p => ({ ...p, recording: !!v }))} className="h-4 w-4" />
              <span className="text-[10px] text-muted-foreground leading-tight">Ciente do uso de IA como apoio clínico.</span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-8 text-[10px]" onClick={onDecline}>
              Recusar
            </Button>
            <Button className="flex-1 h-8 text-[10px] bg-primary text-primary-foreground font-bold" disabled={!allChecked} onClick={onAccept}>
              <CheckCircle2 size={12} className="mr-1" />
              Aceito
            </Button>
          </div>

          <p className="text-[8px] text-center text-muted-foreground">
            Assinatura eletrônica — Lei nº 14.063/2020
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
