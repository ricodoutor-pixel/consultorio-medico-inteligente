import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { DollarSign, Users, FileText, Star, TrendingUp, Clock, Video, Calendar, Stethoscope, Bell, CheckCircle2, Pill, Activity, MessageSquare, AlertTriangle, Leaf, Watch, Shield, FileBarChart, Brain, Flame, RefreshCw, ClipboardCheck, Loader2, Camera, UserCircle2, MessageCircle, Network, Settings, BookOpen, ArrowRight } from "lucide-react";
import { EvolutionChart } from "@/components/EvolutionChart";
import { motion } from "framer-motion";
import { DoctorPerformanceWidget } from "@/components/doctor/DoctorPerformanceWidget";
import { DoctorSubscriptionPlans } from "@/components/doctor/DoctorSubscriptionPlans";
import { DoctorFinancialCards } from "@/components/doctor/DoctorFinancialCards";
import { DoctorBICockpit } from "@/components/doctor/DoctorBICockpit";
import { DominationMonitor } from "@/components/doctor/DominationMonitor";
import { DoctorVIPSeal } from "@/components/doctor/DoctorVIPSeal";
import { VIPExpirationAlert } from "@/components/doctor/VIPExpirationAlert";
import { DoctorSchedule } from "@/components/doctor/DoctorSchedule";

import { DoctorAuxDiagnosticTools } from "@/components/doctor/DoctorAuxDiagnosticTools";
import { IoTBiometricTracker } from "@/components/IoTBiometricTracker";
import { FarmacogenomicaCard } from "@/components/FarmacogenomicaCard";
import { BlockchainRecordPublisher } from "@/components/BlockchainRecordPublisher";
import { Anvisa1ClickButton } from "@/components/Anvisa1ClickButton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const tooltipStyle = { background: "hsl(240 15% 7%)", border: "1px solid hsl(240 10% 14%)", borderRadius: "14px", color: "hsl(240 10% 93%)" };

