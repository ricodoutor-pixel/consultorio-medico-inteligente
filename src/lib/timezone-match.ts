// Helper: converte um instante ISO para o horário local do paciente E do médico,
// usando fusos IANA obtidos via edge function maps-timezone (com cache localStorage).
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "pyr_tz_cache_v1";

type Cache = Record<string, { tz: string; ts: number }>;

function readCache(): Cache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeCache(c: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    // ignore
  }
}

export async function getTimeZoneFor(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cache = readCache();
  const cached = cache[key];
  const DAY = 24 * 60 * 60 * 1000;
  if (cached && Date.now() - cached.ts < 30 * DAY) return cached.tz;

  try {
    const { data, error } = await supabase.functions.invoke("maps-timezone", {
      body: { latitude: lat, longitude: lng },
    });
    if (error || !data?.timeZoneId) throw error ?? new Error("no tz");
    cache[key] = { tz: data.timeZoneId, ts: Date.now() };
    writeCache(cache);
    return data.timeZoneId;
  } catch {
    // Fallback: fuso do próprio browser
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

export function formatInTz(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: tz,
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString("pt-BR");
  }
}

export async function formatConsultationTime(
  iso: string,
  patient?: { latitude?: number | null; longitude?: number | null },
  doctor?: { latitude?: number | null; longitude?: number | null },
): Promise<{ patientTime: string; doctorTime: string; patientTz: string; doctorTz: string }> {
  const patientTz =
    patient?.latitude && patient?.longitude
      ? await getTimeZoneFor(Number(patient.latitude), Number(patient.longitude))
      : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const doctorTz =
    doctor?.latitude && doctor?.longitude
      ? await getTimeZoneFor(Number(doctor.latitude), Number(doctor.longitude))
      : patientTz;
  return {
    patientTz,
    doctorTz,
    patientTime: formatInTz(iso, patientTz),
    doctorTime: formatInTz(iso, doctorTz),
  };
}
