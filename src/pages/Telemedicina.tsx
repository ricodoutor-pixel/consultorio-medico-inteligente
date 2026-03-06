import { useState } from "react";
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
import { Stethoscope, ArrowRight, ArrowLeft, CheckCircle2, Brain, Heart, Activity, Shield, Leaf, Watch, FileText, Download, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { professionals } from "@/data/professionals";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const interviewQuestions = [
  { id: 1, question: "Qual é sua principal queixa?", type: "textarea", placeholder: "Descreva seus sintomas principais..." },
  { id: 2, question: "Há quanto tempo tem esse problema?", type: "select", options: ["Menos de 1 mês", "1-3 meses", "3-6 meses", "Mais de 6 meses", "Mais de 1 ano"] },
  { id: 3, question: "Já utilizou cannabis medicinal antes?", type: "radio", options: ["Sim, com prescrição médica", "Sim, sem prescrição", "Não, nunca utilizei"] },
  { id: 4, question: "Possui alguma alergia conhecida?", type: "textarea", placeholder: "Liste suas alergias ou escreva 'Nenhuma'" },
  { id: 5, question: "Quais medicamentos utiliza atualmente?", type: "textarea", placeholder: "Liste medicamentos e dosagens atuais..." },
  { id: 6, question: "Histórico familiar relevante?", type: "textarea", placeholder: "Doenças na família (pais, irmãos)..." },
  { id: 7, question: "Possui alguma comorbidade?", type: "checkbox", options: ["Hipertensão", "Diabetes", "Depressão", "Ansiedade", "Insônia", "Nenhuma"] },
  { id: 8, question: "Qual é seu objetivo com o tratamento?", type: "select", options: ["Alívio de dor", "Reduzir ansiedade", "Melhorar sono", "Criatividade e foco", "Bem-estar geral", "Outro"] },
  { id: 9, question: "Preferência de proporção THC/CBD?", type: "slider" },
  { id: 10, question: "Disponibilidade para consulta?", type: "select", options: ["Hoje", "Amanhã", "Esta semana", "Próxima semana", "Flexível"] },
];

// Mock wearable data
const wearableData = {
  heartRate: Array.from({ length: 24 }, (_, i) => ({ hora: `${i}h`, bpm: Math.floor(60 + Math.random() * 30) })),
  sleep: { deep: 2.1, light: 3.4, rem: 1.8, awake: 0.5 },
  steps: 8432,
  hrv: 42,
};

const Telemedicina = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [sliderValue, setSliderValue] = useState([50]);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showWearables, setShowWearables] = useState(false);

  const currentQ = interviewQuestions[step - 1];
  const progress = step === 0 ? 0 : step > 10 ? 100 : Math.round((step / 10) * 100);
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

  const tooltipStyle = { background: "hsl(240 15% 8%)", border: "1px solid hsl(240 10% 16%)", borderRadius: "12px", color: "hsl(240 10% 93%)" };

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
              <span className="text-sm font-bold text-primary">TELEMEDICINA AVANÇADA</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
              Consulta <span className="text-gradient-green">Inteligente</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium">
              Pré-entrevista adaptativa com 10 perguntas + análise IA + receita digital ANVISA + integração com wearables.
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
                      Responda 10 perguntas adaptativas para que o especialista receba seu resumo clínico completo antes do atendimento.
                    </p>

                    <div className="grid sm:grid-cols-4 gap-3 mb-8">
                      {[
                        { icon: Activity, label: "Análise de sintomas" },
                        { icon: Heart, label: "Histórico médico" },
                        { icon: Shield, label: "Conformidade LGPD" },
                        { icon: Watch, label: "Dados de wearables" },
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

            {/* Questions 1-10 */}
            {step >= 1 && step <= 10 && currentQ && (
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                <Card className="border-border">
                  <CardContent className="p-8">
                    <Badge className="mb-4 bg-primary/10 text-primary border-green text-xs">Pergunta {step} de 10</Badge>
                    <h3 className="text-xl font-display font-black text-foreground mb-6">{currentQ.question}</h3>

                    {currentQ.type === "select" && (
                      <Select value={answers[step] || ""} onValueChange={(v) => setAnswers({ ...answers, [step]: v })}>
                        <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {currentQ.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}

                    {currentQ.type === "radio" && (
                      <RadioGroup value={answers[step] || ""} onValueChange={(v) => setAnswers({ ...answers, [step]: v })} className="space-y-3">
                        {currentQ.options?.map((o) => (
                          <div key={o} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                            <RadioGroupItem value={o} id={`q${step}-${o}`} />
                            <Label htmlFor={`q${step}-${o}`} className="text-sm text-foreground cursor-pointer">{o}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {currentQ.type === "textarea" && (
                      <Textarea
                        value={answers[step] || ""}
                        onChange={(e) => setAnswers({ ...answers, [step]: e.target.value })}
                        placeholder={currentQ.placeholder || "Digite sua resposta..."}
                        className="bg-muted border-border min-h-[100px]"
                      />
                    )}

                    {currentQ.type === "checkbox" && (
                      <div className="space-y-3">
                        {currentQ.options?.map((o) => (
                          <div key={o} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                            <Checkbox
                              id={`q${step}-${o}`}
                              checked={((answers[step] as string[]) || []).includes(o)}
                              onCheckedChange={(checked) => handleCheckbox(o, !!checked)}
                            />
                            <Label htmlFor={`q${step}-${o}`} className="text-sm text-foreground cursor-pointer">{o}</Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentQ.type === "slider" && (
                      <div className="space-y-6">
                        <div className="flex justify-between text-xs text-muted-foreground font-bold">
                          <span>Mais CBD (terapêutico)</span>
                          <span>Mais THC (potente)</span>
                        </div>
                        <Slider
                          value={sliderValue}
                          onValueChange={(v) => { setSliderValue(v); setAnswers({ ...answers, [step]: `CBD ${100 - v[0]}% / THC ${v[0]}%` }); }}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between">
                          <Badge className="bg-secondary/10 text-secondary border-secondary/30">CBD {100 - sliderValue[0]}%</Badge>
                          <Badge className="bg-primary/10 text-primary border-green">THC {sliderValue[0]}%</Badge>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" className="rounded-xl" onClick={() => setStep(step - 1)}>
                        <ArrowLeft size={16} className="mr-1" /> Voltar
                      </Button>
                      <Button className="font-black bg-primary text-primary-foreground rounded-xl" onClick={() => setStep(step + 1)} disabled={!isAnswered()}>
                        {step === 10 ? "Ver Resultado" : "Próxima"} <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Result */}
            {step > 10 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
                {/* AI Analysis */}
                <Card className="border-border border-green/20">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-display font-black text-foreground mb-2">Pré-entrevista Concluída!</h2>
                    <p className="text-muted-foreground mb-6">Suas 10 respostas foram registradas com sucesso.</p>

                    <div className="p-4 rounded-2xl bg-gradient-green border border-green mb-4 text-left">
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

                    <div className="flex gap-3 justify-center flex-wrap">
                      <Button variant="outline" className="rounded-xl text-xs" onClick={() => setShowWearables(!showWearables)}>
                        <Watch size={14} className="mr-1" /> {showWearables ? "Ocultar" : "Ver"} Dados Wearables
                      </Button>
                      <Button variant="outline" className="rounded-xl text-xs" onClick={() => setShowPrescription(!showPrescription)}>
                        <FileText size={14} className="mr-1" /> {showPrescription ? "Ocultar" : "Ver"} Modelo Receita ANVISA
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Wearables Mock */}
                {showWearables && (
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                        <Watch size={16} className="text-primary" /> Dados de Wearables (Mock)
                      </h3>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: "Passos Hoje", value: wearableData.steps.toLocaleString(), icon: "🚶" },
                          { label: "FC Média", value: `${Math.round(wearableData.heartRate.reduce((a, b) => a + b.bpm, 0) / 24)} bpm`, icon: "❤️" },
                          { label: "HRV", value: `${wearableData.hrv} ms`, icon: "📊" },
                        ].map((s) => (
                          <div key={s.label} className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                            <span className="text-lg">{s.icon}</span>
                            <p className="text-sm font-black text-foreground">{s.value}</p>
                            <span className="text-[10px] text-muted-foreground">{s.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground mb-2">Frequência Cardíaca (24h)</p>
                          <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={wearableData.heartRate}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 16%)" />
                              <XAxis dataKey="hora" stroke="hsl(240 10% 68%)" fontSize={10} />
                              <YAxis stroke="hsl(240 10% 68%)" fontSize={10} />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Line type="monotone" dataKey="bpm" stroke="hsl(350 80% 55%)" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground mb-2">Qualidade do Sono</p>
                          <div className="space-y-2">
                            {[
                              { label: "Profundo", value: wearableData.sleep.deep, color: "bg-secondary" },
                              { label: "Leve", value: wearableData.sleep.light, color: "bg-primary" },
                              { label: "REM", value: wearableData.sleep.rem, color: "bg-[hsl(45,76%,52%)]" },
                              { label: "Acordado", value: wearableData.sleep.awake, color: "bg-destructive" },
                            ].map((s) => (
                              <div key={s.label} className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground w-16">{s.label}</span>
                                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.value / 8) * 100}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-foreground w-8">{s.value}h</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2">⌚ Apple Watch • Fitbit • Oura Ring (simulado)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ANVISA Prescription Template */}
                {showPrescription && (
                  <Card className="border-border border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display font-black text-foreground flex items-center gap-2">
                          <FileText size={16} className="text-primary" /> Receita Digital ANVISA
                        </h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="rounded-xl text-xs">
                            <Download size={12} className="mr-1" /> PDF
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs">
                            <Printer size={12} className="mr-1" /> Imprimir
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white text-black p-6 rounded-xl border-2 border-primary/30">
                        <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
                          <p className="text-[10px] text-gray-500 font-bold">RECEITUÁRIO DE CONTROLE ESPECIAL</p>
                          <p className="text-[10px] text-gray-500">Portaria SVS/MS nº 344/98 — ANVISA</p>
                          <h4 className="font-bold text-lg mt-2">🌿 Planta & Raiz — Clínica Online</h4>
                          <p className="text-xs text-gray-600">CNPJ: 00.000.000/0001-00 | CRM: 000000/UF</p>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Paciente:</span>
                            <span className="font-bold">____________________</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">CPF:</span>
                            <span>___.___.___-__</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Data:</span>
                            <span>{new Date().toLocaleDateString("pt-BR")}</span>
                          </div>

                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <p className="font-bold mb-2">PRESCRIÇÃO:</p>
                            <p className="text-gray-600">Canabidiol (CBD) — Uso oral</p>
                            <p className="text-gray-600">Concentração: ____mg/mL</p>
                            <p className="text-gray-600">Posologia: ____ gotas, ____ vezes ao dia</p>
                            <p className="text-gray-600">Duração do tratamento: ____ dias</p>
                          </div>

                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <p className="font-bold mb-1">OBSERVAÇÕES:</p>
                            <p className="text-xs text-gray-500">Produto autorizado pela ANVISA conforme RDC nº 660/2022. Uso exclusivo do paciente identificado.</p>
                          </div>

                          <div className="border-t-2 border-gray-300 pt-4 mt-4 text-center">
                            <div className="w-48 mx-auto border-b border-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">Assinatura e Carimbo do Médico</p>
                            <p className="text-[10px] text-gray-400 mt-1">🔐 Assinatura digital validada • Hash: ****-****-****</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3">⚠️ Modelo de receita digital. A prescrição real será emitida pelo médico após consulta com assinatura digital ICP-Brasil.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Choose Specialist */}
                <h3 className="font-display font-black text-foreground">Escolha seu Especialista</h3>
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
