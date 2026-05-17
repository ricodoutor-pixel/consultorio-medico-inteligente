import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API = "https://graph.facebook.com/v19.0";

interface PublishRequest {
  post_id: string;        // club_posts ID
  content: string;        // post text
  images: string[];       // public image URLs
  author_name: string;
  author_username?: string;
}

// ─── Instagram Graph API Helpers ───

async function createMediaContainer(
  igAccountId: string,
  token: string,
  imageUrl: string,
  caption?: string,
  isCarouselItem = false
): Promise<string> {
  const params: Record<string, string> = {
    image_url: imageUrl,
    access_token: token,
  };

  if (isCarouselItem) {
    params.is_carousel_item = "true";
  } else if (caption) {
    params.caption = caption;
  }

  const res = await fetch(`${GRAPH_API}/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (data.error) throw new Error(`IG Media Error: ${JSON.stringify(data.error)}`);
  return data.id;
}

async function createCarouselContainer(
  igAccountId: string,
  token: string,
  childrenIds: string[],
  caption: string
): Promise<string> {
  const res = await fetch(`${GRAPH_API}/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      children: childrenIds,
      caption,
      access_token: token,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`IG Carousel Error: ${JSON.stringify(data.error)}`);
  return data.id;
}

async function publishMedia(
  igAccountId: string,
  token: string,
  containerId: string
): Promise<string> {
  const res = await fetch(`${GRAPH_API}/${igAccountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: token,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`IG Publish Error: ${JSON.stringify(data.error)}`);
  return data.id;
}

async function createStory(
  igAccountId: string,
  token: string,
  imageUrl: string
): Promise<string> {
  const containerRes = await fetch(`${GRAPH_API}/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      media_type: "STORIES",
      access_token: token,
    }),
  });

  const containerData = await containerRes.json();
  if (containerData.error) throw new Error(`IG Story Error: ${JSON.stringify(containerData.error)}`);

  // Wait for processing
  await new Promise((r) => setTimeout(r, 3000));

  const publishRes = await fetch(`${GRAPH_API}/${igAccountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: token,
    }),
  });

  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(`IG Story Publish Error: ${JSON.stringify(publishData.error)}`);
  return publishData.id;
}

function buildCaption(content: string, authorName: string): string {
  return (
    `${content}\n\n` +
    `📝 Depoimento de ${authorName}\n` +
    `🌿 Comunidade Club Planta y Raiz\n\n` +
    `#PlantaYRaiz #CannabisMedicinal #SaúdeNatural #Telemedicina ` +
    `#CannabisLegal #TratamentoNatural #BemEstar #SaúdeDigital`
  );
}

// ─── ManyChat tracking helper ───
async function trackToManyChat(
  supabaseUrl: string,
  supabaseKey: string,
  postId: string,
  igMediaId: string,
  authorName: string,
  format: string
) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/manychat-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        action: "post_engagement_sync",
        posts: [
          {
            platform: "instagram",
            post_id: igMediaId,
            caption: `Club post ${postId}`,
            campaign_source: "club_organic",
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0,
          },
        ],
      }),
    });
  } catch (e) {
    console.warn("[IG→MC] Tracking error:", e);
  }
}

// ─── Main handler ───
import { requireServiceAuth } from "../_shared/service-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  const igAccountId = Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID");
  const pageId = Deno.env.get("FACEBOOK_PAGE_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!igAccountId || !pageId) {
    return new Response(
      JSON.stringify({ error: "Instagram credentials not configured (need INSTAGRAM_BUSINESS_ACCOUNT_ID + FACEBOOK_PAGE_ID)" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  let fbToken: string;
  try {
    const { getFacebookPageToken } = await import("../_shared/fb-page-token.ts");
    fbToken = await getFacebookPageToken(pageId);
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "FB/IG token resolution failed", detail: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: PublishRequest = await req.json();
    const { post_id, content, images, author_name } = body;

    if (!content?.trim()) {
      return new Response(
        JSON.stringify({ error: "content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const caption = buildCaption(content, author_name || "Membro da Comunidade");
    const results: { feed?: string; story?: string; format: string } = { format: "text" };

    // ── PUBLISH TO FEED ──
    if (images.length === 0) {
      // Text-only posts aren't supported on IG — skip feed, only log
      console.log(`[IG] Post ${post_id} has no images, skipping IG feed publish`);
      results.format = "text_only_skipped";
    } else if (images.length === 1) {
      // Single image post
      const containerId = await createMediaContainer(igAccountId, fbToken, images[0], caption);
      // Wait for IG to process the image
      await new Promise((r) => setTimeout(r, 5000));
      const mediaId = await publishMedia(igAccountId, fbToken, containerId);
      results.feed = mediaId;
      results.format = "single_image";
    } else {
      // Carousel (2-3 images)
      const childIds: string[] = [];
      for (const img of images) {
        const childId = await createMediaContainer(igAccountId, fbToken, img, undefined, true);
        childIds.push(childId);
      }
      // Wait for all items to process
      await new Promise((r) => setTimeout(r, 5000));
      const carouselId = await createCarouselContainer(igAccountId, fbToken, childIds, caption);
      await new Promise((r) => setTimeout(r, 3000));
      const mediaId = await publishMedia(igAccountId, fbToken, carouselId);
      results.feed = mediaId;
      results.format = "carousel";
    }

    // ── PUBLISH STORY (first image) ──
    if (images.length > 0) {
      try {
        const storyId = await createStory(igAccountId, fbToken, images[0]);
        results.story = storyId;
      } catch (storyErr) {
        console.warn("[IG] Story publish failed:", storyErr);
      }
    }

    // ── TRACK VIA MANYCHAT ──
    if (results.feed) {
      await trackToManyChat(supabaseUrl, serviceKey, post_id, results.feed, author_name, results.format);
    }

    // ── LOG TO DB ──
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from("social_interactions").insert({
      platform: "instagram",
      interaction_type: "auto_publish",
      post_id: results.feed || post_id,
      post_caption: caption.slice(0, 500),
      subscriber_name: author_name,
      campaign_source: "club_organic",
      funnel_stage: "awareness",
      engagement_data: { format: results.format, story_id: results.story || null },
      tags: ["club_post", "auto_publish", results.format],
      flow_triggered: "content20250414_social_comment_auto",
    });

    console.log(`✅ IG Publish: ${results.format} | Feed: ${results.feed} | Story: ${results.story || "N/A"}`);

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[IG Publish Error]", error);
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
