import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  MapPin, 
  Navigation, 
  UserPlus, 
  PackagePlus, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Maximize2,
  ShieldCheck,
  Search,
  Clock,
  Thermometer
} from "lucide-react";
import { MedicamentoSatelliteTracker } from "./MedicamentoSatelliteTracker";
import { useDeliveryTracking, Courier } from "@/hooks/useDeliveryTracking";
import { useToast } from "@/hooks/use-toast";

interface RastreioPedidoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPharmacy?: boolean;
  patientName?: string;
  patientAddress?: string;
}

export function RastreioPedidoModal({
  open,
  onOpenChange,
  isPharmacy = true,
  patientName = "Paciente Planta y Raíz",
  patientAddress = "Av. Eng. Luís Carlos Berrini, 1200 - Brooklin, São Paulo - SP"
}: RastreioPedidoModalProps) {
  const { toast } = useToast();
  const {
    couriers,
    deliveries,
    activeDelivery,
    setActiveDelivery,
    addCourier,
    createDelivery,
    updateDeliveryStatus
  } = useDeliveryTracking();

  const [activeTab, setActiveTab] = useState<string>("mapa");

  // Form: Cadastrar Entregador
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [vehicleType, setVehicleType] = useState<Courier["vehicle_type"]>("furgao_refrigerado");
  const [vehicleModel, setVehicleModel] = useState("Mercedes Sprinter Crio-Pharma");
  const [vehiclePlate, setVehiclePlate] = useState("");

  // Form: Nova Entrega
  const [newPatientName, setNewPatientName] = useState(patientName);
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientCep, setNewPatientCep] = useState("04571-010");
  const [newPatientAddress, setNewPatientAddress] = useState(patientAddress);
  const [newMedicineName, setNewMedicineName] = useState("Epidiolex / Canabidiol 100 mg/mL");
  const [newMedicineBatch, setNewMedicineBatch] = useState("LT-2026-CBD-08");
  const [selectedCourierId, setSelectedCourierId] = useState(couriers[0]?.id || "");
  const [loadingCep, setLoadingCep] = useState(false);

  // Buscar CEP automaticamente no formulário de entrega
  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      setLoadingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const formatted = `${data.logradouro ? data.logradouro + ", " : ""}${data.bairro ? data.bairro + " - " : ""}${data.localidade} - ${data.uf}`;
        setNewPatientAddress(formatted);
        toast({ title: "Endereço localizado!", description: formatted });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCep(false);
    }
  };

  // Submeter Novo Entregador
  const handleAddCourierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName || !courierPhone || !vehiclePlate) {
      toast({ title: "Preencha todos os campos", description: "Nome, WhatsApp e Placa são obrigatórios.", variant: "destructive" });
      return;
    }

    addCourier({
      name: courierName,
      phone: courierPhone,
      vehicle_type: vehicleType,
      vehicle_model: vehicleModel,
      vehicle_plate: vehiclePlate
    });

    setCourierName("");
    setCourierPhone("");
    setVehiclePlate("");
    setActiveTab("nova-entrega");
  };

  // Submeter Nova Entrega
  const handleCreateDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientCep || !newMedicineName) {
      toast({ title: "Campos obrigatórios", description: "Preencha o nome do paciente, CEP e medicamento.", variant: "destructive" });
      return;
    }

    const created = await createDelivery({
      patient_name: newPatientName,
      patient_phone: newPatientPhone,
      patient_cep: newPatientCep,
      patient_address: newPatientAddress,
      medicine_name: newMedicineName,
      medicine_batch: newMedicineBatch,
      courier_id: selectedCourierId || couriers[0]?.id
    });

    setActiveDelivery(created);
    setActiveTab("mapa");
  };

  const driverShareLink = `${window.location.origin}/entregador?tracking=${activeDelivery.tracking_code}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[94vh] p-4 sm:p-6 bg-card/98 backdrop-blur-2xl border border-emerald-500/40 rounded-3xl overflow-y-auto shadow-2xl">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-display font-black text-foreground flex items-center gap-2">
                <Truck className="text-emerald-400" size={22} /> Central de Rastreamento de Pedido & Entregas
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Rastreamento via Satélite Estilo Uber • Farmácia Planta y Raíz & Paciente Integrados
              </DialogDescription>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold">
              <ShieldCheck size={13} className="mr-1 inline" /> Cadeia de Frio ANVISA Monitorada
            </Badge>
          </div>
        </DialogHeader>

        {/* Abas da Central */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 bg-muted/60 p-1 rounded-2xl border border-border">
            <TabsTrigger value="mapa" className="rounded-xl font-bold text-xs">
              <Navigation size={13} className="mr-1.5 inline text-emerald-400" /> Mapa ao Vivo
            </TabsTrigger>
            {isPharmacy && (
              <>
                <TabsTrigger value="nova-entrega" className="rounded-xl font-bold text-xs">
                  <PackagePlus size={13} className="mr-1.5 inline text-emerald-400" /> Despachar Pedido
                </TabsTrigger>
                <TabsTrigger value="cadastrar-entregador" className="rounded-xl font-bold text-xs">
                  <UserPlus size={13} className="mr-1.5 inline text-emerald-400" /> Cadastrar Entregador
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="painel-motorista" className="rounded-xl font-bold text-xs">
              <Phone size={13} className="mr-1.5 inline text-amber-400" /> Tela do Entregador
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* ABA 1: MAPA AO VIVO ESTILO UBER */}
          {/* ============================================================ */}
          <TabsContent value="mapa" className="space-y-4">
            <MedicamentoSatelliteTracker
              initialOriginCep={activeDelivery.pharmacy_cep}
              initialOriginAddress={activeDelivery.pharmacy_address}
              initialDestinationCep={activeDelivery.patient_cep}
              initialDestinationAddress={activeDelivery.patient_address}
              patientName={activeDelivery.patient_name}
              medicineName={activeDelivery.medicine_name}
              orderId={activeDelivery.tracking_code}
              isPharmacyView={isPharmacy}
            />

            {/* Ações Rápidas de Contato e Link do Motorista */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted/20 border border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg">
                  🚗
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{activeDelivery.courier_name}</p>
                  <p className="text-[10px] text-muted-foreground">{activeDelivery.courier_vehicle} • {activeDelivery.courier_plate}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold h-8 rounded-xl border-emerald-500/30 text-emerald-400"
                  onClick={() => {
                    const msg = encodeURIComponent(`Olá ${activeDelivery.courier_name}, sobre a entrega do medicamento ${activeDelivery.medicine_name} (Código: ${activeDelivery.tracking_code})`);
                    window.open(`https://wa.me/55${activeDelivery.courier_phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
                  }}
                >
                  <MessageSquare size={13} className="mr-1.5" /> WhatsApp Entregador
                </Button>
              </div>

              <div className="flex items-center gap-2 sm:justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs font-bold h-8 rounded-xl"
                  onClick={() => {
                    navigator.clipboard.writeText(driverShareLink);
                    toast({ title: "Link copiado!", description: "Link do mapa ao vivo copiado para compartilhar com o paciente ou motorista." });
                  }}
                >
                  <Copy size={13} className="mr-1.5" /> Copiar Link Rastreio
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* ABA 2: DESPACHAR NOVO PEDIDO (FARMÁCIA) */}
          {/* ============================================================ */}
          {isPharmacy && (
            <TabsContent value="nova-entrega" className="space-y-4">
              <form onSubmit={handleCreateDeliverySubmit} className="p-4 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <PackagePlus size={16} className="text-emerald-400" /> Cadastrar Despacho de Medicamento & Gerar Rota Satélite
                  </h3>
                  <span className="text-[10px] text-muted-foreground">Expedição Planta y Raíz</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Seleção do Entregador */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">Selecione o Entregador Credenciado *</Label>
                    <select
                      value={selectedCourierId}
                      onChange={(e) => setSelectedCourierId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-xs text-foreground font-medium focus:ring-1 focus:ring-emerald-500"
                    >
                      {couriers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.vehicle_model} (Placa: {c.vehicle_plate}) ⭐ {c.rating}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nome do Paciente */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nome do Paciente / Destinatário *</Label>
                    <Input
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="h-9 text-xs rounded-xl"
                      required
                    />
                  </div>

                  {/* WhatsApp do Paciente */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">WhatsApp do Paciente</Label>
                    <Input
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value)}
                      placeholder="Ex: 11991363154"
                      className="h-9 text-xs rounded-xl font-mono"
                    />
                  </div>

                  {/* CEP do Paciente */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">CEP de Entrega *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newPatientCep}
                        onChange={(e) => {
                          setNewPatientCep(e.target.value);
                          if (e.target.value.replace(/\D/g, "").length === 8) {
                            handleCepLookup(e.target.value);
                          }
                        }}
                        placeholder="Ex: 04571-010"
                        className="h-9 text-xs rounded-xl font-mono"
                        required
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs font-bold rounded-xl"
                        onClick={() => handleCepLookup(newPatientCep)}
                        disabled={loadingCep}
                      >
                        <Search size={12} className="mr-1" />
                        {loadingCep ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>
                  </div>

                  {/* Endereço Completo */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Endereço Completo de Entrega *</Label>
                    <Input
                      value={newPatientAddress}
                      onChange={(e) => setNewPatientAddress(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                      className="h-9 text-xs rounded-xl"
                      required
                    />
                  </div>

                  {/* Medicamento */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Medicamento a Despachar *</Label>
                    <Input
                      value={newMedicineName}
                      onChange={(e) => setNewMedicineName(e.target.value)}
                      placeholder="Ex: Óleo CBD Full Spectrum 3000mg"
                      className="h-9 text-xs rounded-xl"
                      required
                    />
                  </div>

                  {/* Lote */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Lote Farmacêutico / Laudo COA</Label>
                    <Input
                      value={newMedicineBatch}
                      onChange={(e) => setNewMedicineBatch(e.target.value)}
                      placeholder="Ex: LT-2026-CBD-08"
                      className="h-9 text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-lg shadow-emerald-950/20"
                  >
                    <Navigation size={14} className="mr-2" /> Iniciar Rastreamento Satélite & Despachar
                  </Button>
                </div>
              </form>
            </TabsContent>
          )}

          {/* ============================================================ */}
          {/* ABA 3: CADASTRAR ENTREGADOR (FARMÁCIA) */}
          {/* ============================================================ */}
          {isPharmacy && (
            <TabsContent value="cadastrar-entregador" className="space-y-4">
              <form onSubmit={handleAddCourierSubmit} className="p-4 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <UserPlus size={16} className="text-emerald-400" /> Cadastrar Novo Entregador / Motorista
                  </h3>
                  <span className="text-[10px] text-muted-foreground">Equipe Logística Planta y Raíz</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nome Completo do Entregador *</Label>
                    <Input
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="Ex: Ricardo Oliveira"
                      className="h-9 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">WhatsApp do Entregador *</Label>
                    <Input
                      value={courierPhone}
                      onChange={(e) => setCourierPhone(e.target.value)}
                      placeholder="Ex: 11988887777"
                      className="h-9 text-xs rounded-xl font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Tipo de Veículo *</Label>
                    <select
                      value={vehicleType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setVehicleType(val);
                        if (val === "furgao_refrigerado") setVehicleModel("Mercedes Sprinter Crio-Pharma");
                        else if (val === "moto") setVehicleModel("Honda PCX Baú Isotérmico");
                        else if (val === "carro") setVehicleModel("Renault Kangoo Maxi Refrigerada");
                        else setVehicleModel("Bicicleta Elétrica Cargo Crio");
                      }}
                      className="w-full h-9 px-3 rounded-xl bg-muted border border-border text-xs text-foreground font-medium"
                    >
                      <option value="furgao_refrigerado">Furgão Refrigerado (Cadeia de Frio)</option>
                      <option value="carro">Carro com Compartimento Térmico</option>
                      <option value="moto">Moto com Baú Isotérmico</option>
                      <option value="bicicleta_eletrica">Bicicleta Elétrica Cargo</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Modelo do Veículo</Label>
                    <Input
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Ex: Mercedes Sprinter Crio-Pharma"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">Placa do Veículo *</Label>
                    <Input
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                      placeholder="Ex: PYR-4Z26"
                      className="h-9 text-xs rounded-xl font-mono uppercase"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-lg shadow-emerald-950/20"
                  >
                    <UserPlus size={14} className="mr-2" /> Salvar & Ativar Entregador
                  </Button>
                </div>
              </form>

              {/* Lista de Entregadores Cadastrados */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">Entregadores Ativos ({couriers.length}):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {couriers.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm">
                          🛵
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.vehicle_model} • {c.vehicle_plate}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                        ⭐ {c.rating} ({c.total_deliveries} entregas)
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}

          {/* ============================================================ */}
          {/* ABA 4: TELA DO ENTREGADOR (SIMULADOR MOBILE GPS) */}
          {/* ============================================================ */}
          <TabsContent value="painel-motorista" className="space-y-4">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    📱 Painel Mobile do Entregador GPS
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    O entregador abre esta tela no celular com GPS para transmitir localização ao vivo para a farmácia e o paciente.
                  </p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold">
                  Status: {activeDelivery.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Controles de Status pelo Entregador */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  size="sm"
                  variant={activeDelivery.status === "preparando" ? "default" : "outline"}
                  className="text-xs font-bold rounded-xl"
                  onClick={() => updateDeliveryStatus(activeDelivery.id, "preparando", 0.05)}
                >
                  1. Preparando Carga
                </Button>

                <Button
                  size="sm"
                  variant={activeDelivery.status === "em_rota" ? "default" : "outline"}
                  className="text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                  onClick={() => updateDeliveryStatus(activeDelivery.id, "em_rota", 0.50)}
                >
                  2. Saí em Rota 🚗
                </Button>

                <Button
                  size="sm"
                  variant={activeDelivery.status === "proximo" ? "default" : "outline"}
                  className="text-xs font-bold rounded-xl"
                  onClick={() => updateDeliveryStatus(activeDelivery.id, "proximo", 0.85)}
                >
                  3. Cheguei no Endereço
                </Button>

                <Button
                  size="sm"
                  variant={activeDelivery.status === "entregue" ? "default" : "outline"}
                  className="text-xs font-bold rounded-xl bg-green-700 text-white hover:bg-green-600"
                  onClick={() => updateDeliveryStatus(activeDelivery.id, "entregue", 1.0)}
                >
                  4. Entregue com Sucesso ✅
                </Button>
              </div>

              {/* Detalhes da Entrega Atual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground font-bold">Destinatário:</span>
                  <p className="font-semibold text-foreground">{activeDelivery.patient_name}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">{activeDelivery.patient_address}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">Medicamento & Lote:</span>
                  <p className="font-semibold text-emerald-400">{activeDelivery.medicine_name}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5 font-mono">Lote: {activeDelivery.medicine_batch} • 4.2°C</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
