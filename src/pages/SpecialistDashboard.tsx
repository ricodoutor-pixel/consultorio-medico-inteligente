import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Star, DollarSign, Users, FileText, TrendingUp, Clock, Video, MessageSquare, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const earningsData = [
  { month: "Jan", valor: 2400 }, { month: "Fev", valor: 3200 }, { month: "Mar", valor: 4100 },
  { month: "Abr", valor: 3800 }, { month: "Mai", valor: 5200 }, { month: "Jun", valor: 6100 },
];

const consultsByDay = [
  { dia: "Seg", total: 5 }, { dia: "Ter", total: 8 }, { dia: "Qua", total: 6 },
  { dia: "Qui", total: 9 }, { dia: "Sex", total: 7 }, { dia: "Sab", total: 3 },
];

const upcomingConsults = [
  { patient: "Maria Silva", time: "09:00", type: "Primeira Orientação Técnica", status: "confirmed" },
  { patient: "João Santos", time: "10:30", type: "Retorno", status: "confirmed" },
  { patient: "Ana Oliveira", time: "14:00", type: "Avaliação", status: "pending" },
  { patient: "Carlos Lima", time: "15:30", type: "Receita", status: "confirmed" },
];

const recentPrescriptions = [
  { patient: "Pedro Almeida", date: "23/02/2026", product: "CBD Full Spectrum 30ml", status: "Emitida" },
  { patient: "Luísa Ferreira", date: "22/02/2026", product: "Óleo CBD 500mg", status: "Validada ANVISA" },
  { patient: "Roberto Dias", date: "21/02/2026", product: "Cápsulas CBD 25mg", status: "Em uso" },
];

const SpecialistDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
                  Dashboard <span className="text-gradient-green">Especialista</span>
                </h1>
                <p className="text-muted-foreground font-medium mt-1">Dr. Felipe Andrade • Neurologia</p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-sm font-bold text-foreground">{isOnline ? "Online" : "Offline"}</span>
                <Switch checked={isOnline} onCheckedChange={setIsOnline} />
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: DollarSign, label: "Ganhos (mês)", value: "R$ 6.100", change: "+18%", color: "green" },
                { icon: Users, label: "Orientações Técnicas (mês)", value: "38", change: "+12%", color: "green" },
                { icon: FileText, label: "Receitas Emitidas", value: "24", change: "+8%", color: "purple" },
                { icon: Star, label: "Avaliação Média", value: "4.9★", change: "+0.1", color: "gold" },
              ].map((kpi, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <kpi.icon size={20} className="text-primary" />
                      <span className="text-xs font-bold text-primary">{kpi.change}</span>
                    </div>
                    <p className="text-2xl font-display font-black text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground font-bold">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Earnings Chart */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp size={18} /> Ganhos Mensais
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={earningsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" />
                      <XAxis dataKey="month" stroke="hsl(240 10% 68%)" fontSize={12} />
                      <YAxis stroke="hsl(240 10% 68%)" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                      <Tooltip contentStyle={{ background: "hsl(240 15% 7%)", border: "1px solid hsl(240 10% 14%)", borderRadius: "14px", color: "hsl(240 10% 93%)" }} />
                      <Line type="monotone" dataKey="valor" stroke="hsl(152 80% 45%)" strokeWidth={3} dot={{ fill: "hsl(152 80% 45%)", r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Consults by Day */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Calendar size={18} /> Orientações Técnicas por Dia
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={consultsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" />
                      <XAxis dataKey="dia" stroke="hsl(240 10% 68%)" fontSize={12} />
                      <YAxis stroke="hsl(240 10% 68%)" fontSize={12} />
                      <Tooltip contentStyle={{ background: "hsl(240 15% 7%)", border: "1px solid hsl(240 10% 14%)", borderRadius: "14px", color: "hsl(240 10% 93%)" }} />
                      <Bar dataKey="total" fill="hsl(270 60% 60%)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Upcoming */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Clock size={18} /> Próximas Orientações Técnicas
                  </h3>
                  <div className="space-y-3">
                    {upcomingConsults.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Video size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{c.patient}</p>
                            <p className="text-xs text-muted-foreground">{c.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-black text-sm text-foreground">{c.time}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "confirmed" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                            {c.status === "confirmed" ? "Confirmada" : "Pendente"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Prescriptions */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <FileText size={18} /> Receitas Recentes
                  </h3>
                  <div className="space-y-3">
                    {recentPrescriptions.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                        <div>
                          <p className="font-bold text-sm text-foreground">{p.patient}</p>
                          <p className="text-xs text-muted-foreground">{p.product}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{p.date}</p>
                          <span className="text-[10px] font-bold text-primary">{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PIX Balance */}
            <Card className="border-border mt-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-black text-foreground flex items-center gap-2">
                      <DollarSign size={18} /> Saldo PIX a Receber
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Comissão de 10% já deduzida automaticamente</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-display font-black text-gradient-green">R$ 5.490,00</p>
                    <p className="text-xs text-muted-foreground">Próximo pagamento: 28/02/2026</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SpecialistDashboard;
