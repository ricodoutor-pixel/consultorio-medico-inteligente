/**
 * Brisa Triage Flow — ponto único de entrada de triagem.
 *
 * Regra: se o paciente já tem prontuário ativo OU recusa Orientação Técnica,
 * pula a Brisa e invoca o geo-match-doctor (Uber de Médicos) imediatamente.
 * Caso contrário, abre o WhatsApp da Enfª Brisa.
 */
import { supabase } from "@/integrations/supabase/client";
import { openBrisaWhatsApp, type BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";

type StartOptions = {
  /** Se true, força pular Brisa e ir direto pro match. */
  skipBrisa?: boolean;
  section?: string;
  consultationType?: string;
  userName?: string;
  doctorName?: string;
  /** Localização opcional para o geo-match. */
  geo?: { lat: number; lng: number };
  specialty?: string;
};

async function hasActiveMedicalRecord(userId: string): Promise<boolean> {
  try {
    // Considera "ativo" se houver prescrição ativa ou consulta concluída < 90d
    const { count: rxCount } = await (supabase as any)
      .from("prescriptions")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", userId)
      .eq("status", "active");
    if ((rxCount ?? 0) > 0) return true;

    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { count: consCount } = await (supabase as any)
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", userId)
      .gte("created_at", since);
    return (consCount ?? 0) > 0;
  } catch {
    return false;
  }
}

async function invokeGeoMatch(opts: StartOptions): Promise<{ ok: boolean; redirectUrl?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("match-doctor", {
      body: {
        specialty: opts.specialty ?? "Cannabis Medicinal",
        geo: opts.geo ?? null,
        section: opts.section ?? "brisa-flow",
      },
    });
    if (error) throw error;
    const room = (data as any)?.jitsi_room || (data as any)?.room;
    const doctorId = (data as any)?.doctor_id || (data as any)?.doctorId;
    const appointmentId = (data as any)?.appointment_id || (data as any)?.appointmentId;
    const redirectUrl = room
      ? `${window.location.origin}/consulta-video?room=${encodeURIComponent(room)}`
      : appointmentId
      ? `${window.location.origin}/consultation-monitor/${appointmentId}`
      : `${window.location.origin}/sala-espera`;

    // Dispara alerta da Enf. Brisa para o médico (best-effort)
    if (doctorId) {
      const actionUrl = appointmentId
        ? `${window.location.origin}/consultation-monitor/${appointmentId}`
        : redirectUrl;
      supabase.functions
        .invoke("send-nurse-brisa-alert", {
          body: {
            doctorId,
            appointmentId: appointmentId ?? null,
            alertType: "new_appointment",
            title: `Nova consulta: ${opts.userName ?? "Paciente"}`,
            message: `A Enf. Brisa encaminhou um paciente para atendimento (${
              opts.consultationType ?? "video"
            }). Clique para abrir o prontuário e aceitar.`,
            actionUrl,
          },
        })
        .catch((e) => console.warn("[brisa-triage-flow] alert failed", e));
    }

    return { ok: true, redirectUrl };
  } catch (e) {
    console.warn("[brisa-triage-flow] geo-match falhou, abrindo Brisa:", e);
    return { ok: false };
  }
}

export async function startBrisaTriage(opts: StartOptions = {}): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (userId && !opts.skipBrisa) {
    const active = await hasActiveMedicalRecord(userId);
    if (active) {
      const r = await invokeGeoMatch(opts);
      if (r.ok && r.redirectUrl) {
        window.location.href = r.redirectUrl;
        return;
      }
    }
  }

  if (opts.skipBrisa) {
    const r = await invokeGeoMatch(opts);
    if (r.ok && r.redirectUrl) {
      window.location.href = r.redirectUrl;
      return;
    }
  }

  // Fallback / fluxo padrão: Enfª Brisa centraliza a triagem
  openBrisaWhatsApp({
    section: opts.section,
    consultationType: opts.consultationType,
    userName: opts.userName,
    doctorName: opts.doctorName,
  });
}

export type { StartOptions as BrisaTriageOptions };
export { BRISA_WHATSAPP };
