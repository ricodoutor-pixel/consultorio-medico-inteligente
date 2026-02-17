import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, ShoppingBag, Stethoscope, DollarSign, TrendingUp, Shield, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const kpiData = {
  gmv: "R$ 47.850",
  orders: 342,
  appointments: 128,
  activeSellers: 8,
  activeProfessionals: 15,
  conversionRate: "4.2%",
};

const revenueData = [
  { month: "Set", receita: 12400 },
  { month: "Out", receita: 18200 },
  { month: "Nov", receita: 24800 },
  { month: "Dez", receita: 31500 },
  { month: "Jan", receita: 38900 },
  { month: "Fev", receita: 47850 },
];

const webhookLogs = [
  { id: "WH-001", provider: "mercadopago", status: "processed", type: "payment.approved", created: "17/02/2026 14:32", paymentId: "PAY-ABC123" },
  { id: "WH-002", provider: "mercadopago", status: "processed", type: "payment.approved", created: "17/02/2026 13:15", paymentId: "PAY-DEF456" },
  { id: "WH-003", provider: "mercadopago", status: "failed", type: "payment.rejected", created: "17/02/2026 12:01", paymentId: "PAY-GHI789" },
  { id: "WH-004", provider: "mercadopago", status: "processed", type: "payment.approved", created: "16/02/2026 18:45", paymentId: "PAY-JKL012" },
  { id: "WH-005", provider: "mercadopago", status: "pending", type: "payment.pending", created: "16/02/2026 16:20", paymentId: "PAY-MNO345" },
];

const users = [
  { id: 1, name: "Maria L.", role: "patient", email: "maria@email.com", status: "active" },
  { id: 2, name: "Dr. Felipe Andrade", role: "professional", email: "felipe@email.com", status: "verified" },
  { id: 3, name: "Verde Vida", role: "seller", email: "contato@verdevida.com", status: "verified" },
  { id: 4, name: "João P.", role: "patient", email: "joao@email.com", status: "active" },
  { id: 5, name: "Dra. Camila Rocha", role: "professional", email: "camila@email.com", status: "pending" },
  { id: 6, name: "Cannabis Pharma", role: "seller", email: "contato@cannabispharma.com", status: "pending" },
];

type Tab = "dashboard" | "users" | "webhooks";

const Admin = () => {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div className="mb-8" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-2">
              <Shield size={24} className="text-primary" />
              <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground">Admin</h1>
            </div>
            <p className="text-muted-foreground text-sm">Painel administrativo — RBAC admin</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {[
              { key: "dashboard" as Tab, label: "Dashboard" },
              { key: "users" as Tab, label: "Usuários & Verificação" },
              { key: "webhooks" as Tab, label: "Webhooks Mercado Pago" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  tab === t.key ? "border-gold bg-gradient-gold text-primary" : "border-border bg-card/50 text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Dashboard */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "GMV", value: kpiData.gmv, icon: DollarSign, color: "primary" },
                  { label: "Pedidos", value: kpiData.orders, icon: ShoppingBag, color: "secondary" },
                  { label: "Consultas", value: kpiData.appointments, icon: Stethoscope, color: "primary" },
                  { label: "Sellers", value: kpiData.activeSellers, icon: Users, color: "secondary" },
                  { label: "Profissionais", value: kpiData.activeProfessionals, icon: Users, color: "primary" },
                  { label: "Conversão", value: kpiData.conversionRate, icon: TrendingUp, color: "secondary" },
                ].map((kpi, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 mb-1">
                        <kpi.icon size={14} className={kpi.color === "primary" ? "text-primary" : "text-secondary"} />
                        <span className="text-[10px] text-muted-foreground font-bold">{kpi.label}</span>
                      </div>
                      <p className="text-xl font-display font-bold text-foreground">{kpi.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-bold text-foreground mb-4">Receita Mensal (GMV)</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 16%)" />
                      <XAxis dataKey="month" stroke="hsl(240 10% 72%)" fontSize={12} />
                      <YAxis stroke="hsl(240 10% 72%)" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: "hsl(240 15% 8%)", border: "1px solid hsl(240 10% 16%)", borderRadius: "12px", color: "hsl(240 10% 93%)" }} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
                      <Line type="monotone" dataKey="receita" stroke="hsl(45 76% 52%)" strokeWidth={3} dot={{ fill: "hsl(45 76% 52%)", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users */}
          {tab === "users" && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-foreground">Gestão de Usuários</h2>
              <div className="space-y-3">
                {users.map((u) => (
                  <Card key={u.id} className="border-border">
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/30 to-primary/20 border border-border flex items-center justify-center font-bold text-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{u.role === "patient" ? "Paciente" : u.role === "professional" ? "Profissional" : "Vendedor"}</Badge>
                        <Badge className={`text-xs ${
                          u.status === "verified" ? "bg-secondary/20 text-secondary border-green" :
                          u.status === "pending" ? "bg-primary/20 text-primary border-gold" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {u.status === "verified" ? <><CheckCircle2 size={10} className="mr-1" />Verificado</> :
                           u.status === "pending" ? <><Clock size={10} className="mr-1" />Pendente</> :
                           "Ativo"}
                        </Badge>
                        {u.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs border-green text-secondary">Aprovar</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-destructive text-destructive">Rejeitar</Button>
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
              <h2 className="font-display font-bold text-foreground">Logs de Webhook — Mercado Pago</h2>
              <p className="text-xs text-muted-foreground">Auditável: todos os eventos são registrados com payload, timestamp e status de processamento.</p>
              <div className="space-y-3">
                {webhookLogs.map((log) => (
                  <Card key={log.id} className="border-border">
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          log.status === "processed" ? "bg-secondary/20" :
                          log.status === "failed" ? "bg-destructive/20" : "bg-primary/20"
                        }`}>
                          {log.status === "processed" ? <CheckCircle2 size={14} className="text-secondary" /> :
                           log.status === "failed" ? <XCircle size={14} className="text-destructive" /> :
                           <Clock size={14} className="text-primary" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground font-mono">{log.type}</p>
                          <p className="text-xs text-muted-foreground">{log.id} • {log.paymentId} • {log.created}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${
                        log.status === "processed" ? "text-secondary border-green" :
                        log.status === "failed" ? "text-destructive border-destructive" : "text-primary border-gold"
                      }`}>
                        {log.status === "processed" ? "Processado" : log.status === "failed" ? "Falha" : "Pendente"}
                      </Badge>
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
