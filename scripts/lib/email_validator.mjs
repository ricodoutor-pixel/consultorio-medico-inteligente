/**
 * scripts/lib/email_validator.mjs
 *
 * 🌿 Planta y Raíz Ltda — Validador Estrito de E-mail + Ponte Bidirecional Brevo <-> Supabase CRM
 *
 * Previne 100% dos envios para:
 * 1. Endereços deduzidos/sintéticos (@drsaude.com.br, @consultoriomed.com.br, etc.)
 * 2. Contatos sem nome real ("Dr(a). ", "Doutor(a)", etc.)
 * 3. E-mails com acentos/caracteres não-ASCII ou sintaxe inválida
 * 4. Domínios sem servidor de e-mail válido (DNS MX check)
 * 5. Endereços já marcados como hard-bounce / emailBlacklisted no Brevo ou na blacklist local
 *
 * Também sincroniza todo lead e disparo diretamente no banco oficial Lovable Cloud
 * (shmbwdjuddvquszwkvuq.supabase.co -> leads_contatos, medicos_parceiros_leads, pacientes_leads, email_send_log).
 */

import fs from 'fs';
import path from 'path';
import dns from 'node:dns';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.resolve(__dirname, '..');
const BOUNCED_BLACKLIST_FILE = path.join(SCRIPTS_DIR, 'bounced_emails_blacklist.json');

// Domínios sintéticos, deduzidos ou de sistema que NUNCA devem receber e-mail
export const SYNTHETIC_OR_BLOCKED_DOMAINS = new Set([
  'drsaude.com.br',
  'consultoriomed.com.br',
  'medicina.com.br',
  'clinica.com.br',
  'saude.com.br',
  'hospital.com.br',
  'medico.com.br',
  'lead.plantayraiz.com.br',
  'doctoralia.com',
  'doctoralia.com.br',
  'wix.com',
  'sentry.io',
  'example.com',
  'test.com',
  'localhost',
  'invalid.local',
  'galenicaonline.it'
]);

const mxCache = new Map();

export function loadBouncedBlacklist() {
  try {
    if (fs.existsSync(BOUNCED_BLACKLIST_FILE)) {
      const data = JSON.parse(fs.readFileSync(BOUNCED_BLACKLIST_FILE, 'utf8'));
      if (Array.isArray(data)) {
        return new Set(data.map(e => String(e).trim().toLowerCase()));
      }
    }
  } catch (e) {}
  return new Set();
}

export function addEmailToBouncedBlacklist(email, reason = 'hard_bounce') {
  if (!email) return;
  const clean = String(email).trim().toLowerCase();
  const set = loadBouncedBlacklist();
  if (!set.has(clean)) {
    set.add(clean);
    try {
      fs.writeFileSync(BOUNCED_BLACKLIST_FILE, JSON.stringify([...set], null, 2), 'utf8');
    } catch (e) {}
  }
  // Assincronamente registra em suppressed_emails no Supabase oficial
  recordSuppressedEmailInSupabase(clean, reason).catch(() => {});
}

export function hasRealDoctorName(rawName) {
  if (!rawName) return false;
  const cleaned = String(rawName)
    .replace(/^(dr\(a\)\.?|dr\.?|dra\.?|doutor\(a\)|doutor|doutora|m[eé]dico\(a\)|m[eé]dico|m[eé]dica)\s*/gi, '')
    .replace(/^(dr\(a\)\.?|dr\.?|dra\.?|doutor\(a\)|doutor|doutora|m[eé]dico\(a\)|m[eé]dico|m[eé]dica)\s*/gi, '')
    .trim();
  if (cleaned.length < 3) return false;
  if (/^(lead|contato|medico|doutor|clinico geral|prescritor)$/i.test(cleaned)) return false;
  return true;
}

export function isValidDoctorEmailSyntax(rawEmail, doctorName = 'Valido') {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { valid: false, reason: 'EMPTY_EMAIL' };
  }

  const email = rawEmail.trim().toLowerCase();

  // Rejeita caracteres não-ASCII (ex: ç, ã, é)
  if (/[^\x00-\x7F]/.test(email)) {
    return { valid: false, reason: 'NON_ASCII_EMAIL' };
  }

  // Sintaxe estrita RFC básica
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,10}$/.test(email)) {
    return { valid: false, reason: 'INVALID_SYNTAX' };
  }

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain || localPart.length < 2) {
    return { valid: false, reason: 'INVALID_PARTS' };
  }

  if (SYNTHETIC_OR_BLOCKED_DOMAINS.has(domain) || domain.endsWith('.fake') || domain.endsWith('.local')) {
    return { valid: false, reason: `SYNTHETIC_DOMAIN_${domain}` };
  }

  if (doctorName !== null && !hasRealDoctorName(doctorName)) {
    return { valid: false, reason: 'MISSING_REAL_DOCTOR_NAME' };
  }

  const blacklist = loadBouncedBlacklist();
  if (blacklist.has(email)) {
    return { valid: false, reason: 'LOCAL_BOUNCE_BLACKLIST' };
  }

  return { valid: true, email, domain };
}

