import type { Json } from "@/integrations/supabase/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  Gift,
  Loader2,
  MessageSquare,
  Paperclip,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
  X,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PaymentConfirmedNotice } from "@/components/payments/PaymentConfirmedNotice";
import { StandardPixPaymentCard } from "@/components/payments/StandardPixPaymentCard";
import { JitsiRoom } from "@/components/consultation/JitsiRoom";
import {
  consultationCatalogItem,
  createConsultationCheckout,
  resolveConsultationDoctorUuid,
  type ConsultationPix,
} from "@/lib/telemedicine-checkout";
import {
  consultationStage,
  consultationRoomName,
  doctorJoined,
  faceToScore,
  type ConsultationSnapshot,
} from "@/lib/consultation-stage";
import {
  RED_FLAG_OPTIONS,
  hasEmergency,
} from "../../supabase/functions/_shared/orientation-triage";
import {
  PATIENT_URGENCY_RESCHEDULE_MESSAGE,
  PATIENT_FREE_OT_NOTICE_MESSAGE,
} from "@/lib/doctor-presence";
import { loadPermanentReferralCode } from "@/lib/referral-code";
import { userChannel } from "@/lib/realtime-channels";
import { professionals } from "@/data/professionals";
import { formatBRL } from "@/lib/pricing";

const WAIT_MINUTES = 5;
const TRIAGE_WINDOW_SECONDS = 5 * 60;
const CONSULT_MINUTES = 45;

interface TriageAnswers {
  red_flags: string[];
  queixa: string;
  tempo: string;
  intensidade: number;
  medicamentos: string;
  objetivo: string;
}

type Appt = ConsultationSnapshot & {
  id: string;
  doctor_id: string | null;
  type: string;
  amount?: number | null;
};

type DoctorView = {
  name: string;
  photo: string | null;
  crm: string | null;
  specialty: string | null;
  premiumPrice?: number | null;
};

type LiveChatMessage = {
  id: string;
  sender: "patient" | "doctor" | "system";
  content: string;
  attachmentName?: string;
  createdAt: string;
};

const STEPS = ["Pagamento", "Triagem", "Consulta", "Avaliação", "Indicação"] as const;

