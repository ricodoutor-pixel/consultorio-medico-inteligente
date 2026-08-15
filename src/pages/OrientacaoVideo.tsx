import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Video, Mic, MicOff, VideoOff, Phone, MessageSquare, FileText, Shield, Send, Paperclip, Clock, Brain, Loader2, X, Maximize2, Minimize2, ClipboardList, Wifi, ScanFace, Link2, Stethoscope, Heart } from "lucide-react";
import { NetworkQualityIndicator } from "@/components/NetworkQualityIndicator";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { TCLEConsentModal } from "@/components/TCLEConsentModal";
import { ProntuarioSidebar } from "@/components/ProntuarioSidebar";
import { useAuditLog } from "@/hooks/useAuditLog";
import { CbdThcAISuggestionPanel } from "@/components/CbdThcAISuggestionPanel";
import { VitalSignsOverlay } from "@/components/consultation/VitalSignsOverlay";
import { BiometricShield } from "@/components/consultation/BiometricShield";
import { AIScribeCoding } from "@/components/consultation/AIScribeCoding";
import { SmartPrescriptionDTx } from "@/components/consultation/SmartPrescriptionDTx";
import { BlockchainConsent } from "@/components/consultation/BlockchainConsent";
import { DrugInteractionChecker } from "@/components/consultation/DrugInteractionChecker";
import { MandatoryNPSModal } from "@/components/MandatoryNPSModal";
import { PatientFlowGuide } from "@/components/patient/PatientFlowGuide";
import type { FlowStep } from "@/components/patient/PatientFlowGuide";
import { JitsiRoom } from "@/components/consultation/JitsiRoom";
import { WhatsAppTelemedicineChat } from "@/components/chat/WhatsAppTelemedicineChat";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

type ChatMessage = {
  id: string;
  sender: "patient" | "doctor";
  text: string;
  timestamp: Date;
  type: "text" | "file";
  fileName?: string;
};

