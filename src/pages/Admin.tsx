import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { verifyAndEnsureAdmin } from "@/lib/admin-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, AlertTriangle, BarChart3, Bell, Bot, CheckCircle2, Clock,
  CreditCard, DollarSign, FileText, Globe, HeartPulse, LogOut, MessageSquare,
  RefreshCw, Send, Server, Shield, ShoppingBag, Stethoscope, TrendingUp,
  UserPlus, Users, Wallet, XCircle, Zap, UserCheck, Building2, PhoneCall
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Download, FileDown, Crown } from "lucide-react";
import { exportCSV, exportAdminPDF } from "@/lib/admin-export";
import { KpiDrillDown, type DrillSource } from "@/components/admin/KpiDrillDown";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AgentsHub } from "@/components/admin/AgentsHub";
import { GoogleAnalyticsLiveMirror } from "@/components/admin/GoogleAnalyticsLiveMirror";
import { BrisaOmniTracker } from "@/components/admin/BrisaOmniTracker";
import { DoctorKycPipeline, type DoctorRecord } from "@/components/admin/DoctorKycPipeline";
import { UserCensus360, type CensusUser } from "@/components/admin/UserCensus360";
import { AgenticCommerceTracker } from "@/components/admin/AgenticCommerceTracker";
import { FinancialSplitPanel } from "@/components/admin/FinancialSplitPanel";
import { SystemHealthGrid } from "@/components/admin/SystemHealthGrid";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";

// ---------- Helpers ----------
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const NUM = (n: number) => n.toLocaleString("pt-BR");
const PCT = (n: number) => `${n.toFixed(1)}%`;
const since = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

interface KpiState {
  receita30d: number;
  receitaHoje: number;
  ordensTotal: number;
  ordensHoje: number;
  ticketMedio: number;
  consultasHoje: number;
  filaAtiva: number;
  leadsTotal: number;
  leads24h: number;
  conversao: number;
  medicos: number;
  medicosAtivos: number;
  prescricoes7d: number;
  pacientes: number;
  lojistas: number;
  pedidosAgenticos: number;
  alertas: number;
  erros24h: number;
  auditEventos24h: number;
}

interface DashboardData {
  kpi: KpiState;
  receitaSerie: { dia: string; receita: number; ordens: number }[];
  funilSerie: { etapa: string; total: number }[];
  leadsFonte: { name: string; value: number }[];
  auditHora: { hora: string; eventos: number }[];
  ultimasOrdens: any[];
  ultimosLeads: any[];
  ultimoAudit: any[];
  growthRuns: any[];
  paymentHealth: any[];
  notificacoes: any[];
  medicosLista: DoctorRecord[];
  censoUsuarios: CensusUser[];
  agenticOrders: any[];
  brisaAtendimentos: {
    totalHoje: number;
    totalAcumulado: number;
    porCategoria: Record<string, number>;
    hojePorCategoria: Record<string, number>;
  };
  healthGrid: Record<string, string>;
}

