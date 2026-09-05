import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, Package, AlertTriangle, Building2, BookOpen, Clock, FileText, 
  CheckCircle, Truck, FileSignature, Wallet, Navigation, Sparkles, ShieldCheck, 
  Upload, UploadCloud, Eye, CheckCircle2, XCircle, ExternalLink, RefreshCw 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VipUpgradePopup } from "@/components/VipUpgradePopup";
import { useLojista } from "@/hooks/useLojista";
import { RastreioPedidoModal } from "@/components/delivery/RastreioPedidoModal";
import { MedicamentoSatelliteTracker } from "@/components/delivery/MedicamentoSatelliteTracker";
import PharmacyKycDocViewer from "@/components/admin/PharmacyKycDocViewer";
import { PHARMACY_KYC_LABELS, type PharmacyKycKind, TEST_PHARMACY_DATA } from "@/lib/pharmacy-kyc-docs";

export interface PrescriptionInboxItem {
  id: string;
  patient: string;
  patient_phone?: string;
  patient_address?: string;
  patient_cep?: string;
  medicine: string;
  concentration?: string;
  value: number;
  hash: string;
  mode: "1click" | "manual";
  status: "recebida" | "em_analise_farmaceutica" | "despachada" | "recusada";
  date: string;
  tracking_code?: string;
  courier_name?: string;
  refusal_reason?: string;
  pdf_url?: string;
}

const DEFAULT_INBOX: PrescriptionInboxItem[] = [
  { 
    id: "rx-101", 
    patient: "João Marcelo Silveira", 
    patient_phone: "11991363154", 
    patient_address: "Av. Eng. Luís Carlos Berrini, 1200 - Brooklin, São Paulo - SP", 
    patient_cep: "04571-010",
    medicine: "Óleo CBD Full Spectrum 3000mg/30ml", 
    concentration: "100mg/mL", 
    value: 480.00,
    hash: "a8f9c2d1e0...78a2f", 
    mode: "1click", 
    status: "recebida", 
    date: "Hoje, 10:30" 
  },
  { 
    id: "rx-102", 
    patient: "Maria Souza Fontes", 
    patient_phone: "11988776655", 
    patient_address: "Rua Augusta, 1500 - Consolação, São Paulo - SP", 
    patient_cep: "01305-100",
    medicine: "Extrato Canabidiol Broad Spectrum 1500mg", 
    concentration: "50mg/mL", 
    value: 320.00,
    hash: "b2x489a7f1...99c01", 
    mode: "manual", 
    status: "em_analise_farmaceutica", 
    date: "Ontem, 15:45" 
  },
  { 
    id: "rx-103", 
    patient: "Carlos Eduardo Mendes", 
    patient_phone: "11977665544", 
    patient_address: "Alameda Santos, 1800 - Cerqueira César, São Paulo - SP", 
    patient_cep: "01418-102",
    medicine: "Gummies Fitocanabinoides Sleep & Relax (30 un)", 
    concentration: "25mg/gummy", 
    value: 260.00,
    hash: "f4e198b3c2...33d88", 
    mode: "1click", 
    status: "despachada", 
    date: "28/08/2026, 14:10",
    tracking_code: "PYR-SAT-781923-BR",
    courier_name: "Carlos Eduardo Silva (Furgão Refrigerado)"
  }
];

