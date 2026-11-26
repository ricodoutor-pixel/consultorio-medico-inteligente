// Shared guardrails for WhatsApp outreach, business/non-doctor filtering,
// confirmed-CRM addressing, and Brasília business-hours enforcement.
// Pure ESM with zero external dependencies (compatible with Deno Edge Functions, Node.js VPS scripts, and Vitest).

export const BUSINESS_HOURS_BRT = Object.freeze({
  timeZone: 'America/Sao_Paulo',
  startHour: 9,   // 09:00 BRT inclusive
  endHour: 19,    // 19:00 BRT exclusive (last allowed minute: 18:59 BRT)
  allowedDays: Object.freeze([1, 2, 3, 4, 5, 6]), // Segunda (1) a Sábado (6); Domingo (0) bloqueado
});

const WEEKDAY_MAP = Object.freeze({
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
});

const VALID_BR_UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);

export function normalizeAscii(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts date/time components in America/Sao_Paulo (BRT/BRST),
 * independent of the host/VPS timezone (e.g. UTC on Hostinger).
 */
export function getBrasiliaTimeParts(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.getTime())) {
    return { weekday: 0, weekdayShort: 'Sun', hour: 0, minute: 0, valid: false };
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_HOURS_BRT.timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  const weekdayShort = parts.find((p) => p.type === 'weekday')?.value || 'Sun';
  const rawHour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const hour = rawHour === 24 ? 0 : rawHour;
  const weekday = WEEKDAY_MAP[weekdayShort] ?? 0;
  return { weekday, weekdayShort, hour, minute, valid: true };
}

/**
 * Strict business-hours lock: Mon–Sat (Seg–Sáb), 09:00–18:59 BRT (America/Sao_Paulo).
 * Always returns false on Sundays and outside 09:00–19:00 BRT.
 */
export function isBusinessHoursBRT(now = new Date()) {
  const { weekday, hour, valid } = getBrasiliaTimeParts(now);
  if (!valid) return false;
  return (
    BUSINESS_HOURS_BRT.allowedDays.includes(weekday) &&
    hour >= BUSINESS_HOURS_BRT.startHour &&
    hour < BUSINESS_HOURS_BRT.endHour
  );
}

// ============================================================================
// CONFIRMED CRM VALIDATION
// ============================================================================

const NON_MEDICAL_COUNCIL_PATTERN =
  /\b(cro|crp|crmv|crn|crf|crefito|coren|oab|crea|crc|creci|coffito|crbm|crfa|crq|cress)\b/i;

const PLACEHOLDER_CRM_DIGITS = new Set([
  '000', '0000', '00000', '000000', '0000000',
  '123', '1234', '12345', '123456', '1234567',
  '999', '9999', '99999', '999999',
]);

/**
 * Validates whether a contact has a confirmed medical CRM (NOT CRO/CRP/CRMV/OAB/placeholder).
 */
export function hasConfirmedCrm(crm = '', crmState = '', councilType = '') {
  const councilNorm = normalizeAscii(councilType).toUpperCase();
  if (councilNorm && councilNorm !== 'CRM') return false;

  const rawCrm = String(crm || '').trim();
  if (!rawCrm) return false;

  const crmNorm = normalizeAscii(rawCrm);
  if (NON_MEDICAL_COUNCIL_PATTERN.test(crmNorm)) return false;
  if (/\b(pendente|teste|test|nao informado|sem crm|a confirmar|aguardando|indefinido|none|null|n\/a)\b/i.test(crmNorm)) {
    return false;
  }
  // Never accept the legacy/forbidden synthetic CRM string
  if (/crm-ce\/sp\s*10963/i.test(rawCrm)) return false;

  // Validate optional UF
  const stateClean = String(crmState || '').trim().toUpperCase();
  if (stateClean && !VALID_BR_UFS.has(stateClean)) return false;

  // Strip optional "CRM", UF, slashes, dashes, dots, spaces
  const digits = rawCrm.replace(/\D/g, '');
  if (!/^\d{3,7}$/.test(digits)) return false;
  if (PLACEHOLDER_CRM_DIGITS.has(digits)) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  return true;
}

