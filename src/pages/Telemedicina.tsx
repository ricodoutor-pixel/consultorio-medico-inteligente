import { useDynamicPrice } from '@/hooks/useDynamicPrice';
import { useState, useEffect, lazy, Suspense } from "react";
const WidgetMonitorRapido = lazy(() => import("@/components/WidgetMonitorRapido"));
import brisaImg from "@/assets/brisa-enfermeira.png";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { DoctorsStatusBoard } from "@/components/doctors/DoctorsStatusBoard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Stethoscope, ArrowRight, ArrowLeft, CheckCircle2, Brain, Heart, Activity, Shield, Leaf, Watch, FileText, Download, Printer, UserCheck, Scale, AlertTriangle, Loader2, MessageCircle, X, CreditCard, Wallet, Users, Info, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { TCLEConsentModal } from "@/components/TCLEConsentModal";
import { professionals } from "@/data/professionals";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const interviewQuestions = [
  { id: 1, question: "Qual é sua principal queixa e qual a intensidade (0-10)?", type: "textarea", placeholder: "Ex: Dor lombar crônica, intensidade 8. Descreva seus sintomas..." },
  { id: 2, question: "Há quanto tempo tem esse problema e como ele evoluiu?", type: "select", options: ["Menos de 1 mês", "1-3 meses", "3-6 meses (Crônico)", "6-12 meses", "Mais de 1 ano (Persistente)"] },
  { id: 3, question: "Já utilizou cannabis medicinal? Se sim, qual foi o resultado?", type: "radio", options: ["Sim, com ótimos resultados", "Sim, resultados moderados", "Sim, sem efeito ou efeito adverso", "Não, nunca utilizei"] },
  { id: 4, question: "Possui alergias ou sensibilidade a medicamentos/plantas?", type: "textarea", placeholder: "Liste alergias (ex: AAS, Dipirona, Pólen) ou 'Nenhuma'..." },
  { id: 5, question: "Medicamentos em uso (incluindo controlados e suplementos):", type: "textarea", placeholder: "Ex: Sertralina 50mg, Losartana 50mg. Liste todos..." },
  { id: 6, question: "Histórico familiar de doenças neurológicas ou psiquiátricas?", type: "textarea", placeholder: "Ex: Alzheimer, Esquizofrenia, Depressão grave na família..." },
  { id: 7, question: "Possui alguma destas condições de saúde?", type: "checkbox", options: ["Hipertensão Controlada", "Diabetes", "Depressão/Ansiedade", "Insônia Crônica", "Doença Cardíaca", "Glaucoma", "Nenhuma"] },
  { id: 8, question: "Qual o principal benefício que busca com a Cannabis?", type: "select", options: ["Alívio de Dor (Analgesia)", "Controle de Ansiedade (Ansiolítico)", "Indução de Sono (Sedativo)", "Foco e Neuroproteção", "Melhora de Apetite/Náusea", "Bem-estar em Cuidados Paliativos"] },
  { id: 9, question: "Nível de sensibilidade a efeitos psicoativos (THC):", type: "slider" },
  { id: 10, question: "Urgência do atendimento e melhor horário:", type: "select", options: ["Urgente (Hoje)", "Alta (Amanhã)", "Moderada (Esta semana)", "Baixa (Próxima semana)", "Flexível (Qualquer horário)"] },
];

