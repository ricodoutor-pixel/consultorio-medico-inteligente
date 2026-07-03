import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Video, Phone, MessageCircle, User, Clock, FileText, Share2, Search,
  CheckCircle2, XCircle, Info, Send, Loader2, Copy, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PatientInfo {
  id: string;
  name: string;
  cpf: string;
  age: number;
  phone: string;
  symptoms: string;
  medicalHistory: string;
}

interface ConsultationMessage {
  id: string;
  sender: "doctor" | "patient";
  content: string;
  timestamp: Date;
}

interface ConsultationMonitorDashboardProps {
  appointmentId?: string;
}

export function ConsultationMonitorDashboard({ appointmentId }: ConsultationMonitorDashboardProps) {
  const [isActive, setIsActive] = useState(false);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [cpfSearch, setCpfSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAcceptConsultation = () => {
    setIsActive(true);
    toast.success("✅ Consulta aceita! Iniciando atendimento...");
  };

  const handleRejectConsultation = () => {
    setIsActive(false);
    setPatient(null);
    setMessages([]);
    toast.info("Consulta rejeitada");
  };

  const handleReadPatientInfo = async () => {
    if (!appointmentId) {
      toast.error("Nenhuma consulta selecionada");
      return;
    }

    try {
      setLoading(true);
      // Simular carregamento de informações do paciente
      const mockPatient: PatientInfo = {
        id: "p-001",
        name: "Maria Silva Santos",
        cpf: "***.***.789-01",
        age: 45,
        phone: "(11) 99999-9999",
        symptoms: "Dor crônica nas costas, insônia leve, ansiedade",
        medicalHistory: "Hipertensão controlada, sem alergias conhecidas",
      };

      setPatient(mockPatient);
      toast.success("📋 Informações do paciente carregadas");
    } catch (err) {
      console.error("Erro ao carregar informações:", err);
      toast.error("Erro ao carregar informações do paciente");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPatient = async () => {
    if (!cpfSearch.trim()) {
      toast.error("Digite um CPF para buscar");
      return;
    }

    try {
      setLoading(true);
      // Simular busca por CPF
      const mockPatient: PatientInfo = {
        id: "p-search-001",
        name: "João Santos Costa",
        cpf: cpfSearch,
        age: 32,
        phone: "(11) 98888-8888",
        symptoms: "Ansiedade generalizada, pânico noturno",
        medicalHistory: "Sem comorbidades, faz uso de melatonina",
      };

      setPatient(mockPatient);
      setCpfSearch("");
      toast.success("✅ Paciente encontrado");
    } catch (err) {
      console.error("Erro na busca:", err);
      toast.error("Paciente não encontrado");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !isActive) return;

    const newMessage: ConsultationMessage = {
      id: Date.now().toString(),
      sender: "doctor",
      content: messageInput,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");

    // Simular resposta do paciente após 2 segundos
    setTimeout(() => {
      const patientResponse: ConsultationMessage = {
        id: (Date.now() + 1).toString(),
        sender: "patient",
        content: "Entendi, doutor. Vou seguir as orientações.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, patientResponse]);
    }, 2000);
  };

  const handleShareDashboard = () => {
    const shareUrl = `${window.location.origin}/doctor-card/${patient?.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("✅ Link copiado para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ═══════════════════════════════════════════════════════
          ÁREA PRINCIPAL — VÍDEO DO PACIENTE
          ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Área de Vídeo */}
        <Card className="flex-1 bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white space-y-4"
          >
            {isActive ? (
              <>
                <Video className="h-16 w-16 mx-auto text-green-400 animate-pulse" />
                <p className="text-lg font-semibold">Vídeo em Tempo Real</p>
                <p className="text-sm text-gray-400">Conexão ativa com {patient?.name}</p>
              </>
            ) : (
              <>
                <Phone className="h-16 w-16 mx-auto text-gray-600" />
                <p className="text-lg font-semibold">Aguardando Consulta</p>
                <p className="text-sm text-gray-400">Clique em "Aceitar Consulta" para iniciar</p>
              </>
            )}
          </motion.div>
        </Card>

        {/* Controles Inferiores */}
        <div className="flex gap-3 items-center justify-center">
          <Button
            size="lg"
            className="gap-2 bg-green-600 hover:bg-green-700 text-white px-8"
            onClick={handleAcceptConsultation}
            disabled={isActive}
          >
            <CheckCircle2 className="h-5 w-5" />
            Aceitar Consulta
          </Button>

          <Button
            size="lg"
            variant="destructive"
            className="gap-2 px-8"
            onClick={handleRejectConsultation}
            disabled={!isActive}
          >
            <XCircle className="h-5 w-5" />
            Rejeitar Consulta
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="gap-2 px-8"
            onClick={handleReadPatientInfo}
            disabled={loading}
          >
            <Info className="h-5 w-5" />
            Ler Informações
          </Button>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════
          SIDEBAR DIREITA — INFORMAÇÕES E CHAT
          ═══════════════════════════════════════════════════════ */}
      <aside className="w-96 flex flex-col gap-4 min-w-0">
        {/* Informações do Paciente */}
        <Card className="p-4 rounded-xl border-blue-200/50 bg-blue-50/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-blue-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Paciente
            </h3>
            {patient && (
              <Badge className="bg-blue-600 text-white">Ativo</Badge>
            )}
          </div>

          {patient ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-blue-700 font-medium">Nome</p>
                <p className="font-semibold text-blue-900">{patient.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-blue-700 font-medium">CPF</p>
                  <p className="font-mono text-blue-900">{patient.cpf}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Idade</p>
                  <p className="font-semibold text-blue-900">{patient.age} anos</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">Telefone</p>
                <p className="font-mono text-blue-900">{patient.phone}</p>
              </div>
              <Separator className="bg-blue-200/50" />
              <div>
                <p className="text-xs text-blue-700 font-medium mb-1">Sintomas</p>
                <p className="text-xs text-blue-800 leading-relaxed">{patient.symptoms}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium mb-1">Histórico Médico</p>
                <p className="text-xs text-blue-800 leading-relaxed">{patient.medicalHistory}</p>
              </div>
              <Button
                size="sm"
                className="w-full gap-2 mt-2 bg-blue-600 hover:bg-blue-700"
                onClick={handleShareDashboard}
              >
                <Share2 className="h-4 w-4" />
                Compartilhar Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-blue-900">Buscar por CPF</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="000.000.000-00"
                    value={cpfSearch}
                    onChange={(e) => setCpfSearch(e.target.value)}
                    className="text-sm"
                    disabled={loading}
                  />
                  <Button
                    size="sm"
                    onClick={handleSearchPatient}
                    disabled={loading || !cpfSearch.trim()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-blue-700 text-center py-4">Nenhum paciente selecionado</p>
            </div>
          )}
        </Card>

        {/* Chat */}
        <Card className="flex-1 flex flex-col rounded-xl border-purple-200/50 bg-purple-50/50 min-h-0">
          <div className="p-4 border-b border-purple-200/50 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-purple-900 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat da Consulta
            </h3>
            {isActive && (
              <Badge className="bg-green-600 text-white animate-pulse">Ao Vivo</Badge>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground/40 text-center">
                  <div>
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Nenhuma mensagem ainda</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === "doctor" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          msg.sender === "doctor"
                            ? "bg-purple-600 text-white rounded-br-none"
                            : "bg-white border border-purple-200/50 text-purple-900 rounded-bl-none"
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === "doctor"
                            ? "text-purple-200"
                            : "text-purple-600"
                        }`}>
                          {msg.timestamp.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input de Chat */}
          <div className="p-4 border-t border-purple-200/50 space-y-2">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="resize-none min-h-[60px] text-sm"
              disabled={!isActive}
            />
            <Button
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={handleSendMessage}
              disabled={!isActive || !messageInput.trim()}
            >
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          </div>
        </Card>
      </aside>
    </div>
  );
}

export default ConsultationMonitorDashboard;
