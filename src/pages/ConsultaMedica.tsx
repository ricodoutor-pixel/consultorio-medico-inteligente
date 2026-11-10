import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Clock, Copy, Gift, Loader2, MessageSquare, ShieldCheck, Stethoscope, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PaymentConfirmedNotice } from "@/components/payments/PaymentConfirmedNotice";
import { JitsiRoom } from "@/components/consultation/JitsiRoom";
import { createConsultationCheckout, type ConsultationMode, type ConsultationPix } from "@/lib/telemedicine-checkout";
import { consultationStage, consultationRoomName, doctorJoined, faceToScore, type ConsultationSnapshot } from "@/lib/consultation-stage";
import { loadPermanentReferralCode } from "@/lib/referral-code";
import { professionals } from "@/data/professionals";
import { formatBRL, SERVICES } from "@/lib/pricing";

const WAIT_MINUTES = 5;
const CONSULT_MINUTES = 45;

const QUESTIONS: { q: string; options?: string[]; placeholder?: string }[] = [
  { q: "Qual é a sua principal queixa de saúde e a intensidade dos sintomas (0 a 10)?", placeholder: "Ex.: dor lombar diária, intensidade 8…" },
  { q: "Há quanto tempo você convive com esse problema?", options: ["Menos de 1 mês", "1 a 3 meses", "3 a 6 meses", "6 a 12 meses", "Mais de 1 ano"] },
  { q: "Já usou cannabis medicinal (CBD/THC) antes?", options: ["Sim, com bons resultados", "Sim, com resultado parcial", "Sim, sem efeito ou com efeitos adversos", "Nunca usei"] },
  { q: "Quais medicamentos de uso contínuo você toma e tem alguma alergia?", placeholder: "Se não tomar nenhum, escreva 'Nenhum'" },
  { q: "Qual objetivo você busca com o tratamento?", options: ["Alívio de dor", "Ansiedade e estresse", "Sono", "Apoio neurológico (TEA, Parkinson, epilepsia, TDAH)", "Reduzir outros remédios", "Qualidade de vida e apetite"] },
];

type Appt = ConsultationSnapshot & { id: string; doctor_id: string | null; type: string };
type DoctorView = { name: string; photo: string | null; crm: string | null; specialty: string | null };

const STEPS = ["Pagamento", "Triagem", "Consulta", "Avaliação", "Indicação"] as const;

