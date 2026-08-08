import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle2, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackFunnelEvent } from "@/lib/funnel-tracking";

/**
 * ProtocolCalculator — Public lead-gate quiz on homepage
 * 5 perguntas → prévia do perfil canabinoide + captura de nome + lead salvo + WhatsApp Brisa
 * Tracking completo do funil em `funnel_events`.
 */

type Step = {
  key: string;
  question: string;
  options: { value: string; label: string; emoji?: string }[];
};

const STEPS: Step[] = [
  {
    key: "condition",
    question: "Qual sua condição principal?",
    options: [
      { value: "dor", label: "Dor crônica / Fibromialgia", emoji: "🦴" },
      { value: "ansiedade", label: "Ansiedade / Insônia", emoji: "🧠" },
      { value: "neuro", label: "Epilepsia / Parkinson / Autismo", emoji: "⚡" },
      { value: "outro", label: "Outra condição", emoji: "🌿" },
    ],
  },
  {
    key: "age",
    question: "Qual sua faixa etária?",
    options: [
      { value: "0-12", label: "Criança (0-12 anos)" },
      { value: "13-39", label: "Adolescente / Adulto jovem (13-39)" },
      { value: "40-64", label: "Adulto (40-64)" },
      { value: "65+", label: "Idoso (65+)" },
    ],
  },
  {
    key: "meds",
    question: "Usa medicamentos contínuos?",
    options: [
      { value: "nenhum", label: "Não uso nada" },
      { value: "leve", label: "1-2 medicamentos" },
      { value: "polifarmacia", label: "3+ medicamentos" },
    ],
  },
  {
    key: "intensity",
    question: "Intensidade dos sintomas (último mês)?",
    options: [
      { value: "leve", label: "Leve — incomoda às vezes", emoji: "🟢" },
      { value: "moderado", label: "Moderada — afeta o dia a dia", emoji: "🟡" },
      { value: "grave", label: "Grave — limita minha vida", emoji: "🔴" },
    ],
  },
  {
    key: "tried",
    question: "Já experimentou cannabis medicinal?",
    options: [
      { value: "nunca", label: "Nunca" },
      { value: "informal", label: "Sim, mas sem orientação médica" },
      { value: "formal", label: "Sim, com prescrição" },
    ],
  },
];

type Profile = { ratio: string; spectrum: string; rationale: string; cta: string };

function suggestProfile(answers: Record<string, string>): Profile {
  const { condition, intensity, age } = answers;

  if (condition === "neuro" || age === "0-12") {
    return {
      ratio: "CBD isolado / 20:1 (CBD:THC)",
      spectrum: "Isolado ou Broad-Spectrum",
      rationale:
        "Perfil neurológico/pediátrico exige predominância de CBD com THC mínimo ou zero, conforme literatura PubMed sobre Dravet, autismo e Parkinson.",
      cta: "Quero a Orientação Técnica completa",
    };
  }
  if (condition === "ansiedade") {
    return {
      ratio: "CBD dominante 15:1 a 30:1",
      spectrum: "Full-Spectrum com terpenos relaxantes (Mirceno, Linalol)",
      rationale:
        "Ansiedade e insônia respondem bem a CBD ≥15mg/dia com perfil terpênico sedativo. Estudos indicam redução significativa de HAM-A em 8 semanas.",
      cta: "Quero a Orientação Técnica completa",
    };
  }
  if (condition === "dor") {
    return {
      ratio: intensity === "grave" ? "Balanced 1:1 (CBD:THC)" : "CBD dominante 4:1 a 10:1",
      spectrum: "Full-Spectrum com Beta-Cariofileno",
      rationale:
        "Dor crônica/fibromialgia responde melhor a sinergia CBD+THC (efeito comitiva) com terpenos anti-inflamatórios.",
      cta: "Quero a Orientação Técnica completa",
    };
  }
  return {
    ratio: "CBD dominante 10:1 (avaliação personalizada)",
    spectrum: "Full-Spectrum",
    rationale:
      "Sua condição requer avaliação individual. A Orientação Técnica do Dr. Edilson cruza seus dados com 40k+ estudos para definir o protocolo exato.",
    cta: "Quero a Orientação Técnica completa",
  };
}

