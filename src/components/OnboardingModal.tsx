import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Brain, Heart, Zap, ArrowRight, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const healthGoals = [
  { id: "dor", label: "Dor Crônica", icon: Zap, desc: "Fibromialgia, enxaqueca, neuropatia" },
  { id: "ansiedade", label: "Ansiedade / Insônia", icon: Brain, desc: "Estresse, insônia, transtorno de ansiedade" },
  { id: "qualidade", label: "Qualidade de Vida", icon: Heart, desc: "Bem-estar geral, foco, disposição" },
  { id: "outro", label: "Outro", icon: Sprout, desc: "Epilepsia, autismo, Parkinson, etc." },
];

const experiences = [
  { id: "nunca", label: "Nunca usei cannabis medicinal" },
  { id: "iniciante", label: "Já pesquisei mas nunca usei" },
  { id: "uso", label: "Já uso com acompanhamento médico" },
  { id: "automedico", label: "Uso por conta própria (sem receita)" },
];

const recommendations: Record<string, { plan: string; specialist: string; cta: string }> = {
  "dor-nunca": { plan: "Essencial", specialist: "Neurologista Cannabinoide", cta: "Agendar 1ª Consulta" },
  "dor-iniciante": { plan: "Premium", specialist: "Especialista em Dor Crônica", cta: "Agendar Avaliação" },
  "dor-uso": { plan: "Premium", specialist: "Clínico Cannabinoide", cta: "Ajustar Tratamento" },
  "dor-automedico": { plan: "Essencial", specialist: "Clínico Cannabinoide", cta: "Regularizar Receita" },
  "ansiedade-nunca": { plan: "Essencial", specialist: "Psiquiatra Cannabinoide", cta: "Agendar 1ª Consulta" },
  "ansiedade-iniciante": { plan: "Premium", specialist: "Psiquiatra Cannabinoide", cta: "Agendar Avaliação" },
  "ansiedade-uso": { plan: "VIP", specialist: "Psiquiatra Cannabinoide", cta: "Checkup Mensal" },
  "ansiedade-automedico": { plan: "Essencial", specialist: "Psiquiatra Cannabinoide", cta: "Regularizar Receita" },
  "qualidade-nunca": { plan: "Essencial", specialist: "Clínico Geral", cta: "Consulta Inicial" },
  "qualidade-iniciante": { plan: "Premium", specialist: "Nutrólogo Cannabinoide", cta: "Agendar Avaliação" },
  "qualidade-uso": { plan: "VIP", specialist: "Nutrólogo Cannabinoide", cta: "Otimizar Protocolo" },
  "qualidade-automedico": { plan: "Essencial", specialist: "Clínico Geral", cta: "Regularizar Receita" },
  "outro-nunca": { plan: "Premium", specialist: "Neurologista Cannabinoide", cta: "Agendar Consulta" },
  "outro-iniciante": { plan: "Premium", specialist: "Especialista Cannabinoide", cta: "Agendar Avaliação" },
  "outro-uso": { plan: "VIP", specialist: "Especialista Cannabinoide", cta: "Revisão de Protocolo" },
  "outro-automedico": { plan: "Essencial", specialist: "Clínico Cannabinoide", cta: "Regularizar Receita" },
};

export const OnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", session.session.user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      setOpen(true);
    }
  };

  const completeOnboarding = async () => {
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user?.id) {
      await supabase.from("profiles").update({
        onboarding_completed: true,
        health_goal: goal,
        cannabis_experience: experience,
      }).eq("id", session.session.user.id);
    }
    setSaving(false);
    setOpen(false);
  };

  const rec = recommendations[`${goal}-${experience}`] || { plan: "Essencial", specialist: "Clínico Cannabinoide", cta: "Agendar Consulta" };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Onboarding</DialogTitle>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Health Goal */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Sprout className="text-primary" size={24} />
                  </div>
                  <h2 className="text-lg font-display font-black text-foreground">Qual seu objetivo de saúde?</h2>
                  <p className="text-xs text-muted-foreground">Isso nos ajuda a personalizar sua experiência</p>
                </div>

                <div className="space-y-2">
                  {healthGoals.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all",
                        goal === g.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", goal === g.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <g.icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{g.label}</p>
                        <p className="text-[10px] text-muted-foreground">{g.desc}</p>
                      </div>
                      {goal === g.id && <Check size={16} className="text-primary ml-auto" />}
                    </button>
                  ))}
                </div>

                <Button onClick={() => goal && setStep(2)} disabled={!goal} className="w-full rounded-xl mt-2">
                  Continuar <ArrowRight size={14} className="ml-1" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Cannabis Experience */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Brain className="text-primary" size={24} />
                  </div>
                  <h2 className="text-lg font-display font-black text-foreground">Sua experiência com cannabis</h2>
                  <p className="text-xs text-muted-foreground">Sem julgamentos — queremos te ajudar da melhor forma</p>
                </div>

                <div className="space-y-2">
                  {experiences.map(e => (
                    <button
                      key={e.id}
                      onClick={() => setExperience(e.id)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all",
                        experience === e.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", experience === e.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {experience === e.id ? <Check size={14} /> : <div className="w-3 h-3 rounded-full border-2 border-muted-foreground" />}
                      </div>
                      <p className="text-sm font-bold text-foreground">{e.label}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">← Voltar</Button>
                  <Button onClick={() => experience && setStep(3)} disabled={!experience} className="rounded-xl flex-1">
                    Ver Recomendação <Sparkles size={14} className="ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Personalized Recommendation */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="text-primary" size={28} />
                  </div>
                  <h2 className="text-lg font-display font-black text-foreground">Sua Recomendação Personalizada</h2>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Plano Ideal</p>
                    <p className="text-lg font-display font-black text-primary">{rec.plan}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Especialista Recomendado</p>
                    <p className="text-sm font-bold text-foreground">{rec.specialist}</p>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-[10px] text-muted-foreground">
                      🌿 Baseado no seu perfil, recomendamos iniciar com o plano <strong>{rec.plan}</strong> e um <strong>{rec.specialist}</strong> para o melhor acompanhamento.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">← Voltar</Button>
                  <Button onClick={completeOnboarding} disabled={saving} className="rounded-xl flex-1">
                    {saving ? "Salvando..." : rec.cta} <ArrowRight size={14} className="ml-1" />
                  </Button>
                </div>

                <button
                  onClick={completeOnboarding}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pular por agora →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