const DashboardMedico = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [profileData, setProfileData] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [currentTier, setCurrentTier] = useState("basic");
  const [simulatedTier, setSimulatedTier] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [selectedPatientTriage, setSelectedPatientTriage] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Renewal center state
  const [renewalRequests, setRenewalRequests] = useState<any[]>([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [dosageNotes, setDosageNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    try {
      const [{ data: doctorRaw }, { data: profileRaw }] = await Promise.all([
        supabase.from("doctors").select("*").eq("user_id", session.user.id).single(),
        supabase.from("profiles").select("full_name, avatar_url").eq("id", session.user.id).maybeSingle(),
      ]);

      let doctor = doctorRaw;
      let profile = profileRaw;

      // Mock para Lovable Preview caso os dados não existam no Supabase
      if (!doctor) {
         const email = session.user.email?.toLowerCase() || '';
         if (email.includes('olivia')) {
             doctor = { id: 'mock-olivia', user_id: session.user.id, crm: '87654', crm_state: 'SP', specialty: 'Médicos Prescritores', is_online: false } as any;
             profile = { full_name: 'Dra. Olivia Zimeri', avatar_url: '/dra-olivia-avatar.jpg' };
         } else if (email.includes('suelen')) {
             doctor = { id: 'mock-suelen', user_id: session.user.id, crm: '49354', crm_state: 'SP', specialty: 'Médicos Prescritores', is_online: false } as any;
             profile = { full_name: 'Dr. Edilson Bezerra', avatar_url: '/dra-suelen-avatar.jpg' };
         } else {
             // Fallback default (Dr. Edilson)
             doctor = { id: 'mock-edilson', user_id: session.user.id, crm: '10963', crm_state: 'Sta-Cruz Bo', specialty: 'Médicos Prescritores', is_online: false } as any;
             profile = { full_name: 'Dr. Edilson Bezerra', avatar_url: '/dr-edilson-avatar.jpg' };
         }
      }

      setDoctorData(doctor);
      setProfileData(profile ?? { full_name: session.user.email ?? null, avatar_url: null });

      if (doctor) {
        setIsOnline(doctor.is_online);

        if (doctor.id.startsWith('mock-')) {
          const localStatus = localStorage.getItem(`mock_online_${doctor.id}`);
          if (localStatus !== null) {
            setIsOnline(localStatus === "true");
          }
          setLoading(false);
          return;
        }

        const [apptRes, rxRes, renewRes] = await Promise.all([
          supabase.from("appointments").select("*").eq("doctor_id", doctor.id).order("scheduled_at", { ascending: true }).limit(20),
          supabase.from("prescriptions").select("*").eq("doctor_id", doctor.id).order("created_at", { ascending: false }).limit(10),
          supabase.from("prescription_requests").select("*").eq("doctor_id", doctor.id).eq("status", "pending").order("created_at", { ascending: false }),
        ]);

        if (apptRes.data) setAppointments(apptRes.data);
        if (rxRes.data) setPrescriptions(rxRes.data);
        if (renewRes.data) setRenewalRequests(renewRes.data);

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
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleOnline = async (val: boolean) => {
    setIsOnline(val);
    if (doctorData) {
      await supabase.from("doctors").update({ is_online: val }).eq("id", doctorData.id);
      
      // Sync mock status across tabs for demo purposes
      if (doctorData.id.startsWith("mock-")) {
        localStorage.setItem(`mock_online_${doctorData.id}`, String(val));
        window.dispatchEvent(new Event("mock_online_changed"));
      }
      
      toast({ title: val ? "Você está Online ✅" : "Você está Offline" });
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Faça login", description: "Sessão expirada. Entre novamente para enviar sua foto.", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Envie uma imagem (JPG, PNG ou WEBP).", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Limite máximo de 5MB.", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = pub.publicUrl;
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", session.user.id);
      setProfileData((p) => ({ full_name: p?.full_name ?? null, avatar_url: avatarUrl }));
      toast({ title: "Foto atualizada ✅", description: "Sua imagem já aparece no Desktop Médico." });
    } catch (err: any) {
      toast({ title: "Falha ao enviar foto", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fetchTriageForPatient = async (patientId: string) => {
    const { data } = await supabase
      .from("brisa_triages")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  };

  const openPatientTriage = async (appointment: any) => {
    const triage = await fetchTriageForPatient(appointment.patient_id);
    setSelectedPatientTriage({ appointment, triage });
    setDrawerOpen(true);
  };

  const openReviewModal = async (request: any) => {
    // Fetch linked prescription for context
    let linkedRx = null;
    if (request.prescription_id) {
      const { data } = await supabase.from("prescriptions").select("*").eq("id", request.prescription_id).maybeSingle();
      linkedRx = data;
    }
    // Fetch latest triage
    const triage = await fetchTriageForPatient(request.patient_id);
    setSelectedRequest({ ...request, linkedRx, triage });
    setDosageNotes("");
    setReviewModalOpen(true);
  };

  const handleApproveRenewal = async () => {
    if (!selectedRequest || !doctorData) return;

    if (doctorData.plan_tier !== "vip") {
      toast({
        title: "Emissão Bloqueada",
        description: "É necessário possuir assinatura Gov.br/ICP-Brasil/ClickSign validada ou assinar o Plano Médico (R$99).",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // 1. Update request status
      await supabase.from("prescription_requests").update({ status: "approved" } as any).eq("id", selectedRequest.id);

      // 2. Create new prescription based on linked one
      const baseMeds = selectedRequest.linkedRx?.medications || [];
      const newRx: any = {
        doctor_id: doctorData.id,
        patient_id: selectedRequest.patient_id,
        medications: baseMeds,
        status: "draft",
        instructions: dosageNotes || selectedRequest.linkedRx?.instructions || null,
        diagnosis_cid: selectedRequest.linkedRx?.diagnosis_cid || null,
      };
      await supabase.from("prescriptions").insert(newRx);

      // 3. Send notification to patient
      await supabase.from("notifications").insert({
        user_id: selectedRequest.patient_id,
        title: "🎉 Receita Renovada!",
        message: "Sua solicitação de renovação foi aprovada. Uma nova receita foi gerada pelo seu médico.",
        type: "prescription",
        action_url: "/dashboard/paciente",
      });

      toast({ title: "✅ Renovação aprovada", description: "Nova receita gerada e paciente notificado." });
      setRenewalRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setReviewModalOpen(false);
    } catch (err) {
      toast({ title: "Erro ao aprovar", description: (err as Error).message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const handleRequestConsultation = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      await supabase.from("prescription_requests").update({ status: "consultation_required" } as any).eq("id", selectedRequest.id);

      await supabase.from("notifications").insert({
        user_id: selectedRequest.patient_id,
        title: "📋 Nova Orientação Técnica Necessária",
        message: "Seu médico analisou sua solicitação e recomenda uma nova consulta antes de renovar a receita. Agende pelo Dashboard.",
        type: "info",
        action_url: "/agendamento",
      });

      toast({ title: "Orientação Técnica solicitada", description: "Paciente notificado para agendar nova consulta." });
      setRenewalRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setReviewModalOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.scheduled_at);
    const today = new Date();
    return d.toDateString() === today.toDateString() && a.status !== "cancelled";
  });

  const completedAppts = appointments.filter(a => a.status === "completed");
  const totalEarnings = completedAppts.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  // Monthly earnings estimate
  const now = new Date();
  const monthAppts = appointments.filter(a => {
    const d = new Date(a.scheduled_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && a.status !== "cancelled";
  });
  const monthlyRevenue = monthAppts.reduce((sum, a) => sum + Number(a.amount || 0), 0);

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
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar do médico com upload */}
                <div className="relative shrink-0">
                  <label
                    htmlFor="doctor-avatar-upload"
                    className="group relative block w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-primary/40 bg-muted cursor-pointer shadow-glow"
                    title="Clique para enviar sua foto"
                  >
                    {profileData?.avatar_url ? (
                      <img
                        src={profileData.avatar_url}
                        alt={profileData.full_name || "Foto do profissional"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 to-secondary/10 overflow-hidden">
                        <img 
                          src="/dr-verdinho.png" 
                          alt="Dr. Verdinho"
                          className="w-full h-full object-cover scale-110"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {uploadingAvatar ? (
                        <Loader2 size={20} className="text-white animate-spin" />
                      ) : (
                        <Camera size={20} className="text-white" />
                      )}
                    </div>
                  </label>
                  <input
                    id="doctor-avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingAvatar}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatarUpload(f);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-display font-black text-foreground">
                    Consultório <span className="text-gradient-green">Virtual</span>
                  </h1>
                  {profileData?.full_name && (
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mt-2">
                      {profileData.full_name}
                    </h2>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-muted-foreground font-medium text-sm">
                      {doctorData ? `${doctorData.specialty} CRM ${doctorData.crm} - ${doctorData.crm_state}` : "Configure seu perfil médico"}
                    </p>
                    <DoctorVIPSeal tier={currentTier} />
                  </div>
                  {!profileData?.avatar_url && (
                    <p className="text-[11px] text-primary/80 font-bold mt-1">
                      📸 Clique na imagem para enviar sua foto profissional
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link to="/medsocio">
                  <span 
                    className="inline-flex items-center justify-center gap-1.5 bg-transparent border-2 border-emerald-500 text-emerald-400 rounded-full px-4 py-2 text-sm font-black hover:bg-emerald-500/10 transition-all transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <Network size={16} />
                    MÉDICO SÓCIO
                  </span>
                </Link>
                <Link to="/configuracoes-medico">
                  <span 
                    className="inline-flex items-center justify-center gap-1.5 bg-transparent border-2 border-primary/50 text-primary rounded-full px-4 py-2 text-sm font-black hover:bg-primary/10 transition-all transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  >
                    <Settings size={16} />
                    CARD CONFIG
                  </span>
                </Link>
                <Link to="/sala-espera">
                  <span 
                    className="inline-flex items-center justify-center gap-1.5 bg-blue-500/20 border-2 border-blue-500/50 text-blue-400 rounded-full px-4 py-2 text-sm font-black hover:bg-blue-500/30 transition-all transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  >
                    <Users size={16} />
                    SALA DE ESPERA
                  </span>
                </Link>
                <Button 
                  onClick={() => navigate('/telemed-whatsapp')}
                  variant="outline"
                  className="bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Acessar Telemed
                </Button>
                <Link to="/manual?tab=medico">
                  <span 
                    className="inline-flex items-center justify-center gap-1.5 bg-background border-2 border-primary/20 text-primary rounded-full px-4 py-2 text-sm font-black hover:bg-primary/10 transition-all transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  >
                    <BookOpen size={16} />
                    PASSO A PASSO
                  </span>
                </Link>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                  <span className="text-sm font-bold text-foreground">{isOnline ? "Online" : "Offline"}</span>
                  <Switch checked={isOnline} onCheckedChange={toggleOnline} />
                </div>
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

            {doctorData && !doctorData.is_approved_by_admin && (
              <Card className="border-amber-500/30 bg-amber-500/10 mb-8">
                <CardContent className="p-6 flex items-center gap-4">
                  <Shield size={24} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="font-bold text-foreground">Cadastro em Análise</p>
                    <p className="text-sm text-muted-foreground">Seu cadastro e documentos estão em análise pela Administração. O seu Card Online será liberado em breve.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VIP Expiration Alert (5 days before end of trial/subscription) */}
            {doctorData && <VIPExpirationAlert doctorId={doctorData.id} />}

            {/* Financial Cards - Revenue Distribution */}
            {doctorData && (
              <div className="mb-8">
                <DoctorFinancialCards doctorId={doctorData.id} currentTier={currentTier} />
              </div>
            )}


            {/* === NEW KPI CARDS === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <RefreshCw size={18} className="text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-black text-foreground">{renewalRequests.length}</p>
                      <p className="text-xs text-muted-foreground font-bold">Renovações Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-black text-foreground">{todayAppts.length}</p>
                      <p className="text-xs text-muted-foreground font-bold">Orientações Técnicas Hoje</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <DollarSign size={18} className="text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-black text-foreground">R$ {monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
                      <p className="text-xs text-muted-foreground font-bold">Faturamento Mês</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Star size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-black text-foreground">{doctorData?.rating || 5.0}★</p>
                      <p className="text-xs text-muted-foreground font-bold">Avaliação</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* === RENEWAL CENTER === */}
            {doctorData && renewalRequests.length > 0 && (
              <Card className="border-yellow-500/30 bg-yellow-500/5 mb-8">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <RefreshCw size={18} className="text-yellow-400" /> Solicitações de Renovação
                    <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 text-xs">{renewalRequests.length} pendente{renewalRequests.length > 1 ? "s" : ""}</Badge>
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Paciente</TableHead>
                          <TableHead className="text-xs">Receita Ref.</TableHead>
                          <TableHead className="text-xs">Data Solicitação</TableHead>
                          <TableHead className="text-xs">Notas</TableHead>
                          <TableHead className="text-xs text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renewalRequests.map(req => (
                          <TableRow key={req.id}>
                            <TableCell className="text-sm font-medium text-foreground">{req.patient_id?.slice(0, 8)}…</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{req.prescription_id?.slice(0, 8) || "—"}…</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{format(new Date(req.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{req.notes || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" className="rounded-xl text-xs" onClick={() => openReviewModal(req)}>
                                <ClipboardCheck size={14} className="mr-1" /> Revisar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ferramentas Auxiliares de Monitoramento e Diagnóstico */}
            <div className="mb-8">
              <DoctorSchedule />
            </div>
            
            <DoctorAuxDiagnosticTools />

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
                    <Calendar size={18} /> Orientações Técnicas por Dia
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
                    <Clock size={18} /> Próximas Orientações Técnicas
                  </h3>
                  {todayAppts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma consulta agendada para hoje.</p>
                  ) : (
                    <div className="space-y-3">
                      {todayAppts.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openPatientTriage(a)}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              {a.type === "video" ? <Video size={16} className="text-primary" /> : a.type === "chat" ? <MessageSquare size={16} className="text-primary" /> : <Stethoscope size={16} className="text-primary" />}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">{a.type === "video" ? "Vídeo" : a.type === "chat" ? "Chat" : "Telefone"}</p>
                              <p className="text-xs text-muted-foreground">{a.notes?.slice(0, 40) || "Clique para ver triagem Brisa"}</p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <p className="font-display font-black text-sm text-foreground">{format(new Date(a.scheduled_at), "HH:mm")}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge className={`text-[10px] ${a.status === "confirmed" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                                {a.status === "confirmed" ? "Confirmada" : a.status === "scheduled" ? "Agendada" : a.status}
                              </Badge>
                            </div>
                            <Button 
                                size="sm" 
                                className="h-6 text-[10px] px-3 rounded-full mt-2 bg-blue-600 text-white hover:bg-blue-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/orientacao-video?appointment=${a.id}`;
                                }}
                              >
                                <Video size={12} className="mr-1" />
                                Iniciar Vídeo
                            </Button>
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
                        <div key={rx.id} className="p-3 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center justify-between">
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
                          <div className="mt-3">
                            <Anvisa1ClickButton
                              patientData={{
                                name: rx.patient?.full_name || "Paciente",
                                cpf: rx.patient?.cpf || "000.000.000-00",
                                rg: rx.patient?.rg || "00.000.000-0",
                                address: rx.patient?.address || "Endereço não informado",
                                email: rx.patient?.email || "email@exemplo.com"
                              }}
                              prescriptionData={{
                                doctorName: profileData?.full_name || "Médico",
                                doctorCrm: doctorData?.crm ? `CRM ${doctorData.crm}` : "CRM 00000",
                                productName: (Array.isArray(rx.medications) && rx.medications.length > 0 ? (rx.medications[0] as any)?.name : "Óleo CBD Premium") || "Óleo CBD Premium",
                                posology: (Array.isArray(rx.medications) && rx.medications.length > 0 ? (rx.medications[0] as any)?.dosage : "Uso contínuo") || "Uso contínuo",
                                date: new Date(rx.created_at).toLocaleDateString("pt-BR")
                              }}
                              className="w-full text-xs py-1 h-8"
                            />
                          </div>
                        </div>
                      ))}
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* PIX Balance */}
            <Card className="border-border mt-6 mb-8">
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

            {/* Comic Book Manual Banner */}
            <Link to="/manual?tab=medico" className="block w-full focus:outline-none mb-8">
              <div className="w-full comic-panel-primary bg-primary hover:bg-primary/90 p-6 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer transform hover:-rotate-1 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-primary shrink-0 border-2 border-foreground shadow-[2px_2px_0px_#000]">
                    <BookOpen size={32} />
                  </div>
                  <div>
                    <h3 className="font-black comic-font text-2xl text-primary-foreground mb-1">DÚVIDAS NA PLATAFORMA?</h3>
                    <p className="font-bold text-primary-foreground/90">Leia o Guia Definitivo em HQ para Médicos!</p>
                  </div>
                </div>
                <Button asChild className="bg-background text-foreground font-black border-2 border-transparent hover:border-foreground hover:bg-background/90 text-lg px-8 h-14 rounded-xl shadow-[4px_4px_0px_#000] pointer-events-none">
                  <span>LER AGORA <ArrowRight className="ml-2" /></span>
                </Button>
              </div>
            </Link>

          </motion.div>
        </div>
      </section>
      <Footer />

      {/* Brisa Triage Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileBarChart size={18} className="text-primary" /> Relatório Pré-Orientação Técnica (Brisa IA)
            </SheetTitle>
            <SheetDescription>Resumo da triagem do paciente antes da consulta</SheetDescription>
          </SheetHeader>

          {selectedPatientTriage && (
            <div className="mt-6 space-y-4">
              <EvolutionChart userId={selectedPatientTriage.appointment.patient_id} compact />
              
              {/* Integração IoT & Biometria Clínica no Triage */}
              <IoTBiometricTracker />
              
              {/* Integração Farmacogenômica (DNA Canabinoide) */}
              <FarmacogenomicaCard patientId={selectedPatientTriage.appointment.patient_id} isDoctorView />
              
              {/* Integração Prontuário Blockchain */}
              <BlockchainRecordPublisher 
                caseData={{
                  diagnosisCid: "F41.1",
                  symptoms: selectedPatientTriage.triage.symptoms || "Ansiedade generalizada",
                  prescribedStrain: "Óleo CBD 10%",
                  dosage: "10 gotas/dia",
                  evolutionNotes: "Melhora no sono e redução da ansiedade.",
                  ageRange: "30-40",
                  gender: "Feminino"
                }} 
                doctorCrm={doctorData?.crm || "00000"} 
              />

              <Card className="border-border">
                <CardContent className="p-4">
                  <h4 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2"><Calendar size={14} className="text-primary" /> Orientação Técnica</h4>
                  <p className="text-xs text-muted-foreground">Horário: {format(new Date(selectedPatientTriage.appointment.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  <p className="text-xs text-muted-foreground">Tipo: {selectedPatientTriage.appointment.type}</p>
                  <Badge className="mt-2 text-[10px] bg-primary/10 text-primary border-green capitalize">{selectedPatientTriage.appointment.status}</Badge>
                  
                  <Button 
                    className="w-full mt-4 bg-primary text-primary-foreground font-black h-12 rounded-xl" 
                    onClick={() => navigate(`/workspace-medico?patient=${selectedPatientTriage.appointment.patient_id}&appt=${selectedPatientTriage.appointment.id}&type=${selectedPatientTriage.appointment.type}`)}
                  >
                    <Video size={18} className="mr-2" /> Iniciar Atendimento
                  </Button>
                </CardContent>
              </Card>

              {selectedPatientTriage.triage ? (
                <>
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <h4 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2"><Brain size={14} className="text-secondary" /> Sintomas Principais</h4>
                      <p className="text-sm text-foreground bg-muted/20 rounded-xl p-3 border border-border">{selectedPatientTriage.triage.symptoms}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardContent className="p-4">
                      <h4 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2"><Flame size={14} className="text-destructive" /> Nível de Urgência</h4>
                      <Badge className={`text-xs capitalize ${selectedPatientTriage.triage.urgency === "alta" || selectedPatientTriage.triage.urgency === "urgente" ? "bg-destructive/10 text-destructive" : selectedPatientTriage.triage.urgency === "media" ? "bg-yellow-500/10 text-yellow-400" : "bg-primary/10 text-primary"}`}>
                        {selectedPatientTriage.triage.urgency || "Não classificada"}
                      </Badge>
                      {selectedPatientTriage.triage.specialty && <p className="text-xs text-muted-foreground mt-2">Especialidade sugerida: {selectedPatientTriage.triage.specialty}</p>}
                      {selectedPatientTriage.triage.category && <p className="text-xs text-muted-foreground">Categoria: {selectedPatientTriage.triage.category}</p>}
                    </CardContent>
                  </Card>

                  {selectedPatientTriage.triage.suggested_conditions?.length > 0 && (
                    <Card className="border-border">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2"><Activity size={14} className="text-primary" /> Condições Sugeridas pela IA</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPatientTriage.triage.suggested_conditions.map((c: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedPatientTriage.triage.pre_record && (
                    <Card className="border-border">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2"><FileText size={14} className="text-muted-foreground" /> Pré-Prontuário</h4>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedPatientTriage.triage.pre_record}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="border-border">
                  <CardContent className="p-6 text-center">
                    <Brain size={32} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma triagem Brisa encontrada para este paciente.</p>
                    <p className="text-xs text-muted-foreground mt-1">O paciente não realizou triagem antes da consulta.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* === RENEWAL REVIEW MODAL === */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw size={18} className="text-yellow-400" /> Revisar Solicitação de Renovação
            </DialogTitle>
            <DialogDescription>Analise o histórico e decida se aprova ou solicita nova consulta.</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Patient Evolution */}
              <EvolutionChart userId={selectedRequest.patient_id} compact />

              {/* Triage Summary */}
              {selectedRequest.triage && (
                <Card className="border-border">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">
                      <Brain size={14} className="text-secondary" /> Última Triagem Brisa
                    </h4>
                    <p className="text-xs text-muted-foreground">{selectedRequest.triage.symptoms}</p>
                    <Badge className="mt-2 text-[10px] capitalize bg-primary/10 text-primary">{selectedRequest.triage.urgency || "baixa"}</Badge>
                  </CardContent>
                </Card>
              )}

              {/* Linked prescription info */}
              {selectedRequest.linkedRx && (
                <Card className="border-border">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">
                      <Pill size={14} className="text-primary" /> Receita Anterior
                    </h4>
                    <p className="text-xs text-muted-foreground">CID: {selectedRequest.linkedRx.diagnosis_cid || "Não informado"}</p>
                    <p className="text-xs text-muted-foreground">Status: {selectedRequest.linkedRx.status}</p>
                    {selectedRequest.linkedRx.instructions && (
                      <p className="text-xs text-muted-foreground mt-1">Instruções: {selectedRequest.linkedRx.instructions}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Dosage adjustment */}
              <div>
                <label className="text-sm font-bold text-foreground mb-1 block">Ajustar dosagem / observações (opcional)</label>
                <Textarea
                  placeholder="Ex.: Aumentar CBD para 40mg/ml, reduzir THC..."
                  value={dosageNotes}
                  onChange={e => setDosageNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="rounded-xl" onClick={handleRequestConsultation} disabled={processing}>
              {processing ? <Loader2 size={14} className="animate-spin mr-1" /> : <Calendar size={14} className="mr-1" />}
              Solicitar Nova Orientação Técnica
            </Button>
            <Button className="rounded-xl bg-primary" onClick={handleApproveRenewal} disabled={processing}>
              {processing ? <Loader2 size={14} className="animate-spin mr-1" /> : <CheckCircle2 size={14} className="mr-1" />}
              Aprovar e Gerar Receita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardMedico;
