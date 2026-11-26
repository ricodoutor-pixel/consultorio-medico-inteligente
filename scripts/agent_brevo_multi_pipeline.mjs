/**
 * scripts/agent_brevo_multi_pipeline.mjs
 *
 * 🌿 Planta y Raiz — Agente de E-mail Institucional para Médicos (Brevo API v3)
 * Reativado por autorização expressa do Dr. Edilson em 26/11/2026.
 *
 * Regras estritas de segurança e governança:
 * - Cota diária: 300 e-mails/dia via Brevo API (reset diário pelo calendário de Brasília)
 * - Janela estrita: Segunda a Sábado, 09h às 19h BRT (America/Sao_Paulo)
 * - Cadência suave: 1 e-mail a cada 2 minutos (300 e-mails em 10h úteis, zero rajadas)
 * - Trava PID exclusiva (rejeita instâncias sobrepostas)
 * - Bloqueio rigoroso de PJ/empresas/clínicas/não-médicos (isCompanyOrNonDoctorContact)
 * - Jamais prefixa "Dr(a)." sem CRM confirmado (saudação neutra para leads sem CRM)
 * - Verificação anti-bounce (sintaxe, DNS MX, blacklist local/Brevo) e bloqueio de frases proibidas
 * - Proteção automática contra bloqueio Brevo (554 / 401 / 403): pausa 60 min sem desperdiçar leads
 * - Rodapé obrigatório de descadastro/opt-out (LGPD)
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  verifyEmailDeliverability,
  addEmailToBouncedBlacklist,
  logEmailSendInSupabase,
  syncLeadToOfficialSupabase,
} from './lib/email_validator.mjs';
import {
  isBusinessHoursBRT,
  isCompanyOrNonDoctorContact,
  hasConfirmedCrm,
  formatDoctorAddressing,
} from '../supabase/functions/_shared/whatsapp-outreach-guard.mjs';
import {
  FORBIDDEN_PHRASES,
  TECH_SUPERVISOR,
  DOCTOR_SIGNUP_LINK,
} from '../supabase/functions/_shared/brisa-templates.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, 'brevo_multi_pipeline_state.json');
const LOG_FILE = path.join(__dirname, 'brevo_multi_pipeline.log');
const PID_LOCK_FILE = path.join(__dirname, 'brevo_multi_pipeline.pid.lock');
const OPTOUT_BLACKLIST_FILE = path.join(__dirname, 'evolution_optout_blacklist.json');
const PAUSE_GLOBAL_FILE = path.join(__dirname, 'PAUSE_AUTOMATION.flag');

const BREVO_KEY = process.env.BREVO_API_KEY || '';
const SMTP_USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const BREVO_LIST_MEDICOS = Number(process.env.BREVO_LIST_MEDICOS || 6);

const CADENCE_STEP_MS = 48 * 60 * 60 * 1000; // 48 horas entre etapas da régua
export const DAILY_BREVO_LIMIT = Math.min(
  300,
  Math.max(1, Number(process.env.BREVO_DAILY_LIMIT || 300)),
);
// 10h úteis (09h–19h BRT = 600 min) / 300 e-mails = 1 e-mail a cada 2 minutos (120s)
export const CADENCE_MS = Math.max(
  60 * 1000,
  Number(process.env.BREVO_CADENCE_MS || 2 * 60 * 1000),
);
const BREVO_BLOCKED_BACKOFF_MS = 60 * 60 * 1000; // 60 min se Brevo responder 554 / 401 / 403

function getBrasiliaDateKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [BREVO-300/DIA] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (_) {}
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function acquirePidLock() {
  try {
    const fd = fs.openSync(PID_LOCK_FILE, 'wx');
    fs.writeFileSync(fd, String(process.pid));
    fs.closeSync(fd);
    return true;
  } catch (err) {
    if (err?.code !== 'EEXIST') return false;
    try {
      const oldPid = Number(fs.readFileSync(PID_LOCK_FILE, 'utf8').trim());
      if (oldPid && oldPid !== process.pid) {
        try {
          process.kill(oldPid, 0);
          log(`🛑 [PID-LOCK] Outra instância já ativa (PID ${oldPid}). Encerrando duplicata.`);
          return false;
        } catch (_) {
          fs.unlinkSync(PID_LOCK_FILE);
          const fd = fs.openSync(PID_LOCK_FILE, 'wx');
          fs.writeFileSync(fd, String(process.pid));
          fs.closeSync(fd);
          return true;
        }
      }
    } catch (_) {}
    return false;
  }
}

function releasePidLock() {
  try {
    if (fs.existsSync(PID_LOCK_FILE)) {
      const pidInFile = Number(fs.readFileSync(PID_LOCK_FILE, 'utf8').trim());
      if (pidInFile === process.pid) {
        fs.unlinkSync(PID_LOCK_FILE);
      }
    }
  } catch (_) {}
}

function loadOptOutSet() {
  try {
    if (fs.existsSync(OPTOUT_BLACKLIST_FILE)) {
      const raw = JSON.parse(fs.readFileSync(OPTOUT_BLACKLIST_FILE, 'utf8'));
      if (Array.isArray(raw)) {
        return new Set(raw.map(v => String(v || '').trim().toLowerCase()));
      }
    }
  } catch (_) {}
  return new Set();
}

function loadState() {
  const todayBrt = getBrasiliaDateKey();
  const defaultState = {
    startedAt: new Date().toISOString(),
    dailyBrevoCount: 0,
    dailyBrevoResetAt: todayBrt,
    brevoListOffset: 0,
    lastProviderBlockedAt: null,
    lastProviderBlockedReason: null,
    pipelineProgress: {}, // email -> { persona: 'medico', step: 1|2|3, lastSentAt: ts, completed: bool }
    metrics: {
      step1Sent: 0,
      step2Sent: 0,
      step3Sent: 0,
      totalUniqueSent: 0,
      skippedPjOrNonDoctor: 0,
      errors: 0,
    },
  };

  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (data.dailyBrevoResetAt !== todayBrt) {
        data.dailyBrevoCount = 0;
        data.dailyBrevoResetAt = todayBrt;
      }
      return {
        ...defaultState,
        ...data,
        metrics: { ...defaultState.metrics, ...(data.metrics || {}) },
        pipelineProgress: data.pipelineProgress || {},
      };
    } catch (_) {}
  }
  return defaultState;
}

const state = loadState();

function refreshDailyQuotaIfNeeded() {
  const todayBrt = getBrasiliaDateKey();
  if (state.dailyBrevoResetAt !== todayBrt) {
    state.dailyBrevoCount = 0;
    state.dailyBrevoResetAt = todayBrt;
    saveState();
  }
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (_) {}
}

function containsForbiddenCopy(text = '') {
  const str = String(text || '');
  for (const re of [...FORBIDDEN_PHRASES, /\bs[oó]ci[oa](?:\(a\)|s)?\b/i]) {
    if (re.test(str)) return String(re);
  }
  return null;
}

function escapeHtml(str = '') {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const LEGAL_FOOTER_HTML = `
  <tr>
    <td style="padding: 18px 30px; background-color: #0d1610; border-top: 1px solid #1f3a2b; font-size: 11.5px; color: #94a3b8; text-align: center; line-height: 1.5;">
      <p style="margin: 0 0 6px 0;"><strong>Planta y Raiz</strong> · Bezerra Med Soluções Integradas Ltda. · CNPJ 30.740.319/0001-14</p>
      <p style="margin: 0 0 6px 0;">Supervisão técnica da Orientação Técnica: ${TECH_SUPERVISOR} · WhatsApp oficial: (11) 99136-3154</p>
      <p style="margin: 0;">Contato profissional obtido em diretórios públicos de saúde (LGPD). Se não desejar mais receber nossos e-mails, responda <strong>SAIR</strong> que removeremos seu endereço imediatamente.</p>
    </td>
  </tr>`;

/**
 * Monta assunto, HTML e texto plano da etapa (1, 2 ou 3) aplicando filtro PJ e
 * regra estrita de CRM confirmado (jamais prefixa "Dr(a)." sem CRM confirmado).
 */
