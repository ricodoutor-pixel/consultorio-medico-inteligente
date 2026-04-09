import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign, Users, Activity, Shield, Wifi, WifiOff,
  Clock, TrendingUp, AlertTriangle, Bot, Terminal, Search,
  ChevronDown, Bell, LogOut, Stethoscope, Eye, MessageSquare,
  ShoppingBag, CreditCard, ArrowUpRight, ArrowDownRight, Zap,
  Globe, Server, Database, Cpu, Heart, RefreshCw, Filter,
  Download, Package, Truck, FileText, Calendar, BarChart3,
  CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* ─── SIMULATED DATA ─── */
const generateUserMarkers = () => {
  const cities = [
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
    { name: "Buenos Aires", coordinates: [-58.38, -34.6] as [number, number], users: 67 },
    { name: "Bogotá", coordinates: [-74.07, 4.71] as [number, number], users: 34 },
    { name: "Cidade do México", coordinates: [-99.13, 19.43] as [number, number], users: 23 },
  ];
  return cities.map(c => ({
    ...c,
    online: Math.random() > 0.4,
    recentLogin: Math.random() > 0.6,
  }));
};

const generateRevenueData = () => {
  const days = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      receita: Math.floor(3000 + Math.random() * 12000),
      consultas: Math.floor(800 + Math.random() * 5000),
      marketplace: Math.floor(400 + Math.random() * 3000),
    });
  }
  return days;
};

const salesByPlan = [
  { name: "Consultas", value: 45, color: "#39FF14" },
  { name: "Club VIP", value: 25, color: "#00D4FF" },
  { name: "Marketplace", value: 20, color: "#FF6B35" },
  { name: "Assinaturas", value: 10, color: "#A855F7" },
];

const generateSecurityLogs = () => [
  { time: "agora", msg: "[AUTH] Login admin: contato@plantayraiz.com.br — IP 187.45.xx.xx", level: "info" },
  { time: "2m", msg: "[RLS] Tentativa de acesso negado — tabela: medical_records — uid: anon", level: "warn" },
  { time: "5m", msg: "[ANVISA] Prescrição #RX-4521 validada — Hash SHA-256 OK", level: "info" },
  { time: "8m", msg: "[PAYMENT] Webhook MP recebido — R$ 150,00 — split processado", level: "info" },
  { time: "12m", msg: "[FRAUD] Score anomalia: 0.12 (baixo) — transação #TXN-8821", level: "info" },
  { time: "15m", msg: "[BRISA] Triagem emergencial — paciente encaminhado — urgência: ALTA", level: "warn" },
  { time: "18m", msg: "[SYSTEM] Health check OK — latência: 42ms — uptime: 99.97%", level: "info" },
  { time: "22m", msg: "[AI] Verdinho respondeu 847 interações (últimas 24h) — satisfação: 94%", level: "info" },
  { time: "25m", msg: "[LGPD] Solicitação de portabilidade processada — uid: ****-7f3a", level: "info" },
  { time: "30m", msg: "[RLS] Policy audit completo — 27 tabelas — 0 violações", level: "info" },
];

