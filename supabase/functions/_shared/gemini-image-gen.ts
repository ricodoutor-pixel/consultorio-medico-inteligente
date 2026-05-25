// Gera imagem via Lovable AI Gateway (Nano Banana) e faz upload no bucket público
// `social-posts`, retornando URL pública estável para uso no Instagram/Facebook Graph API.
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const BUCKET = "social-posts";

const IMG_STYLE =
  "Realistic premium editorial photography, soft natural light, cannabis medicinal lifestyle, " +
  "deep green and ivory palette, modern brazilian wellness aesthetic, calm and trustworthy, " +
  "square 1:1 composition, no text overlay, no watermark, no logos, no medical symbols, " +
  "no people faces visible (or out of focus), high resolution, instagram-ready.";

export async function generateGeminiImageForTopic(
  topic: string,
): Promise<{ url: string | null; error?: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!LOVABLE_API_KEY) return { url: null, error: "LOVABLE_API_KEY missing" };

  const prompt =
    `Create a beautiful 1080x1080 photo to illustrate this topic: "${topic}". ` +
    `Style: ${IMG_STYLE}`;

  try {
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      return { url: null, error: `gateway ${res.status}: ${await res.text()}` };
    }
    const j = await res.json();
    const dataUrl: string | undefined =
      j?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl?.startsWith("data:image/")) {
      return { url: null, error: "no image in response" };
    }
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(image\/\w+)/)?.[1] || "image/png";
    const ext = mime.split("/")[1] || "png";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const supabase = createClient(SUPABASE_URL, SERVICE);
    const path = `auto/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const up = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (up.error) return { url: null, error: `upload: ${up.error.message}` };
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (e) {
    return { url: null, error: String(e) };
  }
}
