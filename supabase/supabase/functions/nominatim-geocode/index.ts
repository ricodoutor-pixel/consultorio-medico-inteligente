// Nominatim Geocode — geocoding gratuito (OpenStreetMap) sem chave.
// Converte CEP/endereço em lat/lon para match de lojistas locais.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache simples in-memory por CEP (TTL implícito via cold-start).
const cache = new Map<string, { lat: number; lon: number; display: string; ts: number }>();
const TTL_MS = 24 * 60 * 60 * 1000;

function digits(s: string) { return (s || "").replace(/\D/g, ""); }
function haversineKm(a: {lat:number;lon:number}, b:{lat:number;lon:number}) {
  const R = 6371, toRad = (d:number)=>d*Math.PI/180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  // Require a valid Bearer JWT (verified against Supabase auth)
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const userClient = createClient(supaUrl, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uerr } = await userClient.auth.getUser();
    if (uerr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const cep = digits(body.cep ?? url.searchParams.get("cep") ?? "");
    const address = String(body.address ?? url.searchParams.get("address") ?? "").slice(0, 200);
    const targetLat = body.target_lat != null ? Number(body.target_lat) : null;
    const targetLon = body.target_lon != null ? Number(body.target_lon) : null;

    let key = cep ? `cep:${cep}` : `addr:${address.toLowerCase()}`;
    if (!cep && !address) {
      return new Response(JSON.stringify({ error: "cep or address required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let geo = cache.get(key);
    if (geo && Date.now() - geo.ts < TTL_MS) {
      // hit
    } else {
      let q = "";
      if (cep && cep.length === 8) {
        // Resolve CEP via BrasilAPI primeiro (mais preciso para Brasil)
        try {
          const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
          if (r.ok) {
            const j = await r.json();
            if (j?.location?.coordinates?.latitude) {
              geo = {
                lat: Number(j.location.coordinates.latitude),
                lon: Number(j.location.coordinates.longitude),
                display: `${j.street ?? ""}, ${j.city}/${j.state}`,
                ts: Date.now(),
              };
            } else {
              q = `${j.street ?? ""}, ${j.neighborhood ?? ""}, ${j.city}, ${j.state}, Brasil`;
            }
          }
        } catch (_) { /* fallthrough */ }
      }
      if (!geo) {
        const search = q || address || cep;
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(search)}`;
        const r = await fetch(nomUrl, { headers: { "User-Agent": "PlantaYRaiz/1.0 (contato@plantayraiz.com.br)" } });
        if (!r.ok) throw new Error(`Nominatim ${r.status}`);
        const arr = await r.json() as any[];
        if (!arr.length) {
          return new Response(JSON.stringify({ error: "not_found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        geo = { lat: Number(arr[0].lat), lon: Number(arr[0].lon), display: arr[0].display_name, ts: Date.now() };
      }
      cache.set(key, geo);
    }

    let distance_km: number | null = null;
    if (targetLat != null && targetLon != null && Number.isFinite(targetLat) && Number.isFinite(targetLon)) {
      distance_km = Math.round(haversineKm(geo, { lat: targetLat, lon: targetLon }) * 10) / 10;
    }

    return new Response(JSON.stringify({
      lat: geo.lat, lon: geo.lon, display: geo.display, distance_km,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[nominatim-geocode]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
