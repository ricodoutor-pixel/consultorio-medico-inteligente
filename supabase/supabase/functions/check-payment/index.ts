import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authData, error: authError } = await anonClient.auth.getUser();
    const user = authData?.user;

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { appointmentId, paymentId } = await req.json();

    if (!appointmentId) {
      return new Response(JSON.stringify({ error: "appointmentId necessário" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: appt } = await supabase
      .from("appointments")
      .select("id, patient_id, doctor_id, payment_status, status, payment_id, scheduled_at, amount")
      .eq("id", appointmentId)
      .maybeSingle();

    if (!appt) {
      return new Response(JSON.stringify({ error: "Consulta não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPatient = appt.patient_id === user.id;

    const { data: doctorRow } = await supabase
      .from("doctors")
      .select("id")
      .eq("id", appt.doctor_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAuthorized = isPatient || !!doctorRow || !!adminRole;

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (paymentId) {
      const { data: webhook } = await supabase
        .from("payment_webhooks")
        .select("status, amount, action, external_reference")
        .eq("payment_id", paymentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Prevent payment-ID reuse: require this payment to actually reference THIS appointment.
      const ref = String((webhook as any)?.external_reference ?? (webhook as any)?.action ?? "");
      const matchesAppt = ref.includes(appointmentId);
      if (webhook && !matchesAppt) {
        console.error(`[check-payment] payment ${paymentId} does not reference appointment ${appointmentId} (ref=${ref})`);
        return new Response(JSON.stringify({ error: "Pagamento não pertence a esta consulta", status: "mismatch" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (webhook) {
        if (webhook.status === "approved") {
          // Validate paid amount matches expected appointment amount
          if (webhook.amount != null && Number(webhook.amount) < Number(appt.amount)) {
            console.error(`Payment amount mismatch: paid ${webhook.amount}, expected ${appt.amount}`);
            return new Response(JSON.stringify({ error: "Valor pago inferior ao valor da consulta", status: "amount_mismatch" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          await supabase
            .from("appointments")
            .update({ payment_status: "paid", payment_id: paymentId, status: "confirmed" })
            .eq("id", appointmentId);

          await supabase.from("notifications").insert({
            user_id: appt.patient_id,
            title: "✅ Pagamento confirmado!",
            message: `Sua consulta foi confirmada para ${new Date(appt.scheduled_at).toLocaleDateString("pt-BR")}.`,
            type: "payment",
            action_url: "/dashboard",
          });
        }

        return new Response(JSON.stringify({
          status: webhook.status,
          amount: webhook.amount,
          updated: true,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      status: appt.payment_status || "pending",
      appointmentStatus: appt.status || "scheduled",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-payment error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
