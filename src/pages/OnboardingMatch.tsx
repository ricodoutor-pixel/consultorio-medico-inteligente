import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HeartPulse, Moon, Brain, Dna, FileText, CheckCircle2, ChevronRight, Sparkles, Loader2, User } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const questions = [
  {
    id: "symptom",
    title: "O que te traz aqui hoje?",
    subtitle: "Selecione o sintoma que mais te incomoda no momento.",
    options: [
      { id: "pain", label: "Dores Crônicas", icon: HeartPulse, color: "text-red-500" },
      { id: "anxiety", label: "Ansiedade/Depressão", icon: Brain, color: "text-blue-500" },
      { id: "sleep", label: "Insônia/Sono", icon: Moon, color: "text-indigo-500" },
      { id: "neuro", label: "Parkinson/Epilepsia", icon: Dna, color: "text-purple-500" },
    ]
  },
  {
    id: "experience",
    title: "Já fez uso de Cannabis Medicinal?",
    subtitle: "Sua experiência nos ajuda a calibrar a consulta.",
    options: [
      { id: "yes_rx", label: "Sim, com receita médica", icon: FileText, color: "text-green-500" },
      { id: "yes_self", label: "Já usei por conta própria", icon: CheckCircle2, color: "text-yellow-500" },
      { id: "no", label: "Primeira vez / Nunca usei", icon: Sparkles, color: "text-primary" },
    ]
  },
  {
    id: "goal",
    title: "Qual o seu principal objetivo?",
    subtitle: "Nossos médicos focarão nisso.",
    options: [
      { id: "reduce_rx", label: "Reduzir remédios pesados" },
      { id: "improve_sleep", label: "Melhorar qualidade do sono" },
      { id: "pain_relief", label: "Alívio rápido da dor" },
      { id: "focus", label: "Foco e disposição" },
    ]
  },
  {
    id: "urgency",
    title: "Qual a sua urgência?",
    subtitle: "Temos disponibilidade imediata se precisar.",
    options: [
      { id: "today", label: "Preciso falar hoje mesmo ⚡" },
      { id: "schedule", label: "Quero agendar com calma 📅" },
    ]
  },
  {
    id: "preference",
    title: "Preferência de Atendimento",
    subtitle: "Quem você prefere que te atenda?",
    options: [
      { id: "next_available", label: "Próximo médico disponível 🚀" },
      { id: "specific_expert", label: "Especialista na minha condição 👨‍⚕️" },
    ]
  }
];

export default function OnboardingMatch() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isMatching, setIsMatching] = useState(false);
  const [showMatch, setShowMatch] = useState(false);

  const handleSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [questions[currentStep].id]: optionId }));
    
    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    } else {
      processMatch();
    }
  };

  const processMatch = () => {
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
      setShowMatch(true);
    }, 2000);
  };

  const handleStartConsultation = () => {
    // Redirecionar para o cadastro obrigatório repassando a flag de prioridade
    navigate("/cadastro?fastTrack=true");
  };

  if (showMatch) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-full max-w-sm"
          >
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-500 font-bold text-sm mb-4">
                <Sparkles size={14} /> 98% Match Clínico
              </span>
              <h2 className="text-3xl font-display font-black text-foreground">Encontramos seu especialista!</h2>
              <p className="text-muted-foreground mt-2">Brisa IA cruzou seus dados e encontrou o médico ideal para o seu caso.</p>
            </div>

            <Card className="border-primary/40 bg-card/50 overflow-hidden relative shadow-2xl shadow-primary/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <CardContent className="p-6 text-center relative z-10">
                <div className="w-24 h-24 mx-auto bg-muted rounded-full overflow-hidden border-4 border-background shadow-lg mb-4">
                  <img src="https://i.pravatar.cc/150?u=dr_edilson" alt="Dr. Edilson Bezerra" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Dr. Edilson Bezerra</h3>
                <p className="text-sm text-primary font-medium">CRM-SP 123456</p>
                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span className="bg-muted px-2 py-1 rounded-md">Especialista em Dor Crônica</span>
                  <span className="bg-muted px-2 py-1 rounded-md">Disponível Agora</span>
                </div>
                
                <div className="mt-8">
                  <Button onClick={handleStartConsultation} size="lg" className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white font-black text-lg h-14 rounded-2xl shadow-lg shadow-[#00a884]/30 animate-pulse">
                    🟢 Finalizar Cadastro e Ver Médico
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-wider font-bold">
                    Seus dados médicos são retidos com segurança e sigilo
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isMatching) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center space-y-6"
        >
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-black text-foreground">Brisa IA Analisando...</h2>
            <p className="text-muted-foreground mt-2">Cruzando seu perfil com nosso corpo clínico disponível</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentStep];

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full pt-24 px-4 pb-12">
        <div className="mb-8">
          <Progress value={((currentStep + 1) / questions.length) * 100} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground font-bold text-right">Etapa {currentStep + 1} de {questions.length}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground mb-2">
              {currentQ.title}
            </h1>
            <p className="text-muted-foreground mb-8">
              {currentQ.subtitle}
            </p>

            <div className="space-y-3">
              {currentQ.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className="w-full p-4 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    {option.icon && (
                      <div className={`p-2 rounded-xl bg-muted group-hover:bg-background transition-colors ${option.color}`}>
                        <option.icon size={24} />
                      </div>
                    )}
                    <span className="font-bold text-foreground text-lg">{option.label}</span>
                  </div>
                  <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
