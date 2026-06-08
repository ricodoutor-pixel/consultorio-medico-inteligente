import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Prescription Automation — Triggered after doctor creates a prescription
 * 1. Generates prescription notification
 * 2. Sends WhatsApp via Evolution API (Enfª Brisa)
 * 3. Notifies patient with download link
 * 4. Tracks dispensation status
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: authData, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { prescriptionId, action } = await req.json();

    if (!prescriptionId) {
      return new Response(JSON.stringify({ error: "prescriptionId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch prescription with doctor and patient info
    const { data: prescription, error: prescErr } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("id", prescriptionId)
      .single();

    if (prescErr || !prescription) {
      return new Response(JSON.stringify({ error: "Prescrição não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is the prescribing doctor
    const { data: doctor } = await supabase
      .from("doctors")
      .select("id, user_id, crm, crm_state, specialty")
      .eq("id", prescription.doctor_id)
      .single();

    if (!doctor || doctor.user_id !== authData.user.id) {
      return new Response(JSON.stringify({ error: "Apenas o médico prescritor pode enviar a receita" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get patient profile
    const { data: patientProfile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", prescription.patient_id)
      .single();

    const { data: doctorProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", doctor.user_id)
      .single();

    const patientName = patientProfile?.full_name || "Paciente";
    const doctorName = doctorProfile?.full_name || "Médico";
    const patientPhone = patientProfile?.phone;

    if (action === "send" || !action) {
      // 1. Update prescription status to "sent"
      await supabase
        .from("prescriptions")
        .update({ status: "sent", signature_date: new Date().toISOString() })
        .eq("id", prescriptionId);

      // 2. Notify patient via app notification
      await supabase.from("notifications").insert({
        user_id: prescription.patient_id,
        title: "📋 Nova Receita Médica",
        message: `Dr(a). ${doctorName} (CRM ${doctor.crm}/${doctor.crm_state}) enviou sua receita médica. Acesse para visualizar e fazer download.`,
        type: "prescription",
        action_url: `/prontuario?prescription=${prescriptionId}`,
        metadata: {
          prescription_id: prescriptionId,
          doctor_name: doctorName,
          doctor_crm: `${doctor.crm}/${doctor.crm_state}`,
        },
      });

      // 3. Send WhatsApp via Evolution API (if patient has phone)
      let whatsappSent = false;
      if (patientPhone) {
        const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
        const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
        const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

        if (EVO_URL && EVO_KEY) {
          const formattedPhone = patientPhone.replace(/\D/g, "");
          const number = formattedPhone.startsWith("55") ? formattedPhone : `55${formattedPhone}`;

          const medications = Array.isArray(prescription.medications)
            ? prescription.medications
            : [];
          const medList = medications
            .map((m: any) => `• ${m.name || m.medication || "Medicamento"} — ${m.dosage || m.dose || ""}`)
            .join("\n");

          const message = [
            `🌿 *Planta y Raiz — Receita Médica*`,
            ``,
            `Olá ${patientName}! 👋`,
            ``,
            `Dr(a). *${doctorName}* (CRM ${doctor.crm}/${doctor.crm_state}) emitiu sua receita:`,
            ``,
            medList || "Detalhes disponíveis no app",
            ``,
            prescription.instructions ? `📝 *Instruções:* ${prescription.instructions}` : "",
            prescription.valid_until ? `📅 *Válida até:* ${new Date(prescription.valid_until).toLocaleDateString("pt-BR")}` : "",
            prescription.anvisa_code ? `🔐 *Código ANVISA:* ${prescription.anvisa_code}` : "",
            ``,
            `Acesse sua receita completa: https://consultorio-medico-inteligente.lovable.app/prontuario`,
            ``,
            `🐸 _Enfermeira Brisa — Planta y Raiz_`,
          ].filter(Boolean).join("\n");

          try {
            const evoRes = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: EVO_KEY },
              body: JSON.stringify({ number, text: message, delay: 1200 }),
            });

            if (evoRes.ok) {
              whatsappSent = true;
              console.log(`📱 WhatsApp sent to ${number} for prescription ${prescriptionId}`);
            } else {
              const errBody = await evoRes.text();
              console.error("Evolution error:", evoRes.status, errBody);
            }
          } catch (evoErr) {
            console.error("Evolution send error:", evoErr);
          }
        }
      }

      // 4. Notify pharmacy if assigned
      if (prescription.pharmacy_name) {
        await supabase.from("notifications").insert({
          user_id: prescription.patient_id,
          title: "🏥 Receita enviada à farmácia",
          message: `Sua receita foi encaminhada para ${prescription.pharmacy_name}. Aguarde contato para dispensação.`,
          type: "pharmacy_dispatch",
          action_url: `/prontuario?prescription=${prescriptionId}`,
        });
      }

      // 5. Audit log
      await supabase.from("audit_log").insert({
        user_id: authData.user.id,
        action: "prescription_sent",
        table_name: "prescriptions",
        record_id: prescriptionId,
        new_data: {
          patient: patientName,
          doctor: doctorName,
          whatsapp_sent: whatsappSent,
          pharmacy: prescription.pharmacy_name || null,
        },
      });

      return new Response(JSON.stringify({
        success: true,
        whatsapp_sent: whatsappSent,
        notification_sent: true,
        pharmacy_notified: !!prescription.pharmacy_name,
        message: `Receita enviada para ${patientName}${whatsappSent ? " via WhatsApp e notificação" : " via notificação no app"}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Prescription automation error:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
