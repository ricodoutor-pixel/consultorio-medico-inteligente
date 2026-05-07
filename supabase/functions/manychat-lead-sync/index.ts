import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * 🔄 ManyChat Lead Sync — Sincronização Bidirecional
 * 
 * Dispara webhooks para ManyChat quando status de leads muda no Supabase.
 * Recebe webhooks do ManyChat para atualizar status localmente.
 * 
 * Triggers: payment_abandoned, triage_completed, appointment_booked, appointment_completed
 */

const MANYCHAT_API_URL = "https://api.manychat.com/fb";

interface LeadEvent {
  event_type: "payment_abandoned" | "triage_completed" | "appointment_booked" | "appointment_completed" | "prescription_ready" | "custom";
  user_id?: string;
  phone?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

async function sendToManyChat(apiKey: string, subscriberId: string, tagName: string, customFields?: Record<string, string>) {
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Add tag to subscriber
  const tagRes = await fetch(`${MANYCHAT_API_URL}/subscriber/addTagByName`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      subscriber_id: subscriberId,
      tag_name: tagName,
    }),
  });
  const tagData = await tagRes.json();

  // Set custom fields if provided
  if (customFields && Object.keys(customFields).length > 0) {
    const fields = Object.entries(customFields).map(([name, value]) => ({
      field_name: name,
      field_value: value,
    }));

    await fetch(`${MANYCHAT_API_URL}/subscriber/setCustomFields`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        subscriber_id: subscriberId,
        fields,
      }),
    });
  }

  return tagData;
}

async function findManyChatSubscriber(apiKey: string, phone: string) {
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Search by phone (Brazilian format: +55...)
  const cleanPhone = phone.replace(/\D/g, "");
  const res = await fetch(`${MANYCHAT_API_URL}/subscriber/findByCustomField`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      field_name: "phone",
      field_value: cleanPhone,
    }),
  });

  const data = await res.json();
  return data?.data?.[0]?.id || null;
}

const EVENT_TAG_MAP: Record<string, string> = {
  payment_abandoned: "💳 Parou no Pagamento",
  triage_completed: "🩺 Triagem Completa",
  appointment_booked: "📅 Consulta Agendada",
  appointment_completed: "✅ Consulta Realizada",
  prescription_ready: "💊 Receita Pronta",
};

const EVENT_FLOW_MAP: Record<string, string> = {
  payment_abandoned: "recovery_payment",
  triage_completed: "post_triage_followup",
  appointment_booked: "appointment_confirmation",
  appointment_completed: "post_consultation_nps",
  prescription_ready: "prescription_delivery",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders }

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;
);
  }

  try {
    const MANYCHAT_API_KEY = Deno.env.get("MANYCHAT_API_KEY");
    if (!MANYCHAT_API_KEY) {
      throw new Error("MANYCHAT_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body: LeadEvent = await req.json();
    const { event_type, user_id, phone, email, metadata } = body;

    if (!event_type) {
      return new Response(JSON.stringify({ error: "event_type is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve phone number from user_id if not provided
    let resolvedPhone = phone;
    if (!resolvedPhone && user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("id", user_id)
        .single();
      resolvedPhone = profile?.phone || null;
    }

    if (!resolvedPhone) {
      return new Response(JSON.stringify({ error: "No phone number found for user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find ManyChat subscriber
    const subscriberId = await findManyChatSubscriber(MANYCHAT_API_KEY, resolvedPhone);

    const tagName = EVENT_TAG_MAP[event_type] || `📌 ${event_type}`;
    const flowName = EVENT_FLOW_MAP[event_type] || null;

    let manychatResult = null;

    if (subscriberId) {
      // Tag subscriber and set custom fields
      manychatResult = await sendToManyChat(
        MANYCHAT_API_KEY,
        subscriberId,
        tagName,
        {
          ultimo_evento: event_type,
          data_evento: new Date().toISOString(),
          ...(metadata as Record<string, string> || {}),
        }
      );
    }

    // Log sync event in automation_flows
    await supabase.from("automation_flows").insert({
      name: `ManyChat Sync: ${event_type}`,
      category: "crm_sync",
      platform: "manychat",
      status: subscriberId ? "sent" : "subscriber_not_found",
      metadata: {
        event_type,
        user_id,
        phone: resolvedPhone,
        subscriber_id: subscriberId,
        tag: tagName,
        flow: flowName,
        manychat_response: manychatResult,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        synced: !!subscriberId,
        subscriber_id: subscriberId,
        tag_applied: tagName,
        flow_triggered: flowName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("ManyChat lead sync error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
