import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Stethoscope, ShoppingBag, Star, Trophy, Gift, ArrowRight, Calendar, Clock, CheckCircle2, Bell, BellRing, User, Heart, Activity, TrendingUp, Flame, Target, Award, Zap, Crown, Shield, Sparkles, Timer, LogOut, Pill, Watch, Leaf, FileText, ClipboardList, RefreshCw, MessageCircle, ArrowUpRight, BookOpen } from "lucide-react";
import { PlanUpgradeCard } from "@/components/patient/PlanUpgradeCard";
import { ProfileAvatarCard } from "@/components/patient/ProfileAvatarCard";
import { VipUpgradePopup } from "@/components/VipUpgradePopup";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WellnessSubscriptionCards } from "@/components/WellnessSubscriptionCards";

import { FrogMoodBanner } from "@/components/FrogMoodBanner";
import { PatientCheckinCard } from "@/components/PatientCheckinCard";
import { EvolutionChart } from "@/components/EvolutionChart";
import { ProgressReportGenerator } from "@/components/ProgressReportGenerator";
import PassportQRCard from "@/components/passport/PassportQRCard";
import { SymptomTracker } from "@/components/diary/SymptomTracker";
import { Skeleton } from "@/components/ui/skeleton";
import { professionals } from "@/data/professionals";
import AirQualityWidget from "@/components/health/AirQualityWidget";
import { QuickActionHub } from "@/components/patient/QuickActionHub";
import { TelemedChat } from "@/components/patient/TelemedChat";
import { IoTBiometricTracker } from "@/components/IoTBiometricTracker";
import { FarmacogenomicaCard } from "@/components/FarmacogenomicaCard";
import { TitulacaoTrackerCard } from "@/components/TitulacaoTrackerCard";
import { Anvisa1ClickButton } from "@/components/Anvisa1ClickButton";

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
  const [activeTab, setActiveTab] = useState<"overview" | "badges" | "prescriptions" | "triages" | "telemed" | "upgrade">("overview");
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [triages, setTriages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<any>(null);
  const [renewLoading, setRenewLoading] = useState(false);
  const [whatsappPreview, setWhatsappPreview] = useState<string | null>(null);
  const [checkinRefresh, setCheckinRefresh] = useState(0);
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

    const [profileRes, apptsRes, notifRes, prescRes, triageRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("appointments").select("*").eq("patient_id", userId).order("scheduled_at", { ascending: false }).limit(20),
      supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("prescriptions").select("*").eq("patient_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("brisa_triages").select("*").eq("patient_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (apptsRes.data) setAppointments(apptsRes.data);
    if (notifRes.data) setNotifications(notifRes.data);
    if (prescRes.data) setPrescriptions(prescRes.data);
    if (triageRes.data) setTriages(triageRes.data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Sessão encerrada" });
    navigate("/");
  };

  const handleRenewalRequest = async () => {
    if (!renewTarget || !profile) return;
    setRenewLoading(true);
    const { error } = await supabase.from("prescription_requests" as any).insert({
      patient_id: profile.id,
      prescription_id: renewTarget.id,
      doctor_id: renewTarget.doctor_id,
      status: "pending",
      notes: "Solicitação de renovação via Dashboard",
    });
    setRenewLoading(false);
    if (error) {
      toast({ title: "Erro ao solicitar renovação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Renovação solicitada ✅", description: "Seu médico será notificado para avaliar a renovação." });
      setWhatsappPreview(`Olá ${profile.full_name?.split(" ")[0] || "Paciente"}, sua solicitação de renovação de receita foi registrada na Planta y Raiz. Acompanhe pelo seu dashboard: https://plantayraiz.com.br/dashboard/paciente`);
    }
    setRenewModalOpen(false);
    setRenewTarget(null);
  };

  const isNearExpiry = (validUntil: string | null) => {
    if (!validUntil) return true;
    const diff = new Date(validUntil).getTime() - Date.now();
    return diff < 15 * 24 * 60 * 60 * 1000; // 15 days
  };

  const completedAppts = appointments.filter(a => a.status === "completed");
  const upcomingAppts = appointments.filter(a => a.status === "scheduled" || a.status === "confirmed");
  const awaitingPaymentAppts = appointments.filter(a => a.payment_status === "pending" || a.payment_status === "awaiting_payment");
  const totalSpent = appointments.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  const handleCompletePayment = async (appointmentId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          appointmentId,
          patientEmail: session?.session?.user?.email || "",
          description: "Orientação Técnica Planta y Raiz — Pagamento Pendente",
        },
      });
      if (error || !data?.init_point) {
        toast({ title: "Erro ao gerar pagamento", description: "Tente novamente em instantes.", variant: "destructive" });
        return;
      }
      window.location.href = data.init_point;
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };




  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <section className="pt-24 pb-8 md:pt-32">
          <div className="container mx-auto px-4 space-y-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-[220px] w-full rounded-xl" />
          </div>
        </section>
      </div>
    );
  }

  const userName = profile?.full_name || "Paciente";

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="pt-20 md:pt-24">
        <FrogMoodBanner />
      </div>

      <section className="pb-8">
        <div className="container mx-auto px-4">
          <motion.div className="flex items-center justify-between flex-wrap gap-4 mb-6" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="relative mt-12 md:mt-10">
              <VipUpgradePopup role="paciente" className="-top-[70px] left-1/2 -translate-x-1/2 w-max" />
              <ProfileAvatarCard
                userId={profile?.id}
                fullName={userName}
                phone={profile?.phone}
                avatarUrl={profile?.avatar_url}
                completedCount={completedAppts.length}
                onUpdated={(url) => setProfile((p: any) => ({ ...p, avatar_url: url }))}
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Button size="sm" className="rounded-xl text-xs bg-purple-600 text-white hover:bg-purple-700 font-bold" asChild>
                <Link to="/afiliados"><Gift size={14} className="mr-1" /> Indique e Ganhe</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={handleLogout}>
                <LogOut size={14} className="mr-1" /> Sair
              </Button>
              <Button size="sm" className="rounded-xl text-xs bg-background text-primary border border-primary/20 hover:bg-primary/10" asChild>
                <Link to="/manual?tab=paciente"><BookOpen size={14} className="mr-1" /> Passo a Passo</Link>
              </Button>
              <Button size="sm" className="rounded-xl text-xs bg-[#00a884] text-white hover:bg-[#008f6f]" asChild>
                <Link to="/telemed-whatsapp"><MessageCircle size={14} className="mr-1" /> Telemed WhatsApp</Link>
              </Button>
              <Button size="sm" className="rounded-xl text-xs bg-primary text-primary-foreground" asChild>
                <a href={`https://wa.me/5511991363154?text=${encodeURIComponent(`Olá Enfermeira Brisa, ${profile?.full_name || "sou paciente"}, gostaria de iniciar uma nova Orientação Técnica.`)}`} target="_blank" rel="noopener noreferrer"><Stethoscope size={14} className="mr-1" /> Nova Orientação Técnica</a>
              </Button>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {([
              { key: "overview" as const, label: "Visão Geral", icon: Activity },
              { key: "telemed" as const, label: "Telemed", icon: MessageCircle },
              { key: "prescriptions" as const, label: "Receitas", icon: FileText },
              { key: "triages" as const, label: "Triagens", icon: ClipboardList },
              { key: "badges" as const, label: "Badges", icon: Trophy },
              { key: "upgrade" as const, label: "Upgrade", icon: ArrowUpRight },
            ]).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${activeTab === t.key ? "border-primary bg-gradient-green text-primary" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"}`}>
                <t.icon size={12} /> {t.label}
              </button>
            ))}
          </div>

          {/* Qualidade do ar (aviso clínico para vaporização) */}
          <div className="mb-6">
            <AirQualityWidget />
          </div>

          {/* Stats */}

          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" initial="hidden" animate="visible" variants={stagger}>
            {[
              { label: "Orientações Técnicas", value: String(appointments.length), icon: Stethoscope, color: "primary" },
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

          {/* Hub Central de Ações Rápidas (only on overview) */}
          {activeTab === "overview" && (
            <QuickActionHub onTabSwitch={(tab) => setActiveTab(tab as any)} />
          )}

          {/* ── TELEMED CHAT TAB ── */}
          {activeTab === "telemed" && (
            <TelemedChat patientId={profile?.id} />
          )}

          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Awaiting Payment Alert */}
                {awaitingPaymentAppts.length > 0 && (
                  <Card className="border-yellow-500/30 bg-yellow-500/5">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-display font-black text-sm text-foreground flex items-center gap-2">
                        <Bell size={14} className="text-yellow-400" /> Pagamento Pendente
                      </h3>
                      {awaitingPaymentAppts.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              Orientação Técnica {a.type === "video" ? "Vídeo" : a.type === "chat" ? "Chat" : "Telefone"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              R$ {Number(a.amount || 0).toFixed(2)} • {new Date(a.scheduled_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <Button size="sm" className="rounded-xl text-xs" onClick={() => handleCompletePayment(a.id)}>
                            💳 Pagar Agora
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {/* Integração IoT & Biometria Clínica */}
                <IoTBiometricTracker />

                {/* Titulação Autônoma (Brisa 2.0) */}
                <TitulacaoTrackerCard role="patient" />
                
                {/* Integração Farmacogenômica (DNA Canabinoide) */}
                <FarmacogenomicaCard patientId={profile?.id} />

                {/* Check-in Card */}
                <PatientCheckinCard userId={profile?.id || ""} onCheckinComplete={() => setCheckinRefresh(p => p + 1)} />

                {/* Evolution Chart */}
                {profile?.id && (
                  <div className="space-y-3">
                    <EvolutionChart userId={profile.id} refreshKey={checkinRefresh} />
                    <div className="flex justify-end">
                      <ProgressReportGenerator userId={profile.id} patientName={profile.full_name || "Paciente"} />
                    </div>
                  </div>
                )}
                {upcomingAppts.length > 0 && (
                  <Card className="border-green/20 bg-gradient-green">
                    <CardContent className="p-5">
                      <h3 className="font-display font-black text-foreground text-sm mb-3 flex items-center gap-2">
                        <Calendar size={14} className="text-primary" /> Próximas Orientações Técnicas
                      </h3>
                      {upcomingAppts.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border mb-2">
                          <div>
                            <p className="font-bold text-sm text-foreground">Orientação Técnica {a.type}</p>
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

                {/* Passaporte Canábico Digital */}
                <PassportQRCard autoCreateIfMissing />

                {/* Meu Diário Planta y Raiz — sintomas, sono, humor, gotas */}
                <div id="symptom-diary-section">
                  {profile?.id && <SymptomTracker patientId={profile.id} />}
                </div>

                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                      <Clock size={14} className="text-muted-foreground" /> Histórico de Orientações Técnicas
                    </h3>
                    {appointments.length === 0 ? (
                      <div className="text-center py-8">
                        <Stethoscope size={32} className="text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhuma consulta ainda.</p>
                        <Button size="sm" className="mt-3 rounded-xl bg-primary text-primary-foreground" asChild>
                          <a href={`https://wa.me/5511991363154?text=${encodeURIComponent("Olá Brisa, quero agendar minha primeira Orientação Técnica.")}`} target="_blank" rel="noopener noreferrer">Agendar Primeira Orientação Técnica</a>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {appointments.slice(0, 5).map(a => (
                          <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 size={16} className={a.status === "completed" ? "text-primary" : "text-muted-foreground"} />
                              <div>
                                <p className="text-sm font-bold text-foreground">Orientação Técnica {a.type}</p>
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

          {activeTab === "prescriptions" && (
            <div className="space-y-4">
              <h2 className="font-display font-black text-foreground text-lg flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Minhas Receitas Médicas
              </h2>
              {prescriptions.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="p-8 text-center">
                    <FileText size={32} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma receita encontrada.</p>
                    <p className="text-xs text-muted-foreground mt-1">Após sua primeira consulta, suas prescrições aparecerão aqui.</p>
                    <Button size="sm" className="mt-4 rounded-xl bg-primary text-primary-foreground" asChild>
                      <a href={`https://wa.me/5511991363154?text=${encodeURIComponent("Olá Brisa, quero agendar uma Orientação Técnica.")}`} target="_blank" rel="noopener noreferrer">Agendar Orientação Técnica</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {prescriptions.map(rx => {
                    const meds = Array.isArray(rx.medications) ? rx.medications : [];
                    const nearExpiry = isNearExpiry(rx.valid_until);
                    return (
                      <Card key={rx.id} className={`border-border hover:border-primary/20 transition-colors ${nearExpiry ? "border-yellow-500/20" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-bold text-sm text-foreground">Prescrição #{rx.id.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">{new Date(rx.created_at).toLocaleDateString("pt-BR")}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {nearExpiry && <Badge className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Vencendo</Badge>}
                              <Badge className={`text-[10px] capitalize ${rx.status === "active" ? "bg-primary/10 text-primary border-green" : "bg-muted text-muted-foreground"}`}>{rx.status}</Badge>
                            </div>
                          </div>
                          {rx.diagnosis_cid && <p className="text-xs text-muted-foreground mb-1">CID: {rx.diagnosis_cid}</p>}
                          {meds.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {meds.map((med: any, i: number) => (
                                <div key={i} className="text-xs bg-muted/20 rounded-lg px-3 py-1.5 border border-border">
                                  <span className="font-bold text-foreground">{med.name || med.medication || "Medicamento"}</span>
                                  {med.dosage && <span className="text-muted-foreground ml-2">— {med.dosage}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {rx.instructions && <p className="text-xs text-muted-foreground mt-2 italic">{rx.instructions}</p>}
                          {rx.valid_until && <p className="text-[10px] text-muted-foreground mt-1">Válida até: {new Date(rx.valid_until).toLocaleDateString("pt-BR")}</p>}
                          
                          <div className="flex flex-col gap-2 mt-3">
                            <Anvisa1ClickButton 
                              patientData={{
                                name: profile?.full_name || "Paciente",
                                cpf: profile?.cpf || "000.000.000-00",
                                rg: profile?.rg || "00.000.000-0",
                                address: profile?.address || "Não informado",
                                email: profile?.email || "email@exemplo.com"
                              }}
                              prescriptionData={{
                                doctorName: "Dr(a). Especialista", 
                                doctorCrm: "CRM 00000", 
                                productName: meds[0]?.name || meds[0]?.medication || "Óleo CBD Premium", 
                                posology: meds[0]?.dosage || "Conforme prescrição", 
                                date: new Date(rx.created_at).toLocaleDateString("pt-BR")
                              }}
                              className="w-full text-xs"
                            />
                            {nearExpiry && (
                              <Button size="sm" variant="outline" className="w-full rounded-xl text-xs border-primary/30 text-primary hover:bg-primary/10" onClick={() => { setRenewTarget(rx); setRenewModalOpen(true); }}>
                                <RefreshCw size={12} className="mr-1" /> Solicitar Renovação
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "triages" && (
            <div className="space-y-4">
              <h2 className="font-display font-black text-foreground text-lg flex items-center gap-2">
                <ClipboardList size={18} className="text-secondary" /> Minhas Triagens (Brisa IA)
              </h2>
              {triages.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="p-8 text-center">
                    <ClipboardList size={32} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma triagem realizada.</p>
                    <p className="text-xs text-muted-foreground mt-1">Use a Brisa IA para fazer sua triagem antes de agendar.</p>
                    <Button size="sm" className="mt-4 rounded-xl bg-primary text-primary-foreground" asChild>
                      <a href={`https://wa.me/5511991363154?text=${encodeURIComponent("Olá Brisa, quero iniciar minha triagem.")}`} target="_blank" rel="noopener noreferrer">Iniciar Triagem</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {triages.map(t => (
                    <Card key={t.id} className="border-border hover:border-primary/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-sm text-foreground">Triagem #{t.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <div className="flex gap-1.5">
                            {t.urgency && (
                              <Badge className={`text-[10px] capitalize ${t.urgency === "alta" || t.urgency === "urgente" ? "bg-red-500/10 text-red-400 border-red-500/20" : t.urgency === "media" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-primary/10 text-primary border-green"}`}>
                                {t.urgency}
                              </Badge>
                            )}
                            <Badge className={`text-[10px] capitalize ${t.status === "completed" ? "bg-primary/10 text-primary border-green" : "bg-muted text-muted-foreground"}`}>{t.status}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-foreground mb-1"><strong>Sintomas:</strong> {t.symptoms}</p>
                        {t.specialty && <p className="text-xs text-muted-foreground">Especialidade: {t.specialty}</p>}
                        {t.category && <p className="text-xs text-muted-foreground">Categoria: {t.category}</p>}
                        {t.suggested_conditions && t.suggested_conditions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {t.suggested_conditions.map((c: string, i: number) => (
                              <span key={i} className="text-[10px] bg-muted/30 rounded-full px-2 py-0.5 border border-border text-muted-foreground">{c}</span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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

          {activeTab === "upgrade" && (
            <div className="max-w-3xl mx-auto">
              <PlanUpgradeCard currentPlan="essencial" />
            </div>
          )}
        </div>
      </section>

      {/* Comic Book Manual Banner */}
      <section className="pb-8">
        <div className="container mx-auto px-4">
          <Link to="/manual?tab=paciente" className="block w-full focus:outline-none">
            <div className="w-full comic-panel bg-yellow-300 hover:bg-yellow-400 p-6 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer transform hover:-rotate-1 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center text-yellow-300 shrink-0 border-2 border-foreground shadow-[2px_2px_0px_#000]">
                  <BookOpen size={32} />
                </div>
                <div>
                  <h3 className="font-black comic-font text-2xl text-foreground mb-1">COMO USAR A PLATAFORMA?</h3>
                  <p className="font-bold text-foreground/80">Leia nosso Guia Definitivo em Quadrinhos!</p>
                </div>
              </div>
              <Button asChild className="bg-foreground text-background font-black border-2 border-transparent hover:border-foreground hover:bg-transparent hover:text-foreground text-lg px-8 h-14 rounded-xl shadow-[4px_4px_0px_#000] pointer-events-none">
                <span>LER AGORA <ArrowRight className="ml-2" /></span>
              </Button>
            </div>
          </Link>
        </div>
      </section>

      {/* Wellness Subscription Plans */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <WellnessSubscriptionCards />
        </div>
      </section>

      <Footer />

      {/* Renewal Modal */}
      <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RefreshCw size={18} className="text-primary" /> Solicitar Renovação</DialogTitle>
            <DialogDescription>
              Deseja solicitar a renovação deste protocolo? Isso gerará uma nova triagem rápida para atualização do seu quadro clínico.
            </DialogDescription>
          </DialogHeader>
          {renewTarget && (
            <div className="bg-muted/20 rounded-xl p-3 border border-border text-xs">
              <p className="font-bold text-foreground">Prescrição #{renewTarget.id?.slice(0, 8)}</p>
              {renewTarget.diagnosis_cid && <p className="text-muted-foreground">CID: {renewTarget.diagnosis_cid}</p>}
              {renewTarget.valid_until && <p className="text-muted-foreground">Válida até: {new Date(renewTarget.valid_until).toLocaleDateString("pt-BR")}</p>}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setRenewModalOpen(false)}>Cancelar</Button>
            <Button className="rounded-xl bg-primary text-primary-foreground" onClick={handleRenewalRequest} disabled={renewLoading}>
              {renewLoading ? "Enviando..." : "Confirmar Renovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Notification Preview */}
      <Dialog open={!!whatsappPreview} onOpenChange={() => setWhatsappPreview(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageCircle size={18} className="text-primary" /> Simulação de Notificação WhatsApp</DialogTitle>
            <DialogDescription>Veja como o paciente receberia este aviso via WhatsApp:</DialogDescription>
          </DialogHeader>
          <div className="bg-[hsl(142,40%,95%)] rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Leaf size={14} className="text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Enf. Brisa - Planta y Raiz</p>
                <p className="text-[10px] text-muted-foreground">Agora</p>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{whatsappPreview}</p>
          </div>
          <DialogFooter>
            <Button className="rounded-xl bg-primary text-primary-foreground w-full" onClick={() => setWhatsappPreview(null)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPaciente;
