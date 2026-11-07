import { RED_FLAG_OPTIONS, hasEmergency, invalidTriageFields } from "../../supabase/functions/_shared/orientation-triage";
import { setVisibleInterval } from "@/lib/visible-interval";
import { createOtStreamParser } from "../../supabase/functions/_shared/ot-stream";
import { BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";
import "@/styles/orientation-room.css";
import { canDownloadOtReport } from "../../supabase/functions/_shared/ot-stream";
// 🌿 Orientação Técnica — Dr. Edilson Bezerra ON (assistente de IA supervisionado)
// Pagamento R$30 → confirmação do webhook → triagem persistida → sala protegida.
// Nunca liberamos a sala por botão "Já paguei" nem por retorno do checkout.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams, useParams, Link } from "react-router-dom";
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
import DrEdilsonPhoto from "@/assets/dr-edilson-bezerra.jpg";
import {
  Stethoscope, Clock, Loader2, ShieldCheck, Send, ChevronRight, AlertTriangle,
  CheckCircle2, Sparkles, BookOpen, FileText, ArrowRight, Paperclip, X, PauseCircle,
  UserCheck, XCircle, Info, MapPin, QrCode, Copy, Check, Maximize2, Minimize2, Type, CheckCheck,
  Frown, Meh, Smile, Gift,
} from "lucide-react";

const REF_STORAGE_KEY = "pyr_ot_external_reference";
const TRIAGE_STORAGE_KEY = "pyr_ot_triage";
const ATTACH_BUCKET = "ot-attachments";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

type Phase = "loading" | "intro" | "triage" | "checkout" | "awaiting" | "room" | "emergency";
type OtState = "none" | "awaiting_payment" | "triage" | "emergency" | "ready" | "active" | "paused" | "expired" | "completed";

type OtSession = {
  id: string;
  status?: string;
  started_at?: string | null;
  expires_at?: string | null;
  paused?: boolean;
};

type OtMessage = {
  id: string;
  role: "patient" | "agent" | "supervisor" | "system";
  content: string;
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  created_at: string;
};

type OtReport = {
  id: string;
  status: "draft" | "approved" | "rejected";
  created_at: string;
  approved_at?: string | null;
  verification_code?: string | null;
  educational_released_at?: string | null;
};

type Attachment = { path: string; name: string; mime: string };

type TriageQuestion = {
  id: string;
  label: string;
  hint: string;
  type: "text" | "long" | "choice" | "combo" | "scale";
  options?: string[];
  optional?: boolean;
  allowNone?: boolean;
};

// Triagem curta v3: 5 telas. Nome e idade vêm do cadastro (não perguntar).
const QUESTIONS: TriageQuestion[] = [
  { id: "red_flags", label: "Está com algum sinal de emergência agora?", hint: "Ex.: dor no peito, falta de ar, desmaio, sangramento ativo ou pensamentos de se machucar.", type: "choice" },
  { id: "queixa", label: "Qual o principal problema e há quanto tempo?", hint: "Descreva com suas palavras e escolha o tempo mais próximo.", type: "combo", options: ["Menos de 1 mês", "1 a 6 meses", "Mais de 6 meses"] },
  { id: "intensidade", label: "De 0 a 10, qual a intensidade dos sintomas?", hint: "0 = nenhum sintoma · 10 = insuportável.", type: "scale" },
  { id: "medicamentos", label: "Medicamentos, alergias e outras condições de saúde", hint: "Inclua gravidez ou amamentação, se for o caso. Toque em “Nenhum” se não houver.", type: "long", allowNone: true },
  { id: "objetivo", label: "O que você espera do atendimento?", hint: "Opcional — pode pular se preferir.", type: "choice", optional: true, options: ["Dormir melhor", "Aliviar dor", "Reduzir ansiedade", "Outro"] },
];

const ROOM_STATES: OtState[] = ["ready", "active", "paused", "expired", "completed"];
const LIVE_STATES: OtState[] = ["ready", "active", "paused"];

const fmtClock = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.floor(Math.max(0, s) % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const fmtHour = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

const safeFileName = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);

/** Fundo bege com padrão sutil (inspirado no WhatsApp). */
const CHAT_BG_STYLE: CSSProperties = {
  backgroundColor: "#ECE5DD",
  backgroundImage:
    "radial-gradient(rgba(7,94,84,0.06) 1px, transparent 1px), radial-gradient(rgba(7,94,84,0.04) 1px, transparent 1px)",
  backgroundSize: "22px 22px, 22px 22px",
  backgroundPosition: "0 0, 11px 11px",
};

export default function OrientacaoTecnicaAgente() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sessionId: routeSessionId } = useParams<{ sessionId?: string }>();
  const activeSessionId = routeSessionId || searchParams.get("sessionId") || searchParams.get("session_id") || undefined;

  // Parâmetros de link personalizado (ex: vindo da Enfª Brisa via WhatsApp)
  const urlNome = searchParams.get("nome") || searchParams.get("paciente") || "";
  const urlTel = searchParams.get("tel") || searchParams.get("whatsapp") || "";
  const urlOrigem = searchParams.get("origem") || "";
  const returnedFromPayment = searchParams.get("paid") === "1";

  const [phase, setPhase] = useState<Phase>("loading");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [profileAge, setProfileAge] = useState<number | null>(null);
  const [comboTempo, setComboTempo] = useState("");

  const [orderRef, setOrderRef] = useState<string | null>(searchParams.get("ref"));
  const orderRefRef = useRef<string | null>(searchParams.get("ref"));
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [creatingPix, setCreatingPix] = useState(false);
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_base64: string;
    payment_id: string | number;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [awaitingSince, setAwaitingSince] = useState<number>(Date.now());

  const [otState, setOtState] = useState<OtState>("none");
  const [otSession, setOtSession] = useState<OtSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [starting, setStarting] = useState(false);

  const [messages, setMessages] = useState<OtMessage[]>([]);
  const [pendingPatient, setPendingPatient] = useState<OtMessage | null>(null);
  const [streamText, setStreamText] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);

  const [reports, setReports] = useState<OtReport[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [rating, setRating] = useState<1 | 2 | 3 | null>(null);
  const [ratingDone, setRatingDone] = useState(false);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [fullRoom, setFullRoom] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reportWait, setReportWait] = useState(0);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  useEffect(() => {
    if (!generatingReport) { setReportWait(0); return; }
    const started = Date.now();
    const timer = window.setInterval(() => setReportWait(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [generatingReport]);
  useEffect(() => {
    if (!fullRoom) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setFullRoom(false); };
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", escape); };
  }, [fullRoom]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const questionCardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initDone = useRef(false);

  const emergency = hasEmergency(answers);
  const triageComplete = QUESTIONS.every((item) =>
    item.optional ? true
      : item.id === "queixa" ? !!(answers.queixa?.trim() && answers.tempo?.trim())
        : !!(answers[item.id] || "").trim());

  // ── Auto-preenchimento por query params (Personalização de Link) ─────────
  useEffect(() => {
    if (urlNome || urlTel) {
      setAnswers((prev) => ({
        ...prev,
        ...(urlNome && !prev.nome ? { nome: urlNome } : {}),
        ...(urlTel && !prev.whatsapp ? { whatsapp: urlTel } : {}),
      }));
    }
  }, [urlNome, urlTel]);

  useEffect(() => {
    localStorage.removeItem(REF_STORAGE_KEY);
    sessionStorage.removeItem(TRIAGE_STORAGE_KEY);
  }, []);

  // ── Sessão do usuário ──────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setAuthed(!!data.session);
      setUserId(data.session?.user?.id ?? null);
      const uid = data.session?.user?.id;
      if (uid) {
        // Nome e idade vêm do cadastro — a triagem não pergunta de novo.
        void supabase.from("profiles").select("full_name, date_of_birth").eq("id", uid).maybeSingle()
          .then(({ data: p }) => {
            if (!alive || !p) return;
            if (p.full_name) setProfileName(p.full_name);
            if (p.date_of_birth) {
              const birth = new Date(p.date_of_birth);
              if (!Number.isNaN(birth.getTime())) {
                const now = new Date();
                let age = now.getFullYear() - birth.getFullYear();
                const m = now.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
                if (age >= 0 && age <= 120) setProfileAge(age);
              }
            }
          });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      setUserId(session?.user?.id ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const callFn = useCallback(async <T,>(body: Record<string, unknown>): Promise<T> => {
    const payload = { ...(activeSessionId ? { sessionId: activeSessionId } : {}), ...(orderRefRef.current ? { external_reference: orderRefRef.current } : {}), ...body };
    const { data, error } = await supabase.functions.invoke("ot-edilson-web", { body: payload });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as T;
  }, [activeSessionId]);

  // ── Status (fonte única para liberar a sala) ───────────────────────────
  const applyStatus = useCallback((d: { state?: OtState; session?: OtSession | null; minutesLeft?: number; rating?: number | null } | null) => {
    const st: OtState = (d?.state as OtState) || "none";
    const sess = d?.session ?? null;
    setOtState(st);
    setOtSession(sess);
    if (st === "completed" && typeof d?.rating === "number") { setRating(d.rating as 1 | 2 | 3); setRatingDone(true); }
    if (sess?.expires_at) {
      setSecondsLeft(Math.max(0, Math.floor((Date.parse(sess.expires_at) - Date.now()) / 1000)));
    } else if (typeof d?.minutesLeft === "number") {
      setSecondsLeft(Math.max(0, Math.floor(d.minutesLeft * 60)));
    }
    if (sess && "triage" in sess && sess.triage && typeof sess.triage === "object") setAnswers(sess.triage as Record<string, string>);
    return st;
  }, []);

  const startRoomRef = useRef<(() => Promise<void>) | null>(null);
  const fetchStatus = useCallback(async () => {
    const d = await callFn<{ state?: OtState; session?: OtSession | null; minutesLeft?: number; order?: { external_reference: string; triagem?: Record<string, string>; qr_code?: string; qr_code_base64?: string; mp_payment_id?: string } }>({ action: "status" });
    const st = applyStatus(d);
    if (d.order) {
      orderRefRef.current = d.order.external_reference;
      setOrderRef(d.order.external_reference);
      if (d.order.triagem) {
        setAnswers(d.order.triagem);
        const t = d.order.triagem;
        const missing = QUESTIONS.findIndex((item) =>
          item.optional ? false
            : item.id === "queixa" ? !(t.queixa?.trim() && t.tempo?.trim())
              : !t[item.id]?.trim());
        setStep(missing < 0 ? QUESTIONS.length - 1 : missing);
      }
      if (d.order.qr_code && d.order.qr_code_base64) setPixData({ qr_code: d.order.qr_code, qr_code_base64: d.order.qr_code_base64, payment_id: d.order.mp_payment_id || "" });
    }
    if (LIVE_STATES.includes(st) || st === "expired" || st === "completed") setPhase("room");
    else if (st === "triage") setPhase(hasEmergency(d.order?.triagem || {}) ? "emergency" : "triage");
    else if (st === "awaiting_payment") setPhase("awaiting");
    else setPhase("intro");
    return st;
  }, [callFn, applyStatus]);

  useEffect(() => {
    if (authed === null) return;
    if (!authed) { setPhase("intro"); return; }
    void fetchStatus().catch(() => setPhase("intro"));
  }, [authed, fetchStatus]);

  useEffect(() => {
    if (phase !== "awaiting" || !authed) return;
    return setVisibleInterval(() => void fetchStatus().catch(() => undefined), 3000);
  }, [phase, authed, fetchStatus]);

  // ── Mensagens e relatórios da sala ─────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try {
      const d = await callFn<{ messages?: OtMessage[] } | OtMessage[]>({ action: "messages" });
      const list = Array.isArray(d) ? d : d?.messages ?? [];
      setMessages(list);
    } catch (e) {
      console.warn("[ot] messages", e);
      setChatError("Não foi possível carregar a conversa. Tente novamente ou chame a equipe.");
    }
  }, [callFn]);

  const loadReports = useCallback(async () => {
    try {
      const d = await callFn<{ reports?: OtReport[] } | OtReport[]>({ action: "reports" });
      setReports(Array.isArray(d) ? d : d?.reports ?? []);
    } catch (e) {
      console.warn("[ot] reports", e);
      setReportError("Não foi possível carregar seus relatórios. Tente novamente.");
    }
  }, [callFn]);

  useEffect(() => {
    if (phase !== "room") return;
    void loadMessages();
    void loadReports();
  }, [phase, loadMessages, loadReports]);

  // ── Encerramento e avaliação (três carinhas) ─────────────────────────
  const closeSession = useCallback(async () => {
    if (closing) return;
    setClosing(true);
    try {
      await callFn({ action: "close_session" });
      setOtState("completed");
    } catch {
      toast({ title: "Não foi possível encerrar agora. Tente de novo.", variant: "destructive" });
    } finally {
      setClosing(false);
    }
  }, [callFn, closing, toast]);

  const submitRating = useCallback(async (value: 1 | 2 | 3 | null) => {
    if (submittingRating) return;
    setSubmittingRating(true);
    try {
      if (value) {
        await callFn({ action: "submit_rating", rating: value, comment: ratingComment.trim() || undefined });
        setRating(value);
      } else {
        await callFn({ action: "skip_rating" });
      }
      setRatingDone(true);
      setOtState("completed");
    } catch {
      toast({ title: "Não foi possível registrar sua avaliação. Tente de novo.", variant: "destructive" });
    } finally {
      setSubmittingRating(false);
    }
  }, [callFn, ratingComment, submittingRating, toast]);

  // Poll da sala (5s): status (pausa/expiração) + mensagens (inclui Dr. Edilson humano).
  useEffect(() => {
    if (phase !== "room" || otState === "expired" || otState === "completed") return;
    const cleanup = setVisibleInterval(() => {
      if (streaming) return;
      void fetchStatus().catch(() => undefined);
      void loadMessages();
    }, 5000);
    return cleanup;
  }, [phase, otState, streaming, fetchStatus, loadMessages]);

  // Relatórios em revisão: atualiza a cada 15s.
  useEffect(() => {
    if (phase !== "room" || !reports.some((r) => r.status === "draft")) return;
    return setVisibleInterval(() => void loadReports(), 15000);
  }, [phase, reports, loadReports]);

  // ── Cronômetro local (sincronizado pelo status) ────────────────────────
  useEffect(() => {
    if (phase !== "room" || (otState !== "active" && otState !== "paused")) return;
    const t = window.setInterval(() => {
      setSecondsLeft((s) => {
        const next = Math.max(0, s - 1);
        if (next === 0 && s > 0) void fetchStatus().catch(() => undefined);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase, otState, fetchStatus]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamText, pendingPatient]);

  useEffect(() => {
    if (phase === "checkout" || phase === "triage" || phase === "awaiting") window.scrollTo({ top: 0, behavior: "instant" });
  }, [phase]);

  useEffect(() => {
    if (phase === "room" && otState === "active" && !streaming) inputRef.current?.focus();
  }, [phase, otState, streaming]);

  // ── Triagem ───────────────────────────────────────────────────────────
  const q = QUESTIONS[step];

  const saveAnswer = async (value: string) => {
    if (savingAnswer) return;
    if (!orderRef) {
      // Sem pedido pago vinculado, a resposta não tem onde ser gravada: explica em vez de falhar em silêncio.
      toast({
        title: "Pagamento ainda não vinculado",
        description: "Conclua o pagamento de R$ 30 para gravarmos suas respostas e liberarmos a orientação.",
        variant: "destructive",
      });
      setPhase("checkout");
      return;
    }
    const fields = invalidTriageFields({ [q.id]: value }, false);
    if (fields.length) {
      toast({ title: "Revise sua resposta", description: "Escreva pelo menos 3 caracteres para a queixa.", variant: "destructive" });
      return;
    }
    setSavingAnswer(true);
    try {
      const response = await callFn<{ state: string; triagem: Record<string, string> }>({ action: "save_triage", answer: { [q.id]: value } });
      setAnswers(response.triagem);
      setDraft("");
      if (response.state === "emergency") setPhase("emergency");
      else if (response.state === "ready") {
        // A última resposta obrigatória já libera a sala no servidor, mas a
        // pergunta opcional (objetivo) ainda não apareceu: mostra antes de iniciar.
        const objetivoPendente = step < QUESTIONS.length - 1 && !(response.triagem?.objetivo || "").trim();
        if (objetivoPendente) setStep(QUESTIONS.length - 1);
        else {
          const st = await fetchStatus();
          if (st === "ready") await startRoomRef.current?.();
        }
      }
      else if (step < QUESTIONS.length - 1) setStep(step + 1);
      else {
        // Última pergunta respondida mas alguma anterior ficou vazia/inválida: leva até ela em vez de travar.
        const bad = invalidTriageFields(response.triagem || {});
        const idx = QUESTIONS.findIndex(item => bad.includes(item.id));
        if (idx >= 0) {
          setStep(idx);
          toast({ title: "Falta revisar uma resposta", description: "Complete esta pergunta para liberar sua Orientação." });
        } else await fetchStatus();
      }
    } catch {
      toast({ title: "Não foi possível salvar a resposta", description: "Sua pergunta permanece aqui. Tente novamente.", variant: "destructive" });
    } finally { setSavingAnswer(false); }
  };

  // Tela 2 (combo): grava queixa + tempo em sequência e avança uma única vez.
  const saveComboAnswers = async () => {
    const queixa = (draft || answers.queixa || "").trim();
    const tempo = comboTempo || answers.tempo || "";
    if (!queixa || queixa.length < 3) {
      toast({ title: "Descreva o problema", description: "Escreva pelo menos 3 caracteres sobre o que você está sentindo.", variant: "destructive" });
      return;
    }
    if (!tempo) {
      toast({ title: "Selecione o tempo", description: "Escolha há quanto tempo você sente isso.", variant: "destructive" });
      return;
    }
    if (!orderRef) {
      toast({ title: "Pagamento ainda não vinculado", description: "Conclua o pagamento de R$ 30 para gravarmos suas respostas.", variant: "destructive" });
      setPhase("checkout");
      return;
    }
    setSavingAnswer(true);
    try {
      await callFn({ action: "save_triage", answer: { queixa } });
      const response = await callFn<{ state: string; triagem: Record<string, string> }>({ action: "save_triage", answer: { tempo } });
      setAnswers(response.triagem);
      setDraft("");
      setComboTempo("");
      if (step < QUESTIONS.length - 1) setStep(step + 1);
      else await fetchStatus();
    } catch {
      toast({ title: "Não foi possível salvar a resposta", description: "Sua pergunta permanece aqui. Tente novamente.", variant: "destructive" });
    } finally { setSavingAnswer(false); }
  };

  // Pergunta opcional (expectativa): pular sem gravar.
  const skipOptional = async () => {
    if (step < QUESTIONS.length - 1) { setStep(step + 1); return; }
    try {
      const st = await fetchStatus();
      if (st === "ready") await startRoomRef.current?.();
    } catch { /* status já tratado */ }
  };

  const isQuestionAnswered = (item: TriageQuestion) =>
    item.id === "queixa"
      ? !!(answers.queixa?.trim() && answers.tempo?.trim())
      : item.optional
        ? true
        : !!answers[item.id]?.trim();

  const startTriage = () => {
    setStep(Math.max(0, QUESTIONS.findIndex((item) => !isQuestionAnswered(item))));
    setPhase("triage");
  };

  const generateCheckout = async (method: "pix" | "card") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    method === "pix" ? setCreatingPix(true) : setCreatingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("mp-checkout", { body: {
        sku: "orientacao_tecnica", payment_method: method,
        returnUrl: `${window.location.origin}/orientacao-tecnica?paid=1`,
      } });
      if (error || data?.error) throw error || new Error(data.error);
      if (data.external_reference) {
        orderRefRef.current = data.external_reference;
        setOrderRef(data.external_reference);
        const url = new URL(window.location.href);
        url.searchParams.set("ref", data.external_reference);
        window.history.replaceState(null, "", url);
      }
      if (method === "pix" && data.qr_code && data.qr_code_base64) {
        setPixData({ qr_code: data.qr_code, qr_code_base64: data.qr_code_base64, payment_id: data.payment_id });
        setAwaitingSince(Date.now());
        setPhase("awaiting");
      } else if (data.init_point) window.location.href = data.init_point;
      else throw new Error("Pagamento indisponível");
    } catch {
      toast({ title: method === "pix" ? "Não foi possível gerar o Pix agora. Tente de novo em instantes." : "Não foi possível abrir o pagamento agora. Tente de novo em instantes.", variant: "destructive" });
    } finally { setCreatingPix(false); setCreatingCheckout(false); }
  };
  const startCheckout = () => generateCheckout("card");
  const startPixCheckout = () => generateCheckout("pix");

  const copyPixCode = async () => {
    if (!pixData?.qr_code) return;
    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopiedPix(true);
      toast({
        title: "Código Pix copiado!",
        description: "Cole no aplicativo do seu banco para concluir o pagamento de R$ 30.",
      });
      setTimeout(() => setCopiedPix(false), 4000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Selecione o código e copie manualmente.",
        variant: "destructive",
      });
    }
  };

  // ── Iniciar a sala (somente quando o servidor diz `ready`) ─────────────
  const startRoom = async () => {
    setStarting(true);
    try {
      await callFn({ action: "start" });
      await fetchStatus();
      await loadMessages();
    } catch (e) {
      console.error("[ot] start", e);
      toast({ title: "Não foi possível iniciar agora", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setStarting(false);
    }
  };
  startRoomRef.current = startRoom;

  // ── Anexos (PDF/imagem → bucket privado ot-attachments) ────────────────
  const onPickFile = async (file: File | undefined) => {
    if (!file || !otSession?.id) return;
    if (!(file.type === "application/pdf" || file.type.startsWith("image/"))) {
      toast({ title: "Formato não suportado", description: "Envie PDF ou imagem.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast({ title: "Arquivo muito grande", description: "Limite de 10 MB por anexo.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
      if (!uid) throw new Error("sem usuário");
      const path = `${uid}/${otSession.id}/${Date.now()}-${safeFileName(file.name)}`;
      const { error } = await supabase.storage.from(ATTACH_BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      setAttachment({ path, name: file.name, mime: file.type });
    } catch (e) {
      console.error("[ot] upload", e);
      toast({ title: "Falha ao anexar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const openAttachment = async (path: string) => {
    const { data, error } = await supabase.storage.from(ATTACH_BUCKET).createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      toast({ title: "Não foi possível abrir o anexo", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  // ── Chat com o agente (streaming SSE) ─────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim() || (attachment ? `📎 Enviei um anexo: ${attachment.name}` : "");
    if (!text || streaming || otState !== "active" || secondsLeft <= 0) return;
    const att = attachment;
    setPendingPatient({
      id: `local-${Date.now()}`,
      role: "patient",
      content: text,
      attachment_path: att?.path ?? null,
      attachment_name: att?.name ?? null,
      attachment_mime: att?.mime ?? null,
      created_at: new Date().toISOString(),
    });
    setInput("");
    setAttachment(null);
    setStreaming(true);
    setChatError(null);

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
          body: JSON.stringify({
            action: "chat",
            message: text,
            ...(att ? { attachment: att } : {}),
            ...(otSession?.id ? { sessionId: otSession.id } : {}),
            ...(orderRefRef.current ? { external_reference: orderRefRef.current } : {}),
          }),
        },
      );

      if (res.status === 423) {
        setOtState("paused");
        toast({ title: "Sala pausada pelo Dr. Edilson", description: "Aguarde: ele está revisando a conversa." });
        return;
      }
      if (res.status === 402) {
        setSecondsLeft(0);
        setOtState("expired");
        return;
      }
      if (!res.ok || !res.body) {
        const failure = await res.json().catch(() => null);
        throw new Error(failure?.error || "Não foi possível receber a resposta agora.");
      }

      // Encerramento automático: o servidor responde JSON (não SSE) quando o
      // paciente se despediu — mostra a despedida e abre a avaliação.
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json().catch(() => null);
        if (data?.closed && data?.farewell) {
          setMessages(prev => [...prev, { id: `farewell-${Date.now()}`, role: "agent", content: data.farewell, created_at: new Date().toISOString() }]);
          setOtState("completed");
          return;
        }
        throw new Error(data?.error || "Não foi possível receber a resposta agora.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const parse = createOtStreamParser();
      let acc = "";
      setStreamText("");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += parse(decoder.decode(value, { stream: true }));
        setStreamText(acc);
      }
      acc += parse(decoder.decode() + "\n");
      if (!acc) throw new Error("resposta vazia");
      setMessages(prev => [...prev, { id: `reply-${Date.now()}`, role: "agent", content: acc, created_at: new Date().toISOString() }]);
    } catch (e) {
      console.error("[ot] chat", e);
      setInput(text);
      setAttachment(att);
      setChatError(e instanceof Error ? e.message : "A resposta falhou. Sua mensagem foi preservada.");
      toast({
        title: "Falha momentânea de conexão",
        description: "Sua mensagem pode não ter sido entregue. Reenvie, por favor.",
        variant: "destructive",
      });
    } finally {
      if (pendingPatient) setMessages(prev => [...prev, pendingPatient]);
      setPendingPatient(null);
      setStreamText(null);
      setStreaming(false);
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    setReportError(null);
    try {
      const result = await callFn<{ success?: boolean; report_id?: string }>({ action: "generate_report", sessionId: otSession?.id });
      if (!result.success || !result.report_id) throw new Error("O relatório não foi gravado. Tente novamente.");
      toast({
        title: "Relatório educativo pronto",
        description: "Você já pode baixar o PDF. Gerado por IA; revisão médica pendente.",
      });
      await loadReports();
    } catch (e) {
      console.error("[ot] report", e);
      setReportError("Não foi possível gerar o relatório. Tente novamente ou chame a equipe.");
      toast({ title: "Não foi possível gerar o relatório agora", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setGeneratingReport(false);
    }
  };

  const resetForNew = () => {
    orderRefRef.current = null;
    setOrderRef(null);
    setOtSession(null);
    setOtState("none");
    setAnswers({});
    setPixData(null);
    setFullRoom(false);
    navigate("/orientacao-tecnica?new=1", { replace: true });
    setMessages([]);
    setReports([]);
    setStep(0);
    setPhase("intro");
  };

  const timeline = useMemo(() => {
    const list = [...messages];
    if (pendingPatient) list.push(pendingPatient);
    return list;
  }, [messages, pendingPatient]);

  const downloadableReport = useMemo(
    () => reports.find((r) => canDownloadOtReport(r.status, !!r.educational_released_at)),
    [reports],
  );

  // Link de indicação da própria conta logada (mostrado na tela de encerramento).
  useEffect(() => {
    if (otState !== "completed" || !ratingDone || !userId || refCode) return;
    let alive = true;
    void (async () => {
      const { data: profile } = await supabase.from("profiles").select("referral_code").eq("id", userId).maybeSingle();
      let code = (profile as { referral_code?: string | null } | null)?.referral_code || null;
      if (!code) {
        code = `PRZ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const { data: updated } = await supabase.from("profiles").update({ referral_code: code }).eq("id", userId).select("referral_code").maybeSingle();
        code = (updated as { referral_code?: string } | null)?.referral_code || code;
      }
      if (alive) setRefCode(code);
    })();
    return () => { alive = false; };
  }, [otState, ratingDone, userId, refCode]);

  const copyRefLink = async () => {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(`https://plantayraiz.com.br/cadastro?ref=${refCode}`);
      setCopiedRef(true);
      toast({ title: "Link de indicação copiado!" });
      setTimeout(() => setCopiedRef(false), 4000);
    } catch {
      toast({ title: "Erro ao copiar", description: "Selecione o link e copie manualmente.", variant: "destructive" });
    }
  };

  const firstName = (answers.nome || "").split(" ")[0];
  const awaitingLong = Date.now() - awaitingSince > 3 * 60 * 1000;

  // ────────────────────────── RENDER ──────────────────────────
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--site-header-height,96px)+16px)] pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Cabeçalho */}
          {phase !== "room" && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-black px-4 py-2 rounded-full mb-4">
                <Stethoscope size={14} /> DR. EDILSON BEZERRA ON · ASSISTENTE DE IA SUPERVISIONADO
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
                Orientação Técnica · <span className="text-gradient-green">R$ 30</span>
              </h1>
              <p className="text-muted-foreground mt-3 text-sm md:text-base">
                Triagem e educação sobre a sua necessidade antes da consulta real, com relatório individual
                revisado pelo Dr. Edilson Bezerra e encaminhamento ao médico prescritor mais indicado.
              </p>
            </div>
          )}

          {/* Banner de Encaminhamento Personalizado WhatsApp */}
          {urlOrigem === "whatsapp" && phase !== "room" && (
            <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-4 mb-6 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="text-primary" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground text-sm">
                  Olá{urlNome ? `, ${urlNome}` : ""}! Você veio pela Enfª Brisa 🌿
                </p>
                <p className="text-xs text-muted-foreground">
                  A Orientação Técnica acontece aqui na plataforma, com o Dr. Edilson Bezerra ON.
                </p>
              </div>
            </div>
          )}

          {phase === "loading" && (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          )}

          {/* ── INTRO: o que é / o que não é ── */}
          {phase === "intro" && (
            <div className="space-y-5">
              <Card className="border-primary/30">
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={DrEdilsonPhoto}
                      alt="Dr. Edilson Bezerra"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/40"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="min-w-0">
                      <p className="font-display font-black text-lg text-foreground">Dr. Edilson Bezerra</p>
                      <p className="text-xs text-muted-foreground">
                        Médico formado em 2018 · Medicina integrativa · CRM (Bolívia) nº 10963
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-start gap-1 mt-1">
                        <MapPin size={12} className="shrink-0 mt-0.5" />
                        Santa Cruz de la Sierra — Edifício Ecodent, 1º Anillo, 13º andar, sala 15
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-display font-black text-foreground text-lg mb-2 flex items-center gap-2">
                      <CheckCircle2 className="text-primary" size={18} /> O que é
                    </h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Uma <strong className="text-foreground">triagem com educação em saúde</strong> sobre a sua necessidade ou patologia, para você chegar à consulta real bem informado(a).</li>
                      <li>• Conduzida pelo <strong className="text-foreground">Dr. Edilson Bezerra ON</strong>: um <strong className="text-foreground">assistente de inteligência artificial</strong> com a persona do Dr. Edilson, <strong className="text-foreground">supervisionado em tempo real</strong> por ele — que acompanha a conversa e pode pausar e intervir pessoalmente.</li>
                      <li>• Orientações apoiadas em <strong className="text-foreground">evidências científicas publicadas</strong>, com hábitos e próximos passos.</li>
                      <li>• Ao final, um <strong className="text-foreground">relatório individual</strong> que só é liberado depois de revisado e aprovado pelo Dr. Edilson.</li>
                      <li>• <strong className="text-foreground">Encaminhamento</strong> ao médico prescritor mais indicado da nossa vitrine para a consulta.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                    <h2 className="font-display font-black text-foreground text-base mb-2 flex items-center gap-2">
                      <XCircle className="text-amber-500" size={18} /> O que NÃO é
                    </h2>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>• Não é consulta médica.</li>
                      <li>• Não prescreve e não indica medicamentos, produtos ou doses.</li>
                      <li>• Não faz diagnóstico.</li>
                      <li>• Não emite receita.</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <div className="p-3 rounded-2xl bg-card border border-border flex items-start gap-2.5">
                      <Clock size={18} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-foreground">30 minutos</p>
                        <p className="text-[11px] text-muted-foreground">Sala com cronômetro</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-card border border-border flex items-start gap-2.5">
                      <BookOpen size={18} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Base científica</p>
                        <p className="text-[11px] text-muted-foreground">Evidências publicadas</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-card border border-border flex items-start gap-2.5">
                      <FileText size={18} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Relatório em PDF</p>
                        <p className="text-[11px] text-muted-foreground">Revisado pelo Dr. Edilson</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Como funciona: <strong className="text-foreground">1.</strong> pagamento seguro de R$ 30 pelo Mercado Pago →{" "}
                    <strong className="text-foreground">2.</strong> triagem com a Enfª Brisa (5 perguntas), após confirmação →{" "}
                    <strong className="text-foreground">3.</strong> sala com o Dr. Edilson ON, após concluir a triagem.
                  </p>

                  <Button onClick={() => setPhase("checkout")} className="w-full h-14 rounded-2xl font-black text-base">
                    Continuar para pagamento <ChevronRight size={18} className="ml-1" />
                  </Button>
                  {authed === false && (
                    <p className="text-[11px] text-muted-foreground text-center">
                      Já tem conta?{" "}
                      <Link
                        className="underline text-primary"
                        to={`/login?next=${encodeURIComponent("/orientacao-tecnica" + window.location.search)}`}
                      >
                        Entrar
                      </Link>
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {phase === "emergency" && (
            <div role="alert" className="border-2 border-destructive bg-destructive/10 p-6 space-y-4">
              <AlertTriangle className="text-destructive" size={40} />
              <h2 className="text-2xl font-bold text-destructive">Você não está sozinho(a) — procure ajuda agora</h2>
              <p>Pelo que você relatou, o mais seguro é atendimento presencial imediato: ligue <strong>SAMU 192</strong> ou vá ao pronto-socorro mais próximo. Se estiver passando por uma crise emocional, o <strong>CVV 188</strong> atende 24h, de graça.</p>
              <p className="text-sm text-muted-foreground">Seu pagamento continua válido e guardado — quando estiver em segurança, você pode voltar e corrigir sua resposta sem pagar de novo.</p>
              <Button variant="outline" onClick={() => { setStep(0); setPhase("triage"); }}>Voltar e corrigir minha resposta</Button>
            </div>
          )}

          {/* ── TRIAGEM ── */}
          {phase === "triage" && (
            <Card ref={questionCardRef} className="border-border scroll-mt-24">
              <CardContent className="p-6 md:p-8">
                <Progress value={((step + 1) / QUESTIONS.length) * 100} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground font-bold text-right mb-6">
                  Enfª Brisa · Pergunta {step + 1} de {QUESTIONS.length}
                </p>

                {(profileName || profileAge !== null) && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Atendendo: <strong className="text-foreground">{profileName || "paciente cadastrado"}</strong>
                    {profileAge !== null ? ` · ${profileAge} anos` : ""} (dados do seu cadastro)
                  </p>
                )}

                <h2 className="text-xl md:text-2xl font-display font-black text-foreground mb-1">{q.label}</h2>
                <p className="text-sm text-muted-foreground mb-6">{q.hint}</p>

                {q.type === "choice" ? (
                  <div className="space-y-3">
                    {(q.id === "red_flags" ? RED_FLAG_OPTIONS : (q.options || []).map(label => ({ value: label, label }))).map(opt => (
                      <Button key={opt.value} variant="outline" disabled={savingAnswer}
                        onClick={() => void saveAnswer(opt.value)}
                        className={`w-full h-auto p-4 text-left justify-between whitespace-normal ${answers[q.id] === opt.value || answers[q.id] === opt.label ? "border-primary bg-primary/10" : "border-border"}`}>
                        <span>{opt.label}</span><ChevronRight size={18} />
                      </Button>
                    ))}
                    {q.optional && (
                      <button type="button" onClick={() => void skipOptional()} disabled={savingAnswer}
                        className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline pt-1">
                        Pular esta pergunta
                      </button>
                    )}
                  </div>
                ) : q.type === "scale" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-6 gap-2" role="group" aria-label="Escala de intensidade de 0 a 10">
                      {Array.from({ length: 11 }, (_, n) => (
                        <Button key={n} variant="outline" disabled={savingAnswer}
                          onClick={() => void saveAnswer(String(n))}
                          className={`h-12 font-black ${answers[q.id] === String(n) ? "border-primary bg-primary/10" : "border-border"}`}>
                          {n}
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground px-1">
                      <span>Nenhum sintoma</span><span>Insuportável</span>
                    </div>
                  </div>
                ) : q.type === "combo" ? (
                  <div className="space-y-3">
                    <Textarea
                      value={draft || answers.queixa || ""}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={4}
                      placeholder="Descreva o principal problema com suas palavras..."
                      aria-label="Qual o principal problema?"
                    />
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Há quanto tempo?">
                      {(q.options || []).map((label) => (
                        <Button key={label} size="sm" variant="outline" disabled={savingAnswer}
                          onClick={() => setComboTempo(label)}
                          className={`rounded-full ${(comboTempo || answers.tempo) === label ? "border-primary bg-primary/10" : "border-border"}`}>
                          {label}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={() => void saveComboAnswers()}
                      disabled={savingAnswer || !(draft || answers.queixa || "").trim() || !(comboTempo || answers.tempo)}
                      className="w-full h-12 rounded-2xl font-black"
                    >
                      {savingAnswer ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
                      Continuar <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {q.type === "long" ? (
                      <Textarea
                        value={draft || answers[q.id] || ""}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={5}
                        placeholder="Escreva com suas palavras..."
                        aria-label={q.label}
                      />
                    ) : (
                      <Input
                        value={draft || answers[q.id] || ""}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !savingAnswer) { e.preventDefault(); void saveAnswer((draft || answers[q.id] || "").trim()); } }}
                        placeholder="Digite aqui..."
                        aria-label={q.label}
                      />
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const v = (draft || answers[q.id] || "").trim();
                          if (v) void saveAnswer(v);
                        }}
                        disabled={savingAnswer || !(draft || answers[q.id] || "").trim()}
                        className="flex-1 h-12 rounded-2xl font-black"
                      >
                        Continuar <ChevronRight size={16} className="ml-1" />
                      </Button>
                      {q.allowNone && (
                        <Button variant="outline" onClick={() => void saveAnswer("Nenhum")} disabled={savingAnswer}
                          className="h-12 rounded-2xl font-bold">
                          Nenhum
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => { setDraft(""); if (step > 0) setStep(step - 1); else setPhase("intro"); }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {step > 0 ? "Voltar à pergunta anterior" : "Voltar à explicação"}
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── CHECKOUT ── */}
          {phase === "checkout" && (
            <div className="space-y-6">
              {emergency ? (
                <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-5 flex gap-3">
                  <AlertTriangle className="text-red-500 shrink-0" />
                  <div className="text-sm">
                    <p className="font-black text-red-500 mb-1">Sinal de emergência identificado</p>
                    <p className="text-muted-foreground">
                      Pelo que você relatou, procure atendimento presencial agora: ligue <strong>SAMU 192</strong> ou
                      vá ao pronto-socorro mais próximo. Em crise emocional, o <strong>CVV 188</strong> atende 24h.
                      A Orientação Técnica não substitui urgência médica, por isso o pagamento não está disponível neste momento.
                    </p>
                    <button
                      onClick={() => { setStep(0); setPhase("triage"); }}
                      className="mt-3 text-xs underline text-muted-foreground"
                    >
                      Voltar e corrigir minha resposta
                    </button>
                  </div>
                </div>
              ) : (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="text-primary" size={20} />
                      <h2 className="font-display font-black text-foreground text-lg">
                        Pagamento seguro
                      </h2>
                    </div>

                    <div className="flex items-end justify-between mb-6">
                      <div>
                        <p className="text-xs uppercase font-black text-muted-foreground tracking-wider">Orientação Técnica</p>
                        <p className="text-sm text-muted-foreground">30 minutos com o Dr. Edilson Bezerra ON</p>
                      </div>
                      <p className="text-3xl font-display font-black text-gradient-green">R$ 30</p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={startPixCheckout}
                        disabled={creatingPix || creatingCheckout}
                        className="w-full h-14 rounded-2xl font-black text-base shadow-lg hover:shadow-xl transition-all bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                      >
                        {creatingPix ? (
                          <><Loader2 className="animate-spin" size={18} /> Gerando Pix na tela...</>
                        ) : (
                          <><QrCode size={20} /> Pagar R$ 30 com Pix (na tela — sem sair do site)</>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={startCheckout}
                        disabled={creatingPix || creatingCheckout}
                        className="w-full h-11 rounded-2xl font-semibold text-xs border-border text-muted-foreground hover:text-foreground"
                      >
                        {creatingCheckout ? (
                          <><Loader2 className="animate-spin mr-2" size={14} /> Abrindo...</>
                        ) : (
                          <>Prefere Cartão de Crédito? Pagar via Mercado Pago <ChevronRight size={14} className="ml-1" /></>
                        )}
                      </Button>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1 justify-center">
                      <ShieldCheck size={12} className="text-primary" /> Pix ou cartão. A triagem abre após a confirmação do pagamento.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── AGUARDANDO CONFIRMAÇÃO COM PIX NA TELA OU CHECKOUT EXTERNO ── */}
          {phase === "awaiting" && (
            <Card className="border-primary/30 shadow-lg">
              <CardContent className="p-6 md:p-8 text-center space-y-5">
                {pixData ? (
                  <>
                    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-display font-black text-lg">
                      <QrCode size={24} />
                      <h2>Pagamento Pix — R$ 30,00</h2>
                    </div>

                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Abra o aplicativo do seu banco, escolha <strong>Pix &gt; Ler QR Code</strong> ou use a opção <strong>Pix Copia e Cola</strong>. Não é necessário sair desta página: a triagem abre automaticamente após a confirmação!
                    </p>

                    {/* Imagem QR Code */}
                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md">
                        <img
                          src={`data:image/png;base64,${pixData.qr_code_base64}`}
                          alt="QR Code Pix"
                          className="w-48 h-48 md:w-56 md:h-56 object-contain"
                        />
                      </div>
                    </div>

                    {/* Código Pix Copia e Cola */}
                    <div className="space-y-2 max-w-md mx-auto text-left">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Código Pix Copia e Cola
                      </label>
                      <div className="p-2.5 bg-muted/40 rounded-xl border border-border text-[11px] font-mono break-all line-clamp-2 select-all text-muted-foreground">
                        {pixData.qr_code}
                      </div>

                      <Button
                        onClick={copyPixCode}
                        className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow"
                      >
                        {copiedPix ? (
                          <><Check size={18} className="text-white" /> Código Pix Copiado com Sucesso!</>
                        ) : (
                          <><Copy size={18} /> Copiar Código Pix (Copia e Cola)</>
                        )}
                      </Button>
                    </div>

                    {/* Status de aguardo em tempo real */}
                    <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                      <Loader2 className="animate-spin text-emerald-600 shrink-0" size={16} />
                      <span>Aguardando confirmação do banco... Mantenha esta tela aberta.</span>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={startCheckout}
                        disabled={creatingCheckout}
                      >
                        {creatingCheckout ? "Abrindo..." : "Prefere pagar com Cartão de Crédito? Clique aqui"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs rounded-xl"
                        onClick={() => setPhase("checkout")}
                      >
                        Voltar ao pagamento
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                    <h2 className="font-display font-black text-foreground text-lg">Aguardando a confirmação do pagamento</h2>
                    <p className="text-sm text-muted-foreground">
                      Assim que o Mercado Pago confirmar, sua triagem com a Enfª Brisa é liberada aqui
                      automaticamente. Pix costuma levar poucos segundos. Pode manter esta página aberta.
                    </p>
                    {authed === false && (
                      <p className="text-xs text-amber-500">
                        Entre na mesma conta usada no pagamento para acompanharmos a confirmação.{" "}
                        <Link className="underline" to={`/login?next=${encodeURIComponent("/orientacao-tecnica?paid=1")}`}>Entrar</Link>
                      </p>
                    )}
                    {awaitingLong && (
                      <div className="rounded-2xl bg-muted/40 border border-border p-4 text-xs text-muted-foreground text-left flex gap-2">
                        <Info size={14} className="shrink-0 mt-0.5 text-primary" />
                        <span>
                          Está demorando mais que o normal. Se o pagamento ainda não foi concluído, você pode voltar e
                          gerar um novo. Se já pagou, fale com a Enfª Brisa pelo WhatsApp que verificamos para você.
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        variant="outline"
                        className="rounded-2xl font-bold"
                        onClick={() => setPhase("checkout")}
                      >
                        Voltar ao pagamento
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── SALA (estilo WhatsApp) ── */}
          {phase === "room" && (
            <div className="space-y-4">
              <div className={`ot-room ${fullRoom ? "ot-room-full" : "border border-border"} ${largeText ? "ot-room-large" : ""}`} role={fullRoom ? "dialog" : undefined} aria-modal={fullRoom ? true : undefined} aria-label="Conversa de Orientação Técnica">
                {/* Header verde */}
                <div className="ot-room-header flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={DrEdilsonPhoto}
                      alt="Dr. Edilson Bezerra"
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white/30"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">Dr. Edilson Bezerra ON</p>
                      <p className="text-xs truncate">Assistente de IA supervisionado · {streaming ? "digitando…" : otState === "active" ? "online" : otState === "expired" || otState === "completed" ? "encerrado" : otState}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="ot-tool h-9 w-9" title={largeText ? "Diminuir letra" : "Aumentar letra"} aria-label={largeText ? "Diminuir letra" : "Aumentar letra"} onClick={() => setLargeText(v => !v)}><Type size={18} /></Button>
                  <Button variant="ghost" size="icon" className="ot-tool h-9 w-9" title={fullRoom ? "Minimizar conversa" : "Ampliar conversa"} aria-label={fullRoom ? "Minimizar conversa" : "Ampliar conversa"} onClick={() => setFullRoom(v => !v)}>{fullRoom ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</Button>
                  {(otState === "active" || otState === "paused") && (
                    <div
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
                        secondsLeft <= 300 ? "bg-red-500 text-white" : "bg-white/15 text-white"
                      }`}
                      role="timer"
                      aria-label="Tempo restante da orientação técnica"
                    >
                      <Clock size={12} /> {fmtClock(secondsLeft)}
                    </div>
                  )}
                  {otState === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ot-tool h-9 px-2 text-xs font-bold"
                      onClick={() => void closeSession()}
                      disabled={closing}
                      aria-label="Encerrar orientação"
                    >
                      {closing ? <Loader2 size={14} className="animate-spin" /> : "Encerrar"}
                    </Button>
                  )}
                  </div>
                </div>

                {otState === "paused" && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-900 text-xs font-bold">
                    <PauseCircle size={14} className="shrink-0" />
                    O Dr. Edilson pausou a conversa para revisar pessoalmente. Aguarde — ele retoma em instantes.
                  </div>
                )}

                {/* Mensagens */}
                <div ref={scrollRef} className="ot-room-messages h-[58vh] min-h-[260px] overflow-y-auto px-3 py-4 space-y-2">
                  <div className="flex justify-center"><span className="ot-system text-xs rounded-md px-3 py-1">Hoje</span></div>
                  {otState === "active" && secondsLeft <= 300 && secondsLeft > 0 && <div role="status" className="ot-system text-center text-sm p-2 rounded-md">{secondsLeft <= 60 ? "Falta 1 minuto para encerrar." : "Faltam 5 minutos para encerrar."}</div>}
                  <div className="flex justify-center">
                    <span className="text-[11px] bg-[#FFF3C4] text-neutral-700 px-3 py-1.5 rounded-lg shadow-sm text-center max-w-[90%]">
                      🔒 Conversa educativa com assistente de IA supervisionado pelo Dr. Edilson Bezerra. Não é
                      consulta, não prescreve e não emite receita.
                    </span>
                  </div>

                  {otState === "ready" && (
                    <div className="flex justify-center pt-6">
                      <div className="bg-white rounded-2xl shadow p-5 text-center max-w-sm space-y-3">
                        <p className="text-sm text-neutral-800">
                          Pagamento confirmado ✅ Sua sala está pronta. O cronômetro de 30 minutos começa quando você iniciar.
                        </p>
                        <Button
                          onClick={startRoom}
                          disabled={starting}
                          className="w-full rounded-xl font-black bg-[#25D366] hover:bg-[#1ebe5b] text-white"
                        >
                          {starting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                          Iniciar Orientação Técnica
                        </Button>
                      </div>
                    </div>
                  )}

                  {timeline.map((m) => {
                    if (m.role === "system") {
                      return (
                        <div key={m.id} className="flex justify-center">
                          <span className="text-[11px] bg-[#E1F3FB] text-neutral-700 px-3 py-1 rounded-lg shadow-sm max-w-[90%] text-center">
                            {m.content}
                          </span>
                        </div>
                      );
                    }
                    const mine = m.role === "patient";
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`ot-message relative max-w-[85%] rounded-lg px-3 py-2 ${
                            mine
                              ? "ot-message-mine rounded-tr-none"
                              : m.role === "supervisor"
                                ? "rounded-tl-none border-l-4 border-primary"
                                : "rounded-tl-none"
                          }`}
                        >
                          {m.role === "supervisor" && (
                            <p className="flex items-center gap-1 text-[11px] font-black text-amber-700 mb-1">
                              <UserCheck size={12} /> Dr. Edilson (humano)
                            </p>
                          )}
                          {m.attachment_path && (
                            <button
                              type="button"
                              onClick={() => void openAttachment(m.attachment_path as string)}
                              className="flex items-center gap-2 mb-1 px-2 py-1.5 rounded-md bg-black/5 hover:bg-black/10 text-xs font-bold text-left w-full"
                            >
                              <Paperclip size={13} className="shrink-0" />
                              <span className="truncate">{m.attachment_name || "Anexo"}</span>
                            </button>
                          )}
                          {mine ? (
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          ) : (
                            <div className="max-w-none break-words">
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                          )}
                          <div className="ot-meta flex justify-end items-center gap-1 mt-1">{fmtHour(m.created_at)}{mine && <CheckCheck size={14} aria-label="Mensagem registrada" />}</div>
                        </div>
                      </div>
                    );
                  })}

                  {streamText !== null && (
                    <div className="flex justify-start">
                      <div className="ot-message max-w-[85%] rounded-lg rounded-tl-none px-3 py-2">
                        {streamText ? (
                          <div className="max-w-none break-words">
                            <ReactMarkdown>{streamText}</ReactMarkdown>
                          </div>
                        ) : (
                          <span className="ot-typing" aria-label="digitando"><span /><span /><span /></span>
                        )}
                      </div>
                    </div>
                  )}
                  {streaming && streamText === null && (
                    <div className="flex justify-start">
                      <span className="bg-white rounded-lg px-3 py-2 text-xs text-neutral-500 animate-pulse shadow-sm">digitando…</span>
                    </div>
                  )}
                </div>

                {/* Rodapé / input */}
                <div className="ot-room-compose px-2 py-2">
                  {otState === "active" && <div className="flex gap-2 overflow-x-auto pb-2"><Button size="sm" variant="outline" className="ot-quick shrink-0" onClick={() => setInput("Acordo de madrugada")}>Acordo de madrugada</Button><Button size="sm" variant="outline" className="ot-quick shrink-0" onClick={() => setInput("Tenho dúvidas sobre tratamento")}>Dúvidas sobre tratamento</Button><Button size="sm" variant="outline" className="ot-quick shrink-0" asChild><a href={`https://wa.me/${BRISA_WHATSAPP}`} target="_blank" rel="noopener noreferrer">Falar com a equipe</a></Button></div>}
                  {chatError && (
                    <div role="alert" className="mb-3 p-3 bg-destructive/10 text-destructive text-sm space-y-2">
                      <p>{chatError}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setChatError(null); void loadMessages(); }}>Tentar de novo</Button>
                        <Button variant="outline" size="sm" asChild><a href={`https://wa.me/${BRISA_WHATSAPP}?text=${encodeURIComponent("Preciso falar com a equipe sobre minha Orientação Técnica paga.")}`} target="_blank" rel="noopener noreferrer">Chamar a equipe</a></Button>
                      </div>
                    </div>
                  )}
                  {otState === "completed" ? (
                    !ratingDone ? (
                      <div className="text-center space-y-4 py-3" role="group" aria-label="Avaliação da orientação">
                        <p className="text-base font-black text-neutral-800">Como foi sua orientação?</p>
                        <div className="flex items-start justify-center gap-4">
                          {([
                            { value: 1 as const, label: "Insatisfeito", Icon: Frown, active: "text-red-500 border-red-400 bg-red-50" },
                            { value: 2 as const, label: "Neutro", Icon: Meh, active: "text-amber-500 border-amber-400 bg-amber-50" },
                            { value: 3 as const, label: "Satisfeito", Icon: Smile, active: "text-green-600 border-green-500 bg-green-50" },
                          ]).map(({ value, label, Icon, active }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setRating(value)}
                              aria-pressed={rating === value}
                              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 min-w-[84px] transition-colors ${
                                rating === value ? active : "border-neutral-200 text-neutral-500 bg-white hover:border-neutral-300"
                              }`}
                            >
                              <Icon size={40} strokeWidth={1.6} />
                              <span className="text-xs font-bold">{label}</span>
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          rows={2}
                          placeholder="Quer contar o que podemos melhorar? (opcional)"
                          aria-label="Comentário opcional sobre a orientação"
                          className="max-w-md mx-auto resize-none rounded-xl bg-white"
                        />
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => void submitRating(rating)}
                            disabled={!rating || submittingRating}
                            className="rounded-xl font-black bg-[#075E54] hover:bg-[#064e46] text-white"
                          >
                            {submittingRating ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                            Enviar avaliação
                          </Button>
                          <Button variant="ghost" onClick={() => void submitRating(null)} disabled={submittingRating} className="rounded-xl font-bold text-neutral-600">
                            Pular
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4 py-3">
                        <p className="text-base font-black text-neutral-800">Orientação encerrada. Obrigado! 🌿</p>
                        <p className="text-xs text-neutral-600">Seu histórico e seu relatório continuam disponíveis nesta página.</p>
                        <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                          {reports.some((r) => canDownloadOtReport(r.status, !!r.educational_released_at)) && (
                            <Button asChild className="w-full rounded-xl font-black bg-[#075E54] hover:bg-[#064e46] text-white">
                              <Link to={`/orientacao-tecnica/relatorio/${reports.find((r) => canDownloadOtReport(r.status, !!r.educational_released_at))!.id}`}>
                                <FileText size={14} className="mr-1" /> Baixar relatório
                              </Link>
                            </Button>
                          )}
                          <Button onClick={() => navigate("/profissionais")} variant="outline" className="w-full rounded-xl font-bold bg-white text-neutral-900">
                            Falar com um médico agora (Chat R$ 100 · Vídeo R$ 150) <ArrowRight size={14} className="ml-1" />
                          </Button>
                          <Button onClick={resetForNew} variant="outline" className="w-full rounded-xl font-bold bg-white text-neutral-900">
                            Fazer nova orientação (R$ 30)
                          </Button>
                          <div className="w-full rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 p-3 text-left space-y-2">
                            <p className="text-xs font-black text-neutral-800 flex items-center gap-1"><Gift size={14} className="text-[#075E54]" /> Indique e participe do programa de ganhos</p>
                            <p className="text-[11px] text-neutral-700 leading-snug">
                              50% do valor líquido distribuídos na rede, em três níveis (25%, 15% e 10%). Obtenha seu link personalizado e acompanhe seus ganhos.
                            </p>
                            <Button onClick={() => navigate("/afiliados")} size="sm" className="w-full rounded-lg font-black bg-[#25D366] hover:bg-[#1ebe5b] text-white">
                              Obter meu link de indicação
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  ) : otState === "expired" || (otState === "active" && secondsLeft <= 0) ? (
                    <div className="text-center space-y-3 py-2">
                      <p className="text-sm font-bold text-neutral-800">Sessão de 30 minutos encerrada.</p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <Button
                          onClick={() => navigate("/profissionais")}
                          className="w-full sm:w-auto rounded-xl font-black bg-[#075E54] hover:bg-[#064e46] text-white"
                        >
                          Agendar com Médico Prescritor <ArrowRight size={14} className="ml-1" />
                        </Button>
                        <Button onClick={resetForNew} variant="outline" className="w-full sm:w-auto rounded-xl font-bold bg-white text-neutral-900">
                          Nova Orientação Técnica (R$ 30)
                        </Button>
                      </div>
                    </div>
                  ) : otState === "ready" ? (
                    <p className="text-center text-xs text-neutral-600 py-2">Toque em “Iniciar Orientação Técnica” para começar.</p>
                  ) : (
                    <>
                      {attachment && (
                        <div className="flex items-center gap-2 mb-2 mx-1 px-3 py-1.5 rounded-lg bg-white text-xs text-neutral-800 shadow-sm">
                          <Paperclip size={13} className="shrink-0" />
                          <span className="truncate flex-1">{attachment.name}</span>
                          <button type="button" onClick={() => setAttachment(null)} aria-label="Remover anexo">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        <input
                          ref={fileRef}
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={(e) => void onPickFile(e.target.files?.[0])}
                        />
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading || otState !== "active" || !!attachment}
                          className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-neutral-600 hover:bg-black/5 disabled:opacity-40"
                          aria-label="Anexar PDF ou imagem"
                        >
                          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={20} />}
                        </button>
                        <Textarea
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
                          }}
                          rows={1}
                          disabled={otState !== "active"}
                          placeholder={otState === "paused" ? "Sala pausada pelo Dr. Edilson…" : "Mensagem"}
                          aria-label="Mensagem para o Dr. Edilson Bezerra ON"
                          className="ot-input resize-none min-h-[44px] max-h-32 rounded-3xl border-0 px-4 py-3"
                        />
                        <Button
                          type="button"
                          onClick={() => void sendMessage()}
                          disabled={streaming || otState !== "active" || (!input.trim() && !attachment)}
                          className="ot-send h-11 w-11 shrink-0 rounded-full flex items-center justify-center disabled:opacity-50"
                          aria-label="Enviar mensagem"
                        >
                          {streaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </Button>
                      </div>
                    </>
                  )}
                  <p className="text-[10px] text-neutral-500 mt-1.5 text-center">
                    Assistente de IA supervisionado · conteúdo educativo · não é consulta, não prescreve e não emite receita.
                  </p>
                </div>
              </div>

              {/* Relatórios */}
              {otState !== "ready" && !fullRoom && (
                <Card className="border-border">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display font-black text-foreground text-sm">Relatório individual</p>
                        <p className="text-[11px] text-muted-foreground">
                          Relatório educativo gerado por IA, disponível assim que concluído. Revisão médica pendente não bloqueia o PDF.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => void generateReport()}
                        disabled={generatingReport || streaming || !messages.some(m => m.role === "patient") || reports.some((r) => r.status === "draft")}
                        className="rounded-xl font-bold shrink-0"
                      >
                        {generatingReport ? <Loader2 size={14} className="animate-spin mr-1" /> : <FileText size={14} className="mr-1" />}
                        {generatingReport ? "Gerando seu relatório…" : "Gerar relatório"}
                      </Button>
                    </div>
                    {reportError && <p role="alert" className="text-sm text-destructive">{reportError}</p>}
                    {generatingReport && <p role="status" className="text-sm text-muted-foreground">{reportWait >= 60 ? "A geração está demorando. Você pode chamar a equipe e consultar seus relatórios sem pagar novamente; não há confirmação de envio por e-mail ou WhatsApp." : `Montando seu relatório… ${reportWait}s`} {reportWait >= 60 && <Button variant="outline" size="sm" onClick={() => void loadReports()}>Verificar relatório</Button>}</p>}

                    {reports.length > 0 && (
                      <ul className="divide-y divide-border">
                        {reports.map((r) => (
                          <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground text-xs">{fmtDateTime(r.created_at)}</span>
                            {canDownloadOtReport(r.status, !!r.educational_released_at) ? (
                              <Link
                                to={`/orientacao-tecnica/relatorio/${r.id}`}
                                className="inline-flex items-center gap-1 text-primary font-bold text-xs"
                              >
                                <CheckCircle2 size={13} /> {r.status === "approved" ? "Revisado" : "Educativo · revisão pendente"} · Baixar PDF <ArrowRight size={12} />
                              </Link>
                            ) : r.status === "rejected" ? (
                              <span className="text-xs font-bold text-red-500">Não aprovado — gere um novo após conversar mais</span>
                            ) : (
                              <span className="text-xs font-bold text-amber-500 inline-flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" /> Revisão médica pendente
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
