import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

function calculateAbandonmentRisk(params: {
  daysSinceLastPurchase: number;
  daysSinceLastConsultation: number;
  npsScore: number;
  subscriptionAgeMonths: number;
  totalConsultations: number;
}): number {
  const { daysSinceLastPurchase, npsScore, subscriptionAgeMonths, totalConsultations } = params;
  const inactivityScore = Math.min(daysSinceLastPurchase / 60, 1) * 0.4;
  const npsRisk = ((10 - (npsScore || 5)) / 10) * 0.3;
  const avgConsultPerMonth = totalConsultations / Math.max(subscriptionAgeMonths, 1);
  const frequencyRisk = Math.max(0, (1 - Math.min(avgConsultPerMonth / 2, 1))) * 0.2;
  const newSubRisk = (1 - Math.min(subscriptionAgeMonths / 6, 1)) * 0.1;
  return Math.min(inactivityScore + npsRisk + frequencyRisk + newSubRisk, 1);
}

function classifyRisk(score: number): string {
  if (score >= 0.8) return "critical";
  if (score >= 0.6) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

function generateCouponCode(): string {
  return `VOLTA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  try {
    const body = await req.json();
    const { patientId, daysSinceLastPurchase = 30, daysSinceLastConsultation = 30, npsScore = 5, subscriptionAgeMonths = 3, totalConsultations = 5 } = body;

    if (!patientId) {
      return new Response(JSON.stringify({ error: "patientId obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const riskScore = calculateAbandonmentRisk({ daysSinceLastPurchase, daysSinceLastConsultation, npsScore, subscriptionAgeMonths, totalConsultations });
    const riskLevel = classifyRisk(riskScore);
    
    let couponCode: string | null = null;
    let discountPercent = 0;
    if (riskLevel === "critical" || riskLevel === "high") {
      couponCode = generateCouponCode();
      discountPercent = riskLevel === "critical" ? 20 : 10;
    }

    return new Response(JSON.stringify({
      patientId,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      couponCode,
      discountPercent,
      action: riskLevel === "critical" ? "phone_call" : riskLevel === "high" ? "discount_coupon" : riskLevel === "medium" ? "email_reminder" : "none",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[retention-webhook] error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
