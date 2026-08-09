import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ConsultationMonitorDashboard } from "@/components/ConsultationMonitorDashboard";
import { DrEdilsonExclusiveChat } from "@/components/DrEdilsonExclusiveChat";
import { NurseBrisaAlertSystem } from "@/components/NurseBrisaAlertSystem";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ConsultationMonitorPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorInfo();
  }, []);

  const loadDoctorInfo = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Você precisa estar logado como médico");
        return;
      }

      const { data, error } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (data) setDoctorId(data.id);
    } catch (err) {
      console.error("Erro ao carregar informações do médico:", err);
      toast.error("Erro ao carregar informações do médico");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando Dashboard de Consulta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <ConsultationMonitorDashboard appointmentId={appointmentId} />

      {/* Chat exclusivo com Dr. Edilson */}
      {appointmentId && (
        <DrEdilsonExclusiveChat
          appointmentId={appointmentId}
          patientName="Paciente"
          patientContext="Paciente em atendimento com sintomas de dor crônica"
        />
      )}

      {/* Sistema de alertas da Enf. Brisa */}
      {doctorId && (
        <div className="fixed bottom-4 left-4 w-96 max-h-96 z-30">
          <NurseBrisaAlertSystem doctorId={doctorId} />
        </div>
      )}
    </div>
  );
}

export default ConsultationMonitorPage;
