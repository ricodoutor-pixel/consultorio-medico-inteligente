/**
 * send-meta-capi — Meta Conversions API (Server-Side)
 *
 * Sends pixel events stored in social_interactions to Meta CAPI,
 * enabling Smart Bidding (value-based optimization) and AdBlocker immunity.
 *
 * Can be called:
 *  1. Via pg_net trigger on social_interactions INSERT
 *  2. Manually from the dashboard for batch sync
 *  3. Via cron for retry/catch-up
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { requireServiceAuth } from "../_shared/service-auth.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FB_ACCESS_TOKEN = Deno.env.get("FACEBOOK_GRAPH_API_TOKEN")!;
const FB_PIXEL_ID = Deno.env.get("FACEBOOK_PIXEL_ID") || Deno.env.get("VITE_FACEBOOK_PIXEL_ID") || "";

const GRAPH_API_VERSION = "v21.0";
const CAPI_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}/${FB_PIXEL_ID}/events`;

// Map our internal event names to Meta standard events
const EVENT_MAP: Record<string, string> = {
  Lead: "Lead",
  Schedule: "Schedule",
  Contact: "Contact",
  PageView: "PageView",
  Purchase: "Purchase",
  CompleteRegistration: "CompleteRegistration",
};

interface SocialInteraction {
  id: string;
  interaction_type: string;
  lead_score: number | null;
  engagement_data: Record<string, unknown> | null;
  subscriber_id: string | null;
  post_url: string | null;
  created_at: string;
}

function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-256", encoder.encode(value.trim().toLowerCase()))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""));
}

async function buildUserData(interaction: SocialInteraction) {
  const eng = (interaction.engagement_data || {}) as Record<string, unknown>;
  const eventProps = (eng.event_properties || {}) as Record<string, unknown>;

  const userData: Record<string, unknown> = {
    client_ip_address: (eng.client_ip as string) || null,
    client_user_agent: (eng.user_agent as string) || null,
    fbc: (eng.fbc as string) || null,
    fbp: (eng.fbp as string) || null,
  };

  // Hash PII if available
  const email = (eventProps.email as string) || (eng.email as string);
  if (email) userData.em = [await hashSHA256(email)];

  const phone = (eventProps.phone as string) || (eng.phone as string);
  if (phone) userData.ph = [await hashSHA256(phone)];

  if (interaction.subscriber_id) {
    userData.external_id = [await hashSHA256(interaction.subscriber_id)];
  }

  return userData;
}

async function sendToCAPI(events: SocialInteraction[]): Promise<{ sent: number; errors: string[] }> {
  if (!FB_ACCESS_TOKEN || !FB_PIXEL_ID) {
    return { sent: 0, errors: ["Missing FB_ACCESS_TOKEN or PIXEL_ID"] };
  }

  const capiEvents = await Promise.all(events.map(async (ev) => {
    const eventName = EVENT_MAP[ev.interaction_type] || ev.interaction_type;
    const userData = await buildUserData(ev);
    const eng = (ev.engagement_data || {}) as Record<string, unknown>;

    return {
      event_name: eventName,
      event_time: Math.floor(new Date(ev.created_at).getTime() / 1000),
      event_id: ev.id, // Deduplication key — matches client-side eventID
      event_source_url: (eng.page_url as string) || `https://plantayraiz.com.br${ev.post_url || "/"}`,
      action_source: "website",
      user_data: userData,
      custom_data: {
        value: ev.lead_score ?? 0,    // Smart Bidding: lead_score → value
        currency: "BRL",
        content_name: eventName,
        lead_score: ev.lead_score ?? 0,
      },
    };
  }));

  const resp = await fetch(CAPI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FB_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ data: capiEvents }),
  });

  const result = await resp.json();

  if (!resp.ok) {
    return { sent: 0, errors: [JSON.stringify(result.error || result)] };
  }

  return { sent: result.events_received ?? capiEvents.length, errors: [] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;


  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "sync";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "health") {
      // Quick health check for dashboard
      const { count } = await supabase
        .from("social_interactions")
        .select("*", { count: "exact", head: true })
        .eq("platform", "facebook_pixel")
        .gte("created_at", new Date(Date.now() - 3600_000).toISOString());

      return new Response(JSON.stringify({
        status: "ok",
        capi_configured: !!(FB_ACCESS_TOKEN && FB_PIXEL_ID),
        events_last_hour: count ?? 0,
        pixel_id: FB_PIXEL_ID ? `${FB_PIXEL_ID.slice(0, 4)}...` : "not_set",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "sync" || action === "trigger") {
      // Fetch unsent pixel events (no conversion_event = 'capi_sent' yet)
      const limit = body.limit || 50;

      const { data: events, error } = await supabase
        .from("social_interactions")
        .select("id, interaction_type, lead_score, engagement_data, subscriber_id, post_url, created_at")
        .eq("platform", "facebook_pixel")
        .is("conversion_event", null)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      if (!events || events.length === 0) {
        return new Response(JSON.stringify({ status: "ok", message: "No pending events", sent: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await sendToCAPI(events as SocialInteraction[]);

      // Mark events as sent
      if (result.sent > 0) {
        const ids = events.map(e => e.id);
        await supabase
          .from("social_interactions")
          .update({ conversion_event: "capi_sent", converted_at: new Date().toISOString() })
          .in("id", ids);
      }

      return new Response(JSON.stringify({
        status: result.errors.length ? "partial" : "ok",
        ...result,
        pending: events.length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-meta-capi]", err);
    return new Response(JSON.stringify({ status: "error", message: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
