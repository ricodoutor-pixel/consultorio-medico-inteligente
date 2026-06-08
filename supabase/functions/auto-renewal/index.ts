import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;


  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Find prescriptions expiring in 7-14 days with active patients
    const expiryWindow = new Date();
    expiryWindow.setDate(expiryWindow.getDate() + 14);
    const urgentWindow = new Date();
    urgentWindow.setDate(urgentWindow.getDate() + 7);

    const { data: expiringRx, error } = await supabase
      .from("prescriptions")
      .select("id, patient_id, doctor_id, medications, valid_until, diagnosis_cid, instructions")
      .eq("status", "active")
      .lte("valid_until", expiryWindow.toISOString())
      .gte("valid_until", new Date().toISOString());

    if (error || !expiringRx?.length) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Nenhuma receita próxima do vencimento",
        processed: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let renewed = 0;
    let notified = 0;

    for (const rx of expiringRx) {
      const validUntil = new Date(rx.valid_until);
      const daysLeft = Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const isUrgent = daysLeft <= 7;

      // 2. Check if patient has had recent consultation (last 90 days)
      const { data: recentAppts } = await supabase
        .from("appointments")
        .select("id, scheduled_at")
        .eq("patient_id", rx.patient_id)
        .eq("doctor_id", rx.doctor_id)
        .eq("status", "completed")
        .gte("scheduled_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recentAppts?.length) {
        // 3a. Auto-create renewal request (doctor had recent contact)
        const { error: reqError } = await supabase
          .from("prescription_requests")
          .insert({
            patient_id: rx.patient_id,
            doctor_id: rx.doctor_id,
            prescription_id: rx.id,
            status: "pending_renewal",
            notes: `[AUTO-RENEWAL] Receita expira em ${daysLeft} dias. Último atendimento recente. Medicamentos: ${JSON.stringify(rx.medications)}`,
          });

        if (!reqError) renewed++;

        // Notify doctor via internal notification
        await supabase.from("notifications").insert({
          user_id: rx.doctor_id,
          type: "prescription_renewal",
          title: "🔄 Renovação de Receita Pendente",
          message: `Paciente com receita expirando em ${daysLeft} dias. Clique para renovar.`,
          action_url: `/prontuario?patient=${rx.patient_id}`,
          metadata: { prescription_id: rx.id, days_left: daysLeft, auto_renewal: true },
        });
      }

      // 4. Notify patient
      await supabase.from("notifications").insert({
        user_id: rx.patient_id,
        type: isUrgent ? "prescription_urgent" : "prescription_warning",
        title: isUrgent ? "⚠️ Receita vence em breve!" : "📋 Sua receita está próxima do vencimento",
        message: isUrgent
          ? `Sua receita vence em ${daysLeft} dias. Renove agora para não ficar sem medicamento.`
          : `Sua receita vence em ${daysLeft} dias. Agende uma renovação.`,
        action_url: "/dashboard",
        metadata: { prescription_id: rx.id, days_left: daysLeft },
      });
      notified++;

      // 5. Trigger WhatsApp notification for urgent cases (Evolution API — Enfª Brisa)
      if (isUrgent) {
        try {
          const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
          const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
          const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

          if (EVO_URL && EVO_KEY) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("phone, full_name")
              .eq("id", rx.patient_id)
              .single();

            if (profile?.phone) {
              await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", apikey: EVO_KEY },
                body: JSON.stringify({
                  number: profile.phone.replace(/\D/g, ""),
                  text: `🌿 Olá ${profile.full_name}! Sua receita de cannabis medicinal vence em ${daysLeft} dias.\n\n⚡ Renove agora pelo app e garanta a continuidade do seu tratamento:\nhttps://plantayraiz.com.br/dashboard\n\n🏥 Planta & Raiz - Sua saúde em primeiro lugar`,
                }),
              });
            }
          }
        } catch (whatsappError) {
          console.error("WhatsApp notification error:", whatsappError);
        }
      }
    }

    // Log event
    await supabase.from("ai_events").insert({
      ai_name: "auto-renewal-engine",
      event_type: "prescription_auto_renewal",
      status: "success",
      output_data: { total: expiringRx.length, renewed, notified },
    });

    return new Response(JSON.stringify({
      success: true,
      total_expiring: expiringRx.length,
      auto_renewed: renewed,
      patients_notified: notified,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-renewal error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
