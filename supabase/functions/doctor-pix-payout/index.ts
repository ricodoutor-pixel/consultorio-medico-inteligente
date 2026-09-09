/**
 * 💸 Saque Pix do consultório médico
 *
 * Regra de negócio: o valor das consultas fica acumulado como saldo positivo em
 * `doctor_wallets`. Nada é enviado ao profissional até ele clicar em "Solicitar Saque".
 * Ao solicitar, o Pix é disparado automaticamente via Mercado Pago para a chave
 * cadastrada. Se o gateway falhar, o valor volta para o saldo dele.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const FEE_RATE = 0.05;
const MIN_WITHDRAWAL = 50;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Não autorizado" }, 401);

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* corpo vazio */ }
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) return json({ error: "Valor inválido" }, 400);
    if (amount < MIN_WITHDRAWAL) {
      return json({ error: `Saque mínimo de R$ ${MIN_WITHDRAWAL.toFixed(2)}` }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    // 1. Reserva o valor: debita a carteira e cria o pedido (atômico no banco)
    const { data: reqRows, error: reqErr } = await userClient.rpc("request_doctor_pix_payout", {
      _amount: amount,
    });
    if (reqErr) return json({ error: reqErr.message }, 422);

    const payout = (Array.isArray(reqRows) ? reqRows[0] : reqRows) as {
      withdrawal_id: string;
      amount: number;
      fee: number;
      net_amount: number;
      pix_key: string;
      remaining_balance: number;
    } | null;
    if (!payout?.withdrawal_id) return json({ error: "Falha ao registrar o saque" }, 500);

    const fee = Number(payout.fee ?? Math.round(amount * FEE_RATE * 100) / 100);
    const net = Number(payout.net_amount ?? amount - fee);

    // 2. Pagamento automático via Mercado Pago (Pix out)
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    let mode = "manual";
    let mpId: string | null = null;
    let failure: string | null = null;

    if (mpToken) {
      try {
        const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mpToken}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": `pyr-doctor-payout-${payout.withdrawal_id}`,
          },
          body: JSON.stringify({
            transaction_amount: net,
            description: `Repasse médico Planta y Raiz ${payout.withdrawal_id.slice(0, 8)}`,
            payment_method_id: "pix",
            payer: { email: userData.user.email ?? "pagamentos@plantayraiz.com.br" },
            point_of_interaction: { transaction_data: { bank_transfer_id: payout.pix_key } },
            external_reference: `pyr-doctor-payout-${payout.withdrawal_id}`,
          }),
        });
        const mpData = await mpRes.json().catch(() => ({}));
        if (!mpRes.ok || mpData?.status === "rejected") {
          failure = mpData?.message || "Gateway recusou o Pix";
        } else {
          mode = "automatic";
          mpId = String(mpData?.id ?? "");
          await admin.rpc("settle_doctor_pix_payout", {
            _withdrawal_id: payout.withdrawal_id,
            _status: mpData?.status === "approved" ? "paid" : "processing",
            _reason: `mp:${mpId}`,
          });
        }
      } catch (e) {
        failure = (e as Error).message;
      }
    }

    if (failure) {
      // Estorna o saldo para a carteira do profissional
      await admin.rpc("settle_doctor_pix_payout", {
        _withdrawal_id: payout.withdrawal_id,
        _status: "failed",
        _reason: failure,
      });
      return json({ error: `Não foi possível enviar o Pix: ${failure}` }, 502);
    }

    if (mode === "manual") {
      // Sem gateway configurado: pedido fica em fila para liquidação pelo financeiro
      await admin.from("notifications").insert({
        user_id: userData.user.id,
        title: "📤 Saque em processamento",
        message: `Seu saque de R$ ${amount.toFixed(2)} (líquido R$ ${net.toFixed(2)}) foi registrado e será enviado ao seu Pix.`,
        type: "withdrawal",
        action_url: "/consultorio",
      });
    } else {
      await admin.from("notifications").insert({
        user_id: userData.user.id,
        title: "✅ Pix enviado",
        message: `Pix de R$ ${net.toFixed(2)} enviado para sua chave cadastrada. Taxa de manutenção: R$ ${fee.toFixed(2)} (5%).`,
        type: "withdrawal",
        action_url: "/consultorio",
      });
    }

    return json({
      success: true,
      mode,
      withdrawal: {
        id: payout.withdrawal_id,
        amount,
        fee,
        net_amount: net,
        mp_payment_id: mpId,
        remaining_balance: Number(payout.remaining_balance ?? 0),
      },
    });
  } catch (e) {
    console.error("[doctor-pix-payout]", e);
    return json({ error: "Erro interno" }, 500);
  }
});
