import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle_type: "furgao_refrigerado" | "carro" | "moto" | "bicicleta_eletrica";
  vehicle_model: string;
  vehicle_plate: string;
  rating: number;
  total_deliveries: number;
  is_active: boolean;
  current_lat?: number;
  current_lng?: number;
}

export interface DeliveryOrder {
  id: string;
  tracking_code: string;
  patient_name: string;
  patient_phone?: string;
  patient_cep: string;
  patient_address: string;
  patient_coords: [number, number];
  pharmacy_name: string;
  pharmacy_cep: string;
  pharmacy_address: string;
  pharmacy_coords: [number, number];
  medicine_name: string;
  medicine_batch: string;
  temperature_celsius: number;
  courier_id: string;
  courier_name: string;
  courier_phone: string;
  courier_vehicle: string;
  courier_plate: string;
  status: "preparando" | "em_rota" | "proximo" | "entregue";
  progress_pct: number; // 0 to 1
  distance_km: number;
  eta_minutes: number;
  speed_kmh: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_COURIERS: Courier[] = [
  {
    id: "courier-1",
    name: "Carlos Eduardo Silva",
    phone: "11998765432",
    vehicle_type: "furgao_refrigerado",
    vehicle_model: "Mercedes Sprinter Crio-Pharma",
    vehicle_plate: "PYR-4Z26",
    rating: 4.98,
    total_deliveries: 342,
    is_active: true
  },
  {
    id: "courier-2",
    name: "Marcos Vinícius Santos",
    phone: "11987654321",
    vehicle_type: "moto",
    vehicle_model: "Honda PCX Baú Isotérmico",
    vehicle_plate: "PLT-8X19",
    rating: 4.95,
    total_deliveries: 218,
    is_active: true
  },
  {
    id: "courier-3",
    name: "Juliana Mendes Costa",
    phone: "11976543210",
    vehicle_type: "carro",
    vehicle_model: "Renault Kangoo Maxi Refrigerada",
    vehicle_plate: "MED-3K44",
    rating: 5.0,
    total_deliveries: 189,
    is_active: true
  }
];

const DEFAULT_DELIVERY: DeliveryOrder = {
  id: "deliv-001",
  tracking_code: "PYR-SAT-984210-BR",
  patient_name: "Paciente Planta y Raíz",
  patient_phone: "11991363154",
  patient_cep: "04571-010",
  patient_address: "Av. Eng. Luís Carlos Berrini, 1200 - Brooklin, São Paulo - SP",
  patient_coords: [-23.6068, -46.6968],
  pharmacy_name: "Farmácia Planta y Raíz Ltda",
  pharmacy_cep: "01310-100",
  pharmacy_address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
  pharmacy_coords: [-23.5654, -46.6515],
  medicine_name: "Epidiolex / Canabidiol 100 mg/mL",
  medicine_batch: "LT-2026-CBD-08",
  temperature_celsius: 4.2,
  courier_id: "courier-1",
  courier_name: "Carlos Eduardo Silva",
  courier_phone: "11998765432",
  courier_vehicle: "Mercedes Sprinter Crio-Pharma",
  courier_plate: "PYR-4Z26",
  status: "em_rota",
  progress_pct: 0.45,
  distance_km: 9.4,
  eta_minutes: 18,
  speed_kmh: 48,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export function useDeliveryTracking() {
  const { toast } = useToast();
  const [couriers, setCouriers] = useState<Courier[]>(() => {
    try {
      const saved = localStorage.getItem("pyr_couriers");
      return saved ? JSON.parse(saved) : DEFAULT_COURIERS;
    } catch {
      return DEFAULT_COURIERS;
    }
  });

  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(() => {
    try {
      const saved = localStorage.getItem("pyr_deliveries");
      return saved ? JSON.parse(saved) : [DEFAULT_DELIVERY];
    } catch {
      return [DEFAULT_DELIVERY];
    }
  });

  const [activeDelivery, setActiveDelivery] = useState<DeliveryOrder>(deliveries[0] || DEFAULT_DELIVERY);

  // Persistir mudanças
  useEffect(() => {
    try {
      localStorage.setItem("pyr_couriers", JSON.stringify(couriers));
    } catch (e) {
      console.error(e);
    }
  }, [couriers]);

  useEffect(() => {
    try {
      localStorage.setItem("pyr_deliveries", JSON.stringify(deliveries));
    } catch (e) {
      console.error(e);
    }
  }, [deliveries]);

  // Cadastrar Novo Entregador
  const addCourier = (data: Omit<Courier, "id" | "rating" | "total_deliveries" | "is_active">) => {
    const newCourier: Courier = {
      ...data,
      id: `courier-${Date.now()}`,
      rating: 5.0,
      total_deliveries: 0,
      is_active: true
    };

    setCouriers((prev) => [newCourier, ...prev]);
    toast({
      title: "🛵 Entregador Cadastrado!",
      description: `${newCourier.name} foi adicionado à equipe de entregas da farmácia.`
    });
    return newCourier;
  };

  // Cadastrar Nova Entrega / Despacho
  const createDelivery = async (params: {
    patient_name: string;
    patient_phone?: string;
    patient_cep: string;
    patient_address: string;
    medicine_name: string;
    medicine_batch?: string;
    courier_id: string;
    target_temp?: number;
  }) => {
    const selectedCourier = couriers.find((c) => c.id === params.courier_id) || couriers[0];

    // Geocodificação rápida de coordenadas
    let patientLat = -23.6068;
    let patientLng = -46.6968;

    try {
      const cleanCep = params.patient_cep.replace(/\D/g, "");
      if (cleanCep.length === 8) {
        const viacepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const viacepData = await viacepRes.json();
        if (!viacepData.erro) {
          const q = `${viacepData.logradouro || ""}, ${viacepData.localidade || ""}, ${viacepData.uf || ""}, Brasil`;
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            patientLat = parseFloat(geoData[0].lat);
            patientLng = parseFloat(geoData[0].lon);
          }
        }
      }
    } catch {
      // Fallback
    }

    const codeNumber = Math.floor(100000 + Math.random() * 900000);
    const trackingCode = `PYR-SAT-${codeNumber}-BR`;

    const newDelivery: DeliveryOrder = {
      id: `deliv-${Date.now()}`,
      tracking_code: trackingCode,
      patient_name: params.patient_name,
      patient_phone: params.patient_phone || "",
      patient_cep: params.patient_cep,
      patient_address: params.patient_address,
      patient_coords: [patientLat, patientLng],
      pharmacy_name: "Farmácia Planta y Raíz Ltda",
      pharmacy_cep: "01310-100",
      pharmacy_address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
      pharmacy_coords: [-23.5654, -46.6515],
      medicine_name: params.medicine_name,
      medicine_batch: params.medicine_batch || `LT-${new Date().getFullYear()}-CBD-${Math.floor(10 + Math.random() * 90)}`,
      temperature_celsius: params.target_temp || 4.2,
      courier_id: selectedCourier.id,
      courier_name: selectedCourier.name,
      courier_phone: selectedCourier.phone,
      courier_vehicle: selectedCourier.vehicle_model,
      courier_plate: selectedCourier.vehicle_plate,
      status: "em_rota",
      progress_pct: 0.1,
      distance_km: 8.5,
      eta_minutes: 22,
      speed_kmh: 45,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setDeliveries((prev) => [newDelivery, ...prev]);
    setActiveDelivery(newDelivery);

    toast({
      title: "🚀 Entrega Despachada com Sucesso!",
      description: `Código de Rastreio Satélite: ${trackingCode}. O motorista ${selectedCourier.name} já iniciou a rota.`
    });

    return newDelivery;
  };

  // Atualizar Status da Entrega pelo Entregador ou Farmácia
  const updateDeliveryStatus = (deliveryId: string, newStatus: DeliveryOrder["status"], newProgress?: number) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === deliveryId) {
          const updated = {
            ...d,
            status: newStatus,
            progress_pct: newProgress !== undefined ? newProgress : newStatus === "entregue" ? 1.0 : d.progress_pct,
            updated_at: new Date().toISOString()
          };
          if (activeDelivery.id === deliveryId) {
            setActiveDelivery(updated);
          }
          return updated;
        }
        return d;
      })
    );

    toast({
      title: "📡 Status de Rastreio Atualizado!",
      description: `Entrega ${deliveryId} agora está em: ${newStatus.replace('_', ' ').toUpperCase()}`
    });
  };

  return {
    couriers,
    deliveries,
    activeDelivery,
    setActiveDelivery,
    addCourier,
    createDelivery,
    updateDeliveryStatus
  };
}
