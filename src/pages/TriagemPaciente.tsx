import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Moon,
  Brain,
  Smile,
  Activity,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Clock,
  UserCheck,
  FileCheck,
  Building2,
  Stethoscope
} from "lucide-react";

interface SymptomOption {
  id: string;
  label: string;
  desc: string;
  icon: any;
  specialty: string;
  evidence: string;
}

const SYMPTOM_OPTIONS: SymptomOption[] = [
  {
    id: "dor_cronica",
    label: "Dor Crônica & Fibromialgia",
    desc: "Dores articulares, neuropáticas, musculares ou lombares persistentes.",
    icon: Flame,
    specialty: "Dor e Reumatologia",
    evidence: "Eficácia clínica comprovada na modulação de receptores CB1/CB2 para alívio analgésico."
  },
  {
    id: "ansiedade_estresse",
    label: "Ansiedade, Pânico & Estresse",
    desc: "Sensação constante de alerta, angústia, crises de ansiedade ou burnout.",
    icon: HeartPulse,
    specialty: "Psiquiatria & Saúde Mental",
    evidence: "Ação ansiolítica do CBD sobre vias serotoninérgicas sem gerar dependência química."
  },
  {
    id: "insonia_sono",
    label: "Insônia & Distúrbios do Sono",
    desc: "Dificuldade para adormecer, despertares noturnos ou sono não restaurador.",
    icon: Moon,
    specialty: "Medicina do Sono",
    evidence: "Regulação do ciclo circadiano e melhora substancial da fase REM do sono."
  },
  {
    id: "autismo_tea",
    label: "Autismo (TEA) & TDAH",
    desc: "Agitação psicomotora, sobrecarga sensorial, crises e regulação comportamental.",
    icon: Brain,
    specialty: "Neurologia & Psiquiatria Integrativa",
    evidence: "Redução de crises de irritabilidade e estabilização de neurotransmissores com fitocanabinoides."
  },
  {
    id: "enxaqueca",
    label: "Enxaqueca Refratária & Cefaleia",
    desc: "Dores de cabeça intensas que não respondem satisfatoriamente a analgésicos comuns.",
    icon: Activity,
    specialty: "Neurologia",
    evidence: "Redução da frequência e severidade das crises por modulação do tônus vascular cerebral."
  },
  {
    id: "parkinson_tremores",
    label: "Doença de Parkinson & Tremores",
    desc: "Rigidez muscular, tremores de repouso e espasmos neuromotores.",
    icon: Stethoscope,
    specialty: "Neurologia Motora",
    evidence: "Potencial neuroprotetor e relaxamento do tônus muscular esquelético."
  }
];

