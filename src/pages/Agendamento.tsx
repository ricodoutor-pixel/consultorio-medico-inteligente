import { useState, useEffect, useCallback } from "react";
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

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const consultTypes = [
  { id: "video", label: "Vídeo", icon: Video, desc: "Orientação Técnica por vídeo HD" },
  { id: "chat", label: "Chat", icon: MessageSquare, desc: "Orientação Técnica por mensagem" },
  { id: "phone", label: "Telefone", icon: Phone, desc: "Orientação Técnica por telefone" },
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id || null));
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    const { data } = await supabase.from("doctors_public").select("*");
    if (data) setDoctors(data as unknown as Doctor[]);
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

    if (!error && data) {
      // Filter: show available OR reserved by current user (their own temp reservation)
      const now = new Date().toISOString();
      const filtered = data.filter((s: any) => {
        if (s.status === "available") return true;
        if (s.status === "reserved" && s.reserved_by === userId && s.reserved_until && s.reserved_until > now) return true;
        return false;
      });
      setSlots(filtered as SlotInfo[]);
    } else {
      setSlots([]);
    }
    setLoadingSlots(false);
  }, [userId]);

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
      if (selectedDoctor && selectedDate) fetchSlots(selectedDoctor.id, selectedDate);
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
    if (d && selectedDoctor) {
      fetchSlots(selectedDoctor.id, d);
      setStep(3);
    }
  };

  const handleBook = async () => {
    if (!userId) {
      toast({ title: "Faça login primeiro", description: "Você precisa estar logado para agendar.", variant: "destructive" });
      return;
    }
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    setLoading(true);
    const scheduledAt = new Date(selectedDate);
    const [h, m] = selectedTime.split(":").map(Number);
    scheduledAt.setHours(h, m, 0, 0);

    trackPixelEvent("Schedule", {
      content_name: "appointment_booking",
      doctor_id: selectedDoctor.id,
      consultation_type: consultType,
      value: selectedDoctor.consultation_price,
    }, { leadScore: 35, funnelStage: "decision", category: "conversion" });

    const { data: newAppt, error } = await supabase.from("appointments").insert({
      patient_id: userId,
      doctor_id: selectedDoctor.id,
      scheduled_at: scheduledAt.toISOString(),
      type: consultType,
      notes,
      amount: selectedDoctor.consultation_price,
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

    try {
      const { data: session } = await supabase.auth.getSession();
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-payment", {
        body: {
          appointmentId: newAppt.id,
          doctorName: `CRM ${selectedDoctor.crm}/${selectedDoctor.crm_state}`,
          patientEmail: session?.session?.user?.email || "",
          description: `Orientação Técnica ${consultTypes.find(c => c.id === consultType)?.label} — Planta y Raiz`,
        },
      });

      if (paymentError || !paymentData?.init_point) {
        toast({ title: "Orientação Técnica agendada", description: "Pagamento pendente — conclua pelo Dashboard." });
        setStep(5);
        setLoading(false);
        return;
      }

      toast({ title: "Redirecionando para pagamento...", description: "Você será levado ao Mercado Pago." });
      window.location.href = paymentData.init_point;
    } catch {
      toast({ title: "Orientação Técnica agendada", description: "Pagamento pendente — conclua pelo Dashboard." });
      setStep(5);
    }
    setLoading(false);
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
              Agendar <span className="text-gradient-green">Orientação Técnica</span>
            </h1>
            <p className="text-muted-foreground mb-8">Sistema de agendamento inteligente — CFM 2.314/2022 | Suporte: (11) 99136-3154</p>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {["Especialista", "Data", "Horário", "Confirmação"].map((label, i) => (
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
                      <Card key={doc.id} className={cn("border-border cursor-pointer transition-all hover:border-primary/40", selectedDoctor?.id === doc.id && "border-primary bg-primary/5")} onClick={() => { setSelectedDoctor(doc); setStep(2); }}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                              <Video size={20} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{doc.specialty}</p>
                              <p className="text-xs text-muted-foreground">CRM {doc.crm}/{doc.crm_state} {doc.rqe ? `• RQE ${doc.rqe}` : ""}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Star size={12} className="text-[hsl(var(--gold))]" />
                                <span className="text-xs text-foreground font-bold">{doc.rating || "5.0"}</span>
                                <span className="text-xs text-muted-foreground">• {doc.total_consultations || 0} consultas</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-display font-black text-primary">R$ {Number(doc.consultation_price).toFixed(2)}</p>
                            {doc.is_online && <Badge className="bg-primary/10 text-primary border-primary text-[10px]">Online</Badge>}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </motion.div>
              )}

              {/* Step 2: Calendar Visual */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="font-display font-black text-lg text-foreground flex items-center gap-2">
                    <CalIcon size={18} className="text-primary" /> Escolha a Data
                  </h2>
                  <Card className="border-border overflow-hidden">
                    <CardContent className="p-6 flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date < new Date() || date.getDay() === 0}
                        locale={ptBR}
                        className={cn("p-3 pointer-events-auto rounded-xl")}
                      />
                    </CardContent>
                  </Card>
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">← Voltar</Button>
                </motion.div>
              )}

              {/* Step 3: Time Slots from DB + Consultation Type */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="font-display font-black text-lg text-foreground flex items-center gap-2">
                    <Clock size={18} className="text-primary" /> Horário e Modalidade
                  </h2>

                  <div>
                    <p className="text-sm font-bold text-foreground mb-3">Tipo de Orientação Técnica</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {consultTypes.map(ct => (
                        <Card key={ct.id} className={cn("cursor-pointer transition-all border-border hover:border-primary/40", consultType === ct.id && "border-primary bg-primary/5")} onClick={() => setConsultType(ct.id)}>
                          <CardContent className="p-4 text-center">
                            <ct.icon size={24} className="text-primary mx-auto mb-2" />
                            <p className="text-sm font-bold text-foreground">{ct.label}</p>
                            <p className="text-[10px] text-muted-foreground">{ct.desc}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

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

                  <div>
                    <p className="text-sm font-bold text-foreground mb-2">Observações (opcional)</p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Descreva brevemente seus sintomas ou motivo da consulta..."
                      className="w-full h-24 rounded-xl bg-card border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">← Voltar</Button>
                    <Button onClick={() => selectedTime && setStep(4)} disabled={!selectedTime} className="rounded-xl flex-1">
                      Confirmar Horário <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Confirmation */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="font-display font-black text-lg text-foreground flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-primary" /> Confirme sua Orientação Técnica
                  </h2>

                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-6 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-bold uppercase">Especialista</p>
                          <p className="text-sm font-bold text-foreground">{selectedDoctor?.specialty}</p>
                          <p className="text-xs text-muted-foreground">CRM {selectedDoctor?.crm}/{selectedDoctor?.crm_state}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-bold uppercase">Data e Hora</p>
                          <p className="text-sm font-bold text-foreground">
                            {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">{selectedTime} • {consultTypes.find(c => c.id === consultType)?.label}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-bold uppercase">Valor</p>
                          <p className="text-2xl font-display font-black text-primary">R$ {Number(selectedDoctor?.consultation_price || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-bold uppercase">Pagamento</p>
                          <p className="text-sm font-bold text-foreground">PIX (Mercado Pago) ou PayPal (USD)</p>
                        </div>
                      </div>

                      {notes && (
                        <div>
                          <p className="text-xs text-muted-foreground font-bold uppercase">Observações</p>
                          <p className="text-sm text-foreground">{notes}</p>
                        </div>
                      )}

                      <div className="border-t border-border pt-4">
                        <p className="text-[10px] text-muted-foreground">
                          ⚖️ Conforme CFM 2.314/2022 Art. 12, o paciente pode cancelar com até 24h de antecedência sem custo. 
                          Dados protegidos pela LGPD (Lei 13.709/2018).
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl">← Voltar</Button>
                    <Button onClick={handleBook} disabled={loading} className="rounded-xl flex-1">
                      {loading ? <><Loader2 className="animate-spin mr-2" size={14} /> Agendando...</> : "✅ Confirmar Agendamento"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Success */}
              {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-8 text-center">
                      <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
                      <h2 className="text-2xl font-display font-black text-foreground mb-2">Orientação Técnica Agendada!</h2>
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
