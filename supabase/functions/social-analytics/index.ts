import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API = "https://graph.facebook.com/v19.0";

interface AnalyticsRequest {
  action: "page_insights" | "ig_insights" | "post_metrics" | "audience" | "full_report";
  period?: "day" | "week" | "month";
  post_id?: string;
  platform?: "facebook" | "instagram" | "all";
}

async function graphGet(endpoint: string, token: string) {
  // Pass token via Authorization header to avoid leaking into Meta access logs.
  const res = await fetch(`${GRAPH_API}/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function getFacebookPageInsights(pageId: string, token: string, period = "day") {
  const metrics = [
    "page_impressions", "page_impressions_unique", "page_engaged_users",
    "page_fans", "page_views_total", "page_post_engagements",
    "page_fan_adds", "page_fan_removes", "page_actions_post_reactions_total",
  ].join(",");
  return graphGet(`${pageId}/insights?metric=${metrics}&period=${period}`, token);
}

async function getFacebookPosts(pageId: string, token: string, limit = 25) {
  return graphGet(
    `${pageId}/posts?fields=id,message,created_time,shares,likes.summary(true),comments.summary(true),insights.metric(post_impressions,post_engaged_users,post_clicks)&limit=${limit}`,
    token
  );
}

async function getInstagramInsights(igId: string, token: string, period = "day") {
  const metrics = ["impressions", "reach", "profile_views", "website_clicks", "follower_count"].join(",");
  return graphGet(`${igId}/insights?metric=${metrics}&period=${period}`, token);
}

async function getInstagramMedia(igId: string, token: string, limit = 25) {
  return graphGet(
    `${igId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement,saved)&limit=${limit}`,
    token
  );
}

async function getAudienceDemographics(pageId: string, token: string) {
  const metrics = ["page_fans_city", "page_fans_country", "page_fans_gender_age", "page_fans_locale"].join(",");
  return graphGet(`${pageId}/insights?metric=${metrics}&period=lifetime`, token);
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;


  const pageId = Deno.env.get("FACEBOOK_PAGE_ID");
  const igId = Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID");
  const fbToken = Deno.env.get("FACEBOOK_GRAPH_API_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!fbToken) {
    return jsonResponse({ error: "Facebook token not configured" }, 500);
  }

  try {
    const body: AnalyticsRequest = await req.json();
    const { action, period = "day", platform = "all" } = body;

    const supabase = createClient(supabaseUrl, serviceKey);

    switch (action) {
      case "page_insights": {
        if (!pageId) return jsonResponse({ error: "Facebook Page ID not configured" }, 500);
        const insights = await getFacebookPageInsights(pageId, fbToken, period);
        return jsonResponse({ success: true, platform: "facebook", insights: insights.data || [] });
      }

      case "ig_insights": {
        if (!igId) return jsonResponse({ error: "Instagram Business Account ID not configured" }, 500);
        const insights = await getInstagramInsights(igId, fbToken, period);
        return jsonResponse({ success: true, platform: "instagram", insights: insights.data || [] });
      }

      case "post_metrics": {
        const results: Record<string, unknown> = {};

        if ((platform === "all" || platform === "facebook") && pageId) {
          results.facebook = await getFacebookPosts(pageId, fbToken);
        }
        if ((platform === "all" || platform === "instagram") && igId) {
          results.instagram = await getInstagramMedia(igId, fbToken);
        }

        return jsonResponse({ success: true, posts: results });
      }

      case "audience": {
        if (!pageId) return jsonResponse({ error: "Facebook Page ID not configured" }, 500);
        const demographics = await getAudienceDemographics(pageId, fbToken);
        return jsonResponse({ success: true, audience: demographics.data || [] });
      }

      case "full_report": {
        const report: Record<string, unknown> = { period, generated_at: new Date().toISOString() };

        // Facebook insights
        if (pageId) {
          const [fbInsights, fbPosts] = await Promise.all([
            getFacebookPageInsights(pageId, fbToken, period),
            getFacebookPosts(pageId, fbToken, 10),
          ]);
          report.facebook = {
            insights: fbInsights.data || [],
            recent_posts: fbPosts.data || [],
          };
        }

        // Instagram insights
        if (igId) {
          const [igInsights, igMedia] = await Promise.all([
            getInstagramInsights(igId, fbToken, period),
            getInstagramMedia(igId, fbToken, 10),
          ]);
          report.instagram = {
            insights: igInsights.data || [],
            recent_media: igMedia.data || [],
          };
        }

        // Internal engagement data from social_interactions table
        const since = new Date();
        if (period === "week") since.setDate(since.getDate() - 7);
        else if (period === "month") since.setMonth(since.getMonth() - 1);
        else since.setDate(since.getDate() - 1);

        const { data: interactions } = await supabase
          .from("social_interactions")
          .select("*")
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false })
          .limit(500);

        const items = interactions || [];
        const byPlatform: Record<string, number> = {};
        const byType: Record<string, number> = {};
        const byFunnel: Record<string, number> = {};
        let totalScore = 0;

        for (const i of items) {
          const p = (i as any).platform || "unknown";
          const t = (i as any).interaction_type || "unknown";
          const f = (i as any).funnel_stage || "unknown";
          byPlatform[p] = (byPlatform[p] || 0) + 1;
          byType[t] = (byType[t] || 0) + 1;
          byFunnel[f] = (byFunnel[f] || 0) + 1;
          totalScore += (i as any).lead_score || 0;
        }

        report.internal_analytics = {
          total_interactions: items.length,
          unique_users: new Set(items.map((i: any) => i.subscriber_id).filter(Boolean)).size,
          total_lead_score: totalScore,
          conversions: items.filter((i: any) => i.converted_at).length,
          by_platform: byPlatform,
          by_type: byType,
          by_funnel: byFunnel,
        };

        // Audience demographics
        if (pageId) {
          try {
            const audience = await getAudienceDemographics(pageId, fbToken);
            report.audience = audience.data || [];
          } catch (e) {
            console.warn("Audience fetch failed:", e);
          }
        }

        console.log(`📊 Full social report generated: ${items.length} interactions, period: ${period}`);
        return jsonResponse({ success: true, report });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error("[Social Analytics Error]", error);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