export function buildDoctorEmailForStep(doc = {}, step = 1) {
  const crmConfirmed = Boolean(doc.crmConfirmed) || hasConfirmedCrm(
    doc.crm || '',
    doc.uf || doc.state || doc.crm_state || '',
    doc.council_type || doc.councilType || '',
  );
  const addressing = formatDoctorAddressing({
    name: doc.name || '',
    crm: doc.crm || '',
    crmState: doc.uf || doc.state || doc.crm_state || '',
    councilType: doc.council_type || doc.councilType || '',
    crmConfirmed,
    email: doc.email || '',
    specialty: doc.specialty || '',
    company: doc.company || '',
  });
  if (!addressing.allowed) {
    return { allowed: false, reason: addressing.reason };
  }

  const salutation = addressing.salutation || '';
  const greetingHtml = salutation ? `Olá, ${escapeHtml(salutation)},` : 'Olá,';
  const greetingText = salutation ? `Olá, ${salutation},` : 'Olá,';
  const subjectPrefix = salutation ? `${salutation}, ` : '';

  let subject = '';
  let htmlContent = '';
  let textContent = '';

  if (step === 1) {
    subject = `${subjectPrefix}conheça o Consultório Virtual Planta y Raiz (repasse de 93% via PIX)`;
    htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Consultório Virtual com 93% de Repasse | Planta y Raiz</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b130e; margin: 0; padding: 24px 0; color: #e2e8f0; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #121e16; border-radius: 14px; overflow: hidden; border: 1px solid #1f3a2b;">
    <tr>
      <td style="background: linear-gradient(135deg, #064e3b 0%, #121e16 100%); padding: 28px 30px; text-align: center; border-bottom: 1px solid #1f3a2b;">
        <span style="background-color: rgba(16,185,129,0.2); color: #6ee7b7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px;">Etapa 1 de 3 · Credenciamento Profissional</span>
        <h1 style="color: #10b981; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">Planta y Raiz</h1>
        <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">Consultório Virtual · Telemedicina e Prescrição Digital CFM</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">${greetingHtml}</p>
        <p style="font-size: 14.5px; color: #cbd5e1;">Convidamos você a conhecer a plataforma <strong>Planta y Raiz</strong>: consultório virtual completo para médicos com CRM ativo, com <strong>cadastro gratuito</strong>, vídeo integrado, prontuário eletrônico e receita digital.</p>
        <p style="font-size: 14.5px; color: #cbd5e1;">Em todos os planos, o médico recebe <strong>93% de cada consulta via PIX</strong> (taxa fixa de 7% da plataforma).</p>
        <div style="background-color: #172a1e; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <strong style="color: #34d399; font-size: 14px;">Prontuário CFM e Assinatura Digital ICP-Brasil / Gov.br</strong>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Publique seus próprios horários, receba pacientes após triagem educativa inicial da Enfª Brisa (assistente virtual) e emita receitas, atestados e pedidos de exames direto na plataforma.</p>
        </div>
        <div style="text-align: center; margin: 26px 0;">
          <a href="${DOCTOR_SIGNUP_LINK}?utm_source=brevo_email&utm_medium=email_medicos&utm_campaign=regua_step1" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #042f2e; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 30px; border-radius: 8px; display: inline-block; text-transform: uppercase;">Conhecer e Cadastrar Grátis →</a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; text-align: center;">Veja também a vitrine e os planos em <a href="https://www.plantayraiz.com.br/precos?utm_source=brevo_email&utm_medium=email_medicos&utm_campaign=regua_step1" style="color: #34d399; text-decoration: underline;">www.plantayraiz.com.br/precos</a>.</p>
      </td>
    </tr>
    ${LEGAL_FOOTER_HTML}
  </table>
</body></html>`;
    textContent = `${greetingText}\n\nConvidamos você a conhecer a Planta y Raiz: consultório virtual com vídeo, prontuário eletrônico CFM e receita digital. Cadastro gratuito e repasse de 93% de cada consulta via PIX (taxa fixa de 7% da plataforma).\n\nSaiba mais e cadastre-se em: ${DOCTOR_SIGNUP_LINK}?utm_source=brevo_email&utm_medium=email_medicos&utm_campaign=regua_step1\n\nSe não quiser mais receber e-mails, responda SAIR.\n— Enfª Brisa, assistente virtual · Planta y Raiz`;
  } else if (step === 2) {
    subject = `${subjectPrefix}Biblioteca Científica e Copiloto Clínico na Planta y Raiz`;
    htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Biblioteca Científica e Copiloto Clínico | Planta y Raiz</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b130e; margin: 0; padding: 24px 0; color: #e2e8f0; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #121e16; border-radius: 14px; overflow: hidden; border: 1px solid #1f3a2b;">
    <tr>
      <td style="background: linear-gradient(135deg, #064e3b 0%, #121e16 100%); padding: 28px 30px; text-align: center; border-bottom: 1px solid #1f3a2b;">
        <span style="background-color: rgba(16,185,129,0.2); color: #6ee7b7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px;">Etapa 2 de 3 · Apoio Científico ao Médico</span>
        <h1 style="color: #10b981; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">Biblioteca Científica Planta y Raiz</h1>
        <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">Busca em Literatura Indexada (PubMed/NCBI) e Escriba SOAP</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">${greetingHtml}</p>
        <p style="font-size: 14.5px; color: #cbd5e1;">Na <strong>Planta y Raiz</strong>, médicos credenciados têm acesso a ferramentas de apoio à decisão clínica (sem substituir a autonomia médica), incluindo busca estruturada em literatura clínica indexada (PubMed/NCBI) e rascunho de prontuário SOAP com consentimento do paciente:</p>
        <ul style="font-size: 14px; color: #e2e8f0; padding-left: 18px;">
          <li style="margin-bottom: 6px;">Dor crônica, fibromialgia e condições neurológicas</li>
          <li style="margin-bottom: 6px;">Ansiedade, distúrbios do sono e saúde mental integrativa</li>
          <li style="margin-bottom: 6px;">Acompanhamento clínico com prontuário estruturado e prescrição digital</li>
        </ul>
        <div style="text-align: center; margin: 26px 0;">
          <a href="https://www.plantayraiz.com.br/biblioteca?utm_source=brevo_email&utm_medium=email_medicos&utm_campaign=regua_step2" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #042f2e; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 30px; border-radius: 8px; display: inline-block; text-transform: uppercase;">Explorar a Biblioteca Científica →</a>
        </div>
      </td>
    </tr>
    ${LEGAL_FOOTER_HTML}
  </table>
</body></html>`;
    textContent = `${greetingText}\n\nConheça a Biblioteca Científica e o Consultório Virtual da Planta y Raiz: busca em literatura clínica indexada (PubMed/NCBI), prontuário SOAP e prescrição digital.\n\nAcesse: https://www.plantayraiz.com.br/biblioteca?utm_source=brevo_email&utm_medium=email_medicos&utm_campaign=regua_step2\n\nSe não quiser mais receber e-mails, responda SAIR.\n— Enfª Brisa, assistente virtual · Planta y Raiz`;
  } else {
    subject = `${subjectPrefix}planos opcionais para médicos na Planta y Raiz (a partir de R$ 99/mês)`;
    htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Planos para Médicos | Planta y Raiz</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b130e; margin: 0; padding: 24px 0; color: #e2e8f0; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #121e16; border-radius: 14px; overflow: hidden; border: 1px solid #1f3a2b;">
    <tr>
      <td style="background: linear-gradient(135deg, #78350f 0%, #121e16 100%); padding: 28px 30px; text-align: center; border-bottom: 1px solid #1f3a2b;">
        <span style="background-color: rgba(245,158,11,0.25); color: #fde68a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px;">Etapa 3 de 3 · Planos Opcionais</span>
        <h1 style="color: #fbbf24; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">Planos Médicos Planta y Raiz</h1>
        <p style="color: #fde68a; margin: 4px 0 0 0; font-size: 13px;">Cadastro Gratuito ou Planos com Prioridade na Fila e Ferramentas de IA</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">${greetingHtml}</p>
        <p style="font-size: 14.5px; color: #cbd5e1;">Você pode atuar no <strong>Plano Gratuito</strong> ou escolher um plano opcional a partir de <strong>R$ 99/mês (Premium)</strong> para ter prioridade na fila de consultas e limites ampliados no Copiloto Clínico e no Escriba:</p>
        <div style="background-color: #172a1e; border: 1px solid #f59e0b; border-radius: 10px; padding: 18px; margin: 20px 0;">
          <ul style="margin: 0; padding-left: 18px; font-size: 13.5px; color: #fde68a;">
            <li style="margin-bottom: 8px;"><strong>Repasse padrão de 93% via PIX</strong> (taxa fixa de 7% da plataforma em todos os planos).</li>
            <li style="margin-bottom: 8px;"><strong>Prioridade na fila de atendimento</strong> conforme o plano escolhido, após aprovação manual de CRM e KYC.</li>
            <li><strong>Ferramentas de apoio clínico:</strong> Copiloto científico com citações PubMed verificadas e Escriba SOAP.</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 26px 0;">
          <a href="https://www.plantayraiz.com.br/precos?utm_source=brevo_email&utm_medium=email_medicos&utm_campaign=regua_step3" target="_blank" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0f172a; text-decoration: none; font-size: 15px; font-weight: 900; padding: 14px 30px; border-radius: 8px; display: inline-block; text-transform: uppercase;">Ver Planos e Cadastrar →</a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; text-align: center;">Dúvidas? Fale pelo WhatsApp oficial: <a href="https://wa.me/5511991363154" style="color: #34d399; text-decoration: underline;">(11) 99136-3154</a></p>
      </td>
    </tr>
    ${LEGAL_FOOTER_HTML}
  </table>
</body></html>`;
    textContent = `${greetingText}\n\nNa Planta y Raiz você pode começar gratuitamente ou escolher um plano opcional a partir de R$ 99/mês com prioridade na fila e ferramentas de IA (Copiloto e Escriba). Em todos os planos, o repasse é de 93% de cada consulta via PIX (taxa fixa de 7%).\n\nVeja os detalhes em: https://www.plantayraiz.com.br/precos?utm_source=brevo_email&utm_medium=email_medicos&utm_campaign=regua_step3\n\nSe não quiser mais receber e-mails, responda SAIR.\n— Enfª Brisa, assistente virtual · Planta y Raiz`;
  }

  for (const field of [subject, htmlContent, textContent]) {
    const hit = containsForbiddenCopy(field);
    if (hit) {
      return { allowed: false, reason: `FORBIDDEN_COPY_BLOCKED:${hit}` };
    }
  }

  return { allowed: true, crmConfirmed, salutation, subject, htmlContent, textContent };
}

