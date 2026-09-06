/**
 * 🏦 MANUS CEO - Process Withdrawal (Taxa 5% automática)
 * Todo saque sofre retenção de 5% para manutenção do ecossistema
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WITHDRAWAL_FEE_RATE = 0.05; // 5%
const DAILY_LIMIT = 50.00; // R$ 50 limite diário

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const { amount, pixKey } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Valor inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!pixKey || pixKey.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Chave Pix inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar limite diário
    const todayStart = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
    const { data: dailyWithdrawals } = await supabase
      .from("withdrawal_requests")
      .select("amount")
      .eq("user_id", authData.user.id)
      .gte("created_at", todayStart)
      .in("status", ["completed", "pending"]);

    const totalToday = dailyWithdrawals?.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0) || 0;

    // Verificar saldo disponível na carteira do afiliado
    const { data: wallet, error: walletErr } = await supabase
      .from("affiliate_wallets")
      .select("available_balance")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (walletErr) {
      console.error("Erro ao consultar carteira:", walletErr);
      return new Response(JSON.stringify({ error: "Erro ao verificar saldo" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const availableBalance = Number(wallet?.available_balance || 0);
    if (availableBalance < amount) {
      await supabase.from("audit_log").insert({
        user_id: authData.user.id,
        action: "withdrawal_insufficient_balance",
        table_name: "withdrawal_requests",
        record_id: authData.user.id,
        new_data: { attempted: amount, available: availableBalance },
      });
      return new Response(JSON.stringify({
        error: `Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}`,
      }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (totalToday + amount > DAILY_LIMIT) {
      // Alerta de segurança via ManyChat webhook
      const manychatUrl = Deno.env.get("MANYCHAT_WEBHOOK_URL");
      if (manychatUrl) {
        try {
          await fetch(manychatUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "SECURITY_ALERT",
              message: `⚠️ Tentativa de saque excedida: User ${authData.user.id} tentou sacar R$ ${amount}, mas já atingiu R$ ${totalToday} hoje.`,
              limit: DAILY_LIMIT,
            }),
          });
        } catch (webhookErr) {
          console.error("Erro ao enviar alerta ManyChat:", webhookErr);
        }
      }

      // Audit log da tentativa
      await supabase.from("audit_log").insert({
        user_id: authData.user.id,
        action: "withdrawal_limit_exceeded",
        table_name: "withdrawal_requests",
        record_id: authData.user.id,
        new_data: { attempted: amount, total_today: totalToday, limit: DAILY_LIMIT },
      });

      return new Response(JSON.stringify({
        error: `Limite diário de R$ ${DAILY_LIMIT.toFixed(2)} excedido. Você já sacou R$ ${totalToday.toFixed(2)} hoje. Tente novamente amanhã ou contate o suporte.`,
      }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calcular taxa automática
    const fee = Math.round(amount * WITHDRAWAL_FEE_RATE * 100) / 100;
    const netAmount = Math.round((amount - fee) * 100) / 100;

    // Registrar solicitação
    const { data: withdrawal, error: wErr } = await supabase
      .from("withdrawal_requests")
      .insert({
        user_id: authData.user.id,
        amount,
        fee,
        net_amount: netAmount,
        pix_key: pixKey.trim(),
        status: "pending",
      })
      .select()
      .single();

    if (wErr) {
      console.error("Erro ao criar saque:", wErr);
      return new Response(JSON.stringify({ error: "Erro ao processar saque" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit log
    await supabase.from("audit_log").insert({
      user_id: authData.user.id,
      action: "withdrawal_requested",
      table_name: "withdrawal_requests",
      record_id: withdrawal.id,
      new_data: { amount, fee, net_amount: netAmount, pix_key_last4: (pixKey || "").slice(-4) },
    });

    // Notificar
    await supabase.from("notifications").insert({
      user_id: authData.user.id,
      title: "📤 Saque solicitado",
      message: `Saque de R$ ${amount.toFixed(2)} solicitado. Taxa: R$ ${fee.toFixed(2)} (5%). Valor líquido: R$ ${netAmount.toFixed(2)}`,
      type: "withdrawal",
      action_url: "/carteira",
    });

    console.log(`🏦 [Manus CEO] Saque: R$${amount} | Taxa 5%: R$${fee} | Líquido: R$${netAmount} | User: ${authData.user.id}`);

    return new Response(JSON.stringify({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount,
        fee,
        net_amount: netAmount,
        fee_rate: "5%",
        status: "pending",
      },
      message: `Saque processado. Taxa de manutenção: R$ ${fee.toFixed(2)}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("❌ [Manus CEO] Erro no saque:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
