/**
 * pharmacy-cart-recovery
 *
 * Para cada `prescription_carts` com status = 'pending' há mais de 2h:
 *  - Cria um evento em `conversion_leads` (event_type = 'pharmacy_cart_pending_2h')
 *  - Dispara cupom de FRETE GRÁTIS via WhatsApp Brisa
 *
 * Idempotência: usa `reference_id` = cart.id; só insere lead se não existir.
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE");

async function sendBrisa(phone: string, msg: string) {
  if (!EVO_URL || !EVO_KEY || !EVO_INSTANCE || !phone) return false;
  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
      body: JSON.stringify({ number: phone.replace(/\D/g, ""), text: msg }),
    });
    return res.ok;
  } catch { return false; }
}

import { requireServiceAuth } from "../_shared/service-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const cutoff = new Date(Date.now() - 2 * 3600_000).toISOString();

    const { data: carts } = await supabase
      .from("prescription_carts")
      .select("id, patient_id, total_amount, created_at, status")
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .limit(100);

    let created = 0;
    for (const cart of carts || []) {
      // Idempotência: já registrado?
      const { data: existing } = await supabase
        .from("conversion_leads")
        .select("id")
        .eq("reference_id", cart.id)
        .eq("event_type", "pharmacy_cart_pending_2h")
        .maybeSingle();
      if (existing) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", cart.patient_id)
        .maybeSingle();

      const couponCode = `FRETEFREE-${cart.id.slice(0, 6).toUpperCase()}`;

      await supabase.from("conversion_leads").insert({
        user_id: cart.patient_id,
        source: "pharmacy_checkout",
        event_type: "pharmacy_cart_pending_2h",
        reference_id: cart.id,
        payload: {
          total_amount: cart.total_amount,
          coupon: couponCode,
          patient_name: profile?.full_name ?? null,
          patient_phone: profile?.phone ?? null,
        },
        status: "dispatched",
        processed_at: new Date().toISOString(),
      });

      if (profile?.phone) {
        await sendBrisa(
          profile.phone,
          `Oi ${profile.full_name?.split(" ")[0] ?? ""}! Sou a Enfª Brisa 🌿\n\nVi que seu pedido na farmácia ficou pendente. Liberei agora um cupom de FRETE GRÁTIS pra você: *${couponCode}*\n\nFinaliza aí em 1 clique 👉 ${"https://plantayraiz.com.br/checkout-pharmacy"}`,
        );
      }
      created++;
    }

    return new Response(JSON.stringify({ ok: true, leads_created: created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[pharmacy-cart-recovery]", err);
    return new Response(JSON.stringify({ ok: false, error: "Erro interno. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