// ─── Envio Exclusivo via Brevo API Verificada (300/dia) ───
async function sendTransactionalEmail(toEmail, toName, subject, htmlContent, textContent) {
  refreshDailyQuotaIfNeeded();

  if (!isBusinessHoursBRT()) {
    return { ok: false, error: 'OUTSIDE_BUSINESS_HOURS_BRT', retryable: true };
  }
  if (!BREVO_KEY) {
    return { ok: false, error: 'BREVO_API_KEY ausente', providerBlocked: true, retryable: true };
  }
  if (state.dailyBrevoCount >= DAILY_BREVO_LIMIT) {
    return { ok: false, error: 'DAILY_QUOTA_REACHED', retryable: true };
  }

  for (const field of [subject, htmlContent, textContent]) {
    const hit = containsForbiddenCopy(field);
    if (hit) {
      return { ok: false, error: `FORBIDDEN_COPY_BLOCKED:${hit}`, permanent: true };
    }
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': BREVO_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Planta y Raiz · Credenciamento Médico', email: SMTP_USER },
        to: [{ email: toEmail, name: toName || toEmail }],
        replyTo: { email: SMTP_USER, name: 'Planta y Raiz · Atendimento' },
        subject,
        htmlContent,
        textContent,
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      state.dailyBrevoCount++;
      state.lastProviderBlockedAt = null;
      state.lastProviderBlockedReason = null;
      saveState();
      await logEmailSendInSupabase({
        email: toEmail,
        templateName: 'brevo_multi_pipeline',
        status: 'sent',
        messageId: data.messageId || null,
        metadata: { doctor_name: toName, subject },
      });
      return { ok: true, provider: 'Brevo API', messageId: data.messageId };
    }

    const errText = await res.text();
    log(`⚠️ Brevo HTTP ${res.status}: ${errText.slice(0, 180)}`);

    // Detecta bloqueio da conta Brevo (554 Outbound sending disabled / 401 / 403 / 429)
    const isProviderBlocked =
      res.status === 401 ||
      res.status === 403 ||
      res.status === 429 ||
      /554|outbound sending disabled|account.*suspended|not activated|quota/i.test(errText);

    if (isProviderBlocked) {
      state.lastProviderBlockedAt = new Date().toISOString();
      state.lastProviderBlockedReason = `HTTP ${res.status}: ${errText.slice(0, 140)}`;
      saveState();
      return {
        ok: false,
        providerBlocked: true,
        retryable: true,
        error: state.lastProviderBlockedReason,
      };
    }

    if (res.status === 400) {
      addEmailToBouncedBlacklist(toEmail, `brevo_400_${errText.slice(0, 60)}`);
    }
    state.metrics.errors++;
    saveState();
    await logEmailSendInSupabase({
      email: toEmail,
      templateName: 'brevo_multi_pipeline',
      status: res.status === 400 ? 'suppressed' : 'failed',
      errorMessage: `HTTP ${res.status}: ${errText.slice(0, 120)}`,
    });
    return { ok: false, error: `Brevo HTTP ${res.status}`, permanent: res.status === 400 };
  } catch (e) {
    state.metrics.errors++;
    saveState();
    return { ok: false, error: e.message, retryable: true };
  }
}

