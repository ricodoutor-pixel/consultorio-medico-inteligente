import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Stethoscope, ShoppingBag, Star, Trophy, Gift, ArrowRight, Calendar, Clock, CheckCircle2, Bell, User, Heart, Activity, TrendingUp, Flame, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { professionals } from "@/data/professionals";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const wellnessData = [
  { dia: "01", score: 65 }, { dia: "05", score: 68 }, { dia: "09", score: 72 }, { dia: "13", score: 70 },
  { dia: "17", score: 75 }, { dia: "21", score: 78 }, { dia: "25", score: 82 }, { dia: "30", score: 85 },
];

const consultHistory = [
  { id: 1, doctor: "Dr. Felipe Andrade", specialty: "Neurologia", date: "28/02/2026", status: "Concluída", price: "R$ 130,00" },
  { id: 2, doctor: "Dra. Camila Rocha", specialty: "Psiquiatria", date: "15/02/2026", status: "Concluída", price: "R$ 90,00" },
  { id: 3, doctor: "Dr. Ricardo Mendes", specialty: "Clínica da Dor", date: "01/02/2026", status: "Concluída", price: "R$ 49,90" },
];

const upcomingConsults = [
  { id: 1, doctor: "Dra. Camila Rocha", date: "10/03/2026", time: "14:00", type: "Retorno" },
];

const notifications = [
  { id: 1, icon: Calendar, msg: "Consulta com Dra. Camila em 5 dias", time: "agora", color: "primary" },
  { id: 2, icon: ShoppingBag, msg: "Seu pedido #1234 foi enviado", time: "2h", color: "gold" },
  { id: 3, icon: Trophy, msg: "Você conquistou a badge 'Ativo'!", time: "1d", color: "secondary" },
];

const badges = [
  { name: "Iniciante", icon: "🌱", earned: true },
  { name: "Ativo", icon: "⚡", earned: true },
  { name: "Especialista", icon: "🏆", earned: false },
  { name: "VIP", icon: "👑", earned: false },
];

const challenges = [
  { name: "Complete seu perfil", progress: 80, reward: 50 },
  { name: "Primeira consulta", progress: 100, reward: 100 },
  { name: "Indique 1 amigo", progress: 0, reward: 200 },
  { name: "7 dias consecutivos", progress: 43, reward: 150 },
];

const tooltipStyle = { background: "hsl(240 15% 8%)", border: "1px solid hsl(240 10% 16%)", borderRadius: "12px", color: "hsl(240 10% 93%)" };

