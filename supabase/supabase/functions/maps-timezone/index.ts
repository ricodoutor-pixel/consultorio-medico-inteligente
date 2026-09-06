// Retorna fuso horário (IANA) para um par lat/lng via Google Time Zone API através do gateway.
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
    const timestamp = Math.floor(Date.now() / 1000);

    const resp = await fetch(
      `${GATEWAY}/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&language=pt-BR`,
      {
        headers: {
          Authorization: `Bearer ${LOVABLE_KEY}`,
          "X-Connection-Api-Key": GMAPS_KEY,
        },
      },
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Time Zone failed", resp.status, text);
      return new Response(
        JSON.stringify({ error: "Provider request failed", status: resp.status, details: text }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const j = await resp.json();
    if (j.status !== "OK") {
      return new Response(JSON.stringify({ error: j.status, details: j.errorMessage ?? null }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({
        timeZoneId: j.timeZoneId,
        timeZoneName: j.timeZoneName,
        rawOffset: j.rawOffset,
        dstOffset: j.dstOffset,
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
