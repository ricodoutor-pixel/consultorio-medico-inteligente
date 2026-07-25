import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MedicalDashboard } from "@/components/MedicalDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoctorProfileSettings } from "@/components/doctor/DoctorProfileSettings";
import { DoctorTeamDashboard } from "@/components/doctor/DoctorTeamDashboard";
import { DoctorEducationDashboard } from "@/components/doctor/DoctorEducationDashboard";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Consultorio = () => {
  const [doctor, setDoctor] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
        setIsOnline(doctorData.is_online || false);
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

  const toggleOnlineStatus = async () => {
    if (!doctor) return;
    try {
      setUpdatingStatus(true);
      const newStatus = !isOnline;
      const { error } = await supabase
        .from('doctors')
        .update({ is_online: newStatus })
        .eq('id', doctor.id);
      
      if (error) throw error;
      setIsOnline(newStatus);
    } catch (error) {
      console.error("Error toggling status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {doctor && doctor.is_approved && (
        <div className="px-4 py-3 bg-card border-b flex justify-end items-center gap-3">
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
      )}

      {doctor && doctor.is_approved === false && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="container mx-auto flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-500">Cadastro em Análise</h4>
              <p className="text-sm text-amber-500/80 mt-1">
                ⚡ Seu cadastro está em análise pela nossa Diretoria Técnica. O prazo de aprovação e publicação do seu Card na plataforma é de até 12 horas. Enquanto isso, aproveite para explorar seu Consultório Virtual e preencher seus dados de perfil!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 container mx-auto py-6">
        <Tabs defaultValue="atendimentos" className="w-full">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
            <TabsTrigger value="perfil">Perfil e KYC</TabsTrigger>
            <TabsTrigger value="time">Meu Time</TabsTrigger>
            <TabsTrigger value="educacao">Educação Continuada</TabsTrigger>
          </TabsList>
          
          <TabsContent value="atendimentos" className="mt-0 border-0 p-0">
            <MedicalDashboard />
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
