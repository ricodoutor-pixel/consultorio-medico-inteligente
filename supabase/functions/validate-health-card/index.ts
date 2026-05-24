// Edge: validate-health-card — endpoint público p/ clínicas validarem o QR dinâmico
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-partner-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { card_number, token, partner_name, partner_type, amount, discount_percent, service_description } =
      await req.json();

    if (!card_number || !token) {
      return new Response(JSON.stringify({ valid: false, reason: "missing_fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("validate_card_token", {
      _card_number: card_number,
      _token: token,
    });

    if (error) {
      console.error("validate_card_token error", error);
      return new Response(JSON.stringify({ valid: false, reason: "rpc_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.valid) {
      return new Response(JSON.stringify({ valid: false, reason: row?.reason || "invalid" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se a clínica enviou valor + desconto, registra resgate
    let redemption_id: string | null = null;
    if (partner_name && amount && discount_percent != null) {
      const original = Number(amount);
      const pct = Number(discount_percent);
      const discount = +(original * (pct / 100)).toFixed(2);
      const final_amount = +(original - discount).toFixed(2);

      // Buscar subscription_id
      const { data: sub } = await supabase
        .from("health_card_subscriptions")
        .select("id")
        .eq("card_number", card_number)
        .single();

      if (sub?.id) {
        const { data: r } = await supabase
          .from("health_card_redemptions")
          .insert({
            subscription_id: sub.id,
            user_id: row.user_id,
            partner_name,
            partner_type: partner_type || "other",
            service_description,
            original_amount: original,
            discount_percent: pct,
            discount_amount: discount,
            final_amount,
          })
          .select("id")
          .single();
        redemption_id = r?.id || null;
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        plan_type: row.plan_type,
        status: row.status,
        redemption_id,
        validated_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ valid: false, reason: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
