import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Clock, FilePlus, ChevronLeft, Calendar, Stethoscope, Video, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DoctorQuickActions } from "@/components/doctor/DoctorQuickActions";
import { PrescriptionTemplates } from "@/components/doctor/PrescriptionTemplates";
import { TriageSummaryCard } from "@/components/doctor/TriageSummaryCard";

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

  // EMR state
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  
  // Prescription state
  const [prescriptionText, setPrescriptionText] = useState("");

  useEffect(() => {
    if (!patientId || !appointmentId) {
      navigate("/dashboard-medico");
      return;
    }
    fetchData();
  }, [patientId, appointmentId]);

  const fetchData = async () => {
    try {
      const [patientRes, apptRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", patientId).single(),
        supabase.from("appointments").select("*").eq("id", appointmentId).single()
      ]);
      if (patientRes.data) setPatient(patientRes.data);
      if (apptRes.data) setAppointment(apptRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando Workspace...</div>;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* Top Header */}
      <div className="h-16 border-b border-border bg-card/30 flex items-center justify-between px-6 mt-16 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard-medico")}>
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h2 className="font-semibold text-lg">{patient?.full_name || "Paciente Remoto"}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock size={12}/> {appointment?.scheduled_at ? new Date(appointment.scheduled_at).toLocaleDateString() : "Hoje"}</span>
              <span>•</span>
              <span className="flex items-center gap-1 uppercase">{type === 'video' ? <Video size={12}/> : <MessageSquare size={12}/>} Consulta</span>
            </div>
          </div>
        </div>
        
        <DoctorQuickActions 
          patientId={patientId || ""} 
          appointmentId={appointmentId || ""} 
          patientName={patient?.full_name || ""}
        />
      </div>

      {/* Split Pane Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side: Video/Chat iframe */}
        <div className="w-1/2 border-r border-border bg-black/5 flex flex-col relative">
           {type === 'video' ? (
             <iframe 
               src={`https://meet.jit.si/${appointmentId || 'default_room'}`} 
               allow="camera; microphone; fullscreen; display-capture"
               className="w-full h-full border-0"
             />
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
             <TriageSummaryCard notes={appointment?.notes} />
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
                  <Label>Evolução / Notas Clínicas (Subjetivo e Objetivo)</Label>
                  <Textarea className="min-h-[150px]" placeholder="Paciente relata melhora no quadro álgico após início de CBD 20%..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Plano Terapêutico</Label>
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
