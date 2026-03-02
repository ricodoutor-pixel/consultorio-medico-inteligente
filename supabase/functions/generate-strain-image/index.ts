import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { strain_id, strain_name, strain_type } = await req.json();

    if (!strain_id || !strain_name) {
      return new Response(JSON.stringify({ error: "strain_id and strain_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if image already exists
    const { data: existing } = await supabase
      .from("strain_images")
      .select("image_url")
      .eq("strain_id", strain_id)
      .single();

    if (existing?.image_url) {
      return new Response(JSON.stringify({ image_url: existing.image_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate image via pollinations - try to download and store, fallback to direct URL
    const colors = ["purple", "green", "orange", "frosty white", "golden", "pink", "deep green", "blue-purple", "lime", "red-orange", "silver", "emerald", "violet", "amber"];
    const color = colors[strain_id % colors.length];
    const t = (strain_type || "hybrid").toLowerCase().includes("indica") ? "indica" : (strain_type || "").toLowerCase().includes("sativa") ? "sativa" : "hybrid";
    const prompt = `hyperrealistic oil painting of a ${color} ${strain_name} cannabis flower bud, ${t} strain, glistening trichomes, vibrant pistils, dramatic chiaroscuro lighting, museum quality botanical illustration, rich textures, dark moody background, masterpiece, ultra detailed, 8k resolution`;
    
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${strain_id}&nologo=true&model=flux`;

    let storedUrl = pollinationsUrl;

    // Try to download and upload to storage for caching
    try {
      const imageResp = await fetch(pollinationsUrl, { signal: AbortSignal.timeout(15000) });
      if (imageResp.ok) {
        const imageBlob = await imageResp.arrayBuffer();
        const fileName = `strain-${strain_id}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("strain-images")
          .upload(fileName, imageBlob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("strain-images")
            .getPublicUrl(fileName);
          storedUrl = publicUrlData.publicUrl;
        } else {
          console.warn("Upload failed, using direct URL:", uploadError.message);
        }
      } else {
        console.warn(`Pollinations returned ${imageResp.status}, using direct URL as fallback`);
        await imageResp.text(); // consume body
      }
    } catch (fetchErr) {
      console.warn("Failed to download image, using direct URL:", fetchErr);
    }

    // Save to database
    await supabase.from("strain_images").upsert({
      strain_id,
      strain_name,
      image_url: storedUrl,
    }, { onConflict: "strain_id" });

    return new Response(JSON.stringify({ image_url: storedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-strain-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
