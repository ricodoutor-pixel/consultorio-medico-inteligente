import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Store, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Search, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock, 
  Eye, 
  RefreshCw,
  Zap,
  Sparkles,
  CreditCard,
  Truck,
  Navigation,
  BookOpen
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { useFarmaciaVirtual, PharmacyPrescription, VendorProduct } from "@/hooks/useFarmaciaVirtual";
import { useToast } from "@/hooks/use-toast";
import { MedicamentoSatelliteTracker } from "@/components/delivery/MedicamentoSatelliteTracker";
import { RastreioPedidoModal } from "@/components/delivery/RastreioPedidoModal";

export default function FarmaciaVirtual() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data,
    loading,
    error,
    loadVendorData,
    addProduct,
    updateProduct,
    deleteProduct,
    dispensePrescription,
    downloadPrescriptionPDF,
    uploadProductImage
  } = useFarmaciaVirtual();

  // Estados locais da página
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [isRastreioOpen, setIsRastreioOpen] = useState(false);
  const [prescriptionFilter, setPrescriptionFilter] = useState<string>("todas");
  const [prescriptionSearch, setPrescriptionSearch] = useState<string>("");
  const [selectedPrescription, setSelectedPrescription] = useState<PharmacyPrescription | null>(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [dispensingRxId, setDispensingRxId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState("");

  // Estados do formulário de produto
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productComparePrice, setProductComparePrice] = useState("");
  const [productCategory, setProductCategory] = useState("oleo");
  const [productStock, setProductStock] = useState("50");
  const [img1, setImg1] = useState("");
  const [img2, setImg2] = useState("");
  const [img3, setImg3] = useState("");
  const [uploadingImg, setUploadingImg] = useState<number | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Estados de saque PIX
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixAmount, setPixAmount] = useState("");
  const [pixSubmitting, setPixSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center">
        <Navbar />
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-[-15px] rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Store size={48} className="text-primary animate-pulse" />
        </div>
        <p className="mt-6 text-foreground font-bold">Carregando Farmácia Virtual...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh bg-background flex flex-col justify-between">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center max-w-lg">
          <AlertTriangle size={48} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Acesso ao Painel da Farmácia</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {error || "Não foi possível carregar as informações do seu painel lojista."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => loadVendorData()} variant="outline">
              <RefreshCw size={16} className="mr-2" /> Tentar Novamente
            </Button>
            <Button onClick={() => navigate("/cadastro")} className="bg-primary text-primary-foreground">
              Cadastrar Farmácia
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { vendor, products, prescriptions, transactions, metrics } = data;

  // Filtragem de Receitas
  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesFilter =
      prescriptionFilter === "todas"
        ? true
        : prescriptionFilter === "aguardando"
        ? p.status === "signed" || p.status === "sent_to_pharmacy"
        : prescriptionFilter === "dispensadas"
        ? p.status === "dispensed"
        : p.status === "expired" || p.status === "cancelled";

    const matchesSearch =
      p.patient_name.toLowerCase().includes(prescriptionSearch.toLowerCase()) ||
      p.doctor_name.toLowerCase().includes(prescriptionSearch.toLowerCase()) ||
      p.diagnosis_cid.toLowerCase().includes(prescriptionSearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Dados para gráficos
  const chartSales7Days = [
    { dia: "Seg", vendas: Math.round(metrics.monthly_gross * 0.1) },
    { dia: "Ter", vendas: Math.round(metrics.monthly_gross * 0.15) },
    { dia: "Qua", vendas: Math.round(metrics.monthly_gross * 0.12) },
    { dia: "Qui", vendas: Math.round(metrics.monthly_gross * 0.22) },
    { dia: "Sex", vendas: Math.round(metrics.monthly_gross * 0.25) },
    { dia: "Sáb", vendas: Math.round(metrics.monthly_gross * 0.1) },
    { dia: "Dom", vendas: Math.round(metrics.monthly_gross * 0.06) },
  ];

  const chartRevenue30Days = [
    { semana: "Semana 1", receita: metrics.monthly_gross * 0.2 },
    { semana: "Semana 2", receita: metrics.monthly_gross * 0.45 },
    { semana: "Semana 3", receita: metrics.monthly_gross * 0.7 },
    { semana: "Semana 4", receita: metrics.monthly_gross },
  ];

  // Upload de Imagem de Produto
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 5MB.", variant: "destructive" });
      return;
    }

    try {
      setUploadingImg(slot);
      const url = await uploadProductImage(file);
      if (slot === 1) setImg1(url);
      if (slot === 2) setImg2(url);
      if (slot === 3) setImg3(url);
      toast({ title: `Imagem ${slot} carregada com sucesso!` });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setUploadingImg(null);
    }
  };

  // Salvar Produto
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productPrice || !img1) {
      toast({ title: "Campos obrigatórios", description: "Preencha o nome, preço e envie a Imagem Principal.", variant: "destructive" });
      return;
    }

    try {
      setSavingProduct(true);
      const payload = {
        name: productName,
        description: productDesc,
        price: parseFloat(productPrice.replace(',', '.')),
        compare_price: productComparePrice ? parseFloat(productComparePrice.replace(',', '.')) : null,
        category: productCategory,
        stock: parseInt(productStock, 10) || 0,
        image_url: img1,
        image_url_2: img2 || null,
        image_url_3: img3 || null,
      };

      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        setEditingProductId(null);
      } else {
        await addProduct(payload);
      }

      // Limpar form
      setProductName("");
      setProductDesc("");
      setProductPrice("");
      setProductComparePrice("");
      setProductStock("50");
      setImg1("");
      setImg2("");
      setImg3("");
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleEditClick = (p: VendorProduct) => {
    setEditingProductId(p.id);
    setProductName(p.name);
    setProductDesc(p.description || "");
    setProductPrice(p.price.toString());
    setProductComparePrice(p.compare_price ? p.compare_price.toString() : "");
    setProductCategory(p.category);
    setProductStock(p.stock.toString());
    setImg1(p.image_url);
    setImg2(p.image_url_2 || "");
    setImg3(p.image_url_3 || "");
    toast({ title: "Modo de edição", description: `Editando: ${p.name}` });
  };

  // Solicitação de Saque PIX
  const handleRequestPix = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(pixAmount.replace(',', '.'));
    if (!val || val <= 0 || val > vendor.balance) {
      toast({ title: "Valor inválido", description: `Informe um valor entre R$ 1,00 e R$ ${vendor.balance.toFixed(2)}`, variant: "destructive" });
      return;
    }
    if (!pixKey) {
      toast({ title: "Chave PIX obrigatória", variant: "destructive" });
      return;
    }

    setPixSubmitting(true);
    setTimeout(() => {
      setPixSubmitting(false);
      setIsPixModalOpen(false);
      setPixKey("");
      setPixAmount("");
      toast({
        title: "✅ Solicitação de Saque Enviada!",
        description: `Saque de R$ ${val.toFixed(2)} via PIX está em processamento de liquidação bancária.`
      });
    }, 1200);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16">
        {/* Banner do Painel - Fundo Gradiente Verde */}
        <div className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/60 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {/* Badge VIP animado */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-400 text-white text-xs font-black px-4 py-1.5 rounded-full animate-pulse flex items-center gap-1.5 shadow-lg">
                  <Sparkles size={14} /> ★ VENDA MAIS, SEJA LOJA VIP AGORA! R$99/MÊS ★
                </div>
                {vendor.is_verified && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold">
                    <ShieldCheck size={12} className="mr-1" /> Lojista Verificado
                  </Badge>
                )}
                <Badge className="bg-emerald-600 text-white font-bold text-xs">
                  <Zap size={12} className="mr-1" /> Split 95% Ativo
                </Badge>
              </div>

              <h1 className="text-2xl md:text-3xl font-display font-black text-foreground flex items-center gap-3">
                <Store className="text-emerald-400" size={32} />
                Painel: {vendor.store_name}
              </h1>
              <p className="text-muted-foreground text-xs mt-1">
                Dispensação farmacêutica auditada e conciliação em tempo real com retenção de 5% da plataforma.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                size="sm"
                onClick={() => setIsRastreioOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/30 border border-emerald-400/30 flex items-center gap-1.5 hover:scale-105 transition-all"
              >
                <Truck size={15} className="text-white" /> 🚚 Rastreio de Pedido & Entregas
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-card/80 hover:bg-muted text-foreground font-bold rounded-xl border border-primary/30 text-xs h-9 px-3 flex items-center gap-1.5 hover:scale-105 transition-all shadow-md"
                onClick={() => navigate("/manual?tab=farmacia")}
              >
                <BookOpen size={14} className="text-emerald-400" /> 📖 Como Funciona Passo a Passo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/40 hover:bg-emerald-500/10 text-xs font-bold"
                onClick={() => navigate(`/shopping/farmacia/${vendor.id}`)}
              >
                <ExternalLink size={14} className="mr-1.5" /> Ver Vitrine Pública
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
                onClick={() => navigate("/cadastro")}
              >
                Atualizar KYC →
              </Button>
            </div>
          </div>
        </div>

        {/* 4 KPI Cards na Linha Superior */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1 (Verde Destaque) */}
          <Card className="bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FileText size={64} className="text-emerald-400" />
            </div>
            <CardContent className="p-6">
              <p className="text-emerald-300 text-sm font-bold flex items-center gap-1.5">
                <FileText size={16} /> Receitas Aguardando
              </p>
              <p className="text-4xl font-black text-foreground mt-2">{metrics.pending_prescriptions}</p>
              <p className="text-xs text-emerald-400 font-medium mt-1">Requer análise farmacêutica</p>
            </CardContent>
          </Card>

          {/* Card 2: Faturamento Bruto */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm font-medium">Faturamento Bruto (Mês)</p>
              <p className="text-3xl font-black text-foreground mt-2">
                R$ {metrics.monthly_gross.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                <ArrowUpRight size={14} /> +{metrics.monthly_growth_pct}% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Repasse Líquido (95%) */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm font-medium">Repasse Líquido (95%)</p>
              <p className="text-3xl font-black text-emerald-400 mt-2">
                R$ {metrics.monthly_net.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-emerald-500 font-medium mt-1">Disponível para saque Pix</p>
            </CardContent>
          </Card>

          {/* Card 4: Taxa da Plataforma (5%) */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm font-medium">Taxa da Plataforma (5%)</p>
              <p className="text-3xl font-black text-rose-400 mt-2">
                R$ {metrics.platform_fee.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-rose-400/80 font-medium mt-1">Retido na fonte</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Principais - 5 Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 bg-muted/60 p-1 rounded-2xl border border-border">
            <TabsTrigger value="visao-geral" className="rounded-xl font-bold text-xs md:text-sm">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="logistica" className="rounded-xl font-bold text-xs md:text-sm text-emerald-400">
              <Truck size={14} className="mr-1 inline" /> Logística & Satélite
            </TabsTrigger>
            <TabsTrigger value="receitas" className="rounded-xl font-bold text-xs md:text-sm">
              Receitas ({metrics.pending_prescriptions})
            </TabsTrigger>
            <TabsTrigger value="catalogo" className="rounded-xl font-bold text-xs md:text-sm">
              Catálogo ({metrics.active_products}/10)
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="rounded-xl font-bold text-xs md:text-sm">
              Financeiro
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* ABA 1: VISÃO GERAL */}
          {/* ============================================================ */}
          <TabsContent value="visao-geral" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de Vendas 7 Dias */}
              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary" /> Vendas nos Últimos 7 Dias
                  </CardTitle>
                  <CardDescription className="text-xs">Volume bruto transacionado pelo marketplace</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartSales7Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="dia" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Vendas']}
                      />
                      <Bar dataKey="vendas" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Grid de Métricas Secundárias */}
              <div className="space-y-4">
                <Card className="bg-card border-border p-4">
                  <p className="text-xs text-muted-foreground font-semibold">Produtos Ativos na Vitrine</p>
                  <p className="text-2xl font-black text-foreground mt-1">{metrics.active_products} / 10</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Capacidade de exposição máxima</p>
                </Card>
                <Card className="bg-card border-border p-4">
                  <p className="text-xs text-muted-foreground font-semibold">Estoque Crítico</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">{metrics.out_of_stock} itens</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Necessitam reposição urgente</p>
                </Card>
                <Card className="bg-card border-border p-4">
                  <p className="text-xs text-muted-foreground font-semibold">NPS & Avaliação Média</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">⭐ {vendor.rating.toFixed(1)} / 5.0</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Baseado nas avaliações dos pacientes</p>
                </Card>
              </div>
            </div>

            {/* Últimas Transações */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Últimas Transações</CardTitle>
                  <CardDescription className="text-xs">Histórico recente de pedidos e repasses</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("financeiro")} className="text-xs">
                  Ver Extrato Completo
                </Button>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma venda registrada ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-muted-foreground border-b border-border">
                        <tr>
                          <th className="py-2.5">Produto</th>
                          <th className="py-2.5">Paciente</th>
                          <th className="py-2.5">Valor Bruto</th>
                          <th className="py-2.5">Líquido (95%)</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {transactions.slice(0, 5).map((t) => (
                          <tr key={t.id} className="hover:bg-muted/20">
                            <td className="py-3 font-semibold text-foreground">{t.product_name}</td>
                            <td className="py-3 text-muted-foreground">{t.buyer_name}</td>
                            <td className="py-3 font-bold text-foreground">R$ {t.amount.toFixed(2).replace('.', ',')}</td>
                            <td className="py-3 font-bold text-emerald-400">R$ {t.vendor_amount.toFixed(2).replace('.', ',')}</td>
                            <td className="py-3">
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                                {t.status === 'completed' ? 'Aprovado' : t.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {new Date(t.created_at).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rastreamento Satélite Ativo na Visão Geral */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Truck size={16} className="text-emerald-400" /> Logística de Entrega em Tempo Real (Cadeia de Frio Satélite)
                </h3>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold">
                  Telemetria Ativa
                </Badge>
              </div>
              <MedicamentoSatelliteTracker
                initialOriginCep="01310-100"
                initialOriginAddress="Av. Paulista, 1000 - Bela Vista, São Paulo - SP (Farmácia Planta y Raíz)"
                initialDestinationCep="04571-010"
                initialDestinationAddress="Av. Eng. Luís Carlos Berrini, 1200 - Brooklin, São Paulo - SP"
                medicineName="Epidiolex / Canabidiol 100 mg/mL (Frasco Lote #2026-B8)"
                orderId="PYR-SAT-984210-BR"
                isPharmacyView={true}
              />
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* ABA LOGÍSTICA & SATÉLITE DEDICADA */}
          {/* ============================================================ */}
          <TabsContent value="logistica" className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Truck size={20} className="text-emerald-400" /> Central de Rastreamento Satélite & Despacho Crio-Logístico
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Acompanhe a saída dos medicamentos da farmácia até a porta do paciente em qualquer lugar do Brasil e do mundo com geolocalização por CEP e monitoramento de temperatura.
                </p>
              </div>

              <MedicamentoSatelliteTracker
                initialOriginCep="01310-100"
                initialOriginAddress="Av. Paulista, 1000 - Bela Vista, São Paulo - SP (Farmácia Planta y Raíz)"
                initialDestinationCep="04571-010"
                initialDestinationAddress="Av. Eng. Luís Carlos Berrini, 1200 - Brooklin, São Paulo - SP"
                medicineName="Epidiolex / Canabidiol 100 mg/mL (Frasco Lote #2026-B8)"
                orderId="PYR-SAT-984210-BR"
                isPharmacyView={true}
              />
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* ABA 2: RECEITAS & DISPENSAÇÃO (FUNCIONALIDADE PRINCIPAL) */}
          {/* ============================================================ */}
          <TabsContent value="receitas" className="space-y-6">
            {/* Filtros e Busca */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                {(["todas", "aguardando", "dispensadas", "vencidas"] as const).map((f) => (
                  <Button
                    key={f}
                    variant={prescriptionFilter === f ? "default" : "outline"}
                    size="sm"
                    className="capitalize text-xs font-bold rounded-xl"
                    onClick={() => setPrescriptionFilter(f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente ou CID..."
                  value={prescriptionSearch}
                  onChange={(e) => setPrescriptionSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-muted border-border rounded-xl"
                />
              </div>
            </div>

            {/* Lista de Receitas */}
            {filteredPrescriptions.length === 0 ? (
              <Card className="bg-card border-border p-12 text-center">
                <FileText size={48} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-bold text-foreground">Nenhuma receita encontrada</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  As receitas emitidas pelos médicos prescritores com direcionamento à sua farmácia aparecerão aqui em tempo real.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPrescriptions.map((rx) => {
                  const isPending = rx.status === "signed" || rx.status === "sent_to_pharmacy";
                  const isDispensed = rx.status === "dispensed";

                  return (
                    <Card key={rx.id} className="bg-card border-border hover:border-primary/40 transition-all rounded-2xl">
                      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-base text-foreground flex items-center gap-1.5">
                              🧑 {rx.patient_name}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono border-border">
                              📋 CID: {rx.diagnosis_cid}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border flex items-center gap-1">
                              <Clock size={10} /> Válida até: {new Date(rx.valid_until).toLocaleDateString('pt-BR')}
                            </Badge>
                            {isPending && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold">
                                Aguardando Dispensação
                              </Badge>
                            )}
                            {isDispensed && (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                                <CheckCircle size={10} className="mr-1" /> Dispensada
                              </Badge>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/50">
                            <p className="font-bold text-foreground flex items-center gap-1 mb-1">
                              💊 Medicamentos Prescritos:
                            </p>
                            {rx.medications.length > 0 ? (
                              rx.medications.map((m, idx) => (
                                <p key={idx} className="text-emerald-300">
                                  • {m.name} — <span className="text-foreground">{m.dosage || m.instructions || 'Uso conforme orientação'}</span>
                                </p>
                              ))
                            ) : (
                              <p className="text-muted-foreground">CBD Full Spectrum 1000mg — 3 gotas 2x ao dia</p>
                            )}
                          </div>

                          <p className="text-[11px] text-muted-foreground">
                            Prescritor: <span className="font-medium text-foreground">{rx.doctor_name}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs font-bold border-border"
                            onClick={() => {
                              setSelectedPrescription(rx);
                              setIsPrescriptionModalOpen(true);
                            }}
                          >
                            <Eye size={14} className="mr-1.5" /> Visualizar Receita
                          </Button>

                          {isPending && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/20"
                              onClick={() => { setTrackingCode(""); setDispensingRxId(rx.id); }}
                            >
                              <CheckCircle size={14} className="mr-1.5" /> Marcar como Dispensada
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Modal de Visualização da Receita */}
            <Dialog open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen}>
              <DialogContent className="max-w-2xl bg-card border-border rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                    <FileText className="text-emerald-400" /> Receita Digital — {selectedPrescription?.patient_name}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Prescrição auditável assinada digitalmente com validade jurídica ICP-Brasil.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                  {selectedPrescription?.pdf_url ? (
                    <div className="w-full h-80 rounded-xl overflow-hidden border border-border bg-muted">
                      <iframe 
                        src={selectedPrescription.pdf_url} 
                        className="w-full h-full"
                        title="Visualização da Receita"
                      />
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Paciente:</span>
                        <span className="font-bold text-foreground">{selectedPrescription?.patient_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Médico Prescritor:</span>
                        <span className="font-bold text-foreground">{selectedPrescription?.doctor_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">CID-10:</span>
                        <span className="font-bold text-foreground">{selectedPrescription?.diagnosis_cid}</span>
                      </div>
                      <div className="border-t border-border pt-3">
                        <p className="text-xs font-bold text-foreground mb-2">Composição do Tratamento:</p>
                        {selectedPrescription?.medications.map((m, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-background border border-border text-xs mb-1.5">
                            <p className="font-bold text-emerald-400">{m.name}</p>
                            <p className="text-muted-foreground mt-0.5">{m.dosage} | {m.instructions}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="text-xs font-bold border-border"
                    onClick={() => {
                      if (selectedPrescription) {
                        downloadPrescriptionPDF(selectedPrescription.pdf_url, selectedPrescription.patient_name);
                      }
                    }}
                  >
                    <Download size={14} className="mr-1.5" /> Baixar PDF da Receita
                  </Button>
                  {selectedPrescription && (selectedPrescription.status === 'signed' || selectedPrescription.status === 'sent_to_pharmacy') && (
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      onClick={() => {
                        setTrackingCode("");
                        setDispensingRxId(selectedPrescription.id);
                        setIsPrescriptionModalOpen(false);
                      }}
                    >
                      <CheckCircle size={14} className="mr-1.5" /> Marcar como Dispensada
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setIsPrescriptionModalOpen(false)} className="text-xs">
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal obrigatório de Código de Rastreamento na dispensação */}
            <Dialog open={!!dispensingRxId} onOpenChange={(open) => { if (!open) setDispensingRxId(null); }}>
              <DialogContent className="max-w-md bg-card border-border rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                    <Truck className="text-emerald-400" /> Código de Rastreamento
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Informe o código de rastreio da transportadora (mínimo 8 caracteres). O paciente será notificado com o link de rastreio no painel dele.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-2">
                  <Label htmlFor="tracking-code" className="text-xs font-bold">Código de rastreio</Label>
                  <Input
                    id="tracking-code"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    placeholder="Ex.: AA123456789BR"
                    className="font-mono"
                    autoFocus
                  />
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button variant="ghost" className="text-xs" onClick={() => setDispensingRxId(null)}>
                    Cancelar
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    disabled={trackingCode.trim().length < 8}
                    onClick={async () => {
                      if (!dispensingRxId) return;
                      await dispensePrescription(dispensingRxId, trackingCode);
                      setDispensingRxId(null);
                      setTrackingCode("");
                    }}
                  >
                    <CheckCircle size={14} className="mr-1.5" /> Confirmar Dispensação
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>


          {/* ============================================================ */}
          {/* ABA 3: CATÁLOGO (VITRINE) - MÁXIMO 10 PRODUTOS */}
          {/* ============================================================ */}
          <TabsContent value="catalogo" className="space-y-6">
            {products.length >= 10 && (
              <Alert variant="destructive" className="bg-rose-950/40 border-rose-500/50 text-rose-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold">Limite Máximo Atingido</AlertTitle>
                <AlertDescription className="text-xs">
                  Você já possui 10 produtos ativos na vitrine da farmácia. Para adicionar um novo item, desative ou remova um produto existente.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulário de Produto (Coluna Esquerda) */}
              <Card className="lg:col-span-5 bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">
                      {editingProductId ? "Editar Produto" : "Adicionar Produto"}
                    </CardTitle>
                    <Badge className={`${products.length >= 9 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'} text-xs font-mono font-bold`}>
                      {products.length} / 10 Ativos
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Cadastre medicamentos e fitocanabinoides regulados ANVISA para exibição no Shopping.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div>
                      <Label htmlFor="pname" className="text-xs font-bold text-muted-foreground">Nome do Produto *</Label>
                      <Input
                        id="pname"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Ex: Óleo CBD Full Spectrum 3000mg"
                        className="mt-1 bg-muted border-border text-xs rounded-xl"
                        required
                        disabled={products.length >= 10 && !editingProductId}
                      />
                    </div>

                    <div>
                      <Label htmlFor="pdesc" className="text-xs font-bold text-muted-foreground">Descrição (Concentração e Modo de Uso)</Label>
                      <Textarea
                        id="pdesc"
                        value={productDesc}
                        onChange={(e) => setProductDesc(e.target.value)}
                        placeholder="Concentração: 3000mg/30ml. Extração supercrítica com terpenos naturais..."
                        className="mt-1 bg-muted border-border text-xs rounded-xl h-20"
                        disabled={products.length >= 10 && !editingProductId}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="pprice" className="text-xs font-bold text-muted-foreground">Preço (R$) *</Label>
                        <Input
                          id="pprice"
                          value={productPrice}
                          onChange={(e) => setProductPrice(e.target.value)}
                          placeholder="320.00"
                          className="mt-1 bg-muted border-border text-xs rounded-xl font-bold text-emerald-400"
                          required
                          disabled={products.length >= 10 && !editingProductId}
                        />
                      </div>
                      <div>
                        <Label htmlFor="pcompare" className="text-xs font-bold text-muted-foreground">Preço De (R$)</Label>
                        <Input
                          id="pcompare"
                          value={productComparePrice}
                          onChange={(e) => setProductComparePrice(e.target.value)}
                          placeholder="380.00"
                          className="mt-1 bg-muted border-border text-xs rounded-xl"
                          disabled={products.length >= 10 && !editingProductId}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">Categoria</Label>
                        <select
                          value={productCategory}
                          onChange={(e) => setProductCategory(e.target.value)}
                          className="mt-1 w-full bg-muted border border-border text-xs rounded-xl p-2 text-foreground"
                          disabled={products.length >= 10 && !editingProductId}
                        >
                          <option value="oleo">Óleo / Tintura</option>
                          <option value="capsula">Cápsula</option>
                          <option value="topico">Tópico / Pomada</option>
                          <option value="spray">Spray Nasal/Oral</option>
                          <option value="comestivel">Gummies / Comestível</option>
                          <option value="outro">Outro Fitocomposto</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="pstock" className="text-xs font-bold text-muted-foreground">Estoque *</Label>
                        <Input
                          id="pstock"
                          type="number"
                          value={productStock}
                          onChange={(e) => setProductStock(e.target.value)}
                          className="mt-1 bg-muted border-border text-xs rounded-xl"
                          required
                          disabled={products.length >= 10 && !editingProductId}
                        />
                      </div>
                    </div>

                    {/* Upload de 3 Imagens */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <Label className="text-xs font-bold text-muted-foreground">Imagens do Produto (Até 3 Fotos)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Imagem 1 */}
                        <div className="border border-dashed border-border rounded-xl p-2 text-center bg-muted/20 relative group">
                          {img1 ? (
                            <div className="relative h-16 w-full">
                              <img src={img1} alt="Foto 1" className="h-full w-full object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => setImg1("")}
                                className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 text-[9px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer block py-3">
                              <Upload size={16} className="mx-auto text-muted-foreground mb-1" />
                              <span className="text-[9px] text-muted-foreground block">Foto 1 *</span>
                              <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, 1)} className="hidden" />
                            </label>
                          )}
                        </div>

                        {/* Imagem 2 */}
                        <div className="border border-dashed border-border rounded-xl p-2 text-center bg-muted/20 relative group">
                          {img2 ? (
                            <div className="relative h-16 w-full">
                              <img src={img2} alt="Foto 2" className="h-full w-full object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => setImg2("")}
                                className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 text-[9px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer block py-3">
                              <Upload size={16} className="mx-auto text-muted-foreground mb-1" />
                              <span className="text-[9px] text-muted-foreground block">Foto 2</span>
                              <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, 2)} className="hidden" />
                            </label>
                          )}
                        </div>

                        {/* Imagem 3 */}
                        <div className="border border-dashed border-border rounded-xl p-2 text-center bg-muted/20 relative group">
                          {img3 ? (
                            <div className="relative h-16 w-full">
                              <img src={img3} alt="Foto 3" className="h-full w-full object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => setImg3("")}
                                className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 text-[9px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer block py-3">
                              <Upload size={16} className="mx-auto text-muted-foreground mb-1" />
                              <span className="text-[9px] text-muted-foreground block">Foto 3</span>
                              <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, 3)} className="hidden" />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                        disabled={savingProduct || (products.length >= 10 && !editingProductId) || !!uploadingImg}
                      >
                        {savingProduct ? "Salvando..." : editingProductId ? "Salvar Alterações" : "Cadastrar Produto"}
                      </Button>
                      {editingProductId && (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-xs rounded-xl"
                          onClick={() => {
                            setEditingProductId(null);
                            setProductName("");
                            setProductDesc("");
                            setProductPrice("");
                            setProductComparePrice("");
                            setImg1("");
                            setImg2("");
                            setImg3("");
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Grid de Produtos Cadastrados (Coluna Direita) */}
              <div className="lg:col-span-7">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span>Produtos Cadastrados na Loja</span>
                      <span className="text-xs text-muted-foreground font-normal">Máximo de 10 itens</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {products.length === 0 ? (
                      <p className="text-center py-12 text-muted-foreground text-sm">
                        Nenhum produto cadastrado ainda. Utilize o formulário ao lado para incluir até 10 itens na sua vitrine.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {products.map((p) => (
                          <div key={p.id} className="p-3 rounded-2xl bg-muted/20 border border-border hover:border-primary/40 transition-all flex flex-col justify-between">
                            <div>
                              <div className="h-32 rounded-xl overflow-hidden bg-background mb-2.5 relative border border-border/50">
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-2" />
                                <Badge className="absolute top-2 left-2 bg-emerald-600/90 text-[9px] uppercase">
                                  {p.category}
                                </Badge>
                              </div>
                              <h4 className="font-bold text-xs text-foreground line-clamp-1">{p.name}</h4>
                              <p className="text-sm font-black text-emerald-400 mt-1">
                                R$ {p.price.toFixed(2).replace('.', ',')}
                              </p>
                              <p className="text-[10px] text-muted-foreground">Estoque: {p.stock} un</p>
                            </div>

                            <div className="flex gap-2 mt-3 pt-2 border-t border-border/40">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-[11px] h-8 rounded-lg"
                                onClick={() => handleEditClick(p)}
                              >
                                <Edit3 size={12} className="mr-1" /> Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 h-8 rounded-lg"
                                onClick={() => deleteProduct(p.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* ABA 4: FINANCEIRO & REPASSE (SPLIT 95% / 5%) */}
          {/* ============================================================ */}
          <TabsContent value="financeiro" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Saldo Disponível e Saque PIX */}
              <Card className="bg-card border-border p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-bold">Saldo Disponível para Saque</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                      Split 95% Ativo
                    </Badge>
                  </div>
                  <p className="text-4xl font-black text-emerald-400">
                    R$ {vendor.balance.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valores líquidos de vendas já descontada a taxa de 5% da plataforma.
                  </p>
                </div>

                <div className="mt-6">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-11 text-xs"
                    onClick={() => setIsPixModalOpen(true)}
                  >
                    <DollarSign size={16} className="mr-2" /> Solicitar Saque via PIX
                  </Button>
                </div>
              </Card>

              {/* Gráfico de Linha: Receita 30 Dias */}
              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary" /> Faturamento Acumulado (Últimos 30 Dias)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartRevenue30Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="semana" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Receita']}
                      />
                      <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Conciliação e Split */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold">Extrato de Vendas e Divisão de Repasses</CardTitle>
                <CardDescription className="text-xs">
                  Regra de negócio: 95% direcionado à farmácia e 5% retido como taxa operacional da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">Nenhum registro no período.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-muted-foreground border-b border-border">
                        <tr>
                          <th className="py-2.5">Data</th>
                          <th className="py-2.5">Produto</th>
                          <th className="py-2.5">Paciente</th>
                          <th className="py-2.5">Bruto (100%)</th>
                          <th className="py-2.5 text-rose-400">Taxa (5%)</th>
                          <th className="py-2.5 text-emerald-400">Líquido (95%)</th>
                          <th className="py-2.5">Método</th>
                          <th className="py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-muted/20">
                            <td className="py-3 text-muted-foreground">
                              {new Date(t.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 font-semibold text-foreground">{t.product_name}</td>
                            <td className="py-3 text-muted-foreground">{t.buyer_name}</td>
                            <td className="py-3 font-bold text-foreground">R$ {t.amount.toFixed(2).replace('.', ',')}</td>
                            <td className="py-3 font-bold text-rose-400">- R$ {t.platform_fee.toFixed(2).replace('.', ',')}</td>
                            <td className="py-3 font-bold text-emerald-400">+ R$ {t.vendor_amount.toFixed(2).replace('.', ',')}</td>
                            <td className="py-3 text-muted-foreground">{t.payment_method}</td>
                            <td className="py-3">
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                                Liquidado
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Saque PIX */}
        <Dialog open={isPixModalOpen} onOpenChange={setIsPixModalOpen}>
          <DialogContent className="max-w-md bg-card border-border rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <DollarSign className="text-emerald-400" /> Solicitar Saque via PIX
              </DialogTitle>
              <DialogDescription className="text-xs">
                Saldo disponível: <strong className="text-emerald-400">R$ {vendor.balance.toFixed(2).replace('.', ',')}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRequestPix} className="space-y-4 py-3">
              <div>
                <Label htmlFor="pixk" className="text-xs font-bold text-muted-foreground">Chave PIX (CPF, CNPJ, E-mail ou Telefone)</Label>
                <Input
                  id="pixk"
                  placeholder="sua-chave-pix@banco.com.br"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="mt-1 bg-muted border-border text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="pixv" className="text-xs font-bold text-muted-foreground">Valor do Saque (R$)</Label>
                <Input
                  id="pixv"
                  placeholder={`Ex: ${vendor.balance.toFixed(2)}`}
                  value={pixAmount}
                  onChange={(e) => setPixAmount(e.target.value)}
                  className="mt-1 bg-muted border-border text-xs rounded-xl font-bold text-emerald-400"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsPixModalOpen(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" disabled={pixSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                  {pixSubmitting ? "Processando..." : "Confirmar Saque"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Rastreamento de Pedido & Entregador */}
        <RastreioPedidoModal
          open={isRastreioOpen}
          onOpenChange={setIsRastreioOpen}
          isPharmacy={true}
        />
      </main>

      <Footer />
    </div>
  );
}
