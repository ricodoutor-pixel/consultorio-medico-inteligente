import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Activity, AlertTriangle, CheckCircle2, XCircle, Clock, Users, DollarSign, Star,
  TrendingUp, Bot, Shield, RefreshCw, Power, Pause, Play, LogOut, FileText, Database,
  Zap, Mail, Phone, ShoppingCart, Heart, Award, Bell, BarChart3, Wifi, WifiOff,
} from "lucide-react";
import { toast } from "sonner";

// ── Automation definitions ──────────────────────────────────────
interface Automation {
  id: string;
  name: string;
  category: string;
  status: "online" | "offline" | "error" | "idle";
  lastRun: Date;
  responseTime: number;
  errorCount: number;
  successRate: number;
}

const AUTOMATIONS_CATALOG: Omit<Automation, "status" | "lastRun" | "responseTime" | "errorCount" | "successRate">[] = [
  // Marketing (12)
  { id: "mkt-01", name: "Instagram Posts Automáticos", category: "Marketing" },
  { id: "mkt-02", name: "Facebook Posts Automáticos", category: "Marketing" },
  { id: "mkt-03", name: "Email Marketing Semanal", category: "Marketing" },
  { id: "mkt-04", name: "Google Ads Otimização", category: "Marketing" },
  { id: "mkt-05", name: "SEO Content Distribution", category: "Marketing" },
  { id: "mkt-06", name: "Lead Magnet E-book", category: "Marketing" },
  { id: "mkt-07", name: "Prova Social NPS 9-10", category: "Marketing" },
  { id: "mkt-08", name: "Conteúdo Evergreen 52 Semanas", category: "Marketing" },
  { id: "mkt-09", name: "Retargeting Pixel", category: "Marketing" },
  { id: "mkt-10", name: "Blog Auto-Publish", category: "Marketing" },
  { id: "mkt-11", name: "Newsletter Mensal", category: "Marketing" },
  { id: "mkt-12", name: "Influencer Campaign Tracker", category: "Marketing" },
  // Vendas (8)
  { id: "vnd-01", name: "ManyChat Boas-Vindas", category: "Vendas" },
  { id: "vnd-02", name: "ManyChat Qualificação", category: "Vendas" },
  { id: "vnd-03", name: "ManyChat Bônus 10%", category: "Vendas" },
  { id: "vnd-04", name: "ManyChat Objeções", category: "Vendas" },
  { id: "vnd-05", name: "ManyChat Fechamento", category: "Vendas" },
  { id: "vnd-06", name: "ManyChat Follow-up", category: "Vendas" },
  { id: "vnd-07", name: "WhatsApp Agendamento 24/7", category: "Vendas" },
  { id: "vnd-08", name: "Lead Scoring Automático", category: "Vendas" },
  // Operações (15)
  { id: "ops-01", name: "Agendamento Automático", category: "Operações" },
  { id: "ops-02", name: "Confirmação de Orientação Técnica", category: "Operações" },
  { id: "ops-03", name: "Lembrete 24h Antes", category: "Operações" },
  { id: "ops-04", name: "Lembrete 1h Antes", category: "Operações" },
  { id: "ops-05", name: "Geração Link de Acesso", category: "Operações" },
  { id: "ops-06", name: "Gravação de Orientação Técnica", category: "Operações" },
  { id: "ops-07", name: "Geração de Prescrição", category: "Operações" },
  { id: "ops-08", name: "Envio de Prescrição", category: "Operações" },
  { id: "ops-09", name: "Cancelamento Automático", category: "Operações" },
  { id: "ops-10", name: "Reagendamento Automático", category: "Operações" },
  { id: "ops-11", name: "Sync Calendário Google", category: "Operações" },
  { id: "ops-12", name: "Notificação ao Médico", category: "Operações" },
  { id: "ops-13", name: "Notificação ao Paciente", category: "Operações" },
  { id: "ops-14", name: "Feedback Automático", category: "Operações" },
  { id: "ops-15", name: "Análise Disponibilidade", category: "Operações" },
  // Financeiro (10)
  { id: "fin-01", name: "Processamento Pagamento", category: "Financeiro" },
  { id: "fin-02", name: "Validação Pagamento", category: "Financeiro" },
  { id: "fin-03", name: "Split 93/7 Automático", category: "Financeiro" },
  { id: "fin-04", name: "Cálculo Bônus 10%", category: "Financeiro" },
  { id: "fin-05", name: "Atualização Saldo Médico", category: "Financeiro" },
  { id: "fin-06", name: "Geração de Recibo", category: "Financeiro" },
  { id: "fin-07", name: "Relatório Diário 08h", category: "Financeiro" },
  { id: "fin-08", name: "Relatório Mensal Dia 1", category: "Financeiro" },
  { id: "fin-09", name: "Auditoria Financeira", category: "Financeiro" },
  { id: "fin-10", name: "Previsão de Receita IA", category: "Financeiro" },
  // Suporte (7)
  { id: "sup-01", name: "Ticket Automático", category: "Suporte" },
  { id: "sup-02", name: "Resposta Automática IA", category: "Suporte" },
  { id: "sup-03", name: "Escalação de Ticket", category: "Suporte" },
  { id: "sup-04", name: "Notificação Resolução", category: "Suporte" },
  { id: "sup-05", name: "Feedback de Suporte", category: "Suporte" },
  { id: "sup-06", name: "Análise Satisfação", category: "Suporte" },
  { id: "sup-07", name: "Reporte de Problemas", category: "Suporte" },
  // RH/Médicos (8)
  { id: "rh-01", name: "Onboarding Automático", category: "RH/Médicos" },
  { id: "rh-02", name: "Verificação Documentos", category: "RH/Médicos" },
  { id: "rh-03", name: "Cálculo NPS Médico", category: "RH/Médicos" },
  { id: "rh-04", name: "Leaderboard Update", category: "RH/Médicos" },
  { id: "rh-05", name: "Gamificação Engine", category: "RH/Médicos" },
  { id: "rh-06", name: "Desbloqueio Badges", category: "RH/Médicos" },
  { id: "rh-07", name: "Notificação Bônus", category: "RH/Médicos" },
  { id: "rh-08", name: "Relatório Performance", category: "RH/Médicos" },
];

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string }> = {
  Marketing: { icon: <TrendingUp className="h-4 w-4" />, color: "text-blue-400" },
  Vendas: { icon: <ShoppingCart className="h-4 w-4" />, color: "text-green-400" },
  Operações: { icon: <Zap className="h-4 w-4" />, color: "text-yellow-400" },
  Financeiro: { icon: <DollarSign className="h-4 w-4" />, color: "text-purple-400" },
  Suporte: { icon: <Phone className="h-4 w-4" />, color: "text-red-400" },
  "RH/Médicos": { icon: <Award className="h-4 w-4" />, color: "text-cyan-400" },
};

