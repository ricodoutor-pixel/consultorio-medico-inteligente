import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Dynamic Pricing Engine — "Surge Pricing" estilo Uber
 * 
 * Fatores:
 * 1. Demanda atual (pacientes em fila / triagem)
 * 2. Oferta (médicos online)
 * 3. Horário (noturno/feriado = premium)
 * 4. Urgência do paciente
 * 5. Especialidade demandada
 */

interface PricingResult {
  base_price: number;
  surge_multiplier: number;
  final_price: number;
  discount_applied: number;
  factors: string[];
  tier: "economy" | "standard" | "premium" | "surge";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate caller — patient_id and subscriber status derived server-side
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const patient_id = claimsData.claims.sub as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { doctor_id, specialty, urgency } = await req.json();

    // Derive subscriber status server-side (never trust client)
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", patient_id)
      .in("status", ["active", "trialing"])
      .maybeSingle();
    const is_subscriber = !!subRow;

    // 1. Get doctor base price
    const { data: doctor } = await supabase
      .from("doctors")
      .select("consultation_price, specialty, rating")
      .eq("id", doctor_id)
      .single();

    const basePrice = doctor?.consultation_price || 150;

    // 2. Calculate demand/supply ratio
    const { count: activeTriages } = await supabase
      .from("brisa_triages")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress")
      .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()); // last 30 min

    const { count: onlineDoctors } = await supabase
      .from("doctors")
      .select("*", { count: "exact", head: true })
      .eq("is_online", true)
      .eq("is_verified", true);

    const demand = activeTriages || 0;
    const supply = onlineDoctors || 1;
    const demandRatio = demand / supply;

    // 3. Time-based factors
    const now = new Date();
    const hour = now.getHours();
    const isNighttime = hour >= 22 || hour < 7;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // 4. Calculate surge multiplier
    let surgeMultiplier = 1.0;
    const factors: string[] = [];

    // Demand surge (max 1.5x)
    if (demandRatio > 3) {
      surgeMultiplier += 0.5;
      factors.push("Alta demanda (+50%)");
    } else if (demandRatio > 2) {
      surgeMultiplier += 0.3;
      factors.push("Demanda elevada (+30%)");
    } else if (demandRatio > 1) {
      surgeMultiplier += 0.15;
      factors.push("Demanda moderada (+15%)");
    }

    // Time premium
    if (isNighttime) {
      surgeMultiplier += 0.25;
      factors.push("Horário noturno (+25%)");
    }
    if (isWeekend) {
      surgeMultiplier += 0.15;
      factors.push("Final de semana (+15%)");
    }

    // Urgency premium
    if (urgency === "urgente" || urgency === "alta") {
      surgeMultiplier += 0.2;
      factors.push("Urgência (+20%)");
    }

    // Specialty premium (rare specialties)
    const premiumSpecialties = ["neurologia", "psiquiatria", "oncologia"];
    if (specialty && premiumSpecialties.some(s => specialty.toLowerCase().includes(s))) {
      surgeMultiplier += 0.1;
      factors.push("Especialidade premium (+10%)");
    }

    // Cap surge at 2.0x
    surgeMultiplier = Math.min(surgeMultiplier, 2.0);

    // 5. Apply discounts
    let discount = 0;

    // Subscriber discount
    if (is_subscriber) {
      discount += 0.15;
      factors.push("Desconto Club Assinante (-15%)");
    }

    // Loyalty discount (5+ consultations)
    if (patient_id) {
      const { count: pastConsultations } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient_id)
        .eq("status", "completed");

      if ((pastConsultations || 0) >= 10) {
        discount += 0.10;
        factors.push("Paciente fiel (-10%)");
      } else if ((pastConsultations || 0) >= 5) {
        discount += 0.05;
        factors.push("Desconto fidelidade (-5%)");
      }
    }

    // Low demand discount (incentivize off-peak)
    if (demandRatio < 0.5 && !isNighttime) {
      discount += 0.10;
      factors.push("Horário econômico (-10%)");
    }

    // Calculate final price
    const surgedPrice = basePrice * surgeMultiplier;
    const discountAmount = surgedPrice * discount;
    const finalPrice = Math.round((surgedPrice - discountAmount) * 100) / 100;

    // Determine tier
    let tier: PricingResult["tier"];
    if (surgeMultiplier >= 1.5) tier = "surge";
    else if (surgeMultiplier >= 1.2) tier = "premium";
    else if (surgeMultiplier > 1.0) tier = "standard";
    else tier = "economy";

    const result: PricingResult = {
      base_price: basePrice,
      surge_multiplier: Math.round(surgeMultiplier * 100) / 100,
      final_price: finalPrice,
      discount_applied: Math.round(discount * 100),
      factors,
      tier,
    };

    return new Response(JSON.stringify({ success: true, pricing: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dynamic-pricing error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
