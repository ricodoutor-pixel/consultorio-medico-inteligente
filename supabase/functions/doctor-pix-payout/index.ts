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
import { MP_PIX_PAYOUT_URL, mpPayoutOutcome, mpPixPayoutBody } from "../_shared/mp-pix-payout.ts";

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
    const rawKey = String(payout.pix_key ?? "");
    const maskedPixKey =
      rawKey.length >= 8
        ? `${rawKey.slice(0, 4)}****${rawKey.slice(-4)}`
        : rawKey.length >= 4
        ? `${rawKey.slice(0, 2)}****`
        : "****";

    // 2. Pagamento automático via Mercado Pago Payouts (POST /v1/transaction-intents/process)
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    let mode = "simulado";
    let payoutStatus: "simulado" | "paid" | "processing" = "simulado";
    let mpId: string | null = null;
    let failure: string | null = null;

    // Regra de segurança absoluta: nenhum Pix de saque real é enviado sem ordem escrita do proprietário.
    // O envio real só liga quando o proprietário cadastra o segredo MP_PIX_PAYOUT_ENABLED=true
    // (conta Mercado Pago com Payouts habilitado). Até lá o saque fica "simulado".
    const MONEY_OUT_READY = Deno.env.get("MP_PIX_PAYOUT_ENABLED") === "true";
    if (mpToken && MONEY_OUT_READY) {
      let body: ReturnType<typeof mpPixPayoutBody> | null = null;
      try {
        body = mpPixPayoutBody({
          withdrawalId: payout.withdrawal_id,
          net,
          pixKey: rawKey,
          notificationUrl: Deno.env.get("MP_PIX_PAYOUT_NOTIFICATION_URL") || undefined,
        });
      } catch (e) {
        failure = (e as Error).message; // nada foi enviado: pode estornar
      }
      if (body) {
        let mpRes: Response | null = null;
        let mpData: Record<string, unknown> = {};
        try {
          mpRes = await fetch(MP_PIX_PAYOUT_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${mpToken}`,
              "Content-Type": "application/json",
              "X-Idempotency-Key": `pyr-saque-${payout.withdrawal_id}`,
            },
            body: JSON.stringify(body),
          });
          mpData = await mpRes.json().catch(() => ({}));
        } catch {
          mpRes = null;
        }
        mpId = mpData?.id ? String(mpData.id) : null;
        const outcome = mpRes?.ok ? mpPayoutOutcome(mpData?.status) : "failed";
        const definitiveRefusal = mpRes !== null && mpRes.status >= 400 && mpRes.status < 500;
        if (outcome === "failed" && (definitiveRefusal || (mpRes?.ok ?? false))) {
          // Recusa explícita do Mercado Pago: o dinheiro não saiu, então volta ao saldo.
          failure = String(mpData?.message || mpData?.error || mpData?.status || `HTTP ${mpRes?.status}`);
        } else {
          // Enviado (ou resultado desconhecido por timeout/5xx): nunca estorna sozinho, para não pagar duas vezes.
          mode = "automatic";
          payoutStatus = outcome === "paid" ? "paid" : "processing";
          await admin.rpc("settle_doctor_pix_payout", {
            _withdrawal_id: payout.withdrawal_id,
            _status: payoutStatus,
            _reason: outcome === "failed"
              ? `mp_payout:desconhecido:HTTP ${mpRes?.status ?? "sem resposta"} (conciliar no painel Mercado Pago)`
              : `mp_payout:${mpId ?? ""}:${String(mpData?.status ?? "")}`,
          });
        }
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

    const requestedAt = new Date().toISOString();
    await admin.from("audit_log").insert({
      user_id: userData.user.id,
      action: mode === "simulado" ? "doctor_payout_simulado" : "doctor_payout_automatic",
      table_name: "withdrawal_requests",
      record_id: payout.withdrawal_id,
      new_data: {
        who: userData.user.id,
        email: userData.user.email ?? null,
        when: requestedAt,
        amount,
        fee,
        net_amount: net,
        masked_pix_key: maskedPixKey,
        status: payoutStatus,
      },
    });

    if (mode === "simulado") {
      const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
      if (admins?.length) {
        await admin.from("notifications").insert(admins.map((r: { user_id: string }) => ({
          user_id: r.user_id,
          title: "Saque de médico registrado (Simulado)",
          message: `Pedido ${payout.withdrawal_id.slice(0, 8)} · R$ ${net.toFixed(2)} para Pix ${maskedPixKey} · Status: simulado (aguardando autorização).`,
          type: "withdrawal_admin",
          action_url: "/admin",
        })));
      }
      await admin.from("notifications").insert({
        user_id: userData.user.id,
        title: "📤 Saque registrado (modo simulado)",
        message: `Seu saque de R$ ${amount.toFixed(2)} (líquido R$ ${net.toFixed(2)}) para a chave ${maskedPixKey} foi registrado com status simulado até autorização de envio.`,
        type: "withdrawal",
        action_url: "/consultorio",
      });
    } else {
      await admin.from("notifications").insert({
        user_id: userData.user.id,
        title: payoutStatus === "paid" ? "✅ Pix enviado" : "⏳ Pix em processamento",
        message: payoutStatus === "paid"
          ? `Pix de R$ ${net.toFixed(2)} enviado para sua chave cadastrada (${maskedPixKey}). Taxa de manutenção: R$ ${fee.toFixed(2)} (5%).`
          : `Pix de R$ ${net.toFixed(2)} para a chave ${maskedPixKey} está em processamento no Mercado Pago. Avisaremos quando for creditado.`,
        type: "withdrawal",
        action_url: "/consultorio",
      });
    }

    return json({
      success: true,
      mode,
      status: payoutStatus,
      withdrawal: {
        id: payout.withdrawal_id,
        who: userData.user.id,
        when: requestedAt,
        amount,
        fee,
        net_amount: net,
        masked_pix_key: maskedPixKey,
        status: payoutStatus,
        mp_payment_id: mpId,
        remaining_balance: Number(payout.remaining_balance ?? 0),
      },
    });
  } catch (e) {
    console.error("[doctor-pix-payout]", e);
    return json({ error: "Erro interno" }, 500);
  }
});
