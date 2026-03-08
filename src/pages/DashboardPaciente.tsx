import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Stethoscope, ShoppingBag, Star, Trophy, Gift, ArrowRight, Calendar, Clock, CheckCircle2, Bell, User, Heart, Activity, TrendingUp, Flame, Target, Award, Zap, Crown, Shield, Sparkles, Timer } from "lucide-react";
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
  { id: 4, icon: Flame, msg: "Streak de 3 dias! Continue assim!", time: "1d", color: "primary" },
  { id: 5, icon: Sparkles, msg: "Novo desafio semanal disponível!", time: "2d", color: "secondary" },
];

const allBadges = [
  { name: "Iniciante", icon: "🌱", emoji: Zap, earned: true, desc: "Criou conta na plataforma", earnedDate: "01/01/2026" },
  { name: "Ativo", icon: "⚡", emoji: Activity, earned: true, desc: "7 dias consecutivos de login", earnedDate: "08/01/2026" },
  { name: "Estudioso", icon: "📚", emoji: Award, earned: true, desc: "Leu 5 artigos da biblioteca", earnedDate: "15/01/2026" },
  { name: "Social", icon: "💬", emoji: Heart, earned: true, desc: "Participou de 3 tópicos na comunidade", earnedDate: "20/01/2026" },
  { name: "Especialista", icon: "🏆", emoji: Trophy, earned: false, desc: "Complete 10 consultas", progress: 30 },
  { name: "Embaixador", icon: "🌟", emoji: Star, earned: false, desc: "Indique 5 amigos", progress: 20 },
  { name: "VIP", icon: "👑", emoji: Crown, earned: false, desc: "Acumule 1000 pontos", progress: 45 },
  { name: "Guardião", icon: "🛡️", emoji: Shield, earned: false, desc: "1 ano de tratamento contínuo", progress: 25 },
];

const weeklyChallenges = [
  { name: "Complete seu perfil", progress: 80, reward: 50, icon: User, deadline: "Sem prazo", type: "onboarding" },
  { name: "Primeira consulta", progress: 100, reward: 100, icon: Stethoscope, deadline: "Concluído ✓", type: "milestone" },
  { name: "Indique 1 amigo", progress: 0, reward: 200, icon: Gift, deadline: "Sem prazo", type: "social" },
  { name: "7 dias consecutivos", progress: 43, reward: 150, icon: Flame, deadline: "4 dias restantes", type: "streak" },
  { name: "Leia 3 artigos esta semana", progress: 66, reward: 75, icon: Award, deadline: "3 dias restantes", type: "weekly" },
  { name: "Avalie sua última consulta", progress: 0, reward: 25, icon: Star, deadline: "2 dias restantes", type: "weekly" },
  { name: "Participe da comunidade", progress: 50, reward: 50, icon: Heart, deadline: "5 dias restantes", type: "weekly" },
];

const streakHistory = [
  { week: "Sem 1", dias: 5 }, { week: "Sem 2", dias: 7 }, { week: "Sem 3", dias: 4 },
  { week: "Sem 4", dias: 6 }, { week: "Sem 5", dias: 3 }, { week: "Atual", dias: 3 },
];

const levelThresholds = [
  { level: 1, name: "Semente", min: 0, max: 100 },
  { level: 2, name: "Broto", min: 100, max: 300 },
  { level: 3, name: "Planta", min: 300, max: 600 },
  { level: 4, name: "Árvore", min: 600, max: 1000 },
  { level: 5, name: "Floresta", min: 1000, max: 2000 },
];

