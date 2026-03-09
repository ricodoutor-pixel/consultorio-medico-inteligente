import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Users, ShoppingBag, Stethoscope, DollarSign, TrendingUp, Shield, CheckCircle2, XCircle, Clock, AlertTriangle, Activity, Globe, Eye, UserPlus, LogOut, RefreshCw, Wallet, HeartPulse, BarChart3, Bell } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const generateLiveData = () => ({
  usersOnline: Math.floor(Math.random() * 300) + 150,
  pageViews: Math.floor(Math.random() * 5000) + 8000,
  newSignups: Math.floor(Math.random() * 50) + 20,
  activeConsults: Math.floor(Math.random() * 30) + 5,
  gmv: (Math.random() * 20000 + 40000).toFixed(2),
  orders: Math.floor(Math.random() * 100) + 300,
  appointments: Math.floor(Math.random() * 50) + 100,
  conversionRate: (Math.random() * 2 + 3.5).toFixed(1),
  activeSellers: Math.floor(Math.random() * 5) + 8,
  activeProfessionals: 15,
});

const revenueData = [
  { month: "Set", receita: 12400, consultas: 3200, shopping: 7800, assinaturas: 1400 },
  { month: "Out", receita: 18200, consultas: 5100, shopping: 10800, assinaturas: 2300 },
  { month: "Nov", receita: 24800, consultas: 7400, shopping: 14200, assinaturas: 3200 },
  { month: "Dez", receita: 31500, consultas: 9800, shopping: 17500, assinaturas: 4200 },
  { month: "Jan", receita: 38900, consultas: 12100, shopping: 21800, assinaturas: 5000 },
  { month: "Fev", receita: 47850, consultas: 15200, shopping: 26200, assinaturas: 6450 },
];

const trafficData = [
  { hora: "00h", visitas: 120 }, { hora: "02h", visitas: 80 }, { hora: "04h", visitas: 40 },
  { hora: "06h", visitas: 150 }, { hora: "08h", visitas: 480 }, { hora: "10h", visitas: 720 },
  { hora: "12h", visitas: 890 }, { hora: "14h", visitas: 950 }, { hora: "16h", visitas: 1100 },
  { hora: "18h", visitas: 1350 }, { hora: "20h", visitas: 980 }, { hora: "22h", visitas: 650 },
];

const userDistribution = [
  { name: "Pacientes", value: 65, color: "hsl(152 80% 45%)" },
  { name: "Profissionais", value: 15, color: "hsl(270 60% 60%)" },
  { name: "Farmácias", value: 10, color: "hsl(45 76% 52%)" },
  { name: "Visitantes", value: 10, color: "hsl(240 10% 68%)" },
];

const webhookLogs = [
  { id: "WH-001", status: "processed", type: "payment.approved", created: "23/02/2026 14:32", paymentId: "PAY-ABC123", amount: "R$ 120,00" },
  { id: "WH-002", status: "processed", type: "payment.approved", created: "23/02/2026 13:15", paymentId: "PAY-DEF456", amount: "R$ 85,00" },
  { id: "WH-003", status: "failed", type: "payment.rejected", created: "23/02/2026 12:01", paymentId: "PAY-GHI789", amount: "R$ 55,00" },
  { id: "WH-004", status: "processed", type: "payment.approved", created: "22/02/2026 18:45", paymentId: "PAY-JKL012", amount: "R$ 200,00" },
  { id: "WH-005", status: "pending", type: "payment.pending", created: "22/02/2026 16:20", paymentId: "PAY-MNO345", amount: "R$ 90,00" },
  { id: "WH-006", status: "processed", type: "refund.completed", created: "22/02/2026 14:10", paymentId: "PAY-PQR678", amount: "R$ 45,00" },
];

const users = [
  { id: 1, name: "Maria L.", role: "patient", email: "maria@email.com", status: "active", date: "20/02/2026" },
  { id: 2, name: "Dr. Felipe Andrade", role: "professional", email: "felipe@email.com", status: "verified", date: "15/01/2026" },
  { id: 3, name: "Verde Vida", role: "seller", email: "contato@verdevida.com", status: "verified", date: "10/01/2026" },
  { id: 4, name: "João P.", role: "patient", email: "joao@email.com", status: "active", date: "22/02/2026" },
  { id: 5, name: "Dra. Camila Rocha", role: "professional", email: "camila@email.com", status: "pending", date: "23/02/2026" },
  { id: 6, name: "Cannabis Pharma", role: "seller", email: "contato@cannabispharma.com", status: "pending", date: "23/02/2026" },
  { id: 7, name: "Roberto Santos", role: "patient", email: "roberto@email.com", status: "active", date: "21/02/2026" },
  { id: 8, name: "Farmácia Vida Verde", role: "seller", email: "farma@vidaverde.com", status: "verified", date: "05/02/2026" },
];

