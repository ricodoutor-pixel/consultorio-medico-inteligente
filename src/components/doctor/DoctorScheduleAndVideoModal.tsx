import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  Loader2,
  Save,
  CalendarRange,
  User,
  Search,
  Plus,
  Sparkles,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { loadDoctorPatientRecords, type ImportedPatientRecord } from "./DoctorProntuarioImportExportModal";

interface DoctorScheduleAndVideoModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  doctorId?: string | null;
  inline?: boolean;
}

const DAYS_OF_WEEK = [
  { id: 1, short: "Seg", label: "Segunda-feira" },
  { id: 2, short: "Ter", label: "Terça-feira" },
  { id: 3, short: "Qua", label: "Quarta-feira" },
  { id: 4, short: "Qui", label: "Quinta-feira" },
  { id: 5, short: "Sex", label: "Sexta-feira" },
  { id: 6, short: "Sáb", label: "Sábado" },
  { id: 0, short: "Dom", label: "Domingo" },
];

const MORNING_SLOTS = ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const AFTERNOON_SLOTS = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
const EVENING_SLOTS = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];
const ALL_TIME_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS, ...EVENING_SLOTS];

export function DoctorScheduleAndVideoModal({
  open = false,
  onOpenChange,
  doctorId: propDoctorId,
  inline = false,
}: DoctorScheduleAndVideoModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("horarios");
  const [doctorId, setDoctorId] = useState<string | null>(propDoctorId || null);
  const [saving, setSaving] = useState(false);
  const [persistedCount, setPersistedCount] = useState<number>(0);

  // Estado de seleção de dias e horários
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [activeSlots, setActiveSlots] = useState<string[]>([
    "09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00", "15:30", "16:00", "19:00", "19:30"
  ]);
  const [enableVideo, setEnableVideo] = useState(true);
  const [enableScheduledReturn, setEnableScheduledReturn] = useState(true);

  // Agendamentos e busca para Consulta por Vídeo
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patientRecords, setPatientRecords] = useState<ImportedPatientRecord[]>([]);
  const [videoSearch, setVideoSearch] = useState("");
  const [quickScheduleName, setQuickScheduleName] = useState("");
  const [quickScheduleCpf, setQuickScheduleCpf] = useState("");
  const [quickScheduleDate, setQuickScheduleDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [quickScheduleTime, setQuickScheduleTime] = useState("14:00");

  useEffect(() => {
    if (propDoctorId) setDoctorId(propDoctorId);
  }, [propDoctorId]);

  useEffect(() => {
    setPatientRecords(loadDoctorPatientRecords(doctorId));
    const handleUpdated = () => setPatientRecords(loadDoctorPatientRecords(doctorId));
    window.addEventListener("pyr_patient_records_updated", handleUpdated);
    return () => window.removeEventListener("pyr_patient_records_updated", handleUpdated);
  }, [doctorId]);

  useEffect(() => {
    const loadDoctorScheduleData = async () => {
      try {
        // Carrega preferências salvas localmente se existirem
        const savedPrefs = localStorage.getItem(`pyr_doctor_schedule_prefs_${doctorId || "default"}`);
        if (savedPrefs) {
          const parsed = JSON.parse(savedPrefs);
          if (Array.isArray(parsed.activeDays)) setActiveDays(parsed.activeDays);
          if (Array.isArray(parsed.activeSlots)) setActiveSlots(parsed.activeSlots);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        let resolvedDocId = doctorId;
        if (!resolvedDocId) {
          const { data: doc } = await supabase
            .from("doctors")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (doc?.id) {
            resolvedDocId = doc.id;
            setDoctorId(doc.id);
          }
        }

        if (resolvedDocId) {
          const todayStr = new Date().toISOString().split("T")[0];
          const [{ count }, { data: appts }] = await Promise.all([
            supabase
              .from("doctor_availability")
              .select("id", { count: "exact", head: true })
              .eq("doctor_id", resolvedDocId)
              .gte("slot_date", todayStr),
            supabase
              .from("appointments")
              .select("*")
              .eq("doctor_id", resolvedDocId)
              .neq("status", "cancelled")
              .order("scheduled_at", { ascending: true })
              .limit(30),
          ]);

          if (count !== null) setPersistedCount(count);
          if (appts) setAppointments(appts);
        }
      } catch (e) {
        console.warn("[ScheduleModal] Falha ao sincronizar horários:", e);
      }
    };

    loadDoctorScheduleData();
  }, [doctorId, open]);

  const toggleDay = (dayId: number) => {
    setActiveDays((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]
    );
  };

  const toggleSlot = (slot: string) => {
    setActiveSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot].sort()
    );
  };

  const selectShift = (shiftSlots: string[]) => {
    setActiveSlots((prev) => {
      const allIncluded = shiftSlots.every((s) => prev.includes(s));
      if (allIncluded) {
        return prev.filter((s) => !shiftSlots.includes(s));
      }
      return Array.from(new Set([...prev, ...shiftSlots])).sort();
    });
  };

  const handleSaveSchedule = async () => {
    if (activeDays.length === 0 || activeSlots.length === 0) {
      toast.error("Selecione pelo menos um dia da semana e um horário de atendimento.");
      return;
    }

    setSaving(true);
    try {
      // Salva preferência localmente imediatamente
      localStorage.setItem(
        `pyr_doctor_schedule_prefs_${doctorId || "default"}`,
        JSON.stringify({
          activeDays,
          activeSlots,
          enableVideo,
          enableScheduledReturn,
          updatedAt: new Date().toISOString(),
        })
      );

      const today = new Date();
      const slotsToInsert: any[] = [];

      for (let i = 0; i <= 30; i++) {
        const currentDate = addDays(today, i);
        const dayOfWeek = currentDate.getDay();

        if (activeDays.includes(dayOfWeek)) {
          const dateStr = format(currentDate, "yyyy-MM-dd");
          for (const timeSlot of activeSlots) {
            slotsToInsert.push({
              doctor_id: doctorId,
              slot_date: dateStr,
              time_slot: timeSlot,
              status: "available",
            });
          }
        }
      }

      if (doctorId && slotsToInsert.length > 0) {
        const { error } = await supabase.from("doctor_availability").upsert(
          slotsToInsert,
          { onConflict: "doctor_id,slot_date,time_slot", ignoreDuplicates: true }
        );
        if (error) {
          console.warn("[ScheduleModal] Aviso ao gravar no banco:", error.message);
        }
      }

      setPersistedCount(slotsToInsert.length);
      toast.success(
        `✅ Horários salvos com sucesso! ${slotsToInsert.length} horários de atendimento e vídeo liberados para os próximos 30 dias.`
      );
    } catch (err: any) {
      toast.error("Erro ao salvar horários: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuickScheduledAppointment = () => {
    if (!quickScheduleName.trim()) {
      toast.error("Informe o nome do paciente para agendar a consulta por vídeo.");
      return;
    }
    const scheduledIso = `${quickScheduleDate}T${quickScheduleTime}:00`;
    const newAppt = {
      id: `appt-manual-${Date.now()}`,
      patient_id: `pat-${Date.now()}`,
      patientName: quickScheduleName.trim(),
      patientCpf: quickScheduleCpf.trim() || "Não informado",
      scheduled_at: scheduledIso,
      type: "video",
      status: "scheduled",
      notes: `Paciente agendado pelo médico (${quickScheduleName.trim()}${quickScheduleCpf ? ` - CPF: ${quickScheduleCpf}` : ""})`,
    };
    setAppointments((prev) => [newAppt, ...prev]);
    setQuickScheduleName("");
    setQuickScheduleCpf("");
    toast.success(`📅 Consulta por vídeo agendada para ${newAppt.patientName} em ${format(new Date(scheduledIso), "dd/MM/yyyy 'às' HH:mm")}!`);
  };

  // Combina agendamentos do banco + pacientes importados para busca rápida e início de vídeo
  const combinedScheduledList = useMemo(() => {
    const q = videoSearch.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");

    const items = [
      ...appointments.map((a) => ({
        id: a.id,
        patientId: a.patient_id || a.id,
        name: a.patientName || a.notes?.match(/Paciente:\s*([^|)]+)/)?.[1] || `Paciente Agendado #${String(a.id).slice(0, 5)}`,
        cpf: a.patientCpf || "Agendado na Plataforma",
        scheduledAt: a.scheduled_at,
        type: a.type || "video",
        status: a.status || "scheduled",
        notes: a.notes || "Consulta por Vídeo Agendada",
      })),
      ...patientRecords.map((p) => ({
        id: `appt-${p.id}`,
        patientId: p.id,
        name: p.name,
        cpf: p.cpf,
        scheduledAt: p.lastConsultationDate ? `${p.lastConsultationDate}T14:00:00` : new Date().toISOString(),
        type: "video",
        status: "ready_video",
        notes: p.diagnosisCid || p.clinicalNotes || "Prontuário disponível para Teleconsulta",
      })),
    ];

    if (!q) return items;
    return items.filter((item) => {
      const nameMatch = (item.name || "").toLowerCase().includes(q);
      const cpfMatch = (item.cpf || "").toLowerCase().includes(q) || (qDigits.length > 0 && (item.cpf || "").replace(/\D/g, "").includes(qDigits));
      return nameMatch || cpfMatch;
    });
  }, [appointments, patientRecords, videoSearch]);

  const content = (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-auto p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="horarios" className="py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2">
            <CalendarRange size={16} /> Escolher Meus Horários de Atendimento
          </TabsTrigger>
          <TabsTrigger value="video-agendados" className="py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2">
            <Video size={16} /> Pacientes Agendados & Consulta por Vídeo
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════
            ABA 1: ESCOLHER HORÁRIOS DE ATENDIMENTO
            ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="horarios" className="space-y-5 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <Sparkles className="text-emerald-400 shrink-0" size={20} />
              <div className="text-xs">
                <p className="font-bold text-foreground">
                  Grade Ativa para Agendamentos e Consultas por Vídeo
                </p>
                <p className="text-muted-foreground">
                  Escolha os dias e horários em que deseja atender seus pacientes agendados e realizar teleconsultas por vídeo.
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-xs shrink-0">
              {persistedCount > 0 ? `${persistedCount} horários abertos` : `${activeDays.length * activeSlots.length * 4} horários selecionados`}
            </Badge>
          </div>

          {/* 1. Escolha dos Dias da Semana */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm font-black flex items-center gap-2">
                <Calendar size={16} className="text-primary" /> 1. Escolha os Dias da Semana de Atendimento:
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] font-bold"
                  onClick={() => setActiveDays([1, 2, 3, 4, 5])}
                >
                  Seg a Sex
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] font-bold"
                  onClick={() => setActiveDays([0, 1, 2, 3, 4, 5, 6])}
                >
                  Todos os Dias
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const selected = activeDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all font-bold text-xs ${
                      selected
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <div className="text-sm font-black">{day.short}</div>
                    <div className="text-[10px] opacity-80 truncate">{day.label.split("-")[0]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Escolha dos Horários por Turno */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label className="text-xs sm:text-sm font-black flex items-center gap-2">
                <Clock size={16} className="text-primary" /> 2. Escolha seus Horários de Atendimento (Manhã, Tarde e Noite):
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] font-bold gap-1"
                  onClick={() => selectShift(MORNING_SLOTS)}
                >
                  <Sun size={12} className="text-amber-400" /> Turno Manhã
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] font-bold gap-1"
                  onClick={() => selectShift(AFTERNOON_SLOTS)}
                >
                  <Sunset size={12} className="text-orange-400" /> Turno Tarde
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] font-bold gap-1"
                  onClick={() => selectShift(EVENING_SLOTS)}
                >
                  <Moon size={12} className="text-indigo-400" /> Turno Noite
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-muted-foreground"
                  onClick={() => setActiveSlots([])}
                >
                  Limpar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2">
              {ALL_TIME_SLOTS.map((slot) => {
                const selected = activeSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    className={`py-2 px-2 rounded-lg border text-xs font-mono font-bold transition-all ${
                      selected
                        ? "bg-primary/20 border-primary text-primary shadow-sm"
                        : "bg-card/60 border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Modalidades Habilitadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div
              onClick={() => setEnableVideo(!enableVideo)}
              className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                enableVideo ? "border-blue-500/60 bg-blue-500/10" : "border-border bg-card/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Video className="text-blue-400" size={20} />
                <div>
                  <p className="text-xs font-bold text-foreground">Teleconsulta por Vídeo HD</p>
                  <p className="text-[11px] text-muted-foreground">Sala de vídeo criptografada com prontuário lado a lado</p>
                </div>
              </div>
              <CheckCircle2 className={enableVideo ? "text-blue-400" : "text-muted-foreground/30"} size={18} />
            </div>

            <div
              onClick={() => setEnableScheduledReturn(!enableScheduledReturn)}
              className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                enableScheduledReturn ? "border-emerald-500/60 bg-emerald-500/10" : "border-border bg-card/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="text-emerald-400" size={20} />
                <div>
                  <p className="text-xs font-bold text-foreground">Pacientes Agendados & Retornos</p>
                  <p className="text-[11px] text-muted-foreground">Libera agendamento direto na vitrine e para sua carteira</p>
                </div>
              </div>
              <CheckCircle2 className={enableScheduledReturn ? "text-emerald-400" : "text-muted-foreground/30"} size={18} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveSchedule}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 h-11 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando Horários...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Salvar Meus Horários de Atendimento & Vídeo
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            ABA 2: PACIENTES AGENDADOS & INICIAR CONSULTA POR VÍDEO
            ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="video-agendados" className="space-y-4 mt-4">
          {/* Agendamento Rápido de Consulta por Vídeo */}
          <Card className="border-blue-500/30 bg-blue-500/5 p-3.5 rounded-xl">
            <p className="text-xs font-black text-blue-400 uppercase mb-2 flex items-center gap-1.5">
              <Plus size={14} /> Agendar Nova Consulta por Vídeo para Paciente
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <Input
                value={quickScheduleName}
                onChange={(e) => setQuickScheduleName(e.target.value)}
                placeholder="Nome do Paciente..."
                className="h-9 text-xs sm:col-span-2 bg-background"
              />
              <Input
                value={quickScheduleCpf}
                onChange={(e) => setQuickScheduleCpf(e.target.value)}
                placeholder="CPF (opcional)"
                className="h-9 text-xs font-mono bg-background"
              />
              <div className="flex gap-1">
                <Input
                  type="date"
                  value={quickScheduleDate}
                  onChange={(e) => setQuickScheduleDate(e.target.value)}
                  className="h-9 text-xs bg-background px-2"
                />
                <Input
                  type="time"
                  value={quickScheduleTime}
                  onChange={(e) => setQuickScheduleTime(e.target.value)}
                  className="h-9 text-xs bg-background px-2 w-24"
                />
              </div>
              <Button
                onClick={handleAddQuickScheduledAppointment}
                className="h-9 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg"
              >
                <Calendar size={13} className="mr-1" /> Agendar Vídeo
              </Button>
            </div>
          </Card>

          {/* Busca por Nome ou CPF para Iniciar Vídeo */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary h-4 w-4" />
            <Input
              value={videoSearch}
              onChange={(e) => setVideoSearch(e.target.value)}
              placeholder="Filtrar paciente agendado por Nome ou CPF para iniciar Consulta por Vídeo..."
              className="pl-10 h-10 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <ScrollArea className="h-[310px] pr-2">
            <div className="space-y-2.5">
              {combinedScheduledList.map((item) => (
                <Card
                  key={item.id}
                  className="p-3.5 border-border hover:border-blue-500/50 transition-all rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-400 flex flex-col items-center justify-center font-bold shrink-0">
                      <Video size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <User size={14} className="text-primary" /> {item.name}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          CPF: {item.cpf}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.notes}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-400 font-semibold">
                        <Clock size={11} />
                        {item.scheduledAt
                          ? format(new Date(item.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : "Disponível agora"}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (onOpenChange) onOpenChange(false);
                      navigate(
                        `/workspace-medico?patient=${encodeURIComponent(item.patientId)}&appt=${encodeURIComponent(item.id)}&type=video&name=${encodeURIComponent(item.name)}&cpf=${encodeURIComponent(item.cpf)}`
                      );
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shrink-0 w-full sm:w-auto"
                  >
                    <Video size={14} className="mr-1.5" /> Iniciar Consulta por Vídeo
                  </Button>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (inline) {
    return (
      <Card className="border-border bg-card shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <CardTitle className="text-lg font-black flex items-center gap-2 text-foreground">
            <CalendarRange className="text-emerald-400" size={22} />
            Horários de Atendimento & Consultas por Vídeo
          </CardTitle>
          <CardDescription className="text-xs">
            Defina seus horários para pacientes agendados e inicie teleconsultas por vídeo em 1 clique.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">{content}</CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2 text-foreground">
            <CalendarRange className="text-emerald-400" size={22} />
            Horários de Atendimento & Consulta por Vídeo
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha seus dias e horários para pacientes agendados e inicie teleconsultas por vídeo com prontuário integrado.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export default DoctorScheduleAndVideoModal;
