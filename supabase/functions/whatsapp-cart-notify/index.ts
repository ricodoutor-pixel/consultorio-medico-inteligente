/**
 * whatsapp-cart-notify — Dispara WhatsApp para paciente com link do carrinho
 * Também dispara notificação de sala Jitsi para consultas
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
    const TWILIO_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+5511991363154';

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      return new Response(JSON.stringify({ error: "Twilio not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, patient_phone, patient_name, cart_url, jitsi_url, cart_token } = await req.json();

    let messageBody = "";

    if (action === "cart_ready") {
      messageBody = `🌿 Olá ${patient_name || "paciente"}!\n\nSua prescrição personalizada da *Planta y Raiz* está pronta.\n\n🛒 Acesse seu carrinho exclusivo:\n${cart_url}\n\n⏰ Oferta válida por 24h.\n\nEquipe Planta y Raiz 💚`;
    } else if (action === "consultation_started") {
      messageBody = `🩺 Olá ${patient_name || "paciente"}!\n\nSua consulta começou! Entre na sala virtual agora:\n${jitsi_url}\n\n💚 Equipe Planta y Raiz`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!patient_phone) {
      return new Response(JSON.stringify({ error: "patient_phone required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format phone for WhatsApp
    const cleanPhone = patient_phone.replace(/\D/g, "");
    const whatsappTo = `whatsapp:+${cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone}`;

    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: whatsappTo,
        From: TWILIO_FROM,
        Body: messageBody,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", data);
      await supabase.from("error_logs").insert({
        source: "whatsapp-cart-notify",
        error_type: "twilio_send_failed",
        message: JSON.stringify(data),
        metadata: { action, patient_phone, cart_token },
      });
      return new Response(JSON.stringify({ error: "WhatsApp send failed", details: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit log
    await supabase.from("audit_log").insert({
      user_id: "system",
      action: `whatsapp_${action}`,
      table_name: "prescription_carts",
      record_id: cart_token || "N/A",
      new_data: { message_sid: data.sid, to: whatsappTo, action },
    });

    return new Response(JSON.stringify({ status: "ok", message_sid: data.sid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[WHATSAPP-CART-NOTIFY]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
