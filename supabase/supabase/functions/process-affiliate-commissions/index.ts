import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Process Affiliate Commissions (3-Level MLM)
 * Called by mercadopago-webhook after payment confirmation
 * 
 * Rates: Level 1 = 25%, Level 2 = 15%, Level 3 = 10%
 */

const COMMISSION_RATES = [0.25, 0.15, 0.10]; // Nível 1, 2, 3

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { buyer_id, amount, transaction_id, type = "consultation" } = body;

    if (!buyer_id || !amount) {
      return new Response(JSON.stringify({ error: "buyer_id and amount required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Affiliate] Processing commissions for buyer ${buyer_id}, amount R$ ${amount}`);

    // 1. Find the buyer's referral link to get their upline chain
    const { data: buyerRef } = await supabase
      .from("referral_links")
      .select("referred_by, level1_referrer, level2_referrer, level3_referrer")
      .eq("user_id", buyer_id)
      .single();

    if (!buyerRef || !buyerRef.referred_by) {
      console.log(`[Affiliate] Buyer ${buyer_id} has no referrer — skipping commissions`);
      return new Response(JSON.stringify({ status: "no_referrer", commissions: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the 3-level upline chain
    const upline: string[] = [];
    if (buyerRef.level1_referrer) upline.push(buyerRef.level1_referrer);
    if (buyerRef.level2_referrer) upline.push(buyerRef.level2_referrer);
    if (buyerRef.level3_referrer) upline.push(buyerRef.level3_referrer);

    // If chain not populated, walk it manually
    if (upline.length === 0 && buyerRef.referred_by) {
      upline.push(buyerRef.referred_by);
      
      // Find level 2
      const { data: l2 } = await supabase
        .from("referral_links")
        .select("referred_by")
        .eq("user_id", buyerRef.referred_by)
        .single();
      
      if (l2?.referred_by) {
        upline.push(l2.referred_by);
        
        // Find level 3
        const { data: l3 } = await supabase
          .from("referral_links")
          .select("referred_by")
          .eq("user_id", l2.referred_by)
          .single();
        
        if (l3?.referred_by) {
          upline.push(l3.referred_by);
        }
      }
    }

    const netAmount = amount; // Already net after platform fee
    const commissions: Array<{ referrer_id: string; level: number; amount: number }> = [];

    for (let i = 0; i < upline.length && i < COMMISSION_RATES.length; i++) {
      const referrerId = upline[i];
      const rate = COMMISSION_RATES[i];
      const commissionAmount = Math.round(netAmount * rate * 100) / 100;
      const level = i + 1;

      if (commissionAmount <= 0) continue;

      // Insert commission record
      const { error: commErr } = await supabase.from("affiliate_commissions").insert({
        referrer_id: referrerId,
        referred_id: buyer_id,
        source_transaction_id: transaction_id || null,
        level,
        rate,
        amount: commissionAmount,
        status: "available",
      });

      if (commErr) {
        console.error(`[Affiliate] Commission insert error level ${level}:`, commErr);
        continue;
      }

      // Credit wallet using SECURITY DEFINER function
      const { error: walletErr } = await supabase.rpc("credit_affiliate_wallet", {
        _user_id: referrerId,
        _amount: commissionAmount,
      });

      if (walletErr) {
        console.error(`[Affiliate] Wallet credit error level ${level}:`, walletErr);
      }

      // Update referral_links total_earnings
      try {
        const { error: rpcErr } = await supabase.rpc("increment_referral_earnings", {
          _user_id: referrerId,
          _amount: commissionAmount,
        });
        if (rpcErr) throw rpcErr;
      } catch (_e) {
        // RPC may not exist yet, fallback to direct update
        await supabase
          .from("referral_links")
          .update({ total_earnings: commissionAmount })
          .eq("user_id", referrerId);
      }

      // Notify affiliate
      await supabase.from("notifications").insert({
        user_id: referrerId,
        title: `💰 Comissão Nível ${level} Recebida!`,
        message: `Você ganhou R$ ${commissionAmount.toFixed(2)} de uma indicação de Nível ${level}!`,
        type: "affiliate_commission",
        action_url: "/afiliados",
        metadata: {
          level,
          amount: commissionAmount,
          referred_id: buyer_id,
          source_transaction_id: transaction_id,
        },
      });

      commissions.push({ referrer_id: referrerId, level, amount: commissionAmount });
      console.log(`[Affiliate] ✅ Level ${level}: R$ ${commissionAmount.toFixed(2)} → ${referrerId}`);
    }

    // Update the referrer's total_referrals count
    if (upline.length > 0) {
      const { data: refLink } = await supabase
        .from("referral_links")
        .select("total_referrals")
        .eq("user_id", upline[0])
        .single();

      if (refLink) {
        await supabase
          .from("referral_links")
          .update({ total_referrals: (refLink.total_referrals || 0) + 1 })
          .eq("user_id", upline[0]);
      }
    }

    const totalDistributed = commissions.reduce((s, c) => s + c.amount, 0);
    console.log(`[Affiliate] Total distributed: R$ ${totalDistributed.toFixed(2)} across ${commissions.length} levels`);

    return new Response(JSON.stringify({
      status: "processed",
      commissions,
      total_distributed: totalDistributed,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Affiliate] Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
