// Consulta Routes API via Google Maps gateway e devolve polyline + ETA para o mapa cliente.
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
    const origin = String(body.origin ?? "").trim();
    const destination = String(body.destination ?? "").trim();
    if (!origin || !destination) {
      return new Response(JSON.stringify({ error: "origin/destination obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(`${GATEWAY}/routes/directions/v2:computeRoutes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "X-Connection-Api-Key": GMAPS_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.viewport",
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        languageCode: "pt-BR",
        units: "METRIC",
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Routes API failed", resp.status, text);
      return new Response(
        JSON.stringify({ error: "Provider request failed", status: resp.status, details: text }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const j = await resp.json();
    const route = j?.routes?.[0];
    if (!route) {
      return new Response(JSON.stringify({ error: "Nenhuma rota encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const seconds = Number(String(route.duration ?? "0").replace("s", "")) || 0;
    const distanceMeters = Number(route.distanceMeters ?? 0);
    const mins = Math.round(seconds / 60);
    const durationText =
      mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins} min`;
    const km = distanceMeters / 1000;
    const distanceText = km >= 10 ? `${km.toFixed(0)} km` : `${km.toFixed(1)} km`;

    const vp = route.viewport;
    const bounds =
      vp?.low && vp?.high
        ? {
            sw: { lat: vp.low.latitude, lng: vp.low.longitude },
            ne: { lat: vp.high.latitude, lng: vp.high.longitude },
          }
        : null;

    return new Response(
      JSON.stringify({
        polyline: route.polyline?.encodedPolyline ?? null,
        bounds,
        durationSeconds: seconds,
        durationText,
        distanceMeters,
        distanceText,
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
