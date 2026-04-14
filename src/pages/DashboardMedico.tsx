import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { DollarSign, Users, FileText, Star, TrendingUp, Clock, Video, Calendar, Stethoscope, Bell, CheckCircle2, Pill, Activity, MessageSquare, AlertTriangle, Leaf, Watch, Shield, FileBarChart, Brain, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { DoctorPerformanceWidget } from "@/components/doctor/DoctorPerformanceWidget";
import { DoctorSubscriptionPlans } from "@/components/doctor/DoctorSubscriptionPlans";
import { DoctorFinancialCards } from "@/components/doctor/DoctorFinancialCards";
import { DoctorBICockpit } from "@/components/doctor/DoctorBICockpit";
import { DominationMonitor } from "@/components/doctor/DominationMonitor";
import { DoctorVIPSeal } from "@/components/doctor/DoctorVIPSeal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const tooltipStyle = { background: "hsl(240 15% 7%)", border: "1px solid hsl(240 10% 14%)", borderRadius: "14px", color: "hsl(240 10% 93%)" };

const DashboardMedico = () => {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [currentTier, setCurrentTier] = useState("basic");
  const [simulatedTier, setSimulatedTier] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [selectedPatientTriage, setSelectedPatientTriage] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data: doctor } = await supabase.from("doctors").select("*").eq("user_id", session.user.id).single();
    
    if (doctor) {
      setDoctorData(doctor);
      setIsOnline(doctor.is_online);

      const [apptRes, rxRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("doctor_id", doctor.id).order("scheduled_at", { ascending: true }).limit(20),
        supabase.from("prescriptions").select("*").eq("doctor_id", doctor.id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (apptRes.data) setAppointments(apptRes.data);
      if (rxRes.data) setPrescriptions(rxRes.data);

      // Fetch subscription tier
      const { data: sub } = await supabase
        .from("medical_subscriptions")
        .select("plan_tier")
        .eq("doctor_id", doctor.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub?.plan_tier) setCurrentTier(sub.plan_tier);
    }
    setLoading(false);
  };

  const toggleOnline = async (val: boolean) => {
    setIsOnline(val);
    if (doctorData) {
      await supabase.from("doctors").update({ is_online: val }).eq("id", doctorData.id);
      toast({ title: val ? "Você está Online ✅" : "Você está Offline" });
    }
  };

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.scheduled_at);
    const today = new Date();
    return d.toDateString() === today.toDateString() && a.status !== "cancelled";
  });

  const completedAppts = appointments.filter(a => a.status === "completed");
  const totalEarnings = completedAppts.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  // Mock chart data
  const earningsData = [
    { month: "Jan", valor: 2400 }, { month: "Fev", valor: 3200 }, { month: "Mar", valor: 4100 },
    { month: "Abr", valor: 3800 }, { month: "Mai", valor: totalEarnings || 5200 }, { month: "Jun", valor: 6100 },
  ];
  const consultsByDay = [
    { dia: "Seg", total: 5 }, { dia: "Ter", total: 8 }, { dia: "Qua", total: 6 },
    { dia: "Qui", total: 9 }, { dia: "Sex", total: 7 }, { dia: "Sab", total: 3 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
                  Dashboard <span className="text-gradient-green">Médico</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-muted-foreground font-medium">
                    {doctorData ? `CRM ${doctorData.crm}/${doctorData.crm_state} • ${doctorData.specialty}` : "Configure seu perfil médico"}
                  </p>
                  <DoctorVIPSeal tier={currentTier} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-sm font-bold text-foreground">{isOnline ? "Online" : "Offline"}</span>
                <Switch checked={isOnline} onCheckedChange={toggleOnline} />
              </div>
            </div>

            {!doctorData && (
              <Card className="border-destructive/30 bg-destructive/5 mb-8">
                <CardContent className="p-6 flex items-center gap-4">
                  <AlertTriangle size={24} className="text-destructive" />
                  <div>
                    <p className="font-bold text-foreground">Perfil médico não encontrado</p>
                    <p className="text-xs text-muted-foreground">Complete seu cadastro profissional para acessar o dashboard completo.</p>
                  </div>
                  <Button className="rounded-xl ml-auto" asChild><Link to="/cadastro-profissional">Cadastrar</Link></Button>
                </CardContent>
              </Card>
            )}

            {/* Financial Cards - Revenue Distribution */}
            {doctorData && (
              <div className="mb-8">
                <DoctorFinancialCards doctorId={doctorData.id} currentTier={currentTier} />
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: DollarSign, label: "Ganhos Total", value: `R$ ${totalEarnings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, change: "+18%", color: "text-primary" },
                { icon: Users, label: "Consultas Hoje", value: String(todayAppts.length), change: "", color: "text-primary" },
                { icon: FileText, label: "Receitas Emitidas", value: String(prescriptions.length), change: "", color: "text-secondary" },
                { icon: Star, label: "Avaliação", value: `${doctorData?.rating || 5.0}★`, change: "", color: "text-[hsl(var(--gold))]" },
              ].map((kpi, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4">
                    <kpi.icon size={20} className={kpi.color} />
                    <p className="text-2xl font-display font-black text-foreground mt-2">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground font-bold">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Access — Cannabis & Clinical Tools */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Treatment Tracker", desc: "Pacientes em tratamento", icon: Activity, to: "/treatment-tracker", color: "text-primary" },
                { label: "Dispensário", desc: "Receitas & farmácia", icon: Leaf, to: "/dispensario", color: "text-secondary" },
                { label: "IoMT Hub", desc: "Wearables HL7 FHIR", icon: Watch, to: "/iomt", color: "text-blue-400" },
                { label: "Conformidade", desc: "LGPD/HIPAA/CFM", icon: Shield, to: "/compliance", color: "text-yellow-400" },
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

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
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
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="valor" stroke="hsl(152 80% 45%)" strokeWidth={3} dot={{ fill: "hsl(152 80% 45%)", r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Calendar size={18} /> Consultas por Dia
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={consultsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" />
                      <XAxis dataKey="dia" stroke="hsl(240 10% 68%)" fontSize={12} />
                      <YAxis stroke="hsl(240 10% 68%)" fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="total" fill="hsl(270 60% 60%)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Widget + Subscription Plans */}
            {doctorData && (
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <DoctorPerformanceWidget doctorId={doctorData.id} simulatedTier={simulatedTier} />
                <DoctorSubscriptionPlans doctorId={doctorData.id} currentTier={currentTier} onTierChange={setSimulatedTier} />
              </div>
            )}

            {/* BI Cockpit - Domination Strategy */}
            {doctorData && (
              <div className="mb-8">
                <DoctorBICockpit doctorId={doctorData.id} currentTier={currentTier} />
              </div>
            )}

            {/* Domination Monitor - BI Dashboard */}
            {doctorData && (
              <div className="mb-8">
                <DominationMonitor />
              </div>
            )}

            {/* Today's Schedule + Recent Prescriptions */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Clock size={18} /> Agenda de Hoje
                  </h3>
                  {todayAppts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma consulta agendada para hoje.</p>
                  ) : (
                    <div className="space-y-3">
                      {todayAppts.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              {a.type === "video" ? <Video size={16} className="text-primary" /> : a.type === "chat" ? <MessageSquare size={16} className="text-primary" /> : <Stethoscope size={16} className="text-primary" />}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">{a.type === "video" ? "Vídeo" : a.type === "chat" ? "Chat" : "Telefone"}</p>
                              <p className="text-xs text-muted-foreground">{a.notes?.slice(0, 40) || "Consulta agendada"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-black text-sm text-foreground">{format(new Date(a.scheduled_at), "HH:mm")}</p>
                            <Badge className={`text-[10px] ${a.status === "confirmed" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                              {a.status === "confirmed" ? "Confirmada" : a.status === "scheduled" ? "Agendada" : a.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Pill size={18} /> Receitas Recentes
                  </h3>
                  {prescriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma receita emitida ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions.slice(0, 5).map(rx => (
                        <div key={rx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                          <div>
                            <p className="font-bold text-sm text-foreground">
                              {Array.isArray(rx.medications) && rx.medications.length > 0 ? (rx.medications[0] as any)?.name || "Prescrição" : "Prescrição"}
                            </p>
                            <p className="text-xs text-muted-foreground">{rx.diagnosis_cid ? `CID: ${rx.diagnosis_cid}` : "Sem CID"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{format(new Date(rx.created_at), "dd/MM")}</p>
                            <Badge className={`text-[10px] ${rx.status === "signed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {rx.status === "signed" ? "Assinada" : rx.status === "draft" ? "Rascunho" : rx.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                    <p className="text-3xl font-display font-black text-gradient-green">
                      R$ {(totalEarnings * 0.9).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Próximo pagamento: dia 28</p>
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

export default DashboardMedico;
