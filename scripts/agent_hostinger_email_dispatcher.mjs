/**
 * scripts/agent_hostinger_email_dispatcher.mjs
 * 
 * 🌿 Planta y Raíz Ltda — Agente Autônomo Oficial de Disparo de E-mails via Hostinger SMTP (24x7)
 * 
 * Funcionalidades:
 * 1. Disparo nativo via Hostinger SMTP oficial (contato@plantayraiz.com.br / smtp.hostinger.com:465 SSL).
 * 2. Alternativa 100% autônoma e resiliente à API do Brevo (que pode ter limites ou bloqueios de conta).
 * 3. Apresenta o Programa Médico Sócio com a Meta Oficial de R$ 15.000,00/mês (3 que indicam 3 em 3 gerações).
 * 4. Verificação estrita anti-bounce e filtro de entregabilidade (email_validator.mjs).
 * 5. Cadência segura de entrega: 60 a 90 segundos entre envios para manter score máximo e reputação intacta.
 * 6. Sincronização em tempo real de disparos no Lovable Cloud Supabase (email_send_log e leads_contatos).
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {
  verifyEmailDeliverability,
  addEmailToBouncedBlacklist,
  logEmailSendInSupabase,
  syncLeadToOfficialSupabase
} from './lib/email_validator.mjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'hostinger_email_state.json');
const LOG_FILE = path.join(__dirname, 'hostinger_email_dispatcher.log');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const SMTP_PASS = process.env.SMTP_PASS || '';

const SENDER_NAME = 'Dr. Edilson Bezerra · Planta y Raíz';
const CADENCE_SECONDS = 75; // 75 segundos entre envios = cadência segura anti-spam

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [HOSTINGER-DISPATCHER] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (_) {}
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      pool: true,
      maxConnections: 1,
      rateLimit: 1
    });
  }
  return transporter;
}

function loadState() {
  const defaultState = {
    startedAt: new Date().toISOString(),
    totalSent: 0,
    dailyCount: 0,
    dailyResetAt: new Date().toDateString(),
    sentEmails: {}, // email -> { name, sentAt, messageId }
    errorsCount: 0
  };

  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (data.dailyResetAt !== new Date().toDateString()) {
        data.dailyCount = 0;
        data.dailyResetAt = new Date().toDateString();
      }
      return { ...defaultState, ...data };
    } catch (_) {}
  }
  return defaultState;
}

const state = loadState();

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (_) {}
}

function buildDoctorInviteEmail(doctorName) {
  const cleanName = String(doctorName || 'Doutor(a)').replace(/^(dr|dra|dr\(a\))\.?\s+/i, '').trim();

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Convite Oficial: Programa Médico Sócio Planta y Raíz</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b130e; margin: 0; padding: 24px 0; color: #e2e8f0; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #121e16; border-radius: 16px; overflow: hidden; border: 1px solid #1f3a2b; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <!-- Topo Dourado / Esmeralda -->
    <tr>
      <td style="background: linear-gradient(135deg, #065f46 0%, #042f2e 100%); padding: 36px 32px; text-align: center; border-bottom: 2px solid #10b981;">
        <span style="background-color: rgba(16,185,129,0.25); color: #6ee7b7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 5px 14px; border-radius: 20px; border: 1px solid #10b981;">
          Convite Exclusivo · Corpo Clínico Oficial
        </span>
        <h1 style="color: #ffffff; margin: 16px 0 0 0; font-size: 26px; font-weight: 900; letter-spacing: 0.5px;">
          Planta y Raíz Medicina Canabinoide
        </h1>
        <p style="color: #a7f3d0; margin: 6px 0 0 0; font-size: 14px; font-weight: 600;">
          A Maior Rede de Prescritores e Telemedicina Integrada do Brasil
        </p>
      </td>
    </tr>

    <!-- Conteúdo Principal -->
    <tr>
      <td style="padding: 36px 32px;">
        <p style="font-size: 16px; font-weight: 700; color: #ffffff; margin-top: 0;">
          Prezado(a) Dr(a). ${cleanName},
        </p>
        <p style="font-size: 14.5px; color: #cbd5e1; margin-bottom: 18px;">
          A medicina canabinoide no Brasil está em franca expansão. No entanto, a maioria das plataformas tradicionais impõe taxas abusivas de até 40% e repasses demorados.
        </p>
        <p style="font-size: 14.5px; color: #cbd5e1; margin-bottom: 22px;">
          Na <strong>Planta y Raíz</strong>, você é tratado como <strong>Médico Sócio</strong>: criamos um ecossistema com <strong style="color: #10b981;">93% de repasse líquido via Pix</strong>, consultório virtual criptografado em conformidade com o CFM e assinatura digital com padrão ICP-Brasil.
        </p>

        <!-- Destaque: Programa Médico Sócio Meta R$ 15.000/mês -->
        <div style="background-color: #172a1e; border: 2px solid #10b981; border-radius: 12px; padding: 22px; margin: 24px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 18px; margin-right: 8px;">🎯</span>
            <strong style="color: #34d399; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
              Plano Meta: R$ 15.000,00 de Salário/Mês Vitalício no Pix
            </strong>
          </div>
          <p style="margin: 0 0 12px 0; font-size: 13.5px; color: #e2e8f0;">
            Com a fórmula dos <strong>3 colegas que indicam 3 até a 3ª geração (39 médicos na rede)</strong>, você constrói um faturamento recorrente passivo perpétuo caindo no seu Pix somando 3 pilares:
          </p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #94a3b8; line-height: 1.8;">
            <li><strong style="color: #e2e8f0;">R$ 1.560,00/mês</strong> em comissões sobre assinaturas de planos médicos.</li>
            <li><strong style="color: #e2e8f0;">R$ 6.240,00/mês</strong> sobre consultas e teleatendimentos da sua rede.</li>
            <li><strong style="color: #e2e8f0;">R$ 7.200,00/mês</strong> de compras na Farmácia Canabinoide Integrada da plataforma.</li>
          </ul>
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #234832; text-align: center;">
            <span style="font-size: 18px; font-weight: 900; color: #10b981;">
              Total: R$ 15.000,00 / MÊS VITALÍCIO NO PIX!
            </span>
          </div>
        </div>

        <!-- Recursos do Consultório -->
        <div style="background-color: #0d1811; border: 1px solid #1f3a2b; border-radius: 10px; padding: 18px; margin-bottom: 26px;">
          <strong style="color: #a7f3d0; font-size: 14px;">⚡ O que você recebe ao se cadastrar gratuitamente hoje:</strong>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px; color: #94a3b8; line-height: 1.7;">
            <li>Consultório com chat em tempo real, sala de vídeo HD e prontuário integrado.</li>
            <li>Copiloto Clínico com acesso a 40.000 estudos médicos da base PubMed.</li>
            <li>Escriba inteligente para rascunho de prontuários SOAP.</li>
            <li>Prescritor com catálogo oficial e emissão de receitas com controle especial.</li>
            <li>Repasse de 93% via Pix liberado após a avaliação do paciente.</li>
          </ul>
        </div>

        <!-- Botão CTA Principal -->
        <div style="text-align: center; margin: 32px 0 20px 0;">
          <a href="https://plantayraiz.com.br/cadastro-profissional?utm_source=hostinger_email&utm_medium=convite_medico&utm_campaign=meta_15k" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #042f2e; text-decoration: none; font-size: 16px; font-weight: 900; padding: 16px 38px; border-radius: 10px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(16,185,129,0.35);">
            Ativar Meu Consultório Gratuito Agora →
          </a>
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 10px;">
          Cadastro gratuito e sem taxa de adesão. Leva menos de 2 minutos.
        </p>

        <!-- Contato & Suporte -->
        <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #1f3a2b; font-size: 12.5px; color: #94a3b8; text-align: center;">
          <p style="margin: 0;">Dúvidas ou atendimento direto com nossa equipe:</p>
          <p style="margin: 4px 0 0 0; font-weight: 700; color: #a7f3d0;">
            WhatsApp Oficial: (11) 99136-3154 · <a href="https://plantayraiz.com.br" style="color: #10b981; text-decoration: none;">plantayraiz.com.br</a>
          </p>
        </div>
      </td>
    </tr>

    <!-- Rodapé -->
    <tr>
      <td style="background-color: #0b130e; padding: 20px 32px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #172a1e;">
        <p style="margin: 0;">Planta y Raíz Ltda · CNPJ 43.123.456/0001-78 · São Paulo - SP</p>
        <p style="margin: 4px 0 0 0;">
          Para não receber mais comunicados desta parceria, <a href="https://plantayraiz.com.br/unsubscribe" style="color: #64748b; text-decoration: underline;">clique aqui para descadastrar</a>.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Prezado(a) Dr(a). ${cleanName},

Gostaríamos de convidá-lo(a) para fazer parte do corpo clínico oficial da Planta y Raíz, a maior rede de medicina canabinoide e telemedicina do Brasil.

VANTAGENS EXCLUSIVAS DO MÉDICO SÓCIO:
• 93% de Repasse Líquido no Pix por consulta (apenas 7% de taxa da plataforma).
• Consultório Virtual Completo com Sala de Vídeo HD e Prontuário CFM / ICP-Brasil.
• Copiloto Clínico de IA conectado a mais de 40.000 artigos científicos do PubMed.
• Programa Médico Sócio: Meta Oficial de R$ 15.000,00/mês de salário vitalício no Pix com a multiplicação de 3 colegas que indicam 3 até a 3ª geração.

Faça seu cadastro gratuito em:
https://plantayraiz.com.br/cadastro-profissional

Dúvidas? Fale com nossa equipe no WhatsApp: (11) 99136-3154
Atenciosamente,
Dr. Edilson Bezerra & Equipe Planta y Raíz`;

  return { html, text };
}

async function sendOneDoctorEmail(doc) {
  const email = String(doc.email || '').trim().toLowerCase();
  const name = doc.name || 'Doutor(a)';

  // 1. Checa se já foi enviado anteriormente
  if (state.sentEmails[email]) {
    return { ok: false, skipped: true, reason: 'ALREADY_SENT' };
  }

  // 2. Valida entregabilidade
  const check = await verifyEmailDeliverability(email, name, '');
  if (!check.valid) {
    log(`⛔ [ANTI-BOUNCE] Descartando ${name} <${email}> -> ${check.reason}`);
    addEmailToBouncedBlacklist(email, check.reason);
    state.sentEmails[email] = { name, skippedAt: new Date().toISOString(), reason: check.reason };
    saveState();
    return { ok: false, skipped: true, reason: check.reason };
  }

  const { html, text } = buildDoctorInviteEmail(name);
  const subject = `Dr(a). ${name}, Seja Médico Sócio Prescritor na Planta y Raíz (Meta R$ 15k/mês no Pix)`;

  try {
    const t = getTransporter();
    if (!t) {
      log('❌ [CONFIG ERROR] Hostinger SMTP_PASS não configurada');
      return { ok: false, error: 'SMTP_PASS_MISSING' };
    }

    const info = await t.sendMail({
      from: `"${SENDER_NAME}" <${SMTP_USER}>`,
      replyTo: SMTP_USER,
      to: `"${name}" <${email}>`,
      subject,
      text,
      html,
      headers: {
        'List-Unsubscribe': '<https://plantayraiz.com.br/unsubscribe>',
        'X-Priority': '1',
        'X-Mailer': 'PlantaYRaiz-HostingerEngine-v2.0'
      }
    });

    log(`✅ [HOSTINGER SMTP ENVIADO] ${name} <${email}> | ID: ${info.messageId}`);
    
    state.totalSent++;
    state.dailyCount++;
    state.sentEmails[email] = {
      name,
      sentAt: new Date().toISOString(),
      messageId: info.messageId,
      provider: 'Hostinger SMTP'
    };
    saveState();

    // Sincroniza em segundo plano no Supabase CRM
    await logEmailSendInSupabase({
      email,
      templateName: 'hostinger_medico_socio_15k',
      status: 'sent',
      messageId: info.messageId,
      metadata: { doctor_name: name, subject, provider: 'Hostinger SMTP' }
    });

    await syncLeadToOfficialSupabase({
      name,
      email,
      phone: doc.phone || '',
      category: '1-medico',
      source: 'hostinger_email_dispatcher',
      specialty: doc.specialty || '',
      city: doc.city || '',
      uf: doc.state || doc.uf || '',
      crm: doc.crm || '',
      status: 'invited'
    });

    return { ok: true, messageId: info.messageId };
  } catch (err) {
    log(`❌ [HOSTINGER FALHA] Erro ao enviar para ${email}: ${err.message}`);
    state.errorsCount++;
    saveState();

    if (err.message.includes('550') || err.message.includes('No such user') || err.message.includes('Recipient address rejected')) {
      addEmailToBouncedBlacklist(email, 'hostinger_smtp_550');
      state.sentEmails[email] = { name, failedAt: new Date().toISOString(), error: err.message };
      saveState();
    }
    return { ok: false, error: err.message };
  }
}

export async function runHostingerBatch(maxPerBatch = 5) {
  log(`🚀 Iniciando rodada do Agente Hostinger Email Dispatcher (Lote: ${maxPerBatch})...`);

  // Carrega fontes de leads
  const candidateFiles = [
    path.join(__dirname, 'clinicos_gerais_pos2020_leads.json'),
    path.join(__dirname, 'unregistered_doctors_leads.json')
  ];

  let doctors = [];
  for (const f of candidateFiles) {
    if (fs.existsSync(f)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (Array.isArray(parsed)) doctors.push(...parsed);
      } catch (_) {}
    }
  }

  // Deduplicação e filtragem
  const docMap = new Map();
  for (const d of doctors) {
    const email = String(d.email || '').trim().toLowerCase();
    if (email && email.includes('@') && !docMap.has(email)) {
      docMap.set(email, d);
    }
  }

  const uniqueDocs = Array.from(docMap.values());
  log(`📋 Total de médicos cadastrados na base: ${uniqueDocs.length}. Já enviados: ${Object.keys(state.sentEmails).length}`);

  let sentInThisBatch = 0;
  for (const doc of uniqueDocs) {
    if (sentInThisBatch >= maxPerBatch) break;
    const email = doc.email.toLowerCase().trim();
    if (state.sentEmails[email]) continue;

    const res = await sendOneDoctorEmail(doc);
    if (res.ok) {
      sentInThisBatch++;
      log(`⏳ Cadência de segurança ativa: aguardando ${CADENCE_SECONDS}s para o próximo disparo...`);
      await sleep(CADENCE_SECONDS * 1000);
    }
  }

  log(`🏁 Rodada Hostinger concluída: ${sentInThisBatch} e-mail(s) enviados. Total hoje: ${state.dailyCount}`);
}

async function startHostingerDaemon() {
  log('================================================================');
  log('🌿 AGENTE HOSTINGER EMAIL DISPATCHER ATIVO (24x7)');
  log(`Servidor SMTP: ${SMTP_HOST}:${SMTP_PORT} | Remetente: ${SMTP_USER}`);
  log('================================================================');

  while (true) {
    try {
      await runHostingerBatch(1);
    } catch (e) {
      log(`⚠️ Erro no ciclo Hostinger: ${e.message}`);
    }
    await sleep(CADENCE_SECONDS * 1000);
  }
}

// Se executado diretamente
if (process.argv[1] && process.argv[1].endsWith('agent_hostinger_email_dispatcher.mjs')) {
  startHostingerDaemon().catch(err => {
    log(`🔥 Erro crítico no daemon Hostinger: ${err.message}`);
    process.exit(1);
  });
}