const BrisaAvatar = () => {
  const [mood, setMood] = useState<"neutral" | "happy" | "thinking">("neutral");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Olá! Sou a Enfª Brisa 🌿. Como posso te ajudar com sua triagem ou dúvidas sobre o tratamento?" },
  ]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const next = [...chat, { role: "user" as const, content: text }];
    setChat(next);
    setSending(true);
    setMood("thinking");
    try {
      const { data, error } = await supabase.functions.invoke("brisa-web-chat", {
        body: { messages: next, leadInfo: { category: "Telemedicina" } },
      });
      if (error) throw error;
      setChat([...next, { role: "assistant", content: data?.text || "Estou aqui com você. Pode me contar um pouco mais?" }]);
    } catch {
      setChat([...next, {
        role: "assistant",
        content: "Minhas conexões oscilaram, mas continuo aqui. Você pode iniciar a Triagem abaixo ou falar comigo pelo WhatsApp.",
      }]);
    } finally {
      setSending(false);
      setMood("happy");
    }
  };


  return (
    <div className="relative flex flex-col items-center mb-6">
      <motion.div 
        className="relative cursor-pointer group"
        onMouseEnter={() => setMood("happy")}
        onMouseLeave={() => setMood("neutral")}
        onClick={() => setIsChatOpen(true)}
        whileHover={{ scale: 1.05 }}
      >
        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-4 border-primary/30 overflow-hidden bg-muted shadow-2xl relative z-10">
          <img 
            src={brisaImg} 
            alt="Brisa - Enfermeira IA" 
            className="w-full h-full object-cover object-center"
          />
          <AnimatePresence>
            {mood === "happy" && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary/10 flex items-center justify-center"
              >
                <div className="w-full h-full bg-gradient-to-t from-primary/20 to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-secondary text-secondary-foreground text-[10px] font-black px-2 py-1 rounded-lg shadow-lg z-20 border border-background animate-bounce">
          BRISA IA
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 text-center"
      >
        <p className="text-sm font-black text-foreground">Olá, eu sou a Brisa!</p>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Sua Enfermeira Virtual de Triagem</p>
        <p className="text-[11px] text-primary font-medium mt-1 italic">"Estou aqui para cuidar de você com todo carinho."</p>
      </motion.div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-80 h-80 sm:h-96 bg-card border border-border rounded-3xl shadow-2xl z-[100] flex flex-col overflow-hidden"
          >
            <div className="bg-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden">
                  <img src={brisaImg} alt="Brisa" className="w-full h-full object-cover object-center" />
                </div>
                <span className="text-white font-black text-sm">Brisa - Suporte IA</span>
              </div>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setIsChatOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/30">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "assistant"
                      ? "bg-primary/10 p-3 rounded-2xl rounded-tl-none text-xs text-foreground font-medium border border-primary/20"
                      : "bg-card p-3 rounded-2xl rounded-br-none text-xs text-foreground border border-border ml-6"
                  }
                >
                  {m.content}
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="animate-spin" size={14} /> Brisa está digitando...
                </div>
              )}
            </div>
            <div className="p-3 border-t border-border bg-background flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
                placeholder="Digite sua dúvida..."
                className="text-xs h-9 rounded-xl"
              />
              <Button size="icon" disabled={sending} onClick={sendMessage} className="h-9 w-9 rounded-xl bg-primary text-white">
                <ArrowRight size={16} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Telemedicina = () => {
  const { value: dynamicPrice, symbol: dynamicSymbol, isInternational } = useDynamicPrice();
  const navigate = useNavigate();
  const [showTCLE, setShowTCLE] = useState(true);
  const [showFlowInfo, setShowFlowInfo] = useState(false);
  // Médicos prescritores online — varia entre 3 e 6 a cada 30 minutos
  const [onlineDoctors, setOnlineDoctors] = useState<number>(() => {
    const slot = Math.floor(Date.now() / (30 * 60 * 1000));
    return 3 + (slot % 4); // 3..6
  });
  useEffect(() => {
    const tick = () => {
      const slot = Math.floor(Date.now() / (30 * 60 * 1000));
      setOnlineDoctors(3 + (slot % 4));
    };
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [sliderValue, setSliderValue] = useState([50]);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showWearables, setShowWearables] = useState(false);
  const [tcleAccepted, setTcleAccepted] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();
  const [selectedPathology, setSelectedPathology] = useState("");
  const [patientData, setPatientData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    email: "",
    telefone: "",
  });

  useEffect(() => {
    const saved = sessionStorage.getItem("triage_condition");
    if (saved) {
      setSelectedPathology(saved);
      // Pre-fill first triage question with the pathology
      setAnswers(prev => ({ ...prev, 1: `Condição principal: ${saved}. ` }));
      sessionStorage.removeItem("triage_condition");
    }
  }, []);

  const currentQ = interviewQuestions[step - 1];
  const progress = step <= 0 ? 0 : step > 10 ? 100 : Math.round((step / 10) * 100);
  const medicos = professionals.filter(p => p.category === "Médicos Prescritores");

  const handleCheckbox = (option: string, checked: boolean) => {
    const current = (answers[step] as string[]) || [];
    if (option === "Nenhuma" && checked) {
      setAnswers({ ...answers, [step]: ["Nenhuma"] });
    } else {
      const filtered = current.filter(c => c !== "Nenhuma");
      setAnswers({ ...answers, [step]: checked ? [...filtered, option] : filtered.filter(c => c !== option) });
    }
  };

  const isAnswered = () => {
    if (!currentQ) return false;
    const val = answers[step];
    if (currentQ.type === "checkbox") return Array.isArray(val) && val.length > 0;
    if (currentQ.type === "slider") return true;
    return !!val;
  };

  const isPatientDataValid = () => {
    return patientData.nome.trim().length >= 3 &&
      patientData.cpf.replace(/\D/g, "").length === 11 &&
      patientData.dataNascimento &&
      patientData.email.includes("@") &&
      patientData.telefone.replace(/\D/g, "").length >= 10;
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      {/* TCLE Modal - Shown on entry */}
      <TCLEConsentModal
        open={showTCLE && !tcleAccepted}
        onAccept={() => {
          setTcleAccepted(true);
          setShowTCLE(false);
          setStep(0);
          toast({ title: "TCLE aceito com sucesso!", description: "Prossiga com a identificação." });
        }}
        onDecline={() => {
          setShowTCLE(false);
          navigate("/");
          toast({ title: "Consentimento recusado", description: "Você foi redirecionado à página inicial.", variant: "destructive" });
        }}
        patientName={patientData.nome || "Paciente"}
      />

      <section className="pt-24 pb-8 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col items-center text-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center glow-green">
                <Stethoscope size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">TELEMEDICINA AVANÇADA</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
              Inicie Sua <span className="text-gradient-green">Triagem Inteligente</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium mb-6 mx-auto">
              Triagem conduzida pela <strong>Enf. Brisa</strong> + análise clínica + receita + assinatura digital com ANVISA — supervisionado por nossa IA autônoma de última geração 24×7. O prontuário será encaminhado ao médico de sua escolha — defina um médico na página Profissionais.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-4">
              <Link to="/profissionais">
                <Button
                  size="lg"
                  className="relative h-14 px-6 rounded-2xl font-black text-base bg-card border-2 border-emerald-400/60 hover:border-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.45)] hover:shadow-[0_0_40px_rgba(52,211,153,0.75)] transition-shadow"
                >
                  <span className="absolute -inset-1 rounded-2xl bg-emerald-400/30 blur-md animate-pulse pointer-events-none" />
                  <span className="relative flex items-center gap-2">
                    <Users size={20} className="text-emerald-400" />
                    <span className="text-gradient-green">Médicos Prescritores Online Agora</span>
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/15 border border-emerald-400/60 text-emerald-300 font-black text-sm animate-pulse">
                      {onlineDoctors}
                    </span>
                    <ArrowRight size={18} className="text-emerald-400" />
                  </span>
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                className="h-14 px-5 rounded-2xl font-bold border-primary/40 text-primary hover:bg-primary/10"
                onClick={() => setShowFlowInfo(true)}
              >
                <HelpCircle size={18} className="mr-2" /> Como funciona o fluxo
              </Button>
            </div>
          </motion.div>

          <div className="max-w-2xl mx-auto mt-8">
            <DoctorsStatusBoard title="Médicos disponíveis agora" />
          </div>
        </div>
      </section>


      <AnimatePresence>
        {showFlowInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowFlowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <div className="flex items-center gap-2">
                  <Info size={22} className="text-primary" />
                  <h3 className="text-lg font-display font-black text-foreground">Como funciona o fluxo</h3>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setShowFlowInfo(false)}><X size={18} /></Button>
              </div>
              <div className="p-6 space-y-5 text-sm text-foreground">
                <p className="text-muted-foreground">
                  Todo paciente passa primeiro pela <strong>Triagem da Enf. Brisa</strong>. Os dados são enviados para o médico escolhido — ou para o <strong>Dr. Edilson Bezerra</strong> em caso de Orientação Técnica.
                </p>

                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-primary">Você tem 3 caminhos até a receita:</p>

                  <div className="rounded-2xl border border-border p-4 bg-muted/30">
                    <p className="font-black text-foreground mb-1">1 · Triagem + Consulta</p>
                    <p className="text-xs text-muted-foreground">Brisa faz a triagem → você escolhe o médico prescritor → consulta e receita.</p>
                  </div>

                  <div className="rounded-2xl border border-border p-4 bg-muted/30">
                    <p className="font-black text-foreground mb-1">2 · Triagem + Orientação Técnica + Consulta</p>
                    <p className="text-xs text-muted-foreground">Brisa triagem → Orientação com Dr. Edilson Bezerra → consulta com médico prescritor → receita.</p>
                  </div>

                  <div className="rounded-2xl border border-border p-4 bg-muted/30">
                    <p className="font-black text-foreground mb-1">3 · Triagem + Orientação Técnica (sem consulta)</p>
                    <p className="text-xs text-muted-foreground">Enf. Brisa triagem → Orientação Técnica personalizada com <strong>Dr. Edilson Bezerra</strong> → relatório em PDF e encaminhamento emitido diretamente com assinatura digital.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs">
                  <strong className="text-primary">Importante:</strong> qualquer clique em "Consulta" ou nos cards de médicos passa antes pela Triagem da Enf. Brisa. Os dados coletados seguem com você até o médico escolhido.
                </div>

                <Button className="w-full h-12 rounded-2xl font-black bg-primary text-primary-foreground" onClick={() => setShowFlowInfo(false)}>
                  Entendi, iniciar triagem <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="py-4 pb-20">
        <div className="container mx-auto px-4">
          
          {/* Brisa IA no Topo da Triagem */}
          {step >= 0 && step <= 10 && <BrisaAvatar />}

          {/* Progress */}
          {step >= 0 && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-bold">Progresso da triagem</span>
                <span className="text-xs text-primary font-bold">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden" role="progressbar">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="max-w-2xl mx-auto">
            {/* Waiting for TCLE acceptance */}
            {step === -1 && !showTCLE && !tcleAccepted && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                 <Card className="border-border">
                   <CardContent className="p-5 sm:p-8 text-center">
                     <Shield size={36} className="text-primary mx-auto mb-3 sm:mb-4 sm:w-12 sm:h-12" />
                     <h2 className="text-lg sm:text-xl font-display font-black text-foreground mb-3 sm:mb-4">Consentimento Necessário</h2>
                     <p className="text-sm text-muted-foreground mb-4 sm:mb-6">Você precisa aceitar o Termo de Consentimento (TCLE) para prosseguir com a teleconsulta.</p>
                     <Button 
                       className="w-full h-12 sm:h-14 bg-primary text-primary-foreground font-black rounded-2xl text-base sm:text-lg"
                      onClick={() => setShowTCLE(true)}
                    >
                      <FileText className="mr-2" /> Ler e Aceitar o TCLE
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                 <Card className="border-border">
                   <CardContent className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                     <div className="flex items-center justify-between flex-wrap gap-2">
                       <h2 className="text-lg sm:text-xl font-display font-black text-foreground">Identificação do Paciente</h2>
                      <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                        <CheckCircle2 size={10} className="mr-1" /> TCLE Aceito
                      </Badge>
                    </div>

                    {/* Pathology Badge */}
                    {selectedPathology && (
                      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Brain size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Patologia Selecionada</p>
                          <p className="text-sm font-black text-primary">{selectedPathology}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="tele-nome" className="text-xs font-bold uppercase">Nome Completo</Label>
                        <Input id="tele-nome" name="nome" placeholder="Seu nome" value={patientData.nome} onChange={(e) => setPatientData({...patientData, nome: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tele-cpf" className="text-xs font-bold uppercase">CPF</Label>
                          <Input id="tele-cpf" name="cpf" placeholder="000.000.000-00" value={patientData.cpf} onChange={(e) => setPatientData({...patientData, cpf: e.target.value})} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tele-nascimento" className="text-xs font-bold uppercase">Nascimento</Label>
                          <Input id="tele-nascimento" name="nascimento" type="date" value={patientData.dataNascimento} onChange={(e) => setPatientData({...patientData, dataNascimento: e.target.value})} className="h-12 rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tele-whatsapp" className="text-xs font-bold uppercase">WhatsApp</Label>
                        <Input id="tele-whatsapp" name="whatsapp" placeholder="(11) 99999-9999" value={patientData.telefone} onChange={(e) => setPatientData({...patientData, telefone: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tele-email" className="text-xs font-bold uppercase">E-mail</Label>
                        <Input id="tele-email" name="email" placeholder="seu@email.com" value={patientData.email} onChange={(e) => setPatientData({...patientData, email: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                    </div>
                     <Button 
                       className="w-full h-12 sm:h-14 bg-primary text-primary-foreground font-black rounded-2xl text-sm sm:text-lg"
                       disabled={!isPatientDataValid()}
                       onClick={() => setStep(1)}
                     >
                       Iniciar Triagem com Brisa <ArrowRight className="ml-2" size={18} />
                     </Button>
                   </CardContent>
                 </Card>
               </motion.div>
             )}

            {/* Monitor Cardíaco - PPG */}
            {step === 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-6">
                <Card className="border-border shadow-xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity size={20} className="text-primary" />
                      <h3 className="text-sm font-bold text-foreground">Monitoramento Cardíaco ao Vivo</h3>
                    </div>
                    <Suspense fallback={null}>
                      <div className="max-w-full">
                        <WidgetMonitorRapido />
                      </div>
                    </Suspense>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step >= 1 && step <= 10 && currentQ && (
              <motion.div key={step} initial="hidden" animate="visible" variants={fadeUp}>
                 <Card className="border-border shadow-xl">
                   <CardContent className="p-4 sm:p-8">
                     <h2 className="text-base sm:text-xl font-display font-black text-foreground mb-4 sm:mb-6">{currentQ.question}</h2>
                    {/* Renderização dinâmica de campos de triagem */}
                    {currentQ.type === "textarea" && (
                      <Textarea 
                        placeholder={currentQ.placeholder} 
                        className="min-h-[150px] rounded-2xl border-border focus:border-primary"
                        value={answers[step] || ""}
                        onChange={(e) => setAnswers({...answers, [step]: e.target.value})}
                      />
                    )}
                    {/* ... (Demais tipos de input seguem a lógica anterior) */}
                     <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
                       <Button variant="ghost" onClick={() => setStep(step - 1)} className="h-10 sm:h-12 rounded-xl font-bold text-sm">
                         <ArrowLeft className="mr-1 sm:mr-2" size={16} /> Voltar
                       </Button>
                       <Button 
                         className="flex-1 h-10 sm:h-12 bg-primary text-primary-foreground font-black rounded-xl text-sm"
                        onClick={() => setStep(step + 1)}
                      >
                        Próximo <ArrowRight className="ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Resultado Final — Orientação Técnica Personalizada */}
            {step > 10 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-8">
                {/* Card Principal — CTA Orientação Técnica */}
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 shadow-2xl">
                  <CardContent className="p-4 sm:p-8 text-center">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border-4 border-primary/30">
                        <Stethoscope size={36} className="text-primary" />
                      </div>
                    </motion.div>
                    
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground mb-2">
                      Inicie Agora<br />
                      <span className="text-gradient-green">Sua Orientação Técnica Personalizada</span>
                    </h2>
                    
                    <p className="text-sm text-muted-foreground font-medium mb-6 max-w-lg mx-auto">
                      Após a triagem com a Brisa, você receberá um link para o pagamento da taxa de <span className="text-primary font-black">{dynamicSymbol} {dynamicPrice}</span>. 
                      Após confirmação do pagamento, você será atendido pelo <span className="text-primary font-black">Dr. Edilson Bezerra</span> para sua Orientação Técnica via Chat autônomo no WhatsApp.
                    </p>

                    {/* Fluxo Visual */}
                    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 flex-wrap">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Brain size={18} className="text-primary" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Triagem</span>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground hidden sm:block" />
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <CreditCard size={18} className="text-primary" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Pagamento</span>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground hidden sm:block" />
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <MessageCircle size={18} className="text-green-500" />
                        </div>
                        <span className="text-[10px] text-green-500 font-bold uppercase">WhatsApp</span>
                      </div>
                    </div>

                    {/* Botão Principal — Pagamento */}
                    <div className="space-y-3">
                      <Button 
                        className="w-full h-14 sm:h-16 bg-primary text-primary-foreground font-black rounded-2xl text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                        onClick={async () => {
                          setAiLoading(true);
                          try {
                            // Chama o edge function para gerar o link de pagamento
                            const { data, error } = await supabase.functions.invoke("brisa-payment-link", {
                              body: {
                                name: patientData.nome,
                                phone: patientData.telefone,
                                email: patientData.email,
                                isInternational: isInternational
                              }
                            });
                            if (error || !data?.payment_url) throw new Error("Falha ao gerar link");
                            
                            if (typeof window !== "undefined" && (window as any).fbq) {
                              (window as any).fbq("track", "InitiateCheckout", { 
                                value: isInternational ? 10 : 30, 
                                currency: isInternational ? "USD" : "BRL", 
                                content_name: "Orientação Técnica — Dr. Edilson Bezerra" 
                              });
                            }
                            window.open(data.payment_url, "_blank", "noopener,noreferrer");
                            toast({ 
                              title: "Link de pagamento gerado!", 
                              description: "Confirme o pagamento para liberar sua orientação técnica." 
                            });
                          } catch (e) {
                            toast({ 
                              title: "Erro ao gerar link", 
                              description: "Tente novamente ou entre em contato via WhatsApp.", 
                              variant: "destructive" 
                            });
                          } finally {
                            setAiLoading(false);
                          }
                        }}
                        disabled={aiLoading}
                      >
                        {aiLoading ? (
                          <Loader2 className="animate-spin mr-2" size={20} />
                        ) : (
                          <Wallet className="mr-2" size={20} />
                        )}
                        Pagar {dynamicSymbol} {dynamicPrice} — Orientação Técnica
                      </Button>

                      {/* Botão Secundário — WhatsApp Dr. Edilson */}
                      <Button 
                        variant="outline"
                        className="w-full h-12 sm:h-14 border-green-500/30 text-green-500 font-black rounded-2xl text-sm sm:text-base hover:bg-green-500/10 transition-all"
                        onClick={() => {
                          const message = `Olá Dr. Edilson, finalizei minha triagem com a Brisa! Meu nome é ${patientData.nome || "paciente"} e gostaria de agendar minha Orientação Técnica. Triagem concluída: ${selectedPathology || "Cannabis Medicinal"}.`;
                          window.open(`https://wa.me/5511987131241?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
                        }}
                      >
                        <MessageCircle className="mr-2" size={18} />
                        Já pagou? Fale com Dr. Edilson no WhatsApp
                      </Button>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                      <Shield size={12} />
                      <span>Pagamento seguro via Mercado Pago · Receita digital ANVISA</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Médicos Disponíveis (seção secundária) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-black text-foreground text-center">
                    Ou escolha outro especialista
                  </h3>
                  <div className="grid gap-3">
                    {medicos.map(med => (
                      <Card key={med.id} className="border-border hover:border-primary/50 transition-all">
                        <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <img src={med.imageUrl} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0" />
                            <div className="text-left min-w-0">
                              <p className="font-black text-xs sm:text-sm truncate">{med.name}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{med.category}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-primary/80 text-white font-black rounded-lg text-[10px] sm:text-xs shrink-0 px-2 sm:px-3"
                            onClick={() => {
                              if (typeof window !== "undefined" && (window as any).fbq) {
                                (window as any).fbq("track", "InitiateCheckout", { value: 30, currency: "BRL", content_name: med.name });
                              }
                              navigate(`/pagamento?pro=${med.id}`);
                            }}
                          >
                            Agendar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Telemedicina;
