// 🌿 Orientação Técnica — Dr. Edilson Bezerra On
// Fluxo real: triagem (Enf. Brisa) → pagamento R$ 30 (Mercado Pago) → sala do
// agente com cronômetro de 30 minutos. A sala só abre com pagamento aprovado
// (validado no servidor direto na API do Mercado Pago).
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Stethoscope, Clock, Loader2, ShieldCheck, Send, ChevronRight,
  AlertTriangle, CheckCircle2, Lock,
} from "lucide-react";

const REF_STORAGE_KEY = "pyr_ot_external_reference";
const TRIAGE_STORAGE_KEY = "pyr_ot_triage";

type Phase = "triage" | "payment" | "room";

type ChatMessage = { role: "user" | "assistant"; content: string };

type TriageQuestion = {
  id: string;
  label: string;
  hint: string;
  type: "text" | "long" | "choice";
  options?: string[];
};

const QUESTIONS: TriageQuestion[] = [
  { id: "nome", label: "Como você se chama?", hint: "Nome que o Dr. Edilson vai usar no atendimento.", type: "text" },
  { id: "idade", label: "Qual a sua idade?", hint: "Idade em anos.", type: "text" },
  { id: "queixa", label: "Qual a sua queixa principal?", hint: "Descreva o que mais te incomoda hoje.", type: "long" },
  { id: "tempo", label: "Há quanto tempo você sente isso?", hint: "Selecione a opção mais próxima.", type: "choice", options: ["Menos de 1 mês", "1 a 6 meses", "6 meses a 2 anos", "Mais de 2 anos"] },
  { id: "intensidade", label: "De 0 a 10, qual a intensidade dos sintomas?", hint: "0 = nenhum sintoma, 10 = insuportável.", type: "choice", options: ["0 a 3 (leve)", "4 a 6 (moderado)", "7 a 8 (forte)", "9 a 10 (insuportável)"] },
  { id: "medicamentos", label: "Quais medicamentos ou tratamentos você usa hoje?", hint: "Liste nomes e doses, se souber. Escreva 'nenhum' se não usar.", type: "long" },
  { id: "canabinoides", label: "Já usou canabinoides (CBD/THC)?", hint: "Sua experiência prévia orienta a conduta técnica.", type: "choice", options: ["Nunca usei", "Já usei por conta própria", "Uso com receita médica", "Usei e parei"] },
  { id: "comorbidades", label: "Tem outras condições de saúde relevantes?", hint: "Fígado, coração, rins, gestação, psiquiátricas... Escreva 'nenhuma' se não houver.", type: "long" },
  { id: "objetivo", label: "Qual o seu principal objetivo?", hint: "O que você espera alcançar.", type: "choice", options: ["Aliviar dor", "Dormir melhor", "Reduzir ansiedade", "Reduzir medicamentos pesados", "Controlar crises/convulsões", "Qualidade de vida geral"] },
  { id: "red_flags", label: "Está sentindo algum destes sinais agora?", hint: "Se houver sinal de emergência, procure o SAMU 192 imediatamente.", type: "choice", options: ["Nenhum desses", "Dor no peito / falta de ar", "Desmaio ou confusão", "Sangramento ativo", "Pensamentos de me machucar"] },
];

const EMERGENCY_ANSWERS = new Set([
  "Dor no peito / falta de ar",
  "Desmaio ou confusão",
  "Sangramento ativo",
  "Pensamentos de me machucar",
]);

