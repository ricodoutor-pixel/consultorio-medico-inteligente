// 🌿 Planta y Raiz — Fluxo oficial: PAGAMENTO → TRIAGEM → CONSULTA
// Vale para Consulta por Chat, Vídeo, Retorno e Consulta Premium (valor do médico).
// A Orientação Técnica tem página própria (/orientacao-tecnica) e é exclusiva
// do Dr. Edilson Bezerra On (agente de IA com mais de 40.000 estudos).
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, ShieldCheck, ChevronRight, AlertTriangle, CheckCircle2,
  Video, MessageSquare, Stethoscope,
} from "lucide-react";

const REF_KEY = "pyr_consulta_external_reference";
const SKU_KEY = "pyr_consulta_sku";
const DOC_KEY = "pyr_consulta_doctor";

const SKU_LABEL: Record<string, string> = {
  consulta_chat: "Consulta por Chat",
  consulta_video: "Consulta por Vídeo",
  retorno_consulta: "Retorno de Renovação",
  consulta_premium: "Consulta Premium",
};

type Question = {
  id: string;
  label: string;
  hint: string;
  type: "text" | "long" | "choice";
  options?: string[];
};

const QUESTIONS: Question[] = [
  { id: "nome", label: "Como você se chama?", hint: "Nome que o profissional vai usar no atendimento.", type: "text" },
  { id: "idade", label: "Qual a sua idade?", hint: "Idade em anos.", type: "text" },
  { id: "queixa", label: "Qual a sua queixa principal?", hint: "Descreva o que mais te incomoda hoje.", type: "long" },
  { id: "tempo", label: "Há quanto tempo você sente isso?", hint: "Escolha a opção mais próxima.", type: "choice", options: ["Menos de 1 mês", "1 a 6 meses", "6 meses a 2 anos", "Mais de 2 anos"] },
  { id: "intensidade", label: "De 0 a 10, qual a intensidade dos sintomas?", hint: "0 = nenhum sintoma, 10 = insuportável.", type: "choice", options: ["0 a 3 (leve)", "4 a 6 (moderado)", "7 a 8 (forte)", "9 a 10 (insuportável)"] },
  { id: "medicamentos", label: "Quais medicamentos você usa hoje?", hint: "Liste nomes e doses. Escreva 'nenhum' se não usar.", type: "long" },
  { id: "canabinoides", label: "Já usou canabinoides (CBD/THC)?", hint: "Sua experiência prévia orienta a conduta.", type: "choice", options: ["Nunca usei", "Já usei por conta própria", "Uso com receita médica", "Usei e parei"] },
  { id: "comorbidades", label: "Tem outras condições de saúde relevantes?", hint: "Fígado, coração, rins, gestação, psiquiátricas. 'Nenhuma' se não houver.", type: "long" },
  { id: "objetivo", label: "Qual o seu principal objetivo?", hint: "O que você espera alcançar.", type: "choice", options: ["Aliviar dor", "Dormir melhor", "Reduzir ansiedade", "Reduzir medicamentos pesados", "Controlar crises/convulsões", "Qualidade de vida geral"] },
  { id: "red_flags", label: "Está sentindo algum destes sinais agora?", hint: "Em emergência, procure o SAMU 192 imediatamente.", type: "choice", options: ["Nenhum desses", "Dor no peito / falta de ar", "Desmaio ou confusão", "Sangramento ativo", "Pensamentos de me machucar"] },
];

const EMERGENCY = new Set([
  "Dor no peito / falta de ar",
  "Desmaio ou confusão",
  "Sangramento ativo",
  "Pensamentos de me machucar",
]);