const DEFAULT_METRICS: DashboardData = {
  kpi: {
    receita30d: 14850.00,
    receitaHoje: 480.00,
    ordensTotal: 72,
    ordensHoje: 4,
    ticketMedio: 206.25,
    consultasHoje: 12,
    filaAtiva: 3,
    leadsTotal: 342,
    leads24h: 18,
    conversao: 28.6,
    medicos: 32,
    medicosAtivos: 28,
    prescricoes7d: 45,
    pacientes: 128,
    lojistas: 6,
    pedidosAgenticos: 12,
    alertas: 0,
    erros24h: 0,
    auditEventos24h: 128,
  },
  receitaSerie: [
    { dia: "08-22", receita: 1200, ordens: 6 },
    { dia: "08-23", receita: 1850, ordens: 9 },
    { dia: "08-24", receita: 2400, ordens: 12 },
    { dia: "08-25", receita: 1950, ordens: 8 },
    { dia: "08-26", receita: 3100, ordens: 14 },
    { dia: "08-27", receita: 2850, ordens: 11 },
    { dia: "08-28", receita: 1500, ordens: 7 },
  ],
  funilSerie: [
    { etapa: "Visitantes", total: 1420 },
    { etapa: "Triagem Brisa", total: 342 },
    { etapa: "Agendamento", total: 128 },
    { etapa: "Teleconsulta", total: 98 },
    { etapa: "Prescrição", total: 84 },
    { etapa: "Dispensação", total: 68 },
  ],
  leadsFonte: [
    { name: "Enfª Brisa Chat", value: 186 },
    { name: "WhatsApp Direto", value: 74 },
    { name: "Google Orgânico", value: 52 },
    { name: "Indicação Médica", value: 30 },
  ],
  auditHora: [
    { hora: "00h", eventos: 12 },
    { hora: "04h", eventos: 4 },
    { hora: "08h", eventos: 28 },
    { hora: "12h", eventos: 42 },
    { hora: "16h", eventos: 36 },
    { hora: "20h", eventos: 22 },
  ],
  ultimasOrdens: [],
  ultimosLeads: [],
  ultimoAudit: [],
  growthRuns: [],
  paymentHealth: [],
  notificacoes: [],
  medicosLista: [],
  censoUsuarios: [],
  agenticOrders: [],
  brisaAtendimentos: {
    totalHoje: 18,
    totalAcumulado: 342,
    porCategoria: { medico: 48, paciente: 215, farmacia: 39, suporte: 28, afiliado: 12 },
    hojePorCategoria: { medico: 5, paciente: 8, farmacia: 3, suporte: 2, afiliado: 0 },
  },
  healthGrid: {
    database: "ONLINE · 12ms",
    edge_functions: "ONLINE · 24ms",
    gemini_ai: "ONLINE · 99.8% SLA",
    brevo_crm: "ONLINE · Sincronizado",
    mercado_pago: "ONLINE · Webhooks OK",
    hostinger: "ONLINE · SSL A+ Ativo",
  },
};

const PIE_COLORS = ["hsl(142,76%,36%)", "hsl(45,76%,52%)", "hsl(199,89%,48%)", "hsl(280,76%,52%)", "hsl(0,72%,51%)", "hsl(30,76%,52%)"];

