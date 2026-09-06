import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  Phone, 
  ShieldCheck, 
  Thermometer, 
  Clock, 
  ArrowLeft,
  Share2,
  RefreshCw
} from "lucide-react";
import { MedicamentoSatelliteTracker } from "@/components/delivery/MedicamentoSatelliteTracker";
import { useDeliveryTracking } from "@/hooks/useDeliveryTracking";
import { useToast } from "@/hooks/use-toast";

export default function EntregadorGPS() {
  const [searchParams] = useSearchParams();
  const trackingCode = searchParams.get("tracking") || "PYR-SAT-984210-BR";
  const { toast } = useToast();
  const { activeDelivery, updateDeliveryStatus } = useDeliveryTracking();

  const [geoTracking, setGeoTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(null);

  // Iniciar GPS no dispositivo móvel do entregador
  const toggleGps = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS não suportado", description: "Seu navegador não suporta geolocalização.", variant: "destructive" });
      return;
    }

    if (!geoTracking) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords([pos.coords.latitude, pos.coords.longitude]);
          setGeoTracking(true);
          toast({ title: "📡 GPS Ativado!", description: "Transmitindo sua localização em tempo real para a farmácia e o paciente." });
        },
        (err) => {
          console.error(err);
          toast({ title: "Permissão de GPS negada", description: "Permita o acesso à sua localização.", variant: "destructive" });
        }
      );
    } else {
      setGeoTracking(false);
      toast({ title: "GPS Pausado" });
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        {/* Header do Motorista */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold">
                📱 Painel do Entregador GPS
              </Badge>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs font-bold">
                {geoTracking ? "🔴 GPS Ao Vivo Transmitindo" : "GPS em Espera"}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground mt-1">
              Rota de Entrega: {trackingCode}
            </h1>
            <p className="text-xs text-muted-foreground">
              Motorista: <strong>{activeDelivery.courier_name}</strong> • {activeDelivery.courier_vehicle} ({activeDelivery.courier_plate})
            </p>
          </div>

          <Button
            size="sm"
            onClick={toggleGps}
            className={`font-bold text-xs rounded-xl shadow-lg ${
              geoTracking 
                ? "bg-rose-600 hover:bg-rose-500 text-white" 
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            <Navigation size={14} className="mr-1.5" />
            {geoTracking ? "Pausar Transmissão GPS" : "Iniciar Transmissão GPS"}
          </Button>
        </div>

        {/* Mapa Interativo em Tempo Real */}
        <div className="mb-6">
          <MedicamentoSatelliteTracker
            initialOriginCep={activeDelivery.pharmacy_cep}
            initialOriginAddress={activeDelivery.pharmacy_address}
            initialDestinationCep={activeDelivery.patient_cep}
            initialDestinationAddress={activeDelivery.patient_address}
            patientName={activeDelivery.patient_name}
            medicineName={activeDelivery.medicine_name}
            orderId={activeDelivery.tracking_code}
            isPharmacyView={true}
          />
        </div>

        {/* Painel de Ações do Motorista */}
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Atualizar Etapa da Entrega</span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                Status: {activeDelivery.status.replace('_', ' ').toUpperCase()}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Toque no botão correspondente para notificar automaticamente a farmácia e o paciente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant={activeDelivery.status === "preparando" ? "default" : "outline"}
                className="text-xs font-bold h-11 rounded-xl"
                onClick={() => updateDeliveryStatus(activeDelivery.id, "preparando", 0.05)}
              >
                1. Retirado na Farmácia
              </Button>

              <Button
                variant={activeDelivery.status === "em_rota" ? "default" : "outline"}
                className="text-xs font-bold h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                onClick={() => updateDeliveryStatus(activeDelivery.id, "em_rota", 0.50)}
              >
                2. Em Trânsito 🚗
              </Button>

              <Button
                variant={activeDelivery.status === "proximo" ? "default" : "outline"}
                className="text-xs font-bold h-11 rounded-xl"
                onClick={() => updateDeliveryStatus(activeDelivery.id, "proximo", 0.85)}
              >
                3. Próximo ao Local
              </Button>

              <Button
                variant={activeDelivery.status === "entregue" ? "default" : "outline"}
                className="text-xs font-bold h-11 rounded-xl bg-green-700 text-white hover:bg-green-600"
                onClick={() => updateDeliveryStatus(activeDelivery.id, "entregue", 1.0)}
              >
                4. Entregue com Sucesso ✅
              </Button>
            </div>

            {/* Detalhes do Destinatário */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Destinatário: {activeDelivery.patient_name}</span>
                <span className="text-emerald-400 font-bold">Cadeia de Frio: 4.2°C Ok</span>
              </div>
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin size={12} className="text-amber-400 shrink-0" /> {activeDelivery.patient_address} (CEP: {activeDelivery.patient_cep})
              </p>
              {activeDelivery.patient_phone && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold rounded-xl h-8 border-emerald-500/30 text-emerald-400"
                    onClick={() => window.open(`https://wa.me/55${activeDelivery.patient_phone?.replace(/\D/g, "")}`, "_blank")}
                  >
                    <Phone size={12} className="mr-1.5" /> Chamar Paciente no WhatsApp
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
