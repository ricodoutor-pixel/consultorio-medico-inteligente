import { useState, useEffect, lazy, Suspense } from "react";
const WidgetMonitorRapido = lazy(() => import("@/components/WidgetMonitorRapido"));
import brisaImg from "@/assets/brisa-enfermeira.png";
import DrEdilsonPhoto from "@/assets/dr-edilson-bezerra.jpg";
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
import { Stethoscope, ArrowRight, ArrowLeft, CheckCircle2, Brain, Heart, Activity, Shield, Leaf, Watch, FileText, Download, Printer, UserCheck, Scale, AlertTriangle, Loader2, MessageCircle, X, CreditCard, Wallet, Users, Info, HelpCircle, Star, MapPin, Sparkles, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { TCLEConsentModal } from "@/components/TCLEConsentModal";
import { useRealProfessionals } from "@/hooks/useRealProfessionals";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { createConsultationCheckout, isConsultationPaid } from "@/lib/telemedicine-checkout";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const OFFICIAL_OT_WHATSAPP = (import.meta.env.VITE_DOCTOR_WHATSAPP_NUMBER || "5511991363154").replace(/\D/g, "");

function isValidCpf(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

// 🩺 AS 5 PERGUNTAS ESSENCIAIS DA ENTREVISTA PRÉVIA DA TELEMEDICINA
const interviewQuestions = [
  { 
    id: 1, 
    question: "1. Qual é a sua principal queixa de saúde e qual a intensidade dos sintomas (de 0 a 10)?", 
    type: "textarea", 
    placeholder: "Ex: Dor lombar crônica diária com rigidez matinal, intensidade 8. Descreva seus sintomas com detalhes..." 
  },
  { 
    id: 2, 
    question: "2. Há quanto tempo você convive com este problema e como ele tem evoluído?", 
    type: "select", 
    options: [
      "Menos de 1 mês (Quadro recente)", 
      "1 a 3 meses (Subagudo)", 
      "3 a 6 meses (Quadro crônico)", 
      "6 a 12 meses (Crônico persistente)", 
      "Mais de 1 ano (Condição refratária de longa data)"
    ] 
  },
  { 
    id: 3, 
    question: "3. Já teve alguma experiência prévia com Cannabis medicinal ou fitocanabinoides (CBD/THC)?", 
    type: "radio", 
    options: [
      "Sim, com ótimos resultados terapêuticos", 
      "Sim, porém com resultados moderados ou parciais", 
      "Sim, mas sem efeitos percebidos ou com efeitos adversos", 
      "Não, nunca utilizei (Primeiro contato com o tratamento canabinoide)"
    ] 
  },
  { 
    id: 4, 
    question: "4. Quais medicamentos de uso contínuo você toma atualmente e possui alguma alergia conhecida?", 
    type: "textarea", 
    placeholder: "Ex: Pregabalina 75mg à noite, Losartana 50mg. Alergia a Dipirona e AINEs. Se não tomar nenhum, digite 'Nenhum'..." 
  },
  { 
    id: 5, 
    question: "5. Qual é o principal benefício clínico ou objetivo que você busca alcançar com o tratamento?", 
    type: "select", 
    options: [
      "Alívio de Dor Crônica e Processos Inflamatórios (Analgesia)", 
      "Controle de Ansiedade, Estresse e Pânico (Efeito Ansiolítico)", 
      "Indução de Sono Reparador e Tratamento de Insônia (Sedativo)", 
      "Apoio Neurológico (Autismo/TEA, Parkinson, Epilepsia, TDAH)", 
      "Desmame ou Redução de Fármacos Sintéticos Pesados", 
      "Cuidados Paliativos, Apetite e Qualidade de Vida Geral"
    ] 
  },
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
  const { professionals } = useRealProfessionals();
  const dynamicPrice = 30;
  const dynamicSymbol = "R$";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showTCLE, setShowTCLE] = useState(false);
  const [showFlowInfo, setShowFlowInfo] = useState(false);
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [sliderValue, setSliderValue] = useState([50]);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showWearables, setShowWearables] = useState(false);
  const [tcleAccepted, setTcleAccepted] = useState(() => {
    try {
      return !!localStorage.getItem("pyr_guest_tcle");
    } catch {
      return false;
    }
  });
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();
  const [selectedPathology, setSelectedPathology] = useState("");
  const [triageId, setTriageId] = useState<string | null>(null);
  
  const [selectedServiceMode, setSelectedServiceMode] = useState<"video" | "chat">("video");
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  const [patientData, setPatientData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    email: "",
    telefone: "",
  });

  // 🔗 PERSONALIZAÇÃO DE LINK (Modalidade, Paciente e Telefone)
  useEffect(() => {
    const modalidade = searchParams.get("modalidade");
    if (modalidade === "chat" || modalidade === "video") {
      setSelectedServiceMode(modalidade);
    }
    const urlNome = searchParams.get("paciente") || searchParams.get("nome");
    const urlTel = searchParams.get("tel") || searchParams.get("whatsapp");
    const urlEmail = searchParams.get("email");
    if (urlNome || urlTel || urlEmail) {
      setPatientData(prev => ({
        ...prev,
        nome: urlNome || prev.nome,
        telefone: urlTel || prev.telefone,
        email: urlEmail || prev.email,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    const saved = sessionStorage.getItem("triage_condition");
    if (saved) {
      setSelectedPathology(saved);
      // Pre-fill first triage question with the pathology
      setAnswers(prev => ({ ...prev, 1: `Condição principal: ${saved}. ` }));
      sessionStorage.removeItem("triage_condition");
    }
  }, []);

  // Restore triage draft after login redirect (guest flow)
  useEffect(() => {
    const draft = localStorage.getItem("ot_triage_draft");
    if (!draft) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) return;
      try {
        const d = JSON.parse(draft);
        if (d.answers) setAnswers(d.answers);
        if (d.patientData) setPatientData(d.patientData);
        if (d.selectedPathology) setSelectedPathology(d.selectedPathology);
        if (Array.isArray(d.sliderValue)) setSliderValue(d.sliderValue);
        localStorage.removeItem("ot_triage_draft");
        setStep(5);
        toast({ title: "Triagem recuperada", description: "Clique em Concluir Triagem para prosseguir ao pagamento." });
      } catch {
        localStorage.removeItem("ot_triage_draft");
      }
    });
  }, []);

  // 🎯 Scroll suave automático para a seção explicativa de Orientação Técnica
  useEffect(() => {
    if (window.location.hash === "#orientacao-tecnica") {
      const el = document.getElementById("orientacao-tecnica");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      }
    }
  }, []);

  const currentQ = interviewQuestions[step - 1];
  const progress = step <= 0 ? 0 : step > 5 ? 100 : Math.round((step / 5) * 100);
  
  // 🛡️ REGRA CFM/ARQUITETURA: Exclusão estrita de médicos veterinários da vitrine e lista de telemedicina humana
  const medicos = professionals.filter(
    (p) =>
      p.category === "Médicos Prescritores" &&
      !p.name?.toLowerCase().includes("veterin") &&
      !p.bio?.toLowerCase().includes("veterin") &&
      p.crm !== "CRMV" &&
      !p.crm?.startsWith("CRMV")
  );
  const onlineDoctors = medicos.filter((doctor) => doctor.online).length;

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
      isValidCpf(patientData.cpf) &&
      patientData.dataNascimento &&
      patientData.email.includes("@") &&
      patientData.telefone.replace(/\D/g, "").length >= 10;
  };

  const completeTriage = async () => {
    if (!isAnswered() || aiLoading) return;
    setAiLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        localStorage.setItem("ot_triage_draft", JSON.stringify({
          answers,
          patientData,
          selectedPathology,
          sliderValue,
        }));
        toast({ title: "Crie sua conta para concluir", description: "Suas 5 respostas ficam salvas. Entre para finalizar o pagamento." });
        navigate(`/login?redirect=${encodeURIComponent("/telemedicina")}`);
        return;
      }
      const completeAnswers = { ...answers };
      const answerText = interviewQuestions
        .map((question) => {
          const answer = completeAnswers[question.id];
          return `${question.id}. ${question.question}\n${Array.isArray(answer) ? answer.join(", ") : answer || ""}`;
        })
        .join("\n\n");
      
      // 🔒 REGRA AGENTS.md: Armazena triagem completa no banco ANTES de criar pedido de pagamento Mercado Pago
      const { data, error } = await supabase.from("brisa_triages").insert({
        patient_id: user.id,
        symptoms: String(completeAnswers[1] || "Triagem clínica em 5 perguntas"),
        patient_info: {
          name: patientData.nome,
          cpf_last4: patientData.cpf.replace(/\D/g, "").slice(-4),
          birth_date: patientData.dataNascimento,
          email: patientData.email,
          phone: patientData.telefone.replace(/\D/g, ""),
          answers: completeAnswers,
        },
        triage_result: answerText,
        category: selectedPathology || "Cannabis Medicinal",
        urgency: "Moderada",
        status: "completed",
        completed_at: new Date().toISOString(),
      }).select("id").single();

      if (error || !data?.id) throw new Error(error?.message || "Não foi possível salvar a triagem.");
      localStorage.removeItem("ot_triage_draft");

      // 🔒 REGRA CFM/LGPD: Sincroniza consentimento prévio do visitante com o prontuário no Supabase
      const guestTcle = localStorage.getItem("pyr_guest_tcle");
      if (guestTcle) {
        try {
          const parsedTcle = JSON.parse(guestTcle);
          await supabase.from("tcle_consents").insert({
            user_id: user.id,
            doctor_name: parsedTcle.doctorName || "Corpo Clínico Planta y Raíz",
            version: parsedTcle.version || "2026.1",
            checks: parsedTcle.checks,
            user_agent: parsedTcle.userAgent,
          });
          localStorage.removeItem("pyr_guest_tcle");
        } catch { /* ignore sync error */ }
      }

      setAnswers(completeAnswers);
      setTriageId(data.id);
      
      // Avança imediatamente para o Passo 6: Pagamento & Escolha da Modalidade
      setStep(6);
      toast({ title: "Entrevista Prévia Concluída (5/5)!", description: "Escolha sua modalidade de atendimento para prosseguir." });
    } catch (error) {
      toast({
        title: "Não foi possível concluir a triagem",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const verifyConsultationPayment = async (id: string) => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      if (await isConsultationPaid(id)) {
        sessionStorage.removeItem("telemedicine_pending_checkout");
        navigate("/consultas");
      } else {
        toast({ title: "Pagamento ainda não confirmado", description: "Aguarde a confirmação do Mercado Pago e tente novamente." });
      }
    } catch (error) {
      toast({ title: "Não foi possível verificar o pagamento", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get("appointment");
    if (!id) return;
    setAppointmentId(id);
    setShowTCLE(false);
    setTcleAccepted(true);
    setStep(6);
    void verifyConsultationPayment(id);
  }, [searchParams]);

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
          toast({ title: "Termo de Consentimento", description: "Você pode navegar pelo site e ler o termo quando desejar iniciar." });
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
              <span className="text-xs md:text-sm font-bold text-primary uppercase tracking-wide">
                Plataforma de Gestão Clínica e Telemedicina para Médicos Prescritores do Sistema Endocanabinoide
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
              Inicie Sua <span className="text-gradient-green">Teleconsulta Médica Direta</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium mb-3 mx-auto">
              Entrevista clínica prévia com a <strong>Enf. Brisa</strong> → Conexão Segura ao Consultório → Atendimento Médico ao Vivo com Especialista Credenciado.
            </p>
            <p className="text-xs text-muted-foreground/80 max-w-xl mx-auto mb-6 flex items-center justify-center gap-1.5">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <span>Consultas médicas em conformidade com a Resolução CFM nº 2.314/2022 e RDCs ANVISA 660 e 327. Proteção de dados sob a LGPD (Lei 13.709/2018).</span>
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
                    <p className="font-black text-foreground mb-1">3 · Triagem + Orientação Técnica Educativa</p>
                    <p className="text-xs text-muted-foreground">Enf. Brisa triagem → Orientação Técnica com o <strong>Dr. Edilson Bezerra ON</strong> (supervisionado) → relatório informativo em PDF revisado pelo Dr. Edilson e encaminhamento para médicos da vitrine (não substitui consulta médica).</p>
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
          
          {/* Brisa IA no Topo da Triagem (Passos 0 a 5) */}
          {step >= 0 && step <= 5 && <BrisaAvatar />}

          {/* Stepper Superior (Passos 6 a 9) */}
          {step >= 6 && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto mb-8 bg-card/90 backdrop-blur border border-border p-4 rounded-3xl shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="flex flex-col items-center p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 size={16} className="mb-1" />
                  <span className="font-black text-[10px] uppercase">1. Entrevista (5/5)</span>
                  <span className="text-[9px] text-muted-foreground">Concluída</span>
                </div>
                <div className={`flex flex-col items-center p-2 rounded-2xl transition-all ${step === 6 ? 'bg-primary/15 text-primary border border-primary/40 font-black scale-105' : step > 6 ? 'bg-emerald-500/10 text-emerald-500' : 'text-muted-foreground'}`}>
                  <CreditCard size={16} className="mb-1" />
                  <span className="font-bold text-[10px] uppercase">2. Pagamento</span>
                  <span className="text-[9px]">{step === 6 ? 'Atual' : step > 6 ? 'Confirmado' : 'Pendente'}</span>
                </div>
                <div className={`flex flex-col items-center p-2 rounded-2xl transition-all ${step === 7 ? 'bg-primary/15 text-primary border border-primary/40 font-black scale-105' : step > 7 ? 'bg-emerald-500/10 text-emerald-500' : 'text-muted-foreground'}`}>
                  <Activity size={16} className="mb-1" />
                  <span className="font-bold text-[10px] uppercase">3. Triagem Uber</span>
                  <span className="text-[9px]">{step === 7 ? 'Buscando médico' : step > 7 ? 'Conectado' : 'Fila'}</span>
                </div>
                <div className={`flex flex-col items-center p-2 rounded-2xl transition-all ${step === 8 ? 'bg-primary/15 text-primary border border-primary/40 font-black scale-105' : step > 8 ? 'bg-emerald-500/10 text-emerald-500' : 'text-muted-foreground'}`}>
                  <Stethoscope size={16} className="mb-1" />
                  <span className="font-bold text-[10px] uppercase">4. Teleconsulta</span>
                  <span className="text-[9px]">{step === 8 ? 'Ao vivo' : step > 8 ? 'Realizada' : 'Aguardando'}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-2xl transition-all text-muted-foreground">
                  <Star size={16} className="mb-1" />
                  <span className="font-bold text-[10px] uppercase">5. Avaliação & PIX</span>
                  <span className="text-[9px]">Aguardando consulta</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Progresso das 5 Perguntas Iniciais */}
          {step >= 0 && step <= 5 && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-bold">Progresso da entrevista médica</span>
                <span className="text-xs text-primary font-bold">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden" role="progressbar">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Banner de Encaminhamento Personalizado WhatsApp */}
          {searchParams.get("origem") === "whatsapp" && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl mx-auto mb-6">
              <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-4 flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="text-primary" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground text-sm">
                    Olá{patientData.nome ? `, ${patientData.nome}` : ""}! Atendimento Encaminhado pela Enfª Brisa 🌿
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Modalidade pré-selecionada: <strong>{selectedServiceMode === "video" ? "Teleconsulta por Vídeo HD (R$ 150)" : "Consulta Médica por Chat (R$ 100)"}</strong>. Preencha as 5 perguntas para conectar com seu médico especialista.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="max-w-2xl mx-auto">
            {/* Landing Hero & Call to Action (Passo Inicial) */}
            {step === -1 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <Card className="border-border shadow-2xl bg-card/95 backdrop-blur overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-emerald-500 via-primary to-teal-400" />
                  <CardContent className="p-6 sm:p-10 text-center space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-inner">
                      <Stethoscope size={32} />
                    </div>
                    <div className="space-y-3">
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-3 py-1 font-bold uppercase tracking-wider">
                        Telemedicina Segura · Res. CFM nº 2.314/2022
                      </Badge>
                      <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight">
                        Consulta Médica Online & <span className="text-gradient-green">Orientação Clínica</span>
                      </h2>
                      <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        Acolhimento humanizado com médicos especialistas credenciados. Faça a triagem clínica prévia em 5 perguntas com a <strong>Enfª Brisa IA</strong> e realize sua teleconsulta com emissão de receita digital válida em todo o Brasil, caso indicada após avaliação médica.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2">
                      <Button
                        size="lg"
                        className="h-14 font-black rounded-2xl bg-primary text-primary-foreground text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        onClick={() => {
                          if (tcleAccepted) {
                            setStep(0);
                          } else {
                            setShowTCLE(true);
                          }
                        }}
                      >
                        <Sparkles size={18} /> Iniciar Triagem Prévia
                      </Button>
                      <Link to="/orientacao-tecnica" className="w-full">
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full h-14 font-bold rounded-2xl border-primary/40 text-primary hover:bg-primary/10 text-sm"
                        >
                          Orientação Técnica (R$ 30)
                        </Button>
                      </Link>
                    </div>

                    <div className="pt-6 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted-foreground text-left sm:text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Shield size={16} className="text-primary shrink-0" />
                        <span>Conforme CFM 2.314/2022</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <FileText size={16} className="text-primary shrink-0" />
                        <span>Receita Digital ICP-Brasil</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center gap-2 justify-center">
                        <Users size={16} className="text-primary shrink-0" />
                        <span>{onlineDoctors} Médicos Disponíveis</span>
                      </div>
                    </div>
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
                          <Input id="tele-cpf" name="cpf" placeholder="000.000.000-00" value={patientData.cpf} onChange={(e) => setPatientData({...patientData, cpf: e.target.value})} className="h-12 rounded-xl" aria-invalid={patientData.cpf.length > 0 && !isValidCpf(patientData.cpf)} />
                          {patientData.cpf.length > 0 && !isValidCpf(patientData.cpf) && <p className="text-xs text-destructive">Digite um CPF válido.</p>}
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
                       Iniciar Entrevista com Brisa (5 Perguntas) <ArrowRight className="ml-2" size={18} />
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

            {/* As 5 Perguntas Clínicas Essenciais */}
            {step >= 1 && step <= 5 && currentQ && (
              <motion.div key={step} initial="hidden" animate="visible" variants={fadeUp}>
                 <Card className="border-border shadow-xl">
                   <CardContent className="p-4 sm:p-8">
                     <div className="flex items-center justify-between mb-4">
                       <span className="text-xs font-black text-primary uppercase tracking-wider">Pergunta {step} de 5</span>
                       <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Triagem IA Brisa</Badge>
                     </div>
                     <h2 className="text-base sm:text-xl font-display font-black text-foreground mb-4 sm:mb-6">{currentQ.question}</h2>
                    {/* Renderização dinâmica de campos de triagem */}
                    {currentQ.type === "textarea" && (
                      <Textarea 
                        placeholder={currentQ.placeholder} 
                        className="min-h-[140px] rounded-2xl border-border focus:border-primary text-sm"
                        value={answers[step] || ""}
                        onChange={(e) => setAnswers({...answers, [step]: e.target.value})}
                      />
                    )}
                    {currentQ.type === "select" && (
                      <Select value={typeof answers[step] === "string" ? String(answers[step]) : ""} onValueChange={(value) => setAnswers({ ...answers, [step]: value })}>
                        <SelectTrigger className="h-12 rounded-xl text-sm"><SelectValue placeholder="Selecione uma resposta" /></SelectTrigger>
                        <SelectContent>{currentQ.options?.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                    {currentQ.type === "radio" && (
                      <RadioGroup value={typeof answers[step] === "string" ? String(answers[step]) : ""} onValueChange={(value) => setAnswers({ ...answers, [step]: value })} className="space-y-3">
                        {currentQ.options?.map((option) => <label key={option} className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors"><RadioGroupItem value={option} /><span className="text-sm text-foreground">{option}</span></label>)}
                      </RadioGroup>
                    )}
                    {currentQ.type === "checkbox" && (
                      <div className="space-y-3">{currentQ.options?.map((option) => <label key={option} className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors"><Checkbox checked={Array.isArray(answers[step]) && answers[step].includes(option)} onCheckedChange={(checked) => handleCheckbox(option, Boolean(checked))} /><span className="text-sm text-foreground">{option}</span></label>)}</div>
                    )}
                     <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
                       <Button variant="ghost" onClick={() => setStep(step - 1)} className="h-10 sm:h-12 rounded-xl font-bold text-sm">
                         <ArrowLeft className="mr-1 sm:mr-2" size={16} /> Voltar
                       </Button>
                       <Button 
                         className="flex-1 h-10 sm:h-12 bg-primary text-primary-foreground font-black rounded-xl text-sm shadow-md"
                        disabled={!isAnswered() || aiLoading}
                        onClick={() => step === 5 ? void completeTriage() : setStep(step + 1)}
                      >
                        {aiLoading ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
                        {step === 5 ? "Concluir Entrevista (5/5) e Avançar" : "Próxima Pergunta"} <ArrowRight className="ml-2" size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* PASSO 2: PAGAMENTO & ESCOLHA DA MODALIDADE (Passo 6) */}
            {step === 6 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
                <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5 shadow-2xl">
                  <CardContent className="p-5 sm:p-8 space-y-6">
                    <div className="text-center space-y-2">
                      <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px]">
                        Passo 2 de 5 · Pagamento Seguro
                      </Badge>
                      <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground">
                        Escolha sua <span className="text-gradient-green">Modalidade de Atendimento</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                        Sua entrevista prévia em 5 perguntas foi gravada com sucesso no prontuário. Escolha como prefere ser atendido(a):
                      </p>
                    </div>

                    {/* Cards das Modalidades de Teleconsulta Médica */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* 1. Teleconsulta Vídeo HD */}
                      <div 
                        onClick={() => { if (!appointmentId) setSelectedServiceMode("video"); }}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${selectedServiceMode === "video" ? "border-primary bg-primary/10 shadow-lg scale-[1.01]" : "border-border bg-card hover:border-primary/40"}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-primary/20 text-primary text-[10px] font-bold">Mais Escolhida · Recomendada</Badge>
                            <span className="font-black text-primary text-xl">R$ 150</span>
                          </div>
                          <h3 className="font-black text-base text-foreground mb-1">Teleconsulta por Vídeo HD</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Consulta médica ao vivo com médico especialista prescritor, emissão de receita oficial digital ANVISA/CFM com QR Code e direito a retorno clínico incluso no protocolo.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-primary font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Atendimento médico completo + Receita oficial válida em todo o Brasil
                        </div>
                      </div>

                      {/* 2. Consulta Chat */}
                      <div 
                        onClick={() => { if (!appointmentId) setSelectedServiceMode("chat"); }}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${selectedServiceMode === "chat" ? "border-primary bg-primary/10 shadow-lg scale-[1.01]" : "border-border bg-card hover:border-primary/40"}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">Atendimento Ágil</Badge>
                            <span className="font-black text-primary text-xl">R$ 100</span>
                          </div>
                          <h3 className="font-black text-base text-foreground mb-1">Consulta Médica por Chat</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Atendimento clínico ágil por chat seguro na plataforma, análise da anamnese e emissão de prescrição médica digital homologada pelo especialista.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-primary font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Prontuário eletrônico completo + Prescrição digital
                        </div>
                      </div>
                    </div>

                    {/* Link para Orientação Técnica em Nuvem (Dr. Edilson On - R$ 30) */}
                    <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        <span>💡 Procura apenas a <strong>Orientação Técnica Prévia por R$ 30</strong> com o Dr. Edilson Bezerra On (ambiente virtual em nuvem com 40.000 estudos)?</span>
                      </div>
                      <Link to="/orientacao-tecnica">
                        <Button variant="outline" size="sm" className="text-xs font-black border-primary text-primary hover:bg-primary/10 gap-1 rounded-xl shrink-0">
                          Ir para Orientação Técnica em Nuvem (R$ 30) <ArrowRight size={13} />
                        </Button>
                      </Link>
                    </div>

                    {/* Botões de Pagamento */}
                    <div className="space-y-3 pt-2">
                      <Button 
                        className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl text-base shadow-lg hover:shadow-xl transition-all"
                        onClick={async () => {
                          setAiLoading(true);
                          try {
                            let pending: { appointmentId?: string; mode?: string; triageId?: string } = {};
                            try { pending = JSON.parse(sessionStorage.getItem("telemedicine_pending_checkout") || "{}"); } catch { /* discard invalid draft */ }
                            const id = appointmentId || (pending.mode === selectedServiceMode && pending.triageId === triageId ? pending.appointmentId : null);
                            if (!triageId && !id) throw new Error("Conclua a entrevista antes de pagar.");
                            const checkout = await createConsultationCheckout(selectedServiceMode, triageId || "", id);
                            setAppointmentId(checkout.appointmentId);
                            window.location.href = checkout.paymentUrl;
                          } catch (error) {
                            toast({ title: "Pagamento não iniciado", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
                          } finally {
                            setAiLoading(false);
                          }
                        }}
                        disabled={aiLoading}
                      >
                        {aiLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <CreditCard className="mr-2" size={18} />}
                        Pagar {selectedServiceMode === "video" ? "R$ 150" : "R$ 100"} via Mercado Pago (Cartão ou PIX)
                      </Button>

                      {/* Botão de Liberação com Comprovante */}
                      <Button
                        variant="outline"
                        className="w-full h-12 border-emerald-500/30 text-emerald-500 font-bold rounded-2xl text-xs sm:text-sm hover:bg-emerald-500/10"
                        disabled={aiLoading}
                        onClick={() => {
                          let savedId: string | undefined;
                          try { savedId = JSON.parse(sessionStorage.getItem("telemedicine_pending_checkout") || "{}").appointmentId; } catch { /* invalid draft */ }
                          const id = appointmentId || savedId;
                          if (!id) {
                            toast({ title: "Nenhum pagamento iniciado", description: "Inicie o pagamento desta consulta pelo Mercado Pago.", variant: "destructive" });
                            return;
                          }
                          void verifyConsultationPayment(id);
                        }}
                      >
                        <CheckCircle2 className="mr-2" size={16} />
                        Já paguei / Verificar confirmação
                      </Button>
                    </div>

                    <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <Shield size={12} /> Pagamento auditado com proteção e estorno garantido até a avaliação da consulta.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}


          </div>
        </div>
      </section>

      {/* 🌿 Seção Explicativa Oficial: Orientação Técnica — Dr. Edilson Bezerra ON */}
      <section
        id="orientacao-tecnica"
        className="scroll-mt-24 md:scroll-mt-28 py-16 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border-t border-primary/20"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="bg-card/90 backdrop-blur border border-primary/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              <img
                src={DrEdilsonPhoto}
                alt="Dr. Edilson Bezerra"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-primary/30 shadow-xl shrink-0"
              />
              <div className="text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <Badge className="bg-primary text-primary-foreground font-black text-xs px-3 py-1 uppercase tracking-wider">
                    Triagem Clínica & Educação em Saúde
                  </Badge>
                  <Badge variant="outline" className="border-primary/40 text-primary font-bold text-xs">
                    ⚕️ CRM Bolívia 10963 · Formado em 2018
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 font-bold text-xs">
                    📚 40.000 Estudos Clínicos
                  </Badge>
                </div>
                <h3 className="text-2xl sm:text-4xl font-display font-black text-foreground">
                  Orientação e Avaliação Técnica com{" "}
                  <span className="text-gradient-green">Dr. Edilson Bezerra ON</span>
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                  Modalidade institucional desenvolvida para <strong>filtrar pacientes reais versus curiosos</strong>,
                  compreender profundamente o histórico de cada caso e educar sobre a terapêutica canabinoide
                  antes da consulta médica formal. Conduzida pelo agente autônomo <strong>Dr. Edilson Bezerra ON</strong> (IA com mais de 10 anos de prática clínica integrativa, consultório físico em Santa Cruz de la Sierra: Edifício Ecodente, 1º Anillo, Andar 13, Sala 15), sob <strong>supervisão médica humana em tempo real</strong>.
                </p>
              </div>
            </div>

            {/* Aviso de Compliance e Vedações */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-100/90 text-xs sm:text-sm leading-relaxed mb-8 flex items-start gap-3">
              <Scale size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong>Aviso Legal & Diretrizes CFM/ANVISA:</strong> A Orientação Técnica <strong>NÃO é consulta médica diagnóstica e NÃO prescreve substâncias, produtos ou medicamentos sob qualquer hipótese</strong>. Trata-se de uma etapa de acolhimento e triagem avançada baseada em evidências científicas publicadas. Ao término da sessão, você recebe um <strong>Relatório Educativo em PDF revisado pelo Dr. Edilson</strong> e o encaminhamento com prioridade para o Médico Prescritor credenciado da vitrine mais indicado para o seu caso.
              </div>
            </div>

            {/* Esteira de 4 Passos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
                <span className="text-2xl">👩‍⚕️</span>
                <p className="text-xs font-black uppercase tracking-wider text-primary">1. Triagem Brisa</p>
                <p className="text-[11px] text-muted-foreground">Queixas e histórico no WhatsApp</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
                <span className="text-2xl">💳</span>
                <p className="text-xs font-black uppercase tracking-wider text-primary">2. Taxa R$ 30</p>
                <p className="text-[11px] text-muted-foreground">Pagamento seguro Mercado Pago</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
                <span className="text-2xl">💬</span>
                <p className="text-xs font-black uppercase tracking-wider text-primary">3. Chat 30 min</p>
                <p className="text-[11px] text-muted-foreground">Sala estilo WhatsApp com a IA</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
                <span className="text-2xl">📄</span>
                <p className="text-xs font-black uppercase tracking-wider text-primary">4. Relatório & Vitrine</p>
                <p className="text-[11px] text-muted-foreground">PDF oficial e médico indicado</p>
              </div>
            </div>

            {/* CTA Final em Destaque */}
            <div className="text-center pt-2">
              <Link to="/orientacao-tecnica">
                <Button
                  size="lg"
                  className="h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-black rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/30 hover:scale-105 transition-all gap-3"
                >
                  <Sparkles size={20} /> Iniciar Orientação Técnica — R$ 30,00 <ArrowRight size={20} />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                <Shield size={14} className="text-primary" /> Liberação instantânea após confirmação · Sem filas
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Telemedicina;
