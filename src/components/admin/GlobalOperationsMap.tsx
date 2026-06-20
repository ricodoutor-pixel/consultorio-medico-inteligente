import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

declare global { interface Window { google?: any; __initPrMap?: () => void; } }

interface Patient {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  geo_updated_at: string | null;
}

const BROWSER_KEY = (import.meta.env as any).VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = (import.meta.env as any).VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

function loadMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();
    if (!BROWSER_KEY) return reject(new Error("Maps API key missing"));
    window.__initPrMap = () => resolve();
    const s = document.createElement("script");
    const ch = TRACKING_ID ? `&channel=${TRACKING_ID}` : "";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__initPrMap${ch}`;
    s.async = true; s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
}

export default function GlobalOperationsMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObj = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id,full_name,phone,city,region,country,latitude,longitude,geo_updated_at")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(2000);
        setPatients((data ?? []) as Patient[]);

        await loadMapsScript();
        if (!mapRef.current || !window.google?.maps) return;
        mapObj.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: -14.235, lng: -51.925 }, // Brasil
          zoom: 4,
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

        for (const p of (data ?? []) as Patient[]) {
          const m = new window.google.maps.Marker({
            position: { lat: Number(p.latitude), lng: Number(p.longitude) },
            map: mapObj.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: "#10b981",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
              scale: 7,
            },
            title: p.full_name ?? "Paciente",
          });
          const info = new window.google.maps.InfoWindow({
            content: `
              <div style="font-family:system-ui;color:#111;min-width:200px">
                <div style="font-weight:700;margin-bottom:4px">${p.full_name ?? "—"}</div>
                <div style="font-size:12px;color:#444">${p.city ?? ""}${p.region ? " · " + p.region : ""}${p.country ? " · " + p.country : ""}</div>
                ${p.phone ? `<div style="font-size:12px;margin-top:4px"><a href="https://wa.me/${p.phone.replace(/\D/g,'')}" target="_blank">📱 ${p.phone}</a></div>` : ""}
                <div style="font-size:10px;color:#888;margin-top:4px">Atualizado: ${p.geo_updated_at ? new Date(p.geo_updated_at).toLocaleString("pt-BR") : "—"}</div>
                ${p.latitude ? `<a href="https://maps.google.com/?q=${p.latitude},${p.longitude}" target="_blank" style="font-size:12px;color:#0ea5e9">🚨 Emergência: ver localização</a>` : ""}
              </div>`,
          });
          m.addListener("click", () => info.open({ map: mapObj.current, anchor: m }));
          markers.current.push(m);
        }
      } catch (e: any) {
        setErr(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      markers.current.forEach((m) => m.setMap(null));
      markers.current = [];
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-lg text-foreground">Operações Globais</h3>
          <Badge variant="outline" className="text-[10px]">
            <MapPin className="w-3 h-3 mr-1" /> {patients.length} pacientes geolocalizados
          </Badge>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
      </div>
      {err && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {err.includes("API key") ? "Chave do Google Maps não configurada. Conecte o connector google_maps." : err}
        </div>
      )}
      <div ref={mapRef} className="w-full h-[560px] rounded-xl border border-border bg-[#0a0f14]" />
      <p className="text-[10px] text-muted-foreground">
        Pontos verdes = pacientes que aceitaram termos LGPD e compartilharam localização.
        Em caso de emergência, clique no marcador para abrir Google Maps com a última posição registrada.
      </p>
    </div>
  );
}
