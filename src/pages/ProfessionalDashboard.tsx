import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DoctorPerformanceWidget } from "@/components/doctor/DoctorPerformanceWidget";
import { DoctorVIPSeal } from "@/components/doctor/DoctorVIPSeal";
import {
  Home, Calendar, Users, BookOpen, DollarSign, Settings, Video,
  MessageSquare, Bell, Clock, FileText, Pill, Activity, Star,
  TrendingUp, Shield, Zap, Menu, X, ChevronRight, Phone,
  Stethoscope, Brain, Send, Paperclip, Lock, Eye, EyeOff,
  LogOut, Wifi, WifiOff, AlertTriangle, CheckCircle2, Loader2,
  Search, Filter, MoreVertical, Mic, MicOff, VideoOff, Share2,
  Trophy
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { GamificationDashboard } from "@/components/GamificationDashboard";

// ─── Privacy Layer (LGPD) ────────────────────────────────────────────────
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 min

const usePrivacyLayer = () => {
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLocked(false);
    timerRef.current = setTimeout(() => setIsLocked(true), INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return { isLocked, unlock: resetTimer };
};

// ─── Sidebar Item ────────────────────────────────────────────────────────
const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: {
  icon: any; label: string; active?: boolean; onClick: () => void; badge?: number;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active
        ? "bg-primary/15 text-primary border border-primary/20"
        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
    }`}
  >
    <Icon size={18} />
    <span className="flex-1 text-left">{label}</span>
    {badge && badge > 0 && (
      <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
        {badge}
      </span>
    )}
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────
const ProfessionalDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isLocked, unlock } = usePrivacyLayer();

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeSection, setActiveSection] = useState("home");
  const [isOnline, setIsOnline] = useState(false);
  const [onlineTimer, setOnlineTimer] = useState(0);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState("basic");
  const [chatMessages, setChatMessages] = useState<{ id: string; text: string; from: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const timerRef2 = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch Doctor Data ────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const [docRes, profRes] = await Promise.all([
      supabase.from("doctors").select("*").eq("user_id", session.user.id).single(),
      supabase.from("profiles").select("*").eq("id", session.user.id).single(),
    ]);

    if (docRes.data) {
      setDoctorData(docRes.data);
      setIsOnline(docRes.data.is_online);

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

      const [apptRes, subRes, notiRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("doctor_id", docRes.data.id)
          .gte("scheduled_at", startOfDay).lte("scheduled_at", endOfDay)
          .order("scheduled_at", { ascending: true }),
        supabase.from("medical_subscriptions").select("plan_tier").eq("doctor_id", docRes.data.id)
          .eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("notifications").select("*").eq("user_id", session.user.id)
          .eq("is_read", false).order("created_at", { ascending: false }).limit(10),
      ]);

      setAppointments(apptRes.data || []);
      setCurrentTier(subRes.data?.plan_tier || "basic");
      setNotifications(notiRes.data || []);
    }

    setProfileData(profRes.data);
    setLoading(false);
  };

  // ── Online Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isOnline) {
      timerRef2.current = setInterval(() => setOnlineTimer(prev => prev + 1), 1000);
    } else {
      if (timerRef2.current) clearInterval(timerRef2.current);
    }
    return () => { if (timerRef2.current) clearInterval(timerRef2.current); };
  }, [isOnline]);

  const toggleOnline = async () => {
    if (!doctorData) return;
    const newStatus = !isOnline;
    await supabase.from("doctors").update({ is_online: newStatus }).eq("id", doctorData.id);
    setIsOnline(newStatus);
    if (!newStatus) setOnlineTimer(0);
    toast({
      title: newStatus ? "🟢 Você está Online" : "🔴 Você está Offline",
      description: newStatus ? "Pacientes podem agendar com você." : "Timer de horas pausado.",
    });
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      scheduled: { label: "Confirmada", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
      pending: { label: "Aguardando", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
      completed: { label: "Concluída", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
      cancelled: { label: "Cancelada", cls: "bg-destructive/15 text-destructive border-destructive/30" },
    };
    const s = map[status] || map.pending;
    return <Badge variant="outline" className={`${s.cls} text-[10px] font-bold`}>{s.label}</Badge>;
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: chatInput,
      from: "doctor",
      time: format(new Date(), "HH:mm"),
    }]);
    setChatInput("");
  };

  // ── Sidebar menu items ────────────────────────────────────────────────
  const menuItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "agenda", icon: Calendar, label: "Agenda" },
    { id: "patients", icon: Users, label: "Meus Pacientes" },
    { id: "teleconsulta", icon: Video, label: "Teleconsulta" },
    { id: "gamification", icon: Trophy, label: "Conquistas e Metas" },
    { id: "library", icon: BookOpen, label: "Biblioteca" },
    { id: "financial", icon: DollarSign, label: "Financeiro" },
    { id: "settings", icon: Settings, label: "Configurações" },
  ];

  // ── Privacy Lock Screen ──────────────────────────────────────────────
  if (isLocked) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-6 p-6">
        <Lock size={48} className="text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Tela Bloqueada (LGPD)</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Dados sensíveis foram ocultados após 5 minutos de inatividade.
        </p>
        <Button onClick={unlock} className="gap-2">
          <Eye size={16} /> Desbloquear
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── RENDER SECTIONS ──────────────────────────────────────────────────

  const renderHome = () => {
    const isKycExpiring = (() => {
      if (!doctorData?.kyc_valid_until) return false;
      const validUntil = new Date(doctorData.kyc_valid_until).getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      return validUntil - Date.now() <= thirtyDaysMs;
    })();

    return (
      <div className="space-y-6">
        {/* Banner de Revalidação KYC */}
        {isKycExpiring && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground">Revalidação Periódica de CRM / KYC Necessária</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sua validação de documentos vence em{" "}
                <strong>
                  {doctorData.kyc_valid_until
                    ? format(new Date(doctorData.kyc_valid_until), "dd/MM/yyyy")
                    : "breve"}
                </strong>
                . Por favor, reenvie a cópia do seu CRM atualizado para manter a verificação ativa.
              </p>
              <Button size="sm" variant="outline" className="mt-2 text-xs font-bold border-amber-500/30 text-amber-400 hover:bg-amber-500/10" asChild>
                <Link to="/cadastro-profissional">Reenviar Documentos CRM</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Orientações Técnicas Hoje", value: appointments.length, color: "text-blue-400" },
          { icon: Clock, label: "Horas Online", value: formatTimer(onlineTimer), color: "text-emerald-400" },
          { icon: Star, label: "Avaliação", value: doctorData?.rating?.toFixed(1) || "5.0", color: "text-amber-400" },
          { icon: Bell, label: "Notificações", value: notifications.length, color: "text-red-400" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-border bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
                <p className="text-lg font-black text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card className="border-border bg-card/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Agenda do Dia
            </h3>
            <Badge variant="outline" className="text-[10px]">{format(new Date(), "dd/MM/yyyy")}</Badge>
          </div>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma consulta agendada para hoje.</p>
          ) : (
            <div className="space-y-2">
              {appointments.slice(0, 5).map((appt) => (
                <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => { setSelectedPatient(appt); setActiveSection("teleconsulta"); }}>
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <Stethoscope size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">Paciente #{appt.patient_id?.slice(0, 8)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(appt.scheduled_at), "HH:mm", { locale: ptBR })} · {appt.duration_minutes || 30}min · {appt.type}
                    </p>
                  </div>
                  {getStatusBadge(appt.status)}
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Widget */}
      {doctorData && <DoctorPerformanceWidget doctorId={doctorData.id} />}

      {/* Brisa AI Shortcut */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Brain size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-sm">IA Brisa — Assistente Clínica</h4>
              <p className="text-[11px] text-muted-foreground">Solicite resumos de histórico do paciente antes da consulta</p>
            </div>
            <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 text-xs">
              <Zap size={12} className="mr-1" /> Ativar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  };

  const renderAgenda = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-foreground">Central de Agendamentos</h2>
        <Button size="sm" variant="outline" className="text-xs gap-1">
          <Filter size={12} /> Filtrar
        </Button>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="w-full bg-muted/30">
          <TabsTrigger value="today" className="flex-1 text-xs">Hoje</TabsTrigger>
          <TabsTrigger value="week" className="flex-1 text-xs">Semana</TabsTrigger>
          <TabsTrigger value="queue" className="flex-1 text-xs">Fila Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-2 mt-3">
          {appointments.map((appt) => (
            <motion.div key={appt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    {format(new Date(appt.scheduled_at), "HH:mm")}
                  </span>
                </div>
                {getStatusBadge(appt.status)}
              </div>
              <p className="text-xs text-muted-foreground mb-2">Paciente: #{appt.patient_id?.slice(0, 8)} · {appt.type} · {appt.duration_minutes}min</p>
              <div className="flex gap-2">
                <Button size="sm" className="text-[11px] h-7 gap-1" onClick={() => { setSelectedPatient(appt); setActiveSection("teleconsulta"); }}>
                  <Video size={12} /> Iniciar
                </Button>
                <Button size="sm" variant="outline" className="text-[11px] h-7 gap-1">
                  <MessageSquare size={12} /> Chat
                </Button>
              </div>
            </motion.div>
          ))}
          {appointments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma consulta para hoje</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="week" className="mt-3">
          <div className="text-center py-12 text-muted-foreground">
            <Calendar size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Visualização semanal em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-3">
          {/* Real-time Chat Queue */}
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                <MessageSquare size={14} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">Novo paciente na fila</p>
                <p className="text-[10px] text-muted-foreground">Aguardando atendimento via chat</p>
              </div>
              <Button size="sm" className="text-[10px] h-6 bg-amber-500 hover:bg-amber-600">Atender</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderTeleconsulta = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <Video size={18} className="text-primary" /> Sala de Teleconsulta
        </h2>
        {showVideo && (
          <Button size="sm" variant="destructive" className="text-xs gap-1" onClick={() => setShowVideo(false)}>
            <Phone size={12} /> Encerrar
          </Button>
        )}
      </div>

      {!showVideo ? (
        <Card className="border-border bg-card/60">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Video size={32} className="text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Iniciar Teleconsulta</h3>
            <p className="text-sm text-muted-foreground mb-4">Selecione uma consulta na agenda ou inicie uma sala livre.</p>
            <Button className="gap-2" onClick={() => setShowVideo(true)}>
              <Video size={16} /> Abrir Sala Jitsi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-4`}>
          {/* Video Window - 2 cols */}
          <div className={isMobile ? "" : "col-span-2"}>
            <Card className="border-border bg-card overflow-hidden">
              <div className="aspect-video bg-black/90 flex items-center justify-center relative">
                <div className="text-center text-white/60">
                  <Video size={48} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Sala Jitsi — Orientação Técnica em andamento</p>
                  <p className="text-xs mt-1 text-white/40">
                    {selectedPatient ? `Paciente #${selectedPatient.patient_id?.slice(0, 8)}` : "Sala Livre"}
                  </p>
                </div>
                {/* Video Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button size="icon" variant="outline" className="rounded-full h-10 w-10 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Mic size={16} />
                  </Button>
                  <Button size="icon" variant="outline" className="rounded-full h-10 w-10 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <VideoOff size={16} />
                  </Button>
                  <Button size="icon" variant="outline" className="rounded-full h-10 w-10 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Share2 size={16} />
                  </Button>
                  <Button size="icon" variant="destructive" className="rounded-full h-10 w-10" onClick={() => setShowVideo(false)}>
                    <Phone size={16} />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Chat during call */}
            <Card className="border-border bg-card mt-3">
              <CardContent className="p-3">
                <ScrollArea className="h-32 mb-2">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Chat da consulta</p>
                  ) : (
                    <div className="space-y-2">
                      {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.from === "doctor" ? "justify-end" : "justify-start"}`}>
                          <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[80%] ${
                            msg.from === "doctor" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}>
                            {msg.text}
                            <span className="text-[9px] opacity-60 ml-2">{msg.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                    <Paperclip size={14} />
                  </Button>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder="Mensagem..."
                    className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                  <Button size="icon" className="h-8 w-8 shrink-0" onClick={sendChat}>
                    <Send size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel — Prontuário + Prescrição */}
          <div className="space-y-3">
            <Card className="border-border bg-card">
              <CardContent className="p-3">
                <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1">
                  <FileText size={12} className="text-primary" /> Prontuário
                </h4>
                <div className="space-y-2 text-[11px] text-muted-foreground">
                  <div className="p-2 rounded-lg bg-muted/20 border border-border">
                    <p className="font-medium text-foreground">Queixa principal</p>
                    <p>Dor crônica — Lombar</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 border border-border">
                    <p className="font-medium text-foreground">Histórico</p>
                    <p>Fibromialgia · Insônia · Ansiedade</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 border border-border">
                    <p className="font-medium text-foreground">Última prescrição</p>
                    <p>CBD 20mg/mL — Sublingual 2x/dia</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-card">
              <CardContent className="p-3">
                <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1">
                  <Pill size={12} className="text-emerald-400" /> Prescritor Inteligente
                </h4>
                <textarea
                  placeholder="Digite a prescrição ou clique em Gerar com IA..."
                  className="w-full bg-muted/20 border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none h-20"
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="text-[10px] h-7 flex-1 gap-1">
                    <Zap size={10} /> Gerar com IA
                  </Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-7 flex-1 gap-1">
                    <FileText size={10} /> Assinar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Brisa Summary */}
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} className="text-emerald-400" />
                  <h4 className="text-xs font-bold text-foreground">Resumo Brisa IA</h4>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Clique para solicitar à Brisa um resumo clínico completo do paciente antes de iniciar.
                </p>
                <Button size="sm" variant="outline" className="text-[10px] h-6 mt-2 w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                  Solicitar Resumo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-foreground">Meus Pacientes</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Buscar..." className="bg-muted/30 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-40" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {["Ana Costa", "Bruno Souza", "Carla Mendes", "Daniel Oliveira", "Eduarda Lima"].map((name, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{name}</p>
              <p className="text-[10px] text-muted-foreground">Última consulta: {format(new Date(Date.now() - i * 86400000 * 3), "dd/MM/yyyy")}</p>
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-[10px]">
              <FileText size={12} className="mr-1" /> Prontuário
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFinancial = () => {
    const completedApps = appointments.filter(a => a.status === "completed" || a.payment_status === "paid");
    const totalBilled = completedApps.reduce((acc, a) => acc + (Number(a.amount_brl || a.amount) || 150), 0);
    const pendingApps = appointments.filter(a => a.payment_status === "pending" || a.status === "scheduled");
    const totalPending = pendingApps.reduce((acc, a) => acc + (Number(a.amount_brl || a.amount) || 150), 0);

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <DollarSign size={18} className="text-primary" /> Painel Financeiro do Médico
        </h2>

        {/* Tier + Seal */}
        <div className="flex items-center gap-3">
          <DoctorVIPSeal tier={currentTier} />
          <span className="text-xs text-muted-foreground">Plano Ativo</span>
        </div>

        {/* Real Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-border bg-card/60">
            <CardContent className="p-4 text-center">
              <DollarSign size={18} className="text-emerald-400 mx-auto mb-1" />
              <p className="text-xl font-black text-emerald-400">R$ {totalBilled.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Faturado</p>
              <p className="text-[10px] text-muted-foreground">{completedApps.length} consultas concluídas</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 text-center">
              <Clock size={18} className="text-amber-400 mx-auto mb-1" />
              <p className="text-xl font-black text-amber-400">R$ {totalPending.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Pendente a Receber</p>
              <p className="text-[10px] text-muted-foreground">{pendingApps.length} agendadas/pendentes</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 text-center">
              <TrendingUp size={18} className="text-primary mx-auto mb-1" />
              <p className="text-xl font-black text-foreground">{appointments.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Consultas</p>
              <p className="text-[10px] text-muted-foreground">Período selecionado</p>
            </CardContent>
          </Card>
        </div>

        {doctorData && <DoctorPerformanceWidget doctorId={doctorData.id} />}

        <Link to="/distribuicao-renda">
          <Button variant="outline" className="w-full text-xs gap-2 mt-2">
            <Activity size={14} /> Ver Distribuição de Renda Detalhada
          </Button>
        </Link>
      </div>
    );
  };

  const renderLibrary = () => (
    <div className="text-center py-12 space-y-4">
      <BookOpen size={48} className="mx-auto text-muted-foreground/30" />
      <h3 className="font-bold text-foreground">Biblioteca Científica</h3>
      <p className="text-sm text-muted-foreground">Acesse artigos, protocolos e e-books sobre Cannabis Medicinal.</p>
      <Link to="/biblioteca">
        <Button className="gap-2"><BookOpen size={14} /> Acessar Biblioteca</Button>
      </Link>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-foreground">Configurações</h2>
      <div className="space-y-3">
        {[
          { icon: Users, label: "Editar Perfil", desc: "Nome, CRM, bio e especialidade" },
          { icon: Bell, label: "Notificações", desc: "Alertas sonoros e visuais" },
          { icon: Shield, label: "Privacidade LGPD", desc: "Timer de bloqueio, dados sensíveis" },
          { icon: DollarSign, label: "Plano e Assinatura", desc: "Upgrade para Premium/Enterprise" },
          { icon: LogOut, label: "Sair", desc: "Encerrar sessão" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-all cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center">
              <item.icon size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderGamification = () => {
    if (!doctorData) return <p className="text-muted-foreground text-sm">Carregando dados do profissional...</p>;
    return <GamificationDashboard professionalId={doctorData.user_id} doctorId={doctorData.id} />;
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home": return renderHome();
      case "agenda": return renderAgenda();
      case "patients": return renderPatients();
      case "teleconsulta": return renderTeleconsulta();
      case "gamification": return renderGamification();
      case "library": return renderLibrary();
      case "financial": return renderFinancial();
      case "settings": return renderSettings();
      default: return renderHome();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <motion.aside
            initial={isMobile ? { x: -280 } : false}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className={`${isMobile ? "fixed inset-y-0 left-0 z-50" : "relative"} w-[240px] bg-card border-r border-border flex flex-col shrink-0`}
          >
            {/* Doctor Profile */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                  {profileData?.full_name?.[0] || "D"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{profileData?.full_name || "Dr. Profissional"}</p>
                  <p className="text-[10px] text-muted-foreground">{doctorData?.specialty || "Cannabis Medicinal"}</p>
                </div>
                {isMobile && (
                  <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground">
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <DoctorVIPSeal tier={currentTier} />
                {doctorData?.is_verified && (
                  <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 size={8} className="mr-0.5" /> Verificado
                  </Badge>
                )}
              </div>
            </div>

            {/* Menu */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-1">
                {menuItems.map(item => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activeSection === item.id}
                    onClick={() => { setActiveSection(item.id); if (isMobile) setSidebarOpen(false); }}
                    badge={item.id === "agenda" ? appointments.length : undefined}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Online hours tracker */}
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock size={12} />
                <span>Tempo Online: <span className="text-primary font-bold">{formatTimer(onlineTimer)}</span></span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 sticky top-0 z-30">
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground">
              <Menu size={20} />
            </button>
          )}

          {/* VIP Seal in Header */}
          {!isMobile && <DoctorVIPSeal tier={currentTier} size="lg" />}

          <div className="flex-1" />

          {/* Earnings Quick Display */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
            <DollarSign size={14} className="text-primary" />
            <div>
              <p className="text-[9px] text-muted-foreground leading-none">Pool 10%</p>
              <p className="text-xs font-black text-primary">Ativo</p>
            </div>
          </div>

          {/* Online Toggle */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"}`} />
            <span className="text-xs font-medium text-foreground">{isOnline ? "Online" : "Offline"}</span>
            <Switch checked={isOnline} onCheckedChange={toggleOnline} className="scale-75" />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <Bell size={18} className="text-muted-foreground" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
        </header>

        {/* Page Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
