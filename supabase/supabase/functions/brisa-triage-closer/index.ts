/**
 * brisa-triage-closer — Detects triage abandonment and triggers ManyChat coupon
 * 
 * Called via pg_cron every 5 minutes to check for abandoned triages (>15min without booking)
 * Sends webhook to ManyChat to deliver "First Health" coupon via WhatsApp
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MANYCHAT_API_KEY = Deno.env.get("MANYCHAT_API_KEY") || "";

const ABANDONMENT_THRESHOLD_MINUTES = 15;

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "FIRSTHEALTH";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function sendManyChatCoupon(phone: string, name: string, couponCode: string): Promise<boolean> {
  if (!MANYCHAT_API_KEY || !phone) return false;

  try {
    // Find subscriber by phone
    const findResp = await fetch("https://api.manychat.com/fb/subscriber/findBySystemField", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MANYCHAT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const findData = await findResp.json();
    const subscriberId = findData?.data?.[0]?.id;

    if (!subscriberId) {
      console.log(`[CLOSER] Subscriber not found for phone: ${phone.slice(0, 4)}***`);
      return false;
    }

    // Set custom fields with coupon info
    await fetch("https://api.manychat.com/fb/subscriber/setCustomField", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MANYCHAT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        field_id: null, // Will use field_name
        field_name: "coupon_code",
        field_value: couponCode,
      }),
    });

    // Add tag to trigger automation
    await fetch("https://api.manychat.com/fb/subscriber/addTag", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MANYCHAT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        tag_name: "triage_abandoned_coupon",
      }),
    });

    console.log(`[CLOSER] Coupon ${couponCode} sent to ${name}`);
    return true;
  } catch (err) {
    console.error("[CLOSER] ManyChat error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "check";

    if (action === "track_start" || action === "track_conversion") {
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: u, error: ue } = await userClient.auth.getUser();
      if (ue || !u?.user) {
        return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const authedUserId = u.user.id;

      if (action === "track_start") {
        const { session_id, patient_phone, patient_name } = body;
        const { error } = await supabase.from("triage_abandonment_tracking").insert({
          session_id: session_id || crypto.randomUUID(),
          user_id: authedUserId,
          patient_phone: patient_phone || null,
          patient_name: patient_name || null,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ status: "ok", tracked: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { session_id } = body;
      await supabase.from("triage_abandonment_tracking")
        .update({ converted: true, converted_at: new Date().toISOString() })
        .eq("session_id", session_id)
        .eq("user_id", authedUserId);
      return new Response(JSON.stringify({ status: "ok", converted: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default cron action — service-role only
    const guard = requireServiceAuth(req, corsHeaders);
    if (guard) return guard;

    const thresholdTime = new Date(Date.now() - ABANDONMENT_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    const { data: abandoned, error } = await supabase
      .from("triage_abandonment_tracking")
      .select("*")
      .eq("coupon_sent", false)
      .eq("converted", false)
      .lt("triage_started_at", thresholdTime)
      .order("triage_started_at", { ascending: true })
      .limit(20);

    if (error) throw error;
    if (!abandoned || abandoned.length === 0) {
      return new Response(JSON.stringify({ status: "ok", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const record of abandoned) {
      const couponCode = generateCouponCode();
      const success = await sendManyChatCoupon(
        record.patient_phone || "",
        record.patient_name || "Paciente",
        couponCode,
      );

      if (success) {
        await supabase.from("triage_abandonment_tracking")
          .update({
            coupon_sent: true,
            coupon_code: couponCode,
            abandoned_at: new Date().toISOString(),
            manychat_notified: true,
          })
          .eq("id", record.id);
        sent++;
      } else {
        // Mark as abandoned even if ManyChat fails
        await supabase.from("triage_abandonment_tracking")
          .update({ abandoned_at: new Date().toISOString() })
          .eq("id", record.id);
      }
    }

    return new Response(JSON.stringify({ status: "ok", processed: abandoned.length, coupons_sent: sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[CLOSER]", err);
    return new Response(JSON.stringify({ status: "error", message: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
