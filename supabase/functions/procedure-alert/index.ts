/**
 * Procedure Alert - Notificação de Procedimento Cirúrgico
 * Envia alertas WhatsApp quando um paciente é indicado para procedimento
 * Administrado 24/7 pelo Manus CEO
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: authData, error: authError } = await anonClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { 
      patientId, 
      procedureType, 
      urgency, 
      recommendedSpecialty,
      estimatedDate,
      notes 
    } = await req.json();

    if (!patientId || !procedureType) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get patient info
    const { data: patient, error: patientError } = await supabase
      .from("users")
      .select("id, email, phone, full_name")
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      return new Response(JSON.stringify({ error: "Paciente não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create procedure record
    const { data: procedure, error: procError } = await supabase
      .from("procedures")
      .insert({
        patient_id: patientId,
        type: procedureType,
        urgency: urgency || "media",
        recommended_specialty: recommendedSpecialty,
        estimated_date: estimatedDate,
        status: "pending",
        notes: notes,
        created_by: authData.user.id,
      })
      .select()
      .single();

    if (procError || !procedure) {
      return new Response(JSON.stringify({ error: "Erro ao criar procedimento" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Send WhatsApp notification
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && patient.phone) {
      const urgencyLabel = {
        baixa: "Baixa",
        media: "Média",
        alta: "Alta",
        urgente: "Urgente"
      }[urgency] || "Média";

      const message = `🏥 *Alerta de Procedimento - Planta & Raiz*

Olá ${patient.full_name}!

Você foi indicado para um procedimento:
• Tipo: ${procedureType}
• Urgência: ${urgencyLabel}
• Especialidade: ${recommendedSpecialty || "A definir"}
${estimatedDate ? `• Data estimada: ${new Date(estimatedDate).toLocaleDateString("pt-BR")}` : ""}

⚠️ Entre em contato com nossos especialistas para agendar.

Acesse: plantayraiz.com.br/procedimentos`;

      try {
        const phoneNumber = patient.phone.replace(/\D/g, "");
        const whatsappNumber = `whatsapp:+55${phoneNumber}`;

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: TWILIO_WHATSAPP_FROM!,
              To: whatsappNumber,
              Body: message,
            }).toString(),
          }
        );

        if (!response.ok) {
          console.error("Erro ao enviar WhatsApp:", await response.text());
        }
      } catch (whatsappError) {
        console.error("Erro ao enviar notificação WhatsApp:", whatsappError);
      }
    }

    // 4. Log activity
    await supabase
      .from("activity_logs")
      .insert({
        user_id: authData.user.id,
        action: "procedure_alert_created",
        resource_type: "procedure",
        resource_id: procedure.id,
        details: {
          patient_id: patientId,
          procedure_type: procedureType,
          urgency: urgency,
          notification_sent: !!patient.phone,
        },
      });

    // 5. Send email notification to doctor/admin
    const { data: doctors } = await supabase
      .from("doctors")
      .select("id, user_id, specialty")
      .eq("specialty", recommendedSpecialty)
      .limit(3);

    if (doctors && doctors.length > 0) {
      for (const doctor of doctors) {
        await supabase
          .from("notifications")
          .insert({
            user_id: doctor.user_id,
            type: "procedure_alert",
            title: `Novo procedimento indicado - ${procedureType}`,
            message: `Paciente ${patient.full_name} foi indicado para ${procedureType} (Urgência: ${urgency})`,
            related_id: procedure.id,
            read: false,
          });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      procedure,
      message: "Alerta de procedimento criado e notificações enviadas"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro em procedure-alert:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
