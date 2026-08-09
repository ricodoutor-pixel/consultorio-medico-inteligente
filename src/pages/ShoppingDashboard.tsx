import React, { useState, useEffect } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  ShoppingBag, TrendingUp, Package, DollarSign, Clock, CheckCircle2, AlertCircle,
  BarChart3, Plus, Truck, ShieldCheck, RefreshCw, Wallet, ArrowUpRight, ArrowDownRight,
  Eye, Edit, Trash2, Image, Star, Users, CreditCard, Bitcoin, Download, Filter,
  Calendar, ChevronRight, Store, Award, Zap, Target, PieChart, Info,
  ArrowRight, Bell, Settings, HelpCircle, ExternalLink, Copy, MapPin, Search
} from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RPieChart, Pie, AreaChart, Area } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WhatsAppProofModal } from "@/components/WhatsAppProofModal";
import type { WhatsAppContext } from "@/components/WhatsAppProofModal";

/* ─── Types ─── */
type VendorProduct = {
  id: string; name: string; description: string | null; price: number; compare_price: number | null;
  category: string; image_url: string | null; image_url_2: string | null; image_url_3: string | null;
  stock: number; sold_count: number; review_count: number; rating: number | null; is_active: boolean;
  vendor_id: string; created_at: string;
};
type VendorTx = {
  id: string; type: string; amount: number; platform_fee: number; vendor_amount: number;
  status: string; payment_method: string | null; notes: string | null; created_at: string;
  product_id: string | null; buyer_id: string | null;
};
type Vendor = {
  id: string; store_name: string; store_description: string | null; store_logo_url: string | null;
  store_banner_url: string | null; balance: number; total_sales: number; total_products: number;
  rating: number | null; is_active: boolean; user_id: string;
};

const fmtPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

/* ─── Mock data ─── */
const weeklyData = [
  { name: 'Seg', vendas: 1200 }, { name: 'Ter', vendas: 1900 }, { name: 'Qua', vendas: 1500 },
  { name: 'Qui', vendas: 2100 }, { name: 'Sex', vendas: 2800 }, { name: 'Sab', vendas: 3200 }, { name: 'Dom', vendas: 2400 },
];
const monthlyData = [
  { name: 'Jan', receita: 8500 }, { name: 'Fev', receita: 12300 }, { name: 'Mar', receita: 15100 },
  { name: 'Abr', receita: 11200 }, { name: 'Mai', receita: 18400 }, { name: 'Jun', receita: 22100 },
];
const categoryData = [
  { name: 'Óleos', value: 35 }, { name: 'Cápsulas', value: 25 }, { name: 'Tópicos', value: 20 },
  { name: 'Comestíveis', value: 12 }, { name: 'Outros', value: 8 },
];
const COLORS = ['#3483fa', '#00a650', '#f59e0b', '#ef4444', '#6366f1'];

/* ═══════════════════════════════════════════════════════════════
   MERCADO LIVRE STYLE COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ─── ML-style Metric Card ─── */
const MLMetricCard = ({ label, value, sub, icon: Icon, accent }: { label: string; value: string | number; sub?: string; icon: any; accent: string }) => (
  <div className="bg-[#1a1d2e] rounded-lg p-4 sm:p-5 border border-[#2a2d3e] hover:border-[#3483fa]/40 transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${accent}`}>
        <Icon size={18} />
      </div>
      <ArrowRight size={14} className="text-[#8b8fa3] group-hover:text-[#3483fa] transition-colors" />
    </div>
    <p className="text-[11px] text-[#8b8fa3] font-medium mb-1">{label}</p>
    <p className="text-xl sm:text-2xl font-bold text-[#e8eaf0] tracking-tight">{value}</p>
    {sub && <p className="text-[10px] text-[#00a650] font-medium mt-1">{sub}</p>}
  </div>
);