// ============================================================================
// PJ / COMPANY / NON-DOCTOR FILTERING
// ============================================================================

/**
 * Corporate/PJ legal entities and commercial sectors that must NEVER be treated
 * as individual doctors or receive doctor invites / patient OT pitches.
 */
const PJ_LEGAL_ENTITY_NAME_PATTERNS = [
  /\bltda\.?\b/i,
  /\bs\s*\/\s*a\b|\bs\.\s*a\.?(?:\b|$)/i,
  /\bs\s*\/\s*[sc]\b|\bs\.\s*[sc]\.?(?:\b|$)/i,
  /\b(eireli|epp|mei|slu|cnpj)\b/i,
  // Uppercase ME suffix (e.g. "Empresa X ME", "Empresa X - ME") without false-matching pronoun "me"
  /(?:^|[\s\-–—,/(.])ME\.?(?:$|[\s\-–—,/.)])/,
  /(?:[-–—,/]|ltda\s*[-–—,/]?\s*)\s*me\.?(?:\s*$|\s*[),])/i,
  /\bsociedade\s+(simples|limitada|empresaria|anonima|unipessoal)\b/i,
  /\b(holdings?|empreendimentos?|comercio|servicos|solucoes|sistemas|tecnologia)\b/i,
  /\b(cartao\s+(de\s+)?beneficios?|cartao\s+(saude|desconto|todos)|plan[oa]?\s+(de\s+)?saude|beneficios|convenio|operadora)\b/i,
  /\b(contabil|contabilidade|contador(?:a|es)?|escritorio\s+contabil|assessoria|consultoria|auditoria|despachante)\b/i,
  /\b(imobiliaria|imoveis|corretora\s+de\s+imoveis|incorporadora|construtora|engenharia|arquitetura)\b/i,
  /\b(financeira|financas|credito|emprestimo|consorcio|factoring|cobranca|seguros|corretora|banco)\b/i,
  /\b(advocacia|advogados?\s+associados|escritorio\s+de\s+advocacia)\b/i,
  /\b(agencia|marketing|publicidade|propaganda|midia|digital|estetica|salao\s+de\s+beleza|estetica\s+e\s+beleza|clinica\s+de\s+beleza|espaco\s+beleza|instituto\s+de\s+beleza|studio\s+de\s+beleza|salao|barbearia|academia|otica|optica)\b/i,
  /\b(associacao|cooperativa|sindicato|fundacao|igreja|escola|colegio|faculdade|universidade)\b/i,
  /\b(supermercado|mercado|restaurante|padaria|loja|oficina|transportadora|logistica|distribuidora|industria|comercial)\b/i,
];

/**
 * Clinic / healthcare facility / generic desk names when appearing in a contact NAME, COMPANY, or EMAIL.
 * Checked ONLY on name/company/email — NOT on `specialty` (so real doctors with specialty "Clínica Médica"
 * or "Clínica Geral" are preserved).
 */