async function fetchAdditionalBrevoDoctors(limit = 100) {
  if (!BREVO_KEY) return [];
  try {
    const offset = state.brevoListOffset || 0;
    const res = await fetch(
      `https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_MEDICOS}/contacts?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'api-key': BREVO_KEY,
          accept: 'application/json',
        },
      },
    );
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    const contacts = Array.isArray(data.contacts) ? data.contacts : [];
    if (contacts.length > 0) {
      state.brevoListOffset = offset + contacts.length;
      saveState();
    }
    return contacts
      .filter((c) => !c.emailBlacklisted && c.email)
      .map((c) => ({
        name: c.attributes?.NOME || c.attributes?.FIRSTNAME || '',
        email: String(c.email || '').trim().toLowerCase(),
        phone: c.attributes?.WHATSAPP || c.attributes?.SMS || c.attributes?.PHONE || '',
        specialty: c.attributes?.SPECIALTY || '',
        crm: c.attributes?.CRM || '',
        uf: c.attributes?.UF || '',
      }));
  } catch (_) {
    return [];
  }
}

// ─── Motor da Régua Brevo 300/dia ───
export async function runMultiPipelineBatch(maxPerRun = 1) {
  refreshDailyQuotaIfNeeded();

  if (fs.existsSync(PAUSE_GLOBAL_FILE)) {
    log('🛑 [PAUSA ATIVA] Automação pausada globalmente via PAUSE_AUTOMATION.flag.');
    return { processed: 0, paused: true };
  }
  if (!isBusinessHoursBRT()) {
    log('🌙 [FORA DO HORÁRIO COMERCIAL] Disparos Brevo permitidos apenas Seg–Sáb, 09h–19h BRT.');
    return { processed: 0, outsideBusinessHours: true };
  }
  if (state.dailyBrevoCount >= DAILY_BREVO_LIMIT) {
    log(`✅ Cota diária Brevo atingida (${state.dailyBrevoCount}/${DAILY_BREVO_LIMIT} hoje em BRT). Aguardando próximo dia útil.`);
    return { processed: 0, quotaReached: true };
  }

  const candidateFiles = [
    path.join(__dirname, 'unregistered_doctors_leads.json'),
    path.join(__dirname, 'clinicos_gerais_pos2020_leads.json'),
    path.join(__dirname, 'prescritores_master_list.json'),
  ];

  const rawDoctors = [];
  for (const f of candidateFiles) {
    if (!fs.existsSync(f)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (Array.isArray(parsed)) rawDoctors.push(...parsed);
    } catch (_) {}
  }

  const doctorMap = new Map();
  for (const doc of rawDoctors) {
    const email = String(doc.email || '').trim().toLowerCase();
    if (email && email.includes('@') && !email.includes('example.com') && !email.includes('teste') && !email.endsWith('.fake')) {
      if (!doctorMap.has(email)) doctorMap.set(email, doc);
    }
  }

  const optOutSet = loadOptOutSet();
  let allDoctors = Array.from(doctorMap.values());

  // Se todos os leads locais elegíveis já estiverem em espera/concluídos, busca lote da Lista 6 da Brevo
  const hasPendingLocal = allDoctors.some((doc) => {
    const email = doc.email.toLowerCase().trim();
    const entry = state.pipelineProgress[email];
    if (entry?.completed) return false;
    if (entry?.lastSentAt && Date.now() - entry.lastSentAt < CADENCE_STEP_MS) return false;
    return true;
  });
  if (!hasPendingLocal && BREVO_KEY) {
    const brevoExtra = await fetchAdditionalBrevoDoctors(100);
    for (const doc of brevoExtra) {
      if (doc.email && !doctorMap.has(doc.email)) {
        doctorMap.set(doc.email, doc);
      }
    }
    allDoctors = Array.from(doctorMap.values());
  }

  let processedInThisRun = 0;
  let providerBlocked = false;
  const now = Date.now();

  for (const doc of allDoctors) {
    if (processedInThisRun >= maxPerRun) break;
    if (state.dailyBrevoCount >= DAILY_BREVO_LIMIT) break;

    const email = doc.email.toLowerCase().trim();
    const entry = state.pipelineProgress[email] || { persona: 'medico', step: 0, lastSentAt: 0, completed: false };
    if (entry.completed) continue;

    if (optOutSet.has(email)) {
      entry.completed = true;
      entry.skippedReason = 'opt_out_blacklist';
      state.pipelineProgress[email] = entry;
      saveState();
      continue;
    }

    // Bloqueio rigoroso PJ/empresas/não-médicos
    const pjCheck = isCompanyOrNonDoctorContact(doc);
    if (pjCheck.blocked) {
      log(`🚫 [BLOQUEIO PJ/NÃO-MÉDICO] Descartando "${doc.name || '(sem nome)'}" <${email}> -> ${pjCheck.reason}`);
      entry.completed = true;
      entry.skippedReason = `pj_blocked:${pjCheck.reason}`;
      state.pipelineProgress[email] = entry;
      state.metrics.skippedPjOrNonDoctor = (state.metrics.skippedPjOrNonDoctor || 0) + 1;
      saveState();
      continue;
    }

    // Verifica cadência temporal de 48h entre etapas do mesmo contato
    if (entry.lastSentAt && now - entry.lastSentAt < CADENCE_STEP_MS) {
      continue;
    }

    // Validação anti-bounce (sintaxe ASCII, nome real, domínio não sintético, DNS MX, blacklist Brevo)
    const check = await verifyEmailDeliverability(email, doc.name, BREVO_KEY);
    if (!check.valid) {
      log(`⛔ [ANTI-BOUNCE] Descartando "${doc.name || '(sem nome)'}" <${email}> -> ${check.reason}`);
      entry.completed = true;
      entry.skippedReason = check.reason;
      state.pipelineProgress[email] = entry;
      saveState();
      continue;
    }

    const nextStep = (entry.step || 0) + 1;
    if (nextStep > 3) {
      entry.completed = true;
      state.pipelineProgress[email] = entry;
      saveState();
      continue;
    }

    const built = buildDoctorEmailForStep(doc, nextStep);
    if (!built.allowed) {
      log(`🚫 [TEMPLATE GUARD] Descartando "${doc.name || '(sem nome)'}" <${email}> -> ${built.reason}`);
      entry.completed = true;
      entry.skippedReason = built.reason;
      state.pipelineProgress[email] = entry;
      saveState();
      continue;
    }

    log(`📤 Disparando [ETAPA ${nextStep}/3] para ${built.salutation || email} <${email}> (${state.dailyBrevoCount + 1}/${DAILY_BREVO_LIMIT} hoje)...`);
    const res = await sendTransactionalEmail(email, built.salutation || doc.name, built.subject, built.htmlContent, built.textContent);

    if (res.ok) {
      const wasFirstSend = !entry.step;
      entry.step = nextStep;
      entry.lastSentAt = Date.now();
      if (nextStep >= 3) entry.completed = true;
      state.pipelineProgress[email] = entry;

      if (nextStep === 1) state.metrics.step1Sent++;
      if (nextStep === 2) state.metrics.step2Sent++;
      if (nextStep === 3) state.metrics.step3Sent++;
      if (wasFirstSend) state.metrics.totalUniqueSent = (state.metrics.totalUniqueSent || 0) + 1;

      saveState();
      processedInThisRun++;

      await syncLeadToOfficialSupabase({
        name: doc.name,
        email,
        phone: doc.phone || '',
        category: '1-medico',
        source: `brevo_pipeline_step${nextStep}`,
        specialty: doc.specialty || '',
        city: doc.city || '',
        uf: doc.state || doc.uf || '',
        crm: doc.crm || '',
        status: 'invited',
      });

      log(`✅ [ETAPA ${nextStep}/3] Enviado via ${res.provider}! Total hoje: ${state.dailyBrevoCount}/${DAILY_BREVO_LIMIT}`);
    } else {
      if (res.providerBlocked) {
        log(`🛑 [BREVO BLOQUEADO] ${res.error} — pausando 60 min para proteger conta/reputação.`);
        providerBlocked = true;
        break;
      }
      if (res.permanent) {
        entry.completed = true;
        entry.skippedReason = res.error;
        state.pipelineProgress[email] = entry;
        saveState();
      }
      log(`❌ Erro no envio para ${email}: ${res.error}`);
      if (res.retryable) break;
    }
  }

  return { processed: processedInThisRun, providerBlocked };
}

async function startPipelineDaemon() {
  if (!acquirePidLock()) {
    process.exit(0);
  }
  process.on('exit', releasePidLock);
  process.on('SIGINT', () => { releasePidLock(); process.exit(0); });
  process.on('SIGTERM', () => { releasePidLock(); process.exit(0); });

  log('========================================================================');
  log(`🚀 AGENTE BREVO MULTI-PIPELINE ATIVO (COTA: ${DAILY_BREVO_LIMIT} E-MAILS/DIA)`);
  log('🕒 Janela estrita: Segunda a Sábado, 09h às 19h BRT (America/Sao_Paulo)');
  log(`⏱️ Cadência suave: 1 e-mail a cada ${Math.round(CADENCE_MS / 1000)}s (~300/dia sem rajadas)`);
  log('========================================================================');

  while (true) {
    try {
      const result = await runMultiPipelineBatch(1);
      if (result.providerBlocked) {
        await sleep(BREVO_BLOCKED_BACKOFF_MS);
        continue;
      }
      if (result.outsideBusinessHours || result.quotaReached || result.paused) {
        await sleep(15 * 60 * 1000);
        continue;
      }
      if (result.processed > 0) {
        await sleep(CADENCE_MS);
      } else {
        // Nenhum lead elegível neste momento (ex.: todos aguardando janela de 48h entre etapas)
        log('ℹ️ Nenhum e-mail elegível agora (aguardando cadência de 48h ou novos leads). Nova checagem em 15 min...');
        await sleep(15 * 60 * 1000);
      }
    } catch (e) {
      log(`⚠️ Erro no ciclo do pipeline Brevo: ${e.message}`);
      await sleep(5 * 60 * 1000);
    }
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  startPipelineDaemon().catch((err) => {
    log(`🔥 Erro crítico: ${err.message}`);
    releasePidLock();
    process.exit(1);
  });
}