/* ─── ML-style Product Card ─── */
const MLProductRow = ({ p, onToggle }: { p: VendorProduct; onToggle: (id: string, active: boolean) => void }) => (
  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#1a1d2e] rounded-lg border border-[#2a2d3e] hover:border-[#3483fa]/30 transition-all group">
    <div className="w-[52px] h-[52px] sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-[#12141f] flex-shrink-0 border border-[#2a2d3e]">
      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-3 text-[#8b8fa3]" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <h4 className="text-sm font-semibold text-[#e8eaf0] truncate">{p.name}</h4>
        {p.is_active ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00a650]/15 text-[#00a650]">
            <CheckCircle2 size={8} /> Ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#ff5252]/15 text-[#ff5252]">Pausado</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8b8fa3]">
        <span className="font-bold text-[#e8eaf0]">{fmtPrice(p.price)}</span>
        {p.compare_price && <span className="line-through text-[#5a5e72]">{fmtPrice(p.compare_price)}</span>}
        <span className="flex items-center gap-1"><Package size={10} /> {p.stock} un</span>
        <span className="flex items-center gap-1"><ShoppingBag size={10} /> {p.sold_count} vendidos</span>
        <span className="flex items-center gap-1"><Star size={10} className="text-[#f5c518] fill-[#f5c518]" /> {p.rating?.toFixed(1) || '5.0'}</span>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <Switch checked={p.is_active} onCheckedChange={(v) => onToggle(p.id, v)} />
      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8b8fa3] hover:text-[#3483fa]"><Edit size={14} /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8b8fa3] hover:text-[#3483fa]"><Eye size={14} /></Button>
    </div>
  </div>
);

/* ─── ML-style Transaction Row ─── */
const MLTxRow = ({ tx }: { tx: VendorTx }) => {
  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    completed: { color: 'text-[#00a650]', bg: 'bg-[#00a650]/10', label: 'Aprovado' },
    pending: { color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10', label: 'Pendente' },
    processing: { color: 'text-[#3483fa]', bg: 'bg-[#3483fa]/10', label: 'Processando' },
    failed: { color: 'text-[#ff5252]', bg: 'bg-[#ff5252]/10', label: 'Recusado' },
  };
  const s = statusConfig[tx.status] || statusConfig.pending;
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 bg-[#1a1d2e] rounded-lg border border-[#2a2d3e] hover:border-[#3483fa]/20 transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'sale' ? 'bg-[#00a650]/10 text-[#00a650]' : tx.type === 'withdrawal' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'bg-[#3483fa]/10 text-[#3483fa]'}`}>
          {tx.type === 'sale' ? <DollarSign size={18} /> : tx.type === 'withdrawal' ? <Wallet size={18} /> : <RefreshCw size={18} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#e8eaf0]">{tx.type === 'sale' ? 'Venda realizada' : tx.type === 'withdrawal' ? 'Saque PIX' : 'Reembolso'}</p>
          <p className="text-[11px] text-[#8b8fa3]">{fmtDate(tx.created_at)} {tx.payment_method && `• ${tx.payment_method}`}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`text-sm font-bold ${tx.type === 'withdrawal' ? 'text-[#f59e0b]' : 'text-[#00a650]'}`}>
            {tx.type === 'withdrawal' ? '- ' : '+ '}{fmtPrice(tx.vendor_amount)}
          </p>
          {tx.platform_fee > 0 && <p className="text-[10px] text-[#5a5e72]">Taxa: {fmtPrice(tx.platform_fee)}</p>}
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${s.color} ${s.bg}`}>
          {s.label}
        </span>
      </div>
    </div>
  );
};

/* ═══════════════ MAIN COMPONENT ═══════════════ */
const ShoppingDashboard = () => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [transactions, setTransactions] = useState<VendorTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [whatsappModal, setWhatsappModal] = useState<{ open: boolean; ctx: WhatsAppContext } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: vendors } = await supabase.from("vendors").select("*").limit(1);
        if (vendors && vendors.length > 0) {
          const v = vendors[0] as unknown as Vendor;
          setVendor(v);
          const [prodRes, txRes] = await Promise.all([
            supabase.from("vendor_products").select("*").eq("vendor_id", v.id).order("created_at", { ascending: false }),
            supabase.from("vendor_transactions").select("*").eq("vendor_id", v.id).order("created_at", { ascending: false }).limit(50),
          ]);
          if (prodRes.data) setProducts(prodRes.data as unknown as VendorProduct[]);
          if (txRes.data) setTransactions(txRes.data as unknown as VendorTx[]);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  const totalRevenue = transactions.filter(t => t.type === 'sale' && t.status === 'completed').reduce((s, t) => s + t.vendor_amount, 0);
  const totalFees = transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.platform_fee, 0);
  const totalSold = products.reduce((s, p) => s + p.sold_count, 0);
  const avgRating = products.length > 0 ? products.reduce((s, p) => s + (p.rating || 5), 0) / products.length : 5;
  const balance = vendor?.balance || 0;
  const lowStock = products.filter(p => p.stock < 10);

  const toggleProduct = async (id: string, active: boolean) => {
    const { error } = await supabase.from("vendor_products").update({ is_active: active } as any).eq("id", id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: active } : p));
      toast.success(active ? "Produto ativado" : "Produto desativado");
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 10) { toast.error("Mínimo para saque: R$ 10,00"); return; }
    if (amount > balance) { toast.error("Saldo insuficiente"); return; }
    if (!pixKey) { toast.error("Insira sua chave PIX"); return; }
    setWithdrawOpen(false);
    setWhatsappModal({
      open: true,
      ctx: { type: "compra", productName: `Saque PIX - ${fmtPrice(amount)}`, value: amount } as WhatsAppContext,
    });
    toast.success(`Solicitação de saque de ${fmtPrice(amount)} enviada!`);
  };

  if (loading) return (
    <div className="min-h-dvh bg-[#12141f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-[#3483fa] border-t-transparent animate-spin" />
        <p className="text-sm text-[#8b8fa3]">Carregando dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#12141f]">
      <Navbar />

      {/* ─── Top Blue Bar (ML signature) ─── */}
      <div className="bg-gradient-to-r from-[#2968c8] to-[#3483fa] pt-20 sm:pt-28 pb-6 sm:pb-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center text-white">
                <Store size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-lg sm:text-2xl font-bold text-white">{vendor?.store_name || "Minha Loja"}</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-white backdrop-blur-sm">
                    <ShieldCheck size={10} /> Verificada
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-100/80">Portal do Vendedor • Planta & Raiz Marketplace</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10">
                <Bell size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10">
                <Settings size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10">
                <HelpCircle size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Actions Bar ─── */}
      <div className="bg-[#1a1d2e] border-b border-[#2a2d3e] sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 py-3 overflow-x-auto scrollbar-none">
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#00a650] hover:bg-[#00a650]/90 text-white font-bold rounded-md h-9 px-4 text-xs flex-shrink-0 shadow-lg shadow-[#00a650]/20">
                  <Wallet size={14} className="mr-1.5" /> Sacar Dinheiro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-[#1a1d2e] border-[#2a2d3e]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-[#e8eaf0] flex items-center gap-2">
                    <Wallet size={20} className="text-[#00a650]" /> Solicitar Saque via PIX
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="p-4 rounded-lg bg-[#00a650]/10 border border-[#00a650]/20">
                    <p className="text-[11px] text-[#8b8fa3] mb-1">Disponível para saque</p>
                    <p className="text-3xl font-bold text-[#00a650]">{fmtPrice(balance)}</p>
                    <p className="text-[10px] text-[#8b8fa3] mt-1">Taxa de saque: 5% • Processamento em até 24h</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#8b8fa3] mb-1.5 block">Quanto deseja sacar?</label>
                    <Input type="number" placeholder="R$ 0,00" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                      className="h-12 bg-[#12141f] border-[#2a2d3e] text-lg font-bold text-[#e8eaf0] focus:border-[#3483fa] rounded-md" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#8b8fa3] mb-1.5 block">Chave PIX</label>
                    <Input placeholder="CPF, Email, Celular ou Chave Aleatória" value={pixKey} onChange={e => setPixKey(e.target.value)}
                      className="h-12 bg-[#12141f] border-[#2a2d3e] text-[#e8eaf0] focus:border-[#3483fa] rounded-md" />
                  </div>
                  <Button className="w-full h-12 bg-[#3483fa] hover:bg-[#2968c8] text-white font-bold text-sm rounded-md" onClick={handleWithdraw}>
                    Confirmar Saque
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="border-[#3483fa]/40 text-[#3483fa] font-semibold rounded-md h-9 px-4 text-xs flex-shrink-0 hover:bg-[#3483fa]/10">
              <Plus size={14} className="mr-1.5" /> Novo Anúncio
            </Button>
            <Button variant="ghost" className="text-[#8b8fa3] font-medium rounded-md h-9 px-3 text-xs flex-shrink-0 hover:text-[#e8eaf0] hover:bg-[#2a2d3e]">
              <Download size={14} className="mr-1.5" /> Exportar
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          {/* ─── Balance Banner ─── */}
          <div className="bg-gradient-to-r from-[#1e2235] to-[#1a1d2e] rounded-lg border border-[#2a2d3e] p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#00a650]/10 flex items-center justify-center text-[#00a650]">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-[11px] text-[#8b8fa3] font-medium">Saldo disponível</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#e8eaf0]">{fmtPrice(balance || 14345)}</p>
                <p className="text-[10px] text-[#00a650] font-medium">Liberação automática após confirmação</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-1">
              <div className="flex items-center gap-2 text-[11px] text-[#8b8fa3]">
                <span>A liberar: <span className="text-[#f59e0b] font-semibold">{fmtPrice(2450)}</span></span>
                <Info size={12} className="text-[#5a5e72]" />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#8b8fa3]">
                <span>Retido (5%): <span className="text-[#ff5252] font-semibold">{fmtPrice(totalFees || 755)}</span></span>
              </div>
            </div>
          </div>

          {/* ─── KPI Grid ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <MLMetricCard label="Receita líquida" value={fmtPrice(totalRevenue || 14345)} sub="+12.5% vs mês anterior" icon={TrendingUp} accent="bg-[#00a650]/10 text-[#00a650]" />
            <MLMetricCard label="Unidades vendidas" value={totalSold || 85} sub="+18 esta semana" icon={ShoppingBag} accent="bg-[#3483fa]/10 text-[#3483fa]" />
            <MLMetricCard label="Reputação" value={`${avgRating.toFixed(1)} ★`} sub={`${products.length} avaliações`} icon={Star} accent="bg-[#f5c518]/10 text-[#f5c518]" />
            <MLMetricCard label="Conversão" value="4.2%" sub="+0.3% este mês" icon={Target} accent="bg-[#a855f7]/10 text-[#a855f7]" />
          </div>

          {/* ─── Secondary KPIs ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <MLMetricCard label="Taxa plataforma (5%)" value={fmtPrice(totalFees || 755)} icon={DollarSign} accent="bg-[#ff5252]/10 text-[#ff5252]" />
            <MLMetricCard label="Estoque baixo" value={lowStock.length} sub={lowStock.length > 0 ? "Reabastecer" : "OK"} icon={AlertCircle} accent="bg-[#f59e0b]/10 text-[#f59e0b]" />
            <MLMetricCard label="Pedidos pendentes" value="18" sub="Ação necessária" icon={Clock} accent="bg-[#f59e0b]/10 text-[#f59e0b]" />
            <MLMetricCard label="Anúncios ativos" value={`${products.filter(p => p.is_active).length}/${products.length}`} icon={Package} accent="bg-[#3483fa]/10 text-[#3483fa]" />
          </div>

          {/* ─── Navigation Tabs (ML style) ─── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="border-b border-[#2a2d3e] -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto scrollbar-none">
              <TabsList className="bg-transparent p-0 h-auto gap-0 rounded-none">
                {[
                  { value: "overview", label: "Resumo", icon: BarChart3 },
                  { value: "products", label: "Anúncios", icon: Package },
                  { value: "orders", label: "Vendas", icon: Truck },
                  { value: "financial", label: "Financeiro", icon: Wallet },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`rounded-none border-b-2 px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold transition-all
                      ${activeTab === tab.value
                        ? 'border-[#3483fa] text-[#3483fa] bg-transparent'
                        : 'border-transparent text-[#8b8fa3] hover:text-[#e8eaf0] bg-transparent'
                      }
                      data-[state=active]:bg-transparent data-[state=active]:shadow-none
                    `}
                  >
                    <tab.icon size={14} className="mr-1.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ─── OVERVIEW TAB ─── */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Weekly Sales */}
                <div className="lg:col-span-2 bg-[#1a1d2e] rounded-lg border border-[#2a2d3e] p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#e8eaf0] flex items-center gap-2">
                      <BarChart3 size={16} className="text-[#3483fa]" /> Vendas da semana
                    </h3>
                    <span className="text-[10px] font-semibold text-[#00a650] bg-[#00a650]/10 px-2 py-0.5 rounded">+23% vs semana anterior</span>
                  </div>
                  <div className="h-[260px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
                        <XAxis dataKey="name" stroke="#5a5e72" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#5a5e72" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '8px', fontSize: '12px', color: '#e8eaf0' }}
                          cursor={{ fill: 'rgba(52, 131, 250, 0.08)' }}
                        />
                        <Bar dataKey="vendas" radius={[4, 4, 0, 0]}>
                          {weeklyData.map((_, i) => (
                            <Cell key={i} fill={i === 5 ? '#3483fa' : '#2a3a5c'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sidebar panels */}
                <div className="space-y-4">
                  {/* Top Products */}
                  <div className="bg-[#1a1d2e] rounded-lg border border-[#2a2d3e] p-4">
                    <h3 className="text-xs font-bold text-[#e8eaf0] mb-3 flex items-center gap-2">
                      <Zap size={14} className="text-[#f5c518]" /> Mais vendidos
                    </h3>
                    <div className="space-y-2">
                      {(products.length > 0 ? [...products].sort((a, b) => b.sold_count - a.sold_count).slice(0, 4) : [
                        { name: "Óleo CBD Full Spectrum", sold_count: 42 },
                        { name: "Gummies Relax CBD", sold_count: 28 },
                        { name: "Creme Tópico CBD", sold_count: 15 },
                        { name: "Cápsulas CBD 25mg", sold_count: 12 },
                      ]).map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-[#12141f] border border-[#2a2d3e]/50">
                          <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${i === 0 ? 'bg-[#3483fa] text-white' : 'bg-[#2a2d3e] text-[#8b8fa3]'}`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-[#e8eaf0] truncate">{item.name}</p>
                          </div>
                          <span className="text-[10px] text-[#00a650] font-bold">{item.sold_count} un</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Low Stock Alerts */}
                  {lowStock.length > 0 && (
                    <div className="bg-[#1a1d2e] rounded-lg border border-[#f59e0b]/20 p-4">
                      <h3 className="text-xs font-bold text-[#f59e0b] mb-3 flex items-center gap-2">
                        <AlertCircle size={14} /> Estoque crítico
                      </h3>
                      {lowStock.slice(0, 3).map((p, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-b border-[#2a2d3e]/50 last:border-0">
                          <span className="text-[11px] text-[#e8eaf0] truncate max-w-[140px]">{p.name}</span>
                          <span className="text-[11px] text-[#ff5252] font-bold">{p.stock} un</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category Distribution */}
                  <div className="bg-[#1a1d2e] rounded-lg border border-[#2a2d3e] p-4">
                    <h3 className="text-xs font-bold text-[#e8eaf0] mb-2 flex items-center gap-2">
                      <PieChart size={14} className="text-[#a855f7]" /> Por categoria
                    </h3>
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RPieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" stroke="none">
                            {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '6px', fontSize: '11px', color: '#e8eaf0' }} />
                        </RPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categoryData.map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[9px] text-[#8b8fa3]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-[#1a1d2e] rounded-lg border border-[#2a2d3e] p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#e8eaf0] flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#00a650]" /> Faturamento mensal
                  </h3>
                  <span className="text-[10px] text-[#8b8fa3]">Últimos 6 meses</span>
                </div>
                <div className="h-[220px] sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
                      <XAxis dataKey="name" stroke="#5a5e72" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#5a5e72" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '8px', fontSize: '12px', color: '#e8eaf0' }} />
                      <defs>
                        <linearGradient id="mlGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3483fa" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3483fa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="receita" stroke="#3483fa" fill="url(#mlGradient)" strokeWidth={2} dot={{ fill: '#3483fa', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* ─── PRODUCTS TAB ─── */}
            <TabsContent value="products" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#e8eaf0]">Meus Anúncios</h3>
                  <p className="text-[11px] text-[#8b8fa3]">{products.length} de 10 anúncios utilizados</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5e72]" />
                    <Input placeholder="Buscar anúncio..." className="h-10 pl-9 bg-[#1a1d2e] border-[#2a2d3e] text-[#e8eaf0] text-xs rounded-md focus:border-[#3483fa]" />
                  </div>
                  <Button variant="outline" size="icon" className="h-10 w-10 border-[#2a2d3e] text-[#8b8fa3] hover:text-[#3483fa] hover:border-[#3483fa]/40 rounded-md">
                    <Filter size={14} />
                  </Button>
                </div>
              </div>

              {/* Usage bar */}
              <div className="bg-[#1a1d2e] rounded-lg border border-[#2a2d3e] p-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-[#8b8fa3]">Anúncios utilizados</span>
                    <span className="text-[10px] font-bold text-[#3483fa]">{products.length}/10</span>
                  </div>
                  <Progress value={(products.length / 10) * 100} className="h-1.5 bg-[#2a2d3e]" />
                </div>
                {products.length < 10 && (
                  <Button size="sm" className="bg-[#3483fa] hover:bg-[#2968c8] text-white text-xs rounded-md h-8 px-3 font-semibold flex-shrink-0">
                    <Plus size={12} className="mr-1" /> Criar
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {products.length > 0 ? products.map(p => (
                  <MLProductRow key={p.id} p={p} onToggle={toggleProduct} />
                )) : (
                  <div className="bg-[#1a1d2e] rounded-lg border-2 border-dashed border-[#2a2d3e] p-10 text-center">
                    <Package size={40} className="mx-auto text-[#5a5e72] mb-4" />
                    <h4 className="font-bold text-lg text-[#e8eaf0] mb-2">Comece a vender</h4>
                    <p className="text-xs text-[#8b8fa3] mb-4">Crie seu primeiro anúncio e alcance milhares de pacientes.</p>
                    <Button className="bg-[#3483fa] hover:bg-[#2968c8] text-white font-bold rounded-md">
                      <Plus size={14} className="mr-2" /> Criar Anúncio
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ─── ORDERS TAB ─── */}
            <TabsContent value="orders" className="space-y-6">
              {/* Order Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Novas", value: "5", color: "text-[#3483fa]", bg: "bg-[#3483fa]/10" },
                  { label: "Em preparo", value: "8", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
                  { label: "Enviadas", value: "12", color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" },
                  { label: "Entregues", value: "142", color: "text-[#00a650]", bg: "bg-[#00a650]/10" },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-lg p-3 sm:p-4 border border-[#2a2d3e]`}>
                    <p className="text-[10px] text-[#8b8fa3] font-medium">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Orders Table */}
              <div className="bg-[#1a1d2e] rounded-lg border border-[#2a2d3e] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[#2a2d3e]">
                  <h3 className="text-sm font-bold text-[#e8eaf0]">Vendas recentes</h3>
                  <Button variant="ghost" size="sm" className="text-xs text-[#3483fa] hover:text-[#3483fa]/80 font-semibold">
                    Ver todas <ChevronRight size={12} className="ml-1" />
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[550px]">
                    <thead>
                      <tr className="border-b border-[#2a2d3e] text-[10px] font-bold text-[#5a5e72] uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Pedido</th>
                        <th className="px-4 py-3 text-left">Comprador</th>
                        <th className="px-4 py-3 text-left">Data</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: "#9842", client: "João S.", date: "09 Abr 2026", status: "Em preparo", color: "text-[#3483fa]", bg: "bg-[#3483fa]/10", amount: "R$ 349,00" },
                        { id: "#9841", client: "Maria O.", date: "08 Abr 2026", status: "Aguard. receita", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", amount: "R$ 199,90" },
                        { id: "#9840", client: "Carlos S.", date: "08 Abr 2026", status: "Enviado", color: "text-[#a855f7]", bg: "bg-[#a855f7]/10", amount: "R$ 289,90" },
                        { id: "#9839", client: "Ana L.", date: "07 Abr 2026", status: "Entregue", color: "text-[#00a650]", bg: "bg-[#00a650]/10", amount: "R$ 159,90" },
                        { id: "#9838", client: "Pedro R.", date: "06 Abr 2026", status: "Entregue", color: "text-[#00a650]", bg: "bg-[#00a650]/10", amount: "R$ 349,90" },
                      ].map((o, i) => (
                        <tr key={i} className="border-b border-[#2a2d3e]/50 hover:bg-[#12141f] transition-colors cursor-pointer">
                          <td className="px-4 py-3 text-sm font-bold text-[#e8eaf0]">{o.id}</td>
                          <td className="px-4 py-3 text-sm text-[#8b8fa3]">{o.client}</td>
                          <td className="px-4 py-3 text-sm text-[#8b8fa3]">{o.date}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${o.color} ${o.bg}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-[#e8eaf0]">{o.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: Truck, title: "Logística", desc: "Gerencie entregas e rastreios", color: "text-[#3483fa]", border: "border-[#3483fa]/20", bg: "bg-[#3483fa]/5" },
                  { icon: ShieldCheck, title: "Receitas", desc: "Validação de prescrições", color: "text-[#00a650]", border: "border-[#00a650]/20", bg: "bg-[#00a650]/5" },
                  { icon: RefreshCw, title: "Devoluções", desc: "Trocas e reembolsos", color: "text-[#f59e0b]", border: "border-[#f59e0b]/20", bg: "bg-[#f59e0b]/5" },
                ].map((c, i) => (
                  <div key={i} className={`${c.bg} rounded-lg ${c.border} border p-4 sm:p-5 hover:border-opacity-60 transition-all cursor-pointer group`}>
                    <c.icon size={24} className={`${c.color} mb-3`} />
                    <h4 className="font-bold text-sm text-[#e8eaf0] mb-1">{c.title}</h4>
                    <p className="text-[11px] text-[#8b8fa3] mb-3">{c.desc}</p>
                    <span className={`text-[11px] font-semibold ${c.color} flex items-center gap-1 group-hover:gap-2 transition-all`}>
                      Acessar <ArrowRight size={12} />
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ─── FINANCIAL TAB ─── */}
            <TabsContent value="financial" className="space-y-6">
              {/* Big Balance */}
              <div className="bg-gradient-to-r from-[#1e2235] via-[#1a1d2e] to-[#1e2235] rounded-lg border border-[#2a2d3e] p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#8b8fa3] font-medium mb-1">Saldo disponível para saque</p>
                    <p className="text-3xl sm:text-4xl font-bold text-[#e8eaf0] mb-1">{fmtPrice(balance || 14345)}</p>
                    <p className="text-[11px] text-[#8b8fa3]">Taxa de manutenção: 5% • Processamento PIX em até 24h úteis</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button className="bg-[#00a650] hover:bg-[#00a650]/90 text-white font-bold rounded-md h-11 px-6 text-sm flex-1 sm:flex-none shadow-lg shadow-[#00a650]/20"
                      onClick={() => setWithdrawOpen(true)}>
                      <Wallet size={16} className="mr-2" /> Sacar Agora
                    </Button>
                    <Button variant="outline" className="border-[#2a2d3e] text-[#8b8fa3] rounded-md h-11 px-4 hover:border-[#3483fa]/40 hover:text-[#3483fa]">
                      <Download size={16} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Vendas brutas", value: fmtPrice((totalRevenue || 14345) + (totalFees || 755)), color: "text-[#e8eaf0]" },
                  { label: "Taxa P&R (5%)", value: `- ${fmtPrice(totalFees || 755)}`, color: "text-[#ff5252]" },
                  { label: "Receita líquida", value: fmtPrice(totalRevenue || 14345), color: "text-[#00a650]" },
                  { label: "Total sacado", value: fmtPrice(0), color: "text-[#f59e0b]" },
                ].map((s, i) => (
                  <div key={i} className="bg-[#1a1d2e] rounded-lg border border-[#2a2d3e] p-3 sm:p-4">
                    <p className="text-[10px] text-[#8b8fa3] font-medium mb-1">{s.label}</p>
                    <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Transaction History */}
              <div className="bg-[#1a1d2e] rounded-lg border border-[#2a2d3e]">
                <div className="flex items-center justify-between p-4 border-b border-[#2a2d3e]">
                  <h3 className="text-sm font-bold text-[#e8eaf0]">Movimentações</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-[10px] text-[#8b8fa3] hover:text-[#3483fa] font-medium">
                      <Calendar size={12} className="mr-1" /> Filtrar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[10px] text-[#8b8fa3] hover:text-[#3483fa] font-medium">
                      <Download size={12} className="mr-1" /> CSV
                    </Button>
                  </div>
                </div>
                <div className="p-3 sm:p-4 space-y-2">
                  {transactions.length > 0 ? transactions.slice(0, 10).map(tx => <MLTxRow key={tx.id} tx={tx} />) : (
                    <>
                      {[
                        { id: "1", type: "sale", amount: 289.9, platform_fee: 14.5, vendor_amount: 275.4, status: "completed", payment_method: "PIX", notes: null, created_at: "2026-04-09T10:30:00Z", product_id: null, buyer_id: null },
                        { id: "2", type: "sale", amount: 199.9, platform_fee: 10.0, vendor_amount: 189.9, status: "completed", payment_method: "Cartão", notes: null, created_at: "2026-04-08T15:20:00Z", product_id: null, buyer_id: null },
                        { id: "3", type: "sale", amount: 349.9, platform_fee: 17.5, vendor_amount: 332.4, status: "pending", payment_method: "BTC", notes: null, created_at: "2026-04-07T09:15:00Z", product_id: null, buyer_id: null },
                        { id: "4", type: "withdrawal", amount: 500, platform_fee: 25, vendor_amount: 475, status: "completed", payment_method: "PIX", notes: null, created_at: "2026-04-05T14:00:00Z", product_id: null, buyer_id: null },
                        { id: "5", type: "sale", amount: 159.9, platform_fee: 8.0, vendor_amount: 151.9, status: "completed", payment_method: "PIX", notes: null, created_at: "2026-04-04T11:45:00Z", product_id: null, buyer_id: null },
                      ].map(tx => <MLTxRow key={tx.id} tx={tx as VendorTx} />)}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />

      <WhatsAppProofModal
        open={!!whatsappModal?.open}
        onOpenChange={(v) => { if (!v) setWhatsappModal(null); }}
        context={whatsappModal?.ctx || ({ type: "compra", productName: "", value: 0 } as WhatsAppContext)}
        onProceed={() => setWhatsappModal(null)}
      />
    </div>
  );
};

export default ShoppingDashboard;
