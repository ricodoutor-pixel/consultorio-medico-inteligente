/**
 * 🏦 MANUS CEO - Process Payout (Blindagem Financeira)
 * Disparado quando paciente confirma recebimento do tratamento.
 * Fluxo: Libera Pix Médico → Libera Pix Lojista → Distribui Afiliados → Retém Taxas
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, getCorsHeaders } from "../_shared/cors.ts";

const AFFILIATE_RATES = [0.50, 0.05, 0.02]; // Nível 1: 50%, Nível 2: 5%, Nível 3: 2%
const WITHDRAWAL_FEE = 0.05; // 5% taxa de manutenção

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    const { escrowId } = await req.json();
    if (!escrowId) {
      return new Response(JSON.stringify({ error: "escrowId é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Buscar transação escrow
    const { data: escrow, error: escrowErr } = await supabase
      .from("escrow_transactions")
      .select("*")
      .eq("id", escrowId)
      .single();

    if (escrowErr || !escrow) {
      return new Response(JSON.stringify({ error: "Transação escrow não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar que é o paciente confirmando
    if (escrow.patient_id !== authData.user.id) {
      return new Response(JSON.stringify({ error: "Apenas o paciente pode confirmar o recebimento" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (escrow.status === "released") {
      return new Response(JSON.stringify({ error: "Pagamento já liberado", status: "already_released" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Claim release atomically (prevents double-payout race).
    //    Only one concurrent request can flip status held -> releasing.
    const { data: claimed, error: claimErr } = await supabase
      .from("escrow_transactions")
      .update({ status: "releasing", confirmed_at: new Date().toISOString() })
      .eq("id", escrowId)
      .in("status", ["held", "pending"])
      .select("id")
      .maybeSingle();

    if (claimErr || !claimed) {
      return new Response(JSON.stringify({ error: "Pagamento já processado ou indisponível", status: "already_processing" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Registrar confirmação de entrega (idempotent via unique constraint on escrow_id)
    const { error: confErr } = await supabase.from("delivery_confirmations").insert({
      escrow_id: escrowId,
      patient_id: authData.user.id,
      payout_triggered: true,
    });
    if (confErr && !String(confErr.message).match(/duplicate|unique/i)) {
      console.error("[process-payout] delivery_confirmations insert error:", confErr);
    }


    // 3. Calcular splits com bônus NPS
    const totalAmount = Number(escrow.amount);
    const platformFee = Number(escrow.platform_fee);
    let doctorPayout = Number(escrow.doctor_payout || 0);
    const vendorPayout = Number(escrow.vendor_payout || 0);

    // 3.1 Apply NPS bonus multiplier to doctor payout
    let npsBonus = 0;
    let npsMultiplier = 1.0;
    let npsScore: number | null = null;

    if (escrow.doctor_id && escrow.type === "consultation") {
      const { data: npsData } = await supabase
        .from("nps_professional")
        .select("nps_score")
        .eq("professional_id", escrow.doctor_id)
        .maybeSingle();

      if (npsData?.nps_score !== null && npsData?.nps_score !== undefined) {
        npsScore = npsData.nps_score;
        // NPS Multiplier tiers: Bronze (80-84: 1x), Prata (85-89: 1.2x), Ouro (90-94: 1.35x), Platina (95+: 1.5x)
        if (npsScore >= 95) npsMultiplier = 1.5;
        else if (npsScore >= 90) npsMultiplier = 1.35;
        else if (npsScore >= 85) npsMultiplier = 1.2;
        else if (npsScore >= 80) npsMultiplier = 1.0;
        else npsMultiplier = 1.0; // Below 80: no bonus

        if (npsMultiplier > 1.0) {
          npsBonus = Math.round((doctorPayout * (npsMultiplier - 1)) * 100) / 100;
          doctorPayout = Math.round((doctorPayout + npsBonus) * 100) / 100;
          console.log(`🏅 NPS Bonus applied: Score ${npsScore} → ${npsMultiplier}x → +R$${npsBonus}`);

          // Record gamification bonus
          await supabase.from("gamification_bonuses").insert({
            professional_id: escrow.doctor_id,
            bonus_type: "nps_multiplier",
            amount: Math.round(npsBonus * 100), // Store as cents
            reason: `NPS ${npsScore} → Multiplicador ${npsMultiplier}x sobre R$${(doctorPayout - npsBonus).toFixed(2)}`,
            status: "distributed",
            distributed_at: new Date().toISOString(),
          });
        }
      }
    }

    // 4. Marcar escrow como released (após cálculo do doctor_payout final)
    await supabase
      .from("escrow_transactions")
      .update({
        status: "released",
        released_at: new Date().toISOString(),
        doctor_payout: doctorPayout,
      })
      .eq("id", escrowId)
      .eq("status", "releasing");

    // 5. Distribuir comissões de afiliados
    const affiliateResults = await distributeAffiliateCommissions(
      supabase, escrow.patient_id, escrowId, totalAmount
    );

    // 6. Notificar médico
    if (escrow.doctor_id) {
      const { data: doctor } = await supabase
        .from("doctors")
        .select("user_id")
        .eq("id", escrow.doctor_id)
        .single();

      if (doctor?.user_id) {
        const bonusMsg = npsBonus > 0
          ? ` (inclui bônus NPS ${npsMultiplier}x: +R$ ${npsBonus.toFixed(2)})`
          : "";
        await supabase.from("notifications").insert({
          user_id: doctor.user_id,
          title: "💰 Pagamento liberado!",
          message: `Valor de R$ ${doctorPayout.toFixed(2)} liberado${bonusMsg}. O paciente confirmou o recebimento.`,
          type: "payment_confirmed",
          action_url: "/dashboard-medico",
        });
      }
    }

    // 7. Notificar paciente
    await supabase.from("notifications").insert({
      user_id: authData.user.id,
      title: "✅ Tratamento confirmado!",
      message: "Obrigado por confirmar o recebimento. Pagamentos foram liberados automaticamente.",
      type: "delivery_confirmed",
      action_url: "/dashboard",
    });

    // 8. Audit log
    await supabase.from("audit_log").insert({
      user_id: authData.user.id,
      action: "payout_released",
      table_name: "escrow_transactions",
      record_id: escrowId,
      new_data: {
        total: totalAmount,
        platform_fee: platformFee,
        doctor_payout: doctorPayout,
        vendor_payout: vendorPayout,
        affiliates: affiliateResults,
        released_at: new Date().toISOString(),
      },
    });

    console.log(`🏦 [Manus CEO] Payout processado: Escrow ${escrowId} | Total: R$${totalAmount} | Médico: R$${doctorPayout} | Plataforma: R$${platformFee}`);

    return new Response(JSON.stringify({
      success: true,
      payout: {
        total: totalAmount,
        platform_fee: platformFee,
        doctor_payout: doctorPayout,
        vendor_payout: vendorPayout,
        affiliates: affiliateResults,
      },
      message: "Pagamentos liberados com sucesso pelo Manus CEO",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("❌ [Manus CEO] Erro no payout:", e);
    return new Response(JSON.stringify({ error: "Erro interno no processamento" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function distributeAffiliateCommissions(
  supabase: any, patientId: string, escrowId: string, totalAmount: number
) {
  const results: any[] = [];

  // Buscar cadeia de referral do paciente
  const { data: referral } = await supabase
    .from("referral_links")
    .select("*")
    .eq("user_id", patientId)
    .single();

  if (!referral?.referred_by) return results;

  const referrers = [
    referral.level1_referrer || referral.referred_by,
    referral.level2_referrer,
    referral.level3_referrer,
  ];

  for (let level = 0; level < 3; level++) {
    const referrerId = referrers[level];
    if (!referrerId) continue;

    const rate = AFFILIATE_RATES[level];
    const commissionBase = totalAmount * 0.05; // 5% do total vai para afiliados
    const amount = Math.round(commissionBase * rate * 100) / 100;

    if (amount <= 0) continue;

    await supabase.from("affiliate_commissions").insert({
      referrer_id: referrerId,
      referred_id: patientId,
      level: level + 1,
      rate,
      amount,
      source_transaction_id: escrowId,
      status: "pending",
    });

    // Notificar afiliado
    await supabase.from("notifications").insert({
      user_id: referrerId,
      title: `🎉 Comissão Nível ${level + 1}!`,
      message: `Você recebeu R$ ${amount.toFixed(2)} de comissão por indicação.`,
      type: "commission",
      action_url: "/indicacoes",
    });

    results.push({ level: level + 1, referrer: referrerId, amount, rate });
    console.log(`💰 [Manus CEO] Comissão N${level + 1}: R$${amount} → ${referrerId}`);
  }

  return results;
}
