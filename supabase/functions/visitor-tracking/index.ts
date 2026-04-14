import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisitorEvent {
  action: "page_view" | "cta_click" | "scroll_depth" | "time_on_page" | "exit_intent" | "form_start" | "form_submit" | "product_view" | "add_to_cart" | "checkout_start" | "video_play" | "ebook_download" | "whatsapp_click" | "schedule_click";
  page: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  visitor_id?: string; // anonymous fingerprint
  phone?: string; // if known (logged in user)
  user_id?: string;
  metadata?: Record<string, unknown>;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Score events for lead qualification
const eventScores: Record<string, number> = {
  page_view: 1,
  scroll_depth: 2,
  time_on_page: 2,
  video_play: 5,
  product_view: 8,
  ebook_download: 15,
  cta_click: 10,
  whatsapp_click: 20,
  schedule_click: 25,
  form_start: 10,
  form_submit: 30,
  add_to_cart: 20,
  checkout_start: 35,
  exit_intent: 0,
};

// Map events to funnel stages
const funnelMap: Record<string, string> = {
  page_view: "awareness",
  scroll_depth: "awareness",
  time_on_page: "awareness",
  video_play: "interest",
  product_view: "interest",
  ebook_download: "interest",
  cta_click: "consideration",
  whatsapp_click: "intent",
  schedule_click: "intent",
  form_start: "consideration",
  form_submit: "intent",
  add_to_cart: "intent",
  checkout_start: "decision",
  exit_intent: "awareness",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const payload = await req.json();
    const requestAction = payload.request_action || "track";

    const supabase = createClient(supabaseUrl, serviceKey);

    // ── TRACK EVENT ──
    if (requestAction === "track") {
      const event: VisitorEvent = payload;
      if (!event.action || !event.page) {
        return jsonResponse({ error: "action and page are required" }, 400);
      }

      const score = eventScores[event.action] || 1;
      const funnel = funnelMap[event.action] || "awareness";

      // Save to social_interactions for unified analytics
      await supabase.from("social_interactions").insert({
        platform: "website",
        interaction_type: event.action,
        post_url: event.page,
        subscriber_id: event.user_id || null,
        subscriber_phone: event.phone?.replace(/\D/g, "") || null,
        lead_score: score,
        funnel_stage: funnel,
        campaign_source: event.utm_source || event.referrer || "direct",
        ad_id: event.utm_campaign || null,
        engagement_data: {
          visitor_id: event.visitor_id,
          referrer: event.referrer,
          utm: {
            source: event.utm_source,
            medium: event.utm_medium,
            campaign: event.utm_campaign,
            content: event.utm_content,
          },
          metadata: event.metadata,
        },
        tags: [event.action, "website", event.utm_source].filter(Boolean) as string[],
      });

      // If phone is known, sync high-intent events to ManyChat
      if (event.phone && score >= 15) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/manychat-webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({
              action: "post_interaction",
              platform: "website",
              interaction_type: event.action,
              post_url: event.page,
              subscriber: { phone: event.phone },
              campaign_source: event.utm_source || "website",
            }),
          });
        } catch (e) {
          console.warn("[Visitor→MC] Sync error:", e);
        }
      }

      // Exit intent: trigger recovery if phone is known
      if (event.action === "exit_intent" && event.phone) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/manychat-webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({
              action: "followup",
              phone: event.phone,
              followup_type: "exit_intent",
            }),
          });
        } catch (e) {
          console.warn("[Visitor→MC] Exit intent error:", e);
        }
      }

      return jsonResponse({ success: true, score, funnel_stage: funnel });
    }

    // ── ANALYTICS SUMMARY ──
    if (requestAction === "analytics") {
      const { period = "day" } = payload;
      const since = new Date();
      if (period === "week") since.setDate(since.getDate() - 7);
      else if (period === "month") since.setMonth(since.getMonth() - 1);
      else since.setDate(since.getDate() - 1);

      const { data: events } = await supabase
        .from("social_interactions")
        .select("*")
        .eq("platform", "website")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      const items = events || [];
      const byAction: Record<string, number> = {};
      const byPage: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      const byFunnel: Record<string, number> = {};
      let totalScore = 0;

      for (const item of items) {
        const a = (item as any).interaction_type || "unknown";
        const p = (item as any).post_url || "unknown";
        const s = (item as any).campaign_source || "direct";
        const f = (item as any).funnel_stage || "unknown";
        byAction[a] = (byAction[a] || 0) + 1;
        byPage[p] = (byPage[p] || 0) + 1;
        bySource[s] = (bySource[s] || 0) + 1;
        byFunnel[f] = (byFunnel[f] || 0) + 1;
        totalScore += (item as any).lead_score || 0;
      }

      return jsonResponse({
        success: true,
        period,
        summary: {
          total_events: items.length,
          unique_visitors: new Set(
            items.map((i: any) => i.engagement_data?.visitor_id || i.subscriber_id).filter(Boolean)
          ).size,
          total_lead_score: totalScore,
          conversion_events: items.filter((i: any) =>
            ["form_submit", "checkout_start", "schedule_click"].includes((i as any).interaction_type)
          ).length,
        },
        breakdown: {
          by_action: byAction,
          by_page: byPage,
          by_source: bySource,
          by_funnel: byFunnel,
        },
      });
    }

    // ── VISITOR JOURNEY ──
    if (requestAction === "journey") {
      const { visitor_id, phone } = payload;
      if (!visitor_id && !phone) return jsonResponse({ error: "visitor_id or phone required" }, 400);

      let query = supabase
        .from("social_interactions")
        .select("*")
        .eq("platform", "website")
        .order("created_at", { ascending: true })
        .limit(100);

      if (phone) {
        query = query.eq("subscriber_phone", phone.replace(/\D/g, ""));
      }

      const { data: journey } = await query;

      return jsonResponse({
        success: true,
        journey: journey || [],
        total_events: (journey || []).length,
        total_score: (journey || []).reduce((s: number, e: any) => s + (e.lead_score || 0), 0),
      });
    }

    return jsonResponse({ error: `Unknown request_action: ${requestAction}` }, 400);
  } catch (error) {
    console.error("[Visitor Tracking Error]", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
