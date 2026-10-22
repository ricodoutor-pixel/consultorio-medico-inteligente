// 🌿 Orientação Técnica — Dr. Edilson Bezerra ON (assistente de IA supervisionado)
// Fluxo real (contrato v2): explicação → triagem (Enfª Brisa) → pagamento R$ 30
// (Mercado Pago, triagem gravada ANTES da ordem) → aguardando confirmação (lê
// `status` a cada 5s; só o webhook aprovado libera) → sala estilo WhatsApp.
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
  UserCheck, XCircle, Info, MapPin, QrCode, Copy, Check,
} from "lucide-react";

const REF_STORAGE_KEY = "pyr_ot_external_reference";
const TRIAGE_STORAGE_KEY = "pyr_ot_triage";
const ATTACH_BUCKET = "ot-attachments";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

type Phase = "loading" | "intro" | "triage" | "checkout" | "awaiting" | "room";
type OtState = "none" | "awaiting_payment" | "ready" | "active" | "paused" | "expired";

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
};

type Attachment = { path: string; name: string; mime: string };

type TriageQuestion = {
  id: string;
  label: string;
  hint: string;
  type: "text" | "long" | "choice";
  options?: string[];
};

const QUESTIONS: TriageQuestion[] = [
  { id: "nome", label: "Como você se chama?", hint: "Nome que a equipe clínica vai usar no atendimento.", type: "text" },
  { id: "idade", label: "Qual a sua idade?", hint: "Idade em anos.", type: "text" },
  { id: "queixa", label: "Qual a sua queixa principal?", hint: "Descreva o que mais te incomoda hoje.", type: "long" },
  { id: "tempo", label: "Há quanto tempo você sente isso?", hint: "Selecione a opção mais próxima.", type: "choice", options: ["Menos de 1 mês", "1 a 6 meses", "6 meses a 2 anos", "Mais de 2 anos"] },
  { id: "intensidade", label: "De 0 a 10, qual a intensidade dos sintomas?", hint: "0 = nenhum sintoma, 10 = insuportável.", type: "choice", options: ["0 a 3 (leve)", "4 a 6 (moderado)", "7 a 8 (forte)", "9 a 10 (insuportável)"] },
  { id: "medicamentos", label: "Quais medicamentos ou tratamentos você usa hoje?", hint: "Liste nomes e doses, se souber. Escreva 'nenhum' se não usar.", type: "long" },
  { id: "canabinoides", label: "Já usou canabinoides (CBD/THC)?", hint: "Sua experiência prévia ajuda a contextualizar a orientação.", type: "choice", options: ["Nunca usei", "Já usei por conta própria", "Uso com receita médica", "Usei e parei"] },
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

const ROOM_STATES: OtState[] = ["ready", "active", "paused", "expired"];
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
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);

  const [reports, setReports] = useState<OtReport[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const questionCardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initDone = useRef(false);

  const emergency = EMERGENCY_ANSWERS.has(answers.red_flags || "");
  const triageComplete = QUESTIONS.every((item) => (answers[item.id] || "").trim());

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

  // ── Recupera triagem salva ─────────────────────────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem(TRIAGE_STORAGE_KEY);
    if (saved) {
      try { setAnswers((prev) => ({ ...JSON.parse(saved), ...prev })); } catch { /* ignora */ }
    }
  }, []);

  // ── Sessão do usuário ──────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setAuthed(!!data.session);
      setUserId(data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      setUserId(session?.user?.id ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const callFn = useCallback(async <T,>(body: Record<string, unknown>): Promise<T> => {
    const payload = activeSessionId ? { sessionId: activeSessionId, ...body } : body;
    const { data, error } = await supabase.functions.invoke("ot-edilson-web", { body: payload });
    if (error) throw error;
    return data as T;
  }, [activeSessionId]);

  // ── Status (fonte única para liberar a sala) ───────────────────────────
  const applyStatus = useCallback((d: { state?: OtState; session?: OtSession | null; minutesLeft?: number } | null) => {
    const st: OtState = (d?.state as OtState) || "none";
    const sess = d?.session ?? null;
    setOtState(st);
    setOtSession(sess);
    if (sess?.expires_at) {
      setSecondsLeft(Math.max(0, Math.floor((Date.parse(sess.expires_at) - Date.now()) / 1000)));
    } else if (typeof d?.minutesLeft === "number") {
      setSecondsLeft(Math.max(0, Math.floor(d.minutesLeft * 60)));
    }
    return st;
  }, []);

  const fetchStatus = useCallback(async () => {
    const d = await callFn<{ state?: OtState; session?: OtSession | null; minutesLeft?: number }>({ action: "status" });
    return applyStatus(d);
  }, [callFn, applyStatus]);

  // Decide a fase inicial a partir do servidor.
  useEffect(() => {
    if (authed === null || initDone.current) return;
    initDone.current = true;
    if (!authed) {
      const savedTriage = sessionStorage.getItem(TRIAGE_STORAGE_KEY);
      let hasCompleteTriage = false;
      if (savedTriage) {
        try {
          const parsed = JSON.parse(savedTriage);
          hasCompleteTriage = QUESTIONS.every((item) => (parsed[item.id] || "").trim()) && !EMERGENCY_ANSWERS.has(parsed.red_flags || "");
        } catch { /* ignora */ }
      }
      setPhase(returnedFromPayment ? "awaiting" : hasCompleteTriage ? "checkout" : "intro");
      return;
    }
    (async () => {
      try {
        const st = await fetchStatus();
        const hasPendingRef = !!localStorage.getItem(REF_STORAGE_KEY);
        if (LIVE_STATES.includes(st)) {
          localStorage.removeItem(REF_STORAGE_KEY);
          setPhase("room");
        } else if (st === "awaiting_payment" || returnedFromPayment || hasPendingRef) {
          setAwaitingSince(Date.now());
          setPhase("awaiting");
        } else if (st === "expired") {
          setPhase("room");
        } else {
          // Se já tem triagem completa salva na sessão, vai direto para o checkout
          const savedTriage = sessionStorage.getItem(TRIAGE_STORAGE_KEY);
          let hasCompleteTriage = false;
          if (savedTriage) {
            try {
              const parsed = JSON.parse(savedTriage);
              hasCompleteTriage = QUESTIONS.every((item) => (parsed[item.id] || "").trim()) && !EMERGENCY_ANSWERS.has(parsed.red_flags || "");
            } catch { /* ignora */ }
          }
          setPhase(hasCompleteTriage ? "checkout" : "intro");
        }
      } catch (e) {
        console.error("[ot] status", e);
        setPhase(returnedFromPayment ? "awaiting" : "intro");
      }
    })();
  }, [authed, returnedFromPayment, fetchStatus]);

  // Aguardando confirmação do webhook: lê `status` a cada 5s.
  useEffect(() => {
    if (phase !== "awaiting" || !authed) return;
    let alive = true;
    const tick = async () => {
      try {
        const st = await fetchStatus();
        if (alive && LIVE_STATES.includes(st)) {
          localStorage.removeItem(REF_STORAGE_KEY);
          setPhase("room");
        }
      } catch (e) {
        console.warn("[ot] poll status", e);
      }
    };
    void tick();
    const t = window.setInterval(tick, 5000);
    return () => { alive = false; window.clearInterval(t); };
  }, [phase, authed, fetchStatus]);

  // ── Mensagens e relatórios da sala ─────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try {
      const d = await callFn<{ messages?: OtMessage[] } | OtMessage[]>({ action: "messages" });
      const list = Array.isArray(d) ? d : d?.messages ?? [];
      setMessages(list);
    } catch (e) {
      console.warn("[ot] messages", e);
    }
  }, [callFn]);

  const loadReports = useCallback(async () => {
    try {
      const d = await callFn<{ reports?: OtReport[] } | OtReport[]>({ action: "reports" });
      setReports(Array.isArray(d) ? d : d?.reports ?? []);
    } catch (e) {
      console.warn("[ot] reports", e);
    }
  }, [callFn]);

  useEffect(() => {
    if (phase !== "room") return;
    void loadMessages();
    void loadReports();
  }, [phase, loadMessages, loadReports]);

  // Poll da sala (5s): status (pausa/expiração) + mensagens (inclui Dr. Edilson humano).
  useEffect(() => {
    if (phase !== "room" || otState === "expired") return;
    const t = window.setInterval(() => {
      if (streaming) return;
      void fetchStatus().catch(() => undefined);
      void loadMessages();
    }, 5000);
    return () => window.clearInterval(t);
  }, [phase, otState, streaming, fetchStatus, loadMessages]);

  // Relatórios em revisão: atualiza a cada 15s.
  useEffect(() => {
    if (phase !== "room" || !reports.some((r) => r.status === "draft")) return;
    const t = window.setInterval(() => void loadReports(), 15000);
    return () => window.clearInterval(t);
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
    if (phase === "room" && otState === "active" && !streaming) inputRef.current?.focus();
  }, [phase, otState, streaming]);

  // ── Triagem ───────────────────────────────────────────────────────────
  const q = QUESTIONS[step];

  const saveAnswer = (value: string) => {
    questionCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    sessionStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(next));
    setDraft("");
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setPhase("checkout");
  };

  const startTriage = () => {
    const firstMissing = QUESTIONS.findIndex((item) => !(answers[item.id] || "").trim());
    setStep(firstMissing === -1 ? 0 : firstMissing);
    setPhase("triage");
  };

  // ── Pagamento (mp-checkout grava a triagem antes de criar a ordem) ─────
  const startCheckout = async () => {
    if (!triageComplete || emergency) return;
    setCreatingCheckout(true);
    try {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        try {
          const { data: anonData } = await supabase.auth.signInAnonymously();
          session = anonData?.session ?? null;
        } catch {
          /* anonymous sign in fallback */
        }
      }
      if (!session) {
        const nextUrl = window.location.pathname + window.location.search;
        navigate(`/login?next=${encodeURIComponent(nextUrl)}`);
        return;
      }
      const returnUrl = `${window.location.origin}/orientacao-tecnica?paid=1${urlOrigem ? `&origem=${encodeURIComponent(urlOrigem)}` : ""}`;
      const { data, error } = await supabase.functions.invoke("mp-checkout", {
        body: { sku: "orientacao_tecnica", returnUrl, triage: answers },
      });
      if (error) {
        let code = "";
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") code = String((await ctx.json())?.error || "");
        } catch { /* corpo não-JSON */ }
        if (code === "triage_required") {
          toast({
            title: "Triagem incompleta",
            description: "Revise nome, queixa principal e tempo dos sintomas antes do pagamento.",
            variant: "destructive",
          });
          setStep(0);
          setPhase("triage");
          return;
        }
        throw error;
      }
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

  // ── Pagamento Pix In-Page (sem sair do site) ──────────────────────────
  const startPixCheckout = async () => {
    if (!triageComplete || emergency) return;
    setCreatingPix(true);
    try {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        try {
          const { data: anonData } = await supabase.auth.signInAnonymously();
          session = anonData?.session ?? null;
        } catch {
          /* anonymous sign in fallback */
        }
      }
      if (!session) {
        const nextUrl = window.location.pathname + window.location.search;
        navigate(`/login?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      const returnUrl = `${window.location.origin}/orientacao-tecnica?paid=1${urlOrigem ? `&origem=${encodeURIComponent(urlOrigem)}` : ""}`;
      const { data, error } = await supabase.functions.invoke("mp-checkout", {
        body: {
          sku: "orientacao_tecnica",
          payment_method: "pix",
          returnUrl,
          triage: answers,
        },
      });

      if (error) {
        let code = "";
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") code = String((await ctx.json())?.error || "");
        } catch { /* corpo não-JSON */ }
        if (code === "triage_required") {
          toast({
            title: "Triagem incompleta",
            description: "Revise nome, queixa principal e tempo dos sintomas antes do pagamento.",
            variant: "destructive",
          });
          setStep(0);
          setPhase("triage");
          return;
        }
        throw error;
      }

      const res = data as {
        success?: boolean;
        payment_method?: string;
        qr_code?: string;
        qr_code_base64?: string;
        payment_id?: string | number;
        external_reference?: string;
        init_point?: string;
      };

      if (res?.qr_code && res?.qr_code_base64) {
        setPixData({
          qr_code: res.qr_code,
          qr_code_base64: res.qr_code_base64,
          payment_id: res.payment_id || "",
        });
        if (res.external_reference) {
          localStorage.setItem(REF_STORAGE_KEY, res.external_reference);
        }
        setAwaitingSince(Date.now());
        setPhase("awaiting");
        toast({
          title: "Pix gerado com sucesso!",
          description: "Escaneie o QR Code ou copie o código Pix abaixo para pagar sem sair da página.",
        });
      } else if (res?.init_point) {
        if (res.external_reference) localStorage.setItem(REF_STORAGE_KEY, res.external_reference);
        window.location.href = res.init_point;
      } else {
        throw new Error("Não foi possível gerar o Pix na tela.");
      }
    } catch (e) {
      console.error("[ot] pix checkout", e);
      toast({
        title: "Não foi possível gerar o Pix direto",
        description: "Você pode tentar pelo checkout tradicional do Mercado Pago.",
        variant: "destructive",
      });
    } finally {
      setCreatingPix(false);
    }
  };

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
            ...(activeSessionId ? { sessionId: activeSessionId } : {}),
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
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      setStreamText("");

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
              setStreamText(acc);
            }
          } catch { /* keep-alive ou fragmento */ }
        }
      }
      if (!acc) throw new Error("resposta vazia");
    } catch (e) {
      console.error("[ot] chat", e);
      toast({
        title: "Falha momentânea de conexão",
        description: "Sua mensagem pode não ter sido entregue. Reenvie, por favor.",
        variant: "destructive",
      });
    } finally {
      await loadMessages();
      setPendingPatient(null);
      setStreamText(null);
      setStreaming(false);
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      await callFn({ action: "generate_report" });
      toast({
        title: "Relatório enviado para revisão",
        description: "O Dr. Edilson Bezerra revisa e aprova antes de liberar o PDF para você.",
      });
      await loadReports();
    } catch (e) {
      console.error("[ot] report", e);
      toast({ title: "Não foi possível gerar o relatório agora", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setGeneratingReport(false);
    }
  };

  const resetForNew = () => {
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

  const firstName = (answers.nome || "").split(" ")[0];
  const awaitingLong = Date.now() - awaitingSince > 3 * 60 * 1000;

  // ────────────────────────── RENDER ──────────────────────────
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12 md:pt-28">
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
                    Como funciona: <strong className="text-foreground">1.</strong> triagem com a Enfª Brisa (10 perguntas) →{" "}
                    <strong className="text-foreground">2.</strong> pagamento seguro de R$ 30 pelo Mercado Pago →{" "}
                    <strong className="text-foreground">3.</strong> sala com o Dr. Edilson ON, liberada assim que o pagamento é confirmado.
                  </p>

                  <Button onClick={startTriage} className="w-full h-14 rounded-2xl font-black text-base">
                    Começar triagem com a Enfª Brisa <ChevronRight size={18} className="ml-1" />
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

          {/* ── TRIAGEM ── */}
          {phase === "triage" && (
            <Card ref={questionCardRef} className="border-border scroll-mt-24">
              <CardContent className="p-6 md:p-8">
                <Progress value={((step + 1) / QUESTIONS.length) * 100} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground font-bold text-right mb-6">
                  Enfª Brisa · Pergunta {step + 1} de {QUESTIONS.length}
                </p>

                <h2 className="text-xl md:text-2xl font-display font-black text-foreground mb-1">{q.label}</h2>
                <p className="text-sm text-muted-foreground mb-6">{q.hint}</p>

                {q.type === "choice" ? (
                  <div className="space-y-3">
                    {q.options?.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => saveAnswer(opt)}
                        className={`w-full p-4 rounded-2xl border-2 bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left flex items-center justify-between ${
                          answers[q.id] === opt ? "border-primary" : "border-border"
                        }`}
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
                        placeholder="Digite aqui..."
                        aria-label={q.label}
                      />
                    )}
                    <Button
                      onClick={() => {
                        const v = (draft || answers[q.id] || "").trim();
                        if (v) saveAnswer(v);
                      }}
                      disabled={!(draft || answers[q.id] || "").trim()}
                      className="w-full h-12 rounded-2xl font-black"
                    >
                      Continuar <ChevronRight size={16} className="ml-1" />
                    </Button>
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
                      vá ao pronto-socorro mais próximo. A Orientação Técnica não substitui urgência médica, por isso o
                      pagamento não está disponível neste momento.
                    </p>
                    <button
                      onClick={() => { setStep(QUESTIONS.length - 1); setPhase("triage"); }}
                      className="mt-3 text-xs underline text-muted-foreground"
                    >
                      Marquei por engano — revisar resposta
                    </button>
                  </div>
                </div>
              ) : (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="text-primary" size={20} />
                      <h2 className="font-display font-black text-foreground text-lg">
                        Triagem concluída{firstName ? `, ${firstName}` : ""} — pagamento seguro
                      </h2>
                    </div>

                    <div className="rounded-2xl bg-card border border-border p-4 mb-6 space-y-2 text-sm">
                      {QUESTIONS.filter((item) => answers[item.id]).map((item) => (
                        <div key={item.id} className="flex gap-2">
                          <span className="text-muted-foreground shrink-0">{item.label}</span>
                          <span className="font-bold text-foreground ml-auto text-right">{answers[item.id]}</span>
                        </div>
                      ))}
                      <button
                        onClick={() => { setStep(0); setPhase("triage"); }}
                        className="text-xs underline text-muted-foreground"
                      >
                        Editar respostas
                      </button>
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
                        disabled={creatingPix || creatingCheckout || !triageComplete}
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
                        disabled={creatingPix || creatingCheckout || !triageComplete}
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
                      <ShieldCheck size={12} className="text-primary" /> Pix instantâneo ou cartão. A sala abre automaticamente na confirmação.
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
                      Abra o aplicativo do seu banco, escolha <strong>Pix &gt; Ler QR Code</strong> ou use a opção <strong>Pix Copia e Cola</strong>. Não é necessário sair desta página: a sala abre automaticamente logo após o pagamento!
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
                        onClick={() => setPhase(triageComplete ? "checkout" : "intro")}
                      >
                        Voltar à triagem
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                    <h2 className="font-display font-black text-foreground text-lg">Aguardando a confirmação do pagamento</h2>
                    <p className="text-sm text-muted-foreground">
                      Assim que o Mercado Pago confirmar, sua sala com o Dr. Edilson Bezerra ON é liberada aqui
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
                        onClick={() => setPhase(triageComplete ? "checkout" : "intro")}
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
              <div className="rounded-2xl overflow-hidden shadow-xl border border-black/10">
                {/* Header verde */}
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#075E54] text-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={DrEdilsonPhoto}
                      alt="Dr. Edilson Bezerra"
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white/30"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">Dr. Edilson Bezerra ON</p>
                      <p className="text-[11px] text-white/80 truncate">Assistente de IA supervisionado</p>
                    </div>
                  </div>
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
                </div>

                {otState === "paused" && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-900 text-xs font-bold">
                    <PauseCircle size={14} className="shrink-0" />
                    O Dr. Edilson pausou a conversa para revisar pessoalmente. Aguarde — ele retoma em instantes.
                  </div>
                )}

                {/* Mensagens */}
                <div ref={scrollRef} className="h-[58vh] min-h-[340px] overflow-y-auto px-3 py-4 space-y-2" style={CHAT_BG_STYLE}>
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
                          className={`relative max-w-[85%] rounded-lg px-3 py-2 shadow-sm text-sm text-neutral-900 ${
                            mine
                              ? "bg-[#DCF8C6] rounded-tr-none"
                              : m.role === "supervisor"
                                ? "bg-white rounded-tl-none border-l-4 border-amber-500"
                                : "bg-white rounded-tl-none"
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
                            <div className="prose prose-sm max-w-none prose-neutral prose-a:text-[#075E54] break-words">
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                          )}
                          <p className="text-[10px] text-neutral-500 text-right mt-0.5">{fmtHour(m.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}

                  {streamText !== null && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-lg rounded-tl-none px-3 py-2 shadow-sm text-sm text-neutral-900 bg-white">
                        {streamText ? (
                          <div className="prose prose-sm max-w-none prose-neutral break-words">
                            <ReactMarkdown>{streamText}</ReactMarkdown>
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-xs animate-pulse">digitando…</span>
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
                <div className="bg-[#F0F0F0] px-2 py-2">
                  {otState === "expired" || (otState === "active" && secondsLeft <= 0) ? (
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
                          className="resize-none min-h-[44px] max-h-32 rounded-3xl bg-white text-neutral-900 border-0 shadow-sm px-4 py-3 focus-visible:ring-1 focus-visible:ring-[#075E54]"
                        />
                        <button
                          type="button"
                          onClick={() => void sendMessage()}
                          disabled={streaming || otState !== "active" || (!input.trim() && !attachment)}
                          className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center bg-[#075E54] text-white disabled:opacity-50"
                          aria-label="Enviar mensagem"
                        >
                          {streaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                      </div>
                    </>
                  )}
                  <p className="text-[10px] text-neutral-500 mt-1.5 text-center">
                    Assistente de IA supervisionado · conteúdo educativo · não é consulta, não prescreve e não emite receita.
                  </p>
                </div>
              </div>

              {/* Relatórios */}
              {otState !== "ready" && (
                <Card className="border-border">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-display font-black text-foreground text-sm">Relatório individual</p>
                        <p className="text-[11px] text-muted-foreground">
                          Rascunho gerado pela IA e liberado somente após revisão e aprovação do Dr. Edilson Bezerra.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => void generateReport()}
                        disabled={generatingReport || timeline.length === 0 || reports.some((r) => r.status === "draft")}
                        className="rounded-xl font-bold shrink-0"
                      >
                        {generatingReport ? <Loader2 size={14} className="animate-spin mr-1" /> : <FileText size={14} className="mr-1" />}
                        Gerar relatório
                      </Button>
                    </div>

                    {reports.length > 0 && (
                      <ul className="divide-y divide-border">
                        {reports.map((r) => (
                          <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground text-xs">{fmtDateTime(r.created_at)}</span>
                            {r.status === "approved" ? (
                              <Link
                                to={`/orientacao-tecnica/relatorio/${r.id}`}
                                className="inline-flex items-center gap-1 text-primary font-bold text-xs"
                              >
                                <CheckCircle2 size={13} /> Aprovado · Ver e baixar PDF <ArrowRight size={12} />
                              </Link>
                            ) : r.status === "rejected" ? (
                              <span className="text-xs font-bold text-red-500">Não aprovado — gere um novo após conversar mais</span>
                            ) : (
                              <span className="text-xs font-bold text-amber-500 inline-flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" /> Aguardando revisão do Dr. Edilson
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
