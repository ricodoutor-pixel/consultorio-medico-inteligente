// Consulta Air Quality API via Google Maps gateway.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireUserAuth } from "../_shared/user-auth.ts";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = await requireUserAuth(req, corsHeaders);
  if (unauth) return unauth;
  try {
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAPS_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!LOVABLE_KEY || !GMAPS_KEY) {
      return new Response(JSON.stringify({ error: "Google Maps connector não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json().catch(() => ({}));
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response(JSON.stringify({ error: "coordenadas inválidas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(`${GATEWAY}/airquality/v1/currentConditions:lookup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "X-Connection-Api-Key": GMAPS_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: { latitude: lat, longitude: lng },
        extraComputations: ["DOMINANT_POLLUTANT_CONCENTRATION", "HEALTH_RECOMMENDATIONS"],
        languageCode: "pt-BR",
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Air Quality failed", resp.status, text);
      return new Response(
        JSON.stringify({ error: "Provider request failed", status: resp.status, details: text }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const j = await resp.json();
    const idx = j?.indexes?.find((x: any) => x.code === "uaqi") ?? j?.indexes?.[0];

    return new Response(
      JSON.stringify({
        aqi: idx?.aqi ?? null,
        category: idx?.category ?? "Desconhecido",
        color: idx?.color ?? null,
        dominantPollutant: idx?.dominantPollutant ?? null,
        healthRecommendation: j?.healthRecommendations?.generalPopulation ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
