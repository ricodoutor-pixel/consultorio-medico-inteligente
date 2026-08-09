import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Stethoscope, Zap, Clock, Star, ArrowRight, Loader2, 
  HeartPulse, Brain, Activity, CheckCircle2, AlertTriangle
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

type MatchResult = {
  matchType: string;
  bestMatch?: { specialty: string; rating: number; price: number; score: number };
  preRecord?: string;
  urgency?: string;
  message?: string;
};

const OrientacaoRapida = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<"symptoms" | "matching" | "result">("symptoms");
  const [symptoms, setSymptoms] = useState(() => {
    const saved = sessionStorage.getItem("triage_condition");
    if (saved) sessionStorage.removeItem("triage_condition");
    return saved || "";
  });
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [preRecord, setPreRecord] = useState("");

  const handleMatch = async () => {
    if (!symptoms.trim()) {
      toast({ title: "Descreva seus sintomas", variant: "destructive" });
      return;
    }

    setLoading(true);
    setStep("matching");

    try {
      // Step 1: Brisa AI generates pre-record and matches specialty
      const { data: triageData, error: triageError } = await supabase.functions.invoke("brisa-triage", {
        body: { symptoms, mode: "match_doctor" },
      });

      if (triageError) throw triageError;

      const matchInfo = triageData?.match;

      // Step 2: Get full pre-record
      const { data: recordData } = await supabase.functions.invoke("brisa-triage", {
        body: { symptoms, mode: "pre_record", patientInfo: null },
      });

      setPreRecord(recordData?.preRecord || "");

      // Step 3: Try real-time matching (requires auth)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: matchData, error: matchError } = await supabase.functions.invoke("match-doctor", {
          body: { 
            specialty: matchInfo?.specialty, 
            urgency: matchInfo?.urgency,
            symptoms 
          },
        });

        if (matchData?.success) {
          setMatchResult({
            matchType: matchData.matchType,
            bestMatch: matchData.bestMatch,
            urgency: matchInfo?.urgency,
            message: matchData.message,
          });
        } else {
          setMatchResult({
            matchType: "manual",
            urgency: matchInfo?.urgency,
            message: "Selecione um profissional disponível",
          });
        }
      } else {
        setMatchResult({
          matchType: "guest",
          urgency: matchInfo?.urgency,
          message: "Faça login para matching automático com médicos online",
        });
      }

      setStep("result");
    } catch (error) {
      console.error("Matching error:", error);
      toast({ title: "Erro na triagem", description: "Tente novamente.", variant: "destructive" });
      setStep("symptoms");
    } finally {
      setLoading(false);
    }
  };

  const urgencyColor = (u?: string) => {
    switch (u) {
      case "urgente": return "text-red-500 bg-red-500/10 border-red-500/20";
      case "alta": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "media": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      default: return "text-green-500 bg-green-500/10 border-green-500/20";
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div className="text-center mb-10" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-black px-4 py-2 rounded-full mb-4">
              <Zap size={14} /> CONSULTA RÁPIDA — ESTILO UBER
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-3">
              Encontre seu <span className="text-gradient-green">Médico Ideal</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Descreva seus sintomas e nossa IA enfermeira <strong>Brisa</strong> fará a triagem e encontrará o especialista perfeito em segundos.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Step 1: Symptoms */}
            {step === "symptoms" && (
              <motion.div key="symptoms" initial="hidden" animate="visible" exit="hidden" variants={fadeUp}>
                <Card className="border-border max-w-2xl mx-auto">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <HeartPulse size={20} className="text-primary" />
                      </div>
                      <div>
                        <h2 className="font-display font-black text-foreground">Brisa — Enfermeira IA</h2>
                        <p className="text-xs text-muted-foreground">Triagem inteligente com IA</p>
                      </div>
                    </div>

                    <Textarea
                      placeholder="Descreva seus sintomas, há quanto tempo sente, medicamentos que usa, histórico relevante...&#10;&#10;Exemplo: 'Tenho ansiedade severa há 2 anos, uso antidepressivos mas os efeitos colaterais me incomodam. Busco tratamento com cannabis medicinal.'"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      rows={6}
                      className="mb-4 text-sm"
                    />

                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {["Ansiedade / Insônia", "Dor Crônica", "Epilepsia"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSymptoms(prev => prev ? `${prev}. ${s}` : s)}
                          className="text-xs px-3 py-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <Button onClick={handleMatch} className="w-full font-black bg-primary text-primary-foreground h-12 rounded-2xl text-base">
                      <Brain size={18} className="mr-2" /> Iniciar Triagem com Brisa
                    </Button>
                  </CardContent>
                </Card>

                {/* How it works */}
                <div className="grid md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
                  {[
                    { icon: Brain, title: "Brisa analisa", desc: "IA faz triagem e gera pré-prontuário" },
                    { icon: Activity, title: "Matching Uber", desc: "Algoritmo encontra o médico ideal" },
                    { icon: Stethoscope, title: "Orientação Técnica em 5min", desc: "Atendimento imediato ou agendado" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-card/50 border border-border">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <s.icon size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Matching animation */}
            {step === "matching" && (
              <motion.div key="matching" initial="hidden" animate="visible" variants={fadeUp} className="text-center py-16">
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 size={40} className="text-primary animate-spin" />
                  </div>
                </div>
                <h2 className="text-2xl font-display font-black text-foreground mb-2">Brisa está analisando...</h2>
                <p className="text-muted-foreground">Triagem IA + Matching de especialistas em tempo real</p>
                <div className="flex justify-center gap-2 mt-6">
                  {["Analisando sintomas", "Gerando pré-prontuário", "Buscando médicos"].map((t, i) => (
                    <motion.span
                      key={t}
                      className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 1.2 }}
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Results */}
            {step === "result" && matchResult && (
              <motion.div key="result" initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
                {/* Urgency Badge */}
                <div className="text-center">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-black ${urgencyColor(matchResult.urgency)}`}>
                    {matchResult.urgency === "urgente" || matchResult.urgency === "alta" 
                      ? <AlertTriangle size={14} /> 
                      : <CheckCircle2 size={14} />
                    }
                    Urgência: {matchResult.urgency?.toUpperCase() || "BAIXA"}
                  </span>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Pre-Record */}
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                        <HeartPulse size={18} className="text-primary" /> Pré-Prontuário (Brisa IA)
                      </h3>
                      <div className="prose prose-sm prose-invert max-w-none text-muted-foreground text-sm leading-relaxed">
                        <ReactMarkdown>{preRecord || "Gerando pré-prontuário..."}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Match Result */}
                  <div className="space-y-4">
                    {matchResult.bestMatch ? (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 size={20} className="text-primary" />
                            <h3 className="font-display font-black text-foreground">Médico Encontrado!</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Especialidade</span>
                              <span className="text-sm font-black text-foreground">{matchResult.bestMatch.specialty}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Avaliação</span>
                              <span className="text-sm font-black text-foreground flex items-center gap-1">
                                <Star size={12} className="text-primary fill-primary" /> {matchResult.bestMatch.rating}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Valor</span>
                              <span className="text-sm font-black text-gradient-green">
                                R$ {matchResult.bestMatch.price?.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Score Match</span>
                              <span className="text-sm font-black text-primary">{matchResult.bestMatch.score}%</span>
                            </div>
                          </div>
                          <Button className="w-full mt-4 font-black bg-primary text-primary-foreground h-12 rounded-2xl" asChild>
                            <a href={`https://wa.me/5511991363154?text=${encodeURIComponent(`Olá Brisa, finalizei a triagem (${matchResult.bestMatch.specialty}) e quero confirmar a Orientação Técnica.`)}`} target="_blank" rel="noopener noreferrer">
                              Confirmar Orientação Técnica <ArrowRight size={16} className="ml-2" />
                            </a>
                          </Button>
                          <div className="flex items-center gap-2 justify-center mt-3 text-xs text-muted-foreground">
                            <Clock size={12} /> Tempo limite: 5 minutos
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-border">
                        <CardContent className="p-6 text-center">
                          <Stethoscope size={32} className="text-primary mx-auto mb-3" />
                          <h3 className="font-display font-black text-foreground mb-2">{matchResult.message}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {matchResult.matchType === "guest" 
                              ? "Crie sua conta para acessar o matching em tempo real"
                              : "Escolha um profissional manualmente"
                            }
                          </p>
                          {matchResult.matchType === "guest" ? (
                            <Button className="w-full font-black bg-primary text-primary-foreground rounded-2xl" asChild>
                              <Link to="/cadastro">Criar Conta Grátis <ArrowRight size={16} className="ml-2" /></Link>
                            </Button>
                          ) : (
                            <Button className="w-full font-black bg-primary text-primary-foreground rounded-2xl" asChild>
                              <a href="https://wa.me/5511991363154?text=Olá Brisa, quero falar com um especialista." target="_blank" rel="noopener noreferrer">Falar com Brisa (WhatsApp) <ArrowRight size={16} className="ml-2" /></a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Retry */}
                    <Button
                      variant="outline"
                      onClick={() => { setStep("symptoms"); setMatchResult(null); setPreRecord(""); }}
                      className="w-full rounded-2xl border-border"
                    >
                      Nova Triagem
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OrientacaoRapida;