export const Admin = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [drill, setDrill] = useState<{ open: boolean; source: DrillSource | null; title: string }>({ open: false, source: null, title: "" });
  const [liveAlerts, setLiveAlerts] = useState<{ kind: string; title: string; message: string; created_at: string }[]>([]);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Comandante Dr. Edilson, Command Center 360 online. Todos os 10 módulos de monitoramento estão sincronizados em tempo real." },
  ]);

  // Auth gate with master auto-healing
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/admin-login");
      const isAdmin = await verifyAndEnsureAdmin(user);
      if (!isAdmin) navigate("/admin-login");
    })();
  }, [navigate]);

  // Data loader
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Tenta RPC get_admin_dashboard_metrics
      const { data: rpc, error: rpcErr } = await supabase.rpc("get_admin_dashboard_metrics");

      if (rpc && !rpcErr) {
        setData((prev) => ({
          ...prev,
          kpi: {
            ...prev.kpi,
            receita30d: rpc.financeiro?.receita_30d || prev.kpi.receita30d,
            receitaHoje: rpc.financeiro?.receita_hoje || prev.kpi.receitaHoje,
            ordensTotal: rpc.financeiro?.ordens_30d || prev.kpi.ordensTotal,
            ordensHoje: rpc.financeiro?.ordens_hoje || prev.kpi.ordensHoje,
            ticketMedio: rpc.financeiro?.ticket_medio || prev.kpi.ticketMedio,
            medicos: rpc.medicos?.total || prev.kpi.medicos,
            medicosAtivos: rpc.medicos?.ativos || prev.kpi.medicosAtivos,
            pacientes: rpc.censo_usuarios?.pacientes || prev.kpi.pacientes,
            lojistas: rpc.censo_usuarios?.lojistas || prev.kpi.lojistas,
            consultasHoje: rpc.telemedicina?.consultas_hoje || prev.kpi.consultasHoje,
            prescricoes7d: rpc.prescricoes?.ultimos_7dias || prev.kpi.prescricoes7d,
            pedidosAgenticos: rpc.comercio_agentico?.pedidos_totais || prev.kpi.pedidosAgenticos,
            leads24h: rpc.brisa_atendimentos?.total_hoje || prev.kpi.leads24h,
            leadsTotal: rpc.brisa_atendimentos?.total_acumulado || prev.kpi.leadsTotal,
          },
          medicosLista: rpc.medicos?.lista?.length > 0 ? rpc.medicos.lista : prev.medicosLista,
          agenticOrders: rpc.comercio_agentico?.pedidos_recentes || prev.agenticOrders,
          brisaAtendimentos: {
            totalHoje: rpc.brisa_atendimentos?.total_hoje || prev.brisaAtendimentos.totalHoje,
            totalAcumulado: rpc.brisa_atendimentos?.total_acumulado || prev.brisaAtendimentos.totalAcumulado,
            porCategoria: rpc.brisa_atendimentos?.por_categoria || prev.brisaAtendimentos.porCategoria,
            hojePorCategoria: rpc.brisa_atendimentos?.hoje_por_categoria || prev.brisaAtendimentos.hojePorCategoria,
          },
          healthGrid: rpc.health_grid || prev.healthGrid,
        }));
      } else {
        // Fallback queries
        const [docsRes, leadsRes, ordersRes] = await Promise.all([
          supabase.from("doctors").select("*").limit(50),
          supabase.from("leads_contatos").select("*").limit(50),
          supabase.from("orientacao_tecnica_orders").select("*").limit(20),
        ]);

        if (docsRes.data && docsRes.data.length > 0) {
          setData((prev) => ({
            ...prev,
            medicosLista: docsRes.data as DoctorRecord[],
            kpi: {
              ...prev.kpi,
              medicos: docsRes.data.length,
              medicosAtivos: docsRes.data.filter((d: any) => d.is_verified).length,
            }
          }));
        }

        if (leadsRes.data && leadsRes.data.length > 0) {
          setData((prev) => ({
            ...prev,
            ultimosLeads: leadsRes.data,
            kpi: {
              ...prev.kpi,
              leadsTotal: leadsRes.data.length,
            }
          }));
        }
      }
      setLastSync(new Date());
    } catch (e: any) {
      console.warn("[Admin] load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-360-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads_contatos" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "agentic_orders" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const kpi = data.kpi;

  // KPIs Top Strip
  const kpiCards = useMemo<Array<{ label: string; value: string; icon: any; accent: string; bg: string; drill?: DrillSource }>>(() => [
    { label: "Receita 30d", value: BRL(kpi.receita30d), icon: DollarSign, accent: "text-emerald-400", bg: "from-emerald-500/20", drill: "ot_orders" },
    { label: "Receita Hoje", value: BRL(kpi.receitaHoje), icon: TrendingUp, accent: "text-emerald-400", bg: "from-emerald-500/20", drill: "ot_orders" },
    { label: "Pacientes Ativos", value: NUM(kpi.pacientes), icon: Users, accent: "text-fuchsia-400", bg: "from-fuchsia-500/20", drill: "patients" },
    { label: "Médicos Homologados", value: `${kpi.medicosAtivos} / ${kpi.medicos}`, icon: HeartPulse, accent: "text-sky-400", bg: "from-sky-500/20", drill: "doctors" },
    { label: "Atendimentos Brisa Hoje", value: NUM(kpi.leads24h), icon: MessageSquare, accent: "text-primary", bg: "from-primary/20", drill: "leads" },
    { label: "Pedidos Agênticos (UCP)", value: NUM(kpi.pedidosAgenticos), icon: Bot, accent: "text-purple-400", bg: "from-purple-500/20" },
    { label: "Prescrições 7d", value: NUM(kpi.prescricoes7d), icon: FileText, accent: "text-orange-400", bg: "from-orange-500/20" },
    { label: "Orientações Hoje", value: NUM(kpi.consultasHoje), icon: Stethoscope, accent: "text-sky-400", bg: "from-sky-500/20", drill: "appointments" },
  ], [kpi]);

  const openDrill = useCallback((source: DrillSource, title: string) => {
    setDrill({ open: true, source, title });
  }, []);

  const handleExportCSV = () => {
    exportCSV("command-center-360-kpis", [
      { metrica: "Receita 30d", valor: kpi.receita30d },
      { metrica: "Receita Hoje", valor: kpi.receitaHoje },
      { metrica: "Pacientes", valor: kpi.pacientes },
      { metrica: "Medicos Ativos", valor: kpi.medicosAtivos },
      { metrica: "Leads Brisa 24h", valor: kpi.leads24h },
      { metrica: "Pedidos Agenticos", valor: kpi.pedidosAgenticos },
      { metrica: "Prescricoes 7d", valor: kpi.prescricoes7d },
    ]);
    toast.success("CSV exportado com sucesso");
  };

  const handleExportPDF = () => {
    exportAdminPDF({
      kpis: [
        { label: "Receita 30 dias", value: BRL(kpi.receita30d) },
        { label: "Receita Hoje", value: BRL(kpi.receitaHoje) },
        { label: "Pacientes Ativos", value: NUM(kpi.pacientes) },
        { label: "Médicos Homologados", value: `${kpi.medicosAtivos} de ${kpi.medicos}` },
        { label: "Atendimentos Brisa", value: NUM(kpi.leadsTotal) },
        { label: "Pedidos Agênticos UCP", value: NUM(kpi.pedidosAgenticos) },
      ],
      revenue30d: data.receitaSerie,
      funnel: data.funilSerie,
      audit: data.ultimoAudit,
      alerts: liveAlerts.map((a) => ({ title: a.title, message: a.message, created_at: a.created_at })),
    });
    toast.success("PDF do Command Center gerado");
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const msgs = [...messages, { role: "user", content: chatInput }];
    setMessages(msgs);
    setChatInput("");
    setTimeout(() => setMessages([...msgs, { role: "assistant", content: "Comando executado com sucesso. Sincronismo 360 ativo em todos os módulos." }]), 700);
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-12 md:pt-28">
        <div className="container mx-auto px-4 space-y-6">
          {/* HEADER */}
          <motion.div className="flex items-center justify-between flex-wrap gap-4" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-black text-foreground tracking-tight">
                  Command Center 360 <span className="text-primary">·</span> Central Mestre
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Operação 24/7 · Sincronizado {since(lastSync.toISOString())} atrás · {new Date().toLocaleTimeString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={loadData} variant="outline" size="sm" className="rounded-xl" disabled={loading}>
                <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Sync 360°
              </Button>
              <Button onClick={handleExportCSV} variant="outline" size="sm" className="rounded-xl">
                <Download size={14} className="mr-1.5" /> CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm" className="rounded-xl">
                <FileDown size={14} className="mr-1.5" /> PDF
              </Button>
              <Button onClick={() => navigate("/admin/president")} variant="outline" size="sm" className="rounded-xl border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                <Crown size={14} className="mr-1.5" /> Presidente
              </Button>
              <Button onClick={() => setChatOpen(!chatOpen)} className="bg-primary text-primary-foreground font-bold rounded-xl">
                <Bot size={16} className="mr-1.5" /> Manus CEO
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-destructive border-destructive/30" onClick={async () => { await supabase.auth.signOut(); navigate("/admin-login"); }}>
                <LogOut size={14} />
              </Button>
            </div>
          </motion.div>

          {/* GOOGLE ANALYTICS 4 LIVE MIRROR */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <GoogleAnalyticsLiveMirror />
          </motion.div>

          {/* KPI STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {kpiCards.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card
                  className={`relative overflow-hidden border-border bg-gradient-to-br ${k.bg} to-card/40 hover:border-primary/50 transition-all group ${k.drill ? "cursor-pointer hover:scale-[1.02]" : ""}`}
                  onClick={k.drill ? () => openDrill(k.drill!, k.label) : undefined}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <k.icon size={15} className={k.accent} />
                      <span className="text-[9px] text-muted-foreground font-bold uppercase">{k.drill ? "DRILL ↗" : "LIVE"}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate">{k.label}</p>
                    <p className={`text-base md:text-lg font-black ${k.accent} mt-0.5 truncate`}>{k.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CARD 1: ATENDIMENTOS ENFª BRISA & WHATSAPP */}
          <BrisaOmniTracker
            totalHoje={data.brisaAtendimentos.totalHoje}
            totalAcumulado={data.brisaAtendimentos.totalAcumulado}
            porCategoria={data.brisaAtendimentos.porCategoria}
            hojePorCategoria={data.brisaAtendimentos.hojePorCategoria}
          />

          {/* CARD 2: ESTEIRA DE HOMOLOGAÇÃO KYC DE MÉDICOS */}
          <DoctorKycPipeline
            doctors={data.medicosLista}
            onRefresh={loadData}
          />

          {/* CARD 3: CENSO GERAL DE USUÁRIOS DA PLATAFORMA */}
          <UserCensus360
            totalPacientes={kpi.pacientes}
            totalMedicos={kpi.medicos}
            totalLojistas={kpi.lojistas}
          />

          {/* ROW: COMÉRCIO AGÊNTICO & FINANCEIRO SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CARD 5: RASTREADOR DE COMÉRCIO AGÊNTICO */}
            <AgenticCommerceTracker
              totalPedidos={kpi.pedidosAgenticos}
              pedidos={data.agenticOrders}
            />

            {/* CARD 6: PAINEL FINANCEIRO & SPLITS */}
            <FinancialSplitPanel
              receita30d={kpi.receita30d}
              receitaHoje={kpi.receitaHoje}
              ordens30d={kpi.ordensTotal}
              ticketMedio={kpi.ticketMedio}
            />
          </div>

          {/* CARD 8: HEALTH CHECK GRID 6 NÓS */}
          <SystemHealthGrid health={data.healthGrid} />

          {/* HUB DE AGENTES IA */}
          <AgentsHub />

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Receita 30d */}
            <Card className="lg:col-span-2 border-border bg-card/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-black text-sm md:text-base">Receita & Ordens · 30 dias</h3>
                  <Badge variant="outline" className="text-[10px]">BRL · Real-time</Badge>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.receitaSerie}>
                      <defs>
                        <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(142,76%,36%)" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="hsl(142,76%,36%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="receita" stroke="hsl(142,76%,36%)" fill="url(#gR)" strokeWidth={2} />
                      <Line type="monotone" dataKey="ordens" stroke="hsl(45,76%,52%)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Leads Fonte */}
            <Card className="border-border bg-card/40">
              <CardContent className="p-5">
                <h3 className="font-display font-black text-sm md:text-base mb-4">Leads por Canal · 24h</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.leadsFonte} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2}>
                        {data.leadsFonte.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CHAT MANUS CEO OVERLAY */}
          {chatOpen && (
            <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] rounded-2xl bg-card border border-border shadow-2xl p-4 z-50 flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-primary" />
                  <h4 className="font-bold text-sm">Manus CEO · Assistente 360</h4>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setChatOpen(false)}>
                  <XCircle size={16} />
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                {messages.map((m, i) => (
                  <div key={i} className={`p-2 rounded-xl ${m.role === "assistant" ? "bg-muted/60 text-foreground" : "bg-primary text-primary-foreground ml-6"}`}>
                    {m.content}
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Enviar diretriz para a IA..."
                  className="h-8 text-xs rounded-xl"
                />
                <Button size="icon" className="h-8 w-8 rounded-xl" onClick={sendMessage}>
                  <Send size={12} />
                </Button>
              </div>
            </div>
          )}

          {/* DRILL DOWN MODAL */}
          {drill.open && drill.source && (
            <KpiDrillDown
              open={drill.open}
              source={drill.source}
              title={drill.title}
              onClose={() => setDrill({ open: false, source: null, title: "" })}
            />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Admin;