export async function hasValidMxRecord(domain) {
  if (!domain) return false;
  if (mxCache.has(domain)) return mxCache.get(domain);

  try {
    const records = await dns.promises.resolveMx(domain);
    const ok = Array.isArray(records) && records.length > 0 && Boolean(records[0].exchange);
    mxCache.set(domain, ok);
    return ok;
  } catch (e) {
    mxCache.set(domain, false);
    return false;
  }
}

export async function verifyEmailDeliverability(rawEmail, doctorName = 'Valido', brevoApiKey = '') {
  const syntaxCheck = isValidDoctorEmailSyntax(rawEmail, doctorName);
  if (!syntaxCheck.valid) {
    return syntaxCheck;
  }

  const { email, domain } = syntaxCheck;

  // 1. Verifica DNS MX do domínio
  const mxOk = await hasValidMxRecord(domain);
  if (!mxOk) {
    addEmailToBouncedBlacklist(email, 'no_mx_record');
    return { valid: false, reason: `NO_MX_RECORD_${domain}` };
  }

  // 2. Se tiver chave Brevo, consulta se o contato já deu hard bounce ou está bloqueado no Brevo
  if (brevoApiKey) {
    try {
      const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'api-key': brevoApiKey,
          'accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.emailBlacklisted === true) {
          addEmailToBouncedBlacklist(email, 'brevo_email_blacklisted');
          return { valid: false, reason: 'BREVO_BLACKLISTED' };
        }
      }
    } catch (e) {
      // Falha de rede ao checar contato não impede se sintaxe + MX passaram
    }
  }

  return { valid: true, email, domain };
}

// ============================================================================
// PONTE BIDIRECIONAL COM O BANCO OFICIAL LOVABLE CLOUD (shmbwdjuddvquszwkvuq)
// ============================================================================

const OFFICIAL_SUPABASE_URL =
  process.env.SUPABASE_URL_OFFICIAL ||
  'https://shmbwdjuddvquszwkvuq.supabase.co';

function getSupabaseKey() {
  // Evita usar service role key do projeto legado tkxxoghzhvhjzdoomgss no projeto oficial shmbwdjuddvquszwkvuq
  if (process.env.SUPABASE_SERVICE_ROLE_KEY_OFFICIAL) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY_OFFICIAL;
  }
  const envUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  if (envUrl.includes('shmbwdjuddvquszwkvuq') && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  return process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
}

export async function recordSuppressedEmailInSupabase(email, reason = 'hard_bounce') {
  const key = getSupabaseKey();
  if (!key || !email) return false;
  try {
    await fetch(`${OFFICIAL_SUPABASE_URL}/rest/v1/suppressed_emails`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        reason,
        metadata: { source: 'vps_email_validator', recorded_at: new Date().toISOString() }
      })
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function logEmailSendInSupabase({ email, templateName, status, messageId = null, errorMessage = null, metadata = {} }) {
  const key = getSupabaseKey();
  if (!key || !email) return false;
  try {
    await fetch(`${OFFICIAL_SUPABASE_URL}/rest/v1/email_send_log`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        recipient_email: email.trim().toLowerCase(),
        template_name: templateName || 'doctor_partner_invite',
        status: status || 'sent',
        message_id: messageId,
        error_message: errorMessage,
        metadata
      })
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function syncLeadToOfficialSupabase({
  name,
  email,
  phone,
  category = 'medico',
  source = 'vps_agent',
  specialty = '',
  city = '',
  uf = '',
  crm = '',
  status = 'invited'
}) {
  const key = getSupabaseKey();
  if (!key) return false;

  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const cleanEmail = email ? String(email).trim().toLowerCase() : null;
  const cleanName = String(name || 'Contato Planta y Raíz').trim();

  // 1. Insere/atualiza em leads_contatos se tiver telefone
  if (cleanPhone) {
    try {
      await fetch(`${OFFICIAL_SUPABASE_URL}/rest/v1/leads_contatos`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          nome: cleanName,
          telefone: cleanPhone,
          email: cleanEmail,
          categoria: category,
          origem: source,
          idioma: 'pt-BR',
          tags: [category, status, specialty].filter(Boolean)
        })
      });
    } catch (e) {}
  }

  // 2. Se for médico, sincroniza também em medicos_parceiros_leads
  if (category.includes('medico') || category.includes('PRESCRITOR') || category.includes('FORMADO')) {
    try {
      await fetch(`${OFFICIAL_SUPABASE_URL}/rest/v1/medicos_parceiros_leads`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          nome: cleanName,
          email: cleanEmail,
          telefone: cleanPhone || null,
          crm: crm || null,
          uf: uf || null,
          cidade: city || null,
          especialidade: specialty || 'Medicina Canabinoide / Clínica Médica',
          origem: source,
          status
        })
      });
    } catch (e) {}
  }

  // 3. Se for paciente, sincroniza em pacientes_leads
  if (category.includes('paciente') && cleanPhone) {
    try {
      await fetch(`${OFFICIAL_SUPABASE_URL}/rest/v1/pacientes_leads`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          nome: cleanName,
          whatsapp: cleanPhone,
          email: cleanEmail,
          cidade: city || null,
          source
        })
      });
    } catch (e) {}
  }

  return true;
}
