import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

// 🛑 DESATIVADO PERMANENTEMENTE: Conforme Manual Mestre e instrução do Dr. Edilson, disparos frios em massa estão suspensos.
console.log('🛑 [BREVO-WHATSAPP-INVITER] Script desativado permanentemente para proteger o WhatsApp da Planta y Raíz.');
process.exit(0);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { BRISA_CONFIG, buildOfficialInvitationMessage } from './brisa_onboarding_config.mjs';
import { preSendGuard, normalizeJid, sanitizeDoctorName } from './lib/brisa_security.mjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, 'brevo_whatsapp_inviter.log');
const STATE_FILE = path.join(__dirname, 'brevo_whatsapp_invited_doctors.json');
const DOCTORS_LIST_FILE = path.join(__dirname, 'database_doctors_list.json');
const UNREGISTERED_LEADS_FILE = path.join(__dirname, 'unregistered_doctors_leads.json');
const HUMAN_LOCK_FILE = path.join(__dirname, 'evolution_human_mode_contacts.json');
const BLACKLIST_FILE = path.join(__dirname, 'evolution_optout_blacklist.json');
const PAUSE_GLOBAL_FILE = path.join(__dirname, 'PAUSE_AUTOMATION.flag');

// 🔒 Ativado conforme solicitação expressa do Dr. Edilson (1 msg a cada 15 min)
const BRISA_COLD_OUTREACH_ENABLED = process.env.BRISA_COLD_OUTREACH_ENABLED !== 'false'; // Pausado por determinação do Dr. Edilson (foco 100% em E-mail)

function isGlobalPauseActive() {
  return fs.existsSync(PAUSE_GLOBAL_FILE);
}

function loadHumanLocked() {
  try {
    if (fs.existsSync(HUMAN_LOCK_FILE)) {
      const raw = JSON.parse(fs.readFileSync(HUMAN_LOCK_FILE, 'utf8'));
      if (Array.isArray(raw)) {
        return new Set(raw.map(item => (typeof item === 'string' ? item : item?.jid || '')).filter(Boolean));
      }
      if (raw && typeof raw === 'object') {
        return new Set(Object.keys(raw));
      }
    }
  } catch (e) {}
  return new Set();
}

function loadBlacklist() {
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      return new Set(JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8')));
    }
  } catch (e) {}
  return new Set();
}

// 🕒 JANELA DE ENVIO ESTRITA: Segunda a Sábado, 09:00 às 19:00 (Horário de Brasília — sem override)
import {
  isBusinessHoursBRT,
  isCompanyOrNonDoctorContact,
  hasConfirmedCrm,
} from '../supabase/functions/_shared/whatsapp-outreach-guard.mjs';

function isWithinBusinessHours() {
  return isBusinessHoursBRT();
}