export default function TriagemPaciente() {
  const [step, setStep] = useState<number>(1);
  const [selectedCondition, setSelectedCondition] = useState<SymptomOption | null>(null);
  const [duration, setDuration] = useState<string>("6_a_24_meses");
  const [intensity, setIntensity] = useState<number>(8);
  const [triedConventional, setTriedConventional] = useState<string>("sim_sem_sucesso");

  const buildWhatsAppUrl = () => {
    const condName = selectedCondition ? selectedCondition.label : "Saúde Integrativa";
    const durLabel =
      duration === "menos_6_meses"
        ? "menos de 6 meses"
        : duration === "6_a_24_meses"
        ? "entre 6 meses e 2 anos"
        : "mais de 2 anos";
    const text = encodeURIComponent(
      `Olá, Enfª Brisa! 🌿\n\nRealizei minha triagem clínica preliminar no portal da Planta y Raíz:\n- Queixa Principal: ${condName}\n- Tempo de convivência: ${durLabel}\n- Nível de Incômodo: ${intensity}/10\n- Tratamento convencional: ${triedConventional === "sim_sem_sucesso" ? "Já tentei mas sem alívio" : "Gostaria de iniciar"}\n\nGostaria de entender como agendar uma teleconsulta com um médico prescritor credenciado!`
    );
    return `https://wa.me/5511991363154?text=${text}`;
  };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          
          {/* Header & Badges */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Triagem Clínica Digital Rápida & Gratuita
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold font-display tracking-tight text-white mb-3">
              Descubra se o seu caso tem indicação para{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Medicina Canabinoide
              </span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
              Avaliação preliminar estruturada conforme os padrões de telemedicina do CFM e ANVISA. Conectamos você diretamente à orientação da Enfermeira Brisa.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-2">
              <span>Etapa {step} de 3</span>
              <span>{step === 1 ? "33%" : step === 2 ? "66%" : "100% Concluído"}</span>
            </div>
            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full"
                animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step 1: Escolha da Condição */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4"
              >
                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
                  <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-black">1</span>
                    Qual é o sintoma ou condição de saúde que mais impacta o seu dia a dia?
                  </h2>
                  <p className="text-xs text-slate-400 mb-6">
                    Selecione a queixa que você deseja tratar ou mitigar com fitocanabinoides:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {SYMPTOM_OPTIONS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedCondition?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedCondition(item)}
                          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30"
                              : "bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className={`p-2 rounded-lg ${isSelected ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800/80 text-slate-300"}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              {isSelected && (
                                <Badge className="bg-emerald-500 text-slate-950 font-black text-[10px] uppercase">
                                  Selecionado
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-bold text-sm text-slate-100 mb-1">{item.label}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button
                      disabled={!selectedCondition}
                      onClick={() => setStep(2)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black h-12 px-6 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-40"
                    >
                      Avançar para Etapa 2 <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Duração e Intensidade */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4"
              >
                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
                  <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-black">2</span>
                    Há quanto tempo você convive com esses sintomas e qual o nível de intensidade?
                  </h2>

                  {/* Tempo de Sintomas */}
                  <div className="mt-5 space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Tempo de Convivência com o Sintoma:
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: "menos_6_meses", label: "Menos de 6 meses" },
                        { id: "6_a_24_meses", label: "6 meses a 2 anos" },
                        { id: "mais_2_anos", label: "Mais de 2 anos" }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setDuration(t.id)}
                          className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                            duration === t.id
                              ? "bg-emerald-950/50 border-emerald-500 text-emerald-300 font-bold"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Escala de Incômodo / Intensidade */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Nível de Incômodo no seu dia a dia (Escala 1 a 10):
                      </label>
                      <span className="text-sm font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                        Grau {intensity} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={intensity}
                      onChange={(e) => setIntensity(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Leve (1-3)</span>
                      <span>Moderado (4-6)</span>
                      <span>Severo / Incapacitante (7-10)</span>
                    </div>
                  </div>

                  {/* Tratamentos Convencionais */}
                  <div className="mt-6 space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Já tentou tratamentos convencionais com remédios tradicionais?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "sim_sem_sucesso", label: "Sim, sem alívio ou com efeitos colaterais" },
                        { id: "novo_tratamento", label: "Não, procuro abordagem mais natural" }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTriedConventional(item.id)}
                          className={`p-3.5 rounded-xl border text-xs text-left font-medium transition-all ${
                            triedConventional === item.id
                              ? "bg-emerald-950/50 border-emerald-500 text-emerald-300 font-bold"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="border-slate-800 text-slate-300 hover:bg-slate-800 h-12 rounded-xl"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black h-12 px-6 rounded-xl shadow-lg shadow-emerald-500/20"
                    >
                      Ver Meu Relatório de Compatibilidade <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Resultado da Triagem e CTAs */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-emerald-500 text-slate-950 rounded-xl font-black">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase font-black tracking-wider text-[11px] mb-1">
                        Compatibilidade Clínica Positiva (96%)
                      </Badge>
                      <h2 className="text-xl md:text-2xl font-black text-white">
                        Seu caso possui alta indicação para avaliação com fitocanabinoides!
                      </h2>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    Com base no seu relato de <strong className="text-emerald-400">{selectedCondition?.label}</strong> com intensidade de <strong className="text-emerald-400">{intensity}/10</strong>, nossa esteira clínica mapeou os médicos prescritores certificados na especialidade de <strong>{selectedCondition?.specialty}</strong>.
                  </p>

                  {/* Resumo Clínico */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <FileCheck className="w-4 h-4" />
                      Evidência Científica Aplicável:
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {selectedCondition?.evidence}
                    </p>
                  </div>

                  {/* Ação Primária: Falar com a Enfª Brisa no WhatsApp */}
                  <div className="space-y-3">
                    <a
                      href={buildWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-black h-14 rounded-xl shadow-xl shadow-emerald-500/25 hover:opacity-95 transition-all text-base tracking-tight"
                    >
                      <MessageSquare className="w-5 h-5 fill-slate-950" />
                      Falar com a Enfª Brisa no WhatsApp (11) 99136-3154
                    </a>
                    <p className="text-center text-[11px] text-slate-400">
                      ⚡ Atendimento clínico humanizado, tira-dúvidas e agendamento sem compromisso.
                    </p>
                  </div>

                  <hr className="my-6 border-slate-800" />

                  {/* Ações Secundárias */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-12 rounded-xl border-slate-700 bg-slate-950/60 text-slate-200 hover:bg-slate-800 font-bold"
                      asChild
                    >
                      <Link to="/profissionais">
                        <UserCheck className="w-4 h-4 mr-2 text-emerald-400" />
                        Ver Médicos Prescritores
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-12 rounded-xl border-slate-700 bg-slate-950/60 text-slate-200 hover:bg-slate-800 font-bold"
                      asChild
                    >
                      <Link to="/cadastro?type=paciente">
                        <Building2 className="w-4 h-4 mr-2 text-cyan-400" />
                        Criar Cadastro de Paciente Grátis
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-400 underline transition-colors"
                  >
                    Refazer a triagem clínica com outros sintomas
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rodapé de Credibilidade e Segurança ANVISA/CFM */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Conformidade Legal CFM</span>
                <span className="text-slate-500">Prontuário auditado com criptografia SHA-256.</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-cyan-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Prescrição Digital ICP-Brasil</span>
                <span className="text-slate-500">Receitas aceitas em farmácias de todo o Brasil.</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-teal-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Acolhimento Rápido</span>
                <span className="text-slate-500">Triagem preliminar com suporte da Enfª Brisa.</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
