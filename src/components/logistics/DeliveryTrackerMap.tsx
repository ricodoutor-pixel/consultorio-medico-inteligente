import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Clock, Route as RouteIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  /** Endereço de origem (CDD/farmácia). Default: São Paulo/SP. */
  origin?: string;
  /** Endereço de destino do pedido. */
  destination: string;
  /** Rótulo do pedido. */
  orderLabel?: string;
}

const DEFAULT_ORIGIN = "Av. Paulista, 1000 - São Paulo - SP";

export default function DeliveryTrackerMap({
  origin = DEFAULT_ORIGIN,
  destination,
  orderLabel = "Seu pedido",
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const google = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          zoom: 8,
          center: { lat: -23.55, lng: -46.63 },
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

        const renderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: { strokeColor: "#10b981", strokeWeight: 5, strokeOpacity: 0.9 },
        });

        // Chama edge function que consulta Routes API via gateway
        const { data, error } = await supabase.functions.invoke("maps-route-eta", {
          body: { origin, destination },
        });
        if (error) throw error;

        if (data?.polyline && data?.bounds) {
          const path = google.maps.geometry.encoding.decodePath(data.polyline);
          new google.maps.Polyline({
            map,
            path,
            strokeColor: "#10b981",
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
          const bounds = new google.maps.LatLngBounds(
            { lat: data.bounds.sw.lat, lng: data.bounds.sw.lng },
            { lat: data.bounds.ne.lat, lng: data.bounds.ne.lng },
          );
          map.fitBounds(bounds);

          new google.maps.Marker({
            map,
            position: path[0],
            title: "Farmácia (origem)",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#0ea5e9",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
              scale: 8,
            },
          });
          new google.maps.Marker({
            map,
            position: path[path.length - 1],
            title: "Entrega",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#10b981",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
              scale: 9,
            },
          });
        } else {
          // Fallback: DirectionsService cliente
          const ds = new google.maps.DirectionsService();
          const res = await ds.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
          });
          renderer.setDirections(res);
          const leg = res.routes[0].legs[0];
          setDistance(leg.distance?.text ?? null);
          setEta(leg.duration?.text ?? null);
          return;
        }

        setDistance(data.distanceText);
        setEta(data.durationText);
      } catch (e: any) {
        setErr(e.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [origin, destination]);

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">{orderLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {distance && (
            <Badge variant="outline" className="text-[10px]">
              <RouteIcon className="w-3 h-3 mr-1" /> {distance}
            </Badge>
          )}
          {eta && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">
              <Clock className="w-3 h-3 mr-1" /> ETA {eta}
            </Badge>
          )}
          {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
        </div>
      </div>
      {err && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
          Rota indisponível: {err}
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-[280px] rounded-lg border border-border bg-[#0a0f14]"
      />
    </div>
  );
}