async function checkInstanceStatus() {
  try {
    const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE}`, {
      headers: { 'apikey': EVO_KEY }
    });
    if (!res.ok) return 'error';
    const data = await res.json();
    return data?.instance?.state || data?.state || 'close';
  } catch (e) {
    return 'network_error';
  }
}

// ⏱️ INTERVALO DE 15 MINUTOS POR MENSAGEM (script desativado)
function getRandomCadenceMs() {
  return 15 * 60 * 1000;
}

const EVO_URL = process.env.EVOLUTION_URL_VPS || process.env.EVOLUTION_URL || 'https://whatsapp.plantayraiz.com.br';
const EVO_KEY = process.env.EVOLUTION_API_KEY_VPS || process.env.EVOLUTION_API_KEY || '';
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'plantayraiz';

const BREVO_KEY = process.env.BREVO_API_KEY || '';
const BREVO_LIST_ID = Number(process.env.BREVO_LIST_MEDICOS || 6);

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [BREVO-INVITER] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) {}
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    lastOffset: 0,
    totalInvited: 0,
    invitedPhones: {},
    invitedEmails: {}
  };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {}
}

function loadKnownDoctors() {
  try {
    if (fs.existsSync(DOCTORS_LIST_FILE)) {
      return JSON.parse(fs.readFileSync(DOCTORS_LIST_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

// Normaliza e valida celular brasileiro
function normalizeValidBrazilianMobile(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!digits.startsWith('55')) return null;

  // Celular BR: 55 + DDD + 9 dígitos
  if (digits.length === 13) {
    const ddd = Number(digits.slice(2, 4));
    const ninth = digits[4];
    if (ninth === '9' && ddd >= 11 && ddd <= 99) {
      return digits;
    }
  }
  return null;
}

const PREPOSITIONS = new Set(['da', 'de', 'do', 'dos', 'das', 'e', 'del', 'd', 'von', 'van']);

// Limpa nome removendo títulos duplicados sem jamais prefixar Dr(a).
function cleanDoctorName(name) {
  if (!name) return '';
  let n = String(name).trim();
  if (isCompanyOrNonDoctorContact({ name: n }).blocked) return '';

  n = n.replace(/^(dr\(a\)\.?|dr\.|dra\.|dr|dra|doutor\(a\)|doutor|doutora|médico|médica)\s*/gi, '');
  n = n.replace(/^(dr\(a\)\.?|dr\.|dra\.|dr|dra|doutor\(a\)|doutor|doutora|médico|médica)\s*/gi, '');
  n = n.replace(/[–—\-_/\\|]/g, ' ').trim();

  const rawWords = n.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return '';

  const words = [rawWords[0]];
  let i = 1;
  while (i < rawWords.length) {
    const w = rawWords[i].toLowerCase();
    if (PREPOSITIONS.has(w)) {
      words.push(rawWords[i]);
      i++;
      if (i < rawWords.length) {
        words.push(rawWords[i]);
        i++;
      }
      break;
    } else {
      words.push(rawWords[i]);
      break;
    }
  }

  return words.map((w, idx) => {
    const low = w.toLowerCase();
    if (idx > 0 && PREPOSITIONS.has(low)) return low;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

// Filtro estrito de PJ/empresas/não-médicos usando política compartilhada
function isExcludedAudience(name = '', email = '', specialty = '', crm = '', councilType = '') {
  const check = isCompanyOrNonDoctorContact({ name, email, specialty, crm, councilType });
  if (check.blocked) {
    return { excluded: true, reason: check.reason };
  }
  if (!hasConfirmedCrm(crm, '', councilType)) {
    return { excluded: true, reason: 'unconfirmed_crm' };
  }
  return { excluded: false };
}

function buildInvitationMessage(doctorName, options = {}) {
  const cleanName = sanitizeDoctorName(doctorName);
  if (!cleanName) return '';
  return buildOfficialInvitationMessage(cleanName, options);
}

async function sendWhatsApp(recipient, text, contact = {}) {
  if (!isWithinBusinessHours()) {
    return { dryRun: true, status: 'blocked', reason: 'OUTSIDE_BUSINESS_HOURS_BRT' };
  }
  const norm = normalizeJid(recipient);
  const cleanNumber = norm.phone || recipient.replace(/\D/g, '');

  // 🛡️ GUARDA DE PRÉ-ENVIO (horário BRT, PJ, CRM, opt-out, textos proibidos)
  const guard = preSendGuard(norm.normalizedJid, text, { isOutreach: true, contact });
  if (!guard.canSend) {
    log(`🛡️ ${guard.log}`);
    return { dryRun: true, status: 'blocked', reason: guard.reason };
  }

  log(`Enviando convite para ${cleanNumber}...`);
  const res = await fetch(`${EVO_URL}/message/sendText/${INSTANCE}`, {
    method: 'POST',
    headers: {
      'apikey': EVO_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      number: cleanNumber,
      options: {
        delay: 2000,
        presence: 'composing'
      },
      text
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro Evolution (${res.status}): ${err}`);
  }

  return await res.json();
}

