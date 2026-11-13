import { useAccount } from "@/contexts/AccountContext";
import { setVisibleInterval } from "@/lib/visible-interval";
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
  UserPlus, Users, Wallet, XCircle, Zap, UserCheck, Building2, Video,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Download, FileDown, Crown, Sparkles } from "lucide-react";
import { exportCSV, exportAdminPDF } from "@/lib/admin-export";
import { KpiDrillDown, type DrillSource } from "@/components/admin/KpiDrillDown";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AgentsHub } from "@/components/admin/AgentsHub";
import { WhatsAppFailoverManager } from "@/components/admin/WhatsAppFailoverManager";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";
import { DoctorKycPipeline } from "@/components/admin/DoctorKycPipeline";
import { LeadHunterTracker } from "@/components/admin/LeadHunterTracker";
import { AdminFiscalManagement } from "@/components/admin/AdminFiscalManagement";
import { PrescriptionsAnvisaPanel } from "@/components/admin/PrescriptionsAnvisaPanel";
import { LiveCommandCenter } from "@/components/admin/LiveCommandCenter";

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
  prescricoes7d: number;
  pacientes: number;
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
}

const EMPTY: DashboardData = {
  kpi: { receita30d: 0, receitaHoje: 0, ordensTotal: 0, ordensHoje: 0, ticketMedio: 0, consultasHoje: 0, filaAtiva: 0, leadsTotal: 0, leads24h: 0, conversao: 0, medicos: 0, prescricoes7d: 0, pacientes: 0, alertas: 0, erros24h: 0, auditEventos24h: 0 },
  receitaSerie: [], funilSerie: [], leadsFonte: [], auditHora: [],
  ultimasOrdens: [], ultimosLeads: [], ultimoAudit: [], growthRuns: [], paymentHealth: [], notificacoes: [],
};

const PIE_COLORS = ["hsl(142,76%,36%)", "hsl(45,76%,52%)", "hsl(199,89%,48%)", "hsl(280,76%,52%)", "hsl(0,72%,51%)", "hsl(30,76%,52%)"];

