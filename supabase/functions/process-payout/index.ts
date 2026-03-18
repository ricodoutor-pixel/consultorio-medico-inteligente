import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AFFILIATE_RATES = [0.50, 0.05, 0.02]; // Nível 1: 50%, Nível 2: 5%, Nível 3: 2%
const PLATFORM_FEE_RATE = 0.05; // 5% taxa plataforma sobre vendas
const WITHDRAWAL_FEE_RATE = 0.05; // 5% taxa de saque

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
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    // ================================================================
    // ACTION: confirm_delivery — Patient confirms treatment received
    // ================================================================
    if (action === "confirm_delivery") {
      const { escrow_id } = body;

      const { data: escrow, error: escrowErr } = await supabase
        .from("escrow_transactions")
        .select("*")
        .eq("id", escrow_id)
        .eq("status", "held")
        .single();

      if (escrowErr || !escrow) {
        return new Response(JSON.stringify({ error: "Escrow não encontrado ou já processado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (escrow.patient_id !== authData.user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1. Mark escrow as released
      await supabase
        .from("escrow_transactions")
        .update({ status: "released", released_at: new Date().toISOString(), confirmed_at: new Date().toISOString() })
        .eq("id", escrow_id);

      // 2. Record delivery confirmation
      await supabase
        .from("delivery_confirmations")
        .insert({ escrow_id, patient_id: authData.user.id, payout_triggered: true });

      // 3. Process affiliate commissions
      const patientId = escrow.patient_id;
      const { data: referralLink } = await supabase
        .from("referral_links")
        .select("*")
        .eq("user_id", patientId)
        .maybeSingle();

      if (referralLink) {
        const referrers = [
          referralLink.level1_referrer,
          referralLink.level2_referrer,
          referralLink.level3_referrer,
        ].filter(Boolean);

        const commissionBase = escrow.platform_fee;

        for (let i = 0; i < referrers.length; i++) {
          const amount = Math.round(commissionBase * AFFILIATE_RATES[i] * 100) / 100;
          if (amount > 0) {
            await supabase.from("affiliate_commissions").insert({
              referrer_id: referrers[i],
              referred_id: patientId,
              source_transaction_id: escrow_id,
              level: i + 1,
              rate: AFFILIATE_RATES[i],
              amount,
              status: "pending",
            });
          }
        }
      }

      // 4. Create notifications
      if (escrow.doctor_id) {
        await supabase.from("notifications").insert({
          user_id: escrow.doctor_id,
          title: "💰 Pagamento Liberado",
          message: `O paciente confirmou o tratamento. Seu payout de R$ ${escrow.doctor_payout?.toFixed(2)} foi processado.`,
          type: "payment_confirmed",
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Tratamento confirmado! Payouts processados automaticamente.",
        escrow_id,
        doctor_payout: escrow.doctor_payout,
        vendor_payout: escrow.vendor_payout,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ================================================================
    // ACTION: request_withdrawal — User requests payout with 5% fee
    // ================================================================
    if (action === "request_withdrawal") {
      const { amount, pix_key } = body;

      if (!amount || amount <= 0 || !pix_key) {
        return new Response(JSON.stringify({ error: "Dados inválidos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const fee = Math.round(amount * WITHDRAWAL_FEE_RATE * 100) / 100;
      const net_amount = Math.round((amount - fee) * 100) / 100;

      await supabase.from("withdrawal_requests").insert({
        user_id: authData.user.id,
        amount,
        fee,
        net_amount,
        pix_key,
        status: "pending",
      });

      return new Response(JSON.stringify({
        success: true,
        amount,
        fee,
        net_amount,
        message: `Saque de R$ ${net_amount.toFixed(2)} solicitado (taxa de 5%: R$ ${fee.toFixed(2)}).`,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação não reconhecida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-payout error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
