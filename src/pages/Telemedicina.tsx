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
import { Stethoscope, ArrowRight, ArrowLeft, CheckCircle2, Brain, Heart, Activity, Shield, Leaf, Watch, FileText, Download, Printer, UserCheck, Scale, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { professionals } from "@/data/professionals";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

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
  // step: -1 = TCLE consent, 0 = intro/identification, 1-10 = questions, 11+ = results
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

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                <Scale size={10} className="mr-1" /> Resolução CFM 2.314/2022
              </Badge>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                <Shield size={10} className="mr-1" /> RDC ANVISA 660/2022
              </Badge>
              <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary">
                <Shield size={10} className="mr-1" /> LGPD Conforme
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Progress */}
          {step >= 0 && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-bold">Progresso da entrevista</span>
                <span className="text-xs text-primary font-bold">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da entrevista">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="max-w-2xl mx-auto">

            {/* ========== STEP -1: TCLE — Termo de Consentimento Livre e Esclarecido ========== */}
            {step === -1 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <Card className="border-border">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-gold border border-gold flex items-center justify-center">
                        <Scale size={24} className="text-[hsl(45,76%,52%)]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-black text-foreground">Termo de Consentimento</h2>
                        <p className="text-xs text-muted-foreground font-semibold">Resolução CFM nº 2.314/2022 — Art. 5º e 12</p>
                      </div>
                    </div>

                    <div className="bg-muted/30 border border-border rounded-2xl p-5 mb-6 max-h-[300px] overflow-y-auto text-sm text-muted-foreground leading-relaxed space-y-3">
                      <p className="font-bold text-foreground text-sm">TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA TELECONSULTA (TCLE)</p>

                      <p><strong className="text-foreground">1. Natureza do Atendimento:</strong> Eu, paciente, declaro que estou ciente de que o atendimento será realizado por meio de tecnologia de telemedicina, conforme Resolução CFM nº 2.314/2022, e que a teleconsulta ocorrerá em tempo real por chat ou vídeo, com profissional médico devidamente registrado no CRM.</p>

                      <p><strong className="text-foreground">2. Identificação e Autenticação:</strong> Comprometo-me a fornecer dados pessoais verdadeiros (nome completo, CPF, data de nascimento) para identificação obrigatória conforme Art. 5º da Resolução CFM nº 2.314/2022. A verificação da identidade poderá ser solicitada por foto de documento com selfie.</p>

                      <p><strong className="text-foreground">3. Registro em Prontuário:</strong> Todas as informações da teleconsulta serão registradas em prontuário eletrônico do paciente, conforme Art. 6º da Resolução CFM nº 2.314/2022 e Resolução CFM nº 1.638/2002. O prontuário será mantido sob sigilo médico pelo prazo mínimo de 20 anos.</p>

                      <p><strong className="text-foreground">4. Prescrição Digital:</strong> As prescrições serão emitidas exclusivamente por médico habilitado, com assinatura digital ICP-Brasil válida, conforme Lei 14.063/2020 e RDC ANVISA nº 660/2022. Produtos de cannabis medicinal serão prescritos em conformidade com a regulamentação vigente da ANVISA.</p>

                      <p><strong className="text-foreground">5. Limitações da Telemedicina:</strong> Estou ciente de que a telemedicina possui limitações inerentes, como impossibilidade de exame físico direto. O médico poderá, a qualquer momento, solicitar consulta presencial se julgar clinicamente necessário (Art. 12, §2º, Resolução CFM nº 2.314/2022).</p>

                      <p><strong className="text-foreground">6. Proteção de Dados:</strong> Meus dados pessoais e de saúde serão tratados como dados sensíveis conforme LGPD (Lei 13.709/2018, Art. 11), com consentimento explícito, criptografia AES-256, e acesso restrito aos profissionais envolvidos no atendimento. Posso revogar o consentimento a qualquer momento.</p>

                      <p><strong className="text-foreground">7. Direito de Recusa:</strong> Tenho o direito de recusar ou interromper o atendimento por telemedicina a qualquer momento, sem prejuízo ao meu tratamento, podendo solicitar atendimento presencial.</p>

                      <p><strong className="text-foreground">8. Gravação:</strong> A consulta NÃO será gravada em áudio ou vídeo sem meu consentimento expresso prévio, conforme Art. 7º da Resolução CFM nº 2.314/2022.</p>

                      <p className="text-[10px] text-muted-foreground/60">Referências legais: Resolução CFM nº 2.314/2022 | Lei 13.709/2018 (LGPD) | Lei 14.063/2020 | RDC ANVISA nº 660/2022 | Resolução CFM nº 1.638/2002 | Código de Ética Médica (Resolução CFM nº 2.217/2018)</p>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                      <Checkbox
                        id="tcle-accept"
                        checked={tcleAccepted}
                        onCheckedChange={(checked) => setTcleAccepted(!!checked)}
                      />
                      <Label htmlFor="tcle-accept" className="text-sm text-foreground cursor-pointer leading-relaxed">
                        Li e compreendi integralmente o Termo de Consentimento Livre e Esclarecido (TCLE) para teleconsulta. Concordo com os termos e autorizo o tratamento dos meus dados pessoais e de saúde conforme descrito.
                      </Label>
                    </div>

                    <Button
                      size="lg"
                      className="w-full font-black bg-primary text-primary-foreground rounded-2xl h-14"
                      onClick={() => setStep(0)}
                      disabled={!tcleAccepted}
                    >
                      Aceitar e Continuar <ArrowRight size={18} className="ml-2" />
                    </Button>

                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      🔒 Seus dados são protegidos pela LGPD. Ao aceitar, você não está se comprometendo com nenhum pagamento.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ========== STEP 0: Patient Identification (CFM Art. 5º) ========== */}
            {step === 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <Card className="border-border">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center">
                        <UserCheck size={24} className="text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-black text-foreground">Identificação do Paciente</h2>
                        <p className="text-xs text-muted-foreground font-semibold">Obrigatório — Resolução CFM 2.314/2022, Art. 5º</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="patient-name" className="text-sm font-bold text-foreground">Nome completo *</Label>
                        <Input
                          id="patient-name"
                          value={patientData.nome}
                          onChange={(e) => setPatientData({ ...patientData, nome: e.target.value })}
                          placeholder="Nome completo conforme documento"
                          className="mt-1 bg-muted border-border"
                          autoComplete="name"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="patient-cpf" className="text-sm font-bold text-foreground">CPF *</Label>
                          <Input
                            id="patient-cpf"
                            value={patientData.cpf}
                            onChange={(e) => setPatientData({ ...patientData, cpf: formatCpf(e.target.value) })}
                            placeholder="000.000.000-00"
                            className="mt-1 bg-muted border-border"
                            maxLength={14}
                            inputMode="numeric"
                          />
                        </div>
                        <div>
                          <Label htmlFor="patient-dob" className="text-sm font-bold text-foreground">Data de nascimento *</Label>
                          <Input
                            id="patient-dob"
                            type="date"
                            value={patientData.dataNascimento}
                            onChange={(e) => setPatientData({ ...patientData, dataNascimento: e.target.value })}
                            className="mt-1 bg-muted border-border"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="patient-email" className="text-sm font-bold text-foreground">E-mail *</Label>
                          <Input
                            id="patient-email"
                            type="email"
                            value={patientData.email}
                            onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                            placeholder="seu@email.com"
                            className="mt-1 bg-muted border-border"
                            autoComplete="email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="patient-phone" className="text-sm font-bold text-foreground">Telefone/WhatsApp *</Label>
                          <Input
                            id="patient-phone"
                            value={patientData.telefone}
                            onChange={(e) => setPatientData({ ...patientData, telefone: formatPhone(e.target.value) })}
                            placeholder="(11) 98765-4321"
                            className="mt-1 bg-muted border-border"
                            maxLength={15}
                            inputMode="tel"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-3 rounded-xl bg-muted/30 border border-border">
                      <p className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                        <Shield size={12} className="text-primary shrink-0 mt-0.5" />
                        Seus dados são protegidos pela LGPD (Lei 13.709/2018) e serão usados exclusivamente para identificação no prontuário eletrônico, conforme Resolução CFM nº 1.638/2002. Acesso restrito ao médico responsável pelo atendimento.
                      </p>
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button variant="outline" className="rounded-xl" onClick={() => setStep(-1)}>
                        <ArrowLeft size={16} className="mr-1" /> Voltar
                      </Button>
                      <Button
                        className="font-black bg-primary text-primary-foreground rounded-xl"
                        onClick={() => setStep(1)}
                        disabled={!isPatientDataValid()}
                      >
                        Iniciar Entrevista <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ========== STEPS 1-10: Interview Questions ========== */}
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
                        aria-label={currentQ.question}
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
                          aria-label="Proporção CBD/THC"
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

            {/* ========== STEP 11+: Results ========== */}
            {step > 10 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
                {/* AI Analysis */}
                <Card className="border-border border-green/20">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-display font-black text-foreground mb-2">Pré-entrevista Concluída!</h2>
                    <p className="text-muted-foreground mb-4">
                      Paciente: <span className="font-bold text-foreground">{patientData.nome}</span>
                    </p>
                    <p className="text-muted-foreground text-sm mb-6">Suas 10 respostas foram registradas no prontuário eletrônico.</p>

                    <div className="p-4 rounded-2xl bg-gradient-green border border-green mb-4 text-left">
                      <h4 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                        <Leaf size={14} className="text-primary" /> Recomendação IA (pré-análise)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Com base nas suas respostas, recomendamos consultar um <span className="text-primary font-bold">médico prescritor</span> para avaliação clínica personalizada.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Possíveis variedades indicadas: Charlotte's Web (CBD alto), ACDC (CBD:THC 20:1), Harlequin (equilíbrio funcional).
                      </p>
                      <div className="mt-3 p-2 rounded-lg bg-background/50 border border-border">
                        <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                          <AlertTriangle size={10} className="text-[hsl(45,76%,52%)] shrink-0 mt-0.5" />
                          Esta é uma pré-análise automatizada e NÃO constitui diagnóstico médico. A prescrição final será feita exclusivamente pelo médico durante a consulta, conforme Art. 6º da Resolução CFM nº 2.314/2022.
                        </p>
                      </div>
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
                            <span className="text-lg" aria-hidden="true">{s.icon}</span>
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
                                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={s.value} aria-valuemax={8} aria-label={`${s.label}: ${s.value}h`}>
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

                {/* ANVISA Prescription Template — Updated for RDC 660/2022 + CFM 2.314/2022 */}
                {showPrescription && (
                  <Card className="border-border border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display font-black text-foreground flex items-center gap-2">
                          <FileText size={16} className="text-primary" /> Receita Digital ANVISA
                        </h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="rounded-xl text-xs" aria-label="Baixar receita em PDF">
                            <Download size={12} className="mr-1" aria-hidden="true" /> PDF
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs" aria-label="Imprimir receita">
                            <Printer size={12} className="mr-1" aria-hidden="true" /> Imprimir
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white text-black p-6 rounded-xl border-2 border-primary/30">
                        <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
                          <p className="text-[10px] text-gray-500 font-bold">RECEITUÁRIO DE CONTROLE ESPECIAL — 1ª VIA (FARMÁCIA)</p>
                          <p className="text-[10px] text-gray-500">RDC ANVISA nº 660/2022 | Portaria SVS/MS nº 344/98</p>
                          <h4 className="font-bold text-lg mt-2">🌿 Planta & Raiz — Clínica Online</h4>
                          <p className="text-xs text-gray-600">CNPJ: __.___.___ /0001-__ | Responsável Técnico: CRM ______/UF</p>
                          <p className="text-[10px] text-gray-400">Endereço do estabelecimento: __________________________________</p>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Paciente:</span>
                            <span className="font-bold">{patientData.nome || "____________________"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">CPF:</span>
                            <span>{patientData.cpf || "___.___.___-__"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Data de Nascimento:</span>
                            <span>{patientData.dataNascimento ? new Date(patientData.dataNascimento + "T12:00:00").toLocaleDateString("pt-BR") : "__/__/____"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Data da Prescrição:</span>
                            <span>{new Date().toLocaleDateString("pt-BR")}</span>
                          </div>

                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <p className="font-bold mb-1 text-xs text-gray-500">CID-10 (Código Internacional de Doenças):</p>
                            <p className="text-gray-600">___.__ — ________________________________</p>
                          </div>

                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <p className="font-bold mb-2">PRESCRIÇÃO:</p>
                            <div className="space-y-1.5 text-gray-600">
                              <p>1. Canabidiol (CBD) — Uso oral</p>
                              <p className="pl-4">• Concentração: ____mg/mL</p>
                              <p className="pl-4">• Posologia: ____ gotas, ____ vezes ao dia</p>
                              <p className="pl-4">• Via de administração: sublingual</p>
                              <p className="pl-4">• Duração do tratamento: ____ dias</p>
                              <p className="pl-4">• Quantidade total prescrita: ____ frasco(s) de ____mL</p>
                            </div>
                          </div>

                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <p className="font-bold mb-1">ORIENTAÇÕES AO PACIENTE:</p>
                            <p className="text-xs text-gray-500">Manter em local fresco e protegido da luz. Uso exclusivo do paciente. Comunicar ao médico qualquer reação adversa. Não utilizar se estiver grávida ou amamentando sem orientação médica.</p>
                          </div>

                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <p className="font-bold mb-1">OBSERVAÇÕES LEGAIS:</p>
                            <p className="text-xs text-gray-500">Produto autorizado pela ANVISA conforme RDC nº 660/2022. Uso exclusivo do paciente identificado. Dispensação mediante apresentação de receituário de controle especial (2 vias). Válido por 30 dias da emissão. Prescrição emitida em teleconsulta conforme Resolução CFM nº 2.314/2022.</p>
                          </div>

                          <div className="border-t-2 border-gray-300 pt-4 mt-4 text-center">
                            <div className="w-48 mx-auto border-b border-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">Assinatura Digital do Médico</p>
                            <p className="text-[10px] text-gray-400">CRM: ______/UF | RQE: ______</p>
                            <p className="text-[10px] text-gray-400 mt-1">🔐 Assinatura digital ICP-Brasil (Lei 14.063/2020) • Certificado: ****-****</p>
                            <p className="text-[10px] text-gray-400">Validação: https://validar.iti.gov.br</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        <p className="text-[10px] text-muted-foreground">⚠️ MODELO de receita digital. A prescrição real será emitida pelo médico após teleconsulta, com assinatura digital ICP-Brasil válida (Lei 14.063/2020, nível avançado ou qualificado).</p>
                        <p className="text-[10px] text-muted-foreground">📋 Conforme Resolução CFM nº 2.314/2022, Art. 6º: toda prescrição em telemedicina deve conter identificação do médico (CRM + RQE), identificação do paciente (nome + CPF), CID-10, e ser registrada em prontuário eletrônico.</p>
                      </div>
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
                          <img src={pro.imageUrl} alt={`Foto do ${pro.name}`} className="w-12 h-12 rounded-xl object-cover border border-border" />
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
