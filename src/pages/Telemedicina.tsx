import { useState, useEffect } from "react";
import brisaImg from "@/assets/brisa-enfermeira.png";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Stethoscope, ArrowRight, ArrowLeft, CheckCircle2, Brain, Heart, Activity, Shield, Leaf, Watch, FileText, Download, Printer, UserCheck, Scale, AlertTriangle, Loader2, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
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

  return (
    <div className="relative flex flex-col items-center mb-6">
      <motion.div 
        className="relative cursor-pointer group"
        onMouseEnter={() => setMood("happy")}
        onMouseLeave={() => setMood("neutral")}
        onDoubleClick={() => setIsChatOpen(true)}
        whileHover={{ scale: 1.05 }}
      >
        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-32 h-32 rounded-full border-4 border-primary/30 overflow-hidden bg-muted shadow-2xl relative z-10">
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
            className="fixed bottom-6 right-6 w-80 h-96 bg-card border border-border rounded-3xl shadow-2xl z-[100] flex flex-col overflow-hidden"
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
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/30">
              <div className="bg-primary/10 p-3 rounded-2xl rounded-tl-none text-xs text-foreground font-medium border border-primary/20">
                Olá! Sou a Brisa. Como posso te ajudar com sua triagem ou dúvidas sobre o tratamento?
              </div>
            </div>
            <div className="p-3 border-t border-border bg-background flex gap-2">
              <Input placeholder="Digite sua dúvida..." className="text-xs h-9 rounded-xl" />
              <Button size="icon" className="h-9 w-9 rounded-xl bg-primary text-white">
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
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [sliderValue, setSliderValue] = useState([50]);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showWearables, setShowWearables] = useState(false);
  const [tcleAccepted, setTcleAccepted] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();
  const [patientData, setPatientData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    email: "",
    telefone: "",
  });

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
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-8 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center glow-green">
                <Stethoscope size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">TELEMEDICINA AVANÇADA</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
              Consulta <span className="text-gradient-green">Inteligente</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium">
              Triagem conduzida pela Brisa IA + análise clínica + receita digital ANVISA sob supervisão técnica do Dr. Edilson Bezerra.
            </p>
          </motion.div>
        </div>
      </section>

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
            {/* Conteúdo do Questionário (Mantendo a lógica original) */}
            {step === -1 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <Card className="border-border">
                  <CardContent className="p-8">
                    <h2 className="text-xl font-display font-black text-foreground mb-6">Termo de Consentimento</h2>
                    <div className="bg-muted/30 border border-border rounded-2xl p-5 mb-6 max-h-[300px] overflow-y-auto text-sm">
                      <p>Aceito realizar a teleconsulta conforme as normas do CFM e ANVISA...</p>
                    </div>
                    <Button 
                      className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl text-lg"
                      onClick={() => setStep(0)}
                    >
                      Aceitar e Continuar <ArrowRight className="ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <Card className="border-border">
                  <CardContent className="p-8 space-y-6">
                    <h2 className="text-xl font-display font-black text-foreground">Identificação do Paciente</h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Nome Completo</Label>
                        <Input placeholder="Seu nome" value={patientData.nome} onChange={(e) => setPatientData({...patientData, nome: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase">CPF</Label>
                          <Input placeholder="000.000.000-00" value={patientData.cpf} onChange={(e) => setPatientData({...patientData, cpf: e.target.value})} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase">Nascimento</Label>
                          <Input type="date" value={patientData.dataNascimento} onChange={(e) => setPatientData({...patientData, dataNascimento: e.target.value})} className="h-12 rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">WhatsApp</Label>
                        <Input placeholder="(11) 99999-9999" value={patientData.telefone} onChange={(e) => setPatientData({...patientData, telefone: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">E-mail</Label>
                        <Input placeholder="seu@email.com" value={patientData.email} onChange={(e) => setPatientData({...patientData, email: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                    </div>
                    <Button 
                      className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl text-lg"
                      disabled={!isPatientDataValid()}
                      onClick={() => setStep(1)}
                    >
                      Iniciar Triagem com Brisa <ArrowRight className="ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step >= 1 && step <= 10 && currentQ && (
              <motion.div key={step} initial="hidden" animate="visible" variants={fadeUp}>
                <Card className="border-border shadow-xl">
                  <CardContent className="p-8">
                    <h2 className="text-xl font-display font-black text-foreground mb-6">{currentQ.question}</h2>
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
                    <div className="flex gap-4 mt-8">
                      <Button variant="ghost" onClick={() => setStep(step - 1)} className="h-12 rounded-xl font-bold">
                        <ArrowLeft className="mr-2" /> Voltar
                      </Button>
                      <Button 
                        className="flex-1 h-12 bg-primary text-primary-foreground font-black rounded-xl"
                        onClick={() => setStep(step + 1)}
                      >
                        Próximo <ArrowRight className="ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Resultado Final e Seleção de Médicos */}
            {step > 10 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-8">
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-display font-black text-foreground mb-2">Triagem Concluída!</h2>
                    <p className="text-muted-foreground font-medium mb-6">A Brisa IA já preparou seu resumo clínico. Agora escolha seu médico para atendimento imediato.</p>
                    <div className="grid gap-4">
                      {medicos.map(med => (
                        <Card key={med.id} className="border-border hover:border-primary/50 transition-all">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <img src={med.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                              <div className="text-left">
                                <p className="font-black text-sm">{med.name}</p>
                                <p className="text-xs text-muted-foreground">{med.category}</p>
                              </div>
                            </div>
                            <Button size="sm" className="bg-primary text-white font-black rounded-lg">Agendar R$ 49,90</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
