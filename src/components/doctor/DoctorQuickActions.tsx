import { Button } from "@/components/ui/button";
import { FileText, Stethoscope, PowerOff } from "lucide-react";
import type { ConsultationDocumentKind } from "@/lib/consultation-prescription";

interface Props {
  patientId: string;
  appointmentId: string;
  patientName: string;
  /** Abre a aba de documentos no tipo escolhido (emissão real com assinatura gov.br). */
  onOpenDocument: (kind: ConsultationDocumentKind) => void;
  /** Encerra a consulta (o paciente passa para a avaliação, que libera o repasse). */
  onEnd: () => void;
}

// Atalhos do Workspace: cada botão leva a uma ação real; nada é anunciado sem ter sido feito.
export const DoctorQuickActions = ({ onOpenDocument, onEnd }: Props) => (
  <div className="flex items-center gap-3">
    <Button variant="outline" size="sm" className="h-9 hidden md:flex" onClick={() => onOpenDocument("atestado")}>
      <FileText size={16} className="mr-2 text-primary" /> Atestado Médico
    </Button>
    <Button variant="outline" size="sm" className="h-9 hidden lg:flex" onClick={() => onOpenDocument("solicitacao_exames")}>
      <Stethoscope size={16} className="mr-2 text-blue-500" /> Solicitar Exames
    </Button>

    <div className="w-px h-6 bg-border mx-1"></div>

    <Button variant="destructive" size="sm" className="h-9" onClick={onEnd}>
      <PowerOff size={16} className="mr-2" /> Encerrar
    </Button>
  </div>
);
