import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { captureTriageLead, computeClinicalScore } from "@/lib/leads-capture";
import { trackConversion } from "@/lib/track-conversion";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, HeartPulse, Moon, Flame, Activity, Pill, 
  ArrowRight, ArrowLeft, Loader2, CheckCircle2, Stethoscope,
  Zap, Star, Clock
} from "lucide-react";

const QUIZ_STEPS = [
  {
    id: "condition",
    question: "Qual é sua principal queixa de saúde?",
    options: [
      { label: "Dor Crônica", value: "dor_cronica", icon: Flame, specialty: "Dor e Cuidados Paliativos" },
      { label: "Ansiedade / Insônia", value: "ansiedade_insonia", icon: Moon, specialty: "Psiquiatria" },
      { label: "Epilepsia / Neurológico", value: "epilepsia", icon: Brain, specialty: "Neurologia" },
      { label: "Câncer / Oncológico", value: "oncologico", icon: HeartPulse, specialty: "Oncologia" },
      { label: "Autismo / TEA", value: "autismo", icon: Activity, specialty: "Neurologia Pediátrica" },
      { label: "Outro", value: "outro", icon: Pill, specialty: "Cannabis Medicinal" },
    ],
  },
  {
    id: "duration",
    question: "Há quanto tempo você tem esses sintomas?",
    options: [
      { label: "Menos de 1 mês", value: "recente" },
      { label: "1 a 6 meses", value: "moderado" },
      { label: "6 meses a 2 anos", value: "cronico" },
      { label: "Mais de 2 anos", value: "muito_cronico" },
    ],
  },
  {
    id: "tried",
    question: "Já tentou tratamento convencional?",
    options: [
      { label: "Sim, sem resultado", value: "falhou" },
      { label: "Sim, parcialmente", value: "parcial" },
      { label: "Não, quero começar por cannabis", value: "direto" },
      { label: "Sim, mas com efeitos colaterais", value: "efeitos_colaterais" },
    ],
  },
  {
    id: "urgency",
    question: "Qual a urgência do seu atendimento?",
    options: [
      { label: "Quero consulta agora", value: "alta" },
      { label: "Dentro de 24h", value: "media" },
      { label: "Esta semana", value: "baixa" },
      { label: "Apenas explorando", value: "informativa" },
    ],
  },
  {
    id: "experience",
    question: "Tem experiência com cannabis medicinal?",
    options: [
      { label: "Nunca usei", value: "nenhuma" },
      { label: "Já usei por conta própria", value: "automedica" },
      { label: "Tenho prescrição ativa", value: "prescricao" },
      { label: "Prescrição vencida", value: "vencida" },
    ],
  },
];

type Answers = Record<string, string>;

const QuizTriagem = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const step = QUIZ_STEPS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_STEPS.length) * 100;

  useEffect(() => { trackConversion("quiz_started", "quiz_triagem"); }, []);

  const selectOption = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [step.id]: value }));
    if (currentStep < QUIZ_STEPS.length - 1) {
      setTimeout(() => setCurrentStep(s => s + 1), 300);
    }
  }, [currentStep, step.id]);

  const handleSubmitQuiz = async () => {
    setLoading(true);
    try {
      const conditionStep = QUIZ_STEPS[0].options.find(o => o.value === answers.condition);
      const specialty = (conditionStep as any)?.specialty || "Cannabis Medicinal";
      const urgency = answers.urgency === "alta" ? "alta" : answers.urgency === "media" ? "media" : "baixa";

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        sessionStorage.setItem("quiz_answers", JSON.stringify(answers));
        toast({ title: "Faça login para continuar", description: "Seus dados do quiz serão mantidos." });
        navigate("/login");
        return;
      }

      // Persist clinical lead (RLS admin-only) — non-blocking
      try {
        const intensidade = answers.urgency === "alta" ? 9 : answers.urgency === "media" ? 6 : 3;
        const diasSintoma = answers.duration === "muito_cronico" ? 730 : answers.duration === "cronico" ? 180 : answers.duration === "moderado" ? 60 : 15;
        const clinical_score = computeClinicalScore({ intensidade, diasSintoma, sintomaAlvo: !!answers.condition });
        const profile = (await supabase.from("profiles").select("full_name, whatsapp, email").eq("id", session.user.id).maybeSingle()).data as any;
        await captureTriageLead({
          nome: profile?.full_name || session.user.email?.split("@")[0] || "Paciente",
          email: profile?.email || session.user.email || undefined,
          whatsapp: (profile?.whatsapp || "5511000000000").replace(/\D/g, ""),
          sintoma: answers.condition,
          intensidade,
          clinical_score,
          payload: { answers, specialty },
          source: "quiz_triagem",
        });
      } catch (e) { console.warn("captureTriageLead failed", e); }

      const { data, error } = await supabase.functions.invoke("match-doctor", {
        body: { specialty, urgency, symptoms: `Condição: ${answers.condition}, Duração: ${answers.duration}, Tratamento anterior: ${answers.tried}, Experiência cannabis: ${answers.experience}` },
      });

      if (error) throw error;
      setMatchResult(data);
      trackConversion("quiz_completed", "quiz_triagem", { specialty, urgency });
      trackConversion("form_submit", "quiz_triagem", { specialty });
    } catch (err: any) {
      toast({ title: "Erro no matching", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isLastStep = currentStep === QUIZ_STEPS.length - 1;

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Pergunta {currentStep + 1} de {QUIZ_STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {!matchResult ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{step.question}</h1>

              <div className="grid gap-3">
                {step.options.map(option => {
                  const Icon = (option as any).icon;
                  const isSelected = answers[step.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => selectOption(option.value)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                          : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                      }`}
                    >
                      {Icon && <Icon className="w-6 h-6 text-primary flex-shrink-0" />}
                      <span className="text-foreground font-medium">{option.label}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Button>

                {isLastStep && answers[step.id] && (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={loading}
                    className="gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Encontrar Meu Médico
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Médico Encontrado!</h2>
              <p className="text-muted-foreground mt-2">{matchResult.message}</p>
            </div>

            {matchResult.bestMatch && (
              <Card className="bg-card/50 backdrop-blur-sm border-primary/30 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                      <Stethoscope className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{matchResult.bestMatch.doctor_name || matchResult.bestMatch.name || "Dr. Edilson Bezerra"}</h3>
                      <p className="text-xs font-bold text-primary">{matchResult.bestMatch.crm || "CRM-SP 10963"} • {matchResult.bestMatch.specialty}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="flex items-center gap-1 text-[hsl(var(--gold))]">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold">{matchResult.bestMatch.rating}</span>
                      </div>
                      <span className="text-sm text-primary font-bold">Score: {matchResult.bestMatch.score}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" /> Atendimento em ~5 min
                    </span>
                    <span className="text-foreground font-bold">R$ {matchResult.bestMatch.price}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-3">
              <Button
                onClick={() => navigate("/agendamento")}
                className="w-full gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12"
              >
                <Zap className="w-5 h-5" /> Agendar Orientação Técnica Agora
              </Button>
              <Button variant="outline" onClick={() => { setMatchResult(null); setCurrentStep(0); setAnswers({}); }}>
                Refazer Quiz
              </Button>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default QuizTriagem;