const fmtClock = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.max(0, s) % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function OrientacaoTecnicaAgente() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Regra oficial: o pagamento vem SEMPRE primeiro (pagamento → triagem → sala).
  const [phase, setPhase] = useState<Phase>("payment");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [authed, setAuthed] = useState<boolean | null>(null);

  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockNote, setUnlockNote] = useState<string | null>(null);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const emergency = EMERGENCY_ANSWERS.has(answers.red_flags || "");

  // ── Sessão do usuário ──────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  // ── Recupera triagem salva (volta do Mercado Pago) ─────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem(TRIAGE_STORAGE_KEY);
    if (saved) {
      try { setAnswers(JSON.parse(saved)); } catch { /* ignora */ }
    }
  }, []);

  const callFn = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("ot-edilson-web", { body });
    if (error) throw error;
    return data as Record<string, unknown>;
  }, []);

  // ── Verifica sessão paga ativa / libera após pagamento ────────────────
  const checkSession = useCallback(async (mode: "status" | "unlock") => {
    if (!authed) return;
    const ref = localStorage.getItem(REF_STORAGE_KEY);

    setUnlocking(true);
    try {
      const data = await callFn(
        mode === "unlock"
          ? { action: "unlock", external_reference: ref, triage: answers }
          : { action: "status" },
      );
      if (data?.active) {
        setSecondsLeft(Number(data.seconds_left) || 0);
        // Pagamento confirmado: faz a triagem primeiro; se já estiver completa, abre a sala.
        const triageDone = QUESTIONS.every((item) => answers[item.id]);
        setPhase(triageDone ? "room" : "triage");
        setUnlockNote(null);
        localStorage.removeItem(REF_STORAGE_KEY);
      } else if (mode === "unlock") {
        const reason = String(data?.reason || "");
        setUnlockNote(
          reason === "payment_pending"
            ? "Seu Pix ainda está sendo confirmado pelo Mercado Pago. Isso leva alguns segundos — toque em “Já paguei, liberar sala”."
            : reason === "session_already_used"
              ? "Este pagamento já foi usado em uma orientação anterior."
              : "Ainda não localizamos o pagamento aprovado. Se acabou de pagar, aguarde alguns segundos e tente de novo.",
        );
      }
    } catch (e) {
      console.error("[ot] session", e);
      if (mode === "unlock") setUnlockNote("Não conseguimos confirmar o pagamento agora. Tente novamente em instantes.");
    } finally {
      setUnlocking(false);
    }
  }, [authed, answers, callFn]);

  useEffect(() => {
    if (authed) void checkSession("status");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  useEffect(() => {
    if (authed && searchParams.get("paid") === "1") void checkSession("unlock");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, searchParams]);

  // ── Cronômetro ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "room") return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "room") inputRef.current?.focus();
  }, [phase, streaming]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Mensagem de abertura do agente
  useEffect(() => {
    if (phase === "room" && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Olá${answers.nome ? `, **${answers.nome.split(" ")[0]}**` : ""}. Sou o **Dr. Edilson Bezerra On** (CRM-CE 10963). Já li toda a sua triagem — não vou repetir perguntas.\n\nTemos **30 minutos** de Orientação Técnica. Pode começar pela sua principal dúvida sobre o tratamento canabinoide.`,
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Triagem ───────────────────────────────────────────────────────────
  const q = QUESTIONS[step];

  const saveAnswer = (value: string) => {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    sessionStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(next));
    setDraft("");
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    // Pagamento já confirmado antes da triagem: ao final, a sala abre direto.
    else setPhase("room");
  };

  // ── Pagamento ─────────────────────────────────────────────────────────
  const startCheckout = async () => {
    if (!authed) {
      navigate(`/login?next=${encodeURIComponent("/orientacao-tecnica")}`);
      return;
    }
    setCreatingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("mp-checkout", {
        body: {
          sku: "orientacao_tecnica",
          returnUrl: "https://www.plantayraiz.com.br/orientacao-tecnica?paid=1",
        },
      });
      if (error) throw error;
      const ref = (data as { external_reference?: string })?.external_reference;
      const initPoint = (data as { init_point?: string })?.init_point;
      if (!initPoint) throw new Error("Checkout indisponível");
      if (ref) localStorage.setItem(REF_STORAGE_KEY, ref);
      window.location.href = initPoint;
    } catch (e) {
      console.error("[ot] checkout", e);
      toast({
        title: "Não foi possível abrir o pagamento",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setCreatingCheckout(false);
    }
  };

  // ── Chat com o agente (streaming SSE) ─────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming || secondsLeft <= 0) return;
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setStreaming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ot-edilson-web`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "chat", messages: history, triage: answers }),
        },
      );

      if (res.status === 402) {
        setSecondsLeft(0);
        setMessages((m) => [...m, {
          role: "assistant",
          content: "⏱️ **Orientação Técnica encerrada.** Os 30 minutos desta sessão paga chegaram ao fim.",
        }]);
        return;
      }
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch { /* keep-alive ou fragmento */ }
        }
      }
      if (!acc) throw new Error("resposta vazia");
    } catch (e) {
      console.error("[ot] chat", e);
      setMessages((m) => {
        const copy = [...m];
        if (copy[copy.length - 1]?.role === "assistant" && !copy[copy.length - 1].content) copy.pop();
        return [...copy, {
          role: "assistant" as const,
          content: "Tive uma falha momentânea de conexão. Reenvie sua última mensagem, por favor.",
        }];
      });
    } finally {
      setStreaming(false);
    }
  };

  // ────────────────────────── RENDER ──────────────────────────
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12 md:pt-28">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-black px-4 py-2 rounded-full mb-4">
              <Stethoscope size={14} /> ORIENTAÇÃO TÉCNICA — DR. EDILSON BEZERRA ON
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
              Triagem, pagamento e <span className="text-gradient-green">30 minutos</span> de orientação técnica
            </h1>
            <p className="text-muted-foreground mt-3 text-sm md:text-base">
              Modalidade exclusiva do Dr. Edilson Bezerra On, com base em mais de 40.000 estudos
              científicos publicados sobre cannabis medicinal.
            </p>
          </div>

          {/* ── TRIAGEM ── */}
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
                        onClick={() => saveAnswer(opt)}
                        className="w-full p-4 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left flex items-center justify-between"
                      >
                        <span className="font-bold text-foreground">{opt}</span>
                        <ChevronRight className="text-muted-foreground" size={18} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {q.type === "long" ? (
                      <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={5}
                        placeholder="Escreva com suas palavras..."
                        aria-label={q.label}
                      />
                    ) : (
                      <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Digite aqui..."
                        aria-label={q.label}
                      />
                    )}
                    <Button
                      onClick={() => draft.trim() && saveAnswer(draft.trim())}
                      disabled={!draft.trim()}
                      className="w-full h-12 rounded-2xl font-black"
                    >
                      Continuar <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                )}

                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="mt-6 text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Voltar à pergunta anterior
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── PAGAMENTO ── */}
          {phase === "payment" && (
            <div className="space-y-6">
              {emergency && (
                <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-5 flex gap-3">
                  <AlertTriangle className="text-red-500 shrink-0" />
                  <div className="text-sm">
                    <p className="font-black text-red-500 mb-1">Sinal de emergência identificado</p>
                    <p className="text-muted-foreground">
                      Pelo que você relatou, procure atendimento presencial agora: ligue <strong>SAMU 192</strong> ou
                      vá ao pronto-socorro mais próximo. A orientação técnica não substitui urgência médica.
                    </p>
                  </div>
                </div>
              )}

              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="text-primary" size={20} />
                    <h2 className="font-display font-black text-foreground text-lg">
                      Passo 1 — Pagamento da Orientação Técnica
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-card border border-border p-4 mb-6 space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      Depois do pagamento confirmado você responde a triagem da Enfª Brisa (10 perguntas)
                      e a sala do Dr. Edilson Bezerra On abre com 30 minutos no cronômetro.
                    </p>
                    {QUESTIONS.filter((item) => answers[item.id]).map((item) => (
                      <div key={item.id} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">{item.label}</span>
                        <span className="font-bold text-foreground ml-auto text-right">{answers[item.id]}</span>
                      </div>
                    ))}
                  </div>


                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="text-xs uppercase font-black text-muted-foreground tracking-wider">Orientação Técnica</p>
                      <p className="text-sm text-muted-foreground">30 minutos com o Dr. Edilson Bezerra On</p>
                    </div>
                    <p className="text-3xl font-display font-black text-gradient-green">R$ 30</p>
                  </div>

                  {authed === false ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Lock size={14} /> Para pagar e abrir a sala, entre na sua conta (seus dados médicos ficam sigilosos).
                      </p>
                      <Button asChild className="w-full h-12 rounded-2xl font-black">
                        <Link to={`/login?next=${encodeURIComponent("/orientacao-tecnica")}`}>Entrar e pagar R$ 30</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full h-12 rounded-2xl font-bold">
                        <Link to="/cadastro">Criar conta grátis</Link>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={startCheckout}
                      disabled={creatingCheckout}
                      className="w-full h-14 rounded-2xl font-black text-base"
                    >
                      {creatingCheckout
                        ? <><Loader2 className="animate-spin mr-2" size={18} /> Abrindo pagamento...</>
                        : <>Pagar R$ 30 e abrir a sala <ChevronRight size={18} className="ml-1" /></>}
                    </Button>
                  )}

                  <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1 justify-center">
                    <ShieldCheck size={12} /> Pagamento processado pelo Mercado Pago (Pix ou cartão).
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-5">
                  <p className="text-sm font-bold text-foreground mb-2">Já pagou e a sala não abriu?</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    A confirmação do Pix pode levar alguns segundos. Toque abaixo para liberar.
                  </p>
                  {unlockNote && (
                    <p className="text-xs text-amber-500 mb-3" role="status">{unlockNote}</p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => void checkSession("unlock")}
                    disabled={unlocking}
                    className="w-full rounded-2xl font-bold"
                  >
                    {unlocking
                      ? <><Loader2 className="animate-spin mr-2" size={16} /> Verificando pagamento...</>
                      : "Já paguei, liberar sala"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── SALA DO AGENTE ── */}
          {phase === "room" && (
            <Card className="border-primary/30 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Stethoscope size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-black text-foreground text-sm truncate">Dr. Edilson Bezerra On</p>
                    <p className="text-[11px] text-muted-foreground">CRM-CE 10963 · Orientação Técnica</p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black shrink-0 ${
                    secondsLeft <= 300 ? "bg-red-500/15 text-red-500" : "bg-primary/15 text-primary"
                  }`}
                  role="timer"
                  aria-label="Tempo restante da orientação técnica"
                >
                  <Clock size={12} /> {fmtClock(secondsLeft)}
                </div>
              </div>

              <div ref={scrollRef} className="h-[52vh] min-h-[320px] overflow-y-auto px-4 py-5 space-y-5">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                    {m.role === "user" ? (
                      <div className="max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium">
                        {m.content}
                      </div>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none text-foreground/90 text-sm leading-relaxed">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
                {streaming && (
                  <p className="text-xs text-muted-foreground animate-pulse">Dr. Edilson está analisando as evidências...</p>
                )}
              </div>

              <div className="border-t border-border p-3 bg-card">
                {secondsLeft <= 0 ? (
                  <div className="text-center space-y-3 py-2">
                    <p className="text-sm font-bold text-foreground">Sessão de 30 minutos encerrada.</p>
                    <Button onClick={() => { setPhase("triage"); setStep(0); setMessages([]); }} className="rounded-2xl font-black">
                      Nova Orientação Técnica (R$ 30)
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
                      }}
                      rows={2}
                      placeholder="Escreva sua dúvida técnica..."
                      aria-label="Mensagem para o Dr. Edilson Bezerra On"
                      className="resize-none"
                    />
                    <Button
                      onClick={() => void sendMessage()}
                      disabled={streaming || !input.trim()}
                      className="h-10 w-10 p-0 rounded-xl shrink-0"
                      aria-label="Enviar mensagem"
                    >
                      {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </Button>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  Orientação técnica educativa. Não substitui consulta nem gera prescrição.
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