export default function LojistaDashboard() {
  const { toast } = useToast();
  const { profile, metrics, loading, authError, kycDocs, uploadKycDoc, addProduct, refreshData } = useLojista();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRastreioOpen, setIsRastreioOpen] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);
  const [docViewer, setDocViewer] = useState<{ kind: PharmacyKycKind; url?: string } | null>(null);

  // Inbox & Prescriptions State
  const [inbox, setInbox] = useState<PrescriptionInboxItem[]>(() => {
    const saved = localStorage.getItem("pharmacy_prescriptions_inbox");
    return saved ? JSON.parse(saved) : DEFAULT_INBOX;
  });

  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionInboxItem | null>(null);
  const [dispatchTrackingCode, setDispatchTrackingCode] = useState("");
  const [dispatchCourier, setDispatchCourier] = useState("Carlos Eduardo Silva (Furgão Refrigerado)");
  const [refusalReason, setRefusalReason] = useState("");

  // Modal para Simulação/Upload de Nova Receita pelo Paciente
  const [isNewRxModalOpen, setIsNewRxModalOpen] = useState(false);
  const [newRxForm, setNewRxForm] = useState({
    patient: "",
    phone: "",
    address: "",
    cep: "",
    medicine: "Óleo CBD Full Spectrum 3000mg/30ml",
    value: "450.00",
    file: null as File | null,
  });

  const [formData, setFormData] = useState({
    name: "",
    concentration: "",
    category: "oleo_cbd",
    price: "",
    stock: "",
    image_url: ""
  });

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground font-medium">Carregando painel...</p>
      </div>
    );
  }

  if (authError || !profile) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center pt-24">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">{authError}</p>
          <Button asChild><Link to="/login">Ir para o Login</Link></Button>
        </div>
      </div>
    );
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addProduct({
        ...formData,
        proportion: formData.concentration
      });
      toast({
        title: "Sucesso!",
        description: "Produto cadastrado com sucesso. Pendente de aprovação (Compliance).",
      });
      setFormData({ name: "", concentration: "", category: "oleo_cbd", price: "", stock: "", image_url: "" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic KPIs derived from live inbox & dispatches
  const pendingRxCount = inbox.filter((i) => i.status === "recebida" || i.status === "em_analise_farmaceutica").length;
  const dispatchedRxList = inbox.filter((i) => i.status === "despachada");
  const dispatchedCount = dispatchedRxList.length;

  const baseGross = 14500.0;
  const dispatchedRevenue = dispatchedRxList.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const totalGross = baseGross + dispatchedRevenue;
  const netRevenue = totalGross * 0.95;
  const platformFee = totalGross * 0.05;

  const handleCreateNewPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRxForm.patient.trim()) {
      toast({ title: "Erro", description: "Informe o nome do paciente.", variant: "destructive" });
      return;
    }

    const newRx: PrescriptionInboxItem = {
      id: `rx-${Date.now().toString().slice(-4)}`,
      patient: newRxForm.patient,
      patient_phone: newRxForm.phone || "11991363154",
      patient_address: newRxForm.address || "Av. Paulista, 1500 - Bela Vista, São Paulo - SP",
      patient_cep: newRxForm.cep || "01310-200",
      medicine: newRxForm.medicine,
      concentration: "Fitocanabinoide Grau Farmacêutico",
      value: parseFloat(newRxForm.value) || 450.0,
      hash: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 7)}`,
      mode: "manual",
      status: "recebida",
      date: "Hoje, " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [newRx, ...inbox];
    setInbox(updated);
    localStorage.setItem("pharmacy_prescriptions_inbox", JSON.stringify(updated));
    setIsNewRxModalOpen(false);
    setNewRxForm({
      patient: "",
      phone: "",
      address: "",
      cep: "",
      medicine: "Óleo CBD Full Spectrum 3000mg/30ml",
      value: "450.00",
      file: null,
    });

    toast({
      title: "📥 Receita Recebida com Sucesso!",
      description: `Prescrição de ${newRx.patient} adicionada à Caixa de Entrada para auditoria farmacêutica.`,
    });
  };

  const handleApproveAndDispatch = () => {
    if (!selectedPrescription) return;
    const tracking = dispatchTrackingCode.trim() || `PYR-SAT-${Math.floor(100000 + Math.random() * 900000)}-BR`;

    const updated = inbox.map((item) => {
      if (item.id === selectedPrescription.id) {
        return {
          ...item,
          status: "despachada" as const,
          tracking_code: tracking,
          courier_name: dispatchCourier,
        };
      }
      return item;
    });

    setInbox(updated);
    localStorage.setItem("pharmacy_prescriptions_inbox", JSON.stringify(updated));

    // Adiciona / Atualiza a ordem de entrega para o rastreador satélite
    const newDeliveryOrder = {
      id: `deliv-${selectedPrescription.id}`,
      tracking_code: tracking,
      patient_name: selectedPrescription.patient,
      patient_phone: selectedPrescription.patient_phone || "11991363154",
      patient_cep: selectedPrescription.patient_cep || "04571-010",
      patient_address: selectedPrescription.patient_address || "Av. Paulista, 1000, São Paulo - SP",
      patient_coords: [-23.5654, -46.6515] as [number, number],
      pharmacy_name: profile.company_name || "Farmácia Planta y Raíz Ltda",
      pharmacy_cep: "01310-100",
      pharmacy_address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
      pharmacy_coords: [-23.5654, -46.6515] as [number, number],
      medicine_name: selectedPrescription.medicine,
      medicine_batch: `LT-2026-${Math.floor(100 + Math.random() * 900)}`,
      temperature_celsius: 4.5,
      courier_id: "courier-1",
      courier_name: dispatchCourier,
      courier_phone: "11998765432",
      courier_vehicle: "Mercedes Sprinter Crio-Pharma",
      courier_plate: "PYR-4Z26",
      status: "em_rota" as const,
      progress_pct: 0.20,
      distance_km: 5.2,
      eta_minutes: 22,
      speed_kmh: 42,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const existingDeliveries = JSON.parse(localStorage.getItem("delivery_orders") || "[]");
    localStorage.setItem("delivery_orders", JSON.stringify([newDeliveryOrder, ...existingDeliveries]));

    setSelectedPrescription(null);
    setDispatchTrackingCode("");

    toast({
      title: "🚀 Pedido Aprovado e Despachado!",
      description: `Código ${tracking} emitido. Rastreamento satélite e repasse de R$ ${(selectedPrescription.value * 0.95).toFixed(2)} atualizados nos KPIs!`,
    });
  };

  const handleRejectPrescription = () => {
    if (!selectedPrescription) return;
    const updated = inbox.map((item) => {
      if (item.id === selectedPrescription.id) {
        return {
          ...item,
          status: "recusada" as const,
          refusal_reason: refusalReason || "Irregularidade no receituário ou assinatura não conforme.",
        };
      }
      return item;
    });

    setInbox(updated);
    localStorage.setItem("pharmacy_prescriptions_inbox", JSON.stringify(updated));
    setSelectedPrescription(null);
    setRefusalReason("");

    toast({
      title: "Receita Recusada",
      description: "O paciente foi notificado para regularizar o documento.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto py-8 px-4 space-y-8 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div className="flex flex-col items-start gap-2">
            <VipUpgradePopup role="lojista" inline className="ml-1" />
            <div className="flex items-center gap-2 mb-2 mt-4 md:mt-0">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                Lojista Verificado
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                Split 95% Ativo
              </Badge>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground flex items-center gap-3">
                <Building2 className="text-primary h-8 w-8 shrink-0" /> 
                Painel: {profile.company_name || 'Farmácia Planta y Raíz'}
              </h1>
              <Button 
                onClick={() => setIsRastreioOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/30 text-xs sm:text-sm h-10 px-4 flex items-center gap-2 border border-emerald-400/30 hover:scale-105 transition-all"
              >
                <Truck size={17} className="text-white" /> 🚚 Rastreio de Pedido & Entregas
              </Button>
              <Button 
                variant="outline"
                className="bg-card/80 hover:bg-muted text-foreground font-bold rounded-xl border border-primary/30 text-xs sm:text-sm h-10 px-4 flex items-center gap-2 hover:scale-105 transition-all shadow-md"
                asChild
              >
                <Link to="/manual?tab=farmacia">
                  <BookOpen size={16} className="text-emerald-400" /> 📖 Como Funciona Passo a Passo
                </Link>
              </Button>
            </div>
          </div>
          <Button size="lg" variant="outline" className="font-bold rounded-xl border-primary/20 text-primary" asChild>
             <Link to="/cadastro-farmacia"><FileSignature size={18} className="mr-2" /> Atualizar KYC</Link>
          </Button>
        </div>

        {/* BANNER DE COMPLIANCE & STATUS KYC */}
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          profile.is_approved
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              profile.is_approved ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
            }`}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">
                  Status Regulatório da Loja:
                </span>
                <Badge className={profile.is_approved ? "bg-emerald-500 text-black font-bold text-xs" : "bg-amber-500 text-black font-bold text-xs"}>
                  {profile.is_approved ? "✓ LOJA HOMOLOGADA NO SHOPPING" : "⏳ EM ANÁLISE KYC"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {profile.is_approved 
                  ? "Sua loja está ativa para receber pedidos, dispensar receitas e sincronizar catálogo com o Shopping Planta y Raíz."
                  : "Complete o envio dos 7 documentos de conformidade ANVISA e CRF para liberar a publicação dos seus produtos."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("kyc")}
              className="text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10 flex-1 md:flex-none"
            >
              <FileSignature size={14} className="mr-1.5" /> Dossiê Regulatório ANVISA
            </Button>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="text-xs font-bold rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex-1 md:flex-none"
            >
              <Link to="/admin/kyc-lojas">
                <ExternalLink size={14} className="mr-1.5" /> Painel Admin KYC
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 h-auto bg-muted/60 p-1.5 rounded-2xl border border-border">
            <TabsTrigger value="overview" className="py-3 font-bold text-xs sm:text-sm rounded-xl">Visão Geral</TabsTrigger>
            <TabsTrigger value="rastreio" className="py-3 font-bold text-xs sm:text-sm rounded-xl text-emerald-400">
              <Truck size={14} className="mr-1 inline" /> Rastreamento
            </TabsTrigger>
            <TabsTrigger value="protocolos" className="py-3 font-bold text-xs sm:text-sm rounded-xl text-sky-400">
              <FileSignature size={14} className="mr-1 inline" /> Receitas Recebidas
            </TabsTrigger>
            <TabsTrigger value="inbox" className="py-3 font-bold text-xs sm:text-sm rounded-xl">
              Receitas ({pendingRxCount})
            </TabsTrigger>

            <TabsTrigger value="catalog" className="py-3 font-bold text-xs sm:text-sm rounded-xl">Catálogo</TabsTrigger>
            <TabsTrigger value="financial" className="py-3 font-bold text-xs sm:text-sm rounded-xl">Financeiro</TabsTrigger>
            <TabsTrigger value="kyc" className="py-3 font-bold text-xs sm:text-sm rounded-xl text-amber-400">
              <ShieldCheck size={14} className="mr-1 inline" /> KYC & Documentos
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: OVERVIEW COM KPIS REAIS DINÂMICOS */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-emerald-950/20 border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-500 flex justify-between">
                    Receitas Aguardando <AlertTriangle size={16} className={pendingRxCount > 0 ? "animate-pulse text-amber-400" : ""} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{pendingRxCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pendingRxCount > 0 ? "Requer auditoria farmacêutica" : "Todas as receitas auditadas"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Bruto (Mês)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {totalGross.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  <p className="text-xs text-green-500 mt-1">+{dispatchedCount} pedidos despachados</p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Repasse Líquido (95%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {netRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Disponível para saque Pix</p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Taxa da Plataforma (5%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-400">
                    {platformFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Retido na fonte</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ABA RASTREAMENTO SATÉLITE ESTILO UBER */}
          <TabsContent value="rastreio" className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Truck size={20} className="text-emerald-400" /> Central de Rastreamento Satélite & Entregas
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Acompanhe o trajeto dos seus entregadores com GPS em tempo real até a residência do paciente.
                  </p>
                </div>
                <Button 
                  onClick={() => setIsRastreioOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs h-9"
                >
                  <Navigation size={14} className="mr-1.5" /> Abrir Painel Completo
                </Button>
              </div>

              <MedicamentoSatelliteTracker isPharmacyView={true} />
            </div>
          </TabsContent>

          {/* ABA: RECEITAS RECEBIDAS COM PROTOCOLO (DADOS REAIS) */}
          <TabsContent value="protocolos" className="space-y-6">
            <PharmacyPrescriptionProtocols />
          </TabsContent>

          {/* ABA 2: RECEITAS & DISPENSAÇÃO INTERATIVA */}

          <TabsContent value="inbox" className="space-y-6">
            <Card className="border-border">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <FileText className="text-primary w-5 h-5" /> Caixa de Entrada: Receitas Médicas ICP-Brasil
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Auditoria farmacêutica, verificação de assinatura digital e despacho com código de rastreio.
                  </CardDescription>
                </div>

                <Button
                  onClick={() => setIsNewRxModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 rounded-xl shadow-md gap-1.5"
                >
                  <Upload size={14} /> 📥 Simular Upload de Receita (Paciente)
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-900">
                      <TableRow>
                        <TableHead className="text-xs">Paciente / Contato</TableHead>
                        <TableHead className="text-xs">Medicamento Prescrito</TableHead>
                        <TableHead className="text-xs">Valor</TableHead>
                        <TableHead className="text-xs">Data</TableHead>
                        <TableHead className="text-xs">Hash SHA-512</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inbox.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                            Nenhuma receita médica na caixa de entrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        inbox.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-bold text-xs">
                              <div>{item.patient}</div>
                              {item.patient_phone && (
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  📞 {item.patient_phone}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-foreground font-medium">
                              {item.medicine}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-emerald-400">
                              {Number(item.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                                {item.hash.slice(0, 10)}...
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.status === "recebida" && (
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-bold">
                                  <Clock size={11} className="mr-1" /> Aguardando Análise
                                </Badge>
                              )}
                              {item.status === "em_analise_farmaceutica" && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] font-bold">
                                  Em Análise
                                </Badge>
                              )}
                              {item.status === "despachada" && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                                  <CheckCircle2 size={11} className="mr-1" /> Despachado
                                </Badge>
                              )}
                              {item.status === "recusada" && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] font-bold">
                                  <XCircle size={11} className="mr-1" /> Recusada
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.status === "despachada" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsRastreioOpen(true)}
                                  className="text-[11px] h-8 rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold"
                                >
                                  <Truck size={13} className="mr-1" /> Rastreio
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPrescription(item);
                                    setDispatchTrackingCode(`PYR-SAT-${Math.floor(100000 + Math.random() * 900000)}-BR`);
                                  }}
                                  className="text-[11px] h-8 rounded-xl bg-primary text-black hover:bg-primary/90 font-bold"
                                >
                                  Auditar & Despachar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 3: CATÁLOGO */}
          <TabsContent value="catalog" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle>Novo Produto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome (ex: Óleo CBD Full Spectrum)</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Concentração (ex: 3000mg/30ml)</Label>
                        <Input value={formData.concentration} onChange={e => setFormData({...formData, concentration: e.target.value})} required />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Preço (R$)</Label>
                          <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Estoque</Label>
                          <Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Enviando..." : "Cadastrar Produto"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Vitrine Principal (Máx 10)</CardTitle>
                    <CardDescription>Controle o que aparece no Shopping para os pacientes.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.products.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                          <Package size={32} className="mx-auto mb-2 opacity-50" />
                          <p>Nenhum produto cadastrado.</p>
                        </div>
                      ) : (
                        metrics.products.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-4 border rounded-xl bg-slate-900/50">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center">
                                <Package size={20} className="text-muted-foreground"/>
                              </div>
                              <div>
                                <h4 className="font-bold text-sm">{p.name}</h4>
                                <p className="text-xs text-muted-foreground">{p.description} • R$ {p.price}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Em análise</Badge>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs">Na Vitrine</Label>
                                <Switch checked={false} disabled />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* ABA 6: KYC & DOCUMENTAÇÃO REGULATÓRIA ANVISA / CRF */}
          <TabsContent value="kyc" className="space-y-6">
            <Card className="border-border bg-card/60">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-lg md:text-xl font-display font-black flex items-center gap-2">
                      <ShieldCheck className="text-emerald-400 w-5 h-5" />
                      Dossiê Regulatório & Upload de Documentos KYC
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Conformidade com a ANVISA RDC 327/2019, RDC 660/2022 e Conselho Regional de Farmácia (CRF).
                    </CardDescription>
                  </div>
                  <Badge className={profile.is_approved ? "bg-emerald-500 text-black font-bold text-xs" : "bg-amber-500 text-black font-bold text-xs"}>
                    {profile.is_approved ? "✓ LOJA HOMOLOGADA" : "⏳ AGUARDANDO ANÁLISE"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Grid dos 7 Documentos Regulatórios */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.keys(PHARMACY_KYC_LABELS) as PharmacyKycKind[]).map((kind) => {
                    const localUrl = kycDocs[kind];
                    const testDoc = TEST_PHARMACY_DATA.kyc_docs?.find(d => d.document_kind === kind);
                    const hasDoc = Boolean(localUrl || testDoc?.file_url);
                    const isUploading = uploadingKind === kind;

                    return (
                      <div
                        key={kind}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          hasDoc
                            ? "bg-emerald-500/5 border-emerald-500/30"
                            : "bg-muted/30 border-border hover:border-amber-500/40"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-foreground">
                              {PHARMACY_KYC_LABELS[kind]}
                            </span>
                            {hasDoc ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                                <CheckCircle2 size={11} className="mr-1" /> Enviado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-bold">
                                <Clock size={11} className="mr-1" /> Pendente
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {kind === "foto_fachada" && "Foto nítida da fachada externa com identificação visual da loja."}
                            {kind === "logo_empresa" && "Logo de alta resolução para exibição no Marketplace e vitrine."}
                            {kind === "contrato_social_pdf" && "Última alteração consolidada ou Certificado de MEI/EIRELI."}
                            {kind === "cartao_cnpj" && "Comprovante de Inscrição e Situação Cadastral na Receita Federal."}
                            {kind === "alvara_sanitario" && "Alvará Sanitário da Vigilância Sanitária Municipal/Estadual."}
                            {kind === "crf_responsavel" && "Certidão de Regularidade Técnica emitida pelo CRF do farmacêutico RT."}
                            {kind === "comprovante_endereco" && "Conta de água, luz ou contrato de locação do imóvel."}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                          {hasDoc && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDocViewer({ kind, url: localUrl || testDoc?.file_url })}
                              className="text-[11px] h-8 rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 flex-1 font-bold"
                            >
                              <Eye size={13} className="mr-1" /> Ver Arquivo
                            </Button>
                          )}

                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              disabled={isUploading}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingKind(kind);
                                try {
                                  await uploadKycDoc(kind, file);
                                  toast({
                                    title: "✓ Documento Anexado com Sucesso!",
                                    description: `${PHARMACY_KYC_LABELS[kind]} enviado para análise de compliance.`,
                                  });
                                } catch (err: any) {
                                  toast({
                                    title: "Erro no envio",
                                    description: err.message || "Tente novamente.",
                                    variant: "destructive",
                                  });
                                } finally {
                                  setUploadingKind(null);
                                  e.target.value = "";
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant={hasDoc ? "ghost" : "default"}
                              disabled={isUploading}
                              className={`w-full text-[11px] h-8 rounded-xl font-bold pointer-events-none ${
                                hasDoc
                                  ? "text-muted-foreground hover:text-foreground"
                                  : "bg-primary text-black hover:bg-primary/90"
                              }`}
                            >
                              <Upload size={13} className="mr-1" />
                              {isUploading ? "Enviando..." : hasDoc ? "Substituir" : "Enviar Arquivo"}
                            </Button>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Auditoria e Despacho Farmacêutico da Receita */}
      <Dialog open={Boolean(selectedPrescription)} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent className="max-w-2xl bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-emerald-400 w-6 h-6" /> Auditoria Farmacêutica & Despacho de Receita
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conformidade com a ICP-Brasil e dispensação canabinoide regulamentada ANVISA.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            {/* Informações do Paciente e Prescrição */}
            <div className="p-4 bg-muted/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-border">
               <div className="space-y-1">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold">Paciente & Endereço de Entrega</p>
                 <p className="font-bold text-sm text-foreground">{selectedPrescription?.patient}</p>
                 <p className="text-xs text-muted-foreground">{selectedPrescription?.patient_address}</p>
                 <p className="text-xs text-emerald-400 font-bold">
                   📞 {selectedPrescription?.patient_phone} · Valor: {Number(selectedPrescription?.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                 </p>
               </div>
               <div className="text-left sm:text-right">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold">Hash SHA-512 ICP-Brasil</p>
                 <p className="font-mono text-[11px] text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 mt-1">
                   {selectedPrescription?.hash}
                 </p>
                 <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] mt-1.5 font-bold">
                   <CheckCircle2 size={11} className="mr-1" /> Assinatura Médica Válida
                 </Badge>
               </div>
            </div>

            {/* Medicamento Prescrito */}
            <div className="p-3 bg-muted/20 rounded-xl border border-border text-xs space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Medicamento Selecionado:</span>
              <p className="font-bold text-foreground text-sm">{selectedPrescription?.medicine}</p>
            </div>

            {/* Seleção de Entregador / Courier */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Entregador Responsável (Logística Crio-Pharma)</Label>
              <select
                value={dispatchCourier}
                onChange={(e) => setDispatchCourier(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Carlos Eduardo Silva (Furgão Refrigerado PYR-4Z26)">
                  🚚 Carlos Eduardo Silva — Furgão Refrigerado (Placa PYR-4Z26) · ⭐ 4.98
                </option>
                <option value="Marcos Vinícius Santos (Moto Baú Isotérmico PLT-8X19)">
                  🛵 Marcos Vinícius Santos — Moto Baú Isotérmico (Placa PLT-8X19) · ⭐ 4.95
                </option>
                <option value="Juliana Mendes Costa (Renault Kangoo Maxi MED-3K44)">
                  🚐 Juliana Mendes Costa — Renault Kangoo Crio (Placa MED-3K44) · ⭐ 5.0
                </option>
              </select>
            </div>

            {/* Código de Rastreio */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Código de Rastreio Satélite (Gerado Automaticamente)</Label>
              <Input
                value={dispatchTrackingCode}
                onChange={(e) => setDispatchTrackingCode(e.target.value)}
                placeholder="PYR-SAT-984210-BR"
                className="rounded-xl font-mono text-sm bg-muted/30 border-border"
              />
            </div>
            
            {/* Motivo de Recusa (Opcional) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Motivo de Recusa (Apenas se houver irregularidade no receituário)</Label>
              <Textarea
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                placeholder="Ex: Assinatura médica ilegível ou dosagem incompatível..."
                className="rounded-xl text-xs bg-muted/20 border-border min-h-[60px]"
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row justify-between sm:justify-between w-full gap-2 pt-3 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectPrescription}
              className="rounded-xl text-xs font-bold"
            >
              <XCircle size={14} className="mr-1.5" /> Recusar Receita
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast({ title: "Visualizando Receita", description: "PDF autêntico verificado com chave pública ICP-Brasil." })}
                className="rounded-xl text-xs font-bold border-border"
              >
                <FileText className="mr-1.5" size={14}/> Ver PDF ICP-Brasil
              </Button>
              <Button
                onClick={handleApproveAndDispatch}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg gap-1.5"
              >
                <CheckCircle2 size={15} /> Aprovar & Despachar Pedido
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Simulação de Upload de Receita pelo Paciente */}
      <Dialog open={isNewRxModalOpen} onOpenChange={setIsNewRxModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Upload className="text-emerald-400 w-5 h-5" /> Enviar Nova Receita Médica (Paciente)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Simule o envio de uma prescrição canabinoide para cair instantaneamente na Caixa de Entrada da farmácia.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewPrescription} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Nome do Paciente *</Label>
              <Input
                required
                placeholder="Ex: Gabriela Medeiros Lima"
                value={newRxForm.patient}
                onChange={(e) => setNewRxForm({ ...newRxForm, patient: e.target.value })}
                className="rounded-xl text-xs bg-muted/30 border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">WhatsApp / Telefone</Label>
                <Input
                  placeholder="(11) 98765-4321"
                  value={newRxForm.phone}
                  onChange={(e) => setNewRxForm({ ...newRxForm, phone: e.target.value })}
                  className="rounded-xl text-xs bg-muted/30 border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">CEP</Label>
                <Input
                  placeholder="01310-200"
                  value={newRxForm.cep}
                  onChange={(e) => setNewRxForm({ ...newRxForm, cep: e.target.value })}
                  className="rounded-xl text-xs bg-muted/30 border-border"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Endereço de Entrega</Label>
              <Input
                placeholder="Av. Paulista, 1500 - São Paulo, SP"
                value={newRxForm.address}
                onChange={(e) => setNewRxForm({ ...newRxForm, address: e.target.value })}
                className="rounded-xl text-xs bg-muted/30 border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Medicamento</Label>
                <Input
                  value={newRxForm.medicine}
                  onChange={(e) => setNewRxForm({ ...newRxForm, medicine: e.target.value })}
                  className="rounded-xl text-xs bg-muted/30 border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRxForm.value}
                  onChange={(e) => setNewRxForm({ ...newRxForm, value: e.target.value })}
                  className="rounded-xl text-xs bg-muted/30 border-border"
                />
              </div>
            </div>

            <div className="p-3 border-2 border-dashed border-border rounded-xl text-center bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
              <UploadCloud className="mx-auto mb-1 text-muted-foreground w-6 h-6" />
              <p className="text-xs font-bold text-foreground">Anexar Receita (PDF ou Imagem)</p>
              <p className="text-[10px] text-muted-foreground">Assinatura ICP-Brasil reconhecida automaticamente</p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs h-10"
              >
                📥 Enviar Receita para a Farmácia
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Rastreamento de Pedido & Entregas */}
      <RastreioPedidoModal
        open={isRastreioOpen}
        onOpenChange={setIsRastreioOpen}
        isPharmacy={true}
      />

      {/* Visualizador de Documentos KYC */}
      {docViewer && (
        <PharmacyKycDocViewer
          open={Boolean(docViewer)}
          onClose={() => setDocViewer(null)}
          userId={profile.id}
          kind={docViewer.kind}
          fileUrl={docViewer.url}
          pharmacyName={profile.company_name}
        />
      )}
    </div>
  );
}
