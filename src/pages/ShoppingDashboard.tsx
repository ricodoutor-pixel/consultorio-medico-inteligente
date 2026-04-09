import React, { useState, useEffect } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ShoppingBag, TrendingUp, Package, DollarSign, Clock, CheckCircle2, AlertCircle,
  BarChart3, Plus, Truck, ShieldCheck, RefreshCw, Wallet, ArrowUpRight, ArrowDownRight,
  Eye, Edit, Trash2, Image, Star, Users, CreditCard, Bitcoin, Download, Filter,
  Calendar, ChevronRight, Store, Award, Zap, Target, PieChart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart as RPieChart, Pie, AreaChart, Area } from 'recharts';
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

/* ─── Mock weekly/monthly data ─── */
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
const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#f59e0b', '#ef4444', '#6366f1'];

/* ─── Stat Card ─── */
const StatCard = ({ label, value, change, icon: Icon, color, bg, trend }: any) => (
  <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-all">
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}><Icon size={20} /></div>
        <div className={`flex items-center gap-1 text-[10px] font-bold ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'}`}>
          {trend === 'up' && <ArrowUpRight size={12} />}
          {trend === 'down' && <ArrowDownRight size={12} />}
          {change}
        </div>
      </div>
      <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-xl sm:text-2xl font-display font-black text-foreground">{value}</h3>
    </CardContent>
  </Card>
);

/* ─── Product Row ─── */
const ProductRow = ({ p, onToggle }: { p: VendorProduct; onToggle: (id: string, active: boolean) => void }) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all">
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-3 text-muted-foreground" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-sm font-bold text-foreground truncate">{p.name}</h4>
        <Badge variant={p.is_active ? "default" : "secondary"} className="text-[8px]">{p.is_active ? "Ativo" : "Inativo"}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
        <span className="font-bold text-foreground">{fmtPrice(p.price)}</span>
        {p.compare_price && <span className="line-through">{fmtPrice(p.compare_price)}</span>}
        <span>Estoque: {p.stock}</span>
        <span>Vendidos: {p.sold_count}</span>
        <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-400 fill-amber-400" /> {p.rating?.toFixed(1) || '5.0'}</span>
      </div>
    </div>
    <div className="flex items-center gap-2 self-end sm:self-center">
      <Switch checked={p.is_active} onCheckedChange={(v) => onToggle(p.id, v)} />
      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit size={14} /></Button>
    </div>
  </div>
);