interface Alert {
  id: string;
  timestamp: Date;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  automation: string;
}

// ── Simulate live data ──────────────────────────────────────────
function simulateAutomations(): Automation[] {
  return AUTOMATIONS_CATALOG.map((a) => {
    const r = Math.random();
    const status: Automation["status"] = r > 0.08 ? "online" : r > 0.04 ? "idle" : r > 0.02 ? "error" : "offline";
    return {
      ...a,
      status,
      lastRun: new Date(Date.now() - Math.random() * 3600000),
      responseTime: Math.round(50 + Math.random() * 400),
      errorCount: status === "error" ? Math.ceil(Math.random() * 5) : 0,
      successRate: status === "online" ? 95 + Math.random() * 5 : status === "idle" ? 80 + Math.random() * 15 : 40 + Math.random() * 40,
    };
  });
}

function generateTrafficData() {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    users: Math.round(20 + Math.random() * 180),
    conversion: +(2 + Math.random() * 8).toFixed(1),
    revenue: Math.round(500 + Math.random() * 4500),
  }));
}

function generateAlerts(automations: Automation[]): Alert[] {
  const alerts: Alert[] = [];
  automations.forEach((a) => {
    if (a.status === "error") {
      alerts.push({ id: `${a.id}-err`, timestamp: new Date(), severity: "error", message: `Falha na execução — ${a.errorCount} erro(s)`, automation: a.name });
    }
    if (a.status === "offline") {
      alerts.push({ id: `${a.id}-off`, timestamp: new Date(), severity: "critical", message: "Serviço offline — verificação necessária", automation: a.name });
    }
  });
  if (Math.random() > 0.6) alerts.push({ id: "sys-1", timestamp: new Date(), severity: "warning", message: "Latência elevada detectada no ManyChat API", automation: "Sistema" });
  if (Math.random() > 0.8) alerts.push({ id: "sys-2", timestamp: new Date(), severity: "info", message: "Backup automático concluído com sucesso", automation: "Sistema" });
  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);
}

