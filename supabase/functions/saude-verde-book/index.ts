import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization");
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace("Bearer ", "") || "");
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { partnerId, specialtyId, date, time, beneficiaryName, appointmentType, notes } = await req.json();

    const { data: sub } = await supabase
      .from("saude_verde_subscriptions")
      .select("*, saude_verde_plans(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) {
      return new Response(JSON.stringify({ error: "Cartão Saúde Verde não encontrado. Assine um plano para agendar." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: partner } = await supabase
      .from("saude_verde_partners").select("*").eq("id", partnerId).single();
    if (!partner) {
      return new Response(JSON.stringify({ error: "Parceiro não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: specialty } = await supabase
      .from("saude_verde_specialties").select("*").eq("id", specialtyId).maybeSingle();

    const originalPrice = Number(specialty?.price_from_brl ?? 100);
    const planMax = Number((sub.saude_verde_plans as { discount_pct_max?: number })?.discount_pct_max ?? 80);
    const discountPct = Math.min(Number(partner.discount_pct_max ?? 80), planMax);
    const finalPrice = +(originalPrice * (1 - discountPct / 100)).toFixed(2);
    const savings = +(originalPrice - finalPrice).toFixed(2);

    const { data: appointment, error: apptError } = await supabase
      .from("saude_verde_appointments")
      .insert({
        subscription_id: sub.id,
        user_id: user.id,
        partner_id: partnerId,
        specialty_id: specialtyId,
        beneficiary_name: beneficiaryName || user.email,
        appointment_type: appointmentType || "consulta",
        scheduled_date: date,
        scheduled_time: time,
        status: "confirmed",
        original_price_brl: originalPrice,
        discount_pct: discountPct,
        final_price_brl: finalPrice,
        savings_brl: savings,
        payment_method: "cartao_verde",
        payment_status: "pending",
        notes,
      })
      .select()
      .single();

    if (apptError) throw apptError;

    await supabase
      .from("saude_verde_subscriptions")
      .update({
        total_appointments: (sub.total_appointments || 0) + 1,
        total_savings_brl: (Number(sub.total_savings_brl) || 0) + savings,
      })
      .eq("id", sub.id);

    // === GAMIFICAÇÃO: +10 Planta-Coins por agendamento via Cartão Verde ===
    const COINS_PER_BOOKING = 10;
    try {
      await supabase.rpc("increment_planta_coins", { _user_id: user.id, _coins: COINS_PER_BOOKING });
    } catch (coinErr) {
      console.error("[saude-verde-book] planta_coins error:", coinErr);
    }

    // Fire-and-forget WhatsApp notification
    const waUrl = Deno.env.get("EVOLUTION_API_URL");
    const waKey = Deno.env.get("EVOLUTION_API_KEY");
    const instance = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
    if (waUrl && waKey) {
      const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle();
      const phone = (profile as { phone?: string } | null)?.phone;
      if (phone) {
        fetch(`${waUrl}/message/sendText/${instance}`, {
          method: "POST",
          headers: { apikey: waKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            number: phone.replace(/\D/g, ""),
            text: `🌿 *Agendamento Confirmado — Cartão Saúde Verde*\n\n📅 ${date} às ${time}\n🏥 ${partner.name}\n🔬 ${specialty?.name || appointmentType}\n💰 De R$${originalPrice.toFixed(2)} por *R$${finalPrice.toFixed(2)}*\n✅ Economia de R$${savings.toFixed(2)} (${discountPct}% OFF)\n🌱 *+${COINS_PER_BOOKING} Planta-Coins* creditados!\n\nApresente seu *Cartão Verde Digital*: *${sub.card_number}*\n\nQualquer dúvida, fale comigo aqui! 💚`,
          }),
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({
      success: true,
      appointment_id: appointment.id,
      final_price: finalPrice,
      savings,
      discount_pct: discountPct,
      partner_name: partner.name,
      planta_coins_earned: COINS_PER_BOOKING,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("[saude-verde-book]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