/* ─── MAIN COMPONENT ─── */
const AdminMaster = () => {
  const [markers, setMarkers] = useState(generateUserMarkers());
  const [revenueData] = useState(generateRevenueData());
  const [securityLogs] = useState(generateSecurityLogs());
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [pulsePhase, setPulsePhase] = useState(0);

  // Real data from Supabase
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [onlineDoctors, setOnlineDoctors] = useState(0);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [aiEvents, setAiEvents] = useState<any[]>([]);
  const [alertSubscribers, setAlertSubscribers] = useState(0);

  const loadDashboardData = useCallback(async () => {
    const [
      { count: usersCount },
      { data: doctors },
      { data: escrows },
      { data: payments },
      { data: events },
      { count: subsCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("doctors").select("id, user_id, specialty, is_online, is_verified, rating, total_consultations, crm, crm_state").order("is_online", { ascending: false }),
      supabase.from("escrow_transactions").select("amount, status, type, created_at").eq("status", "released"),
      supabase.from("payment_webhooks").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("ai_events").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("product_alert_subscriptions").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);

    setTotalUsers(usersCount || 0);
    if (doctors) {
      setTotalDoctors(doctors.length);
      setOnlineDoctors(doctors.filter(d => d.is_online).length);
      setDoctorsList(doctors);
    }
    if (escrows) setTotalRevenue(escrows.reduce((s, e) => s + Number(e.amount), 0));
    if (payments) setRecentPayments(payments);
    if (events) setAiEvents(events);
    setAlertSubscribers(subsCount || 0);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      setMarkers(generateUserMarkers());
      setPulsePhase(p => p + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("admin-master-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, () => loadDashboardData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payment_webhooks" }, () => loadDashboardData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => loadDashboardData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadDashboardData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const fmtCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const simulatedMonthlyRevenue = 47850 + totalRevenue;
  const simulatedAnnualRevenue = simulatedMonthlyRevenue * 12;
  const conversionRate = totalUsers > 0 ? ((totalDoctors * 3.2 / totalUsers) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen" style={{ background: "#0A0E27" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: "#39FF1420", background: "#0A0E27EE" }}>
        <div className="flex items-center justify-between px-4 md:px-8 h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #39FF14, #00D4FF)" }}>
              <Shield size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold" style={{ color: "#39FF14" }}>MANUS CEO — ADMIN MASTER</h1>
              <p className="text-[10px] md:text-xs" style={{ color: "#39FF1480" }}>Centro de Comando 360° • Planta y Raiz</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: "#39FF1480" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#39FF14" }} />
              Ao vivo • {lastRefresh.toLocaleTimeString("pt-BR")}
            </div>
            <Button size="sm" variant="ghost" onClick={loadDashboardData} className="gap-1" style={{ color: "#39FF14" }}>
              <RefreshCw size={14} /> <span className="hidden md:inline">Atualizar</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="gap-1 text-red-400 hover:text-red-300">
              <LogOut size={14} /> <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="p-3 md:p-6 space-y-4 md:space-y-6 max-w-[1920px] mx-auto">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Faturamento Mensal", value: fmtCurrency(simulatedMonthlyRevenue), icon: DollarSign, change: "+12.5%", up: true, color: "#39FF14" },
            { label: "Usuários Total", value: totalUsers.toLocaleString(), icon: Users, change: `+${Math.floor(totalUsers * 0.08)}`, up: true, color: "#00D4FF" },
            { label: "Médicos Online", value: `${onlineDoctors}/${totalDoctors}`, icon: Stethoscope, change: onlineDoctors > 0 ? "Ativos" : "Offline", up: onlineDoctors > 0, color: "#FF6B35" },
            { label: "Conversão", value: `${conversionRate}%`, icon: TrendingUp, change: "Meta: 35%", up: Number(conversionRate) > 20, color: "#A855F7" },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-0 shadow-2xl" style={{ background: "#0F1340", borderLeft: `3px solid ${kpi.color}` }}>
                <CardContent className="p-3 md:p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                      <kpi.icon size={18} style={{ color: kpi.color }} />
                    </div>
                    <span className={`text-[10px] md:text-xs flex items-center gap-0.5 ${kpi.up ? "text-green-400" : "text-red-400"}`}>
                      {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {kpi.change}
                    </span>
                  </div>
                  <p className="text-lg md:text-2xl font-bold text-white">{kpi.value}</p>
                  <p className="text-[10px] md:text-xs mt-1" style={{ color: "#ffffff60" }}>{kpi.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Grid: Map + Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* World Map */}
          <motion.div className="xl:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 overflow-hidden" style={{ background: "#0F1340" }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm md:text-base flex items-center gap-2" style={{ color: "#39FF14" }}>
                    <Globe size={18} /> Mapa de Usuários em Tempo Real
                  </CardTitle>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full animate-pulse bg-green-400" /> Online</span>
                    <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" /> Offline</span>
                    <span className="flex items-center gap-1 text-cyan-400"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> Novo</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 md:p-2">
                <div className="relative" style={{ background: "#080B20" }}>
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: 150, center: [-45, -10] }}
                    style={{ width: "100%", height: "auto", maxHeight: 450 }}
                  >
                    <Geographies geography={GEO_URL}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rpiKey || geo.id || geo.properties?.name}
                            geography={geo}
                            fill="#1a1f4e"
                            stroke="#39FF1420"
                            strokeWidth={0.5}
                            style={{
                              hover: { fill: "#252b66" },
                            }}
                          />
                        ))
                      }
                    </Geographies>
                    {markers.map((m, i) => (
                      <Marker
                        key={m.name}
                        coordinates={m.coordinates}
                        onMouseEnter={() => setHoveredMarker(m.name)}
                        onMouseLeave={() => setHoveredMarker(null)}
                      >
                        {/* Pulse ring for online/recent */}
                        {m.online && (
                          <circle r={8 + Math.sin(pulsePhase + i) * 2} fill="none" stroke={m.recentLogin ? "#00D4FF" : "#39FF14"} strokeWidth={1} opacity={0.4} />
                        )}
                        <circle
                          r={Math.max(3, Math.min(m.users / 100, 8))}
                          fill={m.recentLogin ? "#00D4FF" : m.online ? "#39FF14" : "#FF4444"}
                          opacity={m.online ? 0.9 : 0.5}
                          style={{ cursor: "pointer" }}
                        />
                        {hoveredMarker === m.name && (
                          <g>
                            <rect x={12} y={-20} width={140} height={36} rx={6} fill="#0A0E27" stroke="#39FF14" strokeWidth={0.5} />
                            <text x={18} y={-4} fontSize={10} fill="#39FF14" fontWeight="bold">{m.name}</text>
                            <text x={18} y={10} fontSize={9} fill="#ffffff80">{m.users} usuários • {m.online ? "Online" : "Offline"}</text>
                          </g>
                        )}
                      </Marker>
                    ))}
                  </ComposableMap>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar: Doctors Online */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-0 h-full" style={{ background: "#0F1340" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#00D4FF" }}>
                  <Stethoscope size={16} /> Profissionais ({totalDoctors})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {doctorsList.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: "#ffffff40" }}>Nenhum profissional cadastrado</p>
                )}
                {doctorsList.map((doc, i) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg transition-all hover:scale-[1.01]"
                    style={{ background: doc.is_online ? "#39FF1408" : "#ffffff05" }}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#1a1f4e", color: doc.is_online ? "#39FF14" : "#ffffff40" }}>
                        {doc.specialty?.charAt(0) || "M"}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${doc.is_online ? "animate-pulse" : ""}`}
                        style={{ borderColor: "#0F1340", background: doc.is_online ? "#39FF14" : doc.is_verified ? "#FFB800" : "#666" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">CRM {doc.crm}/{doc.crm_state}</p>
                      <p className="text-[10px] truncate" style={{ color: "#ffffff50" }}>{doc.specialty} • ⭐ {doc.rating || "5.0"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                        background: doc.is_online ? "#39FF1420" : "#ffffff10",
                        color: doc.is_online ? "#39FF14" : "#ffffff40"
                      }}>
                        {doc.is_online ? "Online" : "Offline"}
                      </span>
                      <span className="text-[9px]" style={{ color: "#ffffff30" }}>{doc.total_consultations || 0} consultas</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Revenue Charts + Sales Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-0" style={{ background: "#0F1340" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#39FF14" }}>
                  <TrendingUp size={16} /> Receita Diária (30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#39FF14" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#39FF14" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      contentStyle={{ background: "#0A0E27", border: "1px solid #39FF1440", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#39FF14" }}
                      formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]}
                    />
                    <Area type="monotone" dataKey="receita" stroke="#39FF14" strokeWidth={2} fill="url(#greenGrad)" name="Total" />
                    <Area type="monotone" dataKey="consultas" stroke="#00D4FF" strokeWidth={1.5} fill="url(#blueGrad)" name="Consultas" />
                    <Area type="monotone" dataKey="marketplace" stroke="#FF6B35" strokeWidth={1} fill="none" name="Marketplace" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="border-0 h-full" style={{ background: "#0F1340" }}>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#A855F7" }}>
                  <ShoppingBag size={16} /> Distribuição de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={salesByPlan} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">
                      {salesByPlan.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ background: "#0A0E27", border: "1px solid #39FF1440", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number, name: string) => [`${v}%`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                  {salesByPlan.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span style={{ color: "#ffffff80" }}>{s.name} ({s.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom: System Health + Security Logs + Recent Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* AI & System Health */}
          <Card className="border-0" style={{ background: "#0F1340" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#00D4FF" }}>
                <Bot size={16} /> Saúde do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Brisa IA (Triagem)", status: "Ativa", color: "#39FF14", icon: Heart },
                { name: "Verdinho (Chatbot)", status: "Ativo", color: "#39FF14", icon: Bot },
                { name: "Mercado Pago", status: "Conectado", color: "#39FF14", icon: CreditCard },
                { name: "Supabase Realtime", status: "Online", color: "#39FF14", icon: Database },
                { name: "Jitsi Meet", status: "Standby", color: "#FFB800", icon: Activity },
                { name: "Twilio WhatsApp", status: "Ativo", color: "#39FF14", icon: MessageSquare },
              ].map(sys => (
                <div key={sys.name} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "#ffffff05" }}>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${sys.color}15` }}>
                    <sys.icon size={14} style={{ color: sys.color }} />
                  </div>
                  <span className="flex-1 text-xs text-white">{sys.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${sys.color}15`, color: sys.color }}>{sys.status}</span>
                </div>
              ))}
              <div className="pt-2 border-t" style={{ borderColor: "#ffffff10" }}>
                <div className="flex items-center justify-between text-[10px]" style={{ color: "#ffffff40" }}>
                  <span>🔔 Inscritos Alertas: {alertSubscribers}</span>
                  <span>Uptime: 99.97%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Terminal */}
          <Card className="border-0" style={{ background: "#0F1340" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#FF6B35" }}>
                <Terminal size={16} /> Logs de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg p-3 font-mono text-[10px] md:text-[11px] space-y-1.5 max-h-[320px] overflow-y-auto" style={{ background: "#080B20" }}>
                {securityLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span style={{ color: "#ffffff30" }}>{log.time}</span>
                    <span style={{ color: log.level === "warn" ? "#FFB800" : "#39FF14" }}>{log.msg}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1 pt-2" style={{ color: "#39FF1460" }}>
                  <span className="animate-pulse">▌</span> Monitorando em tempo real...
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments Feed */}
          <Card className="border-0" style={{ background: "#0F1340" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#39FF14" }}>
                <CreditCard size={16} /> Pagamentos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
              {recentPayments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs" style={{ color: "#ffffff30" }}>Aguardando pagamentos...</p>
                  {/* Simulated feed */}
                  {[
                    { status: "approved", amount: 150, email: "p***@gmail.com", time: "há 2min" },
                    { status: "approved", amount: 89.90, email: "m***@outlook.com", time: "há 8min" },
                    { status: "approved", amount: 299, email: "c***@yahoo.com", time: "há 15min" },
                    { status: "pending", amount: 49.90, email: "r***@gmail.com", time: "há 22min" },
                    { status: "approved", amount: 450, email: "a***@hotmail.com", time: "há 30min" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg mt-2" style={{ background: "#ffffff05" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.status === "approved" ? "#39FF14" : "#FFB800" }} />
                        <span className="text-[10px] text-white">{p.email}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium" style={{ color: "#39FF14" }}>R$ {p.amount.toFixed(2)}</span>
                        <p className="text-[9px]" style={{ color: "#ffffff30" }}>{p.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                recentPayments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "#ffffff05" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: p.status === "approved" ? "#39FF14" : "#FFB800" }} />
                      <span className="text-[10px] text-white">{p.payer_email || "—"}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium" style={{ color: "#39FF14" }}>R$ {(p.amount || 0).toFixed(2)}</span>
                      <p className="text-[9px]" style={{ color: "#ffffff30" }}>{new Date(p.created_at).toLocaleTimeString("pt-BR")}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Stats */}
        <div className="text-center py-4">
          <p className="text-[10px]" style={{ color: "#ffffff20" }}>
            MANUS CEO Admin v5.0 • Planta y Raiz Ltda • Dados atualizados: {lastRefresh.toLocaleString("pt-BR")} •
            Faturamento Anual Estimado: {fmtCurrency(simulatedAnnualRevenue)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminMaster;
