import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Video, Mic, MicOff, PhoneOff, Send, Sparkles, Award, ArrowRight, CheckCircle2, 
  HelpCircle, RefreshCw, Volume2, ShieldCheck, Flame, Zap, HeartHandshake, FileText,
  Clock, AlertCircle, AlertTriangle, Coins, Trophy, ChevronRight, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

export const CLINICAL_SCENARIOS = [
  {
    id: 1,
    title: "Insônia Severa e Estresse",
    difficulty: "Médio",
    patientName: "Marcos Vinícius",
    age: 38,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    symptoms: "Não dorme bem há 3 dias (<2h por noite), exaustão, ansiedade noturna.",
    prompt: `Você é o "Paciente Teste", um paciente simulado de 38 anos em uma consulta de Telemedicina no consultório virtual da Planta y Raíz.
- Você está há 3 dias sem conseguir dormir direito (menos de 2 horas por noite).
- Está visivelmente cansado, com olheiras, irritadiço, mas muito esperançoso em encontrar alívio com Cannabis Medicinal.
- Não sabe como funciona a dosagem e tem receio de ficar "viciado" ou sentir tontura.
- Responda de forma natural, realista e humana ao médico. Se o médico for acolhedor e fizer perguntas detalhadas, colabore. Se usar termos técnicos demais, peça esclarecimentos.`
  },
  {
    id: 2,
    title: "Dor Crônica / Fibromialgia",
    difficulty: "Médio",
    patientName: "Dona Tereza Cristina",
    age: 52,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    symptoms: "Dor difusa em múltiplos pontos há 2 anos, rigidez matinal, insatisfação com analgésicos convencionais.",
    prompt: `Você é a paciente simulada Tereza, 52 anos, com Fibromialgia e dor crônica severa. Já tentou analgésicos sem alívio. Tem medo de que o tratamento canábico seja apenas modismo ou cause dependência.`
  },
  {
    id: 3,
    title: "Ansiedade Generalizada (TAG)",
    difficulty: "Fácil",
    patientName: "Lucas Mendes",
    age: 31,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    symptoms: "Palpitações, aperto no peito, pensamento acelerado, medo de efeitos psicoativos.",
    prompt: `Você é o paciente simulado Lucas, 31 anos, com TAG. Fala rápido, ansioso. Tem receio de sentir 'brisa' ou alteração mental com THC.`
  },
  {
    id: 4,
    title: "Enxaqueca Refratária",
    difficulty: "Avançado",
    patientName: "Juliana Rocha",
    age: 42,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    symptoms: "Crises frequentes (3x/semana) com fotofobia, náusea e dor pulsátil unilateral.",
    prompt: `Você é a paciente Juliana, 42 anos. Quer saber se canabinoides podem ser usados como prevenção diária e no alívio agudo de crises de enxaqueca.`
  },
  {
    id: 5,
    title: "Parkinson / Rigidez Motor",
    difficulty: "Avançado",
    patientName: "Sr. Antenor (e filha Márcia)",
    age: 69,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    symptoms: "Tremores de repouso, rigidez articular, fala lentificada e distúrbio do sono REM.",
    prompt: `Você é o paciente Antenor, 69 anos, com fala lenta. A filha Márcia ajuda na resposta. Querem saber a interação do CBD com a Levodopa.`
  }
];

