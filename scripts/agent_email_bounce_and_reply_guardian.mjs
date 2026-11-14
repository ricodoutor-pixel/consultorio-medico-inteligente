/**
 * scripts/agent_email_bounce_and_reply_guardian.mjs
 *
 * 🌿 Planta y Raíz Ltda — Guardião Anti-Bounce Brevo & Ponte CRM Bidirecional
 *
 * Executado continuamente via PM2 (ciclo a cada 30 minutos):
 * 1. Consulta os eventos de falha do Brevo (hardBounces, blocked, invalid) e alimenta
 *    automaticamente `scripts/bounced_emails_blacklist.json` + `suppressed_emails` no Supabase Oficial.
 * 2. Expurga do Brevo contatos sintéticos (@drsaude.com.br, @consultoriomed.com.br, @lead.plantayraiz.com.br).
 * 3. Sincroniza os médicos reais verificados (incluindo os que responderam por e-mail:
 *    Dr. Claudio Paciornik e Dr. Alex Sandro dos Santos) com o CRM Oficial Lovable Cloud (shmbwdjuddvquszwkvuq).
 */

import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  SYNTHETIC_OR_BLOCKED_DOMAINS,
  addEmailToBouncedBlacklist,
  loadBouncedBlacklist,
  syncLeadToOfficialSupabase
} from './lib/email_validator.mjs';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, 'email_bounce_guardian.log');
const STATE_FILE = path.join(__dirname, 'email_bounce_guardian_state.json');

const BREVO_KEY = process.env.BREVO_API_KEY || '';
const BREVO_BASE = 'https://api.brevo.com/v3';

function log(msg) {
  const line = `[${new Date().toISOString()}] [BOUNCE-GUARDIAN] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (_) {}
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Médicos que responderam diretamente ao convite por e-mail (Prioridade Máxima de Contato Humano)
const PRIORITY_EMAIL_REPLIED_DOCTORS = [
  {
    name: 'Dr. Claudio Paciornik',
    email: 'claudiopaciornik@yahoo.com.br',
    phone: '5541988942707',
    specialty: 'Mastologia, Ginecologia e Homeopatia',
    city: 'Curitiba',
    uf: 'PR',
    source: 'resposta_email_convite_socio_13_11',
    status: 'responded'
  },
  {
    name: 'Dr. Alex Sandro dos Santos',
    email: null,
    phone: '5511991363154',
    specialty: 'Medicina Canabinoide / Clínica Médica',
    city: '',
    uf: 'BR',
    source: 'resposta_email_convite_socio_09_11',
    status: 'responded'
  }
];

async function syncPriorityRepliedDoctors() {
  for (const doc of PRIORITY_EMAIL_REPLIED_DOCTORS) {
    await syncLeadToOfficialSupabase({
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      category: '1-medico',
      source: doc.source,
      specialty: doc.specialty,
      city: doc.city,
      uf: doc.uf,
      status: doc.status
    });
  }
  log(`✅ Médicos que responderam por e-mail (Dr. Claudio Paciornik & Dr. Alex Sandro dos Santos) registrados como 'responded' no CRM Oficial.`);
}

async function harvestBrevoBouncesAndClean() {
  if (!BREVO_KEY) {
    log('⚠️ BREVO_API_KEY não configurada; pulando varredura de eventos Brevo API.');
    return 0;
  }

  let newlyBlacklisted = 0;
  const eventTypes = ['hardBounces', 'blocked', 'invalid'];

  for (const evType of eventTypes) {
    try {
      const res = await fetch(`${BREVO_BASE}/smtp/statistics/events?event=${evType}&limit=100`, {
        headers: {
          'api-key': BREVO_KEY,
          accept: 'application/json'
        }
      });
      if (!res.ok) continue;
      const data = await res.json().catch(() => ({}));
      const events = Array.isArray(data.events) ? data.events : [];

      for (const ev of events) {
        const email = String(ev.email || '').trim().toLowerCase();
        if (!email) continue;
        const currentSet = loadBouncedBlacklist();
        if (!currentSet.has(email)) {
          addEmailToBouncedBlacklist(email, `brevo_${evType}: ${ev.reason || ''}`.slice(0, 100));
          newlyBlacklisted++;
        }
      }
    } catch (e) {
      log(`⚠️ Erro ao consultar eventos ${evType} no Brevo: ${e.message}`);
    }
  }

  // Varre amostra de contatos da Lista 6 no Brevo para remover domínios sintéticos (@drsaude.com.br, @consultoriomed.com.br, @lead.plantayraiz.com.br)
  try {
    const listRes = await fetch(`${BREVO_BASE}/contacts?limit=100&offset=0`, {
      headers: {
        'api-key': BREVO_KEY,
        accept: 'application/json'
      }
    });
    if (listRes.ok) {
      const listData = await listRes.json().catch(() => ({}));
      const contacts = Array.isArray(listData.contacts) ? listData.contacts : [];
      for (const c of contacts) {
        const em = String(c.email || '').trim().toLowerCase();
        const domain = em.split('@')[1] || '';
        if (SYNTHETIC_OR_BLOCKED_DOMAINS.has(domain)) {
          addEmailToBouncedBlacklist(em, `synthetic_domain_${domain}`);
          await fetch(`${BREVO_BASE}/contacts/${encodeURIComponent(em)}`, {
            method: 'DELETE',
            headers: { 'api-key': BREVO_KEY }
          }).catch(() => {});
          newlyBlacklisted++;
        } else if (c.emailBlacklisted === true) {
          addEmailToBouncedBlacklist(em, 'brevo_contact_blacklisted');
        }
      }
    }
  } catch (_) {}

  const totalBlacklisted = loadBouncedBlacklist().size;
  log(`🛡️ Varredura anti-bounce concluída: +${newlyBlacklisted} novos endereços bloqueados (Total na blacklist: ${totalBlacklisted}).`);
  try {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ updatedAt: new Date().toISOString(), totalBlacklisted, newlyBlacklisted }, null, 2),
      'utf8'
    );
  } catch (_) {}
  return newlyBlacklisted;
}

async function runGuardianLoop() {
  log('🚀 Guardião Anti-Bounce Brevo & Ponte CRM Inicializado (24/7)');
  await syncPriorityRepliedDoctors();

  while (true) {
    try {
      await harvestBrevoBouncesAndClean();
    } catch (e) {
      log(`⚠️ Erro no ciclo do Guardião Anti-Bounce: ${e.message}`);
    }
    await sleep(30 * 60 * 1000); // A cada 30 minutos
  }
}

runGuardianLoop().catch(err => {
  log(`🔥 Erro fatal: ${err.message}`);
  process.exit(1);
});
