import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProntuarioData } from "@/components/ProntuarioSidebar";

interface AITriagePreFillProps {
  patientId?: string;
  appointmentId?: string;
  onApply: (data: Partial<ProntuarioData>) => void;
}

interface TriageData {
  symptoms: string;
  urgency: string | null;
  suggested_conditions: string[] | null;
  specialty: string | null;
  pre_record: string | null;
  category: string | null;
}

const CID_MAP: Record<string, { code: string; name: string }> = {
  ansiedade: { code: "F41.1", name: "Ansiedade generalizada" },
  depressão: { code: "F32.0", name: "Episódio depressivo leve" },
  insônia: { code: "G47.0", name: "Insônia" },
  dor: { code: "R52", name: "Dor não classificada" },
  enxaqueca: { code: "G43.0", name: "Enxaqueca sem aura" },
  epilepsia: { code: "G40.0", name: "Epilepsia idiopática" },
  fibromialgia: { code: "M79.7", name: "Fibromialgia" },
  "dor lombar": { code: "M54.5", name: "Dor lombar baixa" },
  tdah: { code: "F90.0", name: "TDAH" },
  parkinson: { code: "G20", name: "Doença de Parkinson" },
  tept: { code: "F43.1", name: "TEPT" },
  pânico: { code: "F41.0", name: "Transtorno de pânico" },
};

function inferCID(symptoms: string, conditions: string[] | null): { code: string; name: string } | null {
  const text = `${symptoms} ${(conditions || []).join(" ")}`.toLowerCase();
  for (const [keyword, cid] of Object.entries(CID_MAP)) {
    if (text.includes(keyword)) return cid;
  }
  return null;
}

export const AITriagePreFill = ({ patientId, appointmentId, onApply }: AITriagePreFillProps) => {
  const [loading, setLoading] = useState(false);
  const [triageData, setTriageData] = useState<TriageData | null>(null);
  const [applied, setApplied] = useState(false);

  const fetchTriageData = async () => {
    if (!patientId) {
      toast.error("Paciente não identificado");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("brisa_triages")
        .select("symptoms, urgency, suggested_conditions, specialty, pre_record, category")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.info("Nenhuma triagem encontrada para este paciente.");
        setLoading(false);
        return;
      }

      setTriageData(data as TriageData);
      toast.success("Triagem da Brisa carregada!");
    } catch (err) {
      toast.error("Erro ao buscar triagem");
    }
    setLoading(false);
  };

  const applyToRecord = () => {
    if (!triageData) return;

    const cid = inferCID(triageData.symptoms, triageData.suggested_conditions);

    const prefill: Partial<ProntuarioData> = {
      chiefComplaint: triageData.symptoms,
      history: triageData.pre_record || `Triagem IA: ${triageData.symptoms}`,
      diagnosisCid: cid?.code || "",
      diagnosisText: cid?.name || "",
      notes: [
        triageData.urgency ? `Urgência: ${triageData.urgency}` : "",
        triageData.category ? `Categoria: ${triageData.category}` : "",
        triageData.suggested_conditions?.length
          ? `Condições sugeridas: ${triageData.suggested_conditions.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    onApply(prefill);
    setApplied(true);
    toast.success("Prontuário pré-preenchido com dados da triagem IA!");
  };

  return (
    <Card className="bg-card border-secondary/20">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-secondary" />
          <span className="text-xs font-bold text-foreground">Pré-Preenchimento IA</span>
          <Badge variant="outline" className="text-[9px] border-secondary/30 text-secondary">
            Brisa
          </Badge>
        </div>

        {!triageData && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs border-secondary/30 hover:bg-secondary/10"
            onClick={fetchTriageData}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={12} className="mr-1 animate-spin" /> Buscando triagem...
              </>
            ) : (
              <>
                <Sparkles size={12} className="mr-1" /> Carregar Dados da Triagem
              </>
            )}
          </Button>
        )}

        {triageData && !applied && (
          <div className="space-y-2">
            <div className="bg-muted/30 rounded-lg p-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                <strong>Queixa:</strong> {triageData.symptoms}
              </p>
              {triageData.urgency && (
                <p className="text-xs flex items-center gap-1">
                  <AlertTriangle size={10} className={
                    triageData.urgency === "alta" ? "text-destructive" : "text-yellow-500"
                  } />
                  <span className="text-muted-foreground">Urgência: {triageData.urgency}</span>
                </p>
              )}
              {triageData.suggested_conditions?.length ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {triageData.suggested_conditions.map((c) => (
                    <Badge key={c} variant="outline" className="text-[9px]">
                      {c}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <Button
              size="sm"
              className="w-full text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={applyToRecord}
            >
              <Sparkles size={12} className="mr-1" /> Aplicar ao Prontuário
            </Button>
          </div>
        )}

        {applied && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <CheckCircle2 size={14} />
            <span>Prontuário pré-preenchido com sucesso!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
