import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowLeft, Save, Upload, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { DoctorAvailabilityManager } from "@/components/doctor/DoctorAvailabilityManager";

export default function ConfiguracoesMedico() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [doctorData, setDoctorData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState("pending");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin-master");
        return;
      }

      const { data: doc } = await supabase
        .from("doctors")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (doc) {
        setDoctorData(doc);
        setCrm(doc.crm || "");
        setCrmState(doc.crm_state || "");
        setBio(doc.bio || "");
        setPrice(doc.consultation_price?.toString() || "");
        setKycStatus(doc.kyc_status || "pending");
      }
      
      if (prof) {
        setProfileData(prof);
        setFullName(prof.full_name || "");
        setAvatarUrl(prof.avatar_url || null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados do médico.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (profileData) {
        await supabase
          .from("profiles")
          .update({ full_name: fullName, avatar_url: avatarUrl })
          .eq("id", session.user.id);
      }

      if (doctorData) {
        await supabase
          .from("doctors")
          .update({
            crm,
            crm_state: crmState,
            bio,
            consultation_price: Number(price) || 0,
          })
          .eq("id", doctorData.id);
      } else {
         // Create mock fallback data to real db data for this user
         await supabase.from("doctors").insert({
            user_id: session.user.id,
            crm,
            crm_state: crmState,
            bio,
            consultation_price: Number(price) || 0,
            specialty: 'Médicos Prescritores',
            document_type: 'crm',
            country: 'BR'
         });
      }

      toast.success("Card atualizado com sucesso! As alterações já estão visíveis na plataforma.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const filename = `${session.user.id}-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filename, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filename);

      setAvatarUrl(publicUrl);
      toast.success("Foto atualizada!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload da imagem.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0A0F1C] flex flex-col font-sans selection:bg-primary/30">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard-medico')}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar ao Consultório
            </Button>
            <h1 className="text-3xl font-black text-white">Configuração do <span className="text-primary">Card Médico</span></h1>
          </div>

          {kycStatus !== 'approved' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="text-red-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-red-400 font-bold">Documentação Pendente ou em Análise</h3>
                <p className="text-red-300/80 text-sm mt-1 mb-3">
                  Seu cadastro ainda não possui todos os documentos KYC validados. Para atender pacientes na plataforma, providencie os documentos no painel ou aguarde a aprovação.
                </p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="icp_upload" className="text-white bg-red-500/20 px-3 py-2 rounded-lg border border-red-500/30 cursor-pointer hover:bg-red-500/30 transition-colors w-fit flex items-center gap-2">
                    <Upload size={16} />
                    Anexar Assinatura Digital (ICP-Brasil)
                    <input 
                      type="file" 
                      id="icp_upload" 
                      accept="image/*,.pdf" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !doctorData) return;
                        toast.info("Enviando assinatura digital...");
                        
                        try {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) throw new Error("Não autenticado");
                          
                          const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 5);
                          const path = `${user.id}/icp_brasil.${ext}`;
                          
                          const { error: uploadError } = await supabase.storage
                            .from("doctor-kyc-documents")
                            .upload(path, file, { upsert: true, contentType: file.type || undefined });
                          
                          if (uploadError) throw uploadError;
                          
                          const { error: kycError } = await supabase
                            .from("doctor_kyc_documents" as any)
                            .upsert({
                              doctor_user_id: user.id,
                              document_kind: "icp_brasil",
                              storage_path: path,
                              verification_status: "pending",
                            }, { onConflict: "doctor_user_id,document_kind" });
                            
                          if (kycError) throw kycError;
                          
                          toast.success("Assinatura anexada com sucesso!");
                        } catch (err: any) {
                          toast.error("Erro ao enviar: " + (err.message || "Tente novamente."));
                        }
                      }}
                    />
                  </Label>
                  <span className="text-xs text-red-300/60 ml-1">Faltando: Assinatura Digital (ICP-Brasil) para receituários.</span>
                </div>
              </div>
            </motion.div>
          )}

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
            <CardContent className="p-6 sm:p-8 space-y-8 mt-6">
              
              {/* Foto de Perfil */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-700/50">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-slate-700 overflow-hidden border-2 border-primary/50 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-slate-500" />
                    )}
                    
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Foto Profissional</h3>
                  <p className="text-slate-400 text-sm mb-4">Esta foto será exibida no seu card para os pacientes.</p>
                  <div>
                    <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                    <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md text-sm transition-colors">
                      <Upload size={16} />
                      {uploadingAvatar ? "Enviando..." : "Alterar Foto"}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nome Completo</Label>
                  <Input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white focus:border-primary"
                    placeholder="Ex: Dr. Edilson Bezerra"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Valor Base da Consulta (R$)</Label>
                  <Input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white focus:border-primary"
                    placeholder="Ex: 80"
                  />
                  <p className="text-[11px] text-slate-500">Este valor baseia os cálculos das modalidades de Retorno, Vídeo e Prescrição.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Número do CRM / Registro</Label>
                  <Input 
                    value={crm}
                    onChange={(e) => setCrm(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white focus:border-primary"
                    placeholder="Ex: 10963"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">UF / Estado do Registro</Label>
                  <Input 
                    value={crmState}
                    onChange={(e) => setCrmState(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white focus:border-primary"
                    placeholder="Ex: Sta-Cruz Bo ou SP"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Resumo da Atividade (Bio)</Label>
                <Textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white focus:border-primary min-h-[120px]"
                  placeholder="Descreva sua experiência, especialidade e o que os pacientes podem esperar do seu atendimento."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 flex-wrap">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/atualizar-documentos-medico')}
                  className="border-slate-700 text-slate-300 hover:text-white"
                >
                  <Upload className="mr-2 h-4 w-4" /> Atualizar dados de cadastro medico
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Salvar Configurações</>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Gerenciador de Disponibilidade / Abertura de Horários */}
          <DoctorAvailabilityManager />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}


