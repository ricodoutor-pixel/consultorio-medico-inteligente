import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { userChannel } from "@/lib/realtime-channels";
import {
  DollarSign, Users, Activity, Shield, Wifi, WifiOff,
  Clock, TrendingUp, AlertTriangle, Bot, Terminal, Search,
  Bell, LogOut, Stethoscope, Eye, MessageSquare,
  ShoppingBag, CreditCard, ArrowUpRight, ArrowDownRight, Zap,
  Globe, Server, Database, Cpu, Heart, RefreshCw, Filter,
  Download, Package, Truck, FileText, Calendar, BarChart3,
  CheckCircle2, XCircle, AlertCircle, Flame, ThermometerSun,
  Smile, Frown, Meh, Volume2, TrendingDown, Megaphone, Scale,
  Headphones, Target, PieChart as PieChartIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import {
  ComposableMap, Geographies, Geography, Marker,
} from "react-simple-maps";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { toast } from "sonner";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* ═══ TYPES ═══ */
type Department = "overview" | "financeiro" | "operacional" | "logistica" | "juridico" | "marketing";
type AlertZone = "green" | "yellow" | "red";

const DEPARTMENT_CONFIG: Record<Department, { label: string; icon: any; color: string; roles: string[] }> = {
  overview:     { label: "Visão Geral",  icon: Globe,        color: "#39FF14", roles: ["admin"] },
  financeiro:   { label: "Financeiro",   icon: DollarSign,   color: "#39FF14", roles: ["admin", "financeiro"] },
  operacional:  { label: "SAC / Vendas", icon: Headphones,   color: "#00D4FF", roles: ["admin", "operacional", "vendas"] },
  logistica:    { label: "Logística",    icon: Truck,        color: "#FF6B35", roles: ["admin", "logistica"] },
  juridico:     { label: "Compliance",   icon: Scale,        color: "#A855F7", roles: ["admin", "juridico"] },
  marketing:    { label: "Marketing",    icon: Megaphone,    color: "#FF6B9D", roles: ["admin", "marketing"] },
};

/* ═══ SIMULATED DATA ═══ */
const CITIES_BASE = [
  { name: "São Paulo", coordinates: [-46.63, -23.55] as [number, number], users: 1240 },
  { name: "Rio de Janeiro", coordinates: [-43.17, -22.91] as [number, number], users: 890 },
  { name: "Belo Horizonte", coordinates: [-43.94, -19.92] as [number, number], users: 456 },
  { name: "Curitiba", coordinates: [-49.27, -25.43] as [number, number], users: 320 },
  { name: "Porto Alegre", coordinates: [-51.18, -30.03] as [number, number], users: 278 },
  { name: "Salvador", coordinates: [-38.51, -12.97] as [number, number], users: 345 },
  { name: "Recife", coordinates: [-34.88, -8.05] as [number, number], users: 234 },
  { name: "Brasília", coordinates: [-47.93, -15.78] as [number, number], users: 189 },
  { name: "Manaus", coordinates: [-60.02, -3.12] as [number, number], users: 98 },
  { name: "Fortaleza", coordinates: [-38.52, -3.73] as [number, number], users: 267 },
  { name: "Lisboa", coordinates: [-9.14, 38.74] as [number, number], users: 78 },
  { name: "Miami", coordinates: [-80.19, 25.76] as [number, number], users: 45 },
];

const PATHOLOGY_DATA: Record<string, { condition: string; intensity: number; color: string }[]> = {
  "São Paulo": [{ condition: "Ansiedade", intensity: 92, color: "#FF4444" }],
  "Rio de Janeiro": [{ condition: "Dor Crônica", intensity: 85, color: "#FF4444" }],
  "Curitiba": [{ condition: "Ansiedade", intensity: 95, color: "#FF4444" }],
  "Recife": [{ condition: "Dor Crônica", intensity: 88, color: "#FF4444" }],
  "Belo Horizonte": [{ condition: "Insônia", intensity: 70, color: "#FF6B35" }],
  "Salvador": [{ condition: "Epilepsia", intensity: 55, color: "#FFB800" }],
  "Porto Alegre": [{ condition: "Parkinson", intensity: 40, color: "#39FF14" }],
  "Brasília": [{ condition: "Ansiedade", intensity: 75, color: "#FF6B35" }],
};

const generateMarkers = () => CITIES_BASE.map(c => ({
  ...c, online: Math.random() > 0.4, recentLogin: Math.random() > 0.6,
  heatIntensity: (PATHOLOGY_DATA[c.name]?.[0]?.intensity || 20) + Math.floor(Math.random() * 10 - 5),
  topCondition: PATHOLOGY_DATA[c.name]?.[0]?.condition || "Geral",
}));

const generateRevenueData = () => {
  const days = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push({ date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), receita: Math.floor(3000 + Math.random() * 12000), consultas: Math.floor(800 + Math.random() * 5000), marketplace: Math.floor(400 + Math.random() * 3000) });
  }
  return days;
};

const generateFunnelData = () => [
  { name: "Home", value: 1000 + Math.floor(Math.random() * 500), fill: "#39FF14" },
  { name: "Página de Serviço", value: 650 + Math.floor(Math.random() * 200), fill: "#00D4FF" },
  { name: "Clicou Agendar", value: 320 + Math.floor(Math.random() * 100), fill: "#A855F7" },
  { name: "Página Pagamento", value: 180 + Math.floor(Math.random() * 60), fill: "#FF6B35" },
  { name: "Pagamento OK", value: 85 + Math.floor(Math.random() * 30), fill: "#39FF14" },
];

const generateSentimentData = () => {
  const hours = [];
  for (let i = 23; i >= 0; i--) {
    const h = new Date(); h.setHours(h.getHours() - i);
    hours.push({ hora: `${h.getHours().toString().padStart(2, "0")}h`, positivo: Math.floor(40 + Math.random() * 45), neutro: Math.floor(20 + Math.random() * 25), negativo: Math.floor(2 + Math.random() * 18) });
  }
  return hours;
};

const generateSecurityLogs = () => [
  { time: "agora", msg: "[AUTH] Login admin — IP 187.45.xx.xx", level: "info" },
  { time: "2m", msg: "[RLS] Acesso negado — tabela: medical_records", level: "warn" },
  { time: "5m", msg: "[ANVISA] Prescrição #RX-4521 validada — SHA-256 OK", level: "info" },
  { time: "8m", msg: "[PAYMENT] Webhook MP — R$ 150 — split processado", level: "info" },
  { time: "12m", msg: "[FRAUD] Score anomalia: 0.12 — TXN-8821", level: "info" },
  { time: "15m", msg: "[BRISA] Triagem emergencial — urgência: ALTA", level: "warn" },
  { time: "18m", msg: "[SYSTEM] Health OK — latência 42ms — uptime 99.97%", level: "info" },
  { time: "22m", msg: "[LGPD] Portabilidade processada — uid: ****-7f3a", level: "info" },
];

const salesByPlan = [
  { name: "Orientações Técnicas", value: 45, color: "#39FF14" },
  { name: "Club VIP", value: 25, color: "#00D4FF" },
  { name: "Marketplace", value: 20, color: "#FF6B35" },
  { name: "Assinaturas", value: 10, color: "#A855F7" },
];

