import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useRealProfessionals } from "@/hooks/useRealProfessionals";
import { Navbar } from "@/components/Navbar";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalIcon, Clock, Video, MessageSquare, Phone, Star, ChevronRight, CheckCircle2, AlertCircle, Loader2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { notifyRoutedDoctor } from "@/lib/consultation-routing";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const consultTypes = [
  { id: "video", label: "Vídeo", icon: Video, desc: "Consulta por vídeo HD", price: 150 },
  { id: "chat", label: "Chat", icon: MessageSquare, desc: "Consulta por mensagem", price: 100 },
];

type Doctor = {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  rqe: string | null;
  specialty: string;
  bio: string | null;
  consultation_price: number;
  is_online: boolean;
  rating: number | null;
  total_consultations: number | null;
  profiles?: { full_name: string; avatar_url: string | null } | null;
};

type SlotInfo = {
  id: string;
  time_slot: string;
  status: string;
  reserved_by: string | null;
  reserved_until: string | null;
};

const RESERVATION_MINUTES = 15;

const Agendamento = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [consultType, setConsultType] = useState("video");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reserving, setReserving] = useState(false);
  /** Profissional de plantão resolvido no servidor (cadastro mais completo). */
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [loadingDays, setLoadingDays] = useState(false);
  const [searchParams] = useSearchParams();
  const { professionals } = useRealProfessionals();
  const preselectDone = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id || null));
    fetchDoctors();
  }, []);

  /** Todo atendimento é direcionado ao profissional com cadastro mais completo. */
  const selectDoctor = async (doc: Doctor) => {
    setSelectedDoctor(doc);
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedSlotId(null);
    setStep(2);
  };

  /** Agenda usada: a do próprio médico escolhido pelo paciente. */
  const schedulingDoctorId = selectedDoctor?.id ?? null;

  /** Dias com pelo menos um horário livre definido pelo médico (próximos 45 dias). */
  const fetchAvailableDays = async (doctorId: string) => {
    setLoadingDays(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const until = format(new Date(Date.now() + 45 * 86400000), "yyyy-MM-dd");
    const { data } = await supabase
      .from("doctor_availability")
      .select("slot_date, time_slot")
      .eq("doctor_id", doctorId)
      .eq("status", "available")
      .gte("slot_date", today)
      .lte("slot_date", until)
      .limit(2000);
    const nowHm = format(new Date(), "HH:mm");
    const days = new Set<string>();
    (data || []).forEach((s: any) => {
      if (s.slot_date === today && s.time_slot <= nowHm) return;
      days.add(s.slot_date);
    });
    setAvailableDays(days);
    setLoadingDays(false);
  };

  /** Médico vindo do perfil (?pro=slug) já chega selecionado. */
  useEffect(() => {
    if (preselectDone.current || doctors.length === 0) return;
    const slug = searchParams.get("pro");
    if (!slug) return;
    const pro = professionals.find((p) => p.id === slug);
    const doc = doctors.find((d) => d.id === pro?.dbId);
    if (doc) {
      preselectDone.current = true;
      void selectDoctor(doc);
    }
  }, [doctors, professionals, searchParams]);

  const modalityPrice = (type: string, doc: Doctor | null) => {
    const anyDoc = doc as any;
    if (type === "chat") return Number(anyDoc?.price_chat_only) || 100;
    return Number(anyDoc?.price_video_chat) || 150;
  };

  const fetchDoctors = async () => {
    const { data } = await supabase.from("doctors_public").select("*");
    const list = (data || []) as unknown as Doctor[];
    setDoctors(list);
  };

  // Fetch available slots for a doctor on a specific date
  const fetchSlots = useCallback(async (doctorId: string, date: Date) => {
    setLoadingSlots(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("doctor_availability")
      .select("id, time_slot, status, reserved_by, reserved_until")
      .eq("doctor_id", doctorId)
      .eq("slot_date", dateStr)
      .order("time_slot");

    if (!error && data && data.length > 0) {
      // Filter: show available OR reserved by current user (their own temp reservation)
      const now = new Date().toISOString();
      const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
      const nowHm = format(new Date(), "HH:mm");
      const filtered = data.filter((s: any) => {
        if (isToday && s.time_slot <= nowHm) return false;
        if (s.status === "available") return true;
        if (s.status === "reserved" && s.reserved_by === userId && s.reserved_until && s.reserved_until > now) return true;
        return false;
      });
      setSlots(filtered as SlotInfo[]);
    } else {
      setSlots([]);
      if (error) toast({ title: "Não foi possível carregar os horários", variant: "destructive" });
    }
    setLoadingSlots(false);
  }, [userId, toast]);

  // Reserve a slot temporarily (15 min)
  const reserveSlot = async (slot: SlotInfo) => {
    if (!userId) {
      toast({ title: "Faça login primeiro", variant: "destructive" });
      return;
    }
    setReserving(true);

    const reservedUntil = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("doctor_availability")
      .update({
        status: "reserved",
        reserved_by: userId,
        reserved_until: reservedUntil,
      })
      .eq("id", slot.id)
      .eq("status", "available");

    if (error) {
      toast({ title: "Horário indisponível", description: "Alguém reservou este horário. Tente outro.", variant: "destructive" });
      // Refresh slots
      if (schedulingDoctorId && selectedDate) fetchSlots(schedulingDoctorId, selectedDate);
    } else {
      setSelectedTime(slot.time_slot);
      setSelectedSlotId(slot.id);
      toast({
        title: `🔒 Horário ${slot.time_slot} reservado`,
        description: `Reserva válida por ${RESERVATION_MINUTES} minutos.`,
      });
    }
    setReserving(false);
  };

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d);
    setSelectedTime("");
    setSelectedSlotId(null);
    if (d && schedulingDoctorId) {
      fetchSlots(schedulingDoctorId, d);
      setStep(4);
    }
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    setLoading(true);
    // Revalida a sessão no momento do agendamento (evita token expirado)
    const { data: freshSession } = await supabase.auth.getSession();
    const authUid = freshSession.session?.user?.id ?? null;
    if (!authUid) {
      setLoading(false);
      setUserId(null);
      toast({ title: "Faça login primeiro", description: "Sua sessão expirou. Entre novamente para agendar.", variant: "destructive" });
      return;
    }
    if (authUid !== userId) setUserId(authUid);
    const scheduledAt = new Date(selectedDate);
    const [h, m] = selectedTime.split(":").map(Number);
    scheduledAt.setHours(h, m, 0, 0);

    trackPixelEvent("Schedule", {
      content_name: "appointment_booking",
      doctor_id: selectedDoctor.id,
      consultation_type: consultType,
      value: modalityPrice(consultType, selectedDoctor),
    }, { leadScore: 35, funnelStage: "decision", category: "conversion" });

    const routedId = schedulingDoctorId ?? selectedDoctor.id;
    const { data: newAppt, error } = await supabase.from("appointments").insert({
      patient_id: authUid,
      doctor_id: routedId,
      scheduled_at: scheduledAt.toISOString(),
      type: consultType,
      notes,
      amount: modalityPrice(consultType, selectedDoctor),
      status: "scheduled",
      payment_status: "pending",
    }).select("id").single();

    if (error || !newAppt) {
      setLoading(false);
      toast({ title: "Erro ao agendar", description: error?.message || "Tente novamente.", variant: "destructive" });
      return;
    }

    // Mark slot as booked
    if (selectedSlotId) {
      await supabase.from("doctor_availability").update({
        status: "booked",
        appointment_id: newAppt.id,
      }).eq("id", selectedSlotId);
    }

    // Aviso imediato ao profissional (e-mail + WhatsApp)
    void notifyRoutedDoctor(newAppt.id);

    try {
      const { data: session } = await supabase.auth.getSession();
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-payment", {
        body: {
          appointmentId: newAppt.id,
          doctorName: (selectedDoctor as any).full_name || `CRM ${selectedDoctor.crm}/${selectedDoctor.crm_state}`,
          patientEmail: session?.session?.user?.email || "",
          description: `Consulta ${consultTypes.find(c => c.id === consultType)?.label} — Planta y Raiz`,
        },
      });

      if (paymentError || !paymentData?.init_point) {
        toast({ title: "Consulta agendada", description: "Pagamento pendente — conclua pelo Dashboard." });
        setStep(5);
        setLoading(false);
        return;
      }

      toast({ title: "Redirecionando para pagamento...", description: "Você será levado ao Mercado Pago." });
      window.location.href = paymentData.init_point;
    } catch {
      toast({ title: "Consulta agendada", description: "Pagamento pendente — conclua pelo Dashboard." });
      setStep(5);
    }
    setLoading(false);
  };


  const [paidApptId, setPaidApptId] = useState<string | null>(null);
  const [waitExpired, setWaitExpired] = useState(false);

  /** 1) Paciente escolhe a consulta e paga antes de escolher o horário. */
  const handlePay = async () => {
    if (!selectedDoctor) return;
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) {
      toast({ title: "Entre na sua conta para pagar", description: "Depois do login você volta para cá." });
      window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    setLoading(true);
    const { data: appt, error } = await supabase.from("appointments").insert({
      patient_id: uid,
      doctor_id: selectedDoctor.id,
      scheduled_at: new Date().toISOString(),
      type: consultType,
      notes,
      amount: modalityPrice(consultType, selectedDoctor),
      status: "scheduled",
      payment_status: "pending",
      needs_scheduling: true,
    }).select("id").single();
    if (error || !appt) {
      setLoading(false);
      toast({ title: "Não foi possível iniciar", description: error?.message || "Tente novamente.", variant: "destructive" });
      return;
    }
    trackPixelEvent("InitiateCheckout", { content_name: "appointment_" + consultType, value: modalityPrice(consultType, selectedDoctor) }, { leadScore: 35, funnelStage: "decision", category: "conversion" });
    const { data: pay, error: payErr } = await supabase.functions.invoke("create-payment", {
      body: {
        appointmentId: appt.id,
        doctorName: (selectedDoctor as any).full_name || `CRM ${selectedDoctor.crm}/${selectedDoctor.crm_state}`,
        patientEmail: sess.session?.user?.email || "",
        description: `Consulta ${consultTypes.find(c => c.id === consultType)?.label} — Planta y Raiz`,
      },
    });
    if (payErr || !pay?.init_point) {
      setLoading(false);
      toast({ title: "Pagamento indisponível agora", description: "Tente de novo em instantes.", variant: "destructive" });
      return;
    }
    window.location.href = pay.init_point;
  };

  /** 2) Ao voltar do Mercado Pago (?appt=), espera a aprovação do aviso oficial e abre a agenda. */
  useEffect(() => {
    const apptId = searchParams.get("appt");
    if (!apptId || doctors.length === 0) return;
    let stop = false;
    let tries = 0;
    preselectDone.current = true;
    setStep(6);
    const check = async () => {
      if (stop) return;
      const { data } = await supabase.from("appointments")
        .select("id, doctor_id, type, payment_status, needs_scheduling, scheduled_at").eq("id", apptId).maybeSingle();
      const a = data as any;
      if (a) {
        const doc = doctors.find((d) => d.id === a.doctor_id);
        if (doc) setSelectedDoctor(doc);
        setConsultType(a.type || "video");
        if (["paid", "approved"].includes(a.payment_status)) {
          if (!a.needs_scheduling) {
            const when = new Date(a.scheduled_at);
            setSelectedDate(when); setSelectedTime(format(when, "HH:mm")); setStep(5); return;
          }
          setPaidApptId(a.id);
          void fetchAvailableDays(a.doctor_id);
          setStep(3);
          return;
        }
      }
      tries++;
      if (tries > 30) setWaitExpired(true);
      setTimeout(check, tries > 30 ? 15000 : 4000);
    };
    void check();
    return () => { stop = true; };
  }, [doctors, searchParams]);

  /** 3) Confirma o horário escolhido — só funciona para consulta já paga (validado no servidor). */
  const handleConfirmSlot = async () => {
    if (!paidApptId || !selectedSlotId) return;
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("book_paid_appointment_slot", { _appointment_id: paidApptId, _slot_id: selectedSlotId });
    setLoading(false);
    const res = data as any;
    if (error || !res?.ok) {
      const msg = res?.reason === "slot_taken" ? "Esse horário acabou de ser ocupado. Escolha outro." : res?.reason === "not_paid" ? "Pagamento ainda não aprovado." : "Não foi possível confirmar. Tente outro horário.";
      toast({ title: "Horário não confirmado", description: msg, variant: "destructive" });
      if (schedulingDoctorId && selectedDate) fetchSlots(schedulingDoctorId, selectedDate);
      return;
    }
    void notifyRoutedDoctor(paidApptId);
    setStep(5);
  };

  const isSlotReservedByMe = (slot: SlotInfo) =>
    slot.status === "reserved" && slot.reserved_by === userId;

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-2">
              Agendar <span className="text-gradient-green">Consulta</span>
            </h1>
            <p className="text-muted-foreground mb-8">Sistema de agendamento inteligente — CFM 2.314/2022 | Suporte: (11) 99136-3154</p>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {["Médico", "Consulta e pagamento", "Data", "Horário"].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step > i + 1 ? "bg-primary text-primary-foreground" : step === i + 1 ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground"
                  )}>
                    {step > i + 1 ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className={cn("text-xs font-bold hidden sm:block", step >= i + 1 ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                  {i < 3 && <ChevronRight size={14} className="text-muted-foreground" />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Select Doctor */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <Card className="border-primary/40 bg-primary/5">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div>
                        <p className="font-bold text-foreground text-sm">Quer só uma Orientação Técnica por R$ 30?</p>
                        <p className="text-xs text-muted-foreground">Atendimento imediato, sem agendamento, com documento e selo digital.</p>
                      </div>
                      <Button asChild size="sm" className="rounded-xl font-black">
                        <a href="/brisa-orientacao">Ir para Orientação Técnica</a>
                      </Button>
                    </CardContent>
                  </Card>

                  <h2 className="font-display font-black text-lg text-foreground">Escolha o Especialista</h2>
                  {doctors.length === 0 ? (
                    <Card className="border-border">
                      <CardContent className="p-8 text-center">
                        <AlertCircle size={32} className="text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhum especialista disponível no momento.</p>
                        <p className="text-xs text-muted-foreground mt-1">Médicos verificados aparecerão aqui automaticamente.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    doctors.map(doc => (
                      <Card key={doc.id} className={cn("border-border cursor-pointer transition-all hover:border-primary/40", selectedDoctor?.id === doc.id && "border-primary bg-primary/5")} onClick={() => { void selectDoctor(doc); }}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                              {(doc as any).avatar_url ? <img src={(doc as any).avatar_url} alt={(doc as any).full_name || doc.specialty} className="w-full h-full object-cover" loading="lazy" /> : <Video size={20} className="text-primary" />}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{(doc as any).full_name || doc.specialty}</p>
                              {(doc as any).full_name && <p className="text-xs text-foreground/80">{doc.specialty}</p>}
                              <p className="text-xs text-muted-foreground">CRM {doc.crm}/{doc.crm_state} {doc.rqe ? `• RQE ${doc.rqe}` : ""}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Star size={12} className="text-[hsl(var(--gold))]" />
                                <span className="text-xs text-foreground font-bold">{doc.rating || "5.0"}</span>
                                <span className="text-xs text-muted-foreground">• {doc.total_consultations || 0} consultas</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-display font-black text-primary">a partir de R$ {modalityPrice("chat", doc).toFixed(2)}</p>
                            {doc.is_online && <Badge className="bg-primary/10 text-primary border-primary text-[10px]">Online</Badge>}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2pay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  {selectedDoctor && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-foreground">{(selectedDoctor as any).full_name || selectedDoctor.specialty} · CRM {selectedDoctor.crm}/{selectedDoctor.crm_state}</p>
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Trocar</Button>
                      </CardContent>
                    </Card>
                  )}
                  <div>
                    <p className="text-sm font-bold text-foreground mb-3">Modalidade da consulta</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {consultTypes.map(ct => (
                        <Card key={ct.id} className={cn("cursor-pointer transition-all border-border hover:border-primary/40", consultType === ct.id && "border-primary bg-primary/5")} onClick={() => setConsultType(ct.id)}>
                          <CardContent className="p-4 text-center">
                            <ct.icon size={24} className="text-primary mx-auto mb-2" />
                            <p className="text-sm font-bold text-foreground">{ct.label}</p>
                            <p className="text-[10px] text-muted-foreground">{ct.desc}</p>
                            <p className="text-sm font-black text-primary mt-1">R$ {modalityPrice(ct.id, selectedDoctor).toFixed(2)}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-foreground mb-2">Observações (opcional)</p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Descreva brevemente seus sintomas ou motivo da consulta..."
                      className="w-full h-24 rounded-xl bg-card border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:border-primary focus:outline-none"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">Depois do pagamento aprovado você volta para esta página e escolhe o melhor horário na agenda do médico.</p>
                  <Button onClick={handlePay} disabled={loading} className="rounded-xl w-full">
                    {loading ? <><Loader2 className="animate-spin mr-2" size={14} /> Abrindo pagamento...</> : `Pagar R$ ${modalityPrice(consultType, selectedDoctor).toFixed(2)} (PIX ou cartão)`}
                  </Button>
                </motion.div>
              )}

              {step === 6 && (
                <motion.div key="step6wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="border-border"><CardContent className="p-8 text-center space-y-3">
                    <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                    <p className="font-bold text-foreground">Confirmando seu pagamento…</p>
                    <p className="text-sm text-muted-foreground">Assim que o Mercado Pago aprovar, a agenda do médico abre aqui automaticamente.</p>
                    {waitExpired && <p className="text-xs text-muted-foreground">Está demorando? Se você pagou por PIX, aguarde alguns minutos e recarregue a página, ou fale com a Enf. Brisa: (11) 99136-3154.</p>}
                  </CardContent></Card>
                </motion.div>
              )}

              {/* Step 3: Calendar Visual */}
              {step === 3 && (
                <motion.div key="step3cal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="font-display font-black text-lg text-foreground flex items-center gap-2">
                    <CalIcon size={18} className="text-primary" /> Escolha a Data
                  </h2>
                  {selectedDoctor && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Agenda de</p>
                          <p className="text-sm font-bold text-foreground">
                            {(selectedDoctor as any).full_name || selectedDoctor.specialty} · CRM {selectedDoctor.crm}/{selectedDoctor.crm_state}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Horários escolhidos pelo próprio médico · Horário de Brasília</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Trocar</Button>
                      </CardContent>
                    </Card>
                  )}
                  {loadingDays ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Carregando a agenda do médico…</p>
                  ) : availableDays.size === 0 ? (
                    <Card className="border-border"><CardContent className="p-4 text-sm text-muted-foreground">
                      Este médico ainda não abriu horários na agenda. Fale com a Enf. Brisa pelo WhatsApp (11) 99136-3154 ou escolha outro médico.
                    </CardContent></Card>
                  ) : (
                    <p className="text-xs text-muted-foreground">Próximo dia livre: <span className="font-bold text-foreground">{format(new Date([...availableDays].sort()[0] + "T12:00:00"), "EEEE, dd/MM", { locale: ptBR })}</span></p>
                  )}
                  <Card className="border-border overflow-hidden">
                    <CardContent className="p-6 flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => !availableDays.has(format(date, "yyyy-MM-dd"))}
                        locale={ptBR}
                        className={cn("p-3 pointer-events-auto rounded-xl")}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Time Slots from DB + Consultation Type */}
              {step === 4 && (
                <motion.div key="step4slots" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="font-display font-black text-lg text-foreground flex items-center gap-2">
                    <Clock size={18} className="text-primary" /> Horário e Modalidade
                  </h2>

                  <div>
                    <p className="text-sm font-bold text-foreground mb-3">
                      Horários Disponíveis — {selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""}
                    </p>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-primary" size={24} />
                        <span className="ml-2 text-sm text-muted-foreground">Carregando horários...</span>
                      </div>
                    ) : slots.length === 0 ? (
                      <Card className="border-border">
                        <CardContent className="p-6 text-center">
                          <AlertCircle size={24} className="text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data.</p>
                          <p className="text-xs text-muted-foreground mt-1">Tente outra data ou entre em contato pelo WhatsApp.</p>
                          <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl mt-3" size="sm">Escolher outra data</Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {slots.map(slot => {
                          const isMine = isSlotReservedByMe(slot);
                          const isSelected = selectedTime === slot.time_slot;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => {
                                if (isMine || isSelected) return;
                                reserveSlot(slot);
                              }}
                              disabled={reserving}
                              className={cn(
                                "py-3 px-2 rounded-xl text-xs font-bold border transition-all relative",
                                isSelected || isMine
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                              )}
                            >
                              {(isSelected || isMine) && <Lock size={10} className="absolute top-1 right-1" />}
                              {slot.time_slot}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedTime && (
                      <p className="text-xs text-primary mt-2 flex items-center gap-1">
                        <Lock size={12} /> Reservado por {RESERVATION_MINUTES} min — confirme para garantir.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl">← Outra data</Button>
                    <Button onClick={handleConfirmSlot} disabled={!selectedSlotId || loading} className="rounded-xl flex-1">
                      {loading ? <><Loader2 className="animate-spin mr-2" size={14} /> Confirmando...</> : "✅ Confirmar este horário"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Confirmation */}
              {/* Step 5: Success */}
              {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-8 text-center">
                      <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
                      <h2 className="text-2xl font-display font-black text-foreground mb-2">Consulta Agendada!</h2>
                      <p className="text-muted-foreground mb-6">
                        Sua consulta foi agendada para{" "}
                        <strong className="text-foreground">
                          {selectedDate && format(selectedDate, "dd/MM/yyyy")} às {selectedTime}
                        </strong>
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button variant="outline" className="rounded-xl" onClick={() => { setStep(1); setSelectedDoctor(null); setSelectedDate(undefined); setSelectedTime(""); setSelectedSlotId(null); setNotes(""); }}>
                          Novo Agendamento
                        </Button>
                        <Button className="rounded-xl" asChild>
                          <a href="/dashboard">Ir para Dashboard</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Agendamento;