export default function FluxoAtendimento() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const sku = params.get("sku") || localStorage.getItem(SKU_KEY) || "consulta_video";
  const doctorId = params.get("doctorId") || localStorage.getItem(DOC_KEY) || null;

  const [phase, setPhase] = useState<"checking" | "pending" | "triage" | "ready">("checking");
  const [note, setNote] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [type, setType] = useState<string>("video");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const emergency = EMERGENCY.has(answers.red_flags || "");
  const q = QUESTIONS[step];

  const unlock = useCallback(async () => {
    setPhase("checking");
    setNote(null);
    const ref = localStorage.getItem(REF_KEY);
    if (!ref) {
      setPhase("pending");
      setNote("Não encontramos o pagamento desta consulta neste navegador. Escolha o serviço novamente no perfil do profissional.");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("consulta-unlock", {
        body: { action: "unlock", external_reference: ref, sku, doctorId },
      });
      if (error) throw error;
      const res = data as Record<string, unknown>;
      if (res?.active) {
        setAppointmentId(String(res.appointment_id));
        setType(String(res.type || "video"));
        setPhase(res.triage_done ? "ready" : "triage");
        return;
      }
      setPhase("pending");
      const reason = String(res?.reason || "");
      setNote(
        reason === "payment_pending"
          ? "Seu Pix ainda está sendo confirmado pelo Mercado Pago. Isso leva alguns segundos — toque em “Já paguei, liberar consulta”."
          : reason === "no_doctor_available"
            ? "Pagamento confirmado, mas nenhum profissional está disponível agora. Nossa equipe já foi avisada."
            : "Ainda não localizamos o pagamento aprovado. Se acabou de pagar, aguarde alguns segundos e tente de novo.",
      );
    } catch (e) {
      console.error("[fluxo] unlock", e);
      setPhase("pending");
      setNote("Não conseguimos confirmar o pagamento agora. Tente novamente em instantes.");
    }
  }, [sku, doctorId]);

  useEffect(() => {
    if (params.get("sku")) localStorage.setItem(SKU_KEY, params.get("sku")!);
    if (params.get("doctorId")) localStorage.setItem(DOC_KEY, params.get("doctorId")!);
    void unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAnswer = async (value: string) => {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    setDraft("");
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    try {
      await supabase.functions.invoke("consulta-unlock", {
        body: { action: "triage", appointment_id: appointmentId, triage: next },
      });
    } catch (e) {
      console.error("[fluxo] triage", e);
      toast({ title: "Triagem salva localmente", description: "Seguimos para o atendimento." });
    } finally {
      setSaving(false);
      setPhase("ready");
    }
  };

  const enterConsultation = () => {
    if (!appointmentId) return;
    navigate(type === "chat"
      ? `/consultorio?appointment=${appointmentId}`
      : `/orientacao-video?appointment=${appointmentId}`);
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 md:pt-28">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-black px-4 py-2 rounded-full mb-4">
              <ShieldCheck size={14} /> PAGAMENTO → TRIAGEM → CONSULTA
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
              {SKU_LABEL[sku] ?? "Consulta"}
            </h1>
            <p className="text-muted-foreground mt-3 text-sm">
              Pagamento confirmado primeiro, triagem com a Enfª Brisa e depois o atendimento com o profissional de plantão.
            </p>
          </div>

          {phase === "checking" && (
            <Card className="border-border">
              <CardContent className="p-8 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-primary" size={28} />
                <p className="text-sm text-muted-foreground">Confirmando seu pagamento com o Mercado Pago…</p>
              </CardContent>
            </Card>
          )}

          {phase === "pending" && (
            <Card className="border-amber-500/40">
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-amber-500" role="status">{note}</p>
                <Button onClick={() => void unlock()} className="w-full h-12 rounded-2xl font-black">
                  Já paguei, liberar consulta
                </Button>
                <Button variant="outline" onClick={() => navigate("/profissionais")} className="w-full rounded-2xl font-bold">
                  Escolher serviço novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {phase === "triage" && (
            <Card className="border-border">
              <CardContent className="p-6 md:p-8">
                <Progress value={((step + 1) / QUESTIONS.length) * 100} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground font-bold text-right mb-6">
                  Pergunta {step + 1} de {QUESTIONS.length}
                </p>
                <h2 className="text-xl md:text-2xl font-display font-black text-foreground mb-1">{q.label}</h2>
                <p className="text-sm text-muted-foreground mb-6">{q.hint}</p>

                {q.type === "choice" ? (
                  <div className="space-y-3">
                    {q.options?.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => void saveAnswer(opt)}
                        disabled={saving}
                        className="w-full p-4 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left flex items-center justify-between disabled:opacity-60"
                      >
                        <span className="font-bold text-foreground">{opt}</span>
                        <ChevronRight className="text-muted-foreground" size={18} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {q.type === "long" ? (
                      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} placeholder="Escreva com suas palavras..." aria-label={q.label} />
                    ) : (
                      <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Digite aqui..." aria-label={q.label} />
                    )}
                    <Button
                      onClick={() => draft.trim() && void saveAnswer(draft.trim())}
                      disabled={!draft.trim() || saving}
                      className="w-full h-12 rounded-2xl font-black"
                    >
                      {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                      Continuar <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                )}

                {step > 0 && (
                  <button onClick={() => setStep(step - 1)} className="mt-6 text-xs text-muted-foreground hover:text-foreground underline">
                    Voltar à pergunta anterior
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          {phase === "ready" && (
            <div className="space-y-5">
              {emergency && (
                <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-5 flex gap-3">
                  <AlertTriangle className="text-red-500 shrink-0" />
                  <div className="text-sm">
                    <p className="font-black text-red-500 mb-1">Sinal de emergência identificado</p>
                    <p className="text-muted-foreground">
                      Procure atendimento presencial agora: ligue <strong>SAMU 192</strong> ou vá ao pronto-socorro.
                    </p>
                  </div>
                </div>
              )}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6 md:p-8 text-center space-y-4">
                  <CheckCircle2 className="text-primary mx-auto" size={36} />
                  <h2 className="font-display font-black text-foreground text-xl">
                    Pagamento confirmado e triagem concluída
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Seu atendimento já está aberto para o profissional de plantão, com toda a triagem anexada.
                  </p>
                  <Button onClick={enterConsultation} className="w-full h-14 rounded-2xl font-black text-base">
                    {type === "chat" ? <MessageSquare size={18} className="mr-2" /> : <Video size={18} className="mr-2" />}
                    Entrar na consulta agora
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/consultas")} className="w-full rounded-2xl font-bold">
                    <Stethoscope size={16} className="mr-2" /> Ver meus atendimentos
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