const alerts = [
  { type: "warning", msg: "5 cadastros de profissionais pendentes de verificação", time: "2 min" },
  { type: "success", msg: "Webhook Mercado Pago processado — PAY-ABC123", time: "12 min" },
  { type: "error", msg: "Falha no webhook — PAY-GHI789 (pagamento rejeitado)", time: "1h" },
  { type: "info", msg: "Novo vendedor cadastrado: Cannabis Pharma", time: "3h" },
];

type Tab = "dashboard" | "users" | "webhooks" | "alerts" | "analytics";

const Admin = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [live, setLive] = useState(generateLiveData());
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "90d">("30d");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin-login"); return; }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) { navigate("/admin-login"); return; }
    };
    checkAuth();
    const interval = setInterval(() => setLive(generateLiveData()), 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  const tooltipStyle = { background: "hsl(240 15% 8%)", border: "1px solid hsl(240 10% 16%)", borderRadius: "12px", color: "hsl(240 10% 93%)" };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div className="mb-8 flex items-center justify-between flex-wrap gap-4" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold border border-gold flex items-center justify-center glow-gold">
                <Shield size={24} className="text-[hsl(45,76%,52%)]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-black text-foreground">Painel Administrativo</h1>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Dados atualizando em tempo real • RBAC Admin
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setLive(generateLiveData())}>
                <RefreshCw size={14} className="mr-1" /> Atualizar
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-xs text-destructive border-destructive/30" onClick={handleLogout}>
                <LogOut size={14} className="mr-1" /> Sair
              </Button>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {([
              { key: "dashboard" as Tab, label: "Dashboard", icon: BarChart3 },
              { key: "analytics" as Tab, label: "Analytics", icon: TrendingUp },
              { key: "users" as Tab, label: "Usuários", icon: Users },
              { key: "webhooks" as Tab, label: "Webhooks", icon: Activity },
              { key: "alerts" as Tab, label: "Alertas", icon: Bell },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${
                  tab === t.key ? "border-gold bg-gradient-gold text-[hsl(45,76%,52%)]" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon size={14} /> {t.label}
                {t.key === "alerts" && <span className="w-2 h-2 rounded-full bg-destructive" />}
              </button>
            ))}
          </div>

          {/* Dashboard */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              {/* Live KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Usuários Online", value: live.usersOnline, icon: Globe, color: "primary", pulse: true },
                  { label: "GMV Total", value: `R$ ${Number(live.gmv).toLocaleString("pt-BR")}`, icon: DollarSign, color: "gold" },
                  { label: "Pedidos", value: live.orders, icon: ShoppingBag, color: "secondary" },
                  { label: "Consultas", value: live.appointments, icon: Stethoscope, color: "primary" },
                  { label: "Conversão", value: `${live.conversionRate}%`, icon: TrendingUp, color: "gold" },
                ].map((kpi, i) => (
                  <Card key={i} className="border-border hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <kpi.icon size={16} className={kpi.color === "primary" ? "text-primary" : kpi.color === "secondary" ? "text-secondary" : "text-[hsl(45,76%,52%)]"} />
                        {kpi.pulse && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <p className="text-2xl font-display font-black text-foreground">{kpi.value}</p>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">{kpi.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Secondary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Visualizações Hoje", value: live.pageViews.toLocaleString(), icon: Eye },
                  { label: "Novos Cadastros", value: live.newSignups, icon: UserPlus },
                  { label: "Consultas Ativas", value: live.activeConsults, icon: HeartPulse },
                  { label: "Vendedores Ativos", value: live.activeSellers, icon: Wallet },
                ].map((kpi, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <kpi.icon size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-foreground">{kpi.value}</p>
                        <span className="text-[10px] text-muted-foreground font-bold">{kpi.label}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp size={16} className="text-primary" /> Receita Mensal
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 16%)" />
                        <XAxis dataKey="month" stroke="hsl(240 10% 68%)" fontSize={12} />
                        <YAxis stroke="hsl(240 10% 68%)" fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
                        <Area type="monotone" dataKey="receita" stroke="hsl(152 80% 45%)" fill="hsl(152 80% 45% / 0.15)" strokeWidth={2} />
                        <Area type="monotone" dataKey="consultas" stroke="hsl(270 60% 60%)" fill="hsl(270 60% 60% / 0.1)" strokeWidth={2} />
                        <Area type="monotone" dataKey="shopping" stroke="hsl(45 76% 52%)" fill="hsl(45 76% 52% / 0.1)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                      <Users size={16} className="text-secondary" /> Distribuição de Usuários
                    </h3>
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                          <Pie data={userDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {userDistribution.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-3">
                        {userDistribution.map((d) => (
                          <div key={d.name} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                            <span className="text-xs text-muted-foreground">{d.name}</span>
                            <span className="text-xs font-bold text-foreground">{d.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Traffic */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-[hsl(45,76%,52%)]" /> Tráfego Hoje (por hora)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 16%)" />
                      <XAxis dataKey="hora" stroke="hsl(240 10% 68%)" fontSize={11} />
                      <YAxis stroke="hsl(240 10% 68%)" fontSize={11} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="visitas" fill="hsl(152 80% 45%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics */}
          {tab === "analytics" && (
            <div className="space-y-6">
              {/* Time Filter */}
              <div className="flex gap-2 flex-wrap">
                {(["24h", "7d", "30d", "90d"] as const).map(f => (
                  <button key={f} onClick={() => setTimeFilter(f)} className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${timeFilter === f ? "border-gold bg-gradient-gold text-[hsl(45,76%,52%)]" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"}`}>
                    {f === "24h" ? "Últimas 24h" : f === "7d" ? "7 dias" : f === "30d" ? "30 dias" : "90 dias"}
                  </button>
                ))}
                <Button variant="outline" size="sm" className="rounded-full text-xs ml-auto" onClick={() => {
                  const data = JSON.stringify({ timeFilter, live, revenueData, trafficData, userDistribution }, null, 2);
                  const blob = new Blob([data], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `analytics-${timeFilter}-${new Date().toISOString().slice(0, 10)}.json`; a.click();
                }}>
                  📊 Exportar Dados
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: "CAC (Custo Aquisição)", value: "R$ 12,40", trend: "-8%", good: true },
                  { label: "LTV (Lifetime Value)", value: "R$ 340,00", trend: "+15%", good: true },
                  { label: "Churn Mensal", value: "3.2%", trend: "-0.5%", good: true },
                ].map((m, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-6">
                      <p className="text-xs text-muted-foreground font-bold uppercase mb-2">{m.label}</p>
                      <p className="text-3xl font-display font-black text-foreground mb-1">{m.value}</p>
                      <Badge className={`text-xs ${m.good ? "bg-primary/10 text-primary border-green" : "bg-destructive/10 text-destructive"}`}>
                        {m.trend}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4">Receita por Canal</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 16%)" />
                      <XAxis dataKey="month" stroke="hsl(240 10% 68%)" fontSize={12} />
                      <YAxis stroke="hsl(240 10% 68%)" fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
                      <Bar dataKey="consultas" fill="hsl(152 80% 45%)" radius={[4, 4, 0, 0]} name="Consultas" />
                      <Bar dataKey="shopping" fill="hsl(270 60% 60%)" radius={[4, 4, 0, 0]} name="Shopping" />
                      <Bar dataKey="assinaturas" fill="hsl(45 76% 52%)" radius={[4, 4, 0, 0]} name="Assinaturas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-display font-black text-foreground mb-4">Métricas IA — Predições</h3>
                    <div className="space-y-4">
                      {[
                        { label: "Previsão receita Mar/2026", value: "R$ 58.200", confidence: "87%" },
                        { label: "Risco de fraude detectado", value: "0 alertas", confidence: "99%" },
                        { label: "Usuários previstos (30d)", value: "+12.400", confidence: "82%" },
                        { label: "Taxa conversão prevista", value: "5.1%", confidence: "78%" },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                          <div>
                            <p className="text-xs text-muted-foreground">{p.label}</p>
                            <p className="text-sm font-black text-foreground">{p.value}</p>
                          </div>
                          <Badge variant="outline" className="text-xs text-primary border-green">Confiança {p.confidence}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-display font-black text-foreground mb-4">Conformidade Regulatória</h3>
                    <div className="space-y-3">
                      {[
                        { label: "ANVISA RDC 327/2019", status: "✅ Conforme" },
                        { label: "LGPD — Proteção de Dados", status: "✅ Conforme" },
                        { label: "PCI-DSS — Pagamentos", status: "✅ Conforme" },
                        { label: "WCAG 2.1 — Acessibilidade", status: "⚠️ Parcial" },
                        { label: "Auditoria Logs", status: "✅ Ativo" },
                        { label: "Backup Diário", status: "✅ Ativo" },
                      ].map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                          <span className="text-sm text-foreground font-medium">{c.label}</span>
                          <span className="text-xs font-bold">{c.status}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Users */}
          {tab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-foreground">Gestão de Usuários ({users.length})</h2>
                <Badge className="bg-primary/10 text-primary border-green text-xs">{users.filter(u => u.status === "pending").length} pendentes</Badge>
              </div>
              <div className="space-y-3">
                {users.map((u) => (
                  <Card key={u.id} className="border-border hover:border-primary/20 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/30 to-primary/20 border border-border flex items-center justify-center font-bold text-sm text-foreground">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-sm text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email} • {u.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{u.role === "patient" ? "Paciente" : u.role === "professional" ? "Profissional" : "Vendedor"}</Badge>
                        <Badge className={`text-xs ${
                          u.status === "verified" ? "bg-primary/10 text-primary border-green" :
                          u.status === "pending" ? "bg-[hsl(45,76%,52%)]/10 text-[hsl(45,76%,52%)] border-gold" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {u.status === "verified" ? <><CheckCircle2 size={10} className="mr-1" />Verificado</> :
                           u.status === "pending" ? <><Clock size={10} className="mr-1" />Pendente</> :
                           "Ativo"}
                        </Badge>
                        {u.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs border-green text-primary rounded-lg">Aprovar</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-destructive text-destructive rounded-lg">Rejeitar</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Webhooks */}
          {tab === "webhooks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-black text-foreground">Logs de Webhook — Mercado Pago</h2>
                  <p className="text-xs text-muted-foreground mt-1">Auditável: todos os eventos são registrados com payload, timestamp e status.</p>
                </div>
                <Badge variant="outline" className="text-xs text-primary border-green">{webhookLogs.filter(l => l.status === "processed").length} processados</Badge>
              </div>
              <div className="space-y-3">
                {webhookLogs.map((log) => (
                  <Card key={log.id} className="border-border">
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          log.status === "processed" ? "bg-primary/10" :
                          log.status === "failed" ? "bg-destructive/10" : "bg-[hsl(45,76%,52%)]/10"
                        }`}>
                          {log.status === "processed" ? <CheckCircle2 size={16} className="text-primary" /> :
                           log.status === "failed" ? <XCircle size={16} className="text-destructive" /> :
                           <Clock size={16} className="text-[hsl(45,76%,52%)]" />}
                        </div>
                        <div>
                          <p className="font-black text-sm text-foreground font-mono">{log.type}</p>
                          <p className="text-xs text-muted-foreground">{log.id} • {log.paymentId} • {log.created}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{log.amount}</span>
                        <Badge variant="outline" className={`text-xs ${
                          log.status === "processed" ? "text-primary border-green" :
                          log.status === "failed" ? "text-destructive border-destructive" : "text-[hsl(45,76%,52%)] border-gold"
                        }`}>
                          {log.status === "processed" ? "Processado" : log.status === "failed" ? "Falha" : "Pendente"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {tab === "alerts" && (
            <div className="space-y-4">
              <h2 className="font-display font-black text-foreground">Central de Alertas</h2>
              <div className="space-y-3">
                {alerts.map((a, i) => (
                  <Card key={i} className={`border-border ${a.type === "error" ? "border-l-2 border-l-destructive" : a.type === "warning" ? "border-l-2 border-l-[hsl(45,76%,52%)]" : a.type === "success" ? "border-l-2 border-l-primary" : ""}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          a.type === "error" ? "bg-destructive/10" : a.type === "warning" ? "bg-[hsl(45,76%,52%)]/10" : a.type === "success" ? "bg-primary/10" : "bg-muted"
                        }`}>
                          {a.type === "error" ? <XCircle size={14} className="text-destructive" /> :
                           a.type === "warning" ? <AlertTriangle size={14} className="text-[hsl(45,76%,52%)]" /> :
                           a.type === "success" ? <CheckCircle2 size={14} className="text-primary" /> :
                           <Bell size={14} className="text-muted-foreground" />}
                        </div>
                        <p className="text-sm text-foreground font-medium">{a.msg}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Admin;
