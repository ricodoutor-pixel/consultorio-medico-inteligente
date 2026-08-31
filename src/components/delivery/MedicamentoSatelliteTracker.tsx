import { useState, useEffect, useRef } from "react";
import { 
  Maximize2, 
  Minimize2, 
  Navigation, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Thermometer, 
  Clock, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Layers, 
  Compass, 
  Search, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MedicamentoSatelliteTrackerProps {
  initialOriginCep?: string;
  initialOriginAddress?: string;
  initialDestinationCep?: string;
  initialDestinationAddress?: string;
  patientName?: string;
  medicineName?: string;
  orderId?: string;
  isPharmacyView?: boolean;
}

export function MedicamentoSatelliteTracker({
  initialOriginCep = "01310-100",
  initialOriginAddress = "Av. Paulista, 1000 - Bela Vista, São Paulo - SP (Farmácia Planta y Raíz)",
  initialDestinationCep = "04571-010",
  initialDestinationAddress = "Av. Eng. Luís Carlos Berrini, 1200 - Brooklin, São Paulo - SP",
  patientName = "Paciente Planta y Raíz",
  medicineName = "Epidiolex / Canabidiol 100 mg/mL",
  orderId = "PYR-SAT-984210-BR",
  isPharmacyView = false
}: MedicamentoSatelliteTrackerProps) {
  const { toast } = useToast();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState<"satellite" | "dark">("dark");
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0.42); // 42% do trajeto
  const [cargoTemp, setCargoTemp] = useState(4.2);
  const [speed, setSpeed] = useState(48);

  // CEPs e endereços editáveis
  const [originCep, setOriginCep] = useState(initialOriginCep);
  const [destCep, setDestCep] = useState(initialDestinationCep);
  const [originAddress, setOriginAddress] = useState(initialOriginAddress);
  const [destAddress, setDestAddress] = useState(initialDestinationAddress);
  const [searchingCep, setSearchingCep] = useState(false);

  // Coordenadas padrão (São Paulo SP: Farmácia Paulista -> Destino)
  const [originCoords, setOriginCoords] = useState<[number, number]>([-23.5654, -46.6515]);
  const [destCoords, setDestCoords] = useState<[number, number]>([-23.6068, -46.6968]);
  const [distanceKm, setDistanceKm] = useState(9.4);
  const [etaMinutes, setEtaMinutes] = useState(18);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const pulseCircleRef = useRef<L.CircleMarker | null>(null);

  // Calcular distância e rota simplificada
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da terra em km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    const roadDist = Number((d * 1.32).toFixed(1)); // Fator de curvas viárias
    setDistanceKm(roadDist > 0 ? roadDist : 1.2);
    setEtaMinutes(Math.max(5, Math.round(roadDist * 2.1)));
  };

  // Buscar CEP via ViaCEP
  const handleLookupCep = async (cep: string, isOrigin: boolean) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      toast({ title: "CEP inválido", description: "Digite um CEP com 8 dígitos.", variant: "destructive" });
      return;
    }

    try {
      setSearchingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast({ title: "CEP não encontrado", description: "Verifique o CEP digitado.", variant: "destructive" });
        return;
      }

      const formatted = `${data.logradouro ? data.logradouro + ", " : ""}${data.bairro ? data.bairro + " - " : ""}${data.localidade} - ${data.uf}`;
      
      // Geocodificação OpenStreetMap Nominatim
      const query = `${data.logradouro || data.bairro || data.localidade}, ${data.localidade}, ${data.uf}, Brasil`;
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const geoData = await geoRes.json();

      let lat = isOrigin ? -23.5654 : -23.6068;
      let lng = isOrigin ? -46.6515 : -46.6968;

      if (geoData && geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      } else {
        // Variação suave se não achar coordenada exata
        lat += (Math.random() - 0.5) * 0.05;
        lng += (Math.random() - 0.5) * 0.05;
      }

      if (isOrigin) {
        setOriginAddress(formatted);
        setOriginCoords([lat, lng]);
        calculateDistance(lat, lng, destCoords[0], destCoords[1]);
      } else {
        setDestAddress(formatted);
        setDestCoords([lat, lng]);
        calculateDistance(originCoords[0], originCoords[1], lat, lng);
      }

      toast({
        title: "📍 Localização Atualizada!",
        description: `${isOrigin ? "Origem (Farmácia)" : "Destino (Paciente)"}: ${formatted}`
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro na consulta do CEP", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setSearchingCep(false);
    }
  };

  // Inicializar Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [
          (originCoords[0] + destCoords[0]) / 2,
          (originCoords[1] + destCoords[1]) / 2
        ],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      mapInstanceRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
    }

    const map = mapInstanceRef.current;

    // Remover tilelayer anterior se existir
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // TileLayer: Satélite (Esri) ou Dark (CartoDB)
    const tileUrl = mapType === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: "abcd"
    }).addTo(map);

    // Gerar pontos da rota interpolada com curvatura estilo Uber
    const numPoints = 60;
    const routePoints: [number, number][] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // Interpolação com arco bezier sutil
      const arc = Math.sin(t * Math.PI) * 0.008;
      const lat = originCoords[0] + (destCoords[0] - originCoords[0]) * t + arc;
      const lng = originCoords[1] + (destCoords[1] - originCoords[1]) * t + arc;
      routePoints.push([lat, lng]);
    }

    // Desenhar polyline da rota
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
    }

    polylineRef.current = L.polyline(routePoints, {
      color: "#10b981",
      weight: 5,
      opacity: 0.85,
      dashArray: "8, 6",
      lineCap: "round",
      lineJoin: "round"
    }).addTo(map);

    // Marcador da Farmácia (Origem)
    const farmaciaIcon = L.divIcon({
      className: "custom-farmacia-icon",
      html: `
        <div style="background:#064e3b; border:2px solid #10b981; border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(16,185,129,0.8); cursor:pointer;">
          <span style="font-size:18px;">🏥</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const originMarker = L.marker(originCoords, { icon: farmaciaIcon }).addTo(map);
    originMarker.bindPopup(`
      <div style="color:#0f172a; font-family:sans-serif; padding:4px;">
        <strong style="color:#047857;">🏥 Farmácia Planta y Raíz</strong><br/>
        <small>${originAddress}</small><br/>
        <span style="display:inline-block; margin-top:4px; padding:2px 6px; background:#d1fae5; color:#065f46; border-radius:4px; font-weight:bold; font-size:10px;">EXPEDIÇÃO AUTORIZADA ANVISA</span>
      </div>
    `);

    // Marcador do Paciente (Destino)
    const pacienteIcon = L.divIcon({
      className: "custom-paciente-icon",
      html: `
        <div style="background:#b45309; border:2px solid #f59e0b; border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(245,158,11,0.8); cursor:pointer;">
          <span style="font-size:18px;">🏠</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const destMarker = L.marker(destCoords, { icon: pacienteIcon }).addTo(map);
    destMarker.bindPopup(`
      <div style="color:#0f172a; font-family:sans-serif; padding:4px;">
        <strong style="color:#b45309;">🏠 Residência do Paciente</strong><br/>
        <small>${destAddress}</small><br/>
        <span style="display:inline-block; margin-top:4px; padding:2px 6px; background:#fef3c7; color:#92400e; border-radius:4px; font-weight:bold; font-size:10px;">RECEBIMENTO PRESCRITO</span>
      </div>
    `);

    // Marcador do Carro Pequeno Animado Estilo Uber
    const carIndex = Math.min(Math.floor(progress * numPoints), numPoints);
    const carPos = routePoints[carIndex] || originCoords;

    const carIcon = L.divIcon({
      className: "custom-car-icon",
      html: `
        <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
          <!-- Pulso de radar via satélite -->
          <div style="position:absolute; inset:0; border-radius:50%; background:rgba(16,185,129,0.25); border:2px solid #34d399; animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <!-- Miniatura do Carro Crio-Pharma -->
          <div style="position:relative; z-index:10; background:#0f172a; border:2px solid #10b981; border-radius:12px; width:34px; height:34px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,0.8); transform:rotate(${Math.round(progress * 360)}deg); transition:transform 0.5s ease;">
            <span style="font-size:18px;">🚗</span>
          </div>
          <!-- Badge de Temperatura ao vivo -->
          <div style="position:absolute; top:-8px; right:-8px; z-index:20; background:#065f46; color:#a7f3d0; border:1px solid #10b981; font-size:8px; font-weight:900; padding:1px 4px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.5);">
            4.2°C
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    if (carMarkerRef.current) {
      map.removeLayer(carMarkerRef.current);
    }
    carMarkerRef.current = L.marker(carPos, { icon: carIcon }).addTo(map);

    // Ajustar bounds do mapa para enquadrar a rota
    map.fitBounds(L.latLngBounds([originCoords, destCoords]), { padding: [40, 40] });

    return () => {
      // Clean up markers if needed
    };
  }, [mapType, originCoords, destCoords, isFullscreen]);

  // Animação de Movimento do Carro ao longo do tempo (Estilo Uber)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.006;
        if (next >= 1) return 0; // Volta ao início para simulação contínua
        return next;
      });

      // Flutuação realista de telemetria
      setCargoTemp((prev) => Number((4.1 + Math.sin(Date.now() / 3000) * 0.3).toFixed(1)));
      setSpeed((prev) => Math.round(45 + Math.sin(Date.now() / 2000) * 12));
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Atualizar posição do marcador do carro quando o progresso muda
  useEffect(() => {
    if (!mapInstanceRef.current || !carMarkerRef.current) return;

    const numPoints = 60;
    const t = progress;
    const arc = Math.sin(t * Math.PI) * 0.008;
    const lat = originCoords[0] + (destCoords[0] - originCoords[0]) * t + arc;
    const lng = originCoords[1] + (destCoords[1] - originCoords[1]) * t + arc;

    carMarkerRef.current.setLatLng([lat, lng]);
  }, [progress, originCoords, destCoords]);

  // Recalcular ETA dinâmico
  const remainingEta = Math.max(1, Math.round(etaMinutes * (1 - progress)));
  const remainingKm = Math.max(0.1, Number((distanceKm * (1 - progress)).toFixed(1)));

  const mapContent = (
    <div 
      className={`relative w-full h-full rounded-2xl overflow-hidden border border-emerald-500/30 bg-card shadow-2xl flex flex-col ${isFullscreen ? 'h-[85vh]' : 'min-h-[420px] max-h-[560px]'}`}
      onDoubleClick={() => setIsFullscreen(!isFullscreen)}
      title="Dê dois cliques para alternar tela cheia"
    >
      {/* Barra de Topo do Rastreamento Satélite */}
      <div className="p-3.5 bg-card/90 backdrop-blur-md border-b border-border/60 flex items-center justify-between flex-wrap gap-2 z-20">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="w-3 h-3 rounded-full bg-emerald-500 block animate-ping absolute inset-0" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 block relative" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-black text-sm text-foreground flex items-center gap-1.5">
                <Navigation size={15} className="text-emerald-400" /> Rastreamento de Medicamento via Satélite
              </h3>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px] font-bold uppercase">
                Ao Vivo Estilo Uber
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Código: <strong className="text-foreground">{orderId}</strong> • {medicineName}
            </p>
          </div>
        </div>

        {/* Botões de Ação e Tela Cheia */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="text-[11px] h-8 rounded-xl font-bold border-border/60"
            onClick={() => setMapType(mapType === "satellite" ? "dark" : "satellite")}
          >
            <Layers size={13} className="mr-1 text-emerald-400" />
            {mapType === "satellite" ? "Modo Dark" : "Modo Satélite"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-[11px] h-8 rounded-xl font-bold border-border/60"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={13} className="mr-1 text-amber-400" /> : <Play size={13} className="mr-1 text-emerald-400" />}
            {isPlaying ? "Pausar" : "Simular"}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia (Ou dê 2 cliques no mapa)"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        </div>
      </div>

      {/* Área Central: Mapa com Leaflet e Widgets Flutuantes */}
      <div className="relative flex-1 w-full overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0 min-h-[300px]" />

        {/* Banner Dica de 2 Cliques */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow-lg flex items-center gap-1">
            <Sparkles size={11} className="text-emerald-400" /> Dê 2 cliques para {isFullscreen ? "reduzir" : "tela cheia"}
          </div>
        </div>

        {/* Card Flutuante Estilo Uber: ETA e Telemetria */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-10">
          <div className="bg-card/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl space-y-2.5">
            {/* Linha de Status */}
            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-sm">
                  🚗
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Carlos Eduardo • Crio-Log #4812</p>
                  <p className="text-[10px] text-muted-foreground">Furgão Refrigerado Sprinter (PYR-4Z26)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-emerald-400">{remainingEta} min</span>
                <p className="text-[10px] text-muted-foreground">{remainingKm} km restantes</p>
              </div>
            </div>

            {/* Sensores IoT da Carga */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-muted/30 p-1.5 rounded-lg border border-border/40">
                <span className="text-[9px] text-muted-foreground flex items-center justify-center gap-0.5">
                  <Thermometer size={10} className="text-sky-400" /> Temperatura
                </span>
                <span className="text-xs font-black text-sky-400">{cargoTemp}°C</span>
              </div>
              <div className="bg-muted/30 p-1.5 rounded-lg border border-border/40">
                <span className="text-[9px] text-muted-foreground flex items-center justify-center gap-0.5">
                  <Clock size={10} className="text-amber-400" /> Velocidade
                </span>
                <span className="text-xs font-black text-amber-400">{speed} km/h</span>
              </div>
              <div className="bg-muted/30 p-1.5 rounded-lg border border-border/40">
                <span className="text-[9px] text-muted-foreground flex items-center justify-center gap-0.5">
                  <ShieldCheck size={10} className="text-emerald-400" /> Cadeia de Frio
                </span>
                <span className="text-xs font-black text-emerald-400">100% Ok</span>
              </div>
            </div>

            {/* Barra de Progresso do Trajeto */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
                <span>🏥 Farmácia</span>
                <span className="text-emerald-400">{Math.round(progress * 100)}% do trajeto</span>
                <span>🏠 Paciente</span>
              </div>
              <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Inferior: Consulta de CEP & Detalhes do Trajeto */}
      <div className="p-3.5 bg-card/95 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 z-10">
        {/* Origem: Farmácia */}
        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              🏥 Origem: Farmácia Planta y Raíz
            </span>
            <span className="text-[10px] text-muted-foreground">CEP: {originCep}</span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{originAddress}</p>
        </div>

        {/* Destino: Paciente com busca de CEP */}
        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              🏠 Destino: Residência do Paciente
            </span>
            <span className="text-[10px] text-muted-foreground">CEP: {destCep}</span>
          </div>
          <div className="flex gap-1.5">
            <Input
              value={destCep}
              onChange={(e) => setDestCep(e.target.value)}
              placeholder="Digite o CEP de entrega"
              className="h-7 text-xs rounded-lg font-mono bg-card"
            />
            <Button
              size="sm"
              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
              disabled={searchingCep}
              onClick={() => handleLookupCep(destCep, false)}
            >
              <Search size={11} className="mr-1" />
              {searchingCep ? "Buscando..." : "Calcular"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full my-4">
      {/* Modo Normal de Janela Média */}
      {mapContent}

      {/* Modal Tela Cheia (Acionado por 2 Cliques ou Botão) */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] max-h-[92vh] p-2 bg-card/95 backdrop-blur-2xl border border-emerald-500/40 rounded-3xl overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Rastreamento de Medicamento via Satélite em Tela Cheia</DialogTitle>
          <DialogDescription className="sr-only">Acompanhe a saída e a chegada do medicamento com mapa via satélite estilo Uber.</DialogDescription>
          <div className="flex-1 w-full h-full">
            {mapContent}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
