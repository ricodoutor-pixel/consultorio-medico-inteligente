import { supabase } from "@/integrations/supabase/client";
import { SERVICES } from "@/lib/pricing";
import { resolveRoutingDoctor } from "@/lib/consultation-routing";

export type ConsultationMode = "video" | "chat";

export async function createConsultationCheckout(mode: ConsultationMode, triageId: string, existingId?: string | null) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error("Entre na sua conta para pagar a consulta.");
  const sku = mode === "video" ? "consulta_video" : "consulta_chat";
  let appointmentId = existingId;
  if (!appointmentId) {
    const doctor = await resolveRoutingDoctor();
    if (!doctor) throw new Error("Não há médico disponível para receber a consulta. Tente novamente mais tarde.");
    const { data, error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      doctor_id: doctor.doctor_id,
      scheduled_at: new Date().toISOString(),
      type: mode,
      amount: SERVICES[sku].price,
      status: "scheduled",
      payment_status: "pending",
      notes: `Triagem: ${triageId}`,
    }).select("id").single();
    if (error || !data?.id) throw new Error("Não foi possível registrar a consulta.");
    appointmentId = data.id;
    // Save before requesting checkout: failures remain pending and can be retried.
    sessionStorage.setItem("telemedicine_pending_checkout", JSON.stringify({ appointmentId, mode, triageId }));
  }
  const { data, error } = await supabase.functions.invoke("mp-checkout", {
    body: { appointmentId, sku, triageId, returnUrl: `${window.location.origin}/telemedicina?appointment=${encodeURIComponent(appointmentId)}` },
  });
  if (error || !data?.init_point) throw new Error("Não foi possível gerar o pagamento. Sua consulta continua aguardando pagamento.");
  return { appointmentId, paymentUrl: String(data.init_point) };
}

export async function isConsultationPaid(appointmentId: string): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return false;
  const { data, error } = await supabase.from("appointments")
    .select("payment_status")
    .eq("id", appointmentId)
    .eq("patient_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível conferir o pagamento. Tente novamente.");
  return data?.payment_status === "paid";
}