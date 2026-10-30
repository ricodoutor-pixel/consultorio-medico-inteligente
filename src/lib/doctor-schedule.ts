import { supabase } from "@/integrations/supabase/client";
import { professionals, type Professional } from "@/data/professionals";
import { format, addDays } from "date-fns";

export interface AvailableSlot {
  timeSlot: string;
  slotDatetime: string;
  isAvailable: boolean;
  shift: "manha" | "tarde" | "noite";
}

export interface AvailableDayInfo {
  date: string; // YYYY-MM-DD
  hasAvailableSlots: boolean;
  slotsCount: number;
}

// Regras semanais embutidas dos médicos da vitrine (fallback soberano offline/resiliência)
export const SPECIAL_DOCTOR_RULES: Record<string, {
  afternoonDays: number[]; // 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex
  afternoonSlots: string[];
  eveningRules: { day: number; slots: string[] }[];
  morningSlots: string[];
}> = {
  // Dr. Anderson Mikalauskas: 
  // Seg a Sex: 13:00 e 13:30 (tarde)
  // Segunda: 19:00 e 19:30 (noite)
  // Terça e Quinta: 20:30, 21:00, 21:30 (noite)
  // Manhã: NENHUM
  "med-anderson-mikalauskas": {
    afternoonDays: [1, 2, 3, 4, 5],
    afternoonSlots: ["13:00", "13:30"],
    eveningRules: [
      { day: 1, slots: ["19:00", "19:30"] },
      { day: 2, slots: ["20:30", "21:00", "21:30"] },
      { day: 4, slots: ["20:30", "21:00", "21:30"] },
    ],
    morningSlots: [],
  },
  "f803c35d-31dd-48b6-a7e8-282036ccb389": {
    afternoonDays: [1, 2, 3, 4, 5],
    afternoonSlots: ["13:00", "13:30"],
    eveningRules: [
      { day: 1, slots: ["19:00", "19:30"] },
      { day: 2, slots: ["20:30", "21:00", "21:30"] },
      { day: 4, slots: ["20:30", "21:00", "21:30"] },
    ],
    morningSlots: [],
  }
};

/**
 * Busca os slots de um médico calculando pela RPC ou pelas regras semanais
 */
