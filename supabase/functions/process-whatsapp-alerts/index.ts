/**
 * process-whatsapp-alerts — Processes appointment alerts queue and sends via Twilio
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
const TWILIO_PHONE = "+551199136-3154";

async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return false;
  
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${TWILIO_PHONE}`,
        To: `whatsapp:${to}`,
        Body: message,
      }),
    });
    return resp.ok;
  } catch (err) {
    console.error("[ALERT] Twilio error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch pending alerts that are due
    const { data: alerts, error } = await supabase
      .from("appointment_alerts")
      .select("id, patient_id, message, alert_type, priority")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("priority", { ascending: false })
      .limit(30);

    if (error) throw error;
    if (!alerts?.length) {
      return new Response(JSON.stringify({ status: "ok", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const alert of alerts) {
      // Get patient phone
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("id", alert.patient_id)
        .single();

      if (!profile?.phone) {
        await supabase.from("appointment_alerts").update({ status: "failed" }).eq("id", alert.id);
        continue;
      }

      const delivered = await sendWhatsApp(profile.phone, alert.message);

      // Update alert status
      await supabase.from("appointment_alerts")
        .update({ status: delivered ? "sent" : "failed", sent_at: new Date().toISOString() })
        .eq("id", alert.id);

      // Log to history
      await supabase.from("alert_history").insert({
        alert_id: alert.id,
        channel: "whatsapp",
        recipient: profile.phone,
        delivered,
        error_message: delivered ? null : "Twilio delivery failed",
      });

      if (delivered) sent++;
    }

    return new Response(JSON.stringify({ status: "ok", processed: alerts.length, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ALERTS]", err);
    return new Response(JSON.stringify({ status: "error", message: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
