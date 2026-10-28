/**
 * scripts/agent_partner_meeting_scheduler.mjs
 * 
 * MÓDULO 3: AGENTE AGENDADOR DE REUNIÕES E QUALIFICAÇÃO DE PARCEIROS
 * Plataforma Planta y Raíz Ltda (plantayraiz.com.br)
 * 
 * Funcionalidades:
 * 1. Detecção automática de intenção de agendamento em DMs, WhatsApp e E-mails ("quero conversar", "agendar", "parceria", "reunião").
 * 2. Envio instantâneo do link de agendamento oficial da Diretoria Técnica:
 *    https://plantayraiz.com.br/reuniao-parceiros
 * 3. Coleta de Dados de Pré-Qualificação:
 *    - Médicos: CRM, UF, Especialidade, Volume estimado de pacientes/mês.
 *    - Farmácias: Razão Social, CNPJ, Estado, Portfólio RDC 660/327.
 * 4. Disparo de Lembretes Automáticos via WhatsApp (Evolution API):
 *    - Lembrete 24h antes da reunião (confirmação de pauta).
 *    - Lembrete 1h antes da reunião (link direto do Google Meet).
 * 5. Registro centralizado em partner_meetings_registry.json com show-up tracking.
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_FILE = path.join(__dirname, 'partner_meetings_registry.json');
const LOG_FILE = path.join(__dirname, 'partner_meeting_scheduler.log');

const EVO_BASE_URL = process.env.EVOLUTION_API_BASE_URL || 'https://whatsapp.plantayraiz.com.br';
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'plantayraiz';
const EVO_API_KEY = process.env.EVOLUTION_API_KEY || 'BrisaLiveKey2026PlantaRaiz';

const MEETING_CALENDAR_URL = 'https://plantayraiz.com.br/reuniao-parceiros';

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [SCHEDULER] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (_) {}
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function loadRegistry() {
  if (fs.existsSync(REGISTRY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
    } catch (_) {}
  }
  return {
    meetings: [],
    metrics: {
      totalBooked: 0,
      reminders24hSent: 0,
      reminders1hSent: 0,
      completed: 0
    }
  };
}

const registry = loadRegistry();

function saveRegistry() {
  try {
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf8');
  } catch (_) {}
}

// ─── Disparo de Mensagem WhatsApp via Evolution API ───
async function sendWhatsAppMessage(phone, messageText) {
  let cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!cleanPhone) return false;
  if (!cleanPhone.startsWith('55')) cleanPhone = `55${cleanPhone}`;

  const url = `${EVO_BASE_URL}/message/sendText/${EVO_INSTANCE}`;
  const payload = {
    number: cleanPhone,
    text: messageText,
    options: { delay: 1200, presence: 'composing' }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      log(`📲 WhatsApp enviado com sucesso para ${cleanPhone}`);
      return true;
    } else {
      const err = await res.text();
      log(`⚠️ Falha ao enviar WhatsApp para ${cleanPhone}: ${err.slice(0, 100)}`);
    }
  } catch (e) {
    log(`❌ Erro de conexão Evolution API: ${e.message}`);
  }
  return false;
}

// ─── Identificação de Intenção e Resposta Automática ───
export function detectMeetingIntent(text) {
  const lower = String(text || '').toLowerCase();
  const triggers = [
    'quero conversar', 'quero falar', 'como funciona', 'tenho interesse',
    'agendar', 'reunião', 'reuniao', 'apresentação', 'apresentacao',
    'falar com a diretoria', 'parceria comercial', 'meet', 'google meet'
  ];
  return triggers.some(t => lower.includes(t));
}

export async function handlePartnerMeetingInquiry(partnerData) {
  const { name, phone, email, persona, message } = partnerData;
  log(`🎯 Nova intenção de parceria detectada: ${name} (${persona || 'Geral'}) - Tel: ${phone || email}`);

  const isDoctor = persona === 'medico' || (message && (message.includes('crm') || message.includes('médic')));
  const isPharmacy = persona === 'farmacia' || (message && (message.includes('farmácia') || message.includes('dispensário')));

  let responseText = '';
  if (isDoctor) {
    responseText = `Olá, Dr(a). ${name}! Que excelente iniciativa.\n\nSerá um prazer apresentar o modelo de Consultório Virtual com Taxa Zero, repasse via PIX e o Plano VIP por R$ 99/mês.\n\n📅 Escolha o melhor dia e horário na nossa agenda oficial de 15 minutos: ${MEETING_CALENDAR_URL}?tipo=medico\n\nNossa coordenação médica aguarda você! 🌿`;
  } else if (isPharmacy) {
    responseText = `Olá, ${name}! Agradecemos o interesse em integrar o catálogo da sua empresa ao ecossistema Planta y Raíz.\n\n📅 Agende a reunião de homologação de 15 minutos com nossa Diretoria Técnica: ${MEETING_CALENDAR_URL}?tipo=farmacia\n\nNesta conversa alinhamos o fluxo regulatório (RDC 660 / RDC 327) e a conexão com os médicos prescritores! 🌿`;
  } else {
    responseText = `Olá, ${name}! Ficamos muito felizes com seu contato.\n\n📅 Para alinharmos nossa parceria, escolha o melhor horário na agenda oficial: ${MEETING_CALENDAR_URL}\n\nAté breve! 🌿`;
  }

  if (phone) {
    await sendWhatsAppMessage(phone, responseText);
  }

  return responseText;
}

// ─── Registro e Agendamento de Reunião ───
export function registerScheduledMeeting(meetingInfo) {
  const id = `meet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const record = {
    id,
    name: meetingInfo.name || 'Parceiro',
    phone: meetingInfo.phone || '',
    email: meetingInfo.email || '',
    persona: meetingInfo.persona || 'medico', // 'medico' | 'farmacia'
    meetingTime: meetingInfo.meetingTime, // ISO string
    meetUrl: meetingInfo.meetUrl || 'https://meet.google.com/pyn-rtzm-plz',
    documentNumber: meetingInfo.documentNumber || '', // CRM ou CNPJ
    stateUf: meetingInfo.stateUf || 'SP',
    monthlyVolume: meetingInfo.monthlyVolume || '',
    reminders: {
      sent24h: false,
      sent1h: false
    },
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };

  registry.meetings.push(record);
  registry.metrics.totalBooked++;
  saveRegistry();
  log(`📅 Reunião registrada: ${record.name} (${record.persona}) em ${record.meetingTime}`);
  return record;
}

// ─── Motor de Lembretes Automáticos (24h e 1h antes) ───
export async function checkAndSendMeetingReminders() {
  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  for (const m of registry.meetings) {
    if (m.status !== 'scheduled') continue;
    const meetingTs = new Date(m.meetingTime).getTime();
    if (isNaN(meetingTs)) continue;

    const diff = meetingTs - now;

    // Lembrete de 24h (entre 23h e 25h antes da reunião)
    if (diff > 0 && diff <= TWENTY_FOUR_HOURS_MS && diff > (TWENTY_FOUR_HOURS_MS - 2 * ONE_HOUR_MS) && !m.reminders.sent24h) {
      if (m.phone) {
        const text24h = `Olá, ${m.name}! 🌿 Lembramos que nossa reunião de alinhamento estratégico na *Planta y Raíz* está agendada para amanhã, às ${new Date(m.meetingTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.\n\nLink do Google Meet: ${m.meetUrl}\n\nCaso precise remarcar, por favor nos avise por aqui com antecedência. Nos vemos amanhã!`;
        const sent = await sendWhatsAppMessage(m.phone, text24h);
        if (sent) {
          m.reminders.sent24h = true;
          registry.metrics.reminders24hSent++;
          saveRegistry();
          log(`🔔 Lembrete 24h enviado para ${m.name} (${m.phone})`);
        }
      }
    }

    // Lembrete de 1h (entre 10 min e 70 min antes da reunião)
    if (diff > 0 && diff <= ONE_HOUR_MS && !m.reminders.sent1h) {
      if (m.phone) {
        const text1h = `Olá, ${m.name}! 🚀 Nossa reunião na *Planta y Raíz* começa em instantes!\n\n👉 Acesse a sala pelo Google Meet: ${m.meetUrl}\n\nNossa diretoria já está pronta para receber você! 🌿`;
        const sent = await sendWhatsAppMessage(m.phone, text1h);
        if (sent) {
          m.reminders.sent1h = true;
          registry.metrics.reminders1hSent++;
          saveRegistry();
          log(`🔔 Lembrete 1h enviado para ${m.name} (${m.phone})`);
        }
      }
    }
  }
}

// Loop contínuo quando executado como microsserviço
async function startDaemon() {
  log("🚀 [MÓDULO 3] Agente Agendador de Reuniões & Qualificação Ativo 24/7");
  while (true) {
    try {
      await checkAndSendMeetingReminders();
    } catch (e) {
      log(`⚠️ Erro no ciclo de lembretes: ${e.message}`);
    }
    // Verifica a cada 10 minutos
    await sleep(10 * 60 * 1000);
  }
}

if (process.argv[1] && process.argv[1].endsWith('agent_partner_meeting_scheduler.mjs')) {
  startDaemon().catch(err => {
    log(`🔥 Erro crítico: ${err.message}`);
    process.exit(1);
  });
}