export async function getDoctorAvailableSlots(
  doctorIdOrSlug: string,
  targetDate: Date,
  modality: string = "video"
): Promise<AvailableSlot[]> {
  const dateStr = format(targetDate, "yyyy-MM-dd");
  const pro = professionals.find(p => p.id === doctorIdOrSlug || p.dbId === doctorIdOrSlug);
  const targetId = pro?.dbId || pro?.id || doctorIdOrSlug;

  try {
    const { data, error } = await supabase.rpc("get_available_slots" as any, {
      p_doctor_id: targetId,
      p_date: dateStr,
      p_modality: modality,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return (data as any[]).map(s => ({
        timeSlot: s.time_slot,
        slotDatetime: s.slot_datetime,
        isAvailable: Boolean(s.is_available),
        shift: s.shift || (s.time_slot < "12:00" ? "manha" : s.time_slot < "18:00" ? "tarde" : "noite")
      }));
    }
  } catch (err) {
    console.warn("[doctor-schedule] RPC indisponível, usando fallback de regras semanais:", err);
  }

  // Fallback baseado em regras semanais soberanas do médico
  const dow = targetDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const special = SPECIAL_DOCTOR_RULES[doctorIdOrSlug] || (pro?.id ? SPECIAL_DOCTOR_RULES[pro.id] : null);

  const now = new Date();
  const isToday = format(now, "yyyy-MM-dd") === dateStr;
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + 120; // 2 horas de antecedência mínima

  let candidateSlots: string[] = [];

  if (special) {
    // 1. Tarde
    if (special.afternoonDays.includes(dow)) {
      candidateSlots.push(...special.afternoonSlots);
    }
    // 2. Noite
    const evening = special.eveningRules.find(e => e.day === dow);
    if (evening) {
      candidateSlots.push(...evening.slots);
    }
    // 3. Manhã
    if (special.morningSlots.length > 0 && dow >= 1 && dow <= 5) {
      candidateSlots.push(...special.morningSlots);
    }
  } else {
    // Regra padrão de outros médicos (Seg a Sex: 09:00 - 11:30 e 14:00 - 17:30)
    if (dow >= 1 && dow <= 5) {
      candidateSlots = ["09:00", "09:30", "10:30", "11:00", "14:00", "14:30", "15:30", "16:00", "17:00"];
    } else if (dow === 6) {
      candidateSlots = ["09:00", "10:00", "11:00"];
    }
  }

  // Filtra horários passados ou com menos de 2h de antecedência se for hoje
  const filtered = candidateSlots.filter(time => {
    if (!isToday) return true;
    const [h, m] = time.split(":").map(Number);
    const slotMins = h * 60 + m;
    return slotMins >= currentMinutes;
  });

  return filtered.sort().map(time => ({
    timeSlot: time,
    slotDatetime: `${dateStr}T${time}:00-03:00`,
    isAvailable: true,
    shift: time < "12:00" ? "manha" : time < "18:00" ? "tarde" : "noite"
  }));
}

/**
 * Retorna os dias do mês que possuem pelo menos 1 horário livre
 */
export async function getDoctorAvailableDays(
  doctorIdOrSlug: string,
  targetMonthStr: string, // YYYY-MM
  modality: string = "video"
): Promise<AvailableDayInfo[]> {
  const pro = professionals.find(p => p.id === doctorIdOrSlug || p.dbId === doctorIdOrSlug);
  const targetId = pro?.dbId || pro?.id || doctorIdOrSlug;

  try {
    const { data, error } = await supabase.rpc("get_available_days" as any, {
      p_doctor_id: targetId,
      p_month: targetMonthStr,
      p_modality: modality,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return (data as any[]).map(d => ({
        date: d.day_date,
        hasAvailableSlots: Boolean(d.has_available_slots),
        slotsCount: Number(d.slots_count || 0)
      }));
    }
  } catch (err) {
    console.warn("[doctor-schedule] RPC get_available_days indisponível, usando fallback:", err);
  }

  // Fallback: calcula para cada dia do mês
  const result: AvailableDayInfo[] = [];
  const [year, month] = targetMonthStr.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const todayStr = format(new Date(), "yyyy-MM-dd");

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dStr = format(d, "yyyy-MM-dd");
    if (dStr < todayStr) continue;

    const slots = await getDoctorAvailableSlots(doctorIdOrSlug, d, modality);
    if (slots.length > 0) {
      result.push({
        date: dStr,
        hasAvailableSlots: true,
        slotsCount: slots.length
      });
    }
  }

  return result;
}

/**
 * Cria ou atualiza hold temporário de 10 minutos para garantir que dois pacientes não colidam
 */
export async function createTemporarySlotHold(
  doctorId: string,
  dateStr: string,
  timeSlot: string,
  userId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const reservedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    // Tenta atualizar/inserir em doctor_availability
    const { error } = await supabase
      .from("doctor_availability")
      .upsert({
        doctor_id: doctorId,
        slot_date: dateStr,
        time_slot: timeSlot,
        status: "reserved",
        reserved_by: userId || "guest_patient",
        reserved_until: reservedUntil,
      }, { onConflict: "doctor_id,slot_date,time_slot" });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Gera arquivo de calendário .ics para download direto do paciente
 */
export function generateIcsCalendar(params: {
  title: string;
  description: string;
  locationUrl: string;
  startDate: Date;
  durationMinutes?: number;
}): string {
  const { title, description, locationUrl, startDate, durationMinutes = 30 } = params;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const formatIcsDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Planta y Raiz//Telemedicina Canabinoide//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:pyr-${Date.now()}@plantayraiz.com.br`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `URL;VALUE=URI:${locationUrl}`,
    `LOCATION:${locationUrl}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: Sua consulta na Planta y Raíz começa em 15 minutos!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return icsContent;
}

export function downloadIcsFile(icsData: string, filename: string = "consulta-plantayraiz.ics") {
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
