import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar, Pill, ShieldCheck, History, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logAccessAudit } from "@/services/auditLogger";

interface PatientHistoryPanelProps {
  patientId: string;
}

export function PatientHistoryPanel({ patientId }: PatientHistoryPanelProps) {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [tcleConsents, setTcleConsents] = useState<any[]>([]);
  const [latestRecord, setLatestRecord] = useState<any | null>(null);

  useEffect(() => {
    if (patientId) {
      fetchPatientHistory();
    }
  }, [patientId]);

  const fetchPatientHistory = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const doctorId = sessionData?.session?.user?.id;

      // 1. Appointments
      const { data: appts } = await (supabase as any)
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .order("scheduled_at", { ascending: false });

      if (appts) setAppointments(appts);

      // 2. Prescriptions
      const { data: presc } = await (supabase as any)
        .from("prescriptions")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (presc) setPrescriptions(presc);

      // 3. TCLE Consents
      const { data: tcle } = await (supabase as any)
        .from("tcle_consents")
        .select("*")
        .eq("patient_id", patientId)
        .order("accepted_at", { ascending: false });

      if (tcle) setTcleConsents(tcle);

      // 4. Latest Medical Record
      const { data: record } = await (supabase as any)
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (record) setLatestRecord(record);

      // Auditar a leitura de dados do paciente pelo médico (LGPD Art. 37)
      if (doctorId) {
        logAccessAudit({
          actor_id: doctorId,
          actor_role: "professional",
          resource_table: "appointments",
          resource_id: patientId,
          action: "select",
          metadata: { context: "patient_history_panel_view" },
        });
      }
    } catch (err) {
      console.error("[PatientHistoryPanel] Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-center text-muted-foreground text-xs">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
          Carregando histórico do paciente...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="bg-muted/30 py-3 px-4 border-b border-border">
        <CardTitle className="text-sm font-black flex items-center gap-2 text-foreground">
          <History className="w-4 h-4 text-primary" />
          Histórico Clínico do Paciente
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {/* TCLE Status */}
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div>
              <span className="font-bold text-xs text-foreground block">TCLE Telemedicina & Cannabis</span>
              <span className="text-[10px] text-muted-foreground">
                {tcleConsents.length > 0
                  ? `Assinado em ${format(new Date(tcleConsents[0].accepted_at), "dd/MM/yyyy", { locale: ptBR })} (v${tcleConsents[0].tcle_version || "1.0"})`
                  : "TCLE pendente de assinatura"}
              </span>
            </div>
          </div>
          <Badge className={tcleConsents.length > 0 ? "bg-green-500/10 text-green-500 border-green-500/20 text-[10px]" : "bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]"}>
            {tcleConsents.length > 0 ? "Assinado" : "Pendente"}
          </Badge>
        </div>

        {/* Prontuário Recente */}
        {latestRecord && (
          <div className="p-3 rounded-xl bg-card border border-border space-y-1 text-xs">
            <div className="flex items-center justify-between text-muted-foreground font-bold mb-1">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" /> Prontuário Mais Recente
              </span>
              <span className="text-[10px]">
                {format(new Date(latestRecord.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            {latestRecord.chief_complaint && (
              <p><strong className="text-foreground">QP:</strong> {latestRecord.chief_complaint}</p>
            )}
            {latestRecord.assessment_plan && (
              <p className="text-primary font-medium"><strong className="text-foreground">Conduta:</strong> {latestRecord.assessment_plan}</p>
            )}
          </div>
        )}

        {/* Consultas Anteriores */}
        <div>
          <span className="font-bold text-xs uppercase text-muted-foreground block mb-2">
            Consultas Anteriores ({appointments.length})
          </span>
          {appointments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma consulta anterior registrada.</p>
          ) : (
            <div className="space-y-2">
              {appointments.slice(0, 5).map((app) => (
                <div key={app.id} className="p-2.5 rounded-lg bg-muted/20 border border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground block">
                      {format(new Date(app.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">{app.type || "vídeo"}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {app.status || "agendado"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescrições Emitidas */}
        <div>
          <span className="font-bold text-xs uppercase text-muted-foreground block mb-2">
            Prescrições Emitidas ({prescriptions.length})
          </span>
          {prescriptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma prescrição anterior cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {prescriptions.slice(0, 5).map((pr) => (
                <div key={pr.id} className="p-2.5 rounded-lg bg-muted/20 border border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-primary" />
                    <div>
                      <span className="font-bold text-foreground block">{pr.medication || pr.title || "Prescrição Canábica"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(pr.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