const currentPoints = 450;
const currentLevel = levelThresholds.find(l => currentPoints >= l.min && currentPoints < l.max) || levelThresholds[2];
const progressToNext = ((currentPoints - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;

const tooltipStyle = { background: "hsl(240 15% 8%)", border: "1px solid hsl(240 10% 16%)", borderRadius: "12px", color: "hsl(240 10% 93%)" };

const DashboardPaciente = () => {
  const [currentStreak, setCurrentStreak] = useState(3);
  const [activeTab, setActiveTab] = useState<"overview" | "badges" | "challenges">("overview");
  const recommendedPros = professionals.filter(p => p.category === "Médicos Prescritores").slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-8 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div className="flex items-center justify-between flex-wrap gap-4 mb-6" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-green border border-green flex items-center justify-center">
                <User size={28} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-black text-foreground">Olá, Paciente! 👋</h1>
                <p className="text-sm text-muted-foreground">Nível {currentLevel.level} — {currentLevel.name} • {currentPoints} pts</p>
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

          {/* Level Progress */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="border-green/20 bg-gradient-green mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">Nível {currentLevel.level}: {currentLevel.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{currentPoints}/{currentLevel.max} pts → Nível {currentLevel.level + 1}</span>
                </div>
                <Progress value={progressToNext} className="h-2" />
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Flame size={14} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">{currentStreak} dias de streak</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Melhor: 7 dias</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {([
              { key: "overview" as const, label: "Visão Geral", icon: Activity },
              { key: "badges" as const, label: "Badges", icon: Trophy },
              { key: "challenges" as const, label: "Desafios", icon: Target },
            ]).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${activeTab === t.key ? "border-primary bg-gradient-green text-primary" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"}`}>
                <t.icon size={12} /> {t.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" initial="hidden" animate="visible" variants={stagger}>
            {[
              { label: "Consultas", value: "3", icon: Stethoscope, color: "primary" },
              { label: "Produtos", value: "7", icon: ShoppingBag, color: "gold" },
              { label: "Pontos", value: "450", icon: Star, color: "secondary" },
              { label: "Streak", value: `${currentStreak} dias`, icon: Flame, color: "primary" },
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

          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                      <Heart size={16} className="text-primary" /> Índice de Bem-estar
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

              <div className="space-y-6">
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                      <Bell size={14} className="text-[hsl(45,76%,52%)]" /> Notificações
                    </h3>
                    <div className="space-y-2">
                      {notifications.map(n => (
                        <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                          <n.icon size={14} className={n.color === "primary" ? "text-primary mt-0.5" : "text-secondary mt-0.5"} />
                          <div>
                            <p className="text-xs font-bold text-foreground">{n.msg}</p>
                            <span className="text-[10px] text-muted-foreground">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Challenges */}
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                      <Target size={14} className="text-primary" /> Desafios Ativos
                    </h3>
                    <div className="space-y-3">
                      {weeklyChallenges.filter(c => c.progress < 100).slice(0, 3).map((c, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-bold text-foreground">{c.name}</span>
                            <span className="text-[10px] text-[hsl(45,76%,52%)] font-bold">+{c.reward} pts</span>
                          </div>
                          <Progress value={c.progress} className="h-1.5" />
                          <span className="text-[9px] text-muted-foreground flex items-center gap-1 mt-1"><Timer size={8} /> {c.deadline}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3 rounded-xl text-xs" onClick={() => setActiveTab("challenges")}>
                      Ver todos <ArrowRight size={12} className="ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-purple/20 bg-gradient-purple">
                  <CardContent className="p-5 text-center">
                    <Star size={24} className="text-secondary mx-auto mb-2" />
                    <p className="text-2xl font-display font-black text-foreground">{currentPoints} pts</p>
                    <p className="text-xs text-muted-foreground mb-3">1 ponto = R$ 1 desconto</p>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs w-full" asChild>
                      <Link to="/shopping">Usar no Shopping <ArrowRight size={12} className="ml-1" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "badges" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {allBadges.map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`border-border transition-all hover:-translate-y-1 ${b.earned ? "border-primary/30 bg-gradient-green" : "opacity-60"}`}>
                    <CardContent className="p-5 text-center">
                      <span className="text-4xl block mb-2">{b.icon}</span>
                      <h4 className="font-display font-black text-foreground text-sm">{b.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1">{b.desc}</p>
                      {b.earned ? (
                        <Badge className="mt-3 text-[10px] bg-primary/10 text-primary border-green">
                          <CheckCircle2 size={10} className="mr-1" /> Conquistado {b.earnedDate}
                        </Badge>
                      ) : (
                        <div className="mt-3">
                          <Progress value={b.progress || 0} className="h-1.5 mb-1" />
                          <span className="text-[9px] text-muted-foreground">{b.progress}% concluído</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "challenges" && (
            <div className="space-y-6">
              {/* Streak Calendar */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                    <Flame size={16} className="text-primary" /> Histórico de Streaks
                  </h3>
                  <div className="grid grid-cols-6 gap-3">
                    {streakHistory.map((w, i) => (
                      <div key={i} className="text-center">
                        <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-lg font-black ${w.dias >= 7 ? "bg-primary/20 text-primary border border-green" : w.dias >= 5 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {w.dias}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 block">{w.week}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    🔥 Streak atual: <span className="font-bold text-primary">{currentStreak} dias</span> • Melhor: <span className="font-bold">7 dias</span> • Bônus 7 dias: <span className="font-bold text-[hsl(45,76%,52%)]">+150 pts</span>
                  </p>
                </CardContent>
              </Card>

              {/* All Challenges */}
              <div className="grid sm:grid-cols-2 gap-4">
                {weeklyChallenges.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={`border-border transition-all ${c.progress === 100 ? "border-primary/20 bg-gradient-green" : ""}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.progress === 100 ? "bg-primary/20" : "bg-muted"}`}>
                            <c.icon size={18} className={c.progress === 100 ? "text-primary" : "text-muted-foreground"} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-foreground">{c.name}</h4>
                              <span className="text-xs font-bold text-[hsl(45,76%,52%)]">+{c.reward} pts</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Timer size={8} /> {c.deadline}</span>
                              <Badge className="text-[8px] bg-muted text-muted-foreground border-border">{c.type}</Badge>
                            </div>
                            <div className="mt-2">
                              <Progress value={c.progress} className="h-2" />
                              <span className="text-[10px] text-muted-foreground mt-1 block">{c.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
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

export default DashboardPaciente;
