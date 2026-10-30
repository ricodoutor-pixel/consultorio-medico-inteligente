import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";
import {
  Calendar as CalIcon,
  Clock,
  Video,
  MessageSquare,
  Sparkles,
  FileText,
  Star,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
  CalendarCheck,
  ShieldCheck,
  Search,
  ExternalLink,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { professionals, type Professional } from "@/data/professionals";
import {
  getDoctorAvailableSlots,
  getDoctorAvailableDays,
  createTemporarySlotHold,
  generateIcsCalendar,
  downloadIcsFile,
  type AvailableSlot,
  type AvailableDayInfo
} from "@/lib/doctor-schedule";

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export interface ModalityOption {
  id: string;
  label: string;
  price: number;
  icon: any;
  badge?: string;
  desc: string;
}

const HOLD_DURATION_SECONDS = 10 * 60; // 10 minutos

const Agendamento = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const proParam = searchParams.get("pro") || "";
  const slotParam = searchParams.get("slot") || "";

  // Passo ativo: 1 = Modalidade, 2 = Data, 3 = Horário, 4 = Confirmação, 5 = Sucesso
  const [step, setStep] = useState<number>(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Professional | null>(null);
  const [searchDoctorQuery, setSearchDoctorQuery] = useState("");

  // Dados do agendamento
  const [selectedModality, setSelectedModality] = useState<string>("video");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSlotObj, setSelectedSlotObj] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState<string>("");

  // Disponibilidade e Slots
  const [availableDays, setAvailableDays] = useState<AvailableDayInfo[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Hold temporário de 10 min
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(HOLD_DURATION_SECONDS);
  const [isHoldActive, setIsHoldActive] = useState<boolean>(false);

  // Autenticação e Booking
  const [userId, setUserId] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);

  // Inicializa sessão e médico selecionado via URL
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id || null));
  }, []);

  useEffect(() => {
    if (proParam) {
      const found = professionals.find(p => p.id === proParam || p.dbId === proParam || p.crm?.includes(proParam));
      if (found) {
        setSelectedDoctor(found);
        setStep(1); // Abre diretamente no Passo 1 (Modalidade)
      }
    } else {
      // Se não veio ?pro=, seleciona o Dr. Anderson por padrão ou abre a vitrine
      const defaultDoc = professionals.find(p => p.id === "med-anderson-mikalauskas") || professionals[0];
      setSelectedDoctor(defaultDoc);
    }
  }, [proParam]);

  // Modalidades disponíveis para o médico selecionado
  const modalities: ModalityOption[] = useMemo(() => {
    const basePrice = selectedDoctor?.priceValue || 150;
    const premiumPrice = selectedDoctor?.premiumPrice || 180;

    return [
      {
        id: "video",
        label: "Teleconsulta Médica por Vídeo HD",
        price: basePrice,
        icon: Video,
        badge: "Mais Escolhida",
        desc: "Consulta ao vivo em sala criptografada com emissão de receita oficial digital ANVISA/CFM com QR Code."
      },
      {
        id: "chat",
        label: "Consulta Médica por Chat Clínico",
        price: 100,
        icon: MessageSquare,
        desc: "Atendimento ágil por chat seguro na plataforma com avaliação de anamnese e receita oficial digital."
      },
      {
        id: "premium",
        label: "Consulta Premium (Vídeo + Chat Integrado)",
        price: premiumPrice,
        icon: Sparkles,
        badge: "Completo",
        desc: "Experiência completa com vídeo HD, chat prioritário e envio de exames em tempo real."
      },
      {
        id: "renovacao",
        label: "Renovação / Adequação de Receita",
        price: 90,
        icon: FileText,
        desc: "Ajuste posológico ou reemissão de receita digital para pacientes em acompanhamento."
      }
    ];
  }, [selectedDoctor]);

  const currentModalityObj = useMemo(() => {
    return modalities.find(m => m.id === selectedModality) || modalities[0];
  }, [modalities, selectedModality]);

  // Carrega dias disponíveis quando o médico ou modalidade muda
  useEffect(() => {
    if (!selectedDoctor) return;
    const loadDays = async () => {
      setLoadingDays(true);
      const currentMonthStr = format(new Date(), "yyyy-MM");
      const nextMonthStr = format(addDays(new Date(), 30), "yyyy-MM");
      
      const [days1, days2] = await Promise.all([
        getDoctorAvailableDays(selectedDoctor.id, currentMonthStr, selectedModality),
        getDoctorAvailableDays(selectedDoctor.id, nextMonthStr, selectedModality)
      ]);

      const combined = [...days1, ...days2.filter(d => !days1.some(x => x.date === d.date))];
      setAvailableDays(combined);
      setLoadingDays(false);
    };

    loadDays();
  }, [selectedDoctor, selectedModality]);

  // Set com datas disponíveis para desabilitar dias sem horários no calendário
  const availableDatesSet = useMemo(() => {
    return new Set(availableDays.filter(d => d.hasAvailableSlots).map(d => d.date));
  }, [availableDays]);

  // Próximo dia com horário livre como atalho
  const nextAvailableDay = useMemo(() => {
    const sorted = availableDays.filter(d => d.hasAvailableSlots).sort((a, b) => a.date.localeCompare(b.date));
    return sorted[0] || null;
  }, [availableDays]);

  // Carrega slots do dia selecionado
  const loadSlotsForDate = useCallback(async (date: Date) => {
    if (!selectedDoctor) return;
    setLoadingSlots(true);
    const daySlots = await getDoctorAvailableSlots(selectedDoctor.id, date, selectedModality);
    setSlots(daySlots);
    setLoadingSlots(false);
  }, [selectedDoctor, selectedModality]);

  // Atualiza slots ao selecionar data
  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime("");
    setSelectedSlotObj(null);
    setIsHoldActive(false);
    if (date) {
      loadSlotsForDate(date);
      setStep(3); // Avança para o Passo 3 (Horário)
    }
  };

  // Temporizador do Hold de 10 min
  useEffect(() => {
    let timer: any;
    if (isHoldActive && holdSecondsLeft > 0) {
      timer = setInterval(() => {
        setHoldSecondsLeft(prev => {
          if (prev <= 1) {
            setIsHoldActive(false);
            toast({
              title: "Tempo de reserva expirado",
              description: "O horário foi liberado para outros pacientes. Selecione novamente se desejar.",
              variant: "destructive"
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isHoldActive, holdSecondsLeft, toast]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Seleciona um horário e aciona o hold de 10 min
  const handleSelectSlot = async (slot: AvailableSlot) => {
    if (!selectedDoctor || !selectedDate) return;
    setSelectedTime(slot.timeSlot);
    setSelectedSlotObj(slot);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const docId = selectedDoctor.dbId || selectedDoctor.id;

    // Cria hold no banco
    await createTemporarySlotHold(docId, dateStr, slot.timeSlot, userId);

    setHoldSecondsLeft(HOLD_DURATION_SECONDS);
    setIsHoldActive(true);

    toast({
      title: `🔒 Horário ${slot.timeSlot} reservado!`,
      description: `Reserva garantida por 10 minutos para você concluir a confirmação.`,
    });

    setStep(4); // Avança para o Passo 4 (Confirmação)
  };

  // Confirmação final e Checkout Mercado Pago
  const handleConfirmAndPay = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    setBookingLoading(true);
    try {
      const { data: freshSession } = await supabase.auth.getSession();
      const authUid = freshSession.session?.user?.id ?? userId;

      const scheduledAt = new Date(selectedDate);
      const [h, m] = selectedTime.split(":").map(Number);
      scheduledAt.setHours(h, m, 0, 0);

      const docId = selectedDoctor.dbId || selectedDoctor.id;
      const consultationPrice = currentModalityObj.price;

      // 1. Cria agendamento oficial
      const { data: newAppt, error: apptError } = await supabase
        .from("appointments")
        .insert({
          patient_id: authUid || "00000000-0000-0000-0000-000000000000",
          doctor_id: docId,
          scheduled_at: scheduledAt.toISOString(),
          type: selectedModality,
          notes: notes.trim() || "Consulta agendada diretamente pelo paciente.",
          amount: consultationPrice,
          duration_minutes: 30,
          status: "scheduled",
          payment_status: "pending",
        })
        .select("*")
        .single();

      if (apptError || !newAppt) {
        throw new Error(apptError?.message || "Não foi possível confirmar o agendamento.");
      }

      // 2. Se for consulta de vídeo, garante a criação da sala em video_rooms
      if (selectedModality === "video" || selectedModality === "premium") {
        const roomName = `plantayraiz-${newAppt.id.slice(0, 8)}-${selectedDoctor.id.slice(0, 8)}`;
        await supabase.from("video_rooms").insert({
          consultation_id: newAppt.id,
          doctor_id: docId,
          patient_id: authUid || "00000000-0000-0000-0000-000000000000",
          room_name: roomName,
          status: "scheduled"
        });
      }

      setCreatedAppointment(newAppt);

      // 3. Pixel tracking
      trackPixelEvent("Schedule", {
        content_name: "medical_consultation_booking",
        doctor_id: docId,
        doctor_name: selectedDoctor.name,
        consultation_type: selectedModality,
        value: consultationPrice,
      }, { leadScore: 40, funnelStage: "conversion", category: "appointment" });

      // 4. Cria preferência de pagamento Mercado Pago
      try {
        const { data: paymentData } = await supabase.functions.invoke("create-payment", {
          body: {
            appointmentId: newAppt.id,
            doctorName: selectedDoctor.name,
            patientEmail: freshSession.session?.user?.email || "paciente@plantayraiz.com.br",
            description: `${currentModalityObj.label} com ${selectedDoctor.name}`,
            amount: consultationPrice,
          },
        });

        if (paymentData?.init_point) {
          toast({
            title: "Redirecionando para o pagamento seguro...",
            description: "Você será direcionado ao Mercado Pago (PIX ou Cartão).",
          });
          window.location.href = paymentData.init_point;
          return;
        }
      } catch (payErr) {
        console.warn("[Agendamento] Pagamento online pendente, liberando tela de confirmação:", payErr);
      }

      setStep(5); // Sucesso
    } catch (err: any) {
      toast({
        title: "Erro ao agendar consulta",
        description: err.message || "Tente novamente ou fale com nosso acolhimento no WhatsApp.",
        variant: "destructive"
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Médicos disponíveis para troca no Passo de Seleção
  const filteredDoctors = useMemo(() => {
    return professionals.filter(p => {
      const isHumanDoctor = p.category === "Médicos Prescritores" || p.category === "Dentista Prescritor";
      if (!isHumanDoctor) return false;
      if (!searchDoctorQuery.trim()) return true;
      const q = searchDoctorQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.crm?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [searchDoctorQuery]);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 md:pt-32">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Header Fixo do Médico Selecionado */}
          {selectedDoctor && (
            <div className="mb-8 p-4 md:p-5 rounded-3xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0">
                  {selectedDoctor.imageUrl ? (
                    <img
                      src={selectedDoctor.imageUrl}
                      alt={selectedDoctor.name}
                      className="w-full h-full rounded-2xl object-cover object-top border-2 border-primary/20 shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                      {selectedDoctor.avatar}
                    </div>
                  )}
                  {selectedDoctor.online && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-card" title="Online agora" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display font-black text-base md:text-lg text-foreground">
                      {selectedDoctor.name}
                    </h1>
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 font-bold">
                      {selectedDoctor.crm}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    {selectedDoctor.tags?.[0] || selectedDoctor.category}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-primary">
                      <Star size={12} className="fill-primary" />
                      <span className="text-xs font-black">{selectedDoctor.rating || 5.0}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">• Atendimento Soberano</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(0)}
                  className="text-xs text-muted-foreground hover:text-foreground font-bold rounded-xl"
                >
                  Trocar médico
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-xs font-bold rounded-xl"
                >
                  <Link to={`/profissionais/${selectedDoctor.id}`}>Ver Perfil Completo</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Stepper Superior (1 a 4) */}
          {step >= 1 && step <= 4 && (
            <div className="flex items-center justify-between mb-8 px-2 max-w-xl mx-auto">
              {[
                { num: 1, label: "Modalidade" },
                { num: 2, label: "Data" },
                { num: 3, label: "Horário" },
                { num: 4, label: "Confirmação" }
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center gap-2">
                  <button
                    onClick={() => s.num < step && setStep(s.num)}
                    disabled={s.num > step}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
                      step === s.num
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-4 ring-primary/20"
                        : step > s.num
                        ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                        : "bg-muted text-muted-foreground opacity-60"
                    )}
                  >
                    {step > s.num ? <CheckCircle2 size={16} /> : s.num}
                  </button>
                  <span className={cn(
                    "text-xs font-bold hidden sm:inline",
                    step >= s.num ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {s.label}
                  </span>
                  {idx < 3 && <ChevronRight size={14} className="text-muted-foreground/40 mx-1 hidden sm:inline" />}
                </div>
              ))}
            </div>
          )}

          {/* Banner de Hold Ativo (quando o horário está reservado por 10 min) */}
          {isHoldActive && step === 4 && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <Lock className="text-amber-500 w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Horário reservado exclusivamente para você</p>
                  <p className="text-[11px] text-muted-foreground">Conclua o agendamento antes que a vaga seja liberada.</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-sm px-3 py-1 font-black border-amber-500/40">
                ⏱️ {formatTimer(holdSecondsLeft)}
              </Badge>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Passo 0: Trocar / Escolher Médico */}
            {step === 0 && (
              <motion.div key="step0" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-display font-black text-foreground">
                    Escolha o Médico Especialista
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecione o profissional com quem deseja agendar sua consulta soberana.
                  </p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    value={searchDoctorQuery}
                    onChange={(e) => setSearchDoctorQuery(e.target.value)}
                    placeholder="Buscar por nome do médico ou CRM..."
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDoctors.map(doc => (
                    <Card
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setStep(1);
                      }}
                      className={cn(
                        "cursor-pointer border-border hover:border-primary/50 hover:bg-card/80 transition-all group",
                        selectedDoctor?.id === doc.id && "border-primary bg-primary/5 ring-2 ring-primary/20"
                      )}
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 overflow-hidden flex-shrink-0">
                            {doc.imageUrl ? (
                              <img src={doc.imageUrl} alt={doc.name} className="w-full h-full object-cover object-top" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-primary">{doc.avatar}</div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.crm}</p>
                            <p className="text-[11px] text-primary font-bold mt-0.5">{doc.tags?.[0] || doc.category}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black text-foreground">{doc.price}</p>
                          <span className="text-[10px] text-primary font-bold">Selecionar →</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Passo 1: Escolha da Modalidade & Serviço */}
            {step === 1 && (
              <motion.div key="step1" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-display font-black text-foreground">
                    1. Escolha a Modalidade de Atendimento
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecione como prefere realizar a consulta médica com {selectedDoctor?.name}.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {modalities.map(mod => {
                    const Icon = mod.icon;
                    const isSelected = selectedModality === mod.id;

                    return (
                      <Card
                        key={mod.id}
                        onClick={() => setSelectedModality(mod.id)}
                        className={cn(
                          "cursor-pointer border-border hover:border-primary/40 transition-all p-5 rounded-3xl relative",
                          isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md" : "bg-card"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                          )}>
                            <Icon size={24} />
                          </div>
                          {mod.badge && (
                            <Badge className="bg-primary text-primary-foreground font-black text-[10px]">
                              {mod.badge}
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-display font-black text-base text-foreground mb-1">
                          {mod.label}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                          {mod.desc}
                        </p>

                        <div className="flex items-baseline justify-between pt-3 border-t border-border/60">
                          <span className="text-xs font-bold text-muted-foreground">Valor da consulta</span>
                          <span className="text-xl font-display font-black text-primary">
                            R$ {mod.price.toFixed(2)}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    size="lg"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto font-black rounded-2xl gap-2 px-8 shadow-md shadow-primary/20"
                  >
                    Avançar para Escolha de Data <ChevronRight size={16} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Passo 2: Escolha da Data */}
            {step === 2 && (
              <motion.div key="step2" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-display font-black text-foreground flex items-center gap-2">
                    <CalIcon size={22} className="text-primary" /> 2. Escolha o Dia da Consulta
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Apenas os dias com horários livres configurados na agenda do médico estão habilitados.
                  </p>
                </div>

                {/* Card de Atalho para o Próximo Horário Livre */}
                {nextAvailableDay && (
                  <Card className="border-primary/30 bg-primary/5 rounded-2xl">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-primary">⚡ Vaga Mais Próxima</span>
                        <p className="text-sm font-black text-foreground mt-0.5">
                          Próximo dia disponível: {format(new Date(nextAvailableDay.date + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSelectDate(new Date(nextAvailableDay.date + "T12:00:00"))}
                        className="rounded-xl font-black text-xs h-9"
                      >
                        Selecionar este dia
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-border rounded-3xl overflow-hidden shadow-sm">
                  <CardContent className="p-6 flex flex-col items-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleSelectDate}
                      locale={ptBR}
                      disabled={(date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const todayStr = format(new Date(), "yyyy-MM-dd");
                        // Desabilita dias passados ou sem slots na regra do médico
                        if (dateStr < todayStr) return true;
                        if (availableDatesSet.size > 0 && !availableDatesSet.has(dateStr)) return true;
                        return false;
                      }}
                      className="p-3 pointer-events-auto rounded-2xl max-w-sm"
                    />

                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-primary" /> Dia com horário livre
                      </span>
                      <span className="flex items-center gap-1.5 opacity-50">
                        <span className="w-3 h-3 rounded-full bg-muted border border-border" /> Sem atendimento / Folga
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-2xl gap-2 font-bold">
                    <ArrowLeft size={16} /> Voltar
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Passo 3: Escolha do Horário (Agrupado Manhã / Tarde / Noite) */}
            {step === 3 && (
              <motion.div key="step3" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-black text-foreground flex items-center gap-2">
                      <Clock size={22} className="text-primary" /> 3. Escolha o Horário
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit text-xs font-bold text-muted-foreground border-border bg-card">
                    ⏰ Horário Oficial de Brasília (UTC-3)
                  </Badge>
                </div>

                {loadingSlots ? (
                  <div className="py-16 text-center">
                    <Loader2 className="animate-spin text-primary w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Carregando horários da agenda do médico...</p>
                  </div>
                ) : slots.length === 0 ? (
                  <Card className="border-border rounded-3xl p-8 text-center">
                    <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-base font-bold text-foreground">Nenhum horário disponível para esta data</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      O Dr(a). {selectedDoctor?.name} não possui vagas livres neste dia. Por favor, selecione outra data no calendário.
                    </p>
                    <Button variant="outline" onClick={() => setStep(2)} className="mt-4 rounded-2xl font-bold">
                      Escolher outro dia
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Turno: Tarde */}
                    {slots.some(s => s.shift === "tarde") && (
                      <div>
                        <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-3 flex items-center gap-2">
                          🌤️ Turno da Tarde
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {slots.filter(s => s.shift === "tarde").map(slot => (
                            <Button
                              key={slot.timeSlot}
                              variant={selectedTime === slot.timeSlot ? "default" : "outline"}
                              onClick={() => handleSelectSlot(slot)}
                              className={cn(
                                "h-12 rounded-2xl font-mono text-sm font-black border transition-all",
                                selectedTime === slot.timeSlot
                                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 border-primary"
                                  : "border-border hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              {slot.timeSlot}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Turno: Noite */}
                    {slots.some(s => s.shift === "noite") && (
                      <div>
                        <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-3 flex items-center gap-2">
                          🌙 Turno da Noite
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {slots.filter(s => s.shift === "noite").map(slot => (
                            <Button
                              key={slot.timeSlot}
                              variant={selectedTime === slot.timeSlot ? "default" : "outline"}
                              onClick={() => handleSelectSlot(slot)}
                              className={cn(
                                "h-12 rounded-2xl font-mono text-sm font-black border transition-all",
                                selectedTime === slot.timeSlot
                                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 border-primary"
                                  : "border-border hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              {slot.timeSlot}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Turno: Manhã (se médico atender de manhã) */}
                    {slots.some(s => s.shift === "manha") && (
                      <div>
                        <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-3 flex items-center gap-2">
                          ☀️ Turno da Manhã
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {slots.filter(s => s.shift === "manha").map(slot => (
                            <Button
                              key={slot.timeSlot}
                              variant={selectedTime === slot.timeSlot ? "default" : "outline"}
                              onClick={() => handleSelectSlot(slot)}
                              className={cn(
                                "h-12 rounded-2xl font-mono text-sm font-black border transition-all",
                                selectedTime === slot.timeSlot
                                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 border-primary"
                                  : "border-border hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              {slot.timeSlot}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Campo de Observações Clínicas */}
                    <div className="pt-2">
                      <label className="text-xs font-bold text-foreground block mb-2">
                        Motivo da consulta ou observações clínicas (opcional):
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Tratamento de dor crônica, insônia ou adequação de dosagem..."
                        className="w-full h-24 p-3 rounded-2xl bg-card border border-border text-xs md:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="rounded-2xl gap-2 font-bold">
                    <ArrowLeft size={16} /> Voltar para Datas
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Passo 4: Confirmação e Pagamento Seguro */}
            {step === 4 && (
              <motion.div key="step4" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-display font-black text-foreground flex items-center gap-2">
                    <CheckCircle2 size={24} className="text-primary" /> 4. Confirme seu Agendamento
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Revise os dados da sua consulta com {selectedDoctor?.name}.
                  </p>
                </div>

                <Card className="border-border rounded-3xl bg-card shadow-sm overflow-hidden">
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground">Médico Prescritor</span>
                        <p className="text-base font-black text-foreground mt-1">{selectedDoctor?.name}</p>
                        <p className="text-xs text-muted-foreground font-semibold">{selectedDoctor?.crm} • {selectedDoctor?.tags?.[0]}</p>
                      </div>

                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground">Modalidade de Atendimento</span>
                        <p className="text-base font-black text-primary mt-1">{currentModalityObj.label}</p>
                        <p className="text-xs text-muted-foreground font-medium">Ambiente seguro com emissão de receita oficial digital.</p>
                      </div>

                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground">Data e Horário</span>
                        <p className="text-base font-black text-foreground mt-1">
                          {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-primary font-bold">às {selectedTime} (Horário Oficial de Brasília)</p>
                      </div>

                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground">Valor Total da Consulta</span>
                        <p className="text-2xl font-display font-black text-primary mt-1">
                          R$ {currentModalityObj.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Pagamento via PIX instantâneo ou Cartão de Crédito.</p>
                      </div>
                    </div>

                    {notes && (
                      <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-xs">
                        <span className="font-bold text-foreground">Suas observações:</span>
                        <p className="text-muted-foreground mt-1">{notes}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border flex items-start gap-3 text-xs text-muted-foreground">
                      <ShieldCheck className="text-primary w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong>Garantia & Reagendamento:</strong> Conforme resolução CFM 2.314/2022, você pode cancelar ou remarcar sua consulta gratuitamente com até 24 horas de antecedência.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="w-full sm:w-auto rounded-2xl font-bold">
                    <ArrowLeft size={16} className="mr-1" /> Alterar Horário
                  </Button>

                  <Button
                    size="lg"
                    disabled={bookingLoading}
                    onClick={handleConfirmAndPay}
                    className="w-full sm:w-auto font-black rounded-2xl gap-2 px-8 shadow-lg shadow-primary/25 h-12 text-sm md:text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-1" /> Processando Agendamento...
                      </>
                    ) : (
                      <>
                        Confirmar e Pagar Consulta (R$ {currentModalityObj.price.toFixed(2)}) <ChevronRight size={18} />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Passo 5: Sucesso / Pós-Agendamento */}
            {step === 5 && (
              <motion.div key="step5" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-6">
                <Card className="border-primary/40 bg-primary/5 rounded-3xl overflow-hidden shadow-lg">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-md shadow-primary/30">
                      <CalendarCheck size={32} />
                    </div>

                    <h2 className="text-2xl md:text-3xl font-display font-black text-foreground">
                      Consulta Agendada com Sucesso!
                    </h2>

                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Seu agendamento com o <strong className="text-foreground">{selectedDoctor?.name}</strong> foi registrado para{" "}
                      <strong className="text-foreground">
                        {selectedDate && format(selectedDate, "dd/MM/yyyy")} às {selectedTime}
                      </strong>.
                    </p>

                    <div className="p-4 rounded-2xl bg-card border border-border max-w-md mx-auto text-left space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-bold">Profissional:</span>
                        <span className="font-bold text-foreground">{selectedDoctor?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-bold">Modalidade:</span>
                        <span className="font-bold text-primary">{currentModalityObj.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-bold">Horário:</span>
                        <span className="font-mono font-bold text-foreground">{selectedTime} (Brasília)</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                      {selectedDate && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            const [h, m] = selectedTime.split(":").map(Number);
                            const startDt = new Date(selectedDate);
                            startDt.setHours(h, m, 0, 0);

                            const ics = generateIcsCalendar({
                              title: `Consulta Médica: ${selectedDoctor?.name} — Planta y Raíz`,
                              description: `Teleconsulta com ${selectedDoctor?.name} (${selectedDoctor?.crm}). Modalidade: ${currentModalityObj.label}. Acesse pelo seu Consultório Planta y Raíz.`,
                              locationUrl: "https://plantayraiz.com.br/consultorio",
                              startDate: startDt,
                              durationMinutes: 30,
                            });
                            downloadIcsFile(ics, `consulta-${selectedDoctor?.id}.ics`);
                            toast({
                              title: "Calendário baixado!",
                              description: "Adicione o compromisso ao seu Google Calendar ou Apple Calendar.",
                            });
                          }}
                          className="rounded-2xl gap-2 font-bold w-full sm:w-auto"
                        >
                          <Download size={16} /> Adicionar ao Calendário (.ics)
                        </Button>
                      )}

                      <Button
                        asChild
                        className="rounded-2xl font-black gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                      >
                        <Link to="/consultorio">
                          Acessar Consultório Virtual <ExternalLink size={16} />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Agendamento;
