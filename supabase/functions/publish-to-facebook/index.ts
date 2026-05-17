import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API = "https://graph.facebook.com/v19.0";

interface PublishRequest {
  post_id: string;
  content: string;
  images: string[];
  author_name: string;
  link?: string;
  schedule_time?: number; // Unix timestamp for scheduled posts
  publish_to_instagram?: boolean; // Cross-post to IG
}

// ─── Facebook Graph API Helpers ───

async function publishTextPost(pageId: string, token: string, message: string, link?: string): Promise<string> {
  const params: Record<string, string> = { message, access_token: token };
  if (link) params.link = link;

  const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (data.error) throw new Error(`FB Feed Error: ${JSON.stringify(data.error)}`);
  return data.id;
}

async function publishPhotoPost(pageId: string, token: string, imageUrl: string, caption: string): Promise<string> {
  const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: imageUrl, caption, access_token: token }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`FB Photo Error: ${JSON.stringify(data.error)}`);
  return data.id;
}

async function publishMultiPhotoPost(
  pageId: string, token: string, images: string[], message: string
): Promise<string> {
  // Step 1: Upload each photo as unpublished
  const photoIds: string[] = [];
  for (const img of images) {
    const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: img, published: false, access_token: token }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`FB Multi-Photo Upload Error: ${JSON.stringify(data.error)}`);
    photoIds.push(data.id);
  }

  // Step 2: Create feed post with attached photos
  const attachedMedia = photoIds.map(id => ({ media_fbid: id }));
  const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, attached_media: attachedMedia, access_token: token }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`FB Multi-Photo Post Error: ${JSON.stringify(data.error)}`);
  return data.id;
}

async function schedulePost(
  pageId: string, token: string, message: string, scheduleTime: number, imageUrl?: string
): Promise<string> {
  const params: Record<string, unknown> = {
    message,
    published: false,
    scheduled_publish_time: scheduleTime,
    access_token: token,
  };

  const endpoint = imageUrl ? `${GRAPH_API}/${pageId}/photos` : `${GRAPH_API}/${pageId}/feed`;
  if (imageUrl) params.url = imageUrl;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (data.error) throw new Error(`FB Schedule Error: ${JSON.stringify(data.error)}`);
  return data.id;
}

async function getPageInsights(pageId: string, token: string): Promise<Record<string, unknown>> {
  const metrics = "page_impressions,page_engaged_users,page_fans,page_views_total,page_post_engagements";
  const res = await fetch(
    `${GRAPH_API}/${pageId}/insights?metric=${metrics}&period=day&access_token=${token}`
  );
  const data = await res.json();
  if (data.error) console.warn("FB Insights Error:", data.error);
  return data.data || [];
}

function buildCaption(content: string, authorName: string): string {
  return (
    `${content}\n\n` +
    `📝 Por ${authorName}\n` +
    `🌿 Comunidade Club Planta y Raiz\n` +
    `🔗 plantayraiz.com.br\n\n` +
    `#PlantaYRaiz #CannabisMedicinal #SaúdeNatural #Telemedicina ` +
    `#CannabisLegal #TratamentoNatural #BemEstar #SaúdeDigital`
  );
}

// ─── Engagement tracking ───
// (ManyChat removed — engagement now logged directly to social_interactions table below.)

// ─── Cross-post to Instagram ───
async function crossPostToInstagram(
  supabaseUrl: string, serviceKey: string, body: PublishRequest
) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/publish-to-instagram`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log("[FB→IG] Cross-post result:", data);
    return data;
  } catch (e) {
    console.warn("[FB→IG] Cross-post error:", e);
    return { error: String(e) };
  }
}

// ─── Main handler ───
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;


  const pageId = Deno.env.get("FACEBOOK_PAGE_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!pageId) {
    return new Response(
      JSON.stringify({ error: "FACEBOOK_PAGE_ID not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  let fbToken: string;
  try {
    const { getFacebookPageToken } = await import("../_shared/fb-page-token.ts");
    fbToken = await getFacebookPageToken(pageId);
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "FB token resolution failed", detail: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: PublishRequest = await req.json();
    const { post_id, content, images, author_name, link, schedule_time, publish_to_instagram } = body;

    if (!content?.trim()) {
      return new Response(
        JSON.stringify({ error: "content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const caption = buildCaption(content, author_name || "Membro da Comunidade");
    const results: Record<string, unknown> = { format: "text" };

    // ── SCHEDULED POST ──
    if (schedule_time && schedule_time > Date.now() / 1000) {
      const scheduledId = await schedulePost(pageId, fbToken, caption, schedule_time, images?.[0]);
      results.scheduled = scheduledId;
      results.format = "scheduled";
      results.schedule_time = new Date(schedule_time * 1000).toISOString();
    }
    // ── IMMEDIATE PUBLISH ──
    else if (!images || images.length === 0) {
      const postId = await publishTextPost(pageId, fbToken, caption, link);
      results.feed = postId;
      results.format = "text";
    } else if (images.length === 1) {
      const postId = await publishPhotoPost(pageId, fbToken, images[0], caption);
      results.feed = postId;
      results.format = "single_photo";
    } else {
      const postId = await publishMultiPhotoPost(pageId, fbToken, images, caption);
      results.feed = postId;
      results.format = "multi_photo";
    }

    // ── CROSS-POST TO INSTAGRAM ──
    let igResult: Record<string, unknown> | null = null;
    if (publish_to_instagram !== false && images && images.length > 0) {
      igResult = await crossPostToInstagram(supabaseUrl, serviceKey, {
        post_id, content, images, author_name,
      });
      results.instagram = igResult;
    }

    // ── ENGAGEMENT TRACKING (ManyChat removed; logged to social_interactions below) ──

    // ── LOG TO DB ──
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from("social_interactions").insert({
      platform: "facebook",
      interaction_type: "auto_publish",
      post_id: String(results.feed || results.scheduled || post_id),
      post_caption: caption.slice(0, 500),
      subscriber_name: author_name,
      campaign_source: "club_organic",
      funnel_stage: "awareness",
      engagement_data: {
        format: results.format,
        instagram_cross_posted: !!igResult?.success,
        scheduled: !!results.scheduled,
      },
      tags: ["club_post", "auto_publish", "facebook", String(results.format)],
      flow_triggered: "content20250414_fb_auto_publish",
    });

    // ── GET PAGE INSIGHTS ──
    let insights: Record<string, unknown> = {};
    try {
      insights = await getPageInsights(pageId, fbToken);
    } catch (e) {
      console.warn("[FB] Insights fetch failed:", e);
    }

    console.log(`✅ FB Publish: ${results.format} | Feed: ${results.feed || "N/A"} | IG: ${igResult?.success || false}`);

    return new Response(
      JSON.stringify({ success: true, ...results, insights }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[FB Publish Error]", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