export default function ConsultaMedica() {
  const { sku } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const chosenDoctor = params.get("doctor") || params.get("pro");
  const proParam = params.get("pro") || chosenDoctor;
  const apptId = params.get("appt");

  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appt, setAppt] = useState<Appt | null>(null);
  const [rated, setRated] = useState(false);
  const [ratingJustSubmitted, setRatingJustSubmitted] = useState(false);
  const [patientEnded, setPatientEnded] = useState(false);
  const [doctor, setDoctor] = useState<DoctorView | null>(null);
  const [pix, setPix] = useState<ConsultationPix | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyCard, setBusyCard] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Etapa B: Mesmas 5 perguntas da Orientação Técnica (emergência primeiro, ~1 min por pergunta / janela de 5 min)
  const [triageStep, setTriageStep] = useState<number>(0);
  const [triage, setTriage] = useState<TriageAnswers>({
    red_flags: [],
    queixa: "",
    tempo: "",
    intensidade: 5,
    medicamentos: "",
    objetivo: "",
  });
  const [triageStartedAt, setTriageStartedAt] = useState<number | null>(null);
  const doctorAlertSentRef = useRef<Set<string>>(new Set());

  // Etapa D: Sala ao vivo no estilo da Orientação Técnica (45 min, vídeo/chat/arquivos)
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [showVideoPanel, setShowVideoPanel] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Etapa E: Estado da fila de médicos
  const [queueState, setQueueState] = useState<string>("waiting");
  const [queuePatientMessage, setQueuePatientMessage] = useState<string | null>(null);

  const [face, setFace] = useState<1 | 2 | 3 | null>(null);
  const [comment, setComment] = useState("");
  const [refCode, setRefCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const triageCardRef = useRef<HTMLDivElement>(null);

  const catalogItem = useMemo(
    () => consultationCatalogItem(sku || appt?.type || "consulta_video", doctor?.premiumPrice),
    [sku, appt?.type, doctor?.premiumPrice],
  );
  const mode = catalogItem.mode;
  const price = catalogItem.price;
  const label = catalogItem.shortName;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (authChecked && !userId) {
      const back = `${window.location.pathname}${window.location.search}`;
      toast.error("Entre na sua conta para contratar a consulta.");
      navigate(`/login?redirect=${encodeURIComponent(back)}`);
    }
  }, [authChecked, userId, navigate]);

  const doctorLookupKey = appt?.doctor_id || chosenDoctor || proParam;

  // Foto e nome do médico: vitrine oficial primeiro, cadastro público como reserva.
  useEffect(() => {
    if (!doctorLookupKey) return;
    let cancelled = false;
    const local = professionals.find(
      (p) =>
        p.dbId === doctorLookupKey ||
        p.id === doctorLookupKey ||
        (proParam && (p.id === proParam || p.dbId === proParam)),
    );
    if (local) {
      setDoctor({
        name: local.name,
        photo: local.imageUrl || null,
        crm: local.crm || null,
        specialty: (local as any).specialty || local.category || null,
        premiumPrice: local.premiumPrice ?? null,
      });
    }
    void (async () => {
      const resolvedUuid = await resolveConsultationDoctorUuid(doctorLookupKey);
      if (!resolvedUuid || cancelled) return;
      const { data } = await supabase
        .from("doctors_public")
        .select("full_name, avatar_url, specialty, crm, crm_state")
        .eq("id", resolvedUuid)
        .maybeSingle();
      if (cancelled) return;
      if (data || local) {
        setDoctor({
          name: local?.name || data?.full_name || "Médico(a) da Planta y Raiz",
          photo: local?.imageUrl || data?.avatar_url || null,
          crm: local?.crm || (data?.crm ? `CRM ${data.crm}${data.crm_state ? `/${data.crm_state}` : ""}` : null),
          specialty: data?.specialty || local?.category || null,
          premiumPrice: local?.premiumPrice ?? null,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doctorLookupKey, proParam]);

  const loadAppt = useCallback(async (id: string) => {
    const [{ data }, { data: nps }] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, doctor_id, type, amount, payment_status, status, notes")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("nps_responses").select("id").eq("consultation_id", id).limit(1),
    ]);
    if (data) setAppt(data as unknown as Appt);
    setRated(Boolean(nps && nps.length));
  }, []);

  useEffect(() => {
    if (!apptId || !userId) return;
    void loadAppt(apptId);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void loadAppt(apptId);
    }, 4000);
    return () => clearInterval(t);
  }, [apptId, userId, loadAppt]);

  // Realtime: assim que o webhook confirmar payment_status = 'paid', abre a triagem na hora sem recarregar.
  useEffect(() => {
    if (!apptId || !userId) return;
    const channel = supabase
      .channel(userChannel(userId, `consulta-${apptId}`))
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `id=eq.${apptId}`,
        },
        (payload: any) => {
          if (payload?.new) {
            setAppt((prev) => ({ ...(prev ?? {}), ...(payload.new as Appt) }));
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [apptId, userId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stage = consultationStage(appt, rated, patientEnded);
  const stepIndex = { payment: 0, triage: 1, room: 2, rating: 3, referral: 4 }[stage];

  // Etapa B: No mesmo instante do pagamento reconhecido, dispara aviso ao médico escolhido (WhatsApp + E-mail Hostinger)
  // e inicia o contador de 5 minutos da janela da triagem.
  useEffect(() => {
    if (!appt?.id || appt.payment_status !== "paid") return;

    if (!triageStartedAt) {
      const savedStart = Number(localStorage.getItem(`pyr_triage_start_${appt.id}`) || 0);
      const startMs = savedStart || Date.now();
      if (!savedStart) {
        localStorage.setItem(`pyr_triage_start_${appt.id}`, String(startMs));
        localStorage.setItem(`pyr_consult_wait_${appt.id}`, String(startMs));
      }
      setTriageStartedAt(startMs);
    }

    if (!doctorAlertSentRef.current.has(appt.id)) {
      doctorAlertSentRef.current.add(appt.id);
      supabase.functions
        .invoke("consultation-notify-doctor", {
          body: { appointmentId: appt.id },
        })
        .catch(() => {});
    }
  }, [appt?.id, appt?.payment_status, triageStartedAt]);

  const triageSecondsLeft = triageStartedAt
    ? Math.max(0, TRIAGE_WINDOW_SECONDS - Math.floor((now - triageStartedAt) / 1000))
    : TRIAGE_WINDOW_SECONDS;

  // Pagamento -----------------------------------------------------------
  const generatePix = async () => {
    if (busy || busyCard) return;
    if (!chosenDoctor && !appt) {
      setPayError("Escolha o médico no cartão da vitrine para continuar.");
      return;
    }
    setBusy(true);
    setPayError(null);
    try {
      const result = await createConsultationCheckout(catalogItem.sku, "", apptId, chosenDoctor, {
        customPremiumPrice: doctor?.premiumPrice,
        paymentMethod: "pix",
      });
      setPix(result.pix);
      if (result.appointmentId !== apptId) {
        const next = new URLSearchParams(params);
        next.set("appt", result.appointmentId);
        setParams(next, { replace: true });
      }
      await loadAppt(result.appointmentId);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Não foi possível gerar o Pix. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const generateCardCheckout = async () => {
    if (busy || busyCard) return;
    if (!chosenDoctor && !appt) {
      setPayError("Escolha o médico no cartão da vitrine para continuar.");
      return;
    }
    setBusyCard(true);
    setPayError(null);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
      const result = await createConsultationCheckout(catalogItem.sku, "", apptId, chosenDoctor, {
        customPremiumPrice: doctor?.premiumPrice,
        paymentMethod: "card",
        returnUrl,
      });
      if (result.appointmentId !== apptId) {
        const next = new URLSearchParams(params);
        next.set("appt", result.appointmentId);
        setParams(next, { replace: true });
      }
      if (result.initPoint) {
        window.location.href = result.initPoint;
      }
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Não foi possível abrir o pagamento por cartão. Tente de novo.");
    } finally {
      setBusyCard(false);
    }
  };

  // Triagem (mesmas 5 perguntas da Orientação Técnica) ------------------
  const isEmergencyBlocked = hasEmergency({ red_flags: triage.red_flags });

  const canAdvanceTriage = (): boolean => {
    if (triageStep === 0) return triage.red_flags.length > 0 && !isEmergencyBlocked;
    if (triageStep === 1) return triage.queixa.trim().length >= 3 && triage.tempo.trim().length >= 2;
    if (triageStep === 2) return triage.intensidade >= 0 && triage.intensidade <= 10;
    if (triageStep === 3) return triage.medicamentos.trim().length >= 2;
    if (triageStep === 4) return true;
    return false;
  };

  const submitTriage = async () => {
    if (!appt || !userId || busy || isEmergencyBlocked) return;
    setBusy(true);
    try {
      const text = [
        `1. Sinais de alerta (emergência): ${triage.red_flags.includes("nenhum") ? "Nenhum sinal de emergência" : triage.red_flags.join(", ")}`,
        `2. Queixa principal: ${triage.queixa.trim()} (Tempo: ${triage.tempo.trim()})`,
        `3. Intensidade (0 a 10): ${triage.intensidade}/10`,
        `4. Medicamentos contínuos / alergias: ${triage.medicamentos.trim()}`,
        `5. Objetivo principal: ${triage.objetivo.trim() || "Avaliação clínica"}`,
      ].join("\n");

      const { data, error } = await supabase
        .from("brisa_triages")
        .insert({
          patient_id: userId,
          symptoms: triage.queixa.trim().slice(0, 500),
          patient_info: { triage } as unknown as Json,
          triage_result: text,
          category: "Cannabis Medicinal",
          urgency: triage.intensidade >= 8 ? "Alta" : "Moderada",
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error || !data?.id) throw new Error("Não foi possível salvar a triagem.");

      const existingNotes = appt.notes || "";
      const preservedTags = existingNotes
        .split("\n")
        .filter((line) => line.startsWith("["))
        .join("\n");
      const updatedNotes = [preservedTags, `Triagem: ${data.id}`, text].filter(Boolean).join("\n\n");

      const { error: upErr } = await supabase
        .from("appointments")
        .update({ notes: updatedNotes })
        .eq("id", appt.id)
        .eq("patient_id", userId);
      if (upErr) throw new Error("Não foi possível ligar a triagem à consulta.");

      if (!localStorage.getItem(`pyr_consult_wait_${appt.id}`)) {
        localStorage.setItem(`pyr_consult_wait_${appt.id}`, String(Date.now()));
      }
      await loadAppt(appt.id);
      toast.success("Triagem enviada ao médico! Aguardando entrada na sala ao vivo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  // Sala & Fila (Etapas D & E) ------------------------------------------
  const room = appt && doctorJoined(appt) ? { domain: "meet.jit.si", roomName: consultationRoomName(appt.id) } : null;
  const waitStart = appt ? Number(localStorage.getItem(`pyr_consult_wait_${appt.id}`) || 0) : 0;
  const waitLeft = waitStart ? Math.max(0, WAIT_MINUTES * 60 - Math.floor((now - waitStart) / 1000)) : WAIT_MINUTES * 60;

  // Etapa E: Consulta o estado da fila de médicos e aciona transferência automática quando expira os 5 min
  useEffect(() => {
    if (stage !== "room" || room || !appt?.id) return;

    const notes = appt.notes || "";
    if (notes.includes("[ENCAMINHADO_OT_GRATUITA:")) {
      setQueueState("forwarded_free_ot");
      setQueuePatientMessage(PATIENT_FREE_OT_NOTICE_MESSAGE);
    } else if (notes.includes("[FILA_REAGENDADA_1H:")) {
      setQueueState("rescheduled_1h");
      setQueuePatientMessage(PATIENT_URGENCY_RESCHEDULE_MESSAGE);
    }

    const checkQueueStatus = async () => {
      try {
        const { data } = await supabase.functions.invoke(
          `consultation-offer?action=status&appointment=${encodeURIComponent(appt.id)}`,
          { method: "GET" as any },
        );
        if (data?.queueState) {
          setQueueState(data.queueState);
        }
        if (data?.patientMessage) {
          setQueuePatientMessage(data.patientMessage);
        }
        if (data?.currentOffer?.expires_at) {
          const expMs = new Date(data.currentOffer.expires_at).getTime();
          if (Date.now() >= expMs) {
            await supabase.functions.invoke("consultation-offer?action=sweep", {
              body: {},
            });
            await loadAppt(appt.id);
          }
        }
      } catch {
        // Silencioso em segundo plano
      }
    };

    void checkQueueStatus();
    const interval = setInterval(checkQueueStatus, 8000);
    return () => clearInterval(interval);
  }, [stage, room, appt?.id, appt?.notes, loadAppt]);

  useEffect(() => {
    if (room && appt && !localStorage.getItem(`pyr_consult_start_${appt.id}`)) {
      localStorage.setItem(`pyr_consult_start_${appt.id}`, String(Date.now()));
      setChatMessages([
        {
          id: "welcome-room",
          sender: "system",
          content: `Sala ao vivo iniciada com ${doctor?.name || "o médico"}. Duração máxima: 45 minutos. Você pode enviar mensagens, anexar exames ou usar o vídeo.`,
          createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [room, appt, doctor?.name]);

  const consultStart = appt ? Number(localStorage.getItem(`pyr_consult_start_${appt.id}`) || 0) : 0;
  const consultLeft = consultStart
    ? Math.max(0, CONSULT_MINUTES * 60 - Math.floor((now - consultStart) / 1000))
    : CONSULT_MINUTES * 60;

  useEffect(() => {
    if (room && consultStart && consultLeft === 0) {
      setPatientEnded(true);
    }
  }, [room, consultStart, consultLeft]);

  const sendLiveMessage = async () => {
    if (!chatInput.trim() && !attachedFileName) return;
    const text = attachedFileName
      ? `${chatInput.trim() ? `${chatInput.trim()} ` : ""}[Arquivo anexado: ${attachedFileName}]`
      : chatInput.trim();

    const newMsg: LiveChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "patient",
      content: text,
      attachmentName: attachedFileName || undefined,
      createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setAttachedFileName(null);

    if (userId && appt?.doctor_id) {
      try {
        const { data: docRow } = await supabase
          .from("doctors")
          .select("user_id")
          .eq("id", appt.doctor_id)
          .maybeSingle();
        if (docRow?.user_id) {
          await (supabase as any).from("messages").insert({
            sender_id: userId,
            receiver_id: docRow.user_id,
            content: text,
          });
        }
      } catch {
        // Mensagem mantida na sessão ao vivo
      }
    }
  };

  const endConsultationNow = async () => {
    setPatientEnded(true);
    if (appt?.id && userId) {
      await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appt.id)
        .eq("patient_id", userId);
    }
  };

  // Avaliação & Repasse (Etapas D & F) ----------------------------------
  const submitRating = async () => {
    if (!appt || !userId || !face || !appt.doctor_id || busy) return;
    setBusy(true);
    try {
      const score = faceToScore(face);
      const starRating = face === 3 ? 5 : face === 2 ? 3 : 1;

      const { error } = await supabase.from("nps_responses").insert({
        consultation_id: appt.id,
        patient_id: userId,
        professional_id: appt.doctor_id,
        score,
        category: score >= 9 ? "promoter" : score >= 7 ? "passive" : "detractor",
        sentiment: score >= 7 ? "positive" : "negative",
        feedback: comment.trim() || null,
      });
      if (error) throw error;

      // Etapa F: Registra em consultation_ratings (libera o repasse via trigger) e avisa o médico no WhatsApp:
      // "Pagamento disponível para saque na Planta y Raiz."
      try {
        await supabase.from("consultation_ratings").insert({
          consultation_id: appt.id,
          patient_id: userId,
          professional_id: appt.doctor_id,
          stars: starRating,
          comment: comment.trim() || null,
        });
      } catch {
        // Caso já exista registro para esta consulta
      }

      supabase.functions
        .invoke("doctor-payout-notify", {
          body: { appointment_id: appt.id },
        })
        .catch(() => {});

      setRatingJustSubmitted(true);
      await loadAppt(appt.id);
      toast.success("Obrigado pela avaliação!");
    } catch {
      toast.error("Não foi possível registrar sua avaliação. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (stage !== "referral" || !userId || refCode) return;
    loadPermanentReferralCode(userId)
      .then(setRefCode)
      .catch(() => setRefCode(null));
  }, [stage, userId, refCode]);
  const refLink = refCode ? `https://plantayraiz.com.br/cadastro?ref=${refCode}` : null;

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const ModeIcon = mode === "video" ? Video : mode === "retorno" ? Zap : mode === "premium" ? Crown : MessageSquare;

  if (!authChecked || !userId) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pt-[calc(var(--site-header-height,96px)+16px)] pb-[calc(env(safe-area-inset-bottom)+24px)] px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Médico escolhido */}
        <Card className="border-primary/30">
          <CardContent className="p-4 flex items-center gap-4">
            {doctor?.photo ? (
              <img
                src={doctor.photo}
                alt={doctor.name}
                className="w-16 h-16 rounded-2xl object-cover border border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Stethoscope className="text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-black text-foreground truncate">{doctor?.name || "Carregando médico…"}</p>
              <p className="text-xs text-muted-foreground">
                {[doctor?.crm, doctor?.specialty].filter(Boolean).join(" · ")}
              </p>
              <p className="text-xs font-bold text-primary flex items-center gap-1 mt-1">
                <ModeIcon size={13} /> {label} · {formatBRL(price)} · até {CONSULT_MINUTES} min
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Etapas */}
        <ol className="grid grid-cols-5 gap-1 text-[10px] font-bold">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`text-center rounded-lg py-1.5 border ${
                i < stepIndex
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : i === stepIndex
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground"
              }`}
            >
              {i < stepIndex ? <Check size={11} className="inline mr-0.5" /> : null}
              {s}
            </li>
          ))}
        </ol>

        {stage === "payment" && (
          <StandardPixPaymentCard
            serviceTitle={catalogItem.displayName}
            serviceSubtitle={`Atendimento com ${doctor?.name || "especialista"} · até ${CONSULT_MINUTES} min`}
            doctorName={doctor?.name}
            amount={price}
            pix={pix}
            busyPix={busy}
            busyCard={busyCard}
            error={payError}
            onGeneratePix={() => void generatePix()}
            onConfirmCardLeaveSite={() => void generateCardCheckout()}
            onResetPix={() => setPix(null)}
          />
        )}

        {stage === "triage" && (
          <div className="space-y-4">
            <PaymentConfirmedNotice
              pix={Boolean(pix)}
              label="Continuar triagem"
              onContinue={() => triageCardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })}
            />
            <Card ref={triageCardRef} className="border-emerald-500/30">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Triagem pré-consulta · Pergunta {triageStep + 1} de 5
                    </span>
                    <h2 className="font-black text-foreground text-base">
                      Enquanto você responde, o médico já foi avisado
                    </h2>
                  </div>
                  <div
                    data-testid="triage-window-timer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-black"
                    title="Janela de 5 minutos (~1 minuto por pergunta) para concluir a triagem enquanto o médico entra"
                  >
                    <Clock size={13} /> {fmt(triageSecondsLeft)}
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i <= triageStep ? "bg-emerald-600" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>

                {/* Pergunta 1: Emergência primeiro (SAMU 192 / CVV 188) */}
                {triageStep === 0 && (
                  <div className="space-y-3" data-testid="triage-question-1">
                    <p className="text-sm font-bold text-foreground">
                      1. Antes de começarmos: você está sentindo algum destes sinais de emergência AGORA?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Teleconsulta não substitui pronto-socorro. Selecione uma opção:
                    </p>
                    <div className="grid gap-2">
                      {RED_FLAG_OPTIONS.map((opt) => {
                        const selected = triage.red_flags.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTriage((t) => ({ ...t, red_flags: [opt.value] }))}
                            className={`text-left text-sm rounded-xl border p-3.5 transition-all flex items-center justify-between ${
                              selected
                                ? opt.value === "nenhum"
                                  ? "border-emerald-600 bg-emerald-500/10 font-bold text-foreground"
                                  : "border-red-600 bg-red-500/10 font-bold text-red-700 dark:text-red-300"
                                : "border-border text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {selected && <CheckCircle2 size={18} className="shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>

                    {isEmergencyBlocked && (
                      <div
                        data-testid="triage-emergency-alert"
                        className="rounded-xl border-2 border-red-600 bg-red-50 dark:bg-red-950/40 p-4 space-y-3"
                      >
                        <div className="flex items-start gap-2.5 text-red-800 dark:text-red-200">
                          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
                          <div className="text-xs leading-relaxed">
                            <p className="font-bold text-sm mb-1">Procure atendimento presencial imediato</p>
                            <p>
                              Para sua segurança, sinais de emergência médica exigem avaliação presencial imediata em
                              pronto-socorro.
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <a
                            href="tel:192"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-red-700"
                          >
                            <Phone className="h-4 w-4" /> Ligar 192 (SAMU)
                          </a>
                          <a
                            href="tel:188"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-400 bg-white dark:bg-red-950 px-3 py-2.5 text-xs font-bold text-red-800 dark:text-red-200"
                          >
                            <Phone className="h-4 w-4" /> Ligar 188 (CVV — apoio emocional)
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pergunta 2: Queixa principal e tempo */}
                {triageStep === 1 && (
                  <div className="space-y-3" data-testid="triage-question-2">
                    <p className="text-sm font-bold text-foreground">
                      2. Qual é a sua principal queixa de saúde e há quanto tempo sente isso?
                    </p>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                        Descreva o que está sentindo
                      </label>
                      <Textarea
                        value={triage.queixa}
                        onChange={(e) => setTriage((t) => ({ ...t, queixa: e.target.value }))}
                        placeholder="Ex.: insônia, ansiedade, dor crônica na coluna..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                        Há quanto tempo sente isso?
                      </label>
                      <Input
                        value={triage.tempo}
                        onChange={(e) => setTriage((t) => ({ ...t, tempo: e.target.value }))}
                        placeholder="Ex.: 6 meses, 2 anos, desde a semana passada"
                      />
                    </div>
                  </div>
                )}

                {/* Pergunta 3: Intensidade 0 a 10 */}
                {triageStep === 2 && (
                  <div className="space-y-3" data-testid="triage-question-3">
                    <p className="text-sm font-bold text-foreground">
                      3. Qual a intensidade do desconforto hoje, de 0 (nenhum) a 10 (máximo)?
                    </p>
                    <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setTriage((t) => ({ ...t, intensidade: n }))}
                          className={`py-2.5 rounded-lg border text-sm font-bold transition-all ${
                            triage.intensidade === n
                              ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                              : "border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pergunta 4: Medicamentos contínuos e alergias */}
                {triageStep === 3 && (
                  <div className="space-y-3" data-testid="triage-question-4">
                    <p className="text-sm font-bold text-foreground">
                      4. Usa algum medicamento contínuo ou tem alergias importantes?
                    </p>
                    <Textarea
                      value={triage.medicamentos}
                      onChange={(e) => setTriage((t) => ({ ...t, medicamentos: e.target.value }))}
                      placeholder="Liste os medicamentos em uso e alergias, ou clique em 'Nenhum' abaixo"
                      rows={3}
                    />
                    <button
                      type="button"
                      onClick={() => setTriage((t) => ({ ...t, medicamentos: "Nenhum" }))}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 underline"
                    >
                      Não uso nenhum medicamento / sem alergias
                    </button>
                  </div>
                )}

                {/* Pergunta 5: Objetivo principal */}
                {triageStep === 4 && (
                  <div className="space-y-3" data-testid="triage-question-5">
                    <p className="text-sm font-bold text-foreground">
                      5. Qual seu principal objetivo com a consulta?
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Alívio de dor",
                        "Ansiedade e estresse",
                        "Melhorar o sono",
                        "Apoio neurológico",
                        "Ajuste de receita / retorno",
                        "Qualidade de vida",
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setTriage((t) => ({ ...t, objetivo: chip }))}
                          className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                            triage.objetivo === chip
                              ? "border-emerald-600 bg-emerald-500/15 font-bold text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={triage.objetivo}
                      onChange={(e) => setTriage((t) => ({ ...t, objetivo: e.target.value }))}
                      placeholder="Ex.: entender opções terapêuticas, avaliar dosagem, renovar acompanhamento..."
                      rows={3}
                    />
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">
                  Em caso de emergência médica, ligue 192 (SAMU) ou 188 (CVV) imediatamente.
                </p>

                <div className="flex gap-2">
                  {triageStep > 0 && (
                    <Button variant="outline" onClick={() => setTriageStep((s) => s - 1)}>
                      Voltar
                    </Button>
                  )}
                  {triageStep < 4 ? (
                    <Button
                      className="flex-1 font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={!canAdvanceTriage()}
                      onClick={() => setTriageStep((s) => s + 1)}
                    >
                      Próxima pergunta
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={!canAdvanceTriage() || busy}
                      onClick={() => void submitTriage()}
                    >
                      {busy ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        "Concluir triagem e entrar na sala ao vivo"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Etapa D: Sala ao vivo (mesma interface da Orientação Técnica, 45 min, ferramentas da modalidade) */}
        {stage === "room" &&
          (room ? (
            <div className="rounded-2xl overflow-hidden border border-emerald-500/30 shadow-xl bg-[#ECE5DD]">
              {/* Cabeçalho idêntico à Orientação Técnica (#075E54) com foto do médico e ferramentas */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  {doctor?.photo ? (
                    <img
                      src={doctor.photo}
                      alt={doctor.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-300 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center shrink-0">
                      <Stethoscope size={18} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm leading-tight truncate">
                      {doctor?.name || "Médico(a) Planta y Raiz"}
                    </p>
                    <p className="text-[11px] text-emerald-100 truncate">
                      {[doctor?.crm, label, "Ao vivo"].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(mode === "video" || mode === "premium") && (
                    <button
                      type="button"
                      onClick={() => setShowVideoPanel((v) => !v)}
                      className="inline-flex items-center gap-1 rounded-full bg-white/15 hover:bg-white/25 px-2.5 py-1 text-xs font-bold"
                    >
                      <Video size={13} /> {showVideoPanel ? "Ocultar vídeo" : "Abrir vídeo"}
                    </button>
                  )}
                  <div
                    data-testid="live-room-timer"
                    className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-xs font-mono font-bold"
                    title="Duração máxima da consulta: 45 minutos"
                  >
                    <Clock size={12} /> {fmt(consultLeft)}
                  </div>
                  <button
                    type="button"
                    data-testid="end-consultation-button"
                    onClick={() => void endConsultationNow()}
                    className="inline-flex items-center gap-1 rounded-full bg-red-600 hover:bg-red-700 px-3 py-1 text-xs font-bold text-white"
                  >
                    Encerrar
                  </button>
                </div>
              </div>

              {/* Ferramenta de Vídeo ao vivo quando a modalidade inclui vídeo */}
              {(mode === "video" || mode === "premium") && showVideoPanel && (
                <div className="h-[46dvh] min-h-[300px] bg-black border-b border-emerald-900/20">
                  <JitsiRoom
                    roomName={room.roomName}
                    domain={room.domain}
                    displayName="Paciente"
                    onClose={() => void endConsultationNow()}
                  />
                </div>
              )}

              {/* Área de chat e envio de arquivos (mesmo estilo da Orientação Técnica) */}
              <div className="p-4 space-y-2.5 max-h-[38dvh] overflow-y-auto">
                {chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.sender === "patient"
                        ? "justify-end"
                        : m.sender === "system"
                          ? "justify-center"
                          : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                        m.sender === "patient"
                          ? "bg-[#DCF8C6] text-slate-900 rounded-br-sm"
                          : m.sender === "system"
                            ? "bg-amber-50 border border-amber-200 text-amber-950 text-center"
                            : "bg-white text-slate-900 rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      <span className="block text-[10px] text-slate-500 text-right mt-0.5">{m.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Barra de ferramentas (anexo de exames/receitas + mensagem) */}
              <div className="bg-[#F0F0F0] p-2.5 border-t border-slate-300 space-y-1.5">
                {attachedFileName && (
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-1 text-xs text-slate-700 border">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <FileText size={13} className="text-emerald-600" /> {attachedFileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedFileName(null)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setAttachedFileName(f.name);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-full bg-white text-slate-700 hover:bg-slate-100 border border-slate-300"
                    title="Anexar exame, receita ou imagem"
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendLiveMessage();
                      }
                    }}
                    placeholder="Digite sua mensagem ao médico..."
                    className="flex-1 rounded-full bg-white px-4 py-2 text-xs text-slate-900 border border-slate-300 focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => void sendLiveMessage()}
                    className="p-2.5 rounded-full bg-[#075E54] text-white hover:bg-[#064e46]"
                    title="Enviar mensagem"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-5 text-center space-y-3">
                {doctor?.photo && (
                  <img
                    src={doctor.photo}
                    alt={doctor.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-primary"
                  />
                )}

                {queueState === "rescheduled_1h" ? (
                  <div
                    data-testid="queue-rescheduled-1h-notice"
                    className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2"
                  >
                    <h2 className="font-black text-amber-600 dark:text-amber-300 text-base">
                      Reagendamento Automático (+1 hora)
                    </h2>
                    <p className="text-sm font-bold text-foreground">
                      {queuePatientMessage || PATIENT_URGENCY_RESCHEDULE_MESSAGE}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      O fluxo reiniciará automaticamente em 1 hora avisando os médicos novamente.
                    </p>
                  </div>
                ) : queueState === "forwarded_free_ot" ? (
                  <div
                    data-testid="queue-forwarded-free-ot-notice"
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3"
                  >
                    <h2 className="font-black text-emerald-600 dark:text-emerald-300 text-base flex items-center justify-center gap-1.5">
                      <Sparkles size={16} /> Encaminhamento para Orientação Técnica Gratuita
                    </h2>
                    <p className="text-sm text-foreground">
                      {queuePatientMessage || PATIENT_FREE_OT_NOTICE_MESSAGE}
                    </p>
                    <Button
                      className="w-full font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() =>
                        navigate(
                          `/orientacao-tecnica?free_from_appt=${encodeURIComponent(appt?.id || "")}&doctor=${encodeURIComponent(
                            chosenDoctor || appt?.doctor_id || "",
                          )}`,
                        )
                      }
                    >
                      Iniciar Orientação Técnica Gratuita Agora
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-black text-foreground">
                      Aguardando {doctor?.name || "o médico"} entrar
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      O médico recebeu aviso por WhatsApp e e-mail. A sala ao vivo abre aqui sozinha assim que ele
                      aceitar.
                    </p>
                    <p className="text-3xl font-mono font-black text-primary">{fmt(waitLeft)}</p>
                    <p className="text-xs text-muted-foreground">
                      {waitLeft > 0
                        ? "Tempo de espera: 5 minutos. Se o médico escolhido não puder atender, transferimos automaticamente para o próximo médico assinante ou médico online."
                        : "Transferindo automaticamente para o próximo médico disponível na fila..."}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}

        {stage === "rating" && (
          <Card>
            <CardContent className="p-5 space-y-4 text-center">
              <h2 className="font-black text-foreground">Como foi sua consulta?</h2>
              <p className="text-xs text-muted-foreground">
                Sua avaliação libera o repasse ao médico e ajuda a manter a qualidade da Planta y Raiz.
              </p>
              <div className="flex justify-center gap-4">
                {(
                  [
                    [1, "😞", "Ruim"],
                    [2, "😐", "Regular"],
                    [3, "😊", "Ótima"],
                  ] as const
                ).map(([v, e, l]) => (
                  <button
                    key={v}
                    onClick={() => setFace(v)}
                    aria-label={l}
                    className={`flex flex-col items-center rounded-2xl border px-4 py-3 ${
                      face === v ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <span className="text-3xl">{e}</span>
                    <span className="text-xs font-bold text-muted-foreground mt-1">{l}</span>
                  </button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comentário (opcional)"
                rows={3}
              />
              <Button className="w-full font-black" disabled={!face || busy} onClick={() => void submitRating()}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Enviar avaliação"}
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === "referral" && (
          <Card>
            <CardContent className="p-5 space-y-3">
              {ratingJustSubmitted && (
                <div
                  data-testid="rating-thank-you-banner"
                  className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-4 py-3 text-emerald-700 dark:text-emerald-300 font-black text-sm flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Obrigado pela avaliação!
                </div>
              )}
              <h2 className="font-black text-foreground flex items-center gap-2">
                <Gift size={18} className="text-primary" /> Obrigado pela avaliação! Indique a Planta y Raiz
              </h2>
              <p className="text-xs text-muted-foreground">
                Quando alguém indicado por você contrata um serviço, 50% do valor líquido é distribuído na rede em
                três níveis (25%, 15% e 10%). Os ganhos dependem de indicações que realmente contratem — não há ganho
                garantido.
              </p>
              {refLink ? (
                <>
                  <div className="p-2 rounded-lg border border-border text-[11px] font-mono break-all select-all text-muted-foreground">
                    {refLink}
                  </div>
                  <Button
                    className="w-full font-black"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(refLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        toast.error("Copie o link manualmente.");
                      }
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="mr-1" /> Link copiado!
                      </>
                    ) : (
                      "Copiar meu link de indicação"
                    )}
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => navigate("/afiliados/dashboard")}>
                  Obter meu link de indicação
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={() => navigate("/consultas")}>
                Ver minhas consultas e receitas
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