const CLINIC_OR_FACILITY_NAME_PATTERNS = [
  /\b(clinica|policlinica|clinic)\b/i,
  /\b(centro\s+medico|centro\s+clinico|centro\s+de\s+saude|centro\s+integrado|centro\s+odontologico|centro\s+terapeutico|medical\s+center|health\s+center)\b/i,
  /\b(instituto|hospital|maternidade|pronto\s+socorro|ambulatorio|sanatorio)\b/i,
  /\b(consultorio|cons\.)\b/i,
  /^cons\.?\s+/i,
  /\b(laboratorio|diagnosticos?|vacinas?)\b/i,
  /\b(espaco\s+(saude|vida|bem|terapeutico|medico|clinico|odonto|psico)|nucleo\s+(medico|de\s+saude|clinico|integrado)|grupo\s+(medico|de\s+saude|hospitalar)|rede\s+(de\s+clinicas|medica|d'or|dor))\b/i,
  /\b(recepcao|secretaria|agendamento|atendimento|central\s+de|faturamento|financeiro|administrativo|suporte|ouvidoria|sac)\b/i,
];

/**
 * Non-medical professions and non-CRM councils: blocked across name, company, email, specialty, and bio.
 */
const NON_DOCTOR_PROFESSION_PATTERNS = [
  /\b(odontologia|odontologic[oa]|odonto|dentista|cirurgiao[- ]?dentista|ortodontia|implantodontia|endodontia|periodontia|protese\s+dentaria|oral\s*face|sorriso|smile)\b/i,
  /\b(psicologia|psicolog[oa]s?|neuropsicologia|terapeuta)\b/i,
  /\b(veterinari[oa]s?|medicina\s+veterinaria|pet\s*shop)\b/i,
  /\b(fisioterapia|fisioterapeutas?|quiropraxia|osteopatia|pilates)\b/i,
  /\b(nutricao|nutricionistas?)\b/i,
  /\b(farmacia|farmaceutic[oa]s?|drogaria|manipulacao)\b/i,
  /\b(enfermagem|enfermeir[oa]s?|tecnic[oa]\s+de\s+enfermagem)\b/i,
  /\b(fonoaudiologia|fonoaudiolog[oa]s?)\b/i,
  /\b(biomedicina|biomedic[oa]s?)\b/i,
  /\b(esteticista|podologia|podolog[oa]s?|optometria|terapia\s+ocupacional)\b/i,
  NON_MEDICAL_COUNCIL_PATTERN,
];

const BUSINESS_EMAIL_DOMAIN_PATTERNS = [
  /(contabil|contabilidade|assessoria|imobiliaria|imoveis|financeira|odonto|dentista|psicolog|vet|fisioterap|nutri|farmacia|drogaria|advocacia|clinica|centromedico|instituto|hospital|beneficios|plansa)/i,
];

const CORPORATE_NAME_STRUCTURE_PATTERNS = [
  // Names starting with digits / alphanumeric company codes (e.g., "3 P Psicologia", "2M Contabilidade")
  /^\d+\s*[a-zA-Z]?\b/,
  // Company ampersand notation (e.g., "PC&P Contabilidade", "Silva & Associados")
  /[a-zA-Z0-9]\s*&\s*[a-zA-Z0-9]/,
];

/**
 * Determines whether a contact represents a PJ/company, clinic/facility, or non-medical professional.
 * Returns `{ blocked: boolean, reason: string }`.
 */
export function isCompanyOrNonDoctorContact(contact = {}) {
  const input = typeof contact === 'string' ? { name: contact } : (contact || {});
  const rawName = String(input.name || input.full_name || input.senderName || input.pushName || '').trim();
  const rawCompany = String(input.company || input.empresa || input.organization || '').trim();
  const rawEmail = String(input.email || '').trim();
  const rawSpecialty = String(input.specialty || input.especialidade || '').trim();
  const rawBio = String(input.bio || input.notes || input.description || '').trim();
  const rawCouncilType = String(input.councilType || input.council_type || '').trim();
  const rawCrm = String(input.crm || '').trim();

  // 1. Explicit non-medical council type or council in CRM field
  if (rawCouncilType && normalizeAscii(rawCouncilType) !== 'crm') {
    return { blocked: true, reason: `non_medical_council:${rawCouncilType}` };
  }
  if (rawCrm && NON_MEDICAL_COUNCIL_PATTERN.test(normalizeAscii(rawCrm))) {
    return { blocked: true, reason: 'non_medical_council_in_crm' };
  }

  const nameNorm = normalizeAscii(rawName);
  const companyNorm = normalizeAscii(rawCompany);
  const specialtyNorm = normalizeAscii(rawSpecialty);
  const bioNorm = normalizeAscii(rawBio);
  const emailNorm = normalizeAscii(rawEmail);

  // 2. Corporate name structural cues on rawName / rawCompany
  for (const text of [rawName, rawCompany].filter(Boolean)) {
    if (CORPORATE_NAME_STRUCTURE_PATTERNS.some((re) => re.test(text))) {
      return { blocked: true, reason: 'corporate_name_structure' };
    }
  }

  // 3. PJ / legal entity / commercial sector checks on raw + normalized name/company
  for (const [rawText, normText] of [
    [rawName, nameNorm],
    [rawCompany, companyNorm],
  ]) {
    if (!normText) continue;
    for (const re of PJ_LEGAL_ENTITY_NAME_PATTERNS) {
      const target = re.flags.includes('i') ? normText : rawText;
      if (re.test(target)) {
        return { blocked: true, reason: `pj_or_company_entity:${re.source.slice(0, 32)}` };
      }
    }
    for (const re of CLINIC_OR_FACILITY_NAME_PATTERNS) {
      // Check rawText as well for patterns with dots like "Cons."
      if (re.test(normText) || re.test(rawText)) {
        return { blocked: true, reason: `clinic_or_facility:${re.source.slice(0, 32)}` };
      }
    }
  }

  // 4. Non-doctor professions / councils across name, company, specialty, bio
  for (const [label, normText] of [
    ['name', nameNorm],
    ['company', companyNorm],
    ['specialty', specialtyNorm],
    ['bio', bioNorm],
  ]) {
    if (!normText) continue;
    for (const re of NON_DOCTOR_PROFESSION_PATTERNS) {
      if (re.test(normText)) {
        return { blocked: true, reason: `non_doctor_profession_${label}` };
      }
    }
    if (
      /\b(psicoterapia|psicanalise)\b/i.test(normText) &&
      !/\b(psiquiatr[ia]a?|medicina|medic[oa])\b/i.test(`${specialtyNorm} ${bioNorm}`)
    ) {
      return { blocked: true, reason: `non_doctor_profession_${label}` };
    }
  }

  // 5. Business/non-doctor email domain check (skip generic webmail domains)
  if (emailNorm.includes('@')) {
    const [, domain = ''] = emailNorm.split('@');
    const isGenericWebmail = /^(gmail|hotmail|outlook|live|yahoo|icloud|uol|bol|terra|ig|globo|me|proton|protonmail)\./i.test(domain);
    if (!isGenericWebmail && BUSINESS_EMAIL_DOMAIN_PATTERNS.some((re) => re.test(domain))) {
      return { blocked: true, reason: `business_email_domain:${domain}` };
    }
  }

  // 6. PJ sector keywords in specialty/bio (e.g. "Contabilidade", "Imobiliária", "Financeira")
  for (const [label, normText] of [
    ['specialty', specialtyNorm],
    ['bio', bioNorm],
  ]) {
    if (!normText) continue;
    if (/\b(contabil|contabilidade|assessoria\s+contabil|imobiliaria|financeira|cartao\s+beneficios|advocacia)\b/i.test(normText)) {
      return { blocked: true, reason: `non_medical_sector_${label}` };
    }
  }

  return { blocked: false, reason: 'ok' };
}

/**
 * Strips any existing "Dr.", "Dra.", "Dr(a).", "Doutor(a)" prefix from a person's name.
 */
export function stripDoctorHonorific(rawName = '') {
  return String(rawName || '')
    .trim()
    .replace(/^(?:dr\(a\)\.?|dra?\.?|doutor\(a\)|doutora?)\s+/gi, '')
    .replace(/^(?:dr\(a\)\.?|dra?\.?|doutor\(a\)|doutora?)\s+/gi, '')
    .trim();
}

/**
 * Formats how to address a contact safely:
 * - Blocks PJ/companies/non-doctors entirely (`allowed: false`).
 * - NEVER prefixes "Dr(a)." / "Dr." / "Dra." unless CRM is confirmed (`hasConfirmedCrm`).
 * - Without confirmed CRM, returns neutral addressing (clean first/full name or empty greeting).
 */
export function formatDoctorAddressing({
  name = '',
  crm = '',
  crmState = '',
  councilType = '',
  crmConfirmed = false,
  email = '',
  specialty = '',
  bio = '',
  company = '',
  honorific = 'Dr(a).',
} = {}) {
  const companyCheck = isCompanyOrNonDoctorContact({
    name,
    email,
    specialty,
    bio,
    company,
    crm,
    councilType,
  });
  if (companyCheck.blocked) {
    return {
      allowed: false,
      reason: companyCheck.reason,
      hasConfirmedCrm: false,
      cleanName: '',
      salutation: '',
    };
  }

  const cleanName = stripDoctorHonorific(name);
  const validCleanName =
    cleanName && !/^\d{5,}$/.test(cleanName) && !/[@_]/.test(cleanName)
      ? cleanName
      : '';

  const confirmed = Boolean(crmConfirmed) || hasConfirmedCrm(crm, crmState, councilType);
  if (confirmed) {
    const salutation = validCleanName ? `${honorific} ${validCleanName}` : honorific;
    return {
      allowed: true,
      reason: 'confirmed_crm',
      hasConfirmedCrm: true,
      cleanName: validCleanName,
      salutation,
    };
  }

  // Never prefix Dr(a). without confirmed CRM
  return {
    allowed: true,
    reason: 'unconfirmed_crm_no_honorific',
    hasConfirmedCrm: false,
    cleanName: validCleanName,
    salutation: validCleanName,
  };
}

/**
 * Full pre-dispatch gate for outbound doctor invitations.
 * Enforces:
 * 1. Manual admin trigger (`manualAdminSend === true`)
 * 2. Business hours Mon–Sat 09:00–19:00 BRT (`isBusinessHoursBRT`)
 * 3. Not a PJ/company/clinic/non-doctor (`isCompanyOrNonDoctorContact`)
 * 4. Confirmed CRM required (`requireConfirmedCrm`, default true)
 */
export function evaluateOutboundDoctorInvite({
  contact = {},
  now = new Date(),
  manualAdminSend = false,
  requireConfirmedCrm = true,
  requireBusinessHours = true,
} = {}) {
  if (!manualAdminSend) {
    return { allowed: false, reason: 'COLD_OUTREACH_DISABLED_MANUAL_ADMIN_ONLY' };
  }

  if (requireBusinessHours && !isBusinessHoursBRT(now)) {
    const brt = getBrasiliaTimeParts(now);
    return {
      allowed: false,
      reason: `OUTSIDE_BUSINESS_HOURS_BRT (${brt.weekdayShort} ${String(brt.hour).padStart(2, '0')}:${String(brt.minute).padStart(2, '0')} BRT; permitido Seg-Sab 09h-19h)`,
    };
  }

  const pjCheck = isCompanyOrNonDoctorContact(contact);
  if (pjCheck.blocked) {
    return { allowed: false, reason: `BLOCKED_PJ_OR_NON_DOCTOR:${pjCheck.reason}` };
  }

  const crmOk =
    Boolean(contact.crmConfirmed) ||
    hasConfirmedCrm(contact.crm, contact.crmState || contact.crm_state, contact.councilType || contact.council_type);

  if (requireConfirmedCrm && !crmOk) {
    return { allowed: false, reason: 'UNCONFIRMED_CRM_REQUIRED' };
  }

  const addressing = formatDoctorAddressing({
    ...contact,
    crmState: contact.crmState || contact.crm_state || '',
    councilType: contact.councilType || contact.council_type || '',
    crmConfirmed: crmOk,
  });

  return {
    allowed: true,
    reason: 'ALLOWED',
    hasConfirmedCrm: crmOk,
    addressing,
  };
}