const buildWhatsappUrl = (
  profile: Profile,
  answers: Record<string, string>,
  name: string,
) =>
  `https://wa.me/5511991363154?text=${encodeURIComponent(
    `Olá Enfª Brisa! Meu nome é ${name || "(não informado)"}.\n` +
      `Fiz a Calculadora de Protocolo no site e meu perfil sugerido foi:\n\n` +
      `• Razão: ${profile.ratio}\n` +
      `• Espectro: ${profile.spectrum}\n` +
      `• Condição principal: ${answers.condition}\n` +
      `• Faixa etária: ${answers.age}\n` +
      `• Medicações contínuas: ${answers.meds}\n` +
      `• Intensidade dos sintomas: ${answers.intensity}\n` +
      `• Já experimentou cannabis: ${answers.tried}\n\n` +
      `Quero iniciar a Orientação Técnica com Dr. Edilson Bezerra (R$30).`,
  )}`;

export function ProtocolCalculator() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadWa, setLeadWa] = useState("");
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [savingLead, setSavingLead] = useState(false);

  // Track inicial uma única vez
  useEffect(() => {
    trackFunnelEvent("protocol_calculator", "calculator_viewed");
  }, []);

  const handleAnswer = (value: string) => {
    const key = STEPS[step].key;
    const next = { ...answers, [key]: value };
    setAnswers(next);
    trackFunnelEvent("protocol_calculator", "step_answered", {
      step: step + 1,
      key,
      value,
    });
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
      const p = suggestProfile(next);
      trackFunnelEvent("protocol_calculator", "calculator_completed", {
        ratio: p.ratio,
        condition: next.condition,
        intensity: next.intensity,
      });
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setDone(false);
    setLeadName("");
    setLeadWa("");
    setSavedLeadId(null);
  };

  const formatWa = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const handleWhatsappClick = async (
    e: React.MouseEvent<HTMLAnchorElement>,
    profile: Profile,
  ) => {
    e.preventDefault();
    const digits = leadWa.replace(/\D/g, "");
    const nameOk = leadName.trim().length >= 2;
    const waOk = digits.length >= 10;

    let leadId = savedLeadId;
    if (nameOk && waOk && !leadId) {
      setSavingLead(true);
      try {
        const { data } = await supabase
          .from("leads" as any)
          .insert({
            name: leadName.trim(),
            whatsapp: `+55${digits}`,
            source: "protocol_calculator_home",
            lead_score: 60,
            condition_interest: answers.condition,
            metadata: { answers, profile },
          } as any)
          .select("id")
          .single();
        leadId = (data as any)?.id ?? null;
        if (leadId) setSavedLeadId(leadId);
      } catch (err) {
        console.warn("[ProtocolCalculator] lead insert failed:", err);
      } finally {
        setSavingLead(false);
      }
    }

    await trackFunnelEvent(
      "protocol_calculator",
      "whatsapp_clicked",
      { has_name: nameOk, has_whatsapp: waOk, ratio: profile.ratio },
      leadId ?? undefined,
    );

    window.open(buildWhatsappUrl(profile, answers, leadName.trim()), "_blank", "noopener");
  };

  const profile = done ? suggestProfile(answers) : null;
  const progress = ((step + (done ? 1 : 0)) / STEPS.length) * 100;

  return (
    <section className="section-padding bg-gradient-to-br from-primary/5 via-background to-[hsl(280,80%,65%)]/5 border-y border-primary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 max-w-3xl">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs font-black uppercase tracking-wider text-primary mb-4">
            <Sparkles size={14} /> Ferramenta Gratuita · 60 segundos
          </span>
          <h2 className="font-display font-black text-3xl md:text-5xl leading-tight mb-3">
            Descubra o <span className="text-gradient-green">protocolo canabinoide</span> indicado para você
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            5 perguntas rápidas. Receba uma prévia personalizada baseada em literatura científica PubMed.
          </p>
        </div>

        <Card className="relative border-primary/30 bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl shadow-primary/10">
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-background/60">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-[hsl(140,70%,55%)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <CardContent className="p-6 md:p-10">
            <AnimatePresence mode="wait">
              {!done ? (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-black uppercase tracking-wider text-primary">
                      Pergunta {step + 1} de {STEPS.length}
                    </p>
                    {step > 0 && (
                      <button
                        onClick={() => setStep(step - 1)}
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-bold"
                      >
                        <ArrowLeft size={12} /> voltar
                      </button>
                    )}
                  </div>
                  <h3 className="font-display font-black text-xl md:text-2xl mb-6">
                    {STEPS[step].question}
                  </h3>
                  <div className="grid gap-3">
                    {STEPS[step].options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        className="group text-left p-4 rounded-2xl border-2 border-border bg-background/40 hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-between gap-3"
                      >
                        <span className="flex items-center gap-3 text-sm md:text-base font-bold">
                          {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
                          {opt.label}
                        </span>
                        <ArrowRight
                          size={18}
                          className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0"
                        />
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : profile ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 size={22} />
                    <p className="text-xs font-black uppercase tracking-wider">
                      Prévia do seu perfil canabinoide
                    </p>
                  </div>
                  <h3 className="font-display font-black text-2xl md:text-3xl">
                    Perfil sugerido: <span className="text-gradient-green">{profile.ratio}</span>
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-background/60 border border-primary/20">
                      <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-1">
                        Espectro recomendado
                      </p>
                      <p className="text-sm font-bold">{profile.spectrum}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-background/60 border border-primary/20">
                      <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-1">
                        Embasamento
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {profile.rationale}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] leading-relaxed text-amber-100/90">
                    ⚖️ <strong>Aviso:</strong> Esta é uma <strong>prévia educativa</strong>. O
                    protocolo definitivo exige <strong>Orientação Técnica</strong> com o Dr. Edilson Bezerra (CRM 10963 - Sta Cruz BO), que cruza seus dados com 40k+ estudos PubMed e
                    entrega relatório PDF assinado digitalmente.
                  </div>

                  {/* Mini lead-capture: nome + WhatsApp (opcionais — passam pra mensagem e salvam lead) */}
                  <div className="grid sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label htmlFor="calc-name" className="text-[10px] font-black uppercase tracking-wider text-primary block mb-1.5">
                        Seu nome <span className="text-muted-foreground font-bold">(para a Brisa)</span>
                      </label>
                      <input
                        id="calc-name"
                        type="text"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="Maria Silva"
                        autoComplete="name"
                        className="w-full h-11 px-3 rounded-xl bg-background/80 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label htmlFor="calc-wa" className="text-[10px] font-black uppercase tracking-wider text-primary block mb-1.5">
                        WhatsApp <span className="text-muted-foreground font-bold">(opcional)</span>
                      </label>
                      <input
                        id="calc-wa"
                        type="tel"
                        inputMode="tel"
                        value={leadWa}
                        onChange={(e) => setLeadWa(formatWa(e.target.value))}
                        placeholder="(11) 99999-9999"
                        autoComplete="tel"
                        className="w-full h-11 px-3 rounded-xl bg-background/80 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      size="lg"
                      disabled={savingLead}
                      className="flex-1 text-sm font-black h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-all"
                      asChild
                    >
                      <a
                        href={buildWhatsappUrl(profile, answers, leadName.trim())}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleWhatsappClick(e, profile)}
                      >
                        <Leaf size={18} className="mr-2" />
                        {savingLead ? "Enviando..." : `${profile.cta} — R$30`}
                      </a>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-sm font-black h-14 rounded-2xl"
                      onClick={reset}
                    >
                      Refazer
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default ProtocolCalculator;
