import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Clock, FilePlus, ChevronLeft, Calendar, Stethoscope, Video, MessageSquare, BookOpen, Brain, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DoctorQuickActions } from "@/components/doctor/DoctorQuickActions";
import { PrescriptionTemplates } from "@/components/doctor/PrescriptionTemplates";
import { TriageSummaryCard } from "@/components/doctor/TriageSummaryCard";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { JitsiRoom } from "@/components/consultation/JitsiRoom";

const WorkspaceMedico = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patient");
  const appointmentId = searchParams.get("appt");
  const type = searchParams.get("type") || "video"; // "video" or "chat"
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [doctorId, setDoctorId] = useState<string>("mock-suelen");

  // EMR state
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  
  // Prescription state
  const [prescriptionText, setPrescriptionText] = useState("");

  // Copilot state
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotSuggestion, setCopilotSuggestion] = useState("");

  // Video Room State
  const [roomInfo, setRoomInfo] = useState<{ roomName: string; domain: string; jwt?: string } | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId || !appointmentId) {
      navigate("/dashboard-medico");
      return;
    }
    fetchData();
  }, [patientId, appointmentId]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
         const email = session.user.email?.toLowerCase() || '';
         let docId = "mock-edilson";
         if (email.includes('olivia')) docId = 'mock-olivia';
         else if (email.includes('suelen')) docId = 'mock-suelen';
         setDoctorId(docId);
         setIsOnline(localStorage.getItem(`mock_online_${docId}`) === "true");
      }

      const [patientRes, apptRes, recordRes, roomRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", patientId).single(),
        supabase.from("appointments").select("*").eq("id", appointmentId).single(),
        supabase.from("medical_records").select("*").eq("appointment_id", appointmentId).maybeSingle(),
        type === 'video' ? supabase.functions.invoke("create-video-room", { body: { appointmentId } }) : Promise.resolve({ data: null, error: null })
      ]);
      if (patientRes.data) setPatient(patientRes.data);
      if (apptRes.data) setAppointment(apptRes.data);
      if (recordRes.data) {
        if (recordRes.data.notes) setNotes(recordRes.data.notes);
        if (recordRes.data.diagnosis) setDiagnosis(recordRes.data.diagnosis);
        if (recordRes.data.treatment_plan) setTreatmentPlan(recordRes.data.treatment_plan);
      }
      
      if (type === 'video') {
        if (roomRes.error || !roomRes.data?.ok) {
          setRoomError(roomRes.data?.error || roomRes.error?.message || "Erro ao criar sala de vídeo");
        } else {
          setRoomInfo({
            roomName: roomRes.data.roomName,
            domain: roomRes.data.domain,
            jwt: roomRes.data.doctorJwt
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = (val: boolean) => {
    setIsOnline(val);
    localStorage.setItem(`mock_online_${doctorId}`, String(val));
    window.dispatchEvent(new Event("mock_online_changed"));
    toast({ title: val ? "Você está Online ✅" : "Você está Offline" });
  };

  const handleSaveEMR = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      await supabase.from("medical_records").insert({
        patient_id: patientId,
        doctor_id: session.user.id,
        appointment_id: appointmentId,
        notes: notes,
        diagnosis: diagnosis,
        treatment_plan: treatmentPlan,
      });
      toast({ title: "Salvo com sucesso", description: "Evolução registrada no prontuário." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    }
  };

  const handleCopilotAction = async (action: "suggest_treatment" | "format_soap") => {
    setCopilotLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase.functions.invoke("clinical-copilot", {
        body: {
          action,
          patientInfo: patient?.full_name,
          notes: notes,
          triageSummary: "Paciente relata dores crônicas. (Dado simulado da triagem)",
        }
      });
      if (error) throw error;
      
      if (action === "suggest_treatment") {
        setCopilotSuggestion(data.result);
      } else if (action === "format_soap") {
        setNotes(data.result);
        toast({ title: "Transcrição Concluída", description: "Anotações convertidas para formato SOAP." });
      }
    } catch (err) {
      toast({ title: "Erro no Copiloto", description: "Falha ao conectar com a IA.", variant: "destructive" });
    } finally {
      setCopilotLoading(false);
    }
  };

  if (loading) return <div className="flex h-dvh items-center justify-center">Carregando Workspace...</div>;

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      <Navbar />
      
      {/* Top Header */}
      <div className="h-16 border-b border-border bg-card/30 flex items-center justify-between px-6 mt-16 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard-medico")}>
            <ChevronLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg">{patient?.full_name || "Paciente Remoto"}</h2>
              <Badge variant={type === 'video' ? "default" : "secondary"} className="text-[10px]">
                {type === 'video' ? "Consulta Completa - Resolução CFM 2.314/22" : "Orientação Técnica Rápida"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock size={12}/> {appointment?.scheduled_at ? new Date(appointment.scheduled_at).toLocaleDateString() : "Hoje"}</span>
              <span>•</span>
              <span className="flex items-center gap-1 uppercase">{type === 'video' ? <Video size={12}/> : <MessageSquare size={12}/>} Consulta</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Button 
            variant="outline" 
            className="gap-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
            onClick={() => window.open("/manual?tab=medico", "_blank")}
          >
            <BookOpen size={16} /> Passo a Passo
          </Button>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
            <span className="text-xs font-bold mr-2">{isOnline ? "Online" : "Offline"}</span>
            <Switch checked={isOnline} onCheckedChange={toggleOnline} className="scale-75 data-[state=checked]:bg-primary" />
          </div>
          
          <DoctorQuickActions 
            patientId={patientId || ""} 
            appointmentId={appointmentId || ""} 
            patientName={patient?.full_name || ""}
          />
        </div>
      </div>

      {/* Split Pane Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side: Video/Chat iframe */}
        <div className="w-1/2 border-r border-border bg-black/5 flex flex-col relative">
           {type === 'video' ? (
             roomError ? (
               <div className="flex-1 flex items-center justify-center text-red-500 font-bold p-6 text-center">
                 <p>{roomError}</p>
               </div>
             ) : roomInfo ? (
               <JitsiRoom 
                 roomName={roomInfo.roomName}
                 domain={roomInfo.domain}
                 jwt={roomInfo.jwt}
                 isDoctor={true}
                 onClose={() => navigate("/dashboard-medico")}
               />
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center">
                 <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                 <p className="text-muted-foreground font-bold">Iniciando sala criptografada...</p>
               </div>
             )
           ) : (
             <div className="flex items-center justify-center h-full flex-col text-muted-foreground">
               <MessageSquare size={48} className="mb-4 opacity-50" />
               <p>Chat Seguro Integrado (Em breve nesta aba)</p>
               {/* This would be the chat component */}
             </div>
           )}
        </div>

        {/* Right Side: EMR & Tools */}
        <div className="w-1/2 flex flex-col bg-card/10 overflow-hidden">
          
          <div className="p-4 border-b border-border shrink-0 bg-background/50">
             <TriageSummaryCard notes={notes} />
          </div>

          <div className="flex-1 overflow-auto p-4">
            <Tabs defaultValue="evolution" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6 bg-background/50 border border-border">
                <TabsTrigger value="evolution">Evolução (SOAP)</TabsTrigger>
                <TabsTrigger value="prescription">Receituário</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>
              
              <TabsContent value="evolution" className="space-y-4">
                <div className="space-y-2">
                  <Label>Diagnóstico / Hipótese</Label>
                  <Input placeholder="Ex: CID R52.2 - Outra dor crônica" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end mb-1">
                    <Label>Evolução / Notas Clínicas</Label>
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800" onClick={() => handleCopilotAction("format_soap")} disabled={copilotLoading || !notes}>
                      {copilotLoading ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Sparkles size={12} className="mr-1" />}
                      Formatar em SOAP
                    </Button>
                  </div>
                  <Textarea className="min-h-[150px]" placeholder="Paciente relata melhora no quadro álgico após início de CBD 20%..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end mb-1">
                    <Label>Plano Terapêutico</Label>
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800" onClick={() => handleCopilotAction("suggest_treatment")} disabled={copilotLoading}>
                      {copilotLoading ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Brain size={12} className="mr-1" />}
                      Copiloto: Sugerir Tratamento
                    </Button>
                  </div>
                  {copilotSuggestion && (
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg mb-2 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setCopilotSuggestion("")}>&times;</Button>
                      <p className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1"><Brain size={12}/> Sugestão do Copiloto (Revisar):</p>
                      <p className="text-xs text-emerald-700 whitespace-pre-wrap">{copilotSuggestion}</p>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs text-emerald-600 mt-2" onClick={() => setTreatmentPlan(prev => prev ? prev + "\n" + copilotSuggestion : copilotSuggestion)}>Incorporar ao Plano</Button>
                    </div>
                  )}
                  <Textarea className="min-h-[100px]" placeholder="Ajuste de dose, solicitar novos exames..." value={treatmentPlan} onChange={e => setTreatmentPlan(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleSaveEMR}><FilePlus size={16} className="mr-2"/> Salvar Evolução</Button>
              </TabsContent>
              
              <TabsContent value="prescription" className="space-y-4">
                <PrescriptionTemplates onSelectTemplate={(text) => setPrescriptionText(prev => prev ? prev + '\n\n' + text : text)} />
                <div className="space-y-2 mt-4">
                  <Label>Posologia (Receituário Simples/Azul)</Label>
                  <Textarea 
                    className="min-h-[200px] font-mono text-sm" 
                    value={prescriptionText} 
                    onChange={e => setPrescriptionText(e.target.value)} 
                    placeholder="1. Óleo CBD 20% THC 1% (Vidro 30ml)..."
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Emitir & Assinar Digitalmente</Button>
              </TabsContent>

              <TabsContent value="history">
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
                  <Calendar size={32} className="mb-2 opacity-30"/>
                  <p>Nenhum atendimento anterior encontrado para este paciente.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorkspaceMedico;
