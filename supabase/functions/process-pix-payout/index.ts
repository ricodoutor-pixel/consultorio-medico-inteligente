/**
 * 🏦 Process PIX Payout - Liquidação de comissões via Mercado Pago
 * Valida saldo, limites diários, processa pagamento e concilia webhook
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";
import { getCorsHeaders, corsHeaders } from "../_shared/cors.ts";

const getFirstEnv = (...names: string[]) => {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) return value;
  }
  return null;
};

const WITHDRAWAL_FEE_RATE = 0.05;
const DAILY_LIMIT = 50.00;
const MIN_WITHDRAWAL = 100.00;

const PayoutSchema = z.object({
  withdrawal_id: z.string().uuid().optional(),
  batch: z.boolean().optional().default(false),
});

const WebhookSchema = z.object({
  action: z.string(),
  data: z.object({ id: z.string() }).passthrough(),
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAdminSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Não autorizado");

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await anonClient.auth.getUser();
  if (error || !data?.user) throw new Error("Não autorizado");

  const supabase = await getAdminSupabase();
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!role) throw new Error("Acesso restrito a administradores");
  return { userId: data.user.id, supabase };
}

// Validate withdrawal business rules
async function validateWithdrawal(supabase: any, withdrawalId: string) {
  const { data: w, error } = await supabase
    .from("affiliate_withdrawals")
    .select("*")
    .eq("id", withdrawalId)
    .single();

  if (error || !w) throw new Error("Saque não encontrado");
  if (w.status !== "pending") throw new Error(`Status inválido: ${w.status}`);

  // Check wallet balance
  const { data: wallet } = await supabase
    .from("affiliate_wallets")
    .select("available_balance")
    .eq("user_id", w.user_id)
    .single();

  if (!wallet || wallet.available_balance < w.amount) {
    throw new Error(`Saldo insuficiente. Disponível: R$ ${(wallet?.available_balance || 0).toFixed(2)}`);
  }

  // Min withdrawal
  if (w.amount < MIN_WITHDRAWAL) {
    throw new Error(`Valor mínimo para saque: R$ ${MIN_WITHDRAWAL.toFixed(2)}`);
  }

  // Daily limit
  const todayStart = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
  const { data: dailyW } = await supabase
    .from("affiliate_withdrawals")
    .select("amount")
    .eq("user_id", w.user_id)
    .gte("created_at", todayStart)
    .in("status", ["processing", "paid", "pending"]);

  const totalToday = (dailyW || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  if (totalToday > DAILY_LIMIT) {
    throw new Error(`Limite diário de R$ ${DAILY_LIMIT.toFixed(2)} excedido. Total hoje: R$ ${totalToday.toFixed(2)}`);
  }

  // Get pix key from profile or withdrawal
  const pixKey = w.pix_key;
  if (!pixKey) throw new Error("Chave PIX não informada");

  return { withdrawal: w, pixKey };
}

// Process single PIX payout via Mercado Pago
async function processPixOut(supabase: any, withdrawal: any, pixKey: string, adminUserId: string) {
  const fee = Math.round(withdrawal.amount * WITHDRAWAL_FEE_RATE * 100) / 100;
  const netAmount = Math.round((withdrawal.amount - fee) * 100) / 100;
  const externalRef = `pyr-payout-${withdrawal.id}`;

  // Set to processing
  await supabase
    .from("affiliate_withdrawals")
    .update({ status: "processing" })
    .eq("id", withdrawal.id);

  const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!mpToken) {
    // Fallback: mark as approved for manual processing
    await supabase
      .from("affiliate_withdrawals")
      .update({ status: "approved", processed_at: new Date().toISOString() })
      .eq("id", withdrawal.id);

    await supabase.from("audit_log").insert({
      user_id: adminUserId,
      action: "payout_approved_manual",
      table_name: "affiliate_withdrawals",
      record_id: withdrawal.id,
      new_data: { amount: withdrawal.amount, fee, net_amount: netAmount, pix_key: pixKey },
    });

    return { success: true, mode: "manual", withdrawal_id: withdrawal.id, fee, net_amount: netAmount };
  }

  try {
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": externalRef,
      },
      body: JSON.stringify({
        transaction_amount: netAmount,
        description: `Payout Planta y Raiz - ${withdrawal.id.slice(0, 8)}`,
        payment_method_id: "pix",
        payer: { email: "pagamentos@plantayraiz.com.br" },
        point_of_interaction: {
          transaction_data: {
            bank_transfer_id: pixKey,
          },
        },
        external_reference: externalRef,
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok || mpData.status === "rejected") {
      // Rollback
      await supabase
        .from("affiliate_withdrawals")
        .update({ status: "failed", rejected_reason: mpData.message || "Erro no gateway" })
        .eq("id", withdrawal.id);

      await supabase.from("audit_log").insert({
        user_id: adminUserId,
        action: "payout_failed",
        table_name: "affiliate_withdrawals",
        record_id: withdrawal.id,
        new_data: { error: mpData.message, mp_id: mpData.id },
      });

      return { success: false, error: mpData.message || "Falha no pagamento" };
    }

    // Update withdrawal with MP payment ID
    await supabase
      .from("affiliate_withdrawals")
      .update({
        status: mpData.status === "approved" ? "paid" : "processing",
        processed_at: new Date().toISOString(),
      })
      .eq("id", withdrawal.id);

    // Debit wallet if approved immediately
    if (mpData.status === "approved") {
      await supabase.rpc("credit_affiliate_wallet", {
        _user_id: withdrawal.user_id,
        _amount: -withdrawal.amount,
      });

      await supabase
        .from("affiliate_wallets")
        .update({
          total_withdrawn: supabase.rpc ? undefined : 0,
        })
        .eq("user_id", withdrawal.user_id);

      // Actually update withdrawn amount
      const { data: currentWallet } = await supabase
        .from("affiliate_wallets")
        .select("total_withdrawn")
        .eq("user_id", withdrawal.user_id)
        .single();

      if (currentWallet) {
        await supabase
          .from("affiliate_wallets")
          .update({
            available_balance: supabase.sql`available_balance - ${withdrawal.amount}`,
            total_withdrawn: Number(currentWallet.total_withdrawn) + withdrawal.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", withdrawal.user_id);
      }
    }

    await supabase.from("audit_log").insert({
      user_id: adminUserId,
      action: "payout_processed",
      table_name: "affiliate_withdrawals",
      record_id: withdrawal.id,
      new_data: { mp_payment_id: mpData.id, fee, net_amount: netAmount, status: mpData.status },
    });

    return { success: true, mode: "automatic", mp_payment_id: mpData.id, fee, net_amount: netAmount, status: mpData.status };
  } catch (e) {
    // Rollback on error
    await supabase
      .from("affiliate_withdrawals")
      .update({ status: "pending", rejected_reason: `Erro: ${(e as Error).message}` })
      .eq("id", withdrawal.id);

    return { success: false, error: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  // Webhook handler (POST /webhook)
  if (url.pathname.endsWith("/webhook") && req.method === "POST") {
    try {
      // HMAC-SHA256 signature verification (Mercado Pago x-signature)
      const mpWebhookSecret = getFirstEnv("MERCADOPAGO_WEBHOOK_SECRET", "MERCADO_PAGO_WEBHOOK_SECRET");
      const xSignature = req.headers.get("x-signature");
      const xRequestId = req.headers.get("x-request-id");
      if (!mpWebhookSecret) {
        console.error("[pix-payout/webhook] MERCADOPAGO_WEBHOOK_SECRET missing");
        return json({ error: "Webhook secret not configured" }, 500);
      }
      if (!xSignature) return json({ error: "Missing signature" }, 401);

      const rawBody = await req.text();
      let body: unknown;
      try { body = JSON.parse(rawBody); } catch { return json({ error: "Invalid JSON" }, 400); }
      const parsed = WebhookSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Payload inválido" }, 400);

      const dataId = parsed.data.data.id;
      const parts = xSignature.split(",");
      const ts = parts.find((p) => p.trim().startsWith("ts="))?.split("=")[1];
      const v1 = parts.find((p) => p.trim().startsWith("v1="))?.split("=")[1];
      if (!ts || !v1) return json({ error: "Invalid signature format" }, 401);
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const key = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(mpWebhookSecret),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
      );
      const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
      const expected = Array.from(new Uint8Array(sigBuf))
        .map((b) => b.toString(16).padStart(2, "0")).join("");
      if (expected !== v1) {
        console.error("[pix-payout/webhook] Invalid signature");
        return json({ error: "Invalid signature" }, 401);
      }

      if (parsed.data.action !== "payment.updated") return json({ ok: true });

      const supabase = await getAdminSupabase();
      const mpToken = getFirstEnv("MERCADO_PAGO_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN", "MERCADO_PAGO_API_KEY");
      if (!mpToken) return json({ error: "Token MP não configurado" }, 500);

      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${parsed.data.data.id}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      });
      const payment = await mpRes.json();

      if (!payment.external_reference?.startsWith("pyr-payout-")) return json({ ok: true });

      const withdrawalId = payment.external_reference.replace("pyr-payout-", "");

      if (payment.status === "approved") {
        const { data: w } = await supabase
          .from("affiliate_withdrawals")
          .select("user_id, amount")
          .eq("id", withdrawalId)
          .single();

        if (w) {
          await supabase
            .from("affiliate_withdrawals")
            .update({ status: "paid", processed_at: new Date().toISOString() })
            .eq("id", withdrawalId);

          // Debit wallet
          const { data: wallet } = await supabase
            .from("affiliate_wallets")
            .select("available_balance, total_withdrawn")
            .eq("user_id", w.user_id)
            .single();

          if (wallet) {
            await supabase
              .from("affiliate_wallets")
              .update({
                available_balance: Math.max(0, Number(wallet.available_balance) - w.amount),
                total_withdrawn: Number(wallet.total_withdrawn) + w.amount,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", w.user_id);
          }

          await supabase.from("notifications").insert({
            user_id: w.user_id,
            title: "💰 Saque Confirmado!",
            message: `Seu saque de R$ ${w.amount.toFixed(2)} foi confirmado e enviado via PIX.`,
            type: "withdrawal",
            action_url: "/afiliados/dashboard",
          });
        }

        await supabase.from("audit_log").insert({
          user_id: withdrawalId,
          action: "payout_confirmed_webhook",
          table_name: "affiliate_withdrawals",
          record_id: withdrawalId,
          new_data: { mp_payment_id: payment.id, status: "paid" },
        });
      } else if (["rejected", "cancelled", "refunded"].includes(payment.status)) {
        const { data: w } = await supabase
          .from("affiliate_withdrawals")
          .select("user_id, amount")
          .eq("id", withdrawalId)
          .single();

        if (w) {
          await supabase
            .from("affiliate_withdrawals")
            .update({
              status: "failed",
              rejected_reason: `PIX rejeitado: ${payment.status_detail || payment.status}`,
            })
            .eq("id", withdrawalId);

          // Return balance
          const { data: wallet } = await supabase
            .from("affiliate_wallets")
            .select("available_balance")
            .eq("user_id", w.user_id)
            .single();

          if (wallet) {
            await supabase
              .from("affiliate_wallets")
              .update({
                available_balance: Number(wallet.available_balance) + w.amount,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", w.user_id);
          }

          await supabase.from("notifications").insert({
            user_id: w.user_id,
            title: "⚠️ Saque Falhou",
            message: `Seu saque de R$ ${w.amount.toFixed(2)} falhou. Motivo: ${payment.status_detail || "Chave PIX inválida"}. O saldo foi devolvido.`,
            type: "withdrawal",
            action_url: "/afiliados/dashboard",
          });
        }

        await supabase.from("audit_log").insert({
          user_id: withdrawalId,
          action: "payout_failed_webhook",
          table_name: "affiliate_withdrawals",
          record_id: withdrawalId,
          new_data: { mp_payment_id: payment.id, status: payment.status, detail: payment.status_detail },
        });
      }

      return json({ ok: true });
    } catch (e) {
      console.error("Webhook error:", e);
      return json({ error: "Erro no webhook" }, 500);
    }
  }

  // Admin payout (POST /)
  if (req.method === "POST") {
    try {
      const { userId, supabase } = await verifyAdmin(req);
      const body = await req.json();
      const parsed = PayoutSchema.safeParse(body);
      if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

      const results: any[] = [];

      if (parsed.data.batch) {
        // Batch: process all pending
        const { data: pending } = await supabase
          .from("affiliate_withdrawals")
          .select("*")
          .eq("status", "pending");

        for (const w of pending || []) {
          try {
            const { pixKey } = await validateWithdrawal(supabase, w.id);
            const result = await processPixOut(supabase, w, pixKey, userId);
            results.push({ id: w.id, ...result });
          } catch (e) {
            results.push({ id: w.id, success: false, error: (e as Error).message });
          }
        }
      } else if (parsed.data.withdrawal_id) {
        const { withdrawal, pixKey } = await validateWithdrawal(supabase, parsed.data.withdrawal_id);
        const result = await processPixOut(supabase, withdrawal, pixKey, userId);
        results.push({ id: parsed.data.withdrawal_id, ...result });
      } else {
        return json({ error: "withdrawal_id ou batch=true é obrigatório" }, 400);
      }

      return json({ success: true, results });
    } catch (e) {
      console.error("Payout error:", e);
      return json({ error: (e as Error).message }, (e as Error).message.includes("autorizado") ? 403 : 500);
    }
  }

  // Validate single withdrawal (GET ?id=...)
  if (req.method === "GET") {
    try {
      const { supabase } = await verifyAdmin(req);
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "ID obrigatório" }, 400);

      const { withdrawal, pixKey } = await validateWithdrawal(supabase, id);
      const fee = Math.round(withdrawal.amount * WITHDRAWAL_FEE_RATE * 100) / 100;
      const netAmount = Math.round((withdrawal.amount - fee) * 100) / 100;

      return json({
        valid: true,
        withdrawal_id: id,
        amount: withdrawal.amount,
        fee,
        net_amount: netAmount,
        pix_key: pixKey,
        user_id: withdrawal.user_id,
      });
    } catch (e) {
      return json({ valid: false, error: (e as Error).message }, 400);
    }
  }

  return json({ error: "Método não suportado" }, 405);
});