async function fetchBrevoContacts(offset = 0, limit = 50) {
  // 1. Prioriza a base curada de 2.630 médicos prescritores pessoa física (unregistered_doctors_leads.json)
  if (fs.existsSync(UNREGISTERED_LEADS_FILE)) {
    try {
      const allLeads = JSON.parse(fs.readFileSync(UNREGISTERED_LEADS_FILE, 'utf8'));
      if (offset < allLeads.length) {
        const slice = allLeads.slice(offset, offset + limit);
        return {
          count: allLeads.length,
          contacts: slice.map(l => ({
            email: l.email,
            attributes: {
              NOME: l.name,
              WHATSAPP: l.phone,
              SPECIALTY: l.specialty
            }
          }))
        };
      }
    } catch (e) {
      log(`Erro lendo base curada de médicos: ${e.message}`);
    }
  }

  // 2. Fallback para API Brevo Lista 6 após concluir a base curada
  try {
    const url = `https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_ID}/contacts?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      return {
        count: data.count || 0,
        contacts: data.contacts || []
      };
    }
  } catch (err) {
    log(`⚠️ Erro na conexão Brevo API: ${err.message}`);
  }

  return { count: 0, contacts: [] };
}

async function run() {
  log('========================================================================');
  log('🚀 AGENTE DE CONVITES WHATSAPP PARA MÉDICOS (BREVO LISTA 6) INICIADO');
  log(`🔒 Chave de Liga/Desliga: BRISA_COLD_OUTREACH_ENABLED = ${BRISA_COLD_OUTREACH_ENABLED}`);
  log(`🕒 Janela de envio permitida: Segunda a Sexta, 09h às 18h (Horário de Brasília)`);
  log(`⏱️ Cadência dinâmica: Intervalo aleatório de 15 a 25 minutos com Jitter`);
  log('========================================================================');

  const knownDoctors = loadKnownDoctors();
  const knownPhones = new Set(knownDoctors.map(d => (d.phone || '').replace(/\D/g, '')).filter(Boolean));
  const knownNames = new Set(knownDoctors.map(d => (d.name || '').toLowerCase().trim()).filter(Boolean));

  const state = loadState();

  while (true) {
    try {
      // 0. TRAVA OBRIGATÓRIA: Envio nasce DESLIGADO por padrão
      if (!BRISA_COLD_OUTREACH_ENABLED) {
        log(`ℹ️ [ENVIO FRIO DESLIGADO] BRISA_COLD_OUTREACH_ENABLED=false. O agente está dormindo em segurança sem enviar mensagens. Aguardando 60s...`);
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }

      // 0.1 VERIFICAÇÃO DE CONEXÃO EVOLUTION API
      const connState = await checkInstanceStatus();
      if (connState !== 'open') {
        log(`⚠️ [EVOLUTION DESCONECTADO] Status da instância '${INSTANCE}': ${connState}. Aguardando conexão aberta...`);
        await new Promise(r => setTimeout(r, 15000));
        continue;
      }

      // 1. Pausa global pelo Admin?
      if (isGlobalPauseActive()) {
        log(`🛑 [PAUSA ATIVA] Automação pausada globalmente pelo Admin via PAUSE_AUTOMATION.flag. Aguardando 15s...`);
        await new Promise(r => setTimeout(r, 15000));
        continue;
      }

      // 2. Janela de horário comercial (09h às 18h, Seg-Sex)?
      if (!isWithinBusinessHours()) {
        log(`🌙 [FORA DO HORÁRIO PERMITIDO] Envios frios são proibidos fora do horário comercial (09h-18h, Seg-Sex). Dormindo por 15 minutos...`);
        await new Promise(r => setTimeout(r, 15 * 60 * 1000));
        continue;
      }

      log(`🔎 Buscando próximo médico elegível no Brevo (Offset atual: ${state.lastOffset})...`);
      const { count, contacts } = await fetchBrevoContacts(state.lastOffset, 50);

      if (!contacts || contacts.length === 0) {
        log(`ℹ️ Chegamos ao fim da lista no offset ${state.lastOffset}. Reiniciando em 1 hora...`);
        state.lastOffset = 0;
        saveState(state);
        await new Promise(r => setTimeout(r, 60 * 60 * 1000));
        continue;
      }

      let candidateFound = null;
      const humanLocked = loadHumanLocked();
      const blacklist = loadBlacklist();

      for (const contact of contacts) {
        const rawPhone = contact.attributes?.WHATSAPP || contact.attributes?.SMS || contact.attributes?.PHONE;
        const validPhone = normalizeValidBrazilianMobile(rawPhone);
        const email = (contact.email || '').toLowerCase().trim();
        const rawName = contact.attributes?.NOME || contact.attributes?.FIRSTNAME || contact.email?.split('@')[0];
        const specialty = contact.attributes?.SPECIALTY || '';

        if (!validPhone) continue;

        // A. Está na blacklist de opt-out (pediu para não enviar)?
        if (blacklist.has(validPhone) || (email && blacklist.has(email))) {
          continue;
        }

        // B. Contato em atendimento humano ou pausado?
        if (humanLocked.has(validPhone) || humanLocked.has(validPhone.slice(2))) {
          continue;
        }

        // C. Já está cadastrado na nossa vitrine?
        if (knownPhones.has(validPhone) || knownNames.has(rawName.toLowerCase().trim())) {
          continue;
        }

        // D. Já foi contactado via WhatsApp por este agente?
        if (state.invitedPhones[validPhone] || (email && state.invitedEmails[email])) {
          continue;
        }

        // E. Filtro de exclusão: veterinários, dentistas, psicólogos, clínicas/empresas
        const exclusion = isExcludedAudience(rawName, email, specialty);
        if (exclusion.excluded) {
          log(`🚫 Contato descartado [${exclusion.reason}]: "${rawName}" (${validPhone})`);
          state.invitedPhones[validPhone] = {
            name: rawName,
            excluded: true,
            reason: exclusion.reason,
            date: new Date().toISOString()
          };
          saveState(state);
          continue;
        }

        // Candidato legítimo encontrado!
        candidateFound = {
          name: rawName,
          phone: validPhone,
          email
        };
        break;
      }

      if (!candidateFound) {
        state.lastOffset += contacts.length;
        saveState(state);
        log(`⏩ Todos os contatos deste lote já foram processados. Avançando para o próximo lote (offset ${state.lastOffset})...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      log(`🎯 Médico selecionado: Dr(a). ${candidateFound.name} (+${candidateFound.phone})`);
      const msg = buildInvitationMessage(candidateFound.name);

      let sentSuccessfully = false;
      try {
        await sendWhatsApp(candidateFound.phone, msg);
        log(`✅ Convite enviado com sucesso para Dr(a). ${candidateFound.name} (+${candidateFound.phone})!`);

        state.totalInvited++;
        state.invitedPhones[candidateFound.phone] = {
          name: candidateFound.name,
          email: candidateFound.email,
          invited_at: new Date().toISOString()
        };
        if (candidateFound.email) {
          state.invitedEmails[candidateFound.email] = new Date().toISOString();
        }
        saveState(state);
        log(`📊 Total de médicos convidados acumulado: ${state.totalInvited}`);
        sentSuccessfully = true;

      } catch (sendErr) {
        const isConnErr = sendErr.message.includes('Connection Closed') || sendErr.message.includes('500') || sendErr.message.includes('ECONNREFUSED');
        if (isConnErr) {
          log(`⚠️ [EVOLUTION INSTABILIDADE] Conexão caiu durante envio para ${candidateFound.phone}: ${sendErr.message}. Contato NÃO descartado. Aguardando 30s...`);
          await new Promise(r => setTimeout(r, 30000));
        } else {
          log(`❌ Falha no envio para ${candidateFound.phone}: ${sendErr.message}`);
          state.invitedPhones[candidateFound.phone] = {
            name: candidateFound.name,
            email: candidateFound.email,
            failed: true,
            error: sendErr.message,
            attempted_at: new Date().toISOString()
          };
          saveState(state);
        }
      }

      if (sentSuccessfully) {
        const waitMs = getRandomCadenceMs();
        log(`⏳ Convite entregue! Pausa com jitter de ${Math.round(waitMs / 60000)} minutos até o próximo disparo...`);
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        log(`⏩ Tentativa falhou. Buscando próximo candidato em 5 segundos...`);
        await new Promise(r => setTimeout(r, 5000));
      }

    } catch (loopErr) {
      log(`⚠️ Erro no ciclo de convites: ${loopErr.message}`);
      await new Promise(r => setTimeout(r, 60000));
    }
  }
}

run().catch(console.error);