// ---------- Component ----------
const Admin = () => {
  const { logout } = useAccount();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [liveSignal, setLiveSignal] = useState(0);
  const [drill, setDrill] = useState<{ open: boolean; source: DrillSource | null; title: string }>({ open: false, source: null, title: "" });
  const [liveAlerts, setLiveAlerts] = useState<{ kind: string; title: string; message: string; created_at: string }[]>([]);
  // Auth gate
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/admin-login");
      const isAdmin = await verifyAndEnsureAdmin(user);
      if (!isAdmin) navigate("/admin-login");
    })();
  }, [navigate]);

  // Data loader (parallel real queries)
  const loadData = useCallback(async () => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const d24h = new Date(now.getTime() - 24 * 3600_000).toISOString();
    const d7d = new Date(now.getTime() - 7 * 86400_000).toISOString();
    const d30d = new Date(now.getTime() - 30 * 86400_000).toISOString();
    const todayISO = startOfDay.toISOString();

    try {
      const [
        otAll, otHoje, ordersAll, ordersHoje, appHoje, fila,
        leadsAll, leads24, medicos, prescs, pacientes, alertasA,
        errosR, auditR, otRecentes, leadsRec, auditRec, growthRec, paymentR, notifsR, funnel30d,
      ] = await Promise.all([
        // Receita = somente pagamentos confirmados (Orientação com paid_at, consulta paga). Pedido pendente não é receita.
        supabase.from("orientacao_tecnica_orders").select("amount,amount_brl,paid_at").not("paid_at", "is", null).gte("paid_at", d30d),
        supabase.from("orientacao_tecnica_orders").select("amount,amount_brl").not("paid_at", "is", null).gte("paid_at", todayISO),
        supabase.from("appointments").select("amount,created_at").eq("payment_status", "paid").gte("created_at", d30d),
        supabase.from("appointments").select("amount").eq("payment_status", "paid").gte("created_at", todayISO),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("consultation_queue").select("id", { count: "exact", head: true }).eq("status", "waiting"),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("source,status,created_at").gte("created_at", d24h),
        supabase.from("doctors").select("id", { count: "exact", head: true }).eq("is_approved_by_admin", true),
        supabase.from("prescriptions").select("id", { count: "exact", head: true }).gte("created_at", d7d),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("alert_history").select("id", { count: "exact", head: true }).gte("sent_at", d24h),
        supabase.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", d24h),
        supabase.from("audit_log").select("id,created_at", { count: "exact" }).gte("created_at", d24h).order("created_at", { ascending: false }).limit(1000),
        supabase.from("orientacao_tecnica_orders").select("id,patient_name,amount,status,payment_method,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("leads").select("id,name,source,lead_score,status,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("audit_log").select("id,action,table_name,created_at,user_id").order("created_at", { ascending: false }).limit(10),
        supabase.from("manus_growth_runs").select("id,status,pages_analyzed,pages_optimized,started_at").order("started_at", { ascending: false }).limit(5),
        supabase.from("payment_provider_health").select("provider,status,latency_ms,error_rate,checked_at").order("checked_at", { ascending: false }).limit(5),
        supabase.from("notifications").select("id,title,created_at,is_read").order("created_at", { ascending: false }).limit(6),
        supabase.from("funnel_events").select("event_name,funnel,created_at").gte("created_at", d30d),
      ]);

      const sum = (rows: any[] | null, key: string) => (rows ?? []).reduce((s, r) => s + Number((key === "amount" ? r.amount_brl ?? r.amount : r[key]) ?? 0), 0);
      const receitaOT30 = sum(otAll.data, "amount");
      const receitaOrders30 = sum(ordersAll.data, "amount");
      const receita30d = receitaOT30 + receitaOrders30;
      const receitaHoje = sum(otHoje.data, "amount") + sum(ordersHoje.data, "amount");
      const ordensTotal = (otAll.data?.length ?? 0) + (ordersAll.data?.length ?? 0);
      const ordensHoje = (otHoje.data?.length ?? 0) + (ordersHoje.data?.length ?? 0);
      const ticketMedio = ordensTotal > 0 ? receita30d / ordensTotal : 0;

      // Série receita por dia (30d)
      const byDay = new Map<string, { receita: number; ordens: number }>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400_000);
        const key = d.toISOString().slice(0, 10);
        byDay.set(key, { receita: 0, ordens: 0 });
      }
      const addToDay = (rows: any[] | null, dateKey: string) => {
        (rows ?? []).forEach((r) => {
          const k = String(r[dateKey]).slice(0, 10);
          const cell = byDay.get(k);
          if (cell) { cell.receita += Number(r.amount_brl ?? r.amount ?? 0); cell.ordens += 1; }
        });
      };
      addToDay(otAll.data, "paid_at");
      addToDay(ordersAll.data, "created_at");
      const receitaSerie = Array.from(byDay.entries()).map(([k, v]) => ({
        dia: k.slice(5), receita: Math.round(v.receita), ordens: v.ordens,
      }));

      // Funil (funnel_events 30d)
      const funnelMap = new Map<string, number>();
      (funnel30d.data ?? []).forEach((e: any) => {
        funnelMap.set(e.event_name, (funnelMap.get(e.event_name) ?? 0) + 1);
      });
      const funilSerie = Array.from(funnelMap.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, 6)
        .map(([etapa, total]) => ({ etapa: etapa.slice(0, 14), total }));

      // Fonte leads (24h)
      const fonteMap = new Map<string, number>();
      (leads24.data ?? []).forEach((l: any) => {
        const s = l.source || "desconhecido";
        fonteMap.set(s, (fonteMap.get(s) ?? 0) + 1);
      });
      const leadsFonte = Array.from(fonteMap.entries()).map(([name, value]) => ({ name, value }));
      const conv = (leads24.data ?? []).filter((l: any) => l.status === "converted").length;
      const conversao = (leads24.data?.length ?? 0) > 0 ? (conv / leads24.data!.length) * 100 : 0;

      // Audit por hora (24h)
      const hourMap = new Map<number, number>();
      for (let i = 23; i >= 0; i--) hourMap.set(i, 0);
      (auditR.data ?? []).forEach((a: any) => {
        const hAgo = Math.floor((Date.now() - new Date(a.created_at).getTime()) / 3600_000);
        if (hAgo >= 0 && hAgo < 24) hourMap.set(hAgo, (hourMap.get(hAgo) ?? 0) + 1);
      });
      const auditHora = Array.from(hourMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([h, eventos]) => ({ hora: `${h}h`, eventos }));

      setData({
        kpi: {
          receita30d, receitaHoje,
          ordensTotal, ordensHoje, ticketMedio,
          consultasHoje: (appHoje.count ?? 0) + (otHoje.data?.length ?? 0),
          filaAtiva: fila.count ?? 0,
          leadsTotal: leadsAll.count ?? 0,
          leads24h: leads24.data?.length ?? 0,
          conversao,
          medicos: medicos.count ?? 0,
          prescricoes7d: prescs.count ?? 0,
          pacientes: pacientes.count ?? 0,
          alertas: alertasA.count ?? 0,
          erros24h: errosR.count ?? 0,
          auditEventos24h: auditR.count ?? 0,
        },
        receitaSerie, funilSerie, leadsFonte, auditHora,
        ultimasOrdens: otRecentes.data ?? [],
        ultimosLeads: leadsRec.data ?? [],
        ultimoAudit: auditRec.data ?? [],
        growthRuns: growthRec.data ?? [],
        paymentHealth: paymentR.data ?? [],
        notificacoes: notifsR.data ?? [],
      });
      setLastSync(new Date());
    } catch (e: any) {
      console.error("[Admin] load error", e);
      toast.error("Falha ao sincronizar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const i = setVisibleInterval(loadData, 15_000); // 15s para dados mais frescos
    return () => i();
  }, [loadData]);

  const kpi = data.kpi;

  // ---- Realtime sync + alerts ----
  useAdminRealtime({
    onChange: () => { void loadData(); setLiveSignal((n) => n + 1); },
    onAlert: (a) => setLiveAlerts((prev) => [a, ...prev].slice(0, 25)),
  });

  // ---- Export handlers ----
  const handleExportCSV = useCallback(() => {
    exportCSV("command-center-kpis", [
      { metrica: "Receita 30d", valor: kpi.receita30d },
      { metrica: "Receita Hoje", valor: kpi.receitaHoje },
      { metrica: "Ticket Medio", valor: kpi.ticketMedio.toFixed(2) },
      { metrica: "Ordens 30d", valor: kpi.ordensTotal },
      { metrica: "Ordens Hoje", valor: kpi.ordensHoje },
      { metrica: "Orientações Hoje", valor: kpi.consultasHoje },
      { metrica: "Fila Ativa", valor: kpi.filaAtiva },
      { metrica: "Leads Total", valor: kpi.leadsTotal },
      { metrica: "Leads 24h", valor: kpi.leads24h },
      { metrica: "Conversao %", valor: kpi.conversao.toFixed(2) },
      { metrica: "Medicos", valor: kpi.medicos },
      { metrica: "Pacientes", valor: kpi.pacientes },
      { metrica: "Prescricoes 7d", valor: kpi.prescricoes7d },
      { metrica: "Erros 24h", valor: kpi.erros24h },
      { metrica: "Eventos Auditoria 24h", valor: kpi.auditEventos24h },
    ]);
    toast.success("CSV exportado");
  }, [kpi]);

  const handleExportPDF = useCallback(() => {
    exportAdminPDF({
      kpis: [
        { label: "Receita 30 dias", value: BRL(kpi.receita30d) },
        { label: "Receita Hoje", value: BRL(kpi.receitaHoje) },
        { label: "Ticket Médio", value: BRL(kpi.ticketMedio) },
        { label: "Ordens Hoje", value: NUM(kpi.ordensHoje) },
        { label: "Orientações Hoje", value: NUM(kpi.consultasHoje) },
        { label: "Fila Ativa", value: NUM(kpi.filaAtiva) },
        { label: "Leads 24h", value: NUM(kpi.leads24h) },
        { label: "Conversão de Leads", value: PCT(kpi.conversao) },
        { label: "Pacientes", value: NUM(kpi.pacientes) },
        { label: "Médicos Ativos", value: NUM(kpi.medicos) },
        { label: "Prescrições 7d", value: NUM(kpi.prescricoes7d) },
        { label: "Erros 24h", value: NUM(kpi.erros24h) },
      ],
      revenue30d: data.receitaSerie,
      funnel: data.funilSerie,
      audit: data.ultimoAudit,
      alerts: liveAlerts.map((a) => ({ title: a.title, message: a.message, created_at: a.created_at })),
    });
    toast.success("PDF gerado");
  }, [kpi, data, liveAlerts]);

  const openDrill = useCallback((source: DrillSource, title: string) => {
    setDrill({ open: true, source, title });
  }, []);

  // kpi already declared above

  const quickLinks = [
    { label: "🌍 Mapa Global", path: "/admin/global-ops", icon: Globe },
    { label: "Clínicas", path: "/admin/clinicas", icon: Globe },
    { label: "Financeiro", path: "/admin/financeiro", icon: DollarSign },
    { label: "BI Avançado", path: "/admin/bi", icon: BarChart3 },
    { label: "Auditoria", path: "/admin/audit-log", icon: Shield },
    { label: "Growth CEO", path: "/admin/growth", icon: TrendingUp },
    { label: "Automações", path: "/admin/automations", icon: Zap },
    { label: "Cron Health", path: "/admin/cron-health", icon: Activity },
    { label: "Omni-Channel", path: "/admin/omni-channel", icon: MessageSquare },
    { label: "Monitoramento", path: "/admin/monitoramento", icon: Server },
    { label: "Leads CRM", path: "/admin/leads", icon: UserPlus },
    { label: "Crédito", path: "/admin/credit-audit", icon: Wallet },
    { label: "Aprovações KYC", path: "/admin/aprovacoes-medicas", icon: UserCheck },
    { label: "KYC Lojas / Farmácias", path: "/admin/aprovacoes-farmacias", icon: Building2 },
    { label: "KYC Pacientes", path: "/admin/aprovacoes-pacientes", icon: Users },
    { label: "KYC Agentes & IAs", path: "/admin/kyc-agentes", icon: Bot },
    { label: "💳 Comprovantes de Pagamento", path: "/admin/comprovantes-pagamento", icon: CreditCard },
    { label: "TikTok Ads & Pixel", path: "/admin/conversoes", icon: Video },
    { label: "Médicos online", path: "/admin/medicos-online", icon: Stethoscope },
    { label: "Orientações", path: "/admin/orientacoes", icon: HeartPulse },
    { label: "WhatsApp Inbox", path: "/admin/inbox", icon: MessageSquare },
    { label: "Webhooks MP", path: "/admin/mp-webhooks", icon: CreditCard },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-12 md:pt-28">
        <div className="container mx-auto px-4">
          {/* HEADER */}
          <motion.div className="mb-6 flex items-center justify-between flex-wrap gap-4" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-black text-foreground tracking-tight">
                  Central de Comando <span className="text-primary">·</span> Planta y Raíz
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Dados reais do banco · gráficos sincronizados {since(lastSync.toISOString())} atrás
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={loadData} variant="outline" size="sm" className="rounded-xl" disabled={loading}>
                <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Sync
              </Button>
              <Button onClick={() => navigate("/admin/comprovantes-pagamento")} variant="outline" size="sm" className="rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold">
                <CreditCard size={14} className="mr-1.5" /> Comprovantes
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
              <Button variant="outline" size="sm" className="rounded-xl text-destructive border-destructive/30" onClick={() => void logout()}>
                <LogOut size={14} />
              </Button>
            </div>
          </motion.div>

          {/* CENTRAL DE COMANDO — todos os parâmetros reais, 15 s + tempo real */}
          <LiveCommandCenter refreshSignal={liveSignal} />

          {/* MÓDULOS */}
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Módulos</h3>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((q) => (
                <button key={q.path + q.label} onClick={() => navigate(q.path)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors">
                  <q.icon size={13} /> {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* HUB DE AGENTES IA — chat direto + execução manual */}
          <div className="mb-6">
            <AgentsHub />
          </div>

          {/* LIVE ALERTS FEED */}
          {liveAlerts.length > 0 && (
            <Card className="border-red-500/40 bg-red-500/5 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-black text-sm flex items-center gap-2 text-red-400">
                    <AlertTriangle size={16} className="animate-pulse" /> Alertas em Tempo Real
                    <Badge variant="destructive" className="text-[9px]">{liveAlerts.length}</Badge>
                  </h3>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setLiveAlerts([])}>Limpar</Button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {liveAlerts.slice(0, 8).map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-[11px] p-1.5 rounded bg-background/40">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-red-300">{a.title}</span>
                        <span className="text-muted-foreground ml-2 truncate">{a.message}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground shrink-0">{since(a.created_at)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CHARTS ROW */}

          {/* ============================================== */}
          {/* NOVOS CARDS ESTRATÉGICOS 360° (ACRÉSCIMO)     */}
          {/* ============================================== */}

          {/* CARD 2: ESTEIRA DE HOMOLOGAÇÃO KYC DE MÉDICOS */}
          <div className="mb-6">
            <DoctorKycPipeline onRefresh={loadData} />
          </div>

          {/* CARD 10: LEAD HUNTER AI & CRM PIPELINE (META DE 10.000 MÉDICOS) */}
          <div className="mb-6">
            <LeadHunterTracker />
          </div>

          {/* CARD 12: MOTOR AUTOMÁTICO DE FATURAMENTO, NOTAS FISCAIS & RECIBOS IRPF (DMED) */}
          <div className="mb-6">
            <AdminFiscalManagement />
          </div>

          {/* CARD 13: PRESCRIÇÕES & PROTOCOLOS ANVISA */}
          <div className="mb-6">
            <PrescriptionsAnvisaPanel />
          </div>


          {/* ============================================== */}
          {/* FIM DOS NOVOS CARDS ESTRATÉGICOS               */}
          {/* ============================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Receita 30d */}
            <Card className="lg:col-span-2 border-border bg-card/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-black text-sm md:text-base">Receita confirmada & pagamentos · 30 dias</h3>
                  <Badge variant="outline" className="text-[10px]">BRL · Real-time</Badge>
                </div>
                <div className="h-64">
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
                <h3 className="font-display font-black text-sm md:text-base mb-4">Leads por Fonte · 24h</h3>
                <div className="h-64">
                  {data.leadsFonte.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <UserPlus size={36} className="opacity-30 mb-2" />
                      <p className="text-xs">Sem leads nas últimas 24h</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.leadsFonte} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                          {data.leadsFonte.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Funil */}
            <Card className="border-border bg-card/40">
              <CardContent className="p-5">
                <h3 className="font-display font-black text-sm md:text-base mb-4">Funil de Conversão · Top Eventos</h3>
                <div className="h-56">
                  {data.funilSerie.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <BarChart3 size={36} className="opacity-30 mb-2" />
                      <p className="text-xs">Sem eventos de funil registrados</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.funilSerie} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis type="category" dataKey="etapa" stroke="hsl(var(--muted-foreground))" fontSize={10} width={90} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="total" fill="hsl(199,89%,48%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Audit Activity */}
            <Card className="border-border bg-card/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-black text-sm md:text-base">Atividade Auditada · 24h</h3>
                  <Badge variant="outline" className="text-[10px]">{NUM(kpi.auditEventos24h)} eventos</Badge>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.auditHora}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="hora" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="eventos" stroke="hsl(280,76%,52%)" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TABLES ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="border-border bg-card/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-black text-sm md:text-base">Últimas Orientações Técnicas</h3>
                  <Badge variant="outline" className="text-[10px]">Top 8</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Paciente</TableHead>
                      <TableHead className="text-[10px]">Valor</TableHead>
                      <TableHead className="text-[10px]">Método</TableHead>
                      <TableHead className="text-[10px]">Status</TableHead>
                      <TableHead className="text-[10px]">Quando</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.ultimasOrdens.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Nenhuma ordem ainda</TableCell></TableRow>
                    ) : data.ultimasOrdens.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="text-xs font-medium truncate max-w-[120px]">{o.patient_name}</TableCell>
                        <TableCell className="text-xs">{BRL(Number(o.amount))}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground uppercase">{o.payment_method?.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge variant={o.status === "paid" || o.status === "approved" ? "default" : o.status === "pending" ? "secondary" : "outline"} className={`text-[9px] ${o.status === "approved" || o.status === "paid" ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}>
                            {o.status === "approved" ? "Aprovado" : o.status === "paid" ? "Pago" : o.status === "pending" ? "Pendente" : o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{since(o.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-black text-sm md:text-base">Últimos Leads</h3>
                  <Button size="sm" variant="ghost" className="text-[10px] h-7" onClick={() => navigate("/admin/leads")}>Ver todos →</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Nome</TableHead>
                      <TableHead className="text-[10px]">Fonte</TableHead>
                      <TableHead className="text-[10px]">Score</TableHead>
                      <TableHead className="text-[10px]">Status</TableHead>
                      <TableHead className="text-[10px]">Quando</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.ultimosLeads.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Nenhum lead ainda</TableCell></TableRow>
                    ) : data.ultimosLeads.map((l: any) => (
                      <TableRow key={l.id} className="cursor-pointer" onClick={() => navigate(`/admin/leads/${l.id}`)}>
                        <TableCell className="text-xs font-medium truncate max-w-[120px]">{l.name}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{l.source}</TableCell>
                        <TableCell className="text-xs font-bold">{l.lead_score}</TableCell>
                        <TableCell>
                          <Badge variant={l.status === "converted" ? "default" : "secondary"} className="text-[9px]">{l.status}</Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{since(l.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* STATUS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-border bg-card/40">
              <CardContent className="p-5">
                <h3 className="font-display font-black text-sm mb-3 flex items-center gap-2">
                  <Server size={16} className="text-primary" /> Saúde Pagamentos
                </h3>
                <div className="space-y-2">
                  {data.paymentHealth.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem dados de health-check</p>
                  ) : data.paymentHealth.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.status === "operational" ? "bg-emerald-400 animate-pulse" : p.status === "degraded" ? "bg-yellow-400" : "bg-red-500"}`} />
                        <span className="text-xs font-bold uppercase">{p.provider}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">{p.latency_ms}ms · {p.error_rate}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/40">
              <CardContent className="p-5">
                <h3 className="font-display font-black text-sm mb-3 flex items-center gap-2">
                  <Bell size={16} className="text-primary" /> Audit Stream
                </h3>
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                  {data.ultimoAudit.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem eventos recentes</p>
                  ) : data.ultimoAudit.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 p-1.5 rounded bg-background/40">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-foreground truncate">{a.action}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{a.table_name}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground shrink-0">{since(a.created_at)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* WHATSAPP FAILOVER & DISPARADOR AUTÔNOMO DR. EDILSON BEZERRA (5511987131241) */}
          <div className="mb-6">
            <ErrorBoundary>
              <WhatsAppFailoverManager />
            </ErrorBoundary>
          </div>
        </div>
      </section>

      <KpiDrillDown
        open={drill.open}
        onOpenChange={(o) => setDrill((d) => ({ ...d, open: o }))}
        source={drill.source}
        title={drill.title}
      />

      <Footer />
    </div>
  );
};

export default Admin;
