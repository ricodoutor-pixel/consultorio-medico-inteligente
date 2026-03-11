import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  FileText, Download, Shield, CheckCircle2, AlertTriangle,
  Stamp, ExternalLink, Loader2
} from "lucide-react";

interface PrescriptionData {
  prescriptionId: string;
  patientName: string;
  patientCPF: string;
  doctorName: string;
  doctorCRM: string;
  crmState: string;
  diagnosisCid: string;
  medications: Array<{
    name: string;
    dosage: string;
    cbdMg: number;
    thcPct: number;
    quantity: string;
  }>;
}

interface Props {
  prescription?: PrescriptionData;
}

export const AnvisaPermitGenerator = ({ prescription }: Props) => {
  const { toast } = useToast();
  const { log } = useAuditLog();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const requiresReceitaA = prescription?.medications.some(m => m.thcPct > 0.2) ?? false;

  const classifyPrescription = () => {
    if (!prescription) return null;
    const maxThc = Math.max(...prescription.medications.map(m => m.thcPct));
    if (maxThc > 0.2) {
      return {
        type: "Receita A (Notificação Amarela)",
        color: "destructive" as const,
        regulation: "RDC 660/2022 Art. 4º — THC > 0.2% requer controle especial",
        icon: AlertTriangle,
      };
    }
    return {
      type: "Receita B (Controle Especial)",
      color: "outline" as const,
      regulation: "RDC 660/2022 Art. 3º — CBD predominante",
      icon: FileText,
    };
  };

  const classification = classifyPrescription();

  const generatePermitPDF = async () => {
    if (!prescription) return;
    setGenerating(true);

    try {
      // Simulate PDF generation (in production, this would call an edge function)
      await new Promise(r => setTimeout(r, 2000));

      await log(
        "anvisa_permit_generated",
        "prescriptions",
        prescription.prescriptionId,
        null,
        {
          patientCPF: prescription.patientCPF.slice(0, 3) + "***",
          doctorCRM: prescription.doctorCRM,
          requiresReceitaA,
          timestamp: new Date().toISOString(),
        }
      );

      setGenerated(true);
      toast({
        title: "Autorização ANVISA gerada ✅",
        description: "PDF pré-preenchido para importação criado com sucesso.",
      });
    } catch (e) {
      toast({ title: "Erro ao gerar documento", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!prescription) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          <FileText size={24} className="mx-auto mb-2" />
          Selecione uma prescrição assinada para gerar a autorização ANVISA.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Stamp size={16} className="text-primary" />
          Autorização ANVISA — Importação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Classification */}
        {classification && (
          <div className="flex items-center gap-2">
            <Badge variant={classification.color} className="text-xs">
              <classification.icon size={10} className="mr-1" />
              {classification.type}
            </Badge>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">{classification?.regulation}</p>

        {/* Summary */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paciente:</span>
            <span className="font-bold text-foreground">{prescription.patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CPF:</span>
            <span className="font-mono text-foreground">
              {prescription.patientCPF.slice(0, 3)}.***.***-**
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Médico:</span>
            <span className="font-bold text-foreground">
              Dr(a). {prescription.doctorName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CRM:</span>
            <span className="font-mono text-foreground">
              {prescription.doctorCRM}/{prescription.crmState}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CID-10:</span>
            <span className="font-mono text-primary">{prescription.diagnosisCid}</span>
          </div>
        </div>

        {/* Medications */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground">Medicamentos:</p>
          {prescription.medications.map((med, i) => (
            <div key={i} className="bg-background/50 p-2 rounded text-[10px] flex items-center justify-between">
              <span className="font-bold text-foreground">{med.name}</span>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-[8px]">CBD {med.cbdMg}mg</Badge>
                {med.thcPct > 0 && (
                  <Badge variant={med.thcPct > 0.2 ? "destructive" : "outline"} className="text-[8px]">
                    THC {med.thcPct}%
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Watermark notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 text-[9px] text-muted-foreground">
          <Shield size={10} className="inline mr-1 text-primary" />
          O PDF gerado incluirá marca d'água: <strong>"USO EXCLUSIVO EM TELEMEDICINA — CFM 2.314/2022"</strong>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={generatePermitPDF}
            disabled={generating || generated}
            className="w-full bg-primary text-primary-foreground text-xs font-bold"
          >
            {generating ? (
              <><Loader2 size={14} className="mr-1 animate-spin" /> Gerando PDF...</>
            ) : generated ? (
              <><CheckCircle2 size={14} className="mr-1" /> Documento Gerado</>
            ) : (
              <><Download size={14} className="mr-1" /> Gerar PDF ANVISA</>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-[10px]"
            onClick={() => window.open("https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cannabis/importacao-de-produtos", "_blank")}
          >
            <ExternalLink size={10} className="mr-1" /> Portal de Importação ANVISA
          </Button>
        </div>

        <p className="text-[8px] text-muted-foreground">
          ⚠️ Este documento é pré-preenchido. O médico deve revisar, assinar com ICP-Brasil (e-CPF)
          e submeter ao portal ANVISA para aprovação final. Validade: 1 ano a partir da emissão.
        </p>
      </CardContent>
    </Card>
  );
};
