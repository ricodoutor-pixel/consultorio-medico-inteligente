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
import { AlertTriangle, Loader2, MessageCircle, Gift, Video, Sparkles, Trophy, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Consultorio = () => {
  const [doctor, setDoctor] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("atendimentos");

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

  useEffect(() => {
    fetchData();
  }, []);

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
    if (!doctor) return;
    try {
      setUpdatingStatus(true);
      const newStatus = !isOnline;
      const { data, error } = await supabase
        .from('doctors')
        .update({ is_online: newStatus, is_available: newStatus })
        .eq('id', doctor.id)
        .select('id, is_online, is_available');

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Não foi possível alterar o status (permissão negada).");
        return;
      }
      setIsOnline(Boolean(data[0].is_online));
      setDoctor((prev: any) => prev ? { ...prev, ...data[0] } : prev);
      toast.success(newStatus ? "Você está ONLINE — visível na página Profissionais." : "Você está OFFLINE no card de Profissionais.");
    } catch (error: any) {
      console.error("Error toggling status:", error);
      toast.error(error?.message || "Erro ao atualizar status.");
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
              onClick={() => setActiveTab("paciente-teste")}
              className="px-4 py-1.5 rounded-full text-sm font-extrabold flex items-center gap-2 transition-all shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 text-black hover:scale-105"
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
              <Link to={`/orientacao-video?appointment=${nextAppointment.id}`} className="px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm bg-blue-600 text-white hover:bg-blue-700">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto gap-1.5 p-1 bg-card border">
            <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
            <TabsTrigger value="paciente-teste" className="bg-emerald-500/10 text-emerald-400 font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
              🎭 Paciente Teste (Simulação 360°)
            </TabsTrigger>
            <TabsTrigger value="ranking-plantacoin" className="bg-amber-500/10 text-amber-400 font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              🏆 Ranking & PlantaCoins
            </TabsTrigger>
            <TabsTrigger value="fila-assincrona">Fila Assíncrona</TabsTrigger>
            <TabsTrigger value="perfil">Perfil e KYC</TabsTrigger>
            <TabsTrigger value="time">Meu Time</TabsTrigger>
            <TabsTrigger value="educacao">Educação Continuada</TabsTrigger>
          </TabsList>
          
          <TabsContent value="atendimentos" className="mt-0 border-0 p-0">
            <MedicalDashboard />
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
