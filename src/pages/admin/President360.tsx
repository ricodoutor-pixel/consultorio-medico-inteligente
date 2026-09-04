import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { verifyAndEnsureAdmin } from "@/lib/admin-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Crown, DollarSign, TrendingUp, Users, Stethoscope, AlertTriangle,
  ShieldCheck, Activity, Zap, ArrowLeft, FileDown, RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { exportAdminPDF } from "@/lib/admin-export";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const NUM = (n: number) => n.toLocaleString("pt-BR");

interface State {
  receita30d: number;
  receitaHoje: number;
  ordens30d: number;
  pacientes: number;
  medicos: number;
  consultasHoje: number;
  filaAtiva: number;
  leads24h: number;
  erros24h: number;
  alertas24h: number;
  paymentStatus: "operational" | "degraded" | "down" | "unknown";
  serie: { dia: string; receita: number }[];
}

const EMPTY: State = {
  receita30d: 0, receitaHoje: 0, ordens30d: 0, pacientes: 0, medicos: 0,
  consultasHoje: 0, filaAtiva: 0, leads24h: 0, erros24h: 0, alertas24h: 0,
  paymentStatus: "unknown", serie: [],
};

const President360 = () => {
  const navigate = useNavigate();
  const [s, setS] = useState<State>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<{ kind: string; title: string; message: string; created_at: string }[]>([]);

  const load = useCallback(async () => {
    const now = new Date();
    const startDay = new Date(now); startDay.setHours(0, 0, 0, 0);
    const d24h = new Date(now.getTime() - 86400_000).toISOString();
    const d30d = new Date(now.getTime() - 30 * 86400_000).toISOString();
    const todayISO = startDay.toISOString();
    try {
      const [otAll, ordersAll, otHoje, ordersHoje, pac, doc, appHoje, fila, leads24, errs, alerts24, ph] = await Promise.all([
        supabase.from("orientacao_tecnica_orders").select("amount,created_at").gte("created_at", d30d),
        supabase.from("orders").select("total,created_at").gte("created_at", d30d),
        supabase.from("orientacao_tecnica_orders").select("amount").gte("created_at", todayISO),
        supabase.from("orders").select("total").gte("created_at", todayISO),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("doctors").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("consultation_queue").select("id", { count: "exact", head: true }).eq("status", "waiting"),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", d24h),
        supabase.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", d24h),
        supabase.from("alert_history").select("id", { count: "exact", head: true }).gte("sent_at", d24h),
        supabase.from("payment_provider_health").select("status,provider,checked_at").order("checked_at", { ascending: false }).limit(3),
      ]);

      const sum = (rows: any[] | null, k: string) => (rows ?? []).reduce((a, r) => a + Number(r[k] ?? 0), 0);
      const receita30d = sum(otAll.data, "amount") + sum(ordersAll.data, "total");
      const receitaHoje = sum(otHoje.data, "amount") + sum(ordersHoje.data, "total");
      const ordens30d = (otAll.data?.length ?? 0) + (ordersAll.data?.length ?? 0);

      const byDay = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
        byDay.set(d, 0);
      }
      [...(otAll.data ?? []).map((r: any) => ({ d: r.created_at, v: r.amount })),
       ...(ordersAll.data ?? []).map((r: any) => ({ d: r.created_at, v: r.total }))]
        .forEach(({ d, v }) => {
          const k = String(d).slice(0, 10);
          if (byDay.has(k)) byDay.set(k, byDay.get(k)! + Number(v ?? 0));
        });
      const serie = Array.from(byDay.entries()).map(([k, v]) => ({ dia: k.slice(5), receita: Math.round(v) }));

      const phStatus = (ph.data?.[0]?.status as State["paymentStatus"]) ?? "unknown";

      setS({
        receita30d, receitaHoje, ordens30d,
        pacientes: pac.count ?? 0,
        medicos: doc.count ?? 0,
        consultasHoje: appHoje.count ?? 0,
        filaAtiva: fila.count ?? 0,
        leads24h: leads24.count ?? 0,
        erros24h: errs.count ?? 0,
        alertas24h: alerts24.count ?? 0,
        paymentStatus: phStatus,
        serie,
      });
    } catch (e) {
      console.error("[President360]", e);
      toast.error("Falha ao sincronizar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, [load]);

  useAdminRealtime({
    onChange: load,
    onAlert: (a) => setAlerts((p) => [a, ...p].slice(0, 20)),
  });

  // Auth gate
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/admin-login");
      const isAdmin = await verifyAndEnsureAdmin(user);
      if (!isAdmin) navigate("/admin-login");
    })();
  }, [navigate]);

  const exportPDF = () => {
    exportAdminPDF({
      kpis: [
        { label: "Receita 30d", value: BRL(s.receita30d) },
        { label: "Receita Hoje", value: BRL(s.receitaHoje) },
        { label: "Ordens 30d", value: NUM(s.ordens30d) },
        { label: "Pacientes Totais", value: NUM(s.pacientes) },
        { label: "Médicos Ativos", value: NUM(s.medicos) },
        { label: "Orientações Hoje", value: NUM(s.consultasHoje) },
        { label: "Fila Ativa", value: NUM(s.filaAtiva) },
        { label: "Leads 24h", value: NUM(s.leads24h) },
        { label: "Erros 24h", value: NUM(s.erros24h) },
        { label: "Status Pagamentos", value: s.paymentStatus.toUpperCase() },
      ],
      revenue30d: s.serie.map((x) => ({ dia: x.dia, receita: x.receita, ordens: 0 })),
      funnel: [],
      audit: [],
      alerts: alerts.map((a) => ({ title: a.title, message: a.message, created_at: a.created_at })),
    }, "Relatório Executivo — Presidência · Planta y Raiz");
    toast.success("Relatório PDF gerado");
  };

  const phColor = s.paymentStatus === "operational" ? "text-emerald-400" : s.paymentStatus === "degraded" ? "text-yellow-400" : s.paymentStatus === "down" ? "text-red-500" : "text-muted-foreground";

  const summary = [
    { label: "Receita Mensal", value: BRL(s.receita30d), icon: DollarSign, accent: "text-emerald-400", bg: "from-emerald-500/15" },
    { label: "Receita Hoje", value: BRL(s.receitaHoje), icon: TrendingUp, accent: "text-emerald-400", bg: "from-emerald-500/15" },
    { label: "Pacientes", value: NUM(s.pacientes), icon: Users, accent: "text-fuchsia-400", bg: "from-fuchsia-500/15" },
    { label: "Médicos", value: NUM(s.medicos), icon: Stethoscope, accent: "text-sky-400", bg: "from-sky-500/15" },
    { label: "Orientações Hoje", value: NUM(s.consultasHoje), icon: Activity, accent: "text-sky-400", bg: "from-sky-500/15" },
    { label: "Fila Espera", value: NUM(s.filaAtiva), icon: Zap, accent: "text-yellow-400", bg: "from-yellow-500/15" },
    { label: "Pagamentos", value: s.paymentStatus.toUpperCase(), icon: ShieldCheck, accent: phColor, bg: "from-emerald-500/15" },
    { label: "Erros 24h", value: NUM(s.erros24h), icon: AlertTriangle, accent: s.erros24h > 0 ? "text-red-500" : "text-emerald-400", bg: "from-red-500/15" },
  ];

  const critical = [
    { label: "Command Center 360", path: "/admin", icon: Activity, desc: "Dashboard tático completo" },
    { label: "Financeiro", path: "/admin/financeiro", icon: DollarSign, desc: "Receita, splits e saques" },
    { label: "BI Avançado", path: "/admin/bi", icon: TrendingUp, desc: "Cohorts, LTV e churn" },
    { label: "Growth CEO", path: "/admin/growth", icon: Zap, desc: "Agente Manus autônomo" },
    { label: "Auditoria", path: "/admin/audit-log", icon: ShieldCheck, desc: "Trilha LGPD completa" },
    { label: "Master Control", path: "/admin/master-control", icon: Crown, desc: "Governança suprema" },
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-background via-background to-amber-950/10">
      <section className="pt-8 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* HEADER */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="rounded-xl">
                <ArrowLeft size={16} className="mr-1" /> Admin
              </Button>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                <Crown size={28} className="text-amber-50" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-black tracking-tight">
                  Painel da Presidência <span className="text-amber-400">·</span> 360°
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Dr. Edilson Bezerra · CRM-PR 49354 · Sincronização em tempo real
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={load} variant="outline" size="sm" className="rounded-xl" disabled={loading}>
                <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Sync
              </Button>
              <Button onClick={exportPDF} className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl">
                <FileDown size={16} className="mr-1.5" /> Relatório Executivo
              </Button>
            </div>
          </motion.div>

          {/* CAMADA 1 — RESUMO EXECUTIVO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {summary.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`bg-gradient-to-br ${k.bg} to-card/40 border-border hover:border-amber-500/40 transition-all`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <k.icon size={18} className={k.accent} />
                      <span className="text-[9px] text-muted-foreground font-bold tracking-wider">LIVE</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{k.label}</p>
                    <p className={`text-xl md:text-2xl font-black ${k.accent} mt-1 truncate`}>{k.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CAMADA 2 — TENDÊNCIA DE RECEITA */}
          <Card className="mb-8 border-border bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-black text-lg">Tendência de Receita · 30 dias</h3>
                  <p className="text-xs text-muted-foreground">Soma consolidada: Orientações Técnicas + Shopping</p>
                </div>
                <Badge variant="outline" className="border-amber-500/40 text-amber-400">{BRL(s.receita30d)}</Badge>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={s.serie}>
                    <defs>
                      <linearGradient id="presG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(45,90%,55%)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="hsl(45,90%,55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="receita" stroke="hsl(45,90%,55%)" fill="url(#presG)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CAMADA 3 — ALERTAS + ACESSOS CRÍTICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <Card className={`lg:col-span-1 ${alerts.length ? "border-red-500/40 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
              <CardContent className="p-5">
                <h3 className="font-display font-black text-sm flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className={alerts.length ? "text-red-400 animate-pulse" : "text-emerald-400"} />
                  Alertas em Tempo Real
                  <Badge variant={alerts.length ? "destructive" : "secondary"} className="text-[9px] ml-auto">{alerts.length}</Badge>
                </h3>
                {alerts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">✓ Tudo operacional. Nenhum alerta crítico.</p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {alerts.map((a, i) => (
                      <div key={i} className="p-2 rounded-lg bg-background/50 border border-border/50">
                        <p className="text-[11px] font-bold text-red-300">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{a.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-border bg-card/40">
              <CardContent className="p-5">
                <h3 className="font-display font-black text-sm mb-4 flex items-center gap-2">
                  <Crown size={16} className="text-amber-400" /> Módulos Críticos · Acesso Rápido
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {critical.map((c) => (
                    <button
                      key={c.path}
                      onClick={() => navigate(c.path)}
                      className="group text-left p-3 rounded-xl border border-border bg-background/40 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all"
                    >
                      <c.icon size={18} className="text-muted-foreground group-hover:text-amber-400 mb-1.5 transition-colors" />
                      <p className="text-[11px] font-bold text-foreground group-hover:text-amber-400">{c.label}</p>
                      <p className="text-[9px] text-muted-foreground line-clamp-2">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default President360;
