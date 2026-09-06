// Captura lat/lng do usuário, faz reverse geocoding via Google Maps gateway e persiste em profiles.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAPS_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

    const auth = req.headers.get("authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response(JSON.stringify({ error: "invalid coords" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reverse geocode (best effort)
    let country = null, region = null, city = null;
    if (LOVABLE_KEY && GMAPS_KEY) {
      try {
        const r = await fetch(`${GATEWAY}/maps/api/geocode/json?latlng=${lat},${lng}&language=pt-BR`, {
          headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "X-Connection-Api-Key": GMAPS_KEY },
        });
        const j = await r.json();
        const comp = j?.results?.[0]?.address_components ?? [];
        for (const c of comp) {
          if (c.types?.includes("country")) country = c.long_name;
          if (c.types?.includes("administrative_area_level_1")) region = c.short_name;
          if (c.types?.includes("administrative_area_level_2") || c.types?.includes("locality")) city ||= c.long_name;
        }
      } catch (e) { console.warn("geocode failed", e); }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    await admin.from("profiles").update({
      latitude: lat, longitude: lng,
      country, region, city,
      geo_updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    return new Response(JSON.stringify({ ok: true, country, region, city }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
