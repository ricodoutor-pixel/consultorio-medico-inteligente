import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, getCorsHeaders } from "../_shared/cors.ts";

const getFirstEnv = (...names: string[]) => {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) return value;
  }
  return null;
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    // === ADMIN REPLAY MODE (skip signature + idempotency for admin-triggered reprocess) ===
    let isAdminReplay = false;
    if (req.headers.get("x-admin-replay") === "1") {
      const authHeader = req.headers.get("Authorization") || "";
      const jwt = authHeader.replace(/^Bearer\s+/i, "");
      if (jwt) {
        const { data: { user } } = await supabase.auth.getUser(jwt);
        if (user) {
          const { data: roleRow } = await supabase
            .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
          if (roleRow) {
            isAdminReplay = true;
            console.log(`[admin-replay] Authorized for user ${user.id}, payment ${paymentId}`);
            // Remove existing webhook_events row(s) for this payment so reprocessing isn't blocked
            await supabase.from("webhook_events")
              .delete()
              .eq("gateway", "mercadopago")
              .eq("external_reference", String(paymentId));
          }
        }
      }
      if (!isAdminReplay) {
        return new Response(JSON.stringify({ error: "Admin replay not authorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Verify MercadoPago webhook signature (skipped on admin replay)
    const mpWebhookSecret = getFirstEnv("MERCADOPAGO_WEBHOOK_SECRET", "MERCADO_PAGO_WEBHOOK_SECRET");
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (!isAdminReplay) {

    if (!mpWebhookSecret) {
      console.error("MERCADOPAGO_WEBHOOK_SECRET not configured — refusing webhook");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!xSignature) {
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
      } else {
        return new Response(JSON.stringify({ error: "Malformed signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    } // end !isAdminReplay (signature check)

    // === IDEMPOTENCY GUARD ===
    // Use x-request-id when present (MP retries reuse it). Fallback: paymentId+action.
    const eventKey = xRequestId || `${paymentId}:${action || "unknown"}`;
    const { error: idempErr } = await supabase
      .from("webhook_events")
      .insert({
        gateway: "mercadopago",
        event_id: eventKey,
        event_type: action || null,
        external_reference: String(paymentId),
        payload: body,
      });
    if (idempErr) {
      // 23505 = unique_violation → evento já processado, retorna 200 silencioso
      if ((idempErr as any).code === "23505") {
        console.log(`[idempotency] Duplicate webhook ${eventKey} — skipping`);
        return new Response(JSON.stringify({ status: "duplicate", event_id: eventKey }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("[idempotency] Insert error (non-fatal):", idempErr);
    }

    // Fetch payment details from Mercado Pago API
    const mpAccessToken = getFirstEnv("MERCADO_PAGO_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN", "MERCADO_PAGO_API_KEY");
    if (!mpAccessToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not configured");
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
      external_reference: payment.external_reference,
    }));

    // Calculate split using Digital Franchise tiers
    const totalAmount = payment.transaction_amount || 0;
    const metadata = payment.metadata || {};
    const isMarketplace = metadata.type === "marketplace";

    // === SAÚDE VERDE — Subscription activation/renewal (handled inline, returns early) ===
    if (metadata.module === "saude_verde" && metadata.user_id) {
      if (payment.status === "approved") {
        const { data: existing } = await supabase
          .from("saude_verde_subscriptions")
          .select("id, expires_at, renewal_count, affiliate_referrer, plan_id, card_number, saude_verde_plans(period)")
          .eq("user_id", metadata.user_id)
          .eq("card_number", metadata.card_number)
          .maybeSingle();

        const planPeriod = (existing?.saude_verde_plans as { period?: string } | null)?.period || "mensal";
        const days = planPeriod === "anual" ? 365 : 30;
        const nowTs = Date.now();
        const baseTs = existing?.expires_at && new Date(existing.expires_at).getTime() > nowTs
          ? new Date(existing.expires_at).getTime()
          : nowTs;
        const newExpiresAt = new Date(baseTs + days * 24 * 60 * 60 * 1000).toISOString();
        const isRenewal = (existing?.renewal_count ?? 0) > 0 || (existing?.expires_at && new Date(existing.expires_at).getTime() > nowTs);

        const updatePayload: Record<string, unknown> = {
          status: "active",
          expires_at: newExpiresAt,
          renewal_count: (existing?.renewal_count ?? 0) + (isRenewal ? 1 : 0),
          last_payment_id: String(paymentId),
          expiry_reminded_at: null,
          updated_at: new Date().toISOString(),
        };
        if (!existing?.expires_at) updatePayload.started_at = new Date().toISOString();

        const { data: sub } = await supabase
          .from("saude_verde_subscriptions")
          .update(updatePayload)
          .eq("user_id", metadata.user_id)
          .eq("card_number", metadata.card_number)
          .select("id, card_number, plan_id, affiliate_referrer")
          .maybeSingle();

        // === AFFILIATE COMMISSION (R$ 5, first activation only) ===
        if (sub && !isRenewal && sub.affiliate_referrer) {
          try {
            const { error: commErr } = await supabase
              .from("saude_verde_referral_commissions")
              .insert({
                affiliate_user_id: sub.affiliate_referrer,
                referred_user_id: metadata.user_id,
                subscription_id: sub.id,
                payment_id: String(paymentId),
                amount_brl: 5.00,
                status: "paid",
              });
            if (!commErr) {
              await supabase.rpc("credit_affiliate_wallet", {
                _user_id: sub.affiliate_referrer,
                _amount: 5.00,
              });
              console.log(`💸 R$5 commission credited to affiliate ${sub.affiliate_referrer}`);
            }
          } catch (e) {
            console.error("[saude_verde] commission error:", e);
          }
        }

        // WhatsApp notification
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, whatsapp")
            .eq("id", metadata.user_id)
            .maybeSingle();

          const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
          const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
          const instance = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
          if (profile?.whatsapp && sub && evolutionUrl && evolutionKey) {
            const expFmt = new Date(newExpiresAt).toLocaleDateString("pt-BR");
            const title = isRenewal ? "RENOVADO" : "ATIVADO";
            await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: evolutionKey },
              body: JSON.stringify({
                number: profile.whatsapp,
                text: `🌿 *Cartão Saúde Verde ${title}!*\n\nOlá ${profile.full_name || ""}! Seu cartão *${sub.card_number}* está ativo.\n\n✅ Até 80% de desconto em consultas, exames e farmácias\n📅 Válido até *${expFmt}* (${days} dias)\n🔁 Renovação automática ativada\n\nAcesse: https://plantayraiz.com.br/saude-verde/cartao`,
              }),
            }).catch((err) => console.error("[saude_verde] WhatsApp dispatch:", err));
          }
        } catch (notifyErr) {
          console.error("[saude_verde] notify error:", notifyErr);
        }

        console.log(`🌿 Saúde Verde ${isRenewal ? "renewed" : "activated"} for user ${metadata.user_id}, expires ${newExpiresAt}`);
      }

      return new Response(
        JSON.stringify({ status: "processed", module: "saude_verde", payment_status: payment.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    const externalRef = payment.external_reference || "";
    // Aceita os dois formatos usados pelos checkouts: `cart-<id>` (create-cart-payment)
    // e `cart:<id>` (mp-checkout / carrinho de prescrição).
    const isCartPayment = externalRef.startsWith("cart-") || externalRef.startsWith("cart:");
    const isBrisaOrientacao = externalRef.startsWith("brisa-orientacao-");


    // === BRISA ORIENTAÇÃO TÉCNICA (R$30 via WhatsApp) — branch dedicado ===
    // Não existe appointment pré-criado; registramos pagamento, notificamos Dr. Edilson
    // e o paciente direto pelo WhatsApp. Escrow/NPS/payout virão quando o appointment
    // for criado após a consulta.
    if (isBrisaOrientacao) {
      const orientacaoPhone = String(metadata.phone || "").replace(/\D/g, "") || null;
      const orientacaoName = metadata.name || payment.payer?.first_name || null;
      const orientacaoEmail = payment.payer?.email || null;

      // Upsert idempotente
      const { error: upsertErr } = await supabase
        .from("brisa_orientacao_payments")
        .upsert({
          payment_id: String(payment.id),
          external_reference: externalRef,
          status: payment.status,
          amount: payment.transaction_amount || 0,
          patient_phone: orientacaoPhone,
          patient_name: orientacaoName,
          patient_email: orientacaoEmail,
          raw_payload: payment,
          updated_at: new Date().toISOString(),
        }, { onConflict: "payment_id" });
      if (upsertErr) console.error("[brisa-orientacao] upsert error:", upsertErr);

      if (payment.status === "approved") {
        const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
        const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
        const instance = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
        const adminPhone = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";
        const amount = (payment.transaction_amount || 30).toFixed(2);

        // 1) Notifica Dr. Edilson
        if (evolutionUrl && evolutionKey) {
          const drMsg =
            `🩺 *Parabéns, Doutor!*\n\n` +
            `Mais uma *Orientação Técnica* realizada e auditada com sucesso! ✅\n\n` +
            `💰 Valor: R$ ${amount} (confirmado)\n` +
            `👤 Paciente: ${orientacaoName || "—"}\n` +
            `📱 WhatsApp: ${orientacaoPhone ? `+${orientacaoPhone}` : "—"}\n` +
            `🆔 Ref: ${externalRef}\n\n` +
            `Inicie a consulta pelo WhatsApp do paciente. Após concluir, registre a orientação para liberar o repasse.`;
          await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: evolutionKey },
            body: JSON.stringify({ number: adminPhone, text: drMsg }),
          }).catch((err) => console.error("[brisa-orientacao] dr notify:", err));

          // 2) Confirma para o paciente
          if (orientacaoPhone) {
            const patientMsg =
              `✅ *Pagamento confirmado — Planta y Raiz*\n\n` +
              `Olá ${orientacaoName?.split(" ")[0] || ""}! Recebemos seu pagamento de *R$ ${amount}*.\n\n` +
              `🩺 O *Dr. Edilson Bezerra (CRM-CE 10963)* (CRM-PR 49354) entrará em contato em breve por aqui mesmo no WhatsApp para sua *Orientação Técnica em Cannabis Medicinal*.\n\n` +
              `Qualquer dúvida fale comigo, a Enfª Brisa, neste número.`;
            await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: evolutionKey },
              body: JSON.stringify({ number: orientacaoPhone, text: patientMsg }),
            }).catch((err) => console.error("[brisa-orientacao] patient notify:", err));
          }

          await supabase
            .from("brisa_orientacao_payments")
            .update({
              doctor_notified_at: new Date().toISOString(),
              patient_notified_at: orientacaoPhone ? new Date().toISOString() : null,
            })
            .eq("payment_id", String(payment.id));
        }

        // 3) Notifica admins no app
        const { data: adminRoles } = await supabase
          .from("user_roles").select("user_id").eq("role", "admin");
        if (adminRoles) {
          for (const admin of adminRoles) {
            await supabase.from("notifications").insert({
              user_id: admin.user_id,
              title: "💰 Orientação Técnica paga",
              message: `R$ ${amount} de ${orientacaoName || "paciente"} (${orientacaoPhone || "sem telefone"}). Dr. Edilson notificado.`,
              type: "payment_received",
              action_url: "/admin-master",
            });
          }
        }

        console.log(`✅ [brisa-orientacao] R$ ${amount} processado — paciente ${orientacaoPhone?.slice(0, 4)}*** notificado`);
      }

      return new Response(
        JSON.stringify({ status: "processed", module: "brisa_orientacao", payment_status: payment.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // === FERRAMENTAS DIAGNÓSTICAS (R$ 29,90) E COMBOS ===
    if (externalRef.startsWith("tool_") || externalRef.startsWith("tool-")) {
      const toolUserId = metadata.user_id || externalRef.split(":")[1] || null;
      if (payment.status === "approved" && toolUserId) {
        let toolId = externalRef.split(":")[0];
        if (toolId.startsWith("tool_")) toolId = toolId.replace("tool_", "");
        if (toolId.startsWith("tool-")) toolId = toolId.replace("tool-", "");
        
        let toolsToCredit = [toolId];
        if (toolId === "combo_tools") {
          toolsToCredit = ["cardiaco", "fundoscopia", "oximetria", "dermatoscopia", "mobilidade", "estetoscopio", "pulmonar", "tremor", "urine", "acuity", "gps"];
        }

        for (const tid of toolsToCredit) {
          const { error: pErr } = await supabase.from("purchased_tools").upsert({
            user_id: toolUserId,
            tool_id: tid,
            payment_id: String(payment.id),
          }, { onConflict: "user_id,tool_id" });
          if (pErr) console.error("[tool-purchase] Error crediting tool:", pErr);
        }

        await supabase.from("notifications").insert({
          user_id: toolUserId,
          title: `🎁 ${toolId === 'combo_tools' ? 'Combo de' : 'Nova'} Ferramenta Ativada`,
          message: `Pagamento aprovado. A ferramenta foi adicionada à sua conta!`,
          type: "tool_purchased",
          action_url: "/consultorio",
        });

        console.log(`✅ [tool-purchase] ${toolId} credited for ${toolUserId}`);
      }

      return new Response(
        JSON.stringify({ status: "processed", module: "tools", payment_status: payment.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === PLANOS UNIVERSAIS R$99/mês (paciente · médico · lojista) ===
    // external_reference: `plano_xxx:<user_id>:<ts>` (mp-checkout)
    const PLAN_SKUS = ["plano_paciente", "plano_medico", "plano_lojista"];
    const refSku = externalRef.split(":")[0];
    const planSku = PLAN_SKUS.includes(String(metadata.sku))
      ? String(metadata.sku)
      : PLAN_SKUS.includes(refSku)
        ? refSku
        : null;

    if (planSku) {
      const planUserId = metadata.user_id || externalRef.split(":")[1] || null;
      if (payment.status === "approved" && planUserId) {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const planName = planSku === "plano_medico"
          ? "Plano Médico"
          : planSku === "plano_lojista"
            ? "Plano Lojista"
            : "Plano Paciente";

        // Fonte de verdade para gating no app (useSubscription)
        const { error: subErr } = await supabase.from("subscriptions").upsert({
          user_id: planUserId,
          stripe_subscription_id: `mp_${payment.id}`,
          stripe_customer_id: `mp_${planUserId}`,
          product_id: planSku,
          price_id: planSku,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          environment: "live",
          updated_at: now.toISOString(),
        }, { onConflict: "stripe_subscription_id" });
        if (subErr) console.error("[plan] subscriptions upsert error:", subErr);

        // Controle de cobrança recorrente automática (cron plan-renewal-engine)
        const { data: existingHealth } = await supabase
          .from("health_subscriptions")
          .select("id")
          .eq("user_id", planUserId)
          .eq("plan_type", planSku)
          .maybeSingle();

        const healthPayload = {
          user_id: planUserId,
          plan_type: planSku,
          plan_name: planName,
          amount: totalAmount || 99,
          billing_cycle: "monthly",
          status: "active",
          payment_method: "mercadopago",
          external_subscription_id: String(payment.id),
          started_at: now.toISOString(),
          next_billing_at: periodEnd.toISOString(),
          expires_at: periodEnd.toISOString(),
          cancelled_at: null,
          updated_at: now.toISOString(),
        };
        if (existingHealth?.id) {
          await supabase.from("health_subscriptions").update(healthPayload).eq("id", existingHealth.id);
        } else {
          await supabase.from("health_subscriptions").insert(healthPayload);
        }

        // Comissão de indicação (afiliados) — 25% do 1º mês
        if (metadata.referrer_id) {
          try {
            await supabase.rpc("credit_affiliate_wallet", {
              _user_id: metadata.referrer_id,
              _amount: Math.round((totalAmount || 99) * 0.25 * 100) / 100,
            });
          } catch (e) {
            console.error("[plan] affiliate credit error:", e);
          }
        }

        await supabase.from("notifications").insert({
          user_id: planUserId,
          title: `✅ ${planName} ativado`,
          message: `Assinatura de R$ ${(totalAmount || 99).toFixed(2)}/mês confirmada. Renovação automática em ${periodEnd.toLocaleDateString("pt-BR")}.`,
          type: "subscription_active",
          action_url: "/dashboard",
        });

        console.log(`✅ [plan] ${planSku} ativado para ${planUserId} até ${periodEnd.toISOString()}`);
      }

      return new Response(
        JSON.stringify({ status: "processed", module: "universal_plan", plan: planSku, payment_status: payment.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Determine split rate — tabela oficial 2026:
    //   consultas/serviços médicos → 7% de taxa da plataforma (93% ao médico)
    //   Shopping / lojistas        → 5% de taxa da plataforma (95% ao lojista)
    const platformFeeRate = (isMarketplace || isCartPayment) ? 0.05 : 0.07;

    const platformFee = Math.round(totalAmount * platformFeeRate * 100) / 100;
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

    // Handle payment status — aceita `<uuid>` e `appointment:<uuid>` como referência da consulta
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const refTail = externalRef.startsWith("appointment:") ? externalRef.slice("appointment:".length) : externalRef;
    const candidateRef = refTail && uuidRe.test(refTail) ? refTail : null;
    const candidateMeta = metadata.appointment_id && uuidRe.test(metadata.appointment_id) ? metadata.appointment_id : null;
    const appointmentId = isCartPayment ? null : (candidateRef || candidateMeta);


    if (payment.status === "approved") {
      console.log(`✅ Payment ${paymentId} approved — R$ ${totalAmount} | Platform: R$ ${platformFee} | Payout: R$ ${doctorPayout}`);

      if (isCartPayment) {
        // === CART / MARKETPLACE PAYMENT ===
        // `cart-<user_id>-<ts>` (create-cart-payment) ou `cart:<cart_id>` (mp-checkout)
        const buyerId = metadata.buyer_id || metadata.user_id ||
          (externalRef.startsWith("cart-") ? externalRef.split("-")[1] : null);


        // Record escrow transaction for marketplace
        const { error: escrowErr } = await supabase.from("escrow_transactions").insert({
          patient_id: buyerId,
          amount: totalAmount,
          platform_fee: platformFee,
          vendor_payout: doctorPayout,
          type: "marketplace",
          status: "held",
        });
        if (escrowErr) console.error("Escrow insert error:", escrowErr);

        // Notify buyer
        if (buyerId) {
          await supabase.from("notifications").insert({
            user_id: buyerId,
            title: "Pagamento Confirmado ✅",
            message: `Seu pagamento de R$ ${totalAmount.toFixed(2)} foi confirmado! Seu pedido está sendo processado.`,
            type: "payment_confirmed",
            action_url: "/dashboard",
          });
        }

        // Process affiliate commissions for marketplace
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          await fetch(`${supabaseUrl}/functions/v1/process-affiliate-commissions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              buyer_id: buyerId,
              amount: platformFee, // Commission on platform fee
              transaction_id: externalRef,
              type: "marketplace",
            }),
          });
        } catch (affErr) {
          console.error("[Webhook] Affiliate commission error:", affErr);
        }
      } else if (appointmentId) {
        // === CONSULTATION PAYMENT ===
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
          // 2b. Auto-create medical record for the appointment
          const { error: mrErr } = await supabase.from("medical_records").insert({
            patient_id: appt.patient_id,
            doctor_id: appt.doctor_id,
            appointment_id: appointmentId,
          });
          if (mrErr) console.error("Medical record insert error:", mrErr);

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

          // 4b. Viral loop — WhatsApp pós-orientação com Planta-Coins + link de indicação
          try {
            const coinsEarned = Math.max(15, Math.floor(totalAmount / 2));
            // Credit coins atomically (best-effort)
            await supabase.rpc("increment_planta_coins", {
              _user_id: appt.patient_id,
              _coins: coinsEarned,
            });

            const { data: patientForViral } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("id", appt.patient_id)
              .single();

            const firstName = (patientForViral?.full_name || "").split(" ")[0] || "amigo(a)";
            const whatsappRaw = (patientForViral as any)?.phone as string | undefined;
            const phone = whatsappRaw ? whatsappRaw.replace(/\D/g, "") : null;

            if (phone && phone.length >= 10) {
              // Garante código curto único de indicação (6 chars) via SQL function
              let refCode: string | null = null;
              try {
                const { data: codeData } = await supabase.rpc("ensure_referral_code", { _user_id: appt.patient_id });
                refCode = (codeData as string) || null;
              } catch (codeErr) {
                console.error("[viral-loop] ensure_referral_code failed:", codeErr);
              }
              const refSlug = refCode || appt.patient_id;
              const refLink = `https://plantayraiz.com.br/?ref=${refSlug}`;
              const viralMsg =
                `Olá ${firstName}! 🌿\n\n` +
                `Parabéns, sua orientação foi concluída com sucesso!\n` +
                `Você ganhou *${coinsEarned} Planta-Coins* 🪙 que valem desconto no Shopping.\n\n` +
                `💚 *Indique um amigo e ganhe +20 coins extras* (ele ganha R$5 de desconto):\n` +
                `${refLink}\n\n` +
                `Compartilhe pelo WhatsApp e transforme outras vidas com cannabis medicinal!`;

              const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
              const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
              await fetch(`${supabaseUrl}/functions/v1/evolution-api-proxy`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ phone, message: viralMsg }),
              }).catch((err) => console.error("[viral-loop] evolution dispatch error:", err));

              console.log(`[viral-loop] sent to ${phone.slice(0, 4)}*** — ${coinsEarned} coins`);
            }
          } catch (viralErr) {
            console.error("[viral-loop] non-fatal:", viralErr);
          }

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

          // 6. Schedule NPS — create a pending notification for after consultation
          if (appt.scheduled_at) {
            const consultEnd = new Date(appt.scheduled_at);
            consultEnd.setMinutes(consultEnd.getMinutes() + 35);

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

          // 7. Credit Planta-Coins welcome bonus (50 coins)
          await supabase.from("notifications").insert({
            user_id: appt.patient_id,
            title: "🪙 +50 Planta-Coins!",
            message: "Bônus de boas-vindas creditado! Use seus coins para descontos e benefícios exclusivos.",
            type: "planta_coin_bonus",
            action_url: "/dashboard",
            metadata: { coins: 50, reason: "welcome_bonus" },
          });

          // 8. Process Affiliate Commissions (3-Level MLM)
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const affiliateResp = await fetch(
              `${supabaseUrl}/functions/v1/process-affiliate-commissions`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                  buyer_id: appt.patient_id,
                  amount: doctorPayout,
                  transaction_id: appointmentId,
                  type: "consultation",
                }),
              }
            );
            const affiliateResult = await affiliateResp.json();
            console.log(`[Webhook] Affiliate commissions:`, JSON.stringify(affiliateResult));
          } catch (affErr) {
            console.error("[Webhook] Affiliate commission error:", affErr);
          }
        }
      }

      // 9. Notify admins for ALL approved payments
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles) {
        for (const admin of adminRoles) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "💰 Pagamento Recebido",
            message: `R$ ${totalAmount.toFixed(2)} — Taxa plataforma: R$ ${platformFee.toFixed(2)} | ${isCartPayment ? "Marketplace" : "Consulta"}: R$ ${doctorPayout.toFixed(2)}`,
            type: "payment_received",
            action_url: "/admin-master",
          });
        }
      }
    } else if (payment.status === "rejected") {
      console.log(`❌ Payment ${paymentId} rejected`);
      if (appointmentId) {
        await supabase
          .from("appointments")
          .update({ payment_status: "rejected" })
          .eq("id", appointmentId);

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