// ── KPI fetcher ──────────────────────────────────────────
async function fetchKPIs() {
  const [profilesRes, appointmentsRes, npsRes, escrowRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("appointments").select("id", { count: "exact", head: true }),
    supabase.from("nps_responses").select("score"),
    supabase.from("escrow_transactions").select("amount, platform_fee"),
  ]);
  const totalUsers = profilesRes.count ?? 0;
  const totalConsultations = appointmentsRes.count ?? 0;
  const npsScores = npsRes.data ?? [];
  const avgNPS = npsScores.length ? npsScores.reduce((s, r) => s + r.score, 0) / npsScores.length : 0;
  const escrow = escrowRes.data ?? [];
  const totalRevenue = escrow.reduce((s, e) => s + Number(e.amount), 0);
  return { totalUsers, totalConsultations, avgNPS, totalRevenue, conversionRate: totalConsultations > 0 ? (totalConsultations / Math.max(totalUsers, 1)) * 100 : 0 };
}

// ── Page ──────────────────────────────────────────
const AutomationsDashboard = () => {
  const navigate = useNavigate();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trafficData, setTrafficData] = useState(generateTrafficData());
  const [kpis, setKpis] = useState({ totalUsers: 0, totalConsultations: 0, avgNPS: 0, totalRevenue: 0, conversionRate: 0 });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uptime] = useState(99.9);
  const [latency, setLatency] = useState(145);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(() => {
    const auto = simulateAutomations();
    setAutomations(auto);
    setAlerts(generateAlerts(auto));
    setTrafficData(generateTrafficData());
    setLatency(Math.round(80 + Math.random() * 200));
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    refresh();
    fetchKPIs().then(setKpis).catch(console.error);
    const iv = setInterval(refresh, 5000);
    return () => clearInterval(iv);
  }, [refresh]);

  const onlineCount = automations.filter((a) => a.status === "online").length;
  const errorCount = automations.filter((a) => a.status === "error").length;
  const offlineCount = automations.filter((a) => a.status === "offline").length;
  const globalStatus = offlineCount > 2 ? "offline" : errorCount > 3 ? "degraded" : "online";

  const categories = Object.keys(CATEGORY_META);

  const filteredAutomations = selectedCategory ? automations.filter((a) => a.category === selectedCategory) : automations;

  const statusIcon = (s: string) => {
    switch (s) {
      case "online": return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "idle": return <Clock className="h-4 w-4 text-yellow-400" />;
      case "error": return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default: return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const severityStyle = (s: string) => {
    switch (s) {
      case "critical": return "border-l-red-600 bg-red-950/40 text-red-300";
      case "error": return "border-l-orange-500 bg-orange-950/40 text-orange-300";
      case "warning": return "border-l-yellow-500 bg-yellow-950/40 text-yellow-300";
      default: return "border-l-blue-500 bg-blue-950/40 text-blue-300";
    }
  };

  return (
    <div className="min-h-dvh bg-[#0A0E27] text-white">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-[#0A0E27] via-[#111638] to-[#0A0E27] border-b border-[#39FF14]/20 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-[#39FF14]" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Painel de Automações</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="outline" className={`border ${globalStatus === "online" ? "border-green-500 text-green-400" : globalStatus === "degraded" ? "border-yellow-500 text-yellow-400" : "border-red-500 text-red-400"}`}>
              {globalStatus === "online" ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {globalStatus.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="border-blue-500/40 text-blue-300">Uptime {uptime}%</Badge>
            <Badge variant="outline" className="border-purple-500/40 text-purple-300">Latência {latency}ms</Badge>
            <span className="text-muted-foreground text-xs">Atualizado {lastRefresh.toLocaleTimeString()}</span>
            <Button size="sm" variant="outline" className="border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/10" onClick={refresh}><RefreshCw className="h-3 w-3 mr-1" /> Refresh</Button>
            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => navigate("/")}><LogOut className="h-3 w-3 mr-1" /> Sair</Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Usuários", value: kpis.totalUsers.toLocaleString(), icon: <Users className="h-5 w-5" />, accent: "text-blue-400" },
            { label: "Orientações Técnicas", value: kpis.totalConsultations.toLocaleString(), icon: <Activity className="h-5 w-5" />, accent: "text-green-400" },
            { label: "Receita", value: `R$ ${(kpis.totalRevenue / 1000).toFixed(1)}k`, icon: <DollarSign className="h-5 w-5" />, accent: "text-yellow-400" },
            { label: "NPS Médio", value: kpis.avgNPS.toFixed(1), icon: <Star className="h-5 w-5" />, accent: "text-purple-400" },
            { label: "Conversão", value: `${kpis.conversionRate.toFixed(1)}%`, icon: <TrendingUp className="h-5 w-5" />, accent: "text-cyan-400" },
            { label: "Automações", value: `${onlineCount}/60`, icon: <Bot className="h-5 w-5" />, accent: "text-[#39FF14]" },
          ].map((k) => (
            <Card key={k.label} className="bg-[#111638]/80 border-[#39FF14]/10">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <span className={k.accent}>{k.icon}</span>
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <span className="text-lg font-bold">{k.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Progress bar ── */}
        <Card className="bg-[#111638]/80 border-[#39FF14]/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Saúde Global</span>
              <span className="text-sm text-[#39FF14]">{onlineCount}/60 online · {errorCount} erro(s) · {offlineCount} offline</span>
            </div>
            <Progress value={(onlineCount / 60) * 100} className="h-2 bg-[#0A0E27]" />
          </CardContent>
        </Card>

        <Tabs defaultValue="automations" className="space-y-4">
          <TabsList className="bg-[#111638] border border-[#39FF14]/10">
            <TabsTrigger value="automations">🤖 Automações</TabsTrigger>
            <TabsTrigger value="charts">📈 Gráficos</TabsTrigger>
            <TabsTrigger value="alerts">🚨 Alertas ({alerts.length})</TabsTrigger>
            <TabsTrigger value="controls">⚙️ Controles</TabsTrigger>
          </TabsList>

          {/* ── Automations Tab ── */}
          <TabsContent value="automations" className="space-y-4">
            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={selectedCategory === null ? "default" : "outline"} className={selectedCategory === null ? "bg-[#39FF14] text-black hover:bg-[#39FF14]/80" : "border-[#39FF14]/20 text-gray-300"} onClick={() => setSelectedCategory(null)}>Todas (60)</Button>
              {categories.map((cat) => {
                const catAutos = automations.filter((a) => a.category === cat);
                const catOnline = catAutos.filter((a) => a.status === "online").length;
                const catErrors = catAutos.filter((a) => a.status === "error" || a.status === "offline").length;
                return (
                  <Button key={cat} size="sm" variant={selectedCategory === cat ? "default" : "outline"} className={selectedCategory === cat ? "bg-[#39FF14] text-black" : `border-[#39FF14]/20 ${CATEGORY_META[cat].color}`} onClick={() => setSelectedCategory(cat)}>
                    {CATEGORY_META[cat].icon}
                    <span className="ml-1">{cat} ({catOnline}/{catAutos.length})</span>
                    {catErrors > 0 && <span className="ml-1 text-red-400">⚠{catErrors}</span>}
                  </Button>
                );
              })}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredAutomations.map((a) => (
                <Card key={a.id} className={`bg-[#111638]/60 border ${a.status === "online" ? "border-green-500/20" : a.status === "error" ? "border-red-500/40 animate-pulse" : a.status === "offline" ? "border-red-600/60" : "border-yellow-500/20"}`}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {statusIcon(a.status)}
                        <span className="text-sm font-medium leading-tight">{a.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{a.category}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                      <span>Resp: {a.responseTime}ms</span>
                      <span>Erros: {a.errorCount}</span>
                      <span>Taxa: {a.successRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={a.successRate} className="h-1 bg-[#0A0E27]" />
                    <div className="text-[10px] text-muted-foreground">Último: {a.lastRun.toLocaleTimeString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Charts Tab ── */}
          <TabsContent value="charts">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-[#111638]/80 border-[#39FF14]/10">
                <CardHeader><CardTitle className="text-sm">📊 Tráfego (24h)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5a" />
                      <XAxis dataKey="time" stroke="#666" fontSize={10} />
                      <YAxis stroke="#666" fontSize={10} />
                      <Tooltip contentStyle={{ background: "#111638", border: "1px solid #39FF14" }} />
                      <Area type="monotone" dataKey="users" stroke="#39FF14" fill="#39FF14" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="bg-[#111638]/80 border-[#39FF14]/10">
                <CardHeader><CardTitle className="text-sm">📈 Conversão & Receita (24h)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5a" />
                      <XAxis dataKey="time" stroke="#666" fontSize={10} />
                      <YAxis yAxisId="left" stroke="#666" fontSize={10} />
                      <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={10} />
                      <Tooltip contentStyle={{ background: "#111638", border: "1px solid #39FF14" }} />
                      <Line yAxisId="left" type="monotone" dataKey="conversion" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category breakdown */}
              <Card className="bg-[#111638]/80 border-[#39FF14]/10 lg:col-span-2">
                <CardHeader><CardTitle className="text-sm">🤖 Saúde por Categoria</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {categories.map((cat) => {
                      const catAutos = automations.filter((a) => a.category === cat);
                      const online = catAutos.filter((a) => a.status === "online").length;
                      const pct = (online / catAutos.length) * 100;
                      return (
                        <div key={cat} className="text-center space-y-1">
                          <span className={`text-xs ${CATEGORY_META[cat].color}`}>{cat}</span>
                          <div className="text-lg font-bold">{online}/{catAutos.length}</div>
                          <Progress value={pct} className="h-1.5 bg-[#0A0E27]" />
                          <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Alerts Tab ── */}
          <TabsContent value="alerts">
            <Card className="bg-[#111638]/80 border-[#39FF14]/10">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4 text-red-400" /> Alertas Recentes</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {alerts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nenhum alerta — tudo operando normalmente ✅</p>
                  ) : (
                    <div className="space-y-2">
                      {alerts.map((al) => (
                        <div key={al.id} className={`border-l-4 p-3 rounded ${severityStyle(al.severity)}`}>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="font-semibold text-sm">{al.automation}</span>
                              <p className="text-xs mt-0.5">{al.message}</p>
                            </div>
                            <span className="text-[10px] shrink-0">{al.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Controls Tab ── */}
          <TabsContent value="controls">
            <Card className="bg-[#111638]/80 border-[#39FF14]/10">
              <CardHeader><CardTitle className="text-sm">⚙️ Controles de Automação</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Iniciar Todas", icon: <Play className="h-4 w-4" />, cls: "bg-green-600 hover:bg-green-700" },
                    { label: "Pausar Todas", icon: <Pause className="h-4 w-4" />, cls: "bg-yellow-600 hover:bg-yellow-700" },
                    { label: "Parar Todas", icon: <Power className="h-4 w-4" />, cls: "bg-red-600 hover:bg-red-700" },
                    { label: "Reiniciar", icon: <RefreshCw className="h-4 w-4" />, cls: "bg-blue-600 hover:bg-blue-700" },
                    { label: "Gerar Relatório", icon: <FileText className="h-4 w-4" />, cls: "bg-purple-600 hover:bg-purple-700" },
                    { label: "Backup DB", icon: <Database className="h-4 w-4" />, cls: "bg-indigo-600 hover:bg-indigo-700" },
                    { label: "Enviar Alerta", icon: <Mail className="h-4 w-4" />, cls: "bg-pink-600 hover:bg-pink-700" },
                    { label: "Health Check", icon: <Activity className="h-4 w-4" />, cls: "bg-cyan-600 hover:bg-cyan-700", action: () => navigate("/health") },
                  ].map((btn) => (
                    <Button key={btn.label} className={`${btn.cls} text-white font-medium`} onClick={() => { btn.action?.(); toast.success(`${btn.label} — executado`); }}>
                      {btn.icon}
                      <span className="ml-2">{btn.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AutomationsDashboard;
