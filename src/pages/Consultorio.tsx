import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MedicalDashboard } from "@/components/MedicalDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoctorProfileSettings } from "@/components/doctor/DoctorProfileSettings";
import { DoctorTeamDashboard } from "@/components/doctor/DoctorTeamDashboard";
import { DoctorEducationDashboard } from "@/components/doctor/DoctorEducationDashboard";
import { FilaAssincrona } from "@/components/doctor/FilaAssincrona";
import { PacienteTesteSimulacao360 } from "@/components/doctor/PacienteTesteSimulacao360";
import { DoctorRankingPlantaCoin } from "@/components/doctor/DoctorRankingPlantaCoin";
import { CopilotoClinicoVIP } from "@/components/doctor/CopilotoClinicoVIP";
import { PendingDocsNotice } from "@/components/doctor/PendingDocsNotice";
import { testProfessionals } from "@/data/professionals";

import { AlertTriangle, ArrowLeft, Loader2, MessageCircle, Gift, Video, Sparkles, Trophy, UserCheck, Bot, Bell, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Consultorio = () => {
  const [doctor, setDoctor] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("atendimentos");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData && doctorData) {
        const mockMatch = testProfessionals.find(p => {
          const realCrmNum = doctorData.crm ? doctorData.crm.replace(/\D/g, '') : '';
          const mockCrmNum = p.crm ? p.crm.replace(/\D/g, '') : '';
          const matchCrm = !!(realCrmNum && mockCrmNum && mockCrmNum.includes(realCrmNum));
          const matchName = p.name && profileData.full_name && p.name.toLowerCase().includes(profileData.full_name.toLowerCase());
          return matchCrm || matchName;
        });
        if (mockMatch?.imageUrl && !profileData.avatar_url) {
          profileData.avatar_url = mockMatch.imageUrl;
        } else if (mockMatch?.imageUrl && profileData.avatar_url && !profileData.avatar_url.includes('supabase')) {
          profileData.avatar_url = mockMatch.imageUrl;
        }
      }

      setProfile(profileData);
      setDoctor(doctorData);
      if (doctorData) {
        setIsOnline(Boolean(doctorData.is_online && (doctorData.is_available ?? true)));
        
        const { data: nextAppt } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', doctorData.id)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        setNextAppointment(nextAppt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load Admin notifications for this doctor
  const loadNotifications = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('admin_doctor_notifications') || '[]');
      setNotifications(stored);
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('admin_doctor_notifications', JSON.stringify(updated));
    toast.success("Notificações marcadas como lidas.");
  };

  useEffect(() => {
    if (!doctor?.id) return;

    const syncFromDb = async () => {
      const { data } = await supabase
        .from('doctors')
        .select('is_online, is_available')
        .eq('id', doctor.id)
        .maybeSingle();
      if (data) {
        setIsOnline(Boolean(data.is_online && (data.is_available ?? true)));
      }
    };

    syncFromDb();
    const poll = setInterval(syncFromDb, 20_000);
    const onVisible = () => { if (document.visibilityState === 'visible') syncFromDb(); };
    document.addEventListener('visibilitychange', onVisible);

    const channel = supabase
      .channel(`doctor:${doctor.user_id}:online-status`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'doctors', filter: `id=eq.${doctor.id}` },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;
          setIsOnline(Boolean(row.is_online && (row.is_available ?? true)));
          setDoctor((prev: any) => (prev ? { ...prev, ...row } : prev));
        }
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [doctor?.id, doctor?.user_id]);

  const toggleOnlineStatus = async () => {
    try {
      setUpdatingStatus(true);
      const newStatus = !isOnline;

      // Update local state & localStorage for immediate UI sync
      setIsOnline(newStatus);
      if (doctor?.id) {
        localStorage.setItem(`doctor_online_status_${doctor.id}`, String(newStatus));
      }
      localStorage.setItem('doctor_online_status_med-3', String(newStatus));
      localStorage.setItem('doctor_online_status_med-joao-pedro', String(newStatus));

      // Attempt Supabase update
      if (doctor?.id) {
        const { error: dbError } = await supabase
          .from('doctors')
          .update({ is_online: newStatus, is_available: newStatus })
          .eq('id', doctor.id);
        if (dbError) console.warn("[online status db update]", dbError);
      }

      toast.success(newStatus ? "🟢 Você está ONLINE — Card Ativo na página Profissionais." : "🔴 Você está OFFLINE no card de Profissionais.");
    } catch (error: any) {
      console.error("Error toggling status:", error);
      setIsOnline(!isOnline);
      toast.success("Status atualizado!");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      {doctor && (
        <div className="px-4 py-3 bg-card border-b flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.history.back()}
              className="px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-bold text-xs flex items-center gap-1 transition-colors"
              title="Voltar à página anterior"
            >
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Voltar</span>
            </button>

            <button 
              onClick={() => setActiveTab("paciente-teste")}
              className="px-4 py-1.5 rounded-full text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 text-black hover:scale-105"
            >
              <Sparkles size={16} /> 🎭 Ativar Paciente Teste
            </button>

            <button 
              onClick={() => {
                const lastName = (profile?.full_name || '').split(' ').slice(-1)[0] || 'MEDICO';
                const refCode = doctor.crm ? `DR_${lastName}_CRM${doctor.crm}`.toUpperCase() : doctor.id;
                navigator.clipboard.writeText(`https://plantayraiz.com.br/cadastro-profissional?ref=${refCode}`);
                toast.success("Link copiado! Envie para seus convidados.");
              }}
              className="px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors shadow-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90"
            >
              <Gift size={15} /> Link Médico Sócio
            </button>
          </div>

          <div className="flex items-center gap-3">
            {nextAppointment ? (
              <Link to={`/workspace-medico?patient=${nextAppointment.patient_id}&appt=${nextAppointment.id}`} className="px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm bg-blue-600 text-white hover:bg-blue-700">
                <Video size={16} /> Iniciar Vídeo
              </Link>
            ) : (
              <button 
                disabled 
                title="Não há consultas futuras agendadas no momento"
                className="px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm bg-gray-400 text-white cursor-not-allowed"
              >
                <Video size={16} /> Iniciar Vídeo
              </button>
            )}
            <Link to="/telemed-whatsapp" className="px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm bg-[#00a884] text-white hover:bg-[#008f6f]">
              <MessageCircle size={16} /> Telemed WhatsApp
            </Link>
            {/* 🔔 Sino de Notificações do Admin */}
            <button
              onClick={() => setShowNotificationsModal(true)}
              className={`p-2 rounded-full relative transition-all shadow-sm ${
                unreadCount > 0 
                  ? "bg-rose-500 text-white animate-bounce ring-2 ring-rose-400" 
                  : "bg-muted/70 hover:bg-muted text-foreground"
              }`}
              title="Notificações & Recados da Administração"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-rose-600 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-rose-500">
                  {unreadCount}
                </span>
              )}
            </button>

            <span className="text-sm font-medium">Status do Plantão:</span>
            <button
              onClick={toggleOnlineStatus}
              disabled={updatingStatus}
              className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm ${
                isOnline 
                  ? "bg-green-500 text-white hover:bg-green-600" 
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-white animate-pulse" : "bg-white/70"}`} />
              {isOnline ? "ONLINE (Atendendo)" : "OFFLINE (Ausente)"}
            </button>
          </div>
        </div>
      )}

      {/* 🔔 MODAL DE RECADOS DA ADMINISTRAÇÃO */}
      <Dialog open={showNotificationsModal} onOpenChange={setShowNotificationsModal}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground">
              <Bell className="text-rose-400" size={20} /> Recados & Notificações da Administração
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mensagens diretas enviadas pela equipe de auditoria da Planta y Raíz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Nenhum recado ou pendência no momento. Seu cadastro está regular!
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  className={`p-3 rounded-xl border transition-all ${
                    n.type === 'urgent' 
                      ? 'bg-rose-950/20 border-rose-500/40 text-foreground' 
                      : 'bg-muted/30 border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant={n.type === 'urgent' ? 'destructive' : 'secondary'} className="text-[10px] font-bold">
                      {n.type === 'urgent' ? '🔴 ATENÇÃO - URGENTE' : '🟢 INFORMATIVO'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{n.date}</span>
                  </div>
                  <p className="text-xs font-bold text-foreground mt-1">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="pt-2 border-t flex justify-end">
              <Button size="sm" onClick={markAllAsRead} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                <CheckCircle2 size={14} className="mr-1.5" /> Marcar como Lido
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {doctor && !doctor.is_verified && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="container mx-auto flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-500">Cadastro em Análise</h4>
              <p className="text-sm text-amber-500/80 mt-1">
                ⚡ Seu cadastro está em análise pela nossa Diretoria Técnica. O prazo de aprovação e publicação do seu Card na plataforma é de até 12 horas. Enquanto isso, aproveite para explorar seu Consultório Virtual e praticar atendimentos com o Paciente Teste IA!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 container mx-auto py-6">
        {doctor && profile && (
          <div className="mb-5">
            <PendingDocsNotice userId={doctor.user_id} profile={profile} doctorName={profile.full_name} />
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="mb-6 w-full flex flex-nowrap overflow-x-auto h-auto p-1.5 bg-card/90 backdrop-blur-md border border-border/60 rounded-xl gap-2 whitespace-nowrap scrollbar-none">
            <TabsTrigger value="atendimentos" className="shrink-0 whitespace-nowrap px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all">Atendimentos</TabsTrigger>
            <TabsTrigger value="copiloto-vip" className="shrink-0 whitespace-nowrap px-4 py-2 text-xs md:text-sm font-extrabold rounded-lg transition-all bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-black border border-emerald-500/30">
              🧠 Copiloto IA (Decisão Clínica)
            </TabsTrigger>
            <TabsTrigger value="paciente-teste" className="shrink-0 whitespace-nowrap px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all bg-emerald-500/10 text-emerald-400 data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
              🎭 Paciente Teste (Simulação 360°)
            </TabsTrigger>
            <TabsTrigger value="ranking-plantacoin" className="shrink-0 whitespace-nowrap px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all bg-amber-500/10 text-amber-400 data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              🏆 Ranking & PlantaCoins
            </TabsTrigger>
            <TabsTrigger value="fila-assincrona" className="shrink-0 whitespace-nowrap px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all">Fila Assíncrona</TabsTrigger>
            <TabsTrigger value="perfil" className="shrink-0 whitespace-nowrap px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all">Perfil e KYC</TabsTrigger>
            <TabsTrigger value="time" className="shrink-0 whitespace-nowrap px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all">Meu Time</TabsTrigger>
            <TabsTrigger value="educacao" className="shrink-0 whitespace-nowrap px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all">Educação Continuada</TabsTrigger>
          </TabsList>
          
          <TabsContent value="atendimentos" className="mt-0 border-0 p-0">
            <MedicalDashboard />
          </TabsContent>

          <TabsContent value="copiloto-vip" className="mt-0 border-0 p-0">
            <CopilotoClinicoVIP />
          </TabsContent>

          <TabsContent value="paciente-teste" className="mt-0 border-0 p-0">
            <PacienteTesteSimulacao360 />
          </TabsContent>

          <TabsContent value="ranking-plantacoin" className="mt-0 border-0 p-0">
            <DoctorRankingPlantaCoin />
          </TabsContent>

          <TabsContent value="fila-assincrona" className="mt-0 border-0 p-0">
            <FilaAssincrona currentTier={doctor?.plan_tier} />
          </TabsContent>
          
          <TabsContent value="perfil" className="mt-0">
            {doctor && profile ? (
              <DoctorProfileSettings 
                doctor={doctor} 
                profile={profile} 
                onUpdate={fetchData} 
              />
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                Perfil médico não encontrado.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="time" className="mt-0">
            {doctor && profile ? (
              <DoctorTeamDashboard doctor={doctor} profile={profile} />
            ) : (
              <div className="p-10 text-center border rounded-xl bg-card">
                <p className="text-muted-foreground mt-2">Carregando dados do time...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="educacao" className="mt-0">
            <DoctorEducationDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Consultorio;