/* ─── Transaction Row ─── */
const TxRow = ({ tx }: { tx: VendorTx }) => {
  const statusColors: Record<string, string> = { completed: 'text-green-500', pending: 'text-amber-500', processing: 'text-blue-400', failed: 'text-red-400' };
  const statusLabels: Record<string, string> = { completed: 'Concluído', pending: 'Pendente', processing: 'Processando', failed: 'Falhou' };
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-background/50 border border-border/50 gap-2">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === 'sale' ? 'bg-green-500/10 text-green-500' : tx.type === 'withdrawal' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
          {tx.type === 'sale' ? <CreditCard size={16} /> : tx.type === 'withdrawal' ? <Wallet size={16} /> : <RefreshCw size={16} />}
        </div>
        <div>
          <p className="text-xs sm:text-sm font-bold text-foreground">{tx.type === 'sale' ? 'Venda' : tx.type === 'withdrawal' ? 'Saque' : 'Reembolso'}</p>
          <p className="text-[10px] text-muted-foreground">{fmtDate(tx.created_at)} {tx.payment_method && `• ${tx.payment_method}`}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-6 self-end sm:self-center">
        <div className="text-right">
          <p className={`text-sm font-bold ${tx.type === 'withdrawal' ? 'text-amber-500' : 'text-green-500'}`}>
            {tx.type === 'withdrawal' ? '-' : '+'}{fmtPrice(tx.vendor_amount)}
          </p>
          {tx.platform_fee > 0 && <p className="text-[9px] text-muted-foreground">Taxa: {fmtPrice(tx.platform_fee)}</p>}
        </div>
        <Badge variant="outline" className={`text-[9px] font-bold ${statusColors[tx.status] || 'text-muted-foreground'}`}>
          {statusLabels[tx.status] || tx.status}
        </Badge>
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
  const [whatsappModal, setWhatsappModal] = useState<{ open: boolean; ctx: WhatsAppContext } | null>(null);

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch first vendor for demo (in production, use auth user_id)
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 pt-24 sm:pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* ─── Header ─── */}
          <header className="mb-8 sm:mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Store size={22} />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-bold text-primary tracking-widest uppercase">Portal do Lojista</span>
                  <h2 className="text-sm sm:text-base font-bold text-foreground">{vendor?.store_name || "Minha Loja"}</h2>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]"><Award size={10} className="mr-1" /> Verificada</Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-foreground mb-2">
                Dashboard de <span className="text-primary">Vendas</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Gerencie produtos, acompanhe métricas e solicite saques. Taxa plataforma: 5%.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-black font-black rounded-xl px-4 sm:px-6 h-10 sm:h-12 text-xs sm:text-sm">
                    <Wallet size={16} className="mr-2" /> Solicitar Saque
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display font-black text-xl">Solicitar Saque via PIX</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Saldo Disponível</p>
                      <p className="text-2xl font-black text-primary">{fmtPrice(balance)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Valor do Saque</label>
                      <Input type="number" placeholder="R$ 0,00" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="h-12 rounded-xl text-lg font-bold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Chave PIX</label>
                      <Input placeholder="CPF, Email, Celular ou Chave Aleatória" value={pixKey} onChange={e => setPixKey(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">⚡ Saques processados em até 24h úteis. Taxa de manutenção: 5%.</p>
                    <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-black text-sm" onClick={handleWithdraw}>
                      Confirmar Saque <ChevronRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="border-primary/30 text-primary font-bold rounded-xl px-4 sm:px-6 h-10 sm:h-12 text-xs sm:text-sm">
                <Plus size={16} className="mr-2" /> Novo Produto
              </Button>
            </div>
          </header>

          {/* ─── Key Metrics ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StatCard label="Receita Líquida" value={fmtPrice(totalRevenue || 14345)} change="+12.5%" icon={DollarSign} color="text-green-500" bg="bg-green-500/10" trend="up" />
            <StatCard label="Saldo Disponível" value={fmtPrice(balance || 14345)} change="Sacar" icon={Wallet} color="text-amber-500" bg="bg-amber-500/10" trend="" />
            <StatCard label="Produtos Vendidos" value={totalSold || 85} change="+18 esta semana" icon={Package} color="text-primary" bg="bg-primary/10" trend="up" />
            <StatCard label="Avaliação Média" value={`${avgRating.toFixed(1)} ★`} change={`${products.length} produtos`} icon={Star} color="text-amber-400" bg="bg-amber-400/10" trend="up" />
          </div>

          {/* ─── Secondary Metrics ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StatCard label="Taxa Plataforma (5%)" value={fmtPrice(totalFees || 755)} change="Retido" icon={TrendingUp} color="text-secondary" bg="bg-secondary/10" trend="" />
            <StatCard label="Estoque Baixo" value={lowStock.length} change="Reabastecer" icon={AlertCircle} color="text-red-400" bg="bg-red-400/10" trend={lowStock.length > 0 ? "down" : ""} />
            <StatCard label="Pedidos Pendentes" value="18" change="Ação necessária" icon={Clock} color="text-orange-500" bg="bg-orange-500/10" trend="" />
            <StatCard label="Conversão" value="4.2%" change="+0.3%" icon={Target} color="text-blue-400" bg="bg-blue-400/10" trend="up" />
          </div>

          {/* ─── Tabs ─── */}
          <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="bg-muted/50 p-1 rounded-xl inline-flex min-w-max">
                <TabsTrigger value="overview" className="rounded-lg font-bold text-xs sm:text-sm px-3 sm:px-4">📊 Visão Geral</TabsTrigger>
                <TabsTrigger value="products" className="rounded-lg font-bold text-xs sm:text-sm px-3 sm:px-4">📦 Produtos</TabsTrigger>
                <TabsTrigger value="orders" className="rounded-lg font-bold text-xs sm:text-sm px-3 sm:px-4">🚚 Pedidos</TabsTrigger>
                <TabsTrigger value="financial" className="rounded-lg font-bold text-xs sm:text-sm px-3 sm:px-4">💰 Financeiro</TabsTrigger>
              </TabsList>
            </div>

            {/* ─── OVERVIEW TAB ─── */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Weekly Sales Chart */}
                <Card className="lg:col-span-2 border-border/50 bg-card/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <BarChart3 size={16} className="text-primary" /> Vendas Semanais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[280px] sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }} />
                        <Bar dataKey="vendas" radius={[6, 6, 0, 0]}>
                          {weeklyData.map((_, i) => (
                            <Cell key={i} fill={i === 5 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Products + Low Stock */}
                <div className="space-y-4 sm:space-y-6">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                        <Zap size={14} className="text-primary" /> Top Produtos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(products.length > 0 ? products.sort((a, b) => b.sold_count - a.sold_count).slice(0, 3) : [
                        { name: "Óleo CBD Full Spectrum", sold_count: 42 },
                        { name: "Gummies Relax CBD", sold_count: 28 },
                        { name: "Creme Tópico CBD", sold_count: 15 },
                      ]).map((item: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-lg bg-background/50 border border-border/50 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-foreground truncate max-w-[160px]">{item.name}</p>
                            <p className="text-[9px] text-muted-foreground">{item.sold_count} vendidos</p>
                          </div>
                          <Badge variant="outline" className="text-[8px] text-green-500 border-green-500/30">#{i + 1}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {lowStock.length > 0 && (
                    <Card className="border-red-500/20 bg-red-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-red-400">
                          <AlertCircle size={14} /> Estoque Baixo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {lowStock.slice(0, 3).map((p, i) => (
                          <div key={i} className="flex justify-between py-1.5 text-[11px]">
                            <span className="text-foreground truncate max-w-[140px]">{p.name}</span>
                            <span className="text-red-400 font-bold">{p.stock} un</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-border/50 bg-card/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                        <PieChart size={14} className="text-secondary" /> Por Categoria
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RPieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none">
                            {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                        </RPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Monthly Revenue Trend */}
              <Card className="border-border/50 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-500" /> Receita Mensal (6 meses)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[220px] sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }} />
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="url(#colorReceita)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── PRODUCTS TAB ─── */}
            <TabsContent value="products" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-black text-foreground">Meus Produtos ({products.length}/10)</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Input placeholder="Buscar produto..." className="h-10 rounded-xl text-xs flex-1 sm:w-64" />
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"><Filter size={14} /></Button>
                </div>
              </div>
              <div className="space-y-3">
                {products.length > 0 ? products.map(p => (
                  <ProductRow key={p.id} p={p} onToggle={toggleProduct} />
                )) : (
                  <Card className="border-dashed border-2 border-border p-8 sm:p-12 text-center">
                    <Package size={40} className="mx-auto text-muted-foreground mb-4" />
                    <h4 className="font-black text-lg mb-2">Nenhum produto cadastrado</h4>
                    <p className="text-xs text-muted-foreground mb-4">Adicione até 10 produtos ao seu catálogo.</p>
                    <Button className="bg-primary font-bold rounded-xl"><Plus size={14} className="mr-2" /> Adicionar Produto</Button>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ─── ORDERS TAB ─── */}
            <TabsContent value="orders" className="space-y-4 sm:space-y-6">
              <Card className="border-border/50 bg-card/60">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg font-black">Pedidos Recentes</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">Ver Todos</Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <table className="w-full text-left min-w-[500px]">
                      <thead>
                        <tr className="border-b border-border text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <th className="pb-3">Pedido</th><th className="pb-3">Cliente</th><th className="pb-3">Data</th><th className="pb-3">Status</th><th className="pb-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs sm:text-sm">
                        {[
                          { id: "#9842", client: "João S.", date: "09 Abr 2026", status: "Preparando", amount: "R$ 349,00", color: "text-blue-400" },
                          { id: "#9841", client: "Maria O.", date: "08 Abr 2026", status: "Aguard. Receita", amount: "R$ 199,90", color: "text-amber-500" },
                          { id: "#9840", client: "Carlos S.", date: "08 Abr 2026", status: "Enviado", amount: "R$ 289,90", color: "text-green-500" },
                          { id: "#9839", client: "Ana L.", date: "07 Abr 2026", status: "Entregue", amount: "R$ 159,90", color: "text-primary" },
                          { id: "#9838", client: "Pedro R.", date: "06 Abr 2026", status: "Entregue", amount: "R$ 349,90", color: "text-primary" },
                        ].map((o, i) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                            <td className="py-3 font-bold text-foreground">{o.id}</td>
                            <td className="py-3 text-muted-foreground">{o.client}</td>
                            <td className="py-3 text-muted-foreground">{o.date}</td>
                            <td className="py-3"><span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${o.color}`}><Clock size={10} /> {o.status}</span></td>
                            <td className="py-3 text-right font-bold text-foreground">{o.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { icon: Truck, title: "Logística", desc: "Gerencie entregas e rastreamento", color: "text-secondary", border: "border-secondary/20" },
                  { icon: ShieldCheck, title: "Receitas", desc: "Validação de prescrições digitais", color: "text-primary", border: "border-primary/20" },
                  { icon: RefreshCw, title: "SAC", desc: "Devoluções e atendimento", color: "text-orange-500", border: "border-orange-500/20" },
                ].map((c, i) => (
                  <Card key={i} className={`${c.border} bg-card/60 p-4 sm:p-6 text-center`}>
                    <c.icon size={28} className={`${c.color} mx-auto mb-3`} />
                    <h4 className="font-black text-sm mb-1">{c.title}</h4>
                    <p className="text-[10px] text-muted-foreground mb-3">{c.desc}</p>
                    <Button variant="outline" size="sm" className={`w-full rounded-xl text-[10px] font-bold ${c.border} ${c.color}`}>Acessar</Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ─── FINANCIAL TAB ─── */}
            <TabsContent value="financial" className="space-y-4 sm:space-y-6">
              {/* Balance Card */}
              <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="p-4 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Saldo Disponível para Saque</p>
                      <h2 className="text-3xl sm:text-4xl font-display font-black text-primary">{fmtPrice(balance || 14345)}</h2>
                      <p className="text-[10px] text-muted-foreground mt-1">Taxa de manutenção: 5% sobre saques • PIX em até 24h úteis</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-black font-black rounded-xl h-10 sm:h-12 px-4 sm:px-6 text-xs sm:text-sm flex-1 sm:flex-none" onClick={() => setWithdrawOpen(true)}>
                        <Wallet size={16} className="mr-2" /> Sacar Agora
                      </Button>
                      <Button variant="outline" className="border-primary/30 rounded-xl h-10 sm:h-12 px-3 sm:px-4"><Download size={14} /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Vendas Brutas", value: fmtPrice((totalRevenue || 14345) + (totalFees || 755)), color: "text-foreground" },
                  { label: "Taxa P&R (5%)", value: `-${fmtPrice(totalFees || 755)}`, color: "text-red-400" },
                  { label: "Receita Líquida", value: fmtPrice(totalRevenue || 14345), color: "text-green-500" },
                  { label: "Sacado Total", value: fmtPrice(0), color: "text-amber-500" },
                ].map((s, i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-xl bg-card/60 border border-border/50">
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold mb-1">{s.label}</p>
                    <p className={`text-base sm:text-lg font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Transactions */}
              <Card className="border-border/50 bg-card/60">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg font-black">Histórico de Transações</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold"><Calendar size={12} className="mr-1" /> Filtrar</Button>
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold"><Download size={12} className="mr-1" /> Exportar</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {transactions.length > 0 ? transactions.slice(0, 10).map(tx => <TxRow key={tx.id} tx={tx} />) : (
                    <>
                      {[
                        { id: "1", type: "sale", amount: 289.9, platform_fee: 14.5, vendor_amount: 275.4, status: "completed", payment_method: "PIX", notes: null, created_at: "2026-04-09T10:30:00Z", product_id: null, buyer_id: null },
                        { id: "2", type: "sale", amount: 199.9, platform_fee: 10.0, vendor_amount: 189.9, status: "completed", payment_method: "Cartão", notes: null, created_at: "2026-04-08T15:20:00Z", product_id: null, buyer_id: null },
                        { id: "3", type: "sale", amount: 349.9, platform_fee: 17.5, vendor_amount: 332.4, status: "pending", payment_method: "BTC", notes: null, created_at: "2026-04-07T09:15:00Z", product_id: null, buyer_id: null },
                        { id: "4", type: "withdrawal", amount: 500, platform_fee: 25, vendor_amount: 475, status: "completed", payment_method: "PIX", notes: null, created_at: "2026-04-05T14:00:00Z", product_id: null, buyer_id: null },
                        { id: "5", type: "sale", amount: 159.9, platform_fee: 8.0, vendor_amount: 151.9, status: "completed", payment_method: "PIX", notes: null, created_at: "2026-04-04T11:45:00Z", product_id: null, buyer_id: null },
                      ].map(tx => <TxRow key={tx.id} tx={tx as VendorTx} />)}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <Footer />

      {whatsappModal && (
        <WhatsAppProofModal
          isOpen={whatsappModal.open}
          onClose={() => setWhatsappModal(null)}
          context={whatsappModal.ctx}
          onProceed={() => setWhatsappModal(null)}
        />
      )}
    </div>
  );
};

export default ShoppingDashboard;
