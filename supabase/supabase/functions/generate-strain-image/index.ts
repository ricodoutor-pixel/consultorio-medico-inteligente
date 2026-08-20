import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require a valid authenticated user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify token via anon client (respects RLS)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Require admin role — this function uses service_role to write to a public bucket
    const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { strain_id, strain_name, strain_type } = await req.json();

    if (!strain_id || !strain_name) {
      return new Response(JSON.stringify({ error: "strain_id and strain_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const imageResp = await fetch(pollinationsUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
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
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
