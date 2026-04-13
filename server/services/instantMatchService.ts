/**
 * Estratégia 1: Uber da Receita - Matching Instantâneo Médico-Paciente
 * Reduz tempo entre "Quero tratar" → "Receita na mão" para < 10 minutos
 */

interface PatientContext {
  id: string;
  medicalHistory: string[];
  lastConsultation?: Date;
  location?: { lat: number; lng: number };
  urgency: 'low' | 'medium' | 'high';
  specialty?: string;
}

interface DoctorAvailability {
  id: string;
  userId: string;
  specialty: string;
  currentLoad: number;
  location?: { lat: number; lng: number };
  rating: number;
  responseTime: number;
  isOnline: boolean;
  consultationPrice: number;
}

interface MatchResult {
  doctor: DoctorAvailability;
  score: number;
  estimatedWaitTime: number;
  matchReasons: string[];
}

function calculateDistance(
  loc1?: { lat: number; lng: number },
  loc2?: { lat: number; lng: number }
): number {
  if (!loc1 || !loc2) return 0;
  const R = 6371;
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function scoreDoctorMatch(
  patient: PatientContext,
  doctor: DoctorAvailability
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // Specialty match (40%)
  if (patient.specialty && doctor.specialty.toLowerCase().includes(patient.specialty.toLowerCase())) {
    score += 40;
    reasons.push('Especialidade compatível');
  } else {
    score += 10;
  }

  // Rating (30%)
  const ratingScore = (doctor.rating / 5) * 30;
  score += ratingScore;
  if (doctor.rating >= 4.5) reasons.push('Alta avaliação');

  // Online status (20%)
  if (doctor.isOnline) {
    score += 20;
    reasons.push('Online agora');
  }

  // Low load (10%)
  const loadScore = Math.max(0, 10 - doctor.currentLoad * 2);
  score += loadScore;
  if (doctor.currentLoad < 3) reasons.push('Baixa carga');

  // Distance bonus
  if (patient.location && doctor.location) {
    const dist = calculateDistance(patient.location, doctor.location);
    if (dist < 50) {
      score += 5;
      reasons.push('Proximidade geográfica');
    }
  }

  // Urgency boost
  if (patient.urgency === 'high') score *= 1.2;

  const estimatedWaitTime = doctor.isOnline ? 0 : 15;

  return { doctor, score, estimatedWaitTime, matchReasons: reasons };
}

export function findBestDoctorMatch(
  patient: PatientContext,
  doctors: DoctorAvailability[]
): MatchResult | null {
  if (doctors.length === 0) return null;

  const scored = doctors
    .filter(d => d.isOnline)
    .map(d => scoreDoctorMatch(patient, d))
    .sort((a, b) => b.score - a.score);

  return scored[0] || null;
}

export function findTopMatches(
  patient: PatientContext,
  doctors: DoctorAvailability[],
  limit = 5
): MatchResult[] {
  return doctors
    .map(d => scoreDoctorMatch(patient, d))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