const DashboardPaciente = () => {
  const recommendedPros = professionals.filter(p => p.category === "Médicos Prescritores").slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-8 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div className="flex items-center justify-between flex-wrap gap-4 mb-8" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-green border border-green flex items-center justify-center">
                <User size={28} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-black text-foreground">Olá, Paciente! 👋</h1>
                <p className="text-sm text-muted-foreground">Seu painel de saúde personalizado</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl text-xs" asChild>
                <Link to="/indicacoes"><Gift size={14} className="mr-1" /> Indique e Ganhe</Link>
              </Button>
              <Button size="sm" className="rounded-xl text-xs bg-primary text-primary-foreground" asChild>
                <Link to="/telemedicina"><Stethoscope size={14} className="mr-1" /> Nova Consulta</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" initial="hidden" animate="visible" variants={stagger}>
            {[
              { label: "Consultas", value: "3", icon: Stethoscope, color: "primary" },
              { label: "Produtos", value: "7", icon: ShoppingBag, color: "gold" },
              { label: "Pontos", value: "450", icon: Star, color: "secondary" },
              { label: "Streak", value: "3 dias", icon: Flame, color: "primary" },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <s.icon size={18} className={s.color === "primary" ? "text-primary" : s.color === "secondary" ? "text-secondary" : "text-[hsl(45,76%,52%)]"} />
                    <p className="text-2xl font-display font-black text-foreground mt-2">{s.value}</p>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{s.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Wellness Chart */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Heart size={16} className="text-primary" /> Índice de Bem-estar (últimos 30 dias)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={wellnessData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 16%)" />
                      <XAxis dataKey="dia" stroke="hsl(240 10% 68%)" fontSize={11} />
                      <YAxis stroke="hsl(240 10% 68%)" fontSize={11} domain={[50, 100]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="score" stroke="hsl(152 80% 45%)" strokeWidth={2} dot={{ fill: "hsl(152 80% 45%)", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Upcoming */}
              {upcomingConsults.length > 0 && (
                <Card className="border-green/20 bg-gradient-green">
                  <CardContent className="p-5">
                    <h3 className="font-display font-black text-foreground text-sm mb-3 flex items-center gap-2">
                      <Calendar size={14} className="text-primary" /> Próximas Consultas
                    </h3>
                    {upcomingConsults.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                        <div>
                          <p className="font-bold text-sm text-foreground">{c.doctor}</p>
                          <p className="text-xs text-muted-foreground">{c.date} às {c.time} • {c.type}</p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-green text-xs">Agendada</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* History */}
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" /> Histórico de Consultas
                  </h3>
                  <div className="space-y-2">
                    {consultHistory.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={16} className="text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-foreground">{c.doctor}</p>
                            <p className="text-xs text-muted-foreground">{c.specialty} • {c.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-primary">{c.price}</p>
                          <Badge className="text-[10px] bg-primary/10 text-primary border-green">{c.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Specialists */}
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                    <Stethoscope size={14} className="text-secondary" /> Especialistas Recomendados
                  </h3>
                  <div className="space-y-2">
                    {recommendedPros.map(pro => (
                      <div key={pro.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                        <div className="flex items-center gap-3">
                          <img src={pro.imageUrl} alt={pro.name} className="w-10 h-10 rounded-xl object-cover border border-border" />
                          <div>
                            <p className="text-sm font-bold text-foreground">{pro.name}</p>
                            <p className="text-xs text-muted-foreground">{pro.tags.join(" • ")}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs" asChild>
                          <Link to={`/profissionais/${pro.id}`}>Ver <ArrowRight size={12} className="ml-1" /></Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Notifications */}
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                    <Bell size={14} className="text-[hsl(45,76%,52%)]" /> Notificações
                  </h3>
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                        <n.icon size={14} className={n.color === "primary" ? "text-primary mt-0.5" : n.color === "secondary" ? "text-secondary mt-0.5" : "text-[hsl(45,76%,52%)] mt-0.5"} />
                        <div>
                          <p className="text-xs font-bold text-foreground">{n.msg}</p>
                          <span className="text-[10px] text-muted-foreground">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gamification */}
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                    <Trophy size={14} className="text-[hsl(45,76%,52%)]" /> Badges
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {badges.map((b, i) => (
                      <div key={i} className={`p-3 rounded-xl border text-center ${b.earned ? "border-primary/20 bg-gradient-green" : "border-border bg-muted/20 opacity-50"}`}>
                        <span className="text-2xl">{b.icon}</span>
                        <p className="text-[10px] font-bold text-foreground mt-1">{b.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Challenges */}
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                    <Target size={14} className="text-primary" /> Desafios
                  </h3>
                  <div className="space-y-3">
                    {challenges.map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-foreground">{c.name}</span>
                          <span className="text-[10px] text-[hsl(45,76%,52%)] font-bold">+{c.reward} pts</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${c.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Points Info */}
              <Card className="border-purple/20 bg-gradient-purple">
                <CardContent className="p-5 text-center">
                  <Star size={24} className="text-secondary mx-auto mb-2" />
                  <p className="text-2xl font-display font-black text-foreground">450 pts</p>
                  <p className="text-xs text-muted-foreground mb-3">1 ponto = R$ 1 desconto</p>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs w-full" asChild>
                    <Link to="/shopping">Usar no Shopping <ArrowRight size={12} className="ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DashboardPaciente;