const OrientacaoVideo = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { log } = useAuditLog();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const consultationParam = searchParams.get("consultation");
  const patientToken = searchParams.get("token");
  const [roomInfo, setRoomInfo] = useState<{
    roomName: string;
    domain: string;
    jwt?: string;
    consultationId: string;
    patientAccessLink?: string;
    lobbyEnabled?: boolean;
  } | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState<{ code: string; message: string } | null>(null);
  const roomFetchStarted = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [showPEP, setShowPEP] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDoctor, setIsDoctor] = useState(false);
  const [tcleAccepted, setTcleAccepted] = useState(false);
  const [showTCLE, setShowTCLE] = useState(true);
  const [showNPS, setShowNPS] = useState(false);
  const [showFlowGuide, setShowFlowGuide] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>("consultation_completed");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [doctorId, setDoctorId] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<string>("video");
  const [doctorInfo, setDoctorInfo] = useState<{ name: string; photo: string }>({ name: "Médico", photo: "" });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUserType();
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Cria/entra na sala assim que soubermos se quem acessa e medico ou paciente
  useEffect(() => {
    if (roomFetchStarted.current) return;
    if (!authChecked && !patientToken) {
      // ainda checando sessao e nao ha token de paciente na URL: espera
      return;
    }
    roomFetchStarted.current = true;
    fetchOrCreateRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctor, authChecked, patientToken]);

  const mapRoomError = (status: number, error?: string): { code: string; message: string } => {
    if (status === 404) return { code: "not_found", message: "A sala ainda não foi criada pelo médico. Aguarde o início da consulta." };
    if (status === 403 && error?.toLowerCase().includes("expirad")) return { code: "expired", message: "Este link de consulta expirou. Solicite um novo link à clínica." };
    if (status === 403 && error?.toLowerCase().includes("token")) return { code: "invalid_token", message: "Link de acesso inválido. Verifique se copiou o link completo enviado pela clínica." };
    if (status === 403) return { code: "forbidden", message: "Você não tem permissão para acessar esta consulta." };
    if (status === 401) return { code: "unauthorized", message: "É necessário estar autenticado para acessar esta consulta." };
    return { code: "unknown", message: error || "Não foi possível conectar à sala. Tente novamente em instantes." };
  };

  const fetchOrCreateRoom = async () => {
    setRoomLoading(true);
    setRoomError(null);
    try {
      if (isDoctor && appointmentId) {
        // Fluxo do medico: cria (ou reaproveita) a sala da consulta agendada
        const { data, error } = await supabase.functions.invoke("create-video-room", {
          body: { appointmentId },
        });
        if (error || !data?.ok) {
          const status = (error as any)?.context?.status ?? 500;
          setRoomError(mapRoomError(status, data?.error || error?.message));
          return;
        }
        setRoomInfo({
          roomName: data.roomName,
          domain: data.domain,
          jwt: data.doctorJwt,
          consultationId: data.consultationId,
          patientAccessLink: data.patientAccessLink,
        });
      } else {
        // Fluxo do paciente: entra com token do link, ou autenticado.
        // O appointment.id e usado como consultation_id em video_rooms.
        const consultationId = consultationParam || appointmentId || null;
        if (!consultationId) {
          setRoomError({ code: "not_found", message: "A sala ainda não foi criada pelo médico. Aguarde o início da consulta." });
          return;
        }
        const { data, error } = await supabase.functions.invoke("join-video-room", {
          body: { consultationId, token: patientToken || undefined },
        });
        if (error || !data?.ok) {
          const status = (error as any)?.context?.status ?? 500;
          setRoomError(mapRoomError(status, data?.error || error?.message));
          return;
        }
        setRoomInfo({
          roomName: data.room,
          domain: data.domain,
          jwt: data.jwt,
          consultationId,
        });
      }
    } catch (e: any) {
      setRoomError({ code: "unknown", message: e?.message || "Erro inesperado ao conectar à sala." });
    } finally {
      setRoomLoading(false);
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isDoctor && roomError?.code === "not_found") {
      timeout = setTimeout(() => {
        roomFetchStarted.current = false;
        fetchOrCreateRoom();
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [roomError, isDoctor]);

  const handleTCLEAccept = () => {
    setTcleAccepted(true);
    setShowTCLE(false);
    log("tcle_accepted", "appointments", appointmentId || "unknown", null, { timestamp: new Date().toISOString() });
    toast({ title: "TCLE aceito ✅", description: "Você pode iniciar a teleconsulta." });
  };

  const handleTCLEDecline = () => {
    toast({ title: "TCLE recusado", description: "Não é possível iniciar a consulta sem aceitar o TCLE.", variant: "destructive" });
    navigate(-1);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const checkUserType = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setCurrentUserId(session.user.id);
      
      const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", session.user.id).maybeSingle();
      if (doctor) {
        setIsDoctor(true);
        setDoctorId(doctor.id);
      }

      // Fetch appointment details
      const consultationId = searchParams.get("appointment") || searchParams.get("consultation");
      if (consultationId) {
        const { data: appt } = await supabase
          .from("appointments")
          .select("type, doctor_id")
          .eq("id", consultationId)
          .maybeSingle();
          
        if (appt) {
          setAppointmentType(appt.type || "video");
          const { data: docData } = await supabase
            .from("doctors_public")
            .select("full_name, avatar_url")
            .eq("id", appt.doctor_id)
            .maybeSingle();
            
          if (docData) {
            setDoctorInfo({
              name: docData.full_name || "Médico",
              photo: docData.avatar_url || ""
            });
          }
        }
      }
    } finally {
      setAuthChecked(true);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: isDoctor ? "doctor" : "patient",
      text: newMessage,
      timestamp: new Date(),
      type: "text",
    };
    setChatMessages(prev => [...prev, msg]);
    setNewMessage("");
  };

  const handleFileShare = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: "Arquivo muito grande", description: "Máximo 10MB", variant: "destructive" });
          return;
        }
        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          sender: isDoctor ? "doctor" : "patient",
          text: `📎 ${file.name}`,
          timestamp: new Date(),
          type: "file",
          fileName: file.name,
        };
        setChatMessages(prev => [...prev, msg]);
        toast({ title: "Arquivo compartilhado! 📎" });
      }
    };
    input.click();
  };

  const generateAISummary = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("triage-summary", {
        body: {
          answers: { transcript: aiTranscript || "Orientação Técnica de acompanhamento para tratamento com cannabis medicinal." },
          patientData: { nome: "Paciente" },
        },
      });
      if (error) throw error;
      setAiSummary(data?.summary || "Resumo não disponível.");
    } catch {
      setAiSummary("Erro ao gerar resumo. Tente novamente.");
    }
    setAiLoading(false);
  };

  const endConsultation = async () => {
    if (appointmentId) {
      await supabase.from("appointments").update({ status: "completed" }).eq("id", appointmentId);
    }
    toast({ title: "Orientação Técnica encerrada ✅" });
    
    if (!isDoctor) {
      setShowNPS(true);
    } else {
      setShowFlowGuide(true);
      setFlowStep("consultation_completed");
      window.history.back();
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h.toString().padStart(2, "0") + ":" : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-dvh bg-background">
      <TCLEConsentModal open={showTCLE && !tcleAccepted} onAccept={handleTCLEAccept} onDecline={handleTCLEDecline} appointmentId={appointmentId || undefined} />

      {/* Mandatory NPS Modal (patient only, after consultation ends) */}
      {showNPS && !isDoctor && (
        <MandatoryNPSModal
          open={showNPS}
          consultationId={appointmentId || "unknown"}
          patientId={currentUserId}
          professionalId={doctorId}
          flowType="consultation"
          onComplete={() => {
            setShowNPS(false);
            setShowFlowGuide(true);
            setFlowStep("consultation_completed");
          }}
        />
      )}

      {/* Patient Flow Guide */}
      {showFlowGuide && !isDoctor && (
        <PatientFlowGuide
          currentStep={flowStep}
          onClose={() => setShowFlowGuide(false)}
          onTriggerNPS={() => setShowNPS(true)}
        />
      )}
      {!isFullscreen && <Navbar />}

      <div className={`${isFullscreen ? "" : "pt-16"} flex flex-col h-dvh`}>
        {/* Top bar */}
        <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-bold text-foreground">CONSULTA AO VIVO</span>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              <Shield size={8} className="mr-1" /> E2E Encrypted
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isDoctor && roomInfo?.patientAccessLink && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(roomInfo.patientAccessLink!);
                  toast({ title: "Link copiado ✅", description: "Envie ao paciente pelo WhatsApp ou e-mail." });
                }}
              >
                <Link2 size={12} className="mr-1" /> Copiar link do paciente
              </Button>
            )}
            <NetworkQualityIndicator />
            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> {formatTime(elapsedSeconds)}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Video area */}
          <div className="flex-1 flex flex-col relative bg-black/90">
            {/* rPPG Vital Signs Overlay (doctor only) */}
            {isDoctor && <VitalSignsOverlay enabled={tcleAccepted} />}

            {/* Biometric Shield */}
            <BiometricShield enabled={tcleAccepted} isDoctor={isDoctor} />

            {/* Main video — Jitsi Meet (WebRTC HD) */}
            <div className="flex-1 flex items-stretch justify-stretch">
              {!tcleAccepted ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
                      <Video size={48} className="text-primary/40" />
                    </div>
                    <p className="text-sm text-white/60">Aceite o TCLE para iniciar a teleconsulta com Jitsi Meet</p>
                  </div>
                </div>
              ) : roomLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                    <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                      Carregando ambiente seguro...
                    </p>
                  </div>
                </div>
              ) : roomError ? (
                <div className="flex-1 flex items-center justify-center">
                  {roomError.code === "not_found" && !isDoctor ? (
                    <div className="text-center space-y-4 max-w-sm px-6">
                      <div className="relative mx-auto w-20 h-20 mb-4">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                        <div className="relative w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                          <Stethoscope size={32} className="text-primary animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-xl font-display font-black text-white">Sala de Espera</h3>
                      <p className="text-sm text-white/70">
                        O médico ainda não abriu a sala de telemedicina. Aguarde, não é necessário recarregar a página.
                      </p>
                      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-full mt-4">
                        <Loader2 size={14} className="animate-spin" /> Atualizando automaticamente...
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3 max-w-sm px-6">
                      <Shield className="w-10 h-10 text-red-400 mx-auto" />
                      <p className="text-sm font-bold text-red-300">
                        Não foi possível entrar na sala
                      </p>
                      <p className="text-xs text-white/60">{roomError.message}</p>
                    </div>
                  )}
                </div>
              ) : roomInfo ? (
                <JitsiRoom
                  roomName={roomInfo.roomName}
                  domain={roomInfo.domain}
                  jwt={roomInfo.jwt}
                  isDoctor={isDoctor}
                  onClose={() => navigate("/")}
                />
              ) : null}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 to-transparent">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full w-12 h-12"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
              <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full w-12 h-12"
                onClick={() => setIsVideoOff(!isVideoOff)}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className={`rounded-full w-12 h-12 ${showChat ? "ring-2 ring-primary" : ""}`}
                onClick={() => setShowChat(!showChat)}
              >
                <MessageSquare size={20} />
              </Button>
              {isDoctor && (
                <>
                  <Button
                    variant="secondary"
                    size="lg"
                    className={`rounded-full w-12 h-12 ${showPEP ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setShowPEP(!showPEP)}
                  >
                    <ClipboardList size={20} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className={`rounded-full w-12 h-12 ${showAISidebar ? "ring-2 ring-secondary" : ""}`}
                    onClick={() => setShowAISidebar(!showAISidebar)}
                  >
                    <Brain size={20} />
                  </Button>
                </>
              )}
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full w-12 h-12"
                onClick={endConsultation}
              >
                <Phone size={20} className="rotate-[135deg]" />
              </Button>
            </div>
          </div>

          {/* Chat sidebar */}
          {showChat && (
            <div className="w-[400px] border-l border-border bg-card flex flex-col shrink-0">
              <WhatsAppTelemedicineChat
                appointmentId={appointmentId || consultationParam || ""}
                currentUserRole={isDoctor ? "doctor" : "patient"}
                currentUserId={currentUserId}
                consultationType={appointmentType}
                doctorName={doctorInfo.name}
                doctorPhoto={doctorInfo.photo}
                onVideoCallClick={() => {
                  if (appointmentType.toLowerCase().includes("chat") && !appointmentType.toLowerCase().includes("video")) {
                    toast({ title: "Bloqueado", description: "Sua consulta é apenas chat.", variant: "destructive" });
                  } else {
                    toast({ title: "Vídeo já ativo", description: "Utilize os controles da sala." });
                  }
                }}
              />
            </div>
          )}

          {/* AI Sidebar (doctor only) */}
          {showAISidebar && isDoctor && (
            <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Brain size={14} className="text-secondary" /> Assistente IA
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowAISidebar(false)}>
                  <X size={14} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* AI Scribe & Auto-Coding */}
                <AIScribeCoding onApplyToEHR={(output) => {
                  setAiTranscript(output.hda);
                  setAiSummary(`QP: ${output.chiefComplaint}\n\nAvaliação: ${output.assessment}\n\nPlano: ${output.plan}`);
                }} />

                {/* Digital Therapeutics */}
                <SmartPrescriptionDTx diagnosisCid="M54.5" />

                {/* Blockchain Consent */}
                <BlockchainConsent
                  documentContent={`TCLE-${appointmentId}-${Date.now()}`}
                  documentType="TCLE"
                  signerRole={isDoctor ? "doctor" : "patient"}
                />

                {/* CID-10 Quick search */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">🔍 Busca Rápida CID-10</p>
                  <CID10QuickSearch />
                </div>

                {/* Drug Interaction Checker */}
                <div className="border-t border-border pt-4">
                  <DrugInteractionChecker />
                </div>

                {/* CBD/THC AI Suggestion & Titration */}
                <div className="border-t border-border pt-4">
                  <CbdThcAISuggestionPanel />
                </div>
              </div>
            </div>
          )}

          {/* PEP Sidebar (doctor only) */}
          {showPEP && isDoctor && (
            <ProntuarioSidebar appointmentId={appointmentId} onClose={() => setShowPEP(false)} />
          )}
        </div>
      </div>
    </div>
  );
};

// CID-10 Quick Search inline component
const CID10_DATA = [
  { code: "F41.1", name: "Ansiedade generalizada" },
  { code: "F32.0", name: "Episódio depressivo leve" },
  { code: "F32.1", name: "Episódio depressivo moderado" },
  { code: "G43.0", name: "Enxaqueca sem aura" },
  { code: "G40.0", name: "Epilepsia idiopática" },
  { code: "R52", name: "Dor não classificada" },
  { code: "M54.5", name: "Dor lombar baixa" },
  { code: "G47.0", name: "Insônia" },
  { code: "F90.0", name: "TDAH" },
  { code: "G20", name: "Doença de Parkinson" },
  { code: "C80", name: "Neoplasia maligna sem especificação" },
  { code: "G35", name: "Esclerose múltipla" },
  { code: "F41.0", name: "Transtorno de pânico" },
  { code: "F43.1", name: "Transtorno de estresse pós-traumático" },
  { code: "N94.6", name: "Dismenorreia não especificada" },
  { code: "K58", name: "Síndrome do intestino irritável" },
  { code: "F10.2", name: "Dependência de álcool" },
  { code: "F12.1", name: "Uso nocivo de canabinoides" },
  { code: "R51", name: "Cefaleia" },
  { code: "M79.7", name: "Fibromialgia" },
];

const CID10QuickSearch = () => {
  const [search, setSearch] = useState("");
  const filtered = search.length >= 2
    ? CID10_DATA.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar CID-10..."
        className="bg-muted border-border text-xs"
      />
      {filtered.length > 0 && (
        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
          {filtered.map(c => (
            <div key={c.code} className="flex items-center justify-between p-1.5 rounded-lg bg-muted/30 text-xs cursor-pointer hover:bg-muted">
              <span className="font-mono font-bold text-primary">{c.code}</span>
              <span className="text-muted-foreground text-right">{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrientacaoVideo;
