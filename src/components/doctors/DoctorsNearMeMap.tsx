import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope, Loader2, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { professionals as testProfessionals } from "@/data/professionals";

// Fix leaflet default icons
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Green icon for Online
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Red icon for Offline
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Blue icon for User
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Doctor {
  id: string;
  full_name: string | null;
  specialty: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  is_online: boolean;
  avatar_url: string | null;
  crm: string | null;
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

function MapUpdater({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 13);
    }
  }, [center, map]);
  return null;
}

export default function DoctorsNearMeMap() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [cep, setCep] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("doctors_public" as any)
          .select("id,full_name,specialty,city,state,is_online,crm,user_id,avatar_url")
          .limit(200);


        const list = ((data ?? []) as any[]).map(d => {
          const mockMatch = testProfessionals.find(p => p.crm === d.crm || (p.name && d.full_name && p.name.toLowerCase().includes(d.full_name.toLowerCase())));
          
          let lat = d.latitude;
          let lng = d.longitude;
          
          // Se o médico não tiver coordenadas salvas, dá uma posição padrão (ex: perto de SP ou Santa Cruz)
          if (!lat || !lng) {
            const nameLower = (d.full_name || "").toLowerCase();
            if (nameLower.includes("olivia")) {
              lat = -23.5629; // Posição ilustrativa para Dra Olivia
              lng = -46.6544;
            } else if (nameLower.includes("suelen")) {
              lat = -23.5732; // Posição ilustrativa para Dr. Edilson
              lng = -46.6417;
            } else {
              // Posicionamento genérico
              lat = -23.55 + (Math.random() - 0.5) * 0.1;
              lng = -46.63 + (Math.random() - 0.5) * 0.1;
            }
          }

          return {
            ...d,
            latitude: lat,
            longitude: lng,
            avatar_url: d.profile?.avatar_url || mockMatch?.imageUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(d.full_name || "M")
          };
        }).filter(
          (d) => Number.isFinite(Number(d.latitude)) && Number.isFinite(Number(d.longitude)),
        );

        let center = { lat: -23.55, lng: -46.63 };
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) => {
            if (!navigator.geolocation) return rej(new Error("gps off"));
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 });
          });
          center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMe(center);
        } catch {
          // Fallback to SP
        }

        list.sort(
          (a, b) =>
            distKm(center, { lat: Number(a.latitude), lng: Number(a.longitude) }) -
            distKm(center, { lat: Number(b.latitude), lng: Number(b.longitude) }),
        );
        setDoctors(list);
      } catch (e: any) {
        setErr(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearchCEP = async () => {
    if (!cep) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${cep}+Brazil&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        setMe({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
        setErr(null);
      } else {
        setErr("CEP ou região não encontrada");
      }
    } catch (error) {
      setErr("Erro ao buscar região");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-foreground">Encontre seu médico aqui por região</h3>
          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
             {doctors.length} na rede
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Digite seu CEP ou Cidade" 
            value={cep} 
            onChange={(e) => setCep(e.target.value)} 
            className="h-9 text-sm w-full md:w-56 bg-background"
            onKeyDown={(e) => e.key === 'Enter' && handleSearchCEP()}
          />
          <Button size="sm" onClick={handleSearchCEP} disabled={isSearching} className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-400">
          {err}
        </div>
      )}

      <div className="relative w-full h-[450px] rounded-xl overflow-hidden border border-border z-0">
        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f14]">
             <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
           </div>
        ) : (
          <MapContainer 
            center={me ? [me.lat, me.lng] : [-23.55, -46.63]} 
            zoom={me ? 13 : 5} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
          >
            {/* Satellite view like Google Maps */}
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EAP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            {/* Overlay borders/labels for reference (optional, makes it look more like hybrid maps) */}
            <TileLayer
              url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              opacity={0.3}
            />
            
            <MapUpdater center={me} />

            {me && (
              <Marker position={[me.lat, me.lng]} icon={blueIcon}>
                 <Popup>Você está aqui</Popup>
              </Marker>
            )}

            {doctors.map(d => (
              <Marker 
                key={d.id} 
                position={[Number(d.latitude), Number(d.longitude)]}
                icon={d.is_online ? greenIcon : redIcon}
              >
                <Popup className="custom-popup">
                  <div className="flex flex-col items-center text-center w-44 pt-1">
                    <img src={d.avatar_url || ''} alt={d.full_name || ''} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 mb-2 shadow-md" />
                    <strong className="text-[13px] font-black text-gray-900 leading-tight mb-1">{d.full_name}</strong>
                    <span className="text-[11px] text-gray-600 mb-1 leading-tight">{d.specialty}</span>
                    {d.crm && <span className="text-[10px] text-gray-500 mb-1 font-mono">CRM: {d.crm}</span>}
                    <span className="text-[11px] font-bold text-emerald-600 mb-2">{d.city}{d.state ? ` - ${d.state}` : ''}</span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${d.is_online ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {d.is_online ? 'ONLINE AGORA' : 'OFFLINE'}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
