import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stethoscope, MessageSquare, Video, ArrowRight, ArrowLeft, CheckCircle2, Brain, Heart, Activity, Shield, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { professionals } from "@/data/professionals";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const interviewQuestions = [
  { id: 1, question: "Qual é o principal motivo da sua consulta?", type: "select", options: ["Dor crônica", "Ansiedade / Estresse", "Insônia", "Epilepsia", "Depressão", "Náusea / Quimioterapia", "Outro"] },
  { id: 2, question: "Há quanto tempo você apresenta esses sintomas?", type: "select", options: ["Menos de 1 mês", "1-6 meses", "6-12 meses", "Mais de 1 ano", "Mais de 5 anos"] },
  { id: 3, question: "Você já utilizou cannabis medicinal anteriormente?", type: "radio", options: ["Sim, com prescrição médica", "Sim, sem prescrição", "Não, nunca utilizei"] },
  { id: 4, question: "Você utiliza algum medicamento atualmente? Se sim, quais?", type: "textarea" },
  { id: 5, question: "Possui alguma alergia conhecida?", type: "textarea" },
  { id: 6, question: "Como você descreveria seu estilo de vida?", type: "select", options: ["Sedentário", "Moderadamente ativo", "Ativo / Pratica exercícios regularmente", "Muito ativo / Atleta"] },
  { id: 7, question: "O que você espera alcançar com o tratamento?", type: "textarea" },
];

const Telemedicina = () => {
  const [step, setStep] = useState(0); // 0 = intro, 1-7 = questions, 8 = result
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const currentQ = interviewQuestions[step - 1];
  const progress = step === 0 ? 0 : step > 7 ? 100 : Math.round((step / 7) * 100);

  const medicos = professionals.filter(p => p.category === "Médicos Prescritores");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-12 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center glow-green">
                <Stethoscope size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">TELEMEDICINA</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
              Consulta <span className="text-gradient-green">Inteligente</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium">
              Nossa IA realiza uma pré-entrevista com 7 perguntas para otimizar seu atendimento. O especialista recebe seu resumo antes da consulta.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Progress */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-bold">Progresso da entrevista</span>
              <span className="text-xs text-primary font-bold">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Intro */}
            {step === 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <Card className="border-border">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-green border border-green flex items-center justify-center">
                      <Brain size={40} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-display font-black text-foreground mb-4">Entrevista IA — Pré-consulta</h2>
                    <p className="text-muted-foreground mb-6">
                      Responda 7 perguntas rápidas para que o especialista receba seu histórico antes do atendimento. Isso garante uma consulta mais objetiva e personalizada.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4 mb-8">
                      {[
                        { icon: Activity, label: "Análise de sintomas" },
                        { icon: Heart, label: "Histórico médico" },
                        { icon: Shield, label: "Dados protegidos (LGPD)" },
                      ].map((f, i) => (
                        <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                          <f.icon size={20} className="text-primary mx-auto mb-2" />
                          <span className="text-xs font-bold text-foreground">{f.label}</span>
                        </div>
                      ))}
                    </div>

                    <Button size="lg" className="font-black bg-primary text-primary-foreground rounded-2xl h-14 px-10" onClick={() => setStep(1)}>
                      Iniciar Entrevista <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Questions */}
            {step >= 1 && step <= 7 && currentQ && (
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                <Card className="border-border">
                  <CardContent className="p-8">
                    <Badge className="mb-4 bg-primary/10 text-primary border-green text-xs">Pergunta {step} de 7</Badge>
                    <h3 className="text-xl font-display font-black text-foreground mb-6">{currentQ.question}</h3>

                    {currentQ.type === "select" && (
                      <Select value={answers[step] || ""} onValueChange={(v) => setAnswers({ ...answers, [step]: v })}>
                        <SelectTrigger className="bg-muted border-border">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {currentQ.options?.map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {currentQ.type === "radio" && (
                      <RadioGroup value={answers[step] || ""} onValueChange={(v) => setAnswers({ ...answers, [step]: v })} className="space-y-3">
                        {currentQ.options?.map((o) => (
                          <div key={o} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                            <RadioGroupItem value={o} id={o} />
                            <Label htmlFor={o} className="text-sm text-foreground cursor-pointer">{o}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {currentQ.type === "textarea" && (
                      <Textarea
                        value={answers[step] || ""}
                        onChange={(e) => setAnswers({ ...answers, [step]: e.target.value })}
                        placeholder="Digite sua resposta..."
                        className="bg-muted border-border min-h-[100px]"
                      />
                    )}

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" className="rounded-xl" onClick={() => setStep(step - 1)}>
                        <ArrowLeft size={16} className="mr-1" /> Voltar
                      </Button>
                      <Button
                        className="font-black bg-primary text-primary-foreground rounded-xl"
                        onClick={() => setStep(step + 1)}
                        disabled={!answers[step]}
                      >
                        {step === 7 ? "Ver Resultado" : "Próxima"} <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Result */}
            {step > 7 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <Card className="border-border border-green/20 mb-6">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-display font-black text-foreground mb-2">Pré-entrevista Concluída!</h2>
                    <p className="text-muted-foreground mb-6">
                      Suas respostas foram registradas. O especialista receberá seu resumo antes do atendimento para uma consulta mais objetiva e personalizada.
                    </p>

                    <div className="p-4 rounded-2xl bg-gradient-green border border-green mb-6 text-left">
                      <h4 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                        <Leaf size={14} className="text-primary" /> Recomendação IA
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Com base nas suas respostas, recomendamos consultar um <span className="text-primary font-bold">médico prescritor</span> para avaliação personalizada.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Possíveis variedades indicadas: Charlotte's Web (CBD alto), ACDC (CBD:THC 20:1), Harlequin (equilíbrio funcional).
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <h3 className="font-display font-black text-foreground mb-4">Escolha seu Especialista</h3>
                <div className="space-y-3">
                  {medicos.map((pro) => (
                    <Card key={pro.id} className="border-border hover:border-primary/20 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <img src={pro.imageUrl} alt={pro.name} className="w-12 h-12 rounded-xl object-cover border border-border" />
                          <div>
                            <p className="font-black text-sm text-foreground">{pro.name}</p>
                            <p className="text-xs text-muted-foreground">{pro.tags.join(" • ")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-display font-black text-primary">{pro.price}</span>
                          <Button size="sm" className="font-black bg-primary text-primary-foreground rounded-xl" asChild>
                            <Link to={`/pay?type=appointment&proId=${pro.id}&amount=${pro.priceValue}`}>
                              Agendar <ArrowRight size={14} className="ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="rounded-xl flex-1" asChild>
                    <Link to="/profissionais">Ver Todos os Profissionais</Link>
                  </Button>
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