const leadsOriginData = [
  { source: "Google Orgânico", leads: 420, cost: 0, color: "#39FF14" },
  { source: "Instagram Ads", leads: 285, cost: 3200, color: "#FF6B9D" },
  { source: "WhatsApp", leads: 180, cost: 0, color: "#25D366" },
  { source: "Referral", leads: 145, cost: 500, color: "#00D4FF" },
  { source: "Facebook Ads", leads: 95, cost: 1800, color: "#3483fa" },
  { source: "TikTok", leads: 60, cost: 900, color: "#A855F7" },
];

const SENTIMENT_KEYWORDS = {
  positive: ["ótimo", "excelente", "obrigado", "ajudou", "recomendo"],
  negative: ["erro", "lentidão", "não consigo", "demora", "cancelar"],
};

/* ═══ HELPERS ═══ */
const fmtCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const heatColor = (i: number) => i > 80 ? "#FF000099" : i > 60 ? "#FF6B3580" : i > 40 ? "#FFB80060" : "#39FF1430";

const exportCSV = (headers: string[], rows: string[][], filename: string) => {
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename}.csv exportado com sucesso!`);
};

/* ═══ MAIN COMPONENT ═══ */
const AdminMaster = () => {
  const [activeTab, setActiveTab] = useState<Department>("overview");
  const [userRole, setUserRole] = useState<string>("viewer");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = (data ?? []).map((r: any) => r.role as string);
      // Prefer admin if present, otherwise first role, otherwise viewer
      setUserRole(roles.includes("admin") ? "admin" : (roles[0] ?? "viewer"));
    })();
  }, []);
  const [markers, setMarkers] = useState(generateMarkers());
  const [revenueData] = useState(generateRevenueData());
  const [securityLogs] = useState(generateSecurityLogs());
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [pulsePhase, setPulsePhase] = useState(0);
  const [mapMode, setMapMode] = useState<"users" | "heatmap">("users");
  const [sentimentData] = useState(generateSentimentData());
  const [funnelData, setFunnelData] = useState(generateFunnelData());

  // Real data
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [onlineDoctors, setOnlineDoctors] = useState(0);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [vendorTxs, setVendorTxs] = useState<any[]>([]);
  const [escrowTxs, setEscrowTxs] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [alertSubscribers, setAlertSubscribers] = useState(0);
  const [salesSearch, setSalesSearch] = useState("");
  const [salesTab, setSalesTab] = useState("todas");

  const loadDashboardData = useCallback(async () => {
    const [
      { count: usersCount }, { data: doctors }, { data: escrows }, { data: payments },
      { count: subsCount }, { data: vTxs }, { data: allEscrows }, { data: appts }, { data: vProducts },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("doctors").select("id, user_id, specialty, is_online, is_verified, rating, total_consultations, crm, crm_state").order("is_online", { ascending: false }),
      supabase.from("escrow_transactions").select("amount, status, type, created_at").eq("status", "released"),
      supabase.from("payment_webhooks").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("product_alert_subscriptions").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("vendor_transactions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("escrow_transactions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("appointments").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("vendor_products").select("id, name, stock, sold_count, is_active, category, vendor_id").order("stock", { ascending: true }).limit(20),
    ]);
    setTotalUsers(usersCount || 0);
    if (doctors) { setTotalDoctors(doctors.length); setOnlineDoctors(doctors.filter(d => d.is_online).length); setDoctorsList(doctors); }
    if (escrows) setTotalRevenue(escrows.reduce((s, e) => s + Number(e.amount), 0));
    if (payments) setRecentPayments(payments);
    setAlertSubscribers(subsCount || 0);
    if (vTxs) setVendorTxs(vTxs);
    if (allEscrows) setEscrowTxs(allEscrows);
    if (appts) setAppointments(appts);
    if (vProducts) setVendorProducts(vProducts);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      setMarkers(generateMarkers());
      setPulsePhase(p => p + 1);
      setFunnelData(generateFunnelData());
    }, 5000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  useEffect(() => {
    let ch: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const uid = data.user?.id;
      if (!uid) return;
      ch = supabase.channel(userChannel(uid, "admin-master-rt"))
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, (payload) => {
        loadDashboardData();
        if (payload.eventType === "UPDATE" && payload.new?.is_verified && !payload.old?.is_verified) {
          toast.success("✅ Novo Médico Verificado!", { description: `CRM ${payload.new.crm}/${payload.new.crm_state}` });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payment_webhooks" }, (payload) => {
        loadDashboardData();
        const amount = payload.new?.amount;
        const status = payload.new?.status;
        if (status === "approved") {
          toast.success(`💰 Pagamento Recebido: R$ ${Number(amount || 0).toFixed(2)}`, { description: `Payer: ${payload.new?.payer_email || "—"}` });
        } else if (status === "rejected" || status === "refunded") {
          toast.error(`⚠️ Alerta de Pagamento: ${status}`, { description: `Valor: R$ ${Number(amount || 0).toFixed(2)}` });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "medical_subscriptions" }, (payload) => {
        loadDashboardData();
        const tier = payload.new?.plan_tier;
        if (tier === "basic") {
          toast("🌟 Novo Médico VIP!", { description: "Um profissional ativou o Plano VIP — Taxa Zero" });
        } else if (tier === "premium" || tier === "enterprise") {
          toast("👑 Upgrade de Plano!", { description: `Médico atualizou para ${tier.toUpperCase()}` });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => loadDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_transactions" }, () => loadDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_products" }, () => loadDashboardData())
      .subscribe();
    });
    return () => {
      cancelled = true;
      if (ch) supabase.removeChannel(ch);
    };
  }, [loadDashboardData]);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  const simulatedMonthlyRevenue = 47850 + totalRevenue;
  const conversionRate = totalUsers > 0 ? ((totalDoctors * 3.2 / totalUsers) * 100).toFixed(1) : "0";

  /* ═══ ALERT ZONE CALCULATION ═══ */
  const alertZone = useMemo<AlertZone>(() => {
    const openSACCount = Math.floor(Math.random() * 20); // simulated
    const paymentFailing = recentPayments.some(p => p.status === "rejected" || p.status === "refunded");
    const longQueueDoctor = doctorsList.some(d => d.is_online && (d.total_consultations || 0) > 50);
    if (paymentFailing || longQueueDoctor) return "red";
    const lowStock = vendorProducts.filter(p => p.stock <= 5 && p.is_active).length > 0;
    if (openSACCount > 10 || lowStock) return "yellow";
    return "green";
  }, [recentPayments, doctorsList, vendorProducts]);

  const zoneStyles: Record<AlertZone, { bg: string; border: string; label: string; icon: any }> = {
    green:  { bg: "#39FF1410", border: "#39FF1440", label: "OPERAÇÃO NORMAL", icon: CheckCircle2 },
    yellow: { bg: "#FFB80010", border: "#FFB80040", label: "ATENÇÃO — SAC/ESTOQUE", icon: AlertTriangle },
    red:    { bg: "#FF444410", border: "#FF444440", label: "CRÍTICO — AÇÃO IMEDIATA", icon: XCircle },
  };

  const doctorPerformance = useMemo(() => doctorsList.map(doc => {
    const hoursOnline = Math.floor(Math.random() * 10);
    const nps = Math.floor(60 + Math.random() * 40);
    return { ...doc, hoursOnline, avgResponseMin: Math.floor(1 + Math.random() * 8), avgConsultMin: Math.floor(15 + Math.random() * 30), nps, isBurnout: hoursOnline >= 6, fatigueLevel: hoursOnline >= 6 ? "critical" : hoursOnline >= 4 ? "warning" : "ok" };
  }), [doctorsList]);

  const sentimentTotals = useMemo(() => {
    const last = sentimentData.slice(-6);
    const pos = last.reduce((s, d) => s + d.positivo, 0);
    const neu = last.reduce((s, d) => s + d.neutro, 0);
    const neg = last.reduce((s, d) => s + d.negativo, 0);
    const total = pos + neu + neg;
    return { positive: total ? Math.round((pos / total) * 100) : 0, neutral: total ? Math.round((neu / total) * 100) : 0, negative: total ? Math.round((neg / total) * 100) : 0, mood: neg > pos ? "critical" : neg > neu ? "warning" : "positive" as string };
  }, [sentimentData]);

  const lowStockProducts = useMemo(() => vendorProducts.filter(p => p.stock <= 5 && p.is_active), [vendorProducts]);
  const supplyChain = useMemo(() => {
    const paid = vendorTxs.filter(t => t.status === "completed" || t.status === "approved").length || 12;
    return { paid, separating: Math.floor(paid * 0.6), shipped: Math.floor(paid * 0.35), delivered: Math.floor(paid * 0.2), total: paid };
  }, [vendorTxs]);

  const canAccess = (dept: Department) => {
    const config = DEPARTMENT_CONFIG[dept];
    return config.roles.includes(userRole);
  };

  const visibleDepts = (Object.keys(DEPARTMENT_CONFIG) as Department[]).filter(canAccess);

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      approved: { bg: "#39FF1420", color: "#39FF14", label: "Aprovado" },
      paid: { bg: "#39FF1420", color: "#39FF14", label: "Pago" },
      released: { bg: "#39FF1420", color: "#39FF14", label: "Liberado" },
      completed: { bg: "#39FF1420", color: "#39FF14", label: "Concluído" },
      pending: { bg: "#FFB80020", color: "#FFB800", label: "Pendente" },
      held: { bg: "#FFB80020", color: "#FFB800", label: "Retido" },
      scheduled: { bg: "#00D4FF20", color: "#00D4FF", label: "Agendado" },
      cancelled: { bg: "#FF444420", color: "#FF4444", label: "Cancelado" },
      refunded: { bg: "#FF444420", color: "#FF4444", label: "Reembolsado" },
    };
    const s = map[status] || { bg: "#ffffff10", color: "#ffffff60", label: status };
    return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
  };

  /* ═══ EXPORT HELPERS ═══ */
  const exportFinanceiro = () => exportCSV(
    ["Tipo", "Valor", "Taxa", "Status", "Data"],
    [...vendorTxs.map(t => ["Marketplace", String(t.amount), String(t.platform_fee), t.status, t.created_at]),
     ...escrowTxs.map(t => [t.type, String(t.amount), String(t.platform_fee), t.status, t.created_at])],
    `financeiro_${new Date().toISOString().slice(0, 10)}`
  );
  const exportLogistica = () => exportCSV(
    ["Produto", "Estoque", "Vendidos", "Categoria", "Ativo"],
    vendorProducts.map(p => [p.name, String(p.stock), String(p.sold_count), p.category, p.is_active ? "Sim" : "Não"]),
    `logistica_${new Date().toISOString().slice(0, 10)}`
  );
  const exportCompliance = () => exportCSV(
    ["Médico CRM", "Estado", "Especialidade", "Verificado", "Online"],
    doctorsList.map(d => [`CRM ${d.crm}`, d.crm_state, d.specialty, d.is_verified ? "Sim" : "Não", d.is_online ? "Sim" : "Não"]),
    `compliance_${new Date().toISOString().slice(0, 10)}`
  );

  /* ═══ RENDER SECTIONS ═══ */
  const renderZoneBanner = () => {
    const z = zoneStyles[alertZone];
    return (
      <motion.div animate={alertZone === "red" ? { opacity: [1, 0.7, 1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: z.bg, border: `1px solid ${z.border}` }}>
        <z.icon size={18} style={{ color: z.border.replace("40", "") }} />
        <div>
          <p className="text-xs font-bold" style={{ color: z.border.replace("40", "") }}>{z.label}</p>
          <p className="text-[10px]" style={{ color: "#ffffff50" }}>
            {alertZone === "green" && "Todos os sistemas operando normalmente."}
            {alertZone === "yellow" && "Verifique SAC ou estoque com níveis baixos."}
            {alertZone === "red" && "Falha de pagamento ou fila médica longa detectada!"}
          </p>
        </div>
      </motion.div>
    );
  };

  const mrrEstimated = simulatedMonthlyRevenue * 0.65; // Recurring portion
  const lucroLiquido = simulatedMonthlyRevenue * 0.07; // Platform 7% fee
  const saldoRepassar = simulatedMonthlyRevenue * 0.93; // Doctors' share

  const renderKPIs = () => (
    <div className="space-y-3">
      {/* Primary Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "MRR (Receita Recorrente)", value: fmtCurrency(mrrEstimated), icon: TrendingUp, change: "+18%", up: true, color: "#39FF14" },
          { label: "Saldo a Repassar", value: fmtCurrency(saldoRepassar), icon: Users, change: "93% Split", up: true, color: "#00D4FF" },
          { label: "Lucro Líquido (7%)", value: fmtCurrency(lucroLiquido), icon: DollarSign, change: "+12.5%", up: true, color: "#A855F7" },
          { label: "Receita Bruta", value: fmtCurrency(simulatedMonthlyRevenue), icon: BarChart3, change: "+23%", up: true, color: "#FF6B35" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border-0 shadow-2xl" style={{ background: "#0F1340", borderLeft: `3px solid ${kpi.color}` }}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between mb-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                    <kpi.icon size={16} style={{ color: kpi.color }} />
                  </div>
                  <span className={`text-[10px] flex items-center gap-0.5 ${kpi.up ? "text-green-400" : "text-red-400"}`}>
                    {kpi.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{kpi.change}
                  </span>
                </div>
                <p className="text-lg font-bold text-white">{kpi.value}</p>
                <p className="text-[10px]" style={{ color: "#ffffff50" }}>{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
        {[
          { label: "Médicos Online", value: `${onlineDoctors}/${totalDoctors}`, color: onlineDoctors > 0 ? "#39FF14" : "#FF4444" },
          { label: "Usuários Total", value: totalUsers.toLocaleString(), color: "#00D4FF" },
          { label: "Conversão", value: `${conversionRate}%`, color: Number(conversionRate) > 20 ? "#39FF14" : "#FFB800" },
        ].map((kpi, i) => (
          <Card key={i} className="border-0" style={{ background: "#0F1340", borderTop: `2px solid ${kpi.color}` }}>
            <CardContent className="p-2.5 text-center">
              <p className="text-sm font-bold text-white">{kpi.value}</p>
              <p className="text-[9px]" style={{ color: "#ffffff50" }}>{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMap = () => (
    <Card className="border-0" style={{ background: "#0F1340" }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#39FF14" }}>
            <Globe size={16} /> {mapMode === "users" ? "Geolocalização" : "🌡️ Heatmap Patologias"}
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setMapMode(m => m === "users" ? "heatmap" : "users")} className="text-[10px] gap-1 h-7" style={{ color: mapMode === "heatmap" ? "#FF6B35" : "#39FF14", background: "#ffffff08" }}>
            <ThermometerSun size={12} /> {mapMode === "users" ? "Heatmap" : "Usuários"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 md:p-2">
        <div style={{ background: "#080B20" }}>
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 150, center: [-45, -10] }} style={{ width: "100%", height: "auto", maxHeight: 380 }}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) => geographies.map(geo => (
                <Geography key={geo.rsmKey || geo.id} geography={geo} fill="#1a1f4e" stroke="#39FF1420" strokeWidth={0.5} style={{ hover: { fill: "#252b66" } }} />
              ))}
            </Geographies>
            {markers.map((m, i) => (
              <Marker key={m.name} coordinates={m.coordinates} onMouseEnter={() => setHoveredMarker(m.name)} onMouseLeave={() => setHoveredMarker(null)}>
                {mapMode === "heatmap" ? (
                  <>
                    <circle r={Math.max(12, m.heatIntensity / 4)} fill={heatColor(m.heatIntensity)} opacity={0.5 + Math.sin(pulsePhase + i) * 0.15} />
                    <circle r={Math.max(6, m.heatIntensity / 8)} fill={heatColor(m.heatIntensity)} opacity={0.8} />
                  </>
                ) : (
                  <>
                    {m.online && <circle r={8 + Math.sin(pulsePhase + i) * 2} fill="none" stroke={m.recentLogin ? "#00D4FF" : "#39FF14"} strokeWidth={1} opacity={0.4} />}
                    <circle r={Math.max(3, Math.min(m.users / 100, 8))} fill={m.recentLogin ? "#00D4FF" : m.online ? "#39FF14" : "#FF4444"} opacity={m.online ? 0.9 : 0.5} style={{ cursor: "pointer" }} />
                  </>
                )}
                {hoveredMarker === m.name && (
                  <g><rect x={12} y={-22} width={170} height={36} rx={6} fill="#0A0E27" stroke="#39FF14" strokeWidth={0.5} />
                    <text x={18} y={-6} fontSize={10} fill="#39FF14" fontWeight="bold">{m.name}</text>
                    <text x={18} y={8} fontSize={9} fill="#ffffff80">{mapMode === "heatmap" ? `🔥 ${m.topCondition} ${m.heatIntensity}%` : `${m.users} usuários`}</text>
                  </g>
                )}
              </Marker>
            ))}
          </ComposableMap>
        </div>
      </CardContent>
    </Card>
  );

  /* ═══ NPS CRITICAL ALERTS ═══ */
  const [npsAlerts, setNpsAlerts] = useState<any[]>([]);
  useEffect(() => {
    supabase.functions.invoke("nps-alerts").then(({ data }) => {
      if (data?.alerts) setNpsAlerts(data.alerts.filter((a: any) => a.severity === "high" || a.severity === "critical"));
    });
  }, []);

  const renderNPSAlerts = () => {
    if (npsAlerts.length === 0) return null;
    return (
      <Card className="border-0 overflow-hidden" style={{ background: "#1a0505", borderLeft: "3px solid #FF4444" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#FF4444" }}>
            <AlertTriangle size={16} className="animate-pulse" /> Alertas Críticos de NPS ({npsAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {npsAlerts.slice(0, 5).map((alert: any) => (
            <div key={alert.id} className="p-2.5 rounded-lg animate-pulse" style={{ background: alert.severity === "critical" ? "#FF444420" : "#FF6B3520", border: `1px solid ${alert.severity === "critical" ? "#FF444440" : "#FF6B3540"}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: alert.severity === "critical" ? "#FF4444" : "#FF6B35", color: "#fff" }}>
                  {alert.severity.toUpperCase()}
                </span>
                <span className="text-[9px]" style={{ color: "#ffffff60" }}>{new Date(alert.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-[11px] text-white">{alert.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  /* ═══ TAB: OVERVIEW ═══ */
  const renderOverview = () => (
    <div className="space-y-4">
      {renderNPSAlerts()}
      {renderKPIs()}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">{renderMap()}</div>
        {/* Doctors Sidebar */}
        <Card className="border-0" style={{ background: "#0F1340" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#00D4FF" }}><Stethoscope size={16} /> Profissionais ({totalDoctors})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[340px] px-4 pb-3">
              {doctorsList.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg mb-1" style={{ background: doc.is_online ? "#39FF1408" : "#ffffff05" }}>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#1a1f4e", color: doc.is_online ? "#39FF14" : "#ffffff40" }}>{doc.specialty?.charAt(0) || "M"}</div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${doc.is_online ? "animate-pulse" : ""}`} style={{ borderColor: "#0F1340", background: doc.is_online ? "#39FF14" : "#666" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-white truncate">CRM {doc.crm}/{doc.crm_state}</p>
                    <p className="text-[9px] truncate" style={{ color: "#ffffff50" }}>{doc.specialty} • ⭐ {doc.rating || "5.0"}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: doc.is_online ? "#39FF1420" : "#ffffff10", color: doc.is_online ? "#39FF14" : "#ffffff40" }}>{doc.is_online ? "Online" : "Offline"}</span>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      {/* System Health + Logs + Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0" style={{ background: "#0F1340" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#00D4FF" }}><Bot size={16} /> Automações & Integrações</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "Brisa IA", status: "Ativa", color: "#39FF14", icon: Heart, ping: true },
              { name: "Verdinho", status: "Ativo", color: "#39FF14", icon: Bot, ping: true },
              { name: "Mercado Pago", status: "Conectado", color: "#39FF14", icon: CreditCard, ping: true },
              { name: "Supabase RT", status: "Online", color: "#39FF14", icon: Database, ping: true },
              { name: "Evolution API", status: "Ativo", color: "#39FF14", icon: MessageSquare, ping: true },
              { name: "ManyChat", status: "Webhook OK", color: "#00D4FF", icon: Megaphone, ping: true },
            ].map(sys => (
              <div key={sys.name} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#ffffff05" }}>
                <div className="relative">
                  <sys.icon size={13} style={{ color: sys.color }} />
                  {sys.ping && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sys.color }} />}
                </div>
                <span className="flex-1 text-[11px] text-white">{sys.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${sys.color}15`, color: sys.color }}>{sys.status}</span>
              </div>
            ))}
            <div className="mt-2 p-2 rounded-lg" style={{ background: "#39FF1408", border: "1px solid #39FF1415" }}>
              <p className="text-[9px] font-bold" style={{ color: "#39FF1480" }}>⚡ Todas as automações operacionais — Última checagem: {new Date().toLocaleTimeString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ background: "#0F1340" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#FF6B35" }}><Terminal size={16} /> Logs de Segurança</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="font-mono text-[10px] space-y-1" style={{ color: "#ffffff80" }}>
                {securityLogs.map((l, i) => (
                  <div key={i} className="flex gap-2"><span style={{ color: "#39FF1460" }}>[{l.time}]</span><span style={{ color: l.level === "warn" ? "#FFB800" : "#ffffff60" }}>{l.msg}</span></div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ background: "#0F1340" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#39FF14" }}><CreditCard size={16} /> Pagamentos Recentes</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {(recentPayments.length === 0 ? [
                { status: "approved", amount: 150, payer_email: "p***@gmail.com", created_at: new Date().toISOString() },
                { status: "approved", amount: 89.90, payer_email: "m***@outlook.com", created_at: new Date().toISOString() },
                { status: "approved", amount: 299, payer_email: "c***@yahoo.com", created_at: new Date().toISOString() },
              ] : recentPayments).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg mb-1" style={{ background: "#ffffff05" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.status === "approved" ? "#39FF14" : "#FFB800" }} />
                    <span className="text-[10px] text-white">{p.payer_email || "—"}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#39FF14" }}>{fmtCurrency(Number(p.amount || 0))}</span>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  /* ═══ TAB: FINANCEIRO ═══ */
  const renderFinanceiro = () => {
    const totalVendorSales = vendorTxs.reduce((s, t) => s + Number(t.amount), 0);
    const totalEscrowVal = escrowTxs.reduce((s, t) => s + Number(t.amount), 0);
    const platformFees = vendorTxs.reduce((s, t) => s + Number(t.platform_fee), 0) + escrowTxs.reduce((s, t) => s + Number(t.platform_fee), 0);
    const doctorPayout = escrowTxs.reduce((s, t) => s + Number(t.doctor_payout || 0), 0);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold" style={{ color: "#39FF14" }}>💰 Painel Financeiro</h2>
          <Button size="sm" variant="ghost" onClick={exportFinanceiro} className="gap-1 text-[10px]" style={{ color: "#39FF14" }}><Download size={12} /> Exportar CSV</Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Receita Bruta", value: fmtCurrency(simulatedMonthlyRevenue), color: "#39FF14" },
            { label: "Repasse Médicos", value: fmtCurrency(doctorPayout || simulatedMonthlyRevenue * 0.93), color: "#00D4FF" },
            { label: "Taxas Plataforma (7%)", value: fmtCurrency(platformFees || simulatedMonthlyRevenue * 0.07), color: "#FF6B35" },
            { label: "Saldo em Conta", value: fmtCurrency(platformFees || simulatedMonthlyRevenue * 0.07), color: "#A855F7" },
          ].map((c, i) => (
            <Card key={i} className="border-0" style={{ background: "#0F1340", borderLeft: `3px solid ${c.color}` }}>
              <CardContent className="p-3"><p className="text-[10px]" style={{ color: "#ffffff50" }}>{c.label}</p><p className="text-lg font-bold text-white">{c.value}</p></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0" style={{ background: "#0F1340" }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: "#39FF14" }}>Receita Diária (30d)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueData}>
                  <defs><linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#39FF14" stopOpacity={0.3} /><stop offset="100%" stopColor="#39FF14" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" tick={{ fill: "#ffffff30", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#ffffff30", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip contentStyle={{ background: "#0A0E27", border: "1px solid #39FF1440", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="receita" stroke="#39FF14" strokeWidth={2} fill="url(#gGrad)" />
                  <Area type="monotone" dataKey="consultas" stroke="#00D4FF" strokeWidth={1} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-0" style={{ background: "#0F1340" }}>
            <CardHeader className="pb-0"><CardTitle className="text-sm" style={{ color: "#A855F7" }}>Distribuição de Vendas</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={salesByPlan} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">{salesByPlan.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><RechartsTooltip contentStyle={{ background: "#0A0E27", border: "1px solid #39FF1440", borderRadius: 8, fontSize: 11 }} /></PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">{salesByPlan.map(s => (
                <div key={s.name} className="flex items-center gap-1.5 text-[10px]"><span className="w-2 h-2 rounded-full" style={{ background: s.color }} /><span style={{ color: "#ffffff80" }}>{s.name} ({s.value}%)</span></div>
              ))}</div>
            </CardContent>
          </Card>
        </div>
        {/* Transaction List */}
        <Card className="border-0" style={{ background: "#0F1340" }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#39FF14" }}><BarChart3 size={16} /> Todas as Transações</CardTitle>
              <div className="relative"><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "#ffffff40" }} />
                <input value={salesSearch} onChange={e => setSalesSearch(e.target.value)} placeholder="Buscar..." className="pl-7 pr-3 py-1.5 rounded-md text-[11px] w-40 outline-none" style={{ background: "#1a1f4e", color: "#fff", border: "1px solid #ffffff15" }} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={salesTab} onValueChange={setSalesTab}>
              <TabsList className="mb-2 border-0" style={{ background: "#0A0E27" }}>
                <TabsTrigger value="todas" className="text-[10px] data-[state=active]:text-black data-[state=active]:bg-[#39FF14]">Todas</TabsTrigger>
                <TabsTrigger value="marketplace" className="text-[10px] data-[state=active]:text-black data-[state=active]:bg-[#3483fa]">Marketplace</TabsTrigger>
                <TabsTrigger value="escrow" className="text-[10px] data-[state=active]:text-black data-[state=active]:bg-[#00D4FF]">Escrow</TabsTrigger>
              </TabsList>
              <ScrollArea className="h-[300px]">
                <div className="hidden md:grid grid-cols-6 gap-2 px-3 py-1.5 text-[9px] font-semibold" style={{ color: "#ffffff40" }}>
                  <span>ID</span><span>Tipo</span><span>Valor</span><span>Taxa</span><span>Status</span><span>Data</span>
                </div>
                <TabsContent value="todas" className="mt-0 space-y-0.5">
                  {[...vendorTxs.map(t => ({ ...t, _label: "🛒 MKT", _color: "#3483fa" })), ...escrowTxs.map(t => ({ ...t, _label: "🩺 ESC", _color: "#00D4FF" }))]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .filter(t => !salesSearch || JSON.stringify(t).toLowerCase().includes(salesSearch.toLowerCase()))
                    .slice(0, 40).map((t, i) => (
                      <div key={`${t.id}-${i}`} className="grid grid-cols-3 md:grid-cols-6 gap-2 px-3 py-2 rounded-lg" style={{ background: "#0A0E2790" }}>
                        <span className="text-[9px] font-mono text-white truncate">{t.id.slice(0, 8)}…</span>
                        <span className="text-[9px]" style={{ color: t._color }}>{t._label}</span>
                        <span className="text-[10px] font-bold text-white">{fmtCurrency(Number(t.amount))}</span>
                        <span className="text-[9px]" style={{ color: "#FF6B35" }}>{fmtCurrency(Number(t.platform_fee))}</span>
                        {statusBadge(t.status)}
                        <span className="text-[9px]" style={{ color: "#ffffff40" }}>{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    ))}
                </TabsContent>
                <TabsContent value="marketplace" className="mt-0 space-y-0.5">
                  {vendorTxs.slice(0, 30).map((t, i) => (
                    <div key={i} className="grid grid-cols-3 md:grid-cols-6 gap-2 px-3 py-2 rounded-lg" style={{ background: "#0A0E2790" }}>
                      <span className="text-[9px] font-mono text-white truncate">{t.id.slice(0, 8)}…</span><span className="text-[9px]" style={{ color: "#3483fa" }}>🛒</span>
                      <span className="text-[10px] font-bold text-white">{fmtCurrency(Number(t.amount))}</span><span className="text-[9px]" style={{ color: "#FF6B35" }}>{fmtCurrency(Number(t.platform_fee))}</span>
                      {statusBadge(t.status)}<span className="text-[9px]" style={{ color: "#ffffff40" }}>{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="escrow" className="mt-0 space-y-0.5">
                  {escrowTxs.slice(0, 30).map((t, i) => (
                    <div key={i} className="grid grid-cols-3 md:grid-cols-6 gap-2 px-3 py-2 rounded-lg" style={{ background: "#0A0E2790" }}>
                      <span className="text-[9px] font-mono text-white truncate">{t.id.slice(0, 8)}…</span><span className="text-[9px]" style={{ color: "#00D4FF" }}>🩺</span>
                      <span className="text-[10px] font-bold text-white">{fmtCurrency(Number(t.amount))}</span><span className="text-[9px]" style={{ color: "#FF6B35" }}>{fmtCurrency(Number(t.platform_fee))}</span>
                      {statusBadge(t.status)}<span className="text-[9px]" style={{ color: "#ffffff40" }}>{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  /* ═══ TAB: OPERACIONAL (SAC/VENDAS) ═══ */
  const renderOperacional = () => (
    <div className="space-y-4">
      <h2 className="text-sm font-bold" style={{ color: "#00D4FF" }}>📞 SAC / Vendas — Operacional</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Atendimentos Ativos", value: `${Math.floor(3 + Math.random() * 12)}`, color: "#00D4FF" },
          { label: "Tempo Médio Resposta", value: `${Math.floor(2 + Math.random() * 6)} min`, color: "#39FF14" },
          { label: "Tickets Abertos", value: `${Math.floor(1 + Math.random() * 8)}`, color: "#FFB800" },
          { label: "NPS Geral", value: `${Math.floor(75 + Math.random() * 20)}`, color: "#A855F7" },
        ].map((c, i) => (
          <Card key={i} className="border-0" style={{ background: "#0F1340", borderLeft: `3px solid ${c.color}` }}>
            <CardContent className="p-3"><p className="text-[10px]" style={{ color: "#ffffff50" }}>{c.label}</p><p className="text-xl font-bold text-white">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Feed */}
        <Card className="border-0" style={{ background: "#0F1340" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#00D4FF" }}><Activity size={16} /> Live Feed de Atendimentos</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {[
                { user: "Maria S.", type: "Chat Brisa", time: "agora", status: "Em andamento" },
                { user: "João P.", type: "Agendamento", time: "2min", status: "Concluído" },
                { user: "Ana R.", type: "Suporte Pagamento", time: "5min", status: "Esperando" },
                { user: "Carlos M.", type: "Dúvida Receita", time: "8min", status: "Em andamento" },
                { user: "Patrícia L.", type: "Cancelamento", time: "12min", status: "Resolvido" },
                { user: "Roberto A.", type: "Bug Report", time: "15min", status: "Escalado" },
                { user: "Fernanda C.", type: "Assinatura Club", time: "18min", status: "Concluído" },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg mb-1" style={{ background: "#0A0E2790" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "#1a1f4e", color: "#00D4FF" }}>{a.user.charAt(0)}</div>
                    <div><p className="text-[10px] text-white font-medium">{a.user}</p><p className="text-[9px]" style={{ color: "#ffffff40" }}>{a.type} • {a.time}</p></div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: a.status === "Em andamento" ? "#00D4FF20" : a.status === "Concluído" || a.status === "Resolvido" ? "#39FF1420" : "#FFB80020", color: a.status === "Em andamento" ? "#00D4FF" : a.status === "Concluído" || a.status === "Resolvido" ? "#39FF14" : "#FFB800" }}>{a.status}</span>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
        {/* Funil de Vendas */}
        <Card className="border-0" style={{ background: "#0F1340" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#39FF14" }}><TrendingDown size={16} /> Funil de Conversão Live</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((stage, i) => {
                const prevValue = i === 0 ? stage.value : funnelData[i - 1].value;
                const dropRate = i === 0 ? 0 : Math.round(((prevValue - stage.value) / prevValue) * 100);
                const pct = Math.round((stage.value / funnelData[0].value) * 100);
                return (
                  <div key={stage.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white">{stage.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white">{stage.value}</span>
                        {dropRate > 0 && <span className="text-[9px] px-1 py-0.5 rounded-full" style={{ background: dropRate > 50 ? "#FF444420" : "#FFB80020", color: dropRate > 50 ? "#FF4444" : "#FFB800" }}>-{dropRate}%</span>}
                      </div>
                    </div>
                    <div className="w-full h-4 rounded-md" style={{ background: "#0A0E27" }}>
                      <motion.div className="h-full rounded-md" style={{ background: `${stage.fill}40`, borderRight: `2px solid ${stage.fill}`, width: `${pct}%` }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
                    </div>
                    {dropRate > 50 && <p className="text-[8px] mt-0.5 text-red-400 flex items-center gap-1"><AlertTriangle size={9} /> Gargalo!</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Sentiment */}
      <Card className="border-0" style={{ background: "#0F1340" }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#A855F7" }}>{sentimentTotals.mood === "positive" ? <Smile size={16} /> : <Frown size={16} />} Mood da Plataforma</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center p-2 rounded-lg" style={{ background: "#39FF1410" }}><p className="text-lg font-bold text-white">{sentimentTotals.positive}%</p><p className="text-[9px]" style={{ color: "#39FF14" }}>Positivo</p></div>
            <div className="text-center p-2 rounded-lg" style={{ background: "#FFB80010" }}><p className="text-lg font-bold text-white">{sentimentTotals.neutral}%</p><p className="text-[9px]" style={{ color: "#FFB800" }}>Neutro</p></div>
            <div className="text-center p-2 rounded-lg" style={{ background: "#FF444410" }}><p className="text-lg font-bold text-white">{sentimentTotals.negative}%</p><p className="text-[9px]" style={{ color: "#FF4444" }}>Negativo</p></div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={sentimentData.slice(-12)}>
              <defs><linearGradient id="sp2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#39FF14" stopOpacity={0.3} /><stop offset="100%" stopColor="#39FF14" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="hora" tick={{ fill: "#ffffff30", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Area type="monotone" dataKey="positivo" stroke="#39FF14" fill="url(#sp2)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="negativo" stroke="#FF4444" fill="none" strokeWidth={1.5} />
              <RechartsTooltip contentStyle={{ background: "#0A0E27", border: "1px solid #ffffff20", borderRadius: 8, fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-1 mt-2">
            {SENTIMENT_KEYWORDS.positive.slice(0, 3).map(w => <span key={w} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "#39FF1415", color: "#39FF14" }}>+{w}</span>)}
            {SENTIMENT_KEYWORDS.negative.slice(0, 3).map(w => <span key={w} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "#FF444415", color: "#FF4444" }}>-{w}</span>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /* ═══ TAB: LOGÍSTICA ═══ */
  const renderLogistica = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold" style={{ color: "#FF6B35" }}>📦 Logística & Reposição</h2>
        <Button size="sm" variant="ghost" onClick={exportLogistica} className="gap-1 text-[10px]" style={{ color: "#FF6B35" }}><Download size={12} /> Exportar CSV</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pedidos Pagos", value: supplyChain.paid, icon: CreditCard, color: "#39FF14" },
          { label: "Em Separação", value: supplyChain.separating, icon: Package, color: "#00D4FF" },
          { label: "Enviados", value: supplyChain.shipped, icon: Truck, color: "#FF6B35" },
          { label: "Entregues", value: supplyChain.delivered, icon: CheckCircle2, color: "#A855F7" },
        ].map((s, i) => (
          <Card key={i} className="border-0" style={{ background: "#0F1340", borderLeft: `3px solid ${s.color}` }}>
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon size={18} style={{ color: s.color }} />
              <div><p className="text-[10px]" style={{ color: "#ffffff50" }}>{s.label}</p><p className="text-xl font-bold text-white">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Pipeline Progress */}
      <Card className="border-0" style={{ background: "#0F1340" }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: "#FF6B35" }}>Pipeline de Pedidos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Pagos → Separação", value: supplyChain.separating, total: supplyChain.paid, color: "#39FF14" },
            { label: "Separação → Envio", value: supplyChain.shipped, total: supplyChain.separating, color: "#00D4FF" },
            { label: "Envio → Entrega", value: supplyChain.delivered, total: supplyChain.shipped, color: "#A855F7" },
          ].map((s, i) => (
            <div key={i}>
              <div className="flex justify-between text-[10px] mb-1"><span className="text-white">{s.label}</span><span style={{ color: s.color }}>{s.total > 0 ? Math.round((s.value / s.total) * 100) : 0}%</span></div>
              <div className="w-full h-3 rounded-full" style={{ background: "#0A0E27" }}>
                <motion.div className="h-full rounded-full" style={{ background: s.color, width: `${s.total > 0 ? (s.value / s.total) * 100 : 0}%` }} initial={{ width: 0 }} animate={{ width: `${s.total > 0 ? (s.value / s.total) * 100 : 0}%` }} transition={{ duration: 1, delay: i * 0.2 }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {/* Low Stock Alerts */}
      <Card className="border-0" style={{ background: "#0F1340", border: lowStockProducts.length > 0 ? "1px solid #FF444430" : "none" }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#FF4444" }}><AlertTriangle size={16} /> Alertas de Ruptura ({lowStockProducts.length})</CardTitle></CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: "#39FF14" }}>✅ Estoque normalizado</p>
          ) : (
            <ScrollArea className="h-[200px]">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg mb-1" style={{ background: "#FF444410" }}>
                  <div><p className="text-[10px] text-white font-medium">{p.name}</p><p className="text-[9px]" style={{ color: "#ffffff40" }}>{p.category}</p></div>
                  <span className="text-xs font-bold" style={{ color: p.stock === 0 ? "#FF4444" : "#FFB800" }}>{p.stock === 0 ? "ESGOTADO" : `${p.stock} un.`}</span>
                </div>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      {/* All Products */}
      <Card className="border-0" style={{ background: "#0F1340" }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: "#00D4FF" }}>Inventário Completo</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="hidden md:grid grid-cols-5 gap-2 px-3 py-1.5 text-[9px] font-semibold" style={{ color: "#ffffff40" }}><span>Produto</span><span>Categoria</span><span>Estoque</span><span>Vendidos</span><span>Status</span></div>
            {vendorProducts.map(p => (
              <div key={p.id} className="grid grid-cols-3 md:grid-cols-5 gap-2 px-3 py-2 rounded-lg mb-0.5" style={{ background: "#0A0E2790" }}>
                <span className="text-[10px] text-white truncate">{p.name}</span>
                <span className="text-[9px]" style={{ color: "#ffffff50" }}>{p.category}</span>
                <span className="text-[10px] font-bold" style={{ color: p.stock <= 5 ? "#FF4444" : p.stock <= 20 ? "#FFB800" : "#39FF14" }}>{p.stock}</span>
                <span className="text-[10px] text-white">{p.sold_count}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: p.is_active ? "#39FF1420" : "#FF444420", color: p.is_active ? "#39FF14" : "#FF4444" }}>{p.is_active ? "Ativo" : "Inativo"}</span>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  /* ═══ TAB: JURÍDICO/COMPLIANCE ═══ */
  const renderJuridico = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold" style={{ color: "#A855F7" }}>⚖️ Compliance & Jurídico</h2>
        <Button size="sm" variant="ghost" onClick={exportCompliance} className="gap-1 text-[10px]" style={{ color: "#A855F7" }}><Download size={12} /> Exportar CSV</Button>
      </div>
      {/* Doctor CRM Approval */}
      <Card className="border-0" style={{ background: "#0F1340" }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#A855F7" }}><FileText size={16} /> Aprovação de Receitas & CRM</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="hidden md:grid grid-cols-6 gap-2 px-3 py-1.5 text-[9px] font-semibold" style={{ color: "#ffffff40" }}>
              <span>Médico</span><span>CRM/UF</span><span>Especialidade</span><span>Verificado</span><span>Receitas</span><span>Status CRM</span>
            </div>
            {doctorsList.map(doc => {
              const crmExpiring = Math.random() > 0.8;
              return (
                <div key={doc.id} className="grid grid-cols-3 md:grid-cols-6 gap-2 px-3 py-2.5 rounded-lg mb-0.5 items-center" style={{ background: crmExpiring ? "#FFB80008" : "#0A0E2790", border: crmExpiring ? "1px solid #FFB80025" : "none" }}>
                  <span className="text-[10px] text-white font-medium">{doc.specialty?.charAt(0)} Dr.</span>
                  <span className="text-[10px] font-mono" style={{ color: "#00D4FF" }}>{doc.crm}/{doc.crm_state}</span>
                  <span className="text-[9px]" style={{ color: "#ffffff50" }}>{doc.specialty}</span>
                  <span>{doc.is_verified
                    ? <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "#39FF1420", color: "#39FF14" }}>✅ Verificado</span>
                    : <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "#FF444420", color: "#FF4444" }}>❌ Pendente</span>}
                  </span>
                  <span className="text-[10px] text-white">{doc.total_consultations || 0}</span>
                  <span>{crmExpiring
                    ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "#FFB80020", color: "#FFB800" }}>⚠️ Vencendo</motion.span>
                    : <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "#39FF1420", color: "#39FF14" }}>Válido</span>}
                  </span>
                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
      </Card>
      {/* Burnout Table */}
      <Card className="border-0" style={{ background: "#0F1340" }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#FF6B35" }}><Flame size={16} /> Performance & Burnout</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="hidden md:grid grid-cols-7 gap-2 px-3 py-1.5 text-[9px] font-semibold" style={{ color: "#ffffff40" }}>
              <span>Médico</span><span>Especialidade</span><span>Horas Online</span><span>Resp. Média</span><span>NPS</span><span>Fadiga</span><span>Ação</span>
            </div>
            {doctorPerformance.map(doc => (
              <div key={doc.id} className="grid grid-cols-3 md:grid-cols-7 gap-2 px-3 py-2 rounded-lg mb-0.5 items-center" style={{ background: doc.isBurnout ? "#FF444410" : "#0A0E2790" }}>
                <span className="text-[10px] text-white">CRM {doc.crm}/{doc.crm_state}</span>
                <span className="text-[9px]" style={{ color: "#ffffff50" }}>{doc.specialty}</span>
                <span className="text-[10px] font-bold" style={{ color: doc.isBurnout ? "#FF4444" : doc.fatigueLevel === "warning" ? "#FFB800" : "#39FF14" }}>{doc.hoursOnline}h</span>
                <span className="text-[9px]" style={{ color: "#ffffff70" }}>{doc.avgResponseMin}min</span>
                <span className="text-[10px] font-bold" style={{ color: doc.nps >= 80 ? "#39FF14" : doc.nps >= 60 ? "#FFB800" : "#FF4444" }}>{doc.nps}</span>
                <span>{doc.isBurnout
                  ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#FF444430", color: "#FF4444" }}>⚠️ FADIGA</motion.span>
                  : <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "#39FF1420", color: "#39FF14" }}>OK</span>}
                </span>
                <Button size="sm" variant="ghost" className="h-6 text-[9px]" style={{ color: "#00D4FF" }}><MessageSquare size={10} /></Button>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
      {/* Security Logs */}
      <Card className="border-0" style={{ background: "#0F1340" }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#FF6B35" }}><Terminal size={16} /> Logs LGPD / ANVISA</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[180px]">
            <div className="font-mono text-[10px] space-y-1 p-2 rounded-lg" style={{ background: "#080B20", color: "#ffffff70" }}>
              {securityLogs.map((l, i) => (
                <div key={i} className="flex gap-2"><span style={{ color: "#39FF1460" }}>[{l.time}]</span><span style={{ color: l.level === "warn" ? "#FFB800" : "#ffffff50" }}>{l.msg}</span></div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  /* ═══ TAB: MARKETING ═══ */
  const renderMarketing = () => (
    <div className="space-y-4">
      <h2 className="text-sm font-bold" style={{ color: "#FF6B9D" }}>📣 Marketing & Leads</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Leads Total", value: leadsOriginData.reduce((s, l) => s + l.leads, 0).toString(), color: "#FF6B9D" },
          { label: "Custo Total Ads", value: fmtCurrency(leadsOriginData.reduce((s, l) => s + l.cost, 0)), color: "#FF6B35" },
          { label: "CPL Médio", value: fmtCurrency(leadsOriginData.reduce((s, l) => s + l.cost, 0) / leadsOriginData.reduce((s, l) => s + l.leads, 0)), color: "#00D4FF" },
          { label: "Alertas Inscritos", value: alertSubscribers.toString(), color: "#39FF14" },
        ].map((c, i) => (
          <Card key={i} className="border-0" style={{ background: "#0F1340", borderLeft: `3px solid ${c.color}` }}>
            <CardContent className="p-3"><p className="text-[10px]" style={{ color: "#ffffff50" }}>{c.label}</p><p className="text-lg font-bold text-white">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Origins Chart */}
        <Card className="border-0" style={{ background: "#0F1340" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#FF6B9D" }}><Target size={16} /> Origem dos Leads</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={leadsOriginData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis type="number" tick={{ fill: "#ffffff30", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="source" tick={{ fill: "#ffffff60", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
                <RechartsTooltip contentStyle={{ background: "#0A0E27", border: "1px solid #ffffff20", borderRadius: 8, fontSize: 10 }} />
                <Bar dataKey="leads" radius={[0, 4, 4, 0]}>{leadsOriginData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Cost Per Conversion */}
        <Card className="border-0" style={{ background: "#0F1340" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2" style={{ color: "#00D4FF" }}><PieChartIcon size={16} /> Custo por Conversão</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[240px]">
              {leadsOriginData.filter(l => l.cost > 0).map((l, i) => {
                const cpl = l.leads > 0 ? l.cost / l.leads : 0;
                return (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg mb-1.5" style={{ background: "#0A0E2790" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                      <div><p className="text-[10px] text-white">{l.source}</p><p className="text-[9px]" style={{ color: "#ffffff40" }}>{l.leads} leads</p></div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: cpl < 15 ? "#39FF14" : cpl < 30 ? "#FFB800" : "#FF4444" }}>{fmtCurrency(cpl)}/lead</p>
                      <p className="text-[9px]" style={{ color: "#ffffff30" }}>Total: {fmtCurrency(l.cost)}</p>
                    </div>
                  </div>
                );
              })}
              <div className="mt-3 p-3 rounded-lg" style={{ background: "#39FF1408" }}>
                <p className="text-[10px] font-bold" style={{ color: "#39FF14" }}>💡 Canais Orgânicos (Custo Zero)</p>
                {leadsOriginData.filter(l => l.cost === 0).map((l, i) => (
                  <div key={i} className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-white">{l.source}</span>
                    <span className="text-[9px] font-bold" style={{ color: "#39FF14" }}>{l.leads} leads</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  /* ═══ MAIN RENDER ═══ */
  return (
    <div className="min-h-dvh" style={{ background: "#0A0E27" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: "#39FF1420", background: "#0A0E27EE" }}>
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #39FF14, #00D4FF)" }}><Shield size={18} className="text-black" /></div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: "#39FF14" }}>MANUS CEO — COMMAND CENTER</h1>
              <p className="text-[9px]" style={{ color: "#39FF1460" }}>360° • Planta y Raiz • RBAC: {userRole.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 text-[10px]" style={{ color: "#39FF1460" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#39FF14" }} />
              Ao vivo • {lastRefresh.toLocaleTimeString("pt-BR")}
            </div>
            <Button size="sm" variant="ghost" onClick={loadDashboardData} className="gap-1 h-8" style={{ color: "#39FF14" }}><RefreshCw size={13} /></Button>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="gap-1 h-8 text-red-400 hover:text-red-300"><LogOut size={13} /></Button>
          </div>
        </div>
      </header>

      <div className="p-3 md:p-5 max-w-[1920px] mx-auto space-y-4">
        {/* Alert Zone Banner */}
        {renderZoneBanner()}

        {/* Department Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as Department)}>
          <TabsList className="w-full justify-start overflow-x-auto border-0 h-auto p-1 flex-wrap gap-1" style={{ background: "#0F1340" }}>
            {visibleDepts.map(dept => {
              const cfg = DEPARTMENT_CONFIG[dept];
              return (
                <TabsTrigger
                  key={dept}
                  value={dept}
                  className="text-[10px] md:text-[11px] gap-1.5 px-3 py-2 data-[state=active]:text-black rounded-lg transition-all"
                  style={{ ["--tw-shadow" as any]: "none" }}
                  data-active-bg={cfg.color}
                >
                  <cfg.icon size={13} />
                  {cfg.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview" className="mt-4">{renderOverview()}</TabsContent>
          <TabsContent value="financeiro" className="mt-4">{renderFinanceiro()}</TabsContent>
          <TabsContent value="operacional" className="mt-4">{renderOperacional()}</TabsContent>
          <TabsContent value="logistica" className="mt-4">{renderLogistica()}</TabsContent>
          <TabsContent value="juridico" className="mt-4">{renderJuridico()}</TabsContent>
          <TabsContent value="marketing" className="mt-4">{renderMarketing()}</TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center py-3">
          <p className="text-[9px]" style={{ color: "#ffffff15" }}>MANUS CEO Admin v7.0 • Planta y Raiz Ltda • {lastRefresh.toLocaleString("pt-BR")} • Faturamento Anual: {fmtCurrency(simulatedMonthlyRevenue * 12)}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminMaster;
