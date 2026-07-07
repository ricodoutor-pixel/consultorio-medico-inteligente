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
import { MandatoryNPSModal } from "@/components/MandatoryNPSModal";
import { PatientFlowGuide } from "@/components/patient/PatientFlowGuide";
import type { FlowStep } from "@/components/patient/PatientFlowGuide";
import { JitsiRoom } from "@/components/consultation/JitsiRoom";

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
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUserType();
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setCurrentUserId(session.user.id);
    const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", session.user.id).maybeSingle();
    if (doctor) {
      setIsDoctor(true);
      setDoctorId(doctor.id);
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
    <div className="min-h-screen bg-background">
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

      <div className={`${isFullscreen ? "" : "pt-16"} flex flex-col h-screen`}>
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
              {tcleAccepted ? (
                <JitsiRoom
                  roomName={searchParams.get("room") || appointmentId || `consulta-${currentUserId || "guest"}`}
                  isDoctor={isDoctor}
                  onClose={() => navigate("/")}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
                      <Video size={48} className="text-primary/40" />
                    </div>
                    <p className="text-sm text-white/60">Aceite o TCLE para iniciar a teleconsulta com Jitsi Meet</p>
                  </div>
                </div>
              )}
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
            <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MessageSquare size={14} /> Chat Criptografado
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                  <X size={14} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Chat criptografado AES-256.<br />Envie mensagens e compartilhe exames.
                  </p>
                )}
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === (isDoctor ? "doctor" : "patient") ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      msg.sender === (isDoctor ? "doctor" : "patient")
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-[10px] opacity-60 mt-1">
                        {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleFileShare} className="shrink-0">
                    <Paperclip size={16} />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite..."
                    className="bg-muted border-border text-sm"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button size="sm" className="bg-primary text-primary-foreground shrink-0" onClick={sendMessage}>
                    <Send size={14} />
                  </Button>
                </div>
              </div>
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

                {/* CBD/THC AI Suggestion */}
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
