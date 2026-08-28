import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase: any = _supabase;
import { toast } from "sonner";
import { devlog } from "@/lib/devlog";

interface ConsultationWorkflowPayload {
  doctorId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  consultationType: "video" | "chat";
  doctorDefinedPrice: number;
}

export const consultationWorkflowService = {
  /**
   * Enviar alerta da Enf. Brisa para o médico com link de consulta
   */
  async sendNurseBrisaAlert(payload: ConsultationWorkflowPayload) {
    try {
      const consultationLink = `${window.location.origin}/consultation-monitor/${payload.appointmentId}`;

      const { error } = await supabase.functions.invoke("send-nurse-brisa-alert", {
        body: {
          doctorId: payload.doctorId,
          appointmentId: payload.appointmentId,
          patientId: payload.patientId,
          alertType: "new_appointment",
          title: `📞 Nova Consulta: ${payload.patientName}`,
          message: `Paciente ${payload.patientName} aguardando atendimento via ${payload.consultationType === "video" ? "vídeo" : "chat"}. Clique para aceitar.`,
          actionUrl: consultationLink,
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      devlog.error("Erro ao enviar alerta da Enf. Brisa:", err);
      throw err;
    }
  },

  /**
   * Aceitar consulta e iniciar atendimento
   */
  async acceptConsultation(appointmentId: string) {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw error;

      // Criar registro inicial de prontuário
      const { data: appointment } = await supabase
        .from("appointments")
        .select("patient_id, doctor_id")
        .eq("id", appointmentId)
        .single();

      if (appointment) {
        await supabase.from("medical_records").insert([
          {
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            appointment_id: appointmentId,
            chief_complaint: "Consulta iniciada",
            created_at: new Date().toISOString(),
          },
        ]);
      }

      return { success: true };
    } catch (err) {
      devlog.error("Erro ao aceitar consulta:", err);
      throw err;
    }
  },

  /**
   * Rejeitar consulta
   */
  async rejectConsultation(appointmentId: string, reason: string) {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      devlog.error("Erro ao rejeitar consulta:", err);
      throw err;
    }
  },

  /**
   * Finalizar consulta e salvar prontuário
   */
  async finalizeConsultation(
    appointmentId: string,
    medicalRecord: {
      chief_complaint: string;
      diagnosis: string;
      treatment_plan: string;
      notes: string;
    }
  ) {
    try {
      // Atualizar status da consulta
      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (appointmentError) throw appointmentError;

      // Atualizar prontuário médico
      const { error: recordError } = await supabase
        .from("medical_records")
        .update({
          chief_complaint: medicalRecord.chief_complaint,
          diagnosis: medicalRecord.diagnosis,
          treatment_plan: medicalRecord.treatment_plan,
          notes: medicalRecord.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("appointment_id", appointmentId);

      if (recordError) throw recordError;

      // Calcular performance bonus mensal
      const { data: doctor } = await supabase
        .from("appointments")
        .select("doctor_id")
        .eq("id", appointmentId)
        .single();

      if (doctor) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Chamar função de cálculo de bonus
        await supabase.rpc("calculate_monthly_performance_bonus", {
          p_doctor_id: doctor.doctor_id,
          p_month: monthStart.toISOString().split("T")[0],
        });
      }

      return { success: true };
    } catch (err) {
      devlog.error("Erro ao finalizar consulta:", err);
      throw err;
    }
  },

  /**
   * Salvar nota clínica durante a consulta
   */
  async saveClinicNote(appointmentId: string, note: string) {
    try {
      const { data: record } = await supabase
        .from("medical_records")
        .select("id")
        .eq("appointment_id", appointmentId)
        .single();

      if (!record) throw new Error("Prontuário não encontrado");

      const { error } = await supabase
        .from("medical_records")
        .update({
          notes: note,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      devlog.error("Erro ao salvar nota clínica:", err);
      throw err;
    }
  },

  /**
   * Gerar prescrição e salvar automaticamente
   */
  async generatePrescription(
    appointmentId: string,
    medications: Array<{ name: string; dosage: string; instructions: string }>
  ) {
    try {
      const { data: appointment } = await supabase
        .from("appointments")
        .select("patient_id, doctor_id")
        .eq("id", appointmentId)
        .single();

      if (!appointment) throw new Error("Consulta não encontrada");

      const { data: record } = await supabase
        .from("medical_records")
        .select("id")
        .eq("appointment_id", appointmentId)
        .single();

      const { data, error } = await supabase
        .from("prescriptions")
        .insert([
          {
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            appointment_id: appointmentId,
            medical_record_id: record?.id || null,
            medications: medications,
            status: "signed",
            signature_date: new Date().toISOString(),
            digital_signature: crypto.randomUUID(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, prescription: data };
    } catch (err) {
      devlog.error("Erro ao gerar prescrição:", err);
      throw err;
    }
  },

  /**
   * Buscar paciente por CPF
   */
  async searchPatientByCPF(cpf: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, cpf, phone, date_of_birth")
        .eq("cpf", cpf)
        .single();

      if (error) throw error;
      return { success: true, patient: data };
    } catch (err) {
      devlog.error("Erro ao buscar paciente:", err);
      throw err;
    }
  },

  /**
   * Obter histórico de consultas do paciente
   */
  async getPatientConsultationHistory(patientId: string) {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          scheduled_at,
          status,
          type,
          doctors(id, crm, specialty),
          medical_records(chief_complaint, diagnosis, treatment_plan)
        `
        )
        .eq("patient_id", patientId)
        .order("scheduled_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return { success: true, history: data };
    } catch (err) {
      devlog.error("Erro ao buscar histórico:", err);
      throw err;
    }
  },
};

export default consultationWorkflowService;
