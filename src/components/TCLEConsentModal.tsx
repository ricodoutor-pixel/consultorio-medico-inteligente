import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield, FileText, CheckCircle2 } from "lucide-react";

interface TCLEConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  doctorName?: string;
  patientName?: string;
}

export const TCLEConsentModal = ({ open, onAccept, onDecline, doctorName = "Médico(a)", patientName = "Paciente" }: TCLEConsentModalProps) => {
  const isMobile = useIsMobile();
  const [checks, setChecks] = useState({
    read: false,
    limitations: false,
    privacy: false,
    recording: false,
  });

  const allChecked = Object.values(checks).every(Boolean);
  const autoAcceptedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      autoAcceptedRef.current = false;
      setChecks({
        read: false,
        limitations: false,
        privacy: false,
        recording: false,
      });
    }
  }, [open]);

  useEffect(() => {
    if (open && allChecked && !autoAcceptedRef.current) {
      autoAcceptedRef.current = true;
      setTimeout(() => onAccept(), 600);
    }
  }, [allChecked, onAccept, open]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onDecline();
  };

  const headerContent = (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-9 sm:w-9">
        <FileText size={18} className="text-primary sm:h-4 sm:w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold leading-tight text-foreground sm:text-lg">
          Termo de Consentimento (TCLE)
        </h2>
        <p className="mt-1 text-xs leading-4 text-muted-foreground sm:text-sm">
          CFM Res. 2.314/2022 · 2.454/2026
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 border-primary/30 px-2 py-1 text-[10px] text-primary sm:text-xs">
        <Shield size={12} className="mr-1" /> Válido
      </Badge>
    </div>
  );

  const modalBody = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-4 sm:px-5 sm:py-4">
        {headerContent}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
        <div className="space-y-3 text-sm leading-6 text-muted-foreground sm:text-[15px]">
          <p className="text-sm font-semibold leading-6 text-foreground sm:text-base">
            Prezado(a) {patientName},
          </p>
          <p>
            Este TCLE informa sobre condições e riscos da teleorientação técnica conforme <strong>Res. CFM 2.314/2022</strong>, <strong>2.454/2026</strong> e <strong>LGPD</strong>.
          </p>

          <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-3.5">
            <p><strong className="text-foreground">1. TELECONSULTA</strong> — Atendimento por áudio/vídeo pelo(a) Dr(a). <strong>{doctorName}</strong>.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-3.5">
            <p><strong className="text-foreground">2. LIMITAÇÕES</strong> — Não substitui urgência. Exame físico impossível. IA é apoio — decisão do médico.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-3.5">
            <p><strong className="text-foreground">3. PRIVACIDADE</strong> — Dados sensíveis criptografados (AES-256 + TLS 1.3). Vídeo não gravado.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-3.5">
            <p><strong className="text-foreground">4. IA E DIREITOS</strong> — Sugestões por IA (CFM 2.454/2026). Revogue consentimento a qualquer momento.</p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5 sm:pt-4">
        <div className="grid grid-cols-1 gap-2.5">
          {[
            { key: 'read' as const, label: 'Li e compreendi este TCLE.' },
            { key: 'limitations' as const, label: 'Estou ciente das limitações da teleorientação técnica.' },
            { key: 'privacy' as const, label: 'Autorizo o tratamento dos meus dados conforme a LGPD.' },
            { key: 'recording' as const, label: 'Estou ciente do uso de IA como apoio clínico.' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-start gap-3 rounded-lg px-1 py-1.5">
              <Checkbox
                checked={checks[key]}
                onCheckedChange={(value) => setChecks((prev) => ({ ...prev, [key]: !!value }))}
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <span className="text-sm leading-5 text-muted-foreground sm:text-[15px]">{label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" className="h-11 text-sm font-medium" onClick={onDecline}>
            Recusar
          </Button>
          <Button className="h-11 text-sm font-bold" disabled={!allChecked} onClick={onAccept}>
            <CheckCircle2 size={16} className="mr-2" />
            Aceito
          </Button>
        </div>

        <p className="mt-3 text-center text-xs leading-4 text-muted-foreground sm:text-sm">
          Assinatura eletrônica — Lei nº 14.063/2020
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="flex h-[100dvh] max-h-[100dvh] flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Termo de Consentimento (TCLE)</SheetTitle>
          </SheetHeader>
          {modalBody}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex w-[94vw] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Termo de Consentimento (TCLE)</DialogTitle>
        </DialogHeader>
        {modalBody}
      </DialogContent>
    </Dialog>
  );
};