export default function ConsultaMedica() {
  const { sku } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const mode: ConsultationMode = sku === "consulta_chat" ? "chat" : "video";
  const price = SERVICES[mode === "video" ? "consulta_video" : "consulta_chat"].price;
  const chosenDoctor = params.get("doctor");
  const apptId = params.get("appt");

  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appt, setAppt] = useState<Appt | null>(null);
  const [rated, setRated] = useState(false);
  const [patientEnded, setPatientEnded] = useState(false);
  const [doctor, setDoctor] = useState<DoctorView | null>(null);
  const [pix, setPix] = useState<ConsultationPix | null>(null);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paidAck, setPaidAck] = useState(false);
  const [answers, setAnswers] = useState<string[]>(["", "", "", "", ""]);
  const [qIndex, setQIndex] = useState(0);
  const [face, setFace] = useState<1 | 2 | 3 | null>(null);
  const [comment, setComment] = useState("");
  const [refCode, setRefCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

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

  const doctorId = appt?.doctor_id || chosenDoctor;

  // Foto e nome do médico: vitrine oficial primeiro, cadastro público como reserva.
  useEffect(() => {
    if (!doctorId) return;
    const local = professionals.find((p) => p.dbId === doctorId);
    supabase.from("doctors_public").select("full_name, avatar_url, specialty, crm, crm_state").eq("id", doctorId).maybeSingle()
      .then(({ data }) => {
        setDoctor({
          name: local?.name || data?.full_name || "Médico(a) da Planta y Raiz",
          photo: local?.imageUrl || data?.avatar_url || null,
          crm: local?.crm || (data?.crm ? `CRM ${data.crm}${data.crm_state ? `/${data.crm_state}` : ""}` : null),
          specialty: data?.specialty || local?.category || null,
        });
      });
  }, [doctorId]);

  const loadAppt = useCallback(async (id: string) => {
    const [{ data }, { data: nps }] = await Promise.all([
      supabase.from("appointments").select("id, doctor_id, type, payment_status, status, notes").eq("id", id).maybeSingle(),
      supabase.from("nps_responses").select("id").eq("consultation_id", id).limit(1),
    ]);
    if (data) setAppt(data as unknown as Appt);
    setRated(Boolean(nps && nps.length));
  }, []);

  useEffect(() => {
    if (!apptId || !userId) return;
    void loadAppt(apptId);
    const t = setInterval(() => { if (document.visibilityState === "visible") void loadAppt(apptId); }, 5000);
    return () => clearInterval(t);
  }, [apptId, userId, loadAppt]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stage = consultationStage(appt, rated, patientEnded);
  const stepIndex = { payment: 0, triage: 1, room: 2, rating: 3, referral: 4 }[stage];
  const showPaidNotice = stage !== "payment" && !paidAck && stage === "triage";

  // Pagamento -----------------------------------------------------------
  const generatePix = async () => {
    if (busy) return;
    if (!chosenDoctor && !appt) { setPayError("Escolha o médico no cartão da vitrine para continuar."); return; }
    setBusy(true); setPayError(null);
    try {
      const result = await createConsultationCheckout(mode, "", apptId, chosenDoctor);
      setPix(result.pix);
      if (result.appointmentId !== apptId) {
        const next = new URLSearchParams(params); next.set("appt", result.appointmentId);
        setParams(next, { replace: true });
      }
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Não foi possível gerar o Pix. Tente de novo.");
    } finally { setBusy(false); }
  };

  // Triagem -------------------------------------------------------------
  const submitTriage = async () => {
    if (!appt || !userId || busy) return;
    setBusy(true);
    try {
      const text = QUESTIONS.map((q, i) => `${i + 1}. ${q.q}\n${answers[i]}`).join("\n\n");
      const { data, error } = await supabase.from("brisa_triages").insert({
        patient_id: userId,
        symptoms: answers[0].slice(0, 500),
        patient_info: { answers },
        triage_result: text,
        category: "Cannabis Medicinal",
        urgency: "Moderada",
        status: "completed",
        completed_at: new Date().toISOString(),
      }).select("id").single();
      if (error || !data?.id) throw new Error("Não foi possível salvar a triagem.");
      const { error: upErr } = await supabase.from("appointments").update({ notes: `Triagem: ${data.id}\n\n${text}` }).eq("id", appt.id).eq("patient_id", userId);
      if (upErr) throw new Error("Não foi possível ligar a triagem à consulta.");
      localStorage.setItem(`pyr_consult_wait_${appt.id}`, String(Date.now()));
      await loadAppt(appt.id);
      toast.success("Triagem concluída! O médico já foi avisado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tente de novo.");
    } finally { setBusy(false); }
  };

  // Sala ---------------------------------------------------------------
  const room = appt && doctorJoined(appt) ? { domain: "meet.jit.si", roomName: consultationRoomName(appt.id) } : null;
  const waitStart = appt ? Number(localStorage.getItem(`pyr_consult_wait_${appt.id}`) || 0) : 0;
  const waitLeft = waitStart ? Math.max(0, WAIT_MINUTES * 60 - Math.floor((now - waitStart) / 1000)) : WAIT_MINUTES * 60;
  useEffect(() => {
    if (room && appt && !localStorage.getItem(`pyr_consult_start_${appt.id}`)) {
      localStorage.setItem(`pyr_consult_start_${appt.id}`, String(Date.now()));
    }
  }, [room, appt]);
  const consultStart = appt ? Number(localStorage.getItem(`pyr_consult_start_${appt.id}`) || 0) : 0;
  const consultLeft = consultStart ? Math.max(0, CONSULT_MINUTES * 60 - Math.floor((now - consultStart) / 1000)) : CONSULT_MINUTES * 60;
  useEffect(() => {
    if (room && consultStart && consultLeft === 0) setPatientEnded(true);
  }, [room, consultStart, consultLeft]);

  // Avaliação ----------------------------------------------------------
  const submitRating = async () => {
    if (!appt || !userId || !face || !appt.doctor_id || busy) return;
    setBusy(true);
    try {
      const score = faceToScore(face);
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
      await loadAppt(appt.id);
      toast.success("Obrigado pela sua avaliação! 💚");
    } catch {
      toast.error("Não foi possível registrar sua avaliação. Tente de novo.");
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (stage !== "referral" || !userId || refCode) return;
    loadPermanentReferralCode(userId).then(setRefCode).catch(() => setRefCode(null));
  }, [stage, userId, refCode]);
  const refLink = refCode ? `https://plantayraiz.com.br/cadastro?ref=${refCode}` : null;

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const ModeIcon = mode === "video" ? Video : MessageSquare;
  const label = mode === "video" ? "Consulta por Vídeo" : "Consulta por Chat";
  const answered = useMemo(() => answers[qIndex]?.trim().length > 1, [answers, qIndex]);

  if (!authChecked || !userId) {
    return <div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background pt-[calc(var(--site-header-height,96px)+16px)] pb-[calc(env(safe-area-inset-bottom)+24px)] px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Médico escolhido */}
        <Card className="border-primary/30">
          <CardContent className="p-4 flex items-center gap-4">
            {doctor?.photo ? (
              <img src={doctor.photo} alt={doctor.name} className="w-16 h-16 rounded-2xl object-cover border border-border" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><Stethoscope className="text-primary" /></div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-black text-foreground truncate">{doctor?.name || "Carregando médico…"}</p>
              <p className="text-xs text-muted-foreground">{[doctor?.crm, doctor?.specialty].filter(Boolean).join(" · ")}</p>
              <p className="text-xs font-bold text-primary flex items-center gap-1 mt-1"><ModeIcon size={13} /> {label} · {formatBRL(price)} · até {CONSULT_MINUTES} min</p>
            </div>
          </CardContent>
        </Card>

        {/* Etapas */}
        <ol className="grid grid-cols-5 gap-1 text-[10px] font-bold">
          {STEPS.map((s, i) => (
            <li key={s} className={`text-center rounded-lg py-1.5 border ${i < stepIndex ? "bg-primary/15 border-primary/30 text-primary" : i === stepIndex ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
              {i < stepIndex ? <Check size={11} className="inline mr-0.5" /> : null}{s}
            </li>
          ))}
        </ol>

        {stage === "payment" && (
          <Card><CardContent className="p-5 space-y-4 text-center">
            <h1 className="text-lg font-black text-foreground">Pague por Pix aqui mesmo</h1>
            <p className="text-sm text-muted-foreground">Depois do Pix confirmado pelo sistema, você responde 5 perguntas e o médico é avisado na hora.</p>
            {pix ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Pagamento: {pix.description || `${label} — Planta y Raiz`} · {formatBRL(pix.amount)}</p>
                <img src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR Code Pix" className="mx-auto w-56 h-56 rounded-lg bg-card p-2 border border-border" />
                <p className="text-[11px] break-all text-muted-foreground font-mono max-h-16 overflow-auto">{pix.qr_code}</p>
                <Button className="w-full font-black" onClick={async () => {
                  try { await navigator.clipboard.writeText(pix.qr_code); toast.success("Código Pix copiado!"); } catch { toast.error("Copie o código manualmente."); }
                }}><Copy size={16} className="mr-2" /> Copiar Código Pix</Button>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Aguardando confirmação do banco…</p>
              </div>
            ) : (
              <Button className="w-full font-black h-12" disabled={busy} onClick={() => void generatePix()}>
                {busy ? <><Loader2 size={16} className="mr-2 animate-spin" /> Gerando Pix…</> : `Gerar Pix de ${formatBRL(price)}`}
              </Button>
            )}
            {payError && <p className="text-sm text-destructive">{payError}</p>}
          </CardContent></Card>
        )}

        {stage === "triage" && (
          showPaidNotice ? (
            <PaymentConfirmedNotice pix label="Continuar para a triagem" onContinue={() => setPaidAck(true)} />
          ) : (
            <Card><CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-foreground">Triagem da Enfª Brisa</h2>
                <span className="text-xs font-bold text-primary">{qIndex + 1}/5</span>
              </div>
              <p className="text-sm font-bold text-foreground">{QUESTIONS[qIndex].q}</p>
              {QUESTIONS[qIndex].options ? (
                <div className="grid gap-2">
                  {QUESTIONS[qIndex].options!.map((o) => (
                    <button key={o} onClick={() => setAnswers((a) => a.map((v, i) => (i === qIndex ? o : v)))}
                      className={`text-left text-sm rounded-xl border px-3 py-2 ${answers[qIndex] === o ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}>{o}</button>
                  ))}
                </div>
              ) : (
                <Textarea value={answers[qIndex]} placeholder={QUESTIONS[qIndex].placeholder}
                  onChange={(e) => setAnswers((a) => a.map((v, i) => (i === qIndex ? e.target.value : v)))} rows={4} />
              )}
              <p className="text-[11px] text-muted-foreground">Em caso de emergência, ligue 192 (SAMU) agora.</p>
              <div className="flex gap-2">
                {qIndex > 0 && <Button variant="outline" onClick={() => setQIndex(qIndex - 1)}>Voltar</Button>}
                {qIndex < 4 ? (
                  <Button className="flex-1 font-black" disabled={!answered} onClick={() => setQIndex(qIndex + 1)}>Próxima</Button>
                ) : (
                  <Button className="flex-1 font-black" disabled={!answered || busy} onClick={() => void submitTriage()}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : "Concluir triagem e entrar na sala"}
                  </Button>
                )}
              </div>
            </CardContent></Card>
          )
        )}

        {stage === "room" && (
          room ? (
            <Card><CardContent className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border text-xs">
                <span className="font-bold text-primary flex items-center gap-1"><ShieldCheck size={14} /> Sala segura · {doctor?.name}</span>
                <span className="font-mono text-muted-foreground flex items-center gap-1"><Clock size={12} /> {fmt(consultLeft)}</span>
              </div>
              <div className="h-[60dvh] min-h-[360px]">
                <JitsiRoom roomName={room.roomName} domain={room.domain} displayName="Paciente" onClose={() => setPatientEnded(true)} />
              </div>
              <div className="p-3">
                <Button variant="outline" className="w-full font-bold" onClick={() => setPatientEnded(true)}>Encerrar consulta e avaliar</Button>
              </div>
            </CardContent></Card>
          ) : (
            <Card><CardContent className="p-5 text-center space-y-3">
              {doctor?.photo && <img src={doctor.photo} alt={doctor.name} className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-primary" />}
              <h2 className="font-black text-foreground">Aguardando {doctor?.name || "o médico"} entrar</h2>
              <p className="text-sm text-muted-foreground">O médico foi avisado pelo WhatsApp. A sala abre aqui sozinha quando ele entrar.</p>
              <p className="text-3xl font-mono font-black text-primary">{fmt(waitLeft)}</p>
              <p className="text-xs text-muted-foreground">
                {waitLeft > 0
                  ? "Se ele não entrar em 5 minutos, a consulta passa automaticamente para outro médico disponível, e você é avisado aqui e no WhatsApp."
                  : "Estamos chamando o próximo médico disponível. Fique nesta página — a sala abre aqui quando ele entrar."}
              </p>
            </CardContent></Card>
          )
        )}

        {stage === "rating" && (
          <Card><CardContent className="p-5 space-y-4 text-center">
            <h2 className="font-black text-foreground">Como foi sua consulta?</h2>
            <div className="flex justify-center gap-4">
              {([[1, "😞", "Ruim"], [2, "😐", "Regular"], [3, "😊", "Ótima"]] as const).map(([v, e, l]) => (
                <button key={v} onClick={() => setFace(v)} aria-label={l}
                  className={`flex flex-col items-center rounded-2xl border px-4 py-3 ${face === v ? "border-primary bg-primary/10" : "border-border"}`}>
                  <span className="text-3xl">{e}</span><span className="text-xs font-bold text-muted-foreground mt-1">{l}</span>
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentário (opcional)" rows={3} />
            <Button className="w-full font-black" disabled={!face || busy} onClick={() => void submitRating()}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Enviar avaliação"}
            </Button>
          </CardContent></Card>
        )}

        {stage === "referral" && (
          <Card><CardContent className="p-5 space-y-3">
            <h2 className="font-black text-foreground flex items-center gap-2"><Gift size={18} className="text-primary" /> Obrigado! Indique a Planta y Raiz</h2>
            <p className="text-xs text-muted-foreground">Quando alguém indicado por você contrata um serviço, 50% do valor líquido é distribuído na rede em três níveis (25%, 15% e 10%). Os ganhos dependem de indicações que realmente contratem — não há ganho garantido.</p>
            {refLink ? (
              <>
                <div className="p-2 rounded-lg border border-border text-[11px] font-mono break-all select-all text-muted-foreground">{refLink}</div>
                <Button className="w-full font-black" onClick={async () => {
                  try { await navigator.clipboard.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { toast.error("Copie o link manualmente."); }
                }}>{copied ? <><Check size={14} className="mr-1" /> Link copiado!</> : "Copiar meu link de indicação"}</Button>
              </>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => navigate("/afiliados/dashboard")}>Obter meu link de indicação</Button>
            )}
            <Button variant="outline" className="w-full" onClick={() => navigate("/consultas")}>Ver minhas consultas e receitas</Button>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
