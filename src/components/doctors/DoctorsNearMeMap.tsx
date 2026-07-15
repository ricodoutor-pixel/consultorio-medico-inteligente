import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { Stethoscope, Loader2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Doctor {
  id: string;
  full_name: string | null;
  specialty: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
}

const R = 6371;
function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function DoctorsNearMeMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // 1. Busca médicos (usa view pública)
        const { data } = await supabase
          .from("doctors_public" as any)
          .select("id,full_name,specialty,latitude,longitude,city,state")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(200);
        const list = ((data ?? []) as Doctor[]).filter(
          (d) => Number.isFinite(Number(d.latitude)) && Number.isFinite(Number(d.longitude)),
        );

        // 2. Geolocaliza usuário (com fallback SP)
        let center = { lat: -23.55, lng: -46.63 };
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) => {
            if (!navigator.geolocation) return rej(new Error("gps off"));
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 });
          });
          center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMe(center);
        } catch {
          setErr("Localização indisponível — mostrando região padrão");
        }

        // Ordena por distância
        list.sort(
          (a, b) =>
            distKm(center, { lat: Number(a.latitude), lng: Number(a.longitude) }) -
            distKm(center, { lat: Number(b.latitude), lng: Number(b.longitude) }),
        );
        setDoctors(list);

        // 3. Renderiza mapa
        const google = await loadGoogleMaps();
        if (!mapRef.current) return;
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#0f1419" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0f1419" }] },
            { featureType: "water", stylers: [{ color: "#0a0f14" }] },
            { featureType: "road", stylers: [{ color: "#1f2937" }] },
          ],
        });

        new google.maps.Marker({
          map,
          position: center,
          title: "Você",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#0ea5e9",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
            scale: 8,
          },
        });

        list.slice(0, 50).forEach((d) => {
          const m = new google.maps.Marker({
            map,
            position: { lat: Number(d.latitude), lng: Number(d.longitude) },
            title: d.full_name ?? "Médico",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#10b981",
              fillOpacity: 0.9,
              strokeColor: "#fff",
              strokeWeight: 1.5,
              scale: 7,
            },
          });
          const info = new google.maps.InfoWindow({
            content: `<div style="font-family:system-ui;color:#111;min-width:180px">
              <div style="font-weight:700">${d.full_name ?? "—"}</div>
              <div style="font-size:12px;color:#555">${d.specialty ?? "Especialista"}</div>
              <div style="font-size:11px;color:#777">${d.city ?? ""}${d.state ? " · " + d.state : ""}</div>
            </div>`,
          });
          m.addListener("click", () => info.open({ map, anchor: m }));
        });
      } catch (e: any) {
        setErr(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-foreground">Médicos próximos a você</h3>
          <Badge variant="outline" className="text-[10px]">
            <MapPin className="w-3 h-3 mr-1" /> {doctors.length}
          </Badge>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
      </div>
      {err && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-400">
          {err}
        </div>
      )}
      <div ref={mapRef} className="w-full h-[360px] rounded-lg border border-border bg-[#0a0f14]" />
      {me && doctors[0]?.latitude && (
        <p className="text-[10px] text-muted-foreground">
          Mais próximo:{" "}
          <strong>{doctors[0].full_name}</strong> ·{" "}
          {distKm(me, {
            lat: Number(doctors[0].latitude),
            lng: Number(doctors[0].longitude),
          }).toFixed(1)}{" "}
          km
        </p>
      )}
    </div>
  );
}