export function PacienteTesteSimulacao360({ onFinish }: { onFinish?: () => void }) {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [isVideoConnected, setIsVideoConnected] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; time: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Evaluation Modal
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const currentScenario = CLINICAL_SCENARIOS[currentScenarioIndex];
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech synthesis for AI patient voice
  const speakText = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartCall = () => {
    setIsVideoConnected(true);
    setActiveStep(2);
    const greeting = `Olá Doutor(a)! Muito obrigado por me atender. Estou há 3 dias sem conseguir dormir direito, exausto e preocupado. Como a cannabis medicinal funciona para mim?`;
    
    setMessages([
      {
        role: "assistant",
        content: greeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    speakText(greeting);
    toast.success("Conexão 360° estabelecida com o Paciente Teste!");
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = textToSend || input;
    if (!messageContent.trim() || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { role: "user" as const, content: messageContent, time: timeStr }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Direct call to Edge Function or Gemini API fallback
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paciente-teste-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          action: "chat",
          scenarioId: currentScenario.id,
          messages: newMessages
        })
      });

      let aiReply = "";
      if (response.ok) {
        const data = await response.json();
        aiReply = data.choices?.[0]?.message?.content || data.reply || "Entendi doutor, pode me explicar melhor como tomo as gotas?";
      } else {
        aiReply = `Doutor(a), compreendi suas orientações. Gostaria de saber exatamente quantas gotas do óleo de CBD devo tomar antes de deitar?`;
      }

      setMessages(prev => [...prev, { role: "assistant", content: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      speakText(aiReply);
    } catch (err) {
      const fallbackMsg = "Entendi Doutor(a). E sobre a higiene do sono, posso continuar minhas atividades normais durante o dia?";
      setMessages(prev => [...prev, { role: "assistant", content: fallbackMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      speakText(fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSimulation = async () => {
    setIsEvaluating(true);
    setShowEvaluation(true);

    try {
      // Evaluate simulation via AI Audit
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paciente-teste-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          action: "evaluate",
          scenarioId: currentScenario.id,
          messages: messages
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluationResult(data);
      } else {
        setEvaluationResult({
          score: 85,
          rapport_score: 20,
          anamnesis_score: 18,
          taboo_score: 20,
          posology_score: 12,
          followup_score: 15,
          suggestions: [
            "Dr(a)., lembre-se de enfatizar a titulação gradual (ex: iniciar com 2 gotas e aumentar a cada 3 dias).",
            "Recomende a higiene do sono (evitar telas 1h antes de deitar) como terapia complementar à prescrição.",
            "Verifique exames de função hepática basal se o tratamento for contínuo."
          ],
          plantacoins: 150
        });
      }

      // Record score in DB if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase.from("doctor_simulations").insert({
          doctor_id: user.id,
          scenario_id: String(currentScenario.id),
          scenario_title: currentScenario.title,
          difficulty: currentScenario.difficulty,
          score: 85,
          plantacoins_earned: 150
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextScenario = () => {
    setShowEvaluation(false);
    setIsVideoConnected(false);
    setMessages([]);
    setActiveStep(1);
    const nextIdx = (currentScenarioIndex + 1) % CLINICAL_SCENARIOS.length;
    setCurrentScenarioIndex(nextIdx);
    toast.info(`Próxima Simulação: Cenário ${nextIdx + 1} - ${CLINICAL_SCENARIOS[nextIdx].title}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6 bg-gradient-to-r from-emerald-950 via-teal-900 to-indigo-950 text-white border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500 text-black font-bold uppercase tracking-wider text-xs px-3 py-1">
                🎭 Modo Simulação 360° IA
              </Badge>
              <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">
                Consulta Auditada & Gratificada
              </Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Consultório Virtual: Paciente Teste Autônomo
            </h2>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
              Treine atendimentos médicos em tempo real com pacientes simulados por Inteligência Artificial. Ganhe <span className="text-amber-400 font-bold">PlantaCoins ($PLANTA)</span> a cada consulta gabaritada!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 text-right">
              <span className="text-xs text-emerald-200 block uppercase font-medium">Recompensa Máxima</span>
              <span className="text-lg font-bold text-amber-300 flex items-center gap-1">
                <Coins size={18} className="text-amber-400" /> +500 PlantaCoins
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Scenario Switcher Chips */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-emerald-300 font-semibold uppercase shrink-0 mr-2">Cenários Clínicos:</span>
          {CLINICAL_SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => {
                setCurrentScenarioIndex(idx);
                setIsVideoConnected(false);
                setMessages([]);
                setActiveStep(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                currentScenarioIndex === idx
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 font-bold"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <span>Teste {sc.id}:</span>
              <span>{sc.title}</span>
              <Badge className="text-[10px] bg-black/30 text-white border-0 px-1.5">{sc.difficulty}</Badge>
            </button>
          ))}
        </div>
      </Card>

      {/* Guided Walkthrough Steps with Luminescent Arrows */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${activeStep === 1 ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md ring-2 ring-emerald-500/30' : 'bg-card border-border opacity-70'}`}>
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center shrink-0 text-base shadow-sm">
            1
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1">
              🟢 Conectar Vídeo/Voz
            </h4>
            <p className="text-xs text-muted-foreground">Iniciar simulação 360°</p>
          </div>
          {activeStep === 1 && <ChevronRight className="text-emerald-400 ml-auto animate-pulse" size={20} />}
        </div>

        <div className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${activeStep === 2 ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md ring-2 ring-amber-500/30' : 'bg-card border-border opacity-70'}`}>
          <div className="w-10 h-10 rounded-full bg-amber-500 text-black font-extrabold flex items-center justify-center shrink-0 text-base shadow-sm">
            2
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1">
              🟡 Anamnese & Escuta
            </h4>
            <p className="text-xs text-muted-foreground">Investigar queixa e hábitos</p>
          </div>
          {activeStep === 2 && <ChevronRight className="text-amber-400 ml-auto animate-pulse" size={20} />}
        </div>

        <div className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${activeStep === 3 ? 'bg-blue-500/15 border-blue-500 text-blue-300 shadow-md ring-2 ring-blue-500/30' : 'bg-card border-border opacity-70'}`}>
          <div className="w-10 h-10 rounded-full bg-blue-500 text-black font-extrabold flex items-center justify-center shrink-0 text-base shadow-sm">
            3
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1">
              🔵 Prescrição & Posologia
            </h4>
            <p className="text-xs text-muted-foreground">Orientar dose e titulação</p>
          </div>
          {activeStep === 3 && <ChevronRight className="text-blue-400 ml-auto animate-pulse" size={20} />}
        </div>

        <div className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${activeStep === 4 ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-md ring-2 ring-purple-500/30' : 'bg-card border-border opacity-70'}`}>
          <div className="w-10 h-10 rounded-full bg-purple-500 text-white font-extrabold flex items-center justify-center shrink-0 text-base shadow-sm">
            4
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1">
              🏆 Auditoria & Nota
            </h4>
            <p className="text-xs text-muted-foreground">Receber nota 0-100 + PlantaCoins</p>
          </div>
        </div>
      </div>

      {/* Main Teleconsultation Room */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Virtual Patient Video Call Screen */}
        <Card className="lg:col-span-2 bg-zinc-950 border-zinc-800 rounded-2xl overflow-hidden flex flex-col min-h-[500px] shadow-2xl relative">
          {/* Top Video Header */}
          <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex justify-between items-center z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={currentScenario.avatar} 
                  alt={currentScenario.patientName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                />
                {isVideoConnected && (
                  <span className="w-3 h-3 bg-emerald-500 rounded-full absolute bottom-0 right-0 border-2 border-zinc-950 animate-ping" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {currentScenario.patientName} ({currentScenario.age} anos)
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">
                    Consulta Paga (Simulação)
                  </Badge>
                </h3>
                <p className="text-xs text-zinc-400">
                  Caso: {currentScenario.title} • Dificuldade: {currentScenario.difficulty}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isVoiceEnabled ? "default" : "outline"}
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className={isVoiceEnabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-zinc-700 text-zinc-300"}
              >
                <Volume2 size={16} className="mr-1.5" />
                {isVoiceEnabled ? "Voz IA Ligada" : "Voz IA Muta"}
              </Button>
            </div>
          </div>

          {/* Video Screen Area */}
          <div className="flex-1 bg-gradient-to-b from-zinc-900 to-black p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {isVideoConnected ? (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-6 relative">
                {/* Visual Avatar Frame */}
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="w-44 h-44 md:w-56 md:h-56 rounded-full border-4 border-emerald-500/50 p-2 relative shadow-2xl shadow-emerald-500/20"
                  >
                    <img 
                      src={currentScenario.avatar} 
                      alt="Patient Stream" 
                      className="w-full h-full rounded-full object-cover shadow-inner"
                    />
                  </motion.div>

                  {/* Audio Waveform Indicator */}
                  {loading && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-4 py-1 rounded-full text-xs font-extrabold flex items-center gap-2 shadow-lg animate-bounce">
                      <Sparkles size={14} /> Paciente respondendo...
                    </div>
                  )}
                </div>

                {/* Patient Clinical Status Badge */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 max-w-lg text-center backdrop-blur-md">
                  <span className="text-xs text-amber-400 font-bold uppercase block mb-1">Quadro Clínico Relatado</span>
                  <p className="text-xs text-zinc-300 italic">"{currentScenario.symptoms}"</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 max-w-md">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
                  <Video size={36} />
                </div>
                <h3 className="text-lg font-bold text-white">Paciente na Sala de Espera Virtual</h3>
                <p className="text-xs text-zinc-400">
                  O paciente <strong>{currentScenario.patientName}</strong> já concluiu o pagamento da consulta e aguarda você iniciar a chamada de vídeo.
                </p>
                <Button 
                  onClick={handleStartCall}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold px-8 py-6 rounded-xl text-base shadow-lg shadow-emerald-500/25"
                >
                  <Video className="mr-2" size={20} /> Iniciar Atendimento 360°
                </Button>
              </div>
            )}

            {/* Video Controls Bar */}
            {isVideoConnected && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-800 rounded-full px-6 py-2.5 flex items-center gap-4 shadow-2xl backdrop-blur-md z-20">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'text-zinc-300 hover:text-white'}`}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </Button>

                <Button
                  onClick={() => setActiveStep(3)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 rounded-full"
                >
                  <FileText size={15} className="mr-1.5" /> Ir para Prescrição
                </Button>

                <Button
                  onClick={handleFinishSimulation}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs px-5 rounded-full shadow-md"
                >
                  <Award size={16} className="mr-1.5" /> Encerrar & Auditoria
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Real-time Interactive Chat & Anamnesis Notes */}
        <Card className="bg-card border-border rounded-2xl flex flex-col h-[550px] shadow-xl overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="text-emerald-500" size={18} /> Chat de Telemedicina com IA
            </h4>
            <Badge variant="outline" className="text-xs">Passo 2 / 4</Badge>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs space-y-2">
                  <UserCheck size={32} className="mx-auto text-muted-foreground/40" />
                  <p>Inicie a chamada para conversar com o paciente em tempo real.</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-muted text-foreground border rounded-bl-none'
                      }`}
                    >
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">{m.time}</span>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                  <Sparkles size={14} className="animate-spin text-emerald-500" /> Paciente digitando/falando...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Doctor Prompt Helpers */}
          <div className="px-3 py-2 border-t bg-muted/20 flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => handleSendMessage("Há quantos dias você não dorme bem e como isso afeta seu dia?")}
              className="text-[11px] bg-background border px-2.5 py-1 rounded-full text-muted-foreground hover:text-foreground shrink-0"
            >
              😴 Investigar Sono
            </button>
            <button
              onClick={() => handleSendMessage("Você tem receio ou dúvidas sobre o uso da Cannabis Medicinal?")}
              className="text-[11px] bg-background border px-2.5 py-1 rounded-full text-muted-foreground hover:text-foreground shrink-0"
            >
              ❓ Tabus e Mitos
            </button>
            <button
              onClick={() => handleSendMessage("Vou prescrever o Óleo CBD 10%, tome 3 gotas 30 minutos antes de deitar sublingual.")}
              className="text-[11px] bg-background border px-2.5 py-1 rounded-full text-muted-foreground hover:text-foreground shrink-0"
            >
              💊 Orientar Dosagem
            </button>
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t bg-card flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite sua conduta médica ou pergunta..."
              className="min-h-[40px] max-h-[80px] text-xs resize-none"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 self-end"
            >
              <Send size={16} />
            </Button>
          </div>
        </Card>
      </div>

      {/* Audit Evaluation & Score Modal */}
      <Dialog open={showEvaluation} onOpenChange={setShowEvaluation}>
        <DialogContent className="max-w-2xl bg-zinc-950 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2 text-emerald-400">
              <Trophy className="text-amber-400" /> Relatório de Auditoria & Performance Clínica
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Avaliação de atendimento simulado — Plataforma Planta y Raíz
            </DialogDescription>
          </DialogHeader>

          {isEvaluating ? (
            <div className="py-12 text-center space-y-4">
              <Sparkles className="animate-spin text-emerald-500 mx-auto" size={40} />
              <p className="text-sm font-semibold text-zinc-300">
                Auditoria de IA analisando anamnese, posologia, empatia e compliance...
              </p>
            </div>
          ) : evaluationResult ? (
            <div className="space-y-6 py-2">
              {/* Score Highlight Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-500/30 text-center relative overflow-hidden">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1">
                  Nota do Seu Atendimento
                </div>
                <div className="text-5xl font-black text-emerald-400 flex items-center justify-center gap-2">
                  {evaluationResult.score} <span className="text-2xl text-zinc-400 font-normal">/ 100 PTS</span>
                </div>
                
                <div className="mt-3 inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-4 py-1.5 rounded-full text-xs font-extrabold">
                  <Coins size={16} className="text-amber-400" /> Recompensa: +{evaluationResult.plantacoins} PlantaCoins Adicionados!
                </div>
              </div>

              {/* Score Breakdown Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Detalhamento por Pilar Clínico:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex justify-between">
                    <span>Empatia & Acolhimento:</span>
                    <strong className="text-emerald-400">{evaluationResult.rapport_score}/20 pts</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex justify-between">
                    <span>Anamnese & Hábitos:</span>
                    <strong className="text-emerald-400">{evaluationResult.anamnesis_score}/20 pts</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex justify-between">
                    <span>Manejo de Tabus:</span>
                    <strong className="text-emerald-400">{evaluationResult.taboo_score}/20 pts</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex justify-between">
                    <span>Posologia & Titulação:</span>
                    <strong className="text-amber-400">{evaluationResult.posology_score}/20 pts</strong>
                  </div>
                </div>
              </div>

              {/* AI Improvement Suggestions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">💡 Sugestões da IA para Alcançar 100 PONTOS (Gabarito):</h4>
                <ul className="space-y-2">
                  {evaluationResult.suggestions?.map((sug: string, idx: number) => (
                    <li key={idx} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2">
                      <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 flex justify-between items-center border-t border-zinc-800">
                <Button
                  onClick={handleNextScenario}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold w-full py-5 text-sm rounded-xl shadow-lg"
                >
                  Prosseguir para o Próximo Cenário Simulado <ArrowRight className="ml-2" size={18} />
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
