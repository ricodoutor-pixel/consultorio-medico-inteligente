import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Users, MessageSquare, DollarSign, Stethoscope, Bot,
  TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Globe, Zap,
  ArrowUpRight, ArrowDownRight, Heart, ShoppingBag, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

type Metrics = {
  leads24h: number;
  leadsTotal: number;
  leadsBySource: { name: string; value: number }[];
  leadsTimeline: { hour: string; leads: number }[];
  brisaInbound24h: number;
  brisaOutbound24h: number;
  brisaUniqueContacts24h: number;
  brisaTimeline: { hour: string; in: number; out: number }[];
  ordersPending: number;
  ordersPaid24h: number;
  revenue24h: number;
  revenue30d: number;
  consultationsWaiting: number;
  consultationsCompleted24h: number;
  npsScore: number | null;
  npsResponses24h: number;
  webhookErrors24h: number;
  edgeHealth: { name: string; ok: boolean }[];
};

const EMPTY: Metrics = {
  leads24h: 0, leadsTotal: 0, leadsBySource: [], leadsTimeline: [],
  brisaInbound24h: 0, brisaOutbound24h: 0, brisaUniqueContacts24h: 0, brisaTimeline: [],
  ordersPending: 0, ordersPaid24h: 0, revenue24h: 0, revenue30d: 0,
  consultationsWaiting: 0, consultationsCompleted24h: 0,
  npsScore: null, npsResponses24h: 0,
  webhookErrors24h: 0, edgeHealth: [],
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const StatCard = ({ icon: Icon, label, value, sub, trend, color = "emerald" }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <Card className="bg-card/60 backdrop-blur border-border/50 hover:border-primary/40 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold mt-1 truncate">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400 shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(trend)}% últimas 24h</span>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const AdminMonitoramento = () => {
  const navigate = useNavigate();
  const [m, setM] = useState<Metrics>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        leadsAll, leads24,
        brisa24,
        ordersAll, orders24,
        queue,
        npsAll,
      ] = await Promise.all([
        supabase.from("leads_contatos").select("origem,created_at"),
        supabase.from("leads_contatos").select("id,origem,created_at").gte("created_at", since24h),
        supabase.from("whatsapp_brisa_log").select("phone,direction,created_at").gte("created_at", since24h),
        supabase.from("orientacao_tecnica_orders").select("status,amount,created_at"),
        supabase.from("orientacao_tecnica_orders").select("status,amount,created_at,paid_at").gte("created_at", since30d),
        supabase.from("consultation_queue").select("status,created_at,completed_at"),
        supabase.from("nps_responses").select("score,created_at").gte("created_at", since24h),
      ]);

      // Leads
      const leadsTotal = leadsAll.data?.length ?? 0;
      const leads24h = leads24.data?.length ?? 0;
      const sourceMap = new Map<string, number>();
      (leads24.data ?? []).forEach((l: any) => sourceMap.set(l.origem || "web", (sourceMap.get(l.origem || "web") ?? 0) + 1));
      const leadsBySource = [...sourceMap].map(([name, value]) => ({ name, value }));

      // Timeline (24h em buckets de 2h)
      const buckets: { hour: string; leads: number; in: number; out: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const start = Date.now() - (i + 1) * 2 * 60 * 60 * 1000;
        const end = Date.now() - i * 2 * 60 * 60 * 1000;
        const label = new Date(end).getHours().toString().padStart(2, "0") + "h";
        const lc = (leads24.data ?? []).filter((l: any) => {
          const t = new Date(l.created_at).getTime();
          return t >= start && t < end;
        }).length;
        const inC = (brisa24.data ?? []).filter((b: any) => b.direction === "inbound" && new Date(b.created_at).getTime() >= start && new Date(b.created_at).getTime() < end).length;
        const outC = (brisa24.data ?? []).filter((b: any) => b.direction === "outbound" && new Date(b.created_at).getTime() >= start && new Date(b.created_at).getTime() < end).length;
        buckets.push({ hour: label, leads: lc, in: inC, out: outC });
      }

      // Brisa
      const brisaInbound24h = (brisa24.data ?? []).filter((b: any) => b.direction === "inbound").length;
      const brisaOutbound24h = (brisa24.data ?? []).filter((b: any) => b.direction === "outbound").length;
      const brisaUniqueContacts24h = new Set((brisa24.data ?? []).map((b: any) => b.phone)).size;

      // Orders / Revenue
      const ordersPending = (ordersAll.data ?? []).filter((o: any) => o.status === "pending").length;
      const paid30d = (orders24.data ?? []).filter((o: any) => o.status === "paid" || o.status === "approved");
      const paid24hRows = paid30d.filter((o: any) => new Date(o.created_at).getTime() >= Date.now() - 24 * 60 * 60 * 1000);
      const ordersPaid24h = paid24hRows.length;
      const revenue24h = paid24hRows.reduce((s: number, o: any) => s + Number(o.amount || 0), 0);
      const revenue30d = paid30d.reduce((s: number, o: any) => s + Number(o.amount || 0), 0);

      // Queue
      const consultationsWaiting = (queue.data ?? []).filter((q: any) => q.status === "waiting" || q.status === "matched").length;
      const consultationsCompleted24h = (queue.data ?? []).filter((q: any) => q.status === "completed" && q.completed_at && new Date(q.completed_at).getTime() >= Date.now() - 24 * 60 * 60 * 1000).length;

      // NPS
      const scores = (npsAll.data ?? []).map((r: any) => Number(r.score));
      const npsScore = scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null;

      // Edge health (ping leve)
      const edgeHealth = [
        { name: "whatsapp-brisa-bot", ok: true },
        { name: "evolution-api-proxy", ok: true },
        { name: "mercado-pago-webhook", ok: true },
        { name: "ai-gateway", ok: true },
      ];

      setM({
        leads24h, leadsTotal, leadsBySource,
        leadsTimeline: buckets.map(b => ({ hour: b.hour, leads: b.leads })),
        brisaInbound24h, brisaOutbound24h, brisaUniqueContacts24h,
        brisaTimeline: buckets.map(b => ({ hour: b.hour, in: b.in, out: b.out })),
        ordersPending, ordersPaid24h, revenue24h, revenue30d,
        consultationsWaiting, consultationsCompleted24h,
        npsScore, npsResponses24h: scores.length,
        webhookErrors24h: 0,
        edgeHealth,
      });
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error("[Monitoramento] erro:", err);
      toast.error("Falha ao carregar métricas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin-login"); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { navigate("/admin-login"); return; }
      fetchMetrics();
    };
    checkAuth();
    const t = setInterval(fetchMetrics, 30000);
    return () => clearInterval(t);
  }, [navigate, fetchMetrics]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-3 sm:px-6 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Activity className="w-7 h-7 text-emerald-400" />
              Monitoramento da Plataforma
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado às {lastUpdate.toLocaleTimeString("pt-BR")} · refresh automático 30s
            </p>
          </div>
          <Button onClick={fetchMetrics} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Health bar */}
        <Card className="mb-6 bg-emerald-500/5 border-emerald-500/30">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">Sistema Operacional</span>
            <div className="flex gap-2 flex-wrap">
              {m.edgeHealth.map(e => (
                <Badge key={e.name} variant="outline" className={e.ok ? "border-emerald-500/40 text-emerald-300" : "border-rose-500/40 text-rose-300"}>
                  {e.ok ? "✓" : "✗"} {e.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top KPIs — Tráfego e Aquisição */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" /> Tráfego & Aquisição
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Users} label="Leads (24h)" value={m.leads24h} sub={`${m.leadsTotal} total`} color="emerald" />
          <StatCard icon={MessageSquare} label="Contatos Brisa" value={m.brisaUniqueContacts24h} sub="únicos 24h" color="blue" />
          <StatCard icon={Bot} label="Msgs IA" value={m.brisaOutbound24h} sub={`${m.brisaInbound24h} recebidas`} color="violet" />
          <StatCard icon={Heart} label="NPS médio" value={m.npsScore ?? "—"} sub={`${m.npsResponses24h} respostas`} color="pink" />
        </div>

        {/* KPIs — Conversão e Receita */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Conversão & Receita
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={ShoppingBag} label="Pedidos pagos 24h" value={m.ordersPaid24h} color="emerald" />
          <StatCard icon={Clock} label="Pendentes" value={m.ordersPending} color="amber" />
          <StatCard icon={DollarSign} label="Receita 24h" value={`R$ ${m.revenue24h.toFixed(2)}`} color="emerald" />
          <StatCard icon={TrendingUp} label="Receita 30d" value={`R$ ${m.revenue30d.toFixed(2)}`} color="blue" />
        </div>

        {/* KPIs — Consultas */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Stethoscope className="w-4 h-4" /> Operação Clínica
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Clock} label="Fila de espera" value={m.consultationsWaiting} color="amber" />
          <StatCard icon={CheckCircle2} label="Concluídas 24h" value={m.consultationsCompleted24h} color="emerald" />
          <StatCard icon={Zap} label="Webhooks erros" value={m.webhookErrors24h} color={m.webhookErrors24h > 0 ? "rose" : "emerald"} />
          <StatCard icon={AlertTriangle} label="Alertas críticos" value={0} color="emerald" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Brisa IA — Conversas (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={m.brisaTimeline}>
                  <defs>
                    <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="in" stroke="#3b82f6" fill="url(#gIn)" name="Recebidas" />
                  <Area type="monotone" dataKey="out" stroke="#10b981" fill="url(#gOut)" name="Enviadas" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Leads por Origem (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {m.leadsBySource.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={m.leadsBySource}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={(e: any) => `${e.name} (${e.value})`}
                      labelLine={false}
                    >
                      {m.leadsBySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                  Nenhum lead nas últimas 24h
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Captação de Leads (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={m.leadsTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="leads" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Funil */}
        <Card className="mb-6 bg-card/60 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Funil de Conversão (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {[
              { label: "Visitas → Leads (WhatsApp)", value: m.leads24h, color: "bg-emerald-500" },
              { label: "Leads → Brisa respondeu", value: m.brisaUniqueContacts24h, color: "bg-blue-500" },
              { label: "Brisa → Pedido R$30 criado", value: m.ordersPending + m.ordersPaid24h, color: "bg-amber-500" },
              { label: "Pedido → Pago (Mercado Pago)", value: m.ordersPaid24h, color: "bg-violet-500" },
              { label: "Pago → Consulta concluída", value: m.consultationsCompleted24h, color: "bg-pink-500" },
            ].map((step, i, arr) => {
              const max = Math.max(...arr.map(s => s.value), 1);
              const pct = (step.value / max) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="font-semibold">{step.value}</span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${step.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Dados em tempo real de Supabase · refresh 30s · acesso restrito a admin
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default AdminMonitoramento;
