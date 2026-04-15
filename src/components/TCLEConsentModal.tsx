import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const autoAcceptedRef = useRef(false);

  useEffect(() => {
    if (allChecked && !autoAcceptedRef.current) {
      autoAcceptedRef.current = true;
      setTimeout(() => onAccept(), 600);
    }
  }, [allChecked, onAccept]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDecline(); }}>
      <DialogContent
        className="w-[94vw] max-w-lg p-0 gap-0 rounded-xl overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header compacto */}
        <DialogHeader className="px-3 py-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText size={12} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[11px] sm:text-sm font-bold text-foreground leading-tight">
                Termo de Consentimento (TCLE)
              </DialogTitle>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground">
                CFM Res. 2.314/2022 · 2.454/2026
              </p>
            </div>
            <Badge variant="outline" className="text-[7px] sm:text-[8px] border-primary/30 text-primary px-1 py-0 shrink-0">
              <Shield size={7} className="mr-0.5" /> Válido
            </Badge>
          </div>
        </DialogHeader>

        {/* Conteúdo scrollável */}
        <div className="overflow-y-auto flex-1 px-3 py-2" style={{ maxHeight: 'calc(100dvh - 12rem)' }}>
          <div className="space-y-1.5 text-[9px] sm:text-[10px] text-muted-foreground leading-snug">
            <p className="text-foreground font-semibold text-[10px] sm:text-[11px]">
              Prezado(a) {patientName},
            </p>
            <p>
              Este TCLE informa sobre condições e riscos da teleconsulta
              conforme <strong>Res. CFM 2.314/2022</strong>, <strong>2.454/2026</strong> e <strong>LGPD</strong>.
            </p>

            <div className="bg-muted/30 border border-border rounded-md p-1.5 sm:p-2">
              <p><strong className="text-foreground">1. TELECONSULTA</strong> — Atendimento por áudio/vídeo pelo(a) Dr(a). <strong>{doctorName}</strong>.</p>
            </div>
            <div className="bg-muted/30 border border-border rounded-md p-1.5 sm:p-2">
              <p><strong className="text-foreground">2. LIMITAÇÕES</strong> — Não substitui urgência. Exame físico impossível. IA é apoio — decisão do médico.</p>
            </div>
            <div className="bg-muted/30 border border-border rounded-md p-1.5 sm:p-2">
              <p><strong className="text-foreground">3. PRIVACIDADE</strong> — Dados sensíveis criptografados (AES-256 + TLS 1.3). Vídeo não gravado.</p>
            </div>
            <div className="bg-muted/30 border border-border rounded-md p-1.5 sm:p-2">
              <p><strong className="text-foreground">4. IA E DIREITOS</strong> — Sugestões por IA (CFM 2.454/2026). Revogue consentimento a qualquer momento.</p>
            </div>
          </div>
        </div>

        {/* Checkboxes + Botões - sempre visíveis */}
        <div className="px-3 py-2 border-t border-border shrink-0 space-y-1.5">
          <div className="grid grid-cols-1 gap-1">
            {[
              { key: 'read' as const, label: 'Li e compreendi este TCLE.' },
              { key: 'limitations' as const, label: 'Ciente das limitações da teleconsulta.' },
              { key: 'privacy' as const, label: 'Autorizo tratamento dos meus dados (LGPD).' },
              { key: 'recording' as const, label: 'Ciente do uso de IA como apoio clínico.' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1.5 cursor-pointer py-0.5">
                <Checkbox
                  checked={checks[key]}
                  onCheckedChange={(v) => setChecks(p => ({ ...p, [key]: !!v }))}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-8 text-[10px]" onClick={onDecline}>
              Recusar
            </Button>
            <Button className="flex-1 h-8 text-[10px] bg-primary text-primary-foreground font-bold" disabled={!allChecked} onClick={onAccept}>
              <CheckCircle2 size={11} className="mr-1" />
              Aceito
            </Button>
          </div>

          <p className="text-[7px] sm:text-[8px] text-center text-muted-foreground">
            Assinatura eletrônica — Lei nº 14.063/2020
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
