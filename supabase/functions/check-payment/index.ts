import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { appointmentId, paymentId } = await req.json();

    if (!appointmentId && !paymentId) {
      return new Response(JSON.stringify({ error: "ID necessário" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check payment_webhooks for latest status
    if (paymentId) {
      const { data: webhook } = await supabase
        .from("payment_webhooks")
        .select("*")
        .eq("payment_id", paymentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (webhook) {
        // If approved, update appointment
        if (webhook.status === "approved" && appointmentId) {
          await supabase
            .from("appointments")
            .update({ payment_status: "paid", payment_id: paymentId, status: "confirmed" })
            .eq("id", appointmentId);

          // Create notification for patient
          const { data: appt } = await supabase
            .from("appointments")
            .select("patient_id, scheduled_at")
            .eq("id", appointmentId)
            .single();

          if (appt) {
            await supabase.from("notifications").insert({
              user_id: appt.patient_id,
              title: "✅ Pagamento confirmado!",
              message: `Sua consulta foi confirmada para ${new Date(appt.scheduled_at).toLocaleDateString("pt-BR")}.`,
              type: "payment",
              action_url: "/dashboard",
            });
          }
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

    // Check appointment payment status directly
    if (appointmentId) {
      const { data: appt } = await supabase
        .from("appointments")
        .select("payment_status, status, payment_id")
        .eq("id", appointmentId)
        .single();

      return new Response(JSON.stringify({
        status: appt?.payment_status || "pending",
        appointmentStatus: appt?.status || "scheduled",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "unknown" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-payment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
