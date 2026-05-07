import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;


  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const manychatKey = Deno.env.get("MANYCHAT_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

    // 1. PIX pendente > 30 min
    const { data: pendingPayments } = await supabase
      .from("escrow_transactions")
      .select("id, patient_id, amount, created_at")
      .eq("status", "held")
      .lt("created_at", thirtyMinAgo)
      .limit(50);

    const recoveredIds: string[] = [];

    for (const tx of pendingPayments || []) {
      // Get patient profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", tx.patient_id)
        .single();

      if (!profile?.phone) continue;

      // Send recovery notification via ManyChat
      if (manychatKey) {
        try {
          await fetch("https://api.manychat.com/fb/sending/sendFlow", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${manychatKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subscriber_id: profile.phone,
              flow_ns: "cart_recovery_pix_pending",
            }),
          });
        } catch (e) {
          console.error("ManyChat send error:", e);
        }
      }

      // Insert notification in DB
      await supabase.from("notifications").insert({
        user_id: tx.patient_id,
        title: "⏰ Seu pagamento PIX está pendente!",
        message: `Seu pagamento de R$ ${Number(tx.amount).toFixed(2)} ainda não foi confirmado. Sua reserva expira em breve! Complete o pagamento agora.`,
        type: "payment_reminder",
        action_url: "/pagamento-pendente",
      });

      recoveredIds.push(tx.id);
    }

    // 2. Retention Health Check — inactive 20+ days
    const { data: atRiskUsers } = await supabase
      .from("profiles")
      .select("id, full_name, phone, updated_at")
      .lt("updated_at", twentyDaysAgo)
      .limit(100);

    const retentionCount = (atRiskUsers || []).length;

    for (const user of atRiskUsers || []) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "💚 Sentimos sua falta!",
        message: "Faz tempo que você não acessa a plataforma. Que tal agendar uma consulta de acompanhamento? Seu bem-estar é prioridade.",
        type: "engagement",
        action_url: "/consulta-rapida",
      });
    }

    // 3. Prescription renewal — expiring in 7 days
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: expiringRx } = await supabase
      .from("prescriptions")
      .select("id, patient_id, valid_until, doctor_id")
      .eq("status", "active")
      .gt("valid_until", now)
      .lt("valid_until", sevenDaysFromNow)
      .limit(100);

    for (const rx of expiringRx || []) {
      await supabase.from("notifications").insert({
        user_id: rx.patient_id,
        title: "📋 Sua receita vence em breve!",
        message: "Sua prescrição está próxima do vencimento. Agende uma consulta de renovação com um clique para não ficar sem o tratamento.",
        type: "prescription_renewal",
        action_url: "/consulta-rapida",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        recovered_payments: recoveredIds.length,
        at_risk_users: retentionCount,
        expiring_prescriptions: (expiringRx || []).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Cart recovery error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
