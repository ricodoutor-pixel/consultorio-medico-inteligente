/**
 * Formata o nome do profissional com título adequado.
 * Evita duplicação ("Dr. Dr. Fulano") e aplica gênero quando disponível.
 */
export function formatDoctorTitle(
  name: string | null | undefined,
  options?: {
    gender?: 'M' | 'F' | string | null;
    councilType?: string | null; // CRM, CRO, CRF, CRP, CRMV, etc.
    fallbackCrm?: string | null;
  }
): string {
  if (!name) return options?.fallbackCrm ? `Dr(a). ${options.fallbackCrm}` : 'Profissional';
  
  const trimmed = name.trim();
  
  // Already has title prefix
  if (/^(Dr\.?|Dra\.?|Prof\.?|Profa\.?|Enf[aª]\.?)\s/i.test(trimmed)) {
    return trimmed;
  }
  
  // Determine prefix based on gender or council type
  const gender = options?.gender?.toUpperCase();
  const council = options?.councilType?.toUpperCase();
  
  let prefix = 'Dr.';
  if (gender === 'F') {
    prefix = 'Dra.';
  } else if (council === 'CRF') {
    prefix = gender === 'F' ? 'Farm.' : 'Farm.';
  } else if (council === 'CRP') {
    prefix = gender === 'F' ? 'Psic.' : 'Psic.';
  }
  
  return `${prefix} ${trimmed}`;
}
