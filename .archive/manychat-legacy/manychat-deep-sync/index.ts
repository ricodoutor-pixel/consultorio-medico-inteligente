/**
 * manychat-deep-sync — Syncs patient status changes to ManyChat custom fields
 * 
 * Monitors: prescription expiry, appointment status, subscription changes
 * Updates ManyChat custom fields for automated WhatsApp flows
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

interface SyncAction {
  phone: string;
  field_name: string;
  field_value: string;
  tag?: string;
}

async function syncToManyChat(actions: SyncAction[]): Promise<number> {
  if (!MANYCHAT_API_KEY) return 0;
  let synced = 0;

  for (const action of actions) {
    try {
      const findResp = await fetch("https://api.manychat.com/fb/subscriber/findBySystemField", {
        method: "POST",
        headers: { "Authorization": `Bearer ${MANYCHAT_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ phone: action.phone }),
      });
      const findData = await findResp.json();
      const subscriberId = findData?.data?.[0]?.id;
      if (!subscriberId) continue;

      await fetch("https://api.manychat.com/fb/subscriber/setCustomField", {
        method: "POST",
        headers: { "Authorization": `Bearer ${MANYCHAT_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriber_id: subscriberId,
          field_name: action.field_name,
          field_value: action.field_value,
        }),
      });

      if (action.tag) {
        await fetch("https://api.manychat.com/fb/subscriber/addTag", {
          method: "POST",
          headers: { "Authorization": `Bearer ${MANYCHAT_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ subscriber_id: subscriberId, tag_name: action.tag }),
        });
      }

      synced++;
    } catch (err) {
      console.error(`[DEEP-SYNC] Error syncing ${action.field_name}:`, err);
    }
  }
  return synced;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;


  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "full_sync";

    const actions: SyncAction[] = [];

    // 1. Check expiring prescriptions (within 7 days)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiringRx } = await supabase
      .from("prescriptions")
      .select("patient_id, valid_until")
      .eq("status", "active")
      .lt("valid_until", sevenDaysFromNow)
      .gt("valid_until", new Date().toISOString());

    if (expiringRx?.length) {
      const patientIds = [...new Set(expiringRx.map(r => r.patient_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, phone")
        .in("id", patientIds);

      for (const profile of profiles || []) {
        if (profile.phone) {
          actions.push({
            phone: profile.phone,
            field_name: "status_paciente",
            field_value: "prescricao_vencendo",
            tag: "prescription_expiring",
          });
        }
      }
    }

    // 2. Check pending appointments (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();

    const { data: tomorrowAppts } = await supabase
      .from("appointments")
      .select("patient_id, scheduled_at")
      .eq("status", "scheduled")
      .gte("scheduled_at", tomorrowStart)
      .lte("scheduled_at", tomorrowEnd);

    if (tomorrowAppts?.length) {
      const patientIds = [...new Set(tomorrowAppts.map(a => a.patient_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, phone")
        .in("id", patientIds);

      for (const profile of profiles || []) {
        if (profile.phone) {
          actions.push({
            phone: profile.phone,
            field_name: "status_paciente",
            field_value: "consulta_amanha",
            tag: "appointment_reminder",
          });
        }
      }
    }

    // 3. Check subscription status
    const { data: expiringSubscriptions } = await supabase
      .from("health_subscriptions")
      .select("user_id, next_billing_at, status")
      .eq("status", "active")
      .lt("next_billing_at", sevenDaysFromNow)
      .gt("next_billing_at", new Date().toISOString());

    if (expiringSubscriptions?.length) {
      const userIds = expiringSubscriptions.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, phone")
        .in("id", userIds);

      for (const profile of profiles || []) {
        if (profile.phone) {
          actions.push({
            phone: profile.phone,
            field_name: "status_assinatura",
            field_value: "renovacao_proxima",
            tag: "subscription_renewal",
          });
        }
      }
    }

    const synced = await syncToManyChat(actions);

    return new Response(JSON.stringify({
      status: "ok",
      total_actions: actions.length,
      synced,
      details: {
        expiring_prescriptions: expiringRx?.length || 0,
        tomorrow_appointments: tomorrowAppts?.length || 0,
        expiring_subscriptions: expiringSubscriptions?.length || 0,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[DEEP-SYNC]", err);
    return new Response(JSON.stringify({ status: "error", message: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
