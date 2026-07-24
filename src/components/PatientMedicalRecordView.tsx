import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, UserCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientMedicalRecordViewProps {
  appointmentId: string;
}

interface MedicalRecordData {
  id: string;
  chief_complaint: string | null;
  history_present_illness: string | null;
  medical_history: string | null;
  physical_exam: string | null;
  assessment_plan: string | null;
  created_at: string;
  updated_at: string;
}

export function PatientMedicalRecordView({ appointmentId }: PatientMedicalRecordViewProps) {
  const [record, setRecord] = useState<MedicalRecordData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecord();
  }, [appointmentId]);

  const fetchRecord = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("medical_records")
        .select("*")
        .eq("appointment_id", appointmentId)
        .maybeSingle();

      if (!error && data) {
        setRecord(data as MedicalRecordData);
      }
    } catch (err) {
      console.error("[PatientMedicalRecordView] Erro ao carregar prontuário:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-primary" />
        Carregando prontuário da consulta...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl p-4">
        Prontuário médico pendente de preenchimento pelo especialista.
      </div>
    );
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="bg-primary/5 border-b border-border py-3 px-4">
        <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center justify-between text-foreground">
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" />
            Prontuário da Consulta (Somente Leitura)
          </span>
          <span className="text-[10px] text-muted-foreground font-normal">
            Atualizado em: {format(new Date(record.updated_at || record.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
        {record.chief_complaint && (
          <div>
            <span className="font-bold text-foreground block">Queixa Principal:</span>
            <p className="text-muted-foreground bg-muted/30 p-2.5 rounded-lg mt-0.5">{record.chief_complaint}</p>
          </div>
        )}

        {record.history_present_illness && (
          <div>
            <span className="font-bold text-foreground block">História da Doença Atual:</span>
            <p className="text-muted-foreground bg-muted/30 p-2.5 rounded-lg mt-0.5">{record.history_present_illness}</p>
          </div>
        )}

        {record.medical_history && (
          <div>
            <span className="font-bold text-foreground block">Histórico Médico:</span>
            <p className="text-muted-foreground bg-muted/30 p-2.5 rounded-lg mt-0.5">{record.medical_history}</p>
          </div>
        )}

        {record.physical_exam && (
          <div>
            <span className="font-bold text-foreground block">Avaliação Telemedicina / Exame:</span>
            <p className="text-muted-foreground bg-muted/30 p-2.5 rounded-lg mt-0.5">{record.physical_exam}</p>
          </div>
        )}

        {record.assessment_plan && (
          <div>
            <span className="font-bold text-primary block">Conduta e Plano Terapêutico:</span>
            <p className="text-foreground font-medium bg-primary/10 border border-primary/20 p-2.5 rounded-lg mt-0.5">{record.assessment_plan}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
