import { createClient } from "npm:@supabase/supabase-js@2";

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

      // Runtime allowlist for action (prevents arbitrary interaction_type pollution)
      const ALLOWED_ACTIONS = new Set([
        "page_view","cta_click","scroll_depth","time_on_page","exit_intent",
        "form_start","form_submit","product_view","add_to_cart","checkout_start",
        "video_play","ebook_download","whatsapp_click","schedule_click",
      ]);
      if (!ALLOWED_ACTIONS.has(event.action)) {
        return jsonResponse({ error: "Invalid action" }, 400);
      }

      // Length limits to prevent storage flooding
      if (typeof event.page !== "string" || event.page.length > 500) {
        return jsonResponse({ error: "page must be a string ≤500 chars" }, 400);
      }
      const tooLong = (v: unknown, max: number) =>
        typeof v === "string" && v.length > max;
      if (
        tooLong(event.referrer, 500) ||
        tooLong(event.utm_source, 100) ||
        tooLong(event.utm_medium, 100) ||
        tooLong(event.utm_campaign, 200) ||
        tooLong(event.utm_content, 200) ||
        tooLong(event.visitor_id, 128) ||
        tooLong(event.phone, 32) ||
        tooLong(event.user_id, 64)
      ) {
        return jsonResponse({ error: "Field length exceeded" }, 400);
      }
      if (event.metadata && JSON.stringify(event.metadata).length > 4000) {
        return jsonResponse({ error: "metadata too large" }, 400);
      }

      // Per-IP rate limit (best-effort; ignore failures)
      const ip =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";
      try {
        const { data: allowed, error: rlErr } = await supabase.rpc("check_edge_rate_limit", {
          p_bucket: "visitor-tracking",
          p_key: ip,
          p_max_hits: 120,
          p_window_seconds: 60,
        });
        if (rlErr) {
          console.error("[visitor-tracking] rate-limit RPC error:", rlErr);
          return jsonResponse({ error: "Rate limit unavailable" }, 503);
        }
        if (allowed === false) {
          return jsonResponse({ error: "Rate limit exceeded" }, 429);
        }
      } catch (e) {
        console.error("[visitor-tracking] rate-limit exception:", e);
        return jsonResponse({ error: "Rate limit unavailable" }, 503);
      }

      // Verify caller before trusting phone/user_id (prevents WhatsApp spam to arbitrary numbers).
      const authHeader = req.headers.get("Authorization") || "";
      let callerIsService = authHeader === `Bearer ${serviceKey}`;
      let callerUserId: string | undefined;
      let callerPhone: string | undefined;
      if (!callerIsService && authHeader.startsWith("Bearer ")) {
        try {
          const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
            global: { headers: { Authorization: authHeader } },
          });
          const token = authHeader.replace("Bearer ", "");
          const { data, error } = await anon.auth.getClaims(token);
          if (!error && data?.claims?.sub) {
            callerUserId = data.claims.sub as string;
            const { data: profile } = await supabase
              .from("profiles").select("phone").eq("id", callerUserId).maybeSingle();
            callerPhone = (profile as any)?.phone
              ? String((profile as any).phone).replace(/\D/g, "")
              : undefined;
          }
        } catch { /* anonymous */ }
      }

      const suppliedPhone = event.phone ? String(event.phone).replace(/\D/g, "") : "";
      let trustedPhone: string | null = null;
      if (callerIsService) trustedPhone = suppliedPhone || null;
      else if (callerPhone && suppliedPhone && suppliedPhone === callerPhone) trustedPhone = suppliedPhone;

      const trustedUserId: string | null = callerIsService
        ? (event.user_id || null)
        : (callerUserId || null);

      const score = eventScores[event.action] || 1;
      const funnel = funnelMap[event.action] || "awareness";

      await supabase.from("social_interactions").insert({
        platform: "website",
        interaction_type: event.action,
        post_url: event.page,
        subscriber_id: trustedUserId,
        subscriber_phone: trustedPhone,
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

      // ManyChat side-effects ONLY when phone is verifiably owned by caller (or service-role).
      if (trustedPhone && score >= 15) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/manychat-webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({
              action: "post_interaction",
              platform: "website",
              interaction_type: event.action,
              post_url: event.page,
              subscriber: { phone: trustedPhone },
              campaign_source: event.utm_source || "website",
            }),
          });
        } catch (e) {
          console.warn("[Visitor→MC] Sync error:", e);
        }
      }

      if (event.action === "exit_intent" && trustedPhone) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/manychat-webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({
              action: "followup",
              phone: trustedPhone,
              followup_type: "exit_intent",
            }),
          });
        } catch (e) {
          console.warn("[Visitor→MC] Exit intent error:", e);
        }
      }

      return jsonResponse({ success: true, score, funnel_stage: funnel });
    }

    // Helper: validate caller is service-role OR an authenticated user (returns claims)
    async function getAuthContext(): Promise<{ ok: boolean; isService: boolean; userId?: string; userPhone?: string }> {
      const authHeader = req.headers.get("Authorization") || "";
      if (authHeader === `Bearer ${serviceKey}`) return { ok: true, isService: true };
      if (!authHeader.startsWith("Bearer ")) return { ok: false, isService: false };
      try {
        const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const token = authHeader.replace("Bearer ", "");
        const { data, error } = await anon.auth.getClaims(token);
        if (error || !data?.claims?.sub) return { ok: false, isService: false };
        const { data: profile } = await supabase
          .from("profiles").select("phone").eq("id", data.claims.sub).maybeSingle();
        return { ok: true, isService: false, userId: data.claims.sub, userPhone: (profile as any)?.phone };
      } catch {
        return { ok: false, isService: false };
      }
    }

    // ── ANALYTICS SUMMARY ── (admin/service-role only)
    if (requestAction === "analytics") {
      const ctx = await getAuthContext();
      if (!ctx.ok) return jsonResponse({ error: "Unauthorized" }, 401);
      if (!ctx.isService) {
        const { data: isAdmin } = await supabase.rpc("has_role", {
          _user_id: ctx.userId, _role: "admin",
        });
        if (!isAdmin) return jsonResponse({ error: "Forbidden" }, 403);
      }
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

    // ── VISITOR JOURNEY ── (auth required; non-admins can only query their own phone)
    if (requestAction === "journey") {
      const ctx = await getAuthContext();
      if (!ctx.ok) return jsonResponse({ error: "Unauthorized" }, 401);

      const { visitor_id, phone } = payload;
      if (!visitor_id && !phone) return jsonResponse({ error: "visitor_id or phone required" }, 400);

      let isAdmin = ctx.isService;
      if (!isAdmin && ctx.userId) {
        const { data } = await supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
        isAdmin = !!data;
      }

      const requestedPhone = phone ? String(phone).replace(/\D/g, "") : null;
      const ownPhone = ctx.userPhone ? String(ctx.userPhone).replace(/\D/g, "") : null;

      // Non-admin callers may ONLY query their own phone
      if (!isAdmin) {
        if (!requestedPhone || !ownPhone || requestedPhone !== ownPhone) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
      }

      let query = supabase
        .from("social_interactions")
        .select("*")
        .eq("platform", "website")
        .order("created_at", { ascending: true })
        .limit(100);

      if (requestedPhone) {
        query = query.eq("subscriber_phone", requestedPhone);
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
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
