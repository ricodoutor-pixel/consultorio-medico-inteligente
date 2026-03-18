import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Stethoscope, ShoppingBag, Star, Trophy, Gift, ArrowRight, Calendar, Clock, CheckCircle2, Bell, User, Heart, Activity, TrendingUp, Flame, Target, Award, Zap, Crown, Shield, Sparkles, Timer, LogOut, Pill, Watch, Leaf, Package } from "lucide-react";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { DeliveryConfirmation } from "@/components/DeliveryConfirmation";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { professionals } from "@/data/professionals";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };
const tooltipStyle = { background: "hsl(240 15% 8%)", border: "1px solid hsl(240 10% 16%)", borderRadius: "12px", color: "hsl(240 10% 93%)" };

const allBadges = [
  { name: "Iniciante", icon: "🌱", earned: true, desc: "Criou conta na plataforma" },
  { name: "Ativo", icon: "⚡", earned: false, desc: "7 dias consecutivos de login", progress: 30 },
  { name: "Estudioso", icon: "📚", earned: false, desc: "Leu 5 artigos da biblioteca", progress: 10 },
  { name: "Especialista", icon: "🏆", earned: false, desc: "Complete 10 consultas", progress: 0 },
  { name: "Embaixador", icon: "🌟", earned: false, desc: "Indique 5 amigos", progress: 0 },
  { name: "VIP", icon: "👑", earned: false, desc: "Acumule 1000 pontos", progress: 0 },
];

