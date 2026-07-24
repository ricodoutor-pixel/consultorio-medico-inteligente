import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Save, Loader2, CheckCircle2 } from "lucide-react";
import { logAccessAudit } from "@/services/auditLogger";

interface MedicalRecordFormProps {
  appointmentId: string;
  patientId: string;
  onSaved?: () => void;
}

export function MedicalRecordForm({ appointmentId, patientId, onSaved }: MedicalRecordFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);

  const [chiefComplaint, setChiefComplaint] = useState("");
  const [historyPresentIllness, setHistoryPresentIllness] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [assessmentPlan, setAssessmentPlan] = useState("");

  useEffect(() => {
    fetchExistingRecord();
  }, [appointmentId]);

  const fetchExistingRecord = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("medical_records")
        .select("*")
        .eq("appointment_id", appointmentId)
        .maybeSingle();

      if (!error && data) {
        setRecordId(data.id);
        setChiefComplaint(data.chief_complaint || "");
        setHistoryPresentIllness(data.history_present_illness || "");
        setMedicalHistory(data.medical_history || "");
        setPhysicalExam(data.physical_exam || "");
        setAssessmentPlan(data.assessment_plan || "");
      }
    } catch (err) {
      console.error("[MedicalRecordForm] Erro ao carregar prontuário:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const doctorId = sessionData?.session?.user?.id;
      if (!doctorId) {
        toast.error("Médico não autenticado.");
        setSaving(false);
        return;
      }

      const payload = {
        appointment_id: appointmentId,
        doctor_id: doctorId,
        patient_id: patientId,
        chief_complaint: chiefComplaint,
        history_present_illness: historyPresentIllness,
        medical_history: medicalHistory,
        physical_exam: physicalExam,
        assessment_plan: assessmentPlan,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (recordId) {
        result = await (supabase as any)
          .from("medical_records")
          .update(payload)
          .eq("id", recordId)
          .select()
          .single();
      } else {
        result = await (supabase as any)
          .from("medical_records")
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      if (result.data) {
        setRecordId(result.data.id);
      }

      toast.success("Prontuário estruturado salvo com sucesso!");
      
      // Registrar log de auditoria LGPD
      logAccessAudit({
        actor_id: doctorId,
        actor_role: "professional",
        resource_table: "medical_records",
        resource_id: recordId || result.data?.id,
        action: recordId ? "update" : "insert",
        metadata: { appointment_id: appointmentId, patient_id: patientId },
      });

      if (onSaved) onSaved();
    } catch (err: any) {
      console.error("[MedicalRecordForm] Erro ao salvar prontuário:", err);
      toast.error("Erro ao salvar prontuário: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Carregando prontuário...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
          <FileText className="w-5 h-5 text-primary" />
          Prontuário Médico Estruturado (CFM 2.314/2022)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <Label className="font-bold text-xs uppercase text-muted-foreground">1. Queixa Principal (QP)</Label>
          <Textarea
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="Motivo principal da consulta relatado pelo paciente..."
            className="mt-1 font-sans text-sm rounded-xl resize-y min-h-[80px]"
          />
        </div>

        <div>
          <Label className="font-bold text-xs uppercase text-muted-foreground">2. História da Doença Atual (HDA)</Label>
          <Textarea
            value={historyPresentIllness}
            onChange={(e) => setHistoryPresentIllness(e.target.value)}
            placeholder="Detalhes cronológicos, intensidade dos sintomas, fatores de melhora/piora..."
            className="mt-1 font-sans text-sm rounded-xl resize-y min-h-[100px]"
          />
        </div>

        <div>
          <Label className="font-bold text-xs uppercase text-muted-foreground">3. Histórico Médico / Antecedentes</Label>
          <Textarea
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            placeholder="Comorbidades, alergias, medicações em uso, uso prévio de canabinóides..."
            className="mt-1 font-sans text-sm rounded-xl resize-y min-h-[80px]"
          />
        </div>

        <div>
          <Label className="font-bold text-xs uppercase text-muted-foreground">4. Exame Físico / Avaliação Telemedicina</Label>
          <Textarea
            value={physicalExam}
            onChange={(e) => setPhysicalExam(e.target.value)}
            placeholder="Estado geral, aspectos observados via vídeo, sinais vitais referidos..."
            className="mt-1 font-sans text-sm rounded-xl resize-y min-h-[80px]"
          />
        </div>

        <div>
          <Label className="font-bold text-xs uppercase text-muted-foreground">5. Avaliação e Conduta (Plano Terapêutico)</Label>
          <Textarea
            value={assessmentPlan}
            onChange={(e) => setAssessmentPlan(e.target.value)}
            placeholder="Hipótese diagnóstica, dosagem de CBD/THC, prescrição, orientações e retorno..."
            className="mt-1 font-sans text-sm rounded-xl resize-y min-h-[100px]"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-black rounded-xl gap-2 h-11"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Salvação em andamento...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Salvar Prontuário Clínico
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
