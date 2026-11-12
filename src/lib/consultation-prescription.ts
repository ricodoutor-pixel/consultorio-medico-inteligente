/**
 * Receita da consulta: o médico escreve a posologia (um item por linha), a plataforma gera o PDF timbrado,
 * o médico assina no gov.br (assinador ITI) e envia o PDF assinado; o paciente baixa na página da consulta.
 */
export interface PrescriptionItem {
  name: string;
  dosage: string;
  instructions: string;
}

/** Cada linha não vazia vira um item. Numeração inicial ("1.", "2)") e marcadores são removidos. */
export function parsePrescriptionText(text: string): PrescriptionItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+\s*[.)-]|[-•*])\s*/, "").trim())
    .filter(Boolean)
    .map((line) => ({ name: line, dosage: "", instructions: "" }));
}

/** Idade em anos completos na data informada; 0 quando a data de nascimento é desconhecida ou inválida. */
export function ageOn(birthDate: string | null | undefined, today = new Date()): number {
  if (!birthDate) return 0;
  // "AAAA-MM-DD" é lida como data local; new Date() leria em UTC e voltaria um dia no Brasil.
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  const birth = ymd ? new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])) : new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return Math.max(0, age);
}