const DashboardPaciente = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "badges">("overview");
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const recommendedPros = professionals.filter(p => p.category === "Médicos Prescritores").slice(0, 3);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const userId = session.user.id;

    const [profileRes, apptsRes, notifRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("appointments").select("*").eq("patient_id", userId).order("scheduled_at", { ascending: false }).limit(20),
      supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (apptsRes.data) setAppointments(apptsRes.data);
    if (notifRes.data) setNotifications(notifRes.data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Sessão encerrada" });
    navigate("/");
  };

  const completedAppts = appointments.filter(a => a.status === "completed");
  const upcomingAppts = appointments.filter(a => a.status === "scheduled" || a.status === "confirmed");
  const totalSpent = appointments.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  const wellnessData = [
    { dia: "Sem 1", score: 60 + completedAppts.length * 5 },
    { dia: "Sem 2", score: 65 + completedAppts.length * 5 },
    { dia: "Sem 3", score: 70 + completedAppts.length * 3 },
    { dia: "Atual", score: 75 + completedAppts.length * 3 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const userName = profile?.full_name || "Paciente";

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
                <h1 className="text-2xl md:text-4xl font-display font-black text-foreground">Olá, {userName.split(" ")[0]}! 👋</h1>
                <p className="text-sm text-muted-foreground">{completedAppts.length} consulta(s) realizadas</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={handleLogout}>
                <LogOut size={14} className="mr-1" /> Sair
              </Button>
              <Button size="sm" className="rounded-xl text-xs bg-primary text-primary-foreground" asChild>
                <Link to="/telemedicina"><Stethoscope size={14} className="mr-1" /> Nova Consulta</Link>
              </Button>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {([
              { key: "overview" as const, label: "Visão Geral", icon: Activity },
              { key: "badges" as const, label: "Badges", icon: Trophy },
            ]).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${activeTab === t.key ? "border-primary bg-gradient-green text-primary" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"}`}>
                <t.icon size={12} /> {t.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" initial="hidden" animate="visible" variants={stagger}>
            {[
              { label: "Consultas", value: String(appointments.length), icon: Stethoscope, color: "primary" },
              { label: "Confirmadas", value: String(upcomingAppts.length), icon: Calendar, color: "gold" },
              { label: "Concluídas", value: String(completedAppts.length), icon: CheckCircle2, color: "secondary" },
              { label: "Total Gasto", value: `R$ ${totalSpent.toFixed(0)}`, icon: Star, color: "primary" },
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

          {/* Quick Access — Cannabis Tools */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Treatment Tracker", desc: "Dosagem e efeitos", icon: Activity, to: "/treatment-tracker", color: "text-primary" },
              { label: "Dispensário", desc: "Farmácia segura", icon: Leaf, to: "/dispensario", color: "text-secondary" },
              { label: "IoMT Hub", desc: "Wearables & FHIR", icon: Watch, to: "/iomt", color: "text-blue-400" },
              { label: "Meus Dados", desc: "LGPD & Direitos", icon: Shield, to: "/lgpd", color: "text-yellow-400" },
            ].map((item, i) => (
              <Link key={i} to={item.to}>
                <Card className="border-border hover:border-primary/30 transition-all cursor-pointer group">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <item.icon size={16} className={item.color} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

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

                {upcomingAppts.length > 0 && (
                  <Card className="border-green/20 bg-gradient-green">
                    <CardContent className="p-5">
                      <h3 className="font-display font-black text-foreground text-sm mb-3 flex items-center gap-2">
                        <Calendar size={14} className="text-primary" /> Próximas Consultas
                      </h3>
                      {upcomingAppts.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border mb-2">
                          <div>
                            <p className="font-bold text-sm text-foreground">Consulta {a.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(a.scheduled_at).toLocaleDateString("pt-BR")} às {new Date(a.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-green text-xs capitalize">{a.status}</Badge>
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
                    {appointments.length === 0 ? (
                      <div className="text-center py-8">
                        <Stethoscope size={32} className="text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhuma consulta ainda.</p>
                        <Button size="sm" className="mt-3 rounded-xl bg-primary text-primary-foreground" asChild>
                          <Link to="/telemedicina">Agendar Primeira Consulta</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {appointments.slice(0, 5).map(a => (
                          <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 size={16} className={a.status === "completed" ? "text-primary" : "text-muted-foreground"} />
                              <div>
                                <p className="text-sm font-bold text-foreground">Consulta {a.type}</p>
                                <p className="text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleDateString("pt-BR")}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-primary">R$ {Number(a.amount).toFixed(2)}</p>
                              <Badge className="text-[10px] bg-primary/10 text-primary border-green capitalize">{a.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                      <Bell size={14} className="text-[hsl(45,76%,52%)]" /> Notificações
                    </h3>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhuma notificação.</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map(n => (
                          <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl border ${n.is_read ? "bg-muted/10 border-border" : "bg-primary/5 border-green/20"}`}>
                            <Bell size={14} className="text-primary mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-foreground">{n.title}</p>
                              <p className="text-[10px] text-muted-foreground">{n.message}</p>
                              <span className="text-[9px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString("pt-BR")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {notifications.length > 0 && (
                      <Button variant="outline" size="sm" className="w-full mt-3 rounded-xl text-xs" asChild>
                        <Link to="/notificacoes">Ver todas <ArrowRight size={12} className="ml-1" /></Link>
                      </Button>
                    )}
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

                <Card className="border-purple/20 bg-gradient-purple">
                  <CardContent className="p-5 text-center">
                    <Star size={24} className="text-secondary mx-auto mb-2" />
                    <p className="text-lg font-display font-black text-foreground">Planta & Raiz</p>
                    <p className="text-xs text-muted-foreground mb-3">Sua saúde, nossa prioridade</p>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs w-full" asChild>
                      <Link to="/shopping">Visitar Shopping <ArrowRight size={12} className="ml-1" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "badges" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allBadges.map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`border-border transition-all hover:-translate-y-1 ${b.earned ? "border-primary/30 bg-gradient-green" : "opacity-60"}`}>
                    <CardContent className="p-5 text-center">
                      <span className="text-4xl block mb-2">{b.icon}</span>
                      <h4 className="font-display font-black text-foreground text-sm">{b.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1">{b.desc}</p>
                      {b.earned ? (
                        <Badge className="mt-3 text-[10px] bg-primary/10 text-primary border-green">
                          <CheckCircle2 size={10} className="mr-1" /> Conquistado
                        </Badge>
                      ) : (
                        <div className="mt-3">
                          <Progress value={b.progress || 0} className="h-1.5 mb-1" />
                          <span className="text-[9px] text-muted-foreground">{b.progress || 0}%</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DashboardPaciente;
