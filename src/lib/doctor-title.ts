// Garante que todo nome de médico exibido na vitrine tenha o título "Dr." / "Dra.".
// Nenhum médico pode aparecer sem o título na frente do nome.
export function ensureDoctorTitle(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  // Já tem título médico (Dr./Dra.), inclusive após título acadêmico
  // (Prof. Dr., Profa. Dra., Prof., Profa.): mantém como está, sem duplicar.
  if (/^(dr|dra)\.\s*/i.test(trimmed)) return trimmed;
  if (/^(prof|profa)\.\s*(dr|dra)\.\s*/i.test(trimmed)) return trimmed;
  if (/^(prof|profa)\.\s*/i.test(trimmed)) return trimmed;
  return `Dr. ${trimmed}`;
}
