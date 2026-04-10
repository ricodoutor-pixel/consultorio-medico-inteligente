import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const { type, data } = body;
    const action = body.action || type;
    const paymentId = data?.id || body.data?.id;

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "No payment ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify MercadoPago webhook signature
    const mpWebhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (!mpWebhookSecret || !xSignature) {
      console.error("Missing webhook secret or x-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    {
      const parts = xSignature.split(",");
      const tsPart = parts.find((p: string) => p.trim().startsWith("ts="));
      const v1Part = parts.find((p: string) => p.trim().startsWith("v1="));
      const ts = tsPart?.split("=")?.[1];
      const v1 = v1Part?.split("=")?.[1];

      if (ts && v1) {
        const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(mpWebhookSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sigBuf = await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode(manifest)
        );
        const expected = Array.from(new Uint8Array(sigBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        if (expected !== v1) {
          console.error("Invalid webhook signature");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log("Webhook signature verified successfully");
      }
    }

    // Fetch payment details from Mercado Pago API
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response(JSON.stringify({ status: "received", warning: "MP token not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });

    if (!mpResponse.ok) {
      console.error("MP API error:", mpResponse.status);
      return new Response(JSON.stringify({ status: "received", error: "MP API error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = await mpResponse.json();
    console.log("Payment details:", JSON.stringify({
      id: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      payer_email: payment.payer?.email,
    }));

    // Calculate split - 7% platform fee for consultations, 5% for marketplace
    const totalAmount = payment.transaction_amount || 0;
    const metadata = payment.metadata || {};
    const isMarketplace = metadata.type === "marketplace";
    const feeRate = isMarketplace ? 0.05 : 0.07;
    const mpFee = Math.round((totalAmount * 0.0299 + 0.30) * 100) / 100; // MP fee estimate
    const platformFee = Math.round(totalAmount * feeRate * 100) / 100;
    const doctorPayout = Math.round((totalAmount - platformFee) * 100) / 100;

    // Store webhook event
    const { error: insertError } = await supabase.from("payment_webhooks").insert({
      payment_id: String(payment.id),
      status: payment.status,
      amount: totalAmount,
      payer_email: payment.payer?.email || "unknown",
      raw_data: payment,
      action: action,
      platform_fee: platformFee,
      doctor_payout: doctorPayout,
      split_processed: payment.status === "approved",
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
    }

    // Handle payment status
    const appointmentId = payment.external_reference || metadata.appointment_id;

    if (payment.status === "approved" && appointmentId) {
      console.log(`✅ Payment ${paymentId} approved — R$ ${totalAmount} | Platform: R$ ${platformFee} | Doctor: R$ ${doctorPayout}`);

      // 1. Update appointment status
      const { error: updateErr } = await supabase
        .from("appointments")
        .update({ payment_status: "paid", status: "confirmed" })
        .eq("id", appointmentId);

      if (updateErr) console.error("Appointment update error:", updateErr);

      // 2. Fetch appointment details
      const { data: appt } = await supabase
        .from("appointments")
        .select("patient_id, doctor_id, scheduled_at, amount")
        .eq("id", appointmentId)
        .single();

      if (appt) {
        // 3. Record escrow transaction for revenue tracking
        const { error: escrowErr } = await supabase.from("escrow_transactions").insert({
          patient_id: appt.patient_id,
          doctor_id: appt.doctor_id,
          appointment_id: appointmentId,
          amount: totalAmount,
          platform_fee: platformFee,
          doctor_payout: doctorPayout,
          type: "consultation",
          status: "held",
        });
        if (escrowErr) console.error("Escrow insert error:", escrowErr);

        // 4. Notify PATIENT — payment confirmed
        await supabase.from("notifications").insert({
          user_id: appt.patient_id,
          title: "Pagamento Confirmado ✅",
          message: `Seu pagamento de R$ ${totalAmount.toFixed(2)} foi confirmado. Sua consulta está agendada!`,
          type: "payment_confirmed",
          action_url: "/dashboard",
        });

        // 5. Notify DOCTOR — new confirmed consultation
        const { data: doctorRecord } = await supabase
          .from("doctors")
          .select("user_id")
          .eq("id", appt.doctor_id)
          .single();

        if (doctorRecord) {
          const { data: patientProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", appt.patient_id)
            .single();

          const patientName = patientProfile?.full_name || "Paciente";
          const scheduledDate = appt.scheduled_at
            ? new Date(appt.scheduled_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
            : "a definir";

          await supabase.from("notifications").insert({
            user_id: doctorRecord.user_id,
            title: "Nova Consulta Confirmada 🩺",
            message: `${patientName} confirmou pagamento de R$ ${totalAmount.toFixed(2)}. Consulta em ${scheduledDate}. Seus honorários: R$ ${doctorPayout.toFixed(2)}`,
            type: "consultation_confirmed",
            action_url: "/dashboard-medico",
          });

          console.log(`📩 Doctor ${doctorRecord.user_id} notified — payout R$ ${doctorPayout.toFixed(2)}`);
        }

        // 6. Schedule NPS — create a pending notification for 5min after scheduled_at
        if (appt.scheduled_at) {
          const consultEnd = new Date(appt.scheduled_at);
          consultEnd.setMinutes(consultEnd.getMinutes() + 35); // 30min consult + 5min buffer

          await supabase.from("notifications").insert({
            user_id: appt.patient_id,
            title: "Como foi sua consulta? ⭐",
            message: "Avalie seu atendimento e ajude-nos a melhorar! Sua opinião é muito importante.",
            type: "nps_request",
            action_url: `/nps?consultation=${appointmentId}&doctor=${appt.doctor_id}`,
            metadata: {
              appointment_id: appointmentId,
              doctor_id: appt.doctor_id,
              nps_scheduled_for: consultEnd.toISOString(),
            },
          });
        }

        // 7. Notify admins
        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (adminRoles) {
          for (const admin of adminRoles) {
            await supabase.from("notifications").insert({
              user_id: admin.user_id,
              title: "💰 Pagamento Recebido",
              message: `R$ ${totalAmount.toFixed(2)} — Taxa plataforma: R$ ${platformFee.toFixed(2)} | Médico: R$ ${doctorPayout.toFixed(2)}`,
              type: "payment_received",
              action_url: "/admin-master",
            });
          }
        }
      }
    } else if (payment.status === "rejected") {
      console.log(`❌ Payment ${paymentId} rejected`);
      if (appointmentId) {
        await supabase
          .from("appointments")
          .update({ payment_status: "rejected" })
          .eq("id", appointmentId);

        // Notify patient about failed payment
        const { data: appt } = await supabase
          .from("appointments")
          .select("patient_id")
          .eq("id", appointmentId)
          .single();

        if (appt) {
          await supabase.from("notifications").insert({
            user_id: appt.patient_id,
            title: "Pagamento Não Aprovado ❌",
            message: "Seu pagamento não foi aprovado. Tente novamente ou use outro método de pagamento.",
            type: "payment_failed",
            action_url: `/pagamento?appointment=${appointmentId}`,
          });
        }
      }
    } else if (payment.status === "pending") {
      console.log(`⏳ Payment ${paymentId} pending`);
      if (appointmentId) {
        await supabase
          .from("appointments")
          .update({ payment_status: "pending" })
          .eq("id", appointmentId);
      }
    }

    return new Response(JSON.stringify({ status: "processed", payment_status: payment.status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
