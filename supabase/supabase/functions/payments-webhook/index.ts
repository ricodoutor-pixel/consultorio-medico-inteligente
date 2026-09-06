import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, verifyWebhook, createStripeClient } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("Webhook event:", event.type, "env:", env);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object, env);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, env);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);

    await supabase.from("error_logs").insert({
      source: "payments-webhook",
      error_type: "webhook_verification",
      message: String(e),
      metadata: { env },
    });

    return new Response("Webhook error", { status: 400 });
  }
});

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const cartToken = session.metadata?.cartToken;
  const externalRef = session.client_reference_id || "";

  console.log("Checkout completed:", session.id, "mode:", session.mode, "userId:", userId, "ref:", externalRef);

  // === BRISA ORIENTAÇÃO TÉCNICA (USD 10 via Stripe) ===
  if (externalRef.startsWith("brisa-orientacao-") || session.metadata?.source === "brisa_whatsapp") {
    const orientacaoPhone = session.metadata?.phone || externalRef.replace("brisa-orientacao-", "").split("-")[0] || null;
    const orientacaoName = session.metadata?.name || session.customer_details?.name || null;
    const orientacaoEmail = session.customer_details?.email || null;
    const amount = (session.amount_total || 0) / 100;

    await supabase.from("brisa_orientacao_payments").upsert({
      payment_id: session.id,
      external_reference: externalRef,
      status: "approved",
      amount: amount,
      patient_phone: orientacaoPhone,
      patient_name: orientacaoName,
      patient_email: orientacaoEmail,
      raw_payload: session,
      updated_at: new Date().toISOString(),
    }, { onConflict: "payment_id" });

    // Notifica Dr. Edilson via WhatsApp (Evolution API)
    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
    const instance = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
    const adminPhone = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";

    if (evolutionUrl && evolutionKey) {
      const drMsg =
        `✅ *Parabéns, Doutor!*\n\n` +
        `Mais uma *Orientação Técnica INTERNACIONAL* realizada com sucesso! 🌍\n\n` +
        `💰 Valor: USD ${amount.toFixed(2)} (confirmado via Stripe)\n` +
        `👤 Paciente: ${orientacaoName || "—"}\n` +
        `📱 WhatsApp: ${orientacaoPhone ? `+${orientacaoPhone}` : "—"}\n` +
        `🔖 Ref: ${externalRef}\n\n` +
        `Inicie a consulta pelo WhatsApp do paciente.`;

      await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evolutionKey },
        body: JSON.stringify({ number: adminPhone, text: drMsg }),
      }).catch((err) => console.error("[brisa-stripe] dr notify:", err));

      if (orientacaoPhone) {
        const patientMsg =
          `🌍 *Payment Confirmed — Planta y Raiz*\n\n` +
          `Hello ${orientacaoName?.split(" ")[0] || ""}! We received your payment of *USD ${amount.toFixed(2)}*.\n\n` +
          `👨‍⚕️ *Dr. Edilson Bezerra* will contact you shortly right here on WhatsApp for your *Medical Cannabis Technical Guidance*.\n\n` +
          `Any questions, just talk to me, Nurse Brisa.`;
        await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evolutionKey },
          body: JSON.stringify({ number: orientacaoPhone, text: patientMsg }),
        }).catch((err) => console.error("[brisa-stripe] patient notify:", err));
      }

      await supabase.from("brisa_orientacao_payments").update({
        doctor_notified_at: new Date().toISOString(),
        patient_notified_at: orientacaoPhone ? new Date().toISOString() : null,
      }).eq("payment_id", session.id);
    }
  }

  // One-time payment: credit Planta-Coins atomically
  if (session.mode === "payment" && userId) {
    const amount = (session.amount_total || 0) / 100;
    const coins = Math.floor(amount);

    // Use the DB function that atomically increments (no overwrite)
    const { error: rpcError } = await supabase.rpc("increment_planta_coins", { _user_id: userId, _coins: coins });
    if (rpcError) {
      console.error("Failed to credit coins via RPC:", rpcError);
      // Log for manual recovery
      await supabase.from("error_logs").insert({
        source: "payments-webhook",
        error_type: "coins_credit_failed",
        message: rpcError.message,
        user_id: userId,
        metadata: { session_id: session.id, coins, env },
      });
    }

    // If cart token, mark cart as completed
    if (cartToken) {
      await supabase.from("prescription_carts")
        .update({ status: "completed", completed_at: new Date().toISOString(), payment_id: session.id })
        .eq("cart_token", cartToken);
    }
  }

  // Audit
  await supabase.from("audit_log").insert({
    user_id: userId || "anonymous",
    action: "payment_completed",
    table_name: "subscriptions",
    record_id: session.id,
    new_data: { amount: session.amount_total, mode: session.mode, env, cartToken },
  });
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = subscription.current_period_start;
  const periodEnd = subscription.current_period_end;

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Mark user as subscriber
  await supabase.from("profiles").update({ is_subscriber: true }).eq("id", userId);

  // Audit
  await supabase.from("audit_log").insert({
    user_id: userId,
    action: "subscription_created",
    table_name: "subscriptions",
    record_id: subscription.id,
    new_data: { priceId, productId, status: subscription.status, env },
  });
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = subscription.current_period_start;
  const periodEnd = subscription.current_period_end;

  await supabase.from("subscriptions").update({
    status: subscription.status,
    product_id: productId,
    price_id: priceId,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subscription.id).eq("environment", env);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  // Update subscription status
  await supabase.from("subscriptions").update({
    status: "canceled",
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subscription.id).eq("environment", env);

  // Look up userId from our subscriptions table (metadata may be missing on deleted events)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  const userId = sub?.user_id || subscription.metadata?.userId;
  if (userId) {
    // Check if user has ANY other active subscription before marking as non-subscriber
    const { data: otherSubs } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("environment", env)
      .in("status", ["active", "trialing"])
      .neq("stripe_subscription_id", subscription.id)
      .limit(1);

    if (!otherSubs?.length) {
      await supabase.from("profiles").update({ is_subscriber: false }).eq("id", userId);
    }
  }
}

async function handlePaymentFailed(invoice: any, env: StripeEnv) {
  console.error("Payment failed:", invoice.id);

  // Look up userId from subscription in our DB (invoice.metadata is often empty)
  let userId = invoice.metadata?.userId || null;
  if (!userId && invoice.subscription) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", invoice.subscription)
      .single();
    userId = sub?.user_id || null;
  }

  await supabase.from("error_logs").insert({
    source: "stripe",
    error_type: "payment_failed",
    message: `Invoice ${invoice.id} payment failed. Amount: ${(invoice.amount_due || 0) / 100} ${invoice.currency}`,
    user_id: userId,
    metadata: { invoice_id: invoice.id, subscription: invoice.subscription, env, amount: invoice.amount_due },
  });

  // Notify user if we found them
  if (userId) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "payment_failed",
      title: "⚠️ Falha no pagamento",
      message: "Seu pagamento não foi processado. Atualize seu método de pagamento para manter sua assinatura ativa.",
      action_url: "/planos",
    });
  }
}
