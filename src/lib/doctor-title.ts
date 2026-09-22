// Garante que todo nome de médico exibido na vitrine tenha o título "Dr." / "Dra.".
// Nenhum médico pode aparecer sem o título na frente do nome.
export function ensureDoctorTitle(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  if (/^(dr|dra)\.\s*/i.test(trimmed)) return trimmed;
  return `Dr. ${trimmed}`;
}
