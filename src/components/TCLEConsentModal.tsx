import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

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
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 rounded-2xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="p-3 sm:p-6 pb-2 sm:pb-3 border-b border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText size={16} className="text-primary sm:hidden" />
              <FileText size={20} className="text-primary hidden sm:block" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm sm:text-lg font-bold text-foreground leading-tight">
                Termo de Consentimento (TCLE)
              </DialogTitle>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                CFM Res. nº 2.314/2022 e nº 2.454/2026
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit mt-1.5 text-[9px] sm:text-[10px] border-primary/30 text-primary">
            <Shield size={8} className="mr-1" /> Validade jurídica
          </Badge>
        </DialogHeader>

        <ScrollArea className="max-h-[45vh] sm:max-h-[50vh] px-3 sm:px-6 py-3 sm:py-4">
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p className="text-foreground font-semibold text-xs sm:text-sm">
              Prezado(a) {patientName},
            </p>

            <p className="text-[11px] sm:text-sm">
              Este TCLE informa sobre condições, benefícios, limitações e riscos da teleconsulta, 
              conforme <strong>Res. CFM nº 2.314/2022</strong>, <strong>nº 2.454/2026</strong> e <strong>LGPD</strong>.
            </p>

            <div className="bg-muted/30 border border-border rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h3 className="font-bold text-foreground mb-1.5 text-[11px] sm:text-sm">1. NATUREZA DA TELECONSULTA</h3>
              <p className="text-[11px] sm:text-sm">
                Atendimento médico à distância por áudio e vídeo em tempo real, conduzido pelo(a) 
                Dr(a). <strong>{doctorName}</strong> (CRM ativo).
              </p>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h3 className="font-bold text-foreground mb-1.5 text-[11px] sm:text-sm">2. OBJETIVOS</h3>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] sm:text-sm">
                <li>Avaliação clínica e anamnese</li>
                <li>Orientação diagnóstica e terapêutica</li>
                <li>Emissão de receitas e atestados</li>
                <li>Acompanhamento clínico</li>
              </ul>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h3 className="font-bold text-foreground mb-1.5 text-[11px] sm:text-sm">3. LIMITAÇÕES</h3>
              <div className="flex items-start gap-1.5 mb-1.5">
                <AlertTriangle size={12} className="text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-[10px] sm:text-xs">O(A) paciente declara ciência:</p>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] sm:text-sm">
                <li>Não substitui atendimento presencial de urgência</li>
                <li>Exame físico não pode ser feito à distância</li>
                <li>Problemas técnicos podem afetar a qualidade</li>
                <li>IA é apenas apoio — decisão final é do médico (CFM nº 2.454/2026)</li>
              </ul>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h3 className="font-bold text-foreground mb-1.5 text-[11px] sm:text-sm">4. PRIVACIDADE (LGPD)</h3>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] sm:text-sm">
                <li>Dados de saúde são <strong>dados sensíveis</strong></li>
                <li>Criptografia <strong>AES-256</strong> + <strong>TLS 1.3</strong></li>
                <li>Vídeo <strong>não gravado</strong> sem autorização</li>
                <li>Prontuário com acesso restrito e auditável</li>
                <li>Direito de acesso, correção e exclusão (Art. 18)</li>
              </ul>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h3 className="font-bold text-foreground mb-1.5 text-[11px] sm:text-sm">5. ASSINATURA DIGITAL</h3>
              <p className="text-[11px] sm:text-sm">
                Documentos assinados no padrão <strong>ICP-Brasil</strong> com validade jurídica (Lei nº 14.063/2020).
              </p>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h3 className="font-bold text-foreground mb-1.5 text-[11px] sm:text-sm">6. USO DE IA (CFM nº 2.454/2026)</h3>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] sm:text-sm">
                <li>Transcrição automática de áudio</li>
                <li>Sugestões baseadas em evidências</li>
                <li>Triagem para especialista adequado</li>
              </ul>
              <p className="mt-1.5 text-[10px] sm:text-xs font-semibold text-foreground">
                ⚠️ Decisões clínicas são responsabilidade exclusiva do médico.
              </p>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h3 className="font-bold text-foreground mb-1.5 text-[11px] sm:text-sm">7. DIREITOS DO PACIENTE</h3>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] sm:text-sm">
                <li>Revogar consentimento a qualquer momento</li>
                <li>Solicitar atendimento presencial</li>
                <li>Acessar prontuário completo</li>
                <li>Segunda opinião médica</li>
              </ul>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h3 className="font-bold text-foreground mb-1.5 text-[11px] sm:text-sm">8. REGISTRO DA CONSULTA</h3>
              <p className="text-[11px] sm:text-sm">
                Registrada conforme Res. CFM nº 2.314/2022: data, hora, CRM, diagnóstico (CID-10) e conduta.
              </p>
            </div>

            <p className="text-[9px] sm:text-xs text-muted-foreground border-t border-border pt-2">
              {today} — Planta & Raiz — CNPJ: XX.XXX.XXX/0001-XX
            </p>
          </div>
        </ScrollArea>

        <div className="p-3 sm:p-6 pt-3 sm:pt-4 border-t border-border space-y-2.5 sm:space-y-4">
          <div className="space-y-2 sm:space-y-3">
            <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
              <Checkbox checked={checks.read} onCheckedChange={(v) => setChecks(p => ({ ...p, read: !!v }))} className="mt-0.5" />
              <span className="text-[11px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                Li e compreendi este TCLE.
              </span>
            </label>
            <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
              <Checkbox checked={checks.limitations} onCheckedChange={(v) => setChecks(p => ({ ...p, limitations: !!v }))} className="mt-0.5" />
              <span className="text-[11px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                Ciente das limitações da teleconsulta.
              </span>
            </label>
            <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
              <Checkbox checked={checks.privacy} onCheckedChange={(v) => setChecks(p => ({ ...p, privacy: !!v }))} className="mt-0.5" />
              <span className="text-[11px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                Autorizo o tratamento dos meus dados (LGPD).
              </span>
            </label>
            <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
              <Checkbox checked={checks.recording} onCheckedChange={(v) => setChecks(p => ({ ...p, recording: !!v }))} className="mt-0.5" />
              <span className="text-[11px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                Ciente do uso de IA como apoio clínico.
              </span>
            </label>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" className="flex-1 h-9 sm:h-10 text-xs sm:text-sm" onClick={onDecline}>
              Recusar
            </Button>
            <Button className="flex-1 h-9 sm:h-10 text-xs sm:text-sm bg-primary text-primary-foreground font-bold" disabled={!allChecked} onClick={onAccept}>
              <CheckCircle2 size={14} className="mr-1.5" />
              Aceito
            </Button>
          </div>

          <p className="text-[9px] sm:text-[10px] text-center text-muted-foreground">
            Assinatura eletrônica conforme Lei nº 14.063/2020.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
