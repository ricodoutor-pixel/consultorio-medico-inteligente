/**
 * scripts/agent_brevo_multi_pipeline.mjs
 * 
 * MÓDULO 2: AGENTE DE E-MAIL OUTREACH & CONVERSÃO VIP (BREVO CRM API)
 * Plataforma Planta y Raíz Ltda (plantayraiz.com.br)
 * 
 * Funcionalidades:
 * 1. Régua de 3 E-mails Institucionais para Médicos Prescritores (Cadência de 48h):
 *    - E-mail 1 (Oportunidade): Consultório Virtual Taxa Zero no 1º mês + Prontuário CFM / ICP-Brasil.
 *    - E-mail 2 (Evidências): Biblioteca Científica com 40.000 estudos para embasamento de laudos.
 *    - E-mail 3 (Oferta VIP R$ 99): Destaque no Topo Ouro da Vitrine + Pacientes Triados pela Enfª Brisa.
 * 2. Esteira B2B de Parceria para Farmácias e Importadoras (RDC 660 / RDC 327):
 *    - Conexão direta com pacientes prescritos e integração de catálogo sem taxa de adesão.
 * 3. Gateway Duplo Híbrido:
 *    - Brevo API REST (Quota de até 300 e-mails/dia rastreados) com failover transparente para Hostinger SMTP.
 * 4. Persistência de Régua em JSON com controle rigoroso de cadência temporal e proteção anti-spam.
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'brevo_multi_pipeline_state.json');
const LOG_FILE = path.join(__dirname, 'brevo_multi_pipeline.log');

const BREVO_KEY = process.env.BREVO_API_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const SMTP_PASS = process.env.SMTP_PASS || '';
const BREVO_LIST_MEDICOS = Number(process.env.BREVO_LIST_MEDICOS || 6);

const CADENCE_STEP_MS = 48 * 60 * 60 * 1000; // 48 horas entre réguas
const DAILY_BREVO_LIMIT = 300;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  pool: true,
  maxConnections: 1,
  rateLimit: 1
});

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [BREVO-PIPELINE] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (_) {}
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function loadState() {
  const defaultState = {
    startedAt: new Date().toISOString(),
    dailyBrevoCount: 0,
    dailyBrevoResetAt: new Date().toDateString(),
    pipelineProgress: {}, // email -> { persona: 'medico'|'farmacia', step: 1|2|3, lastSentAt: ts, completed: bool }
    metrics: {
      step1Sent: 0,
      step2Sent: 0,
      step3Sent: 0,
      pharmacySent: 0,
      hostingerFallbackSent: 0,
      errors: 0
    }
  };

  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      // Reseta cota diária do Brevo a cada novo dia
      if (data.dailyBrevoResetAt !== new Date().toDateString()) {
        data.dailyBrevoCount = 0;
        data.dailyBrevoResetAt = new Date().toDateString();
      }
      return { ...defaultState, ...data, metrics: { ...defaultState.metrics, ...(data.metrics || {}) } };
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

// ─── Envio com Gateway Híbrido (Brevo API + Fallback Hostinger) ───
async function sendTransactionalEmail(toEmail, toName, subject, htmlContent, textContent) {
  // 1. Tenta Brevo API se estiver dentro da cota diária de 300
  if (BREVO_KEY && state.dailyBrevoCount < DAILY_BREVO_LIMIT) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': BREVO_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Planta y Raíz · Expansão Médica', email: SMTP_USER },
          to: [{ email: toEmail, name: toName || toEmail }],
          replyTo: { email: SMTP_USER, name: 'Planta y Raíz Suporte' },
          subject,
          htmlContent,
          textContent
        })
      });
      if (res.ok) {
        state.dailyBrevoCount++;
        saveState();
        return { ok: true, provider: 'Brevo API' };
      } else {
        const errText = await res.text();
        log(`⚠️ Brevo HTTP ${res.status}: ${errText.slice(0, 100)} -> Tentando Hostinger SMTP...`);
      }
    } catch (e) {
      log(`⚠️ Falha de conexão Brevo (${e.message}) -> Acionando Hostinger SMTP...`);
    }
  }

  // 2. Fallback transparente no Hostinger SMTP
  try {
    const info = await transporter.sendMail({
      from: `"Planta y Raíz · Expansão Médica" <${SMTP_USER}>`,
      replyTo: SMTP_USER,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });
    state.metrics.hostingerFallbackSent++;
    saveState();
    return { ok: true, provider: 'Hostinger SMTP', messageId: info.messageId };
  } catch (smtpErr) {
    state.metrics.errors++;
    saveState();
    return { ok: false, error: smtpErr.message };
  }
}

// ─── Templates de E-mail da Régua Médica ───
function buildDoctorStep1Html(doctorName) {
  const cleanName = String(doctorName || 'Doutor(a)').replace(/^(dr|dra|dr\(a\))\.?\s+/i, '').trim();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Consultório Virtual com Taxa Zero | Planta y Raíz</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b130e; margin: 0; padding: 24px 0; color: #e2e8f0; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #121e16; border-radius: 14px; overflow: hidden; border: 1px solid #1f3a2b;">
    <tr>
      <td style="background: linear-gradient(135deg, #064e3b 0%, #121e16 100%); padding: 32px 30px; text-align: center; border-bottom: 1px solid #1f3a2b;">
        <span style="background-color: rgba(16,185,129,0.2); color: #6ee7b7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px;">Etapa 1 de 3 · Oportunidade Exclusiva</span>
        <h1 style="color: #10b981; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">Planta y Raíz Ltda</h1>
        <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">Infraestrutura de Telemedicina & Prescrição Segura CFM</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 30px;">
        <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Olá, Dr(a). ${cleanName},</p>
        <p style="font-size: 14.5px; color: #cbd5e1;">Sabemos que as plataformas convencionais de telemedicina retêm até 30% a 40% dos seus honorários médicos e demoram semanas para efetuar repasses.</p>
        <p style="font-size: 14.5px; color: #cbd5e1;">A <strong>Planta y Raíz</strong> foi criada para revolucionar esse cenário: oferecemos <strong>Consultório Virtual com Taxa Zero no 1º mês</strong> e repasse de <strong>93% líquido via PIX instantâneo</strong> nas consultas seguintes.</p>
        
        <div style="background-color: #172a1e; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <strong style="color: #34d399; font-size: 14px;">🛡️ Prontuário CFM & Validação ICP-Brasil Nativa</strong>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Emita receitas com certificação digital válida em farmácias de todo o Brasil e conte com o apoio da Enfª Brisa IA para pré-triagem dos seus pacientes.</p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://plantayraiz.com.br/cadastro-profissional?utm_source=brevo_email&utm_medium=cold_outreach&utm_campaign=regua_step1" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #042f2e; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 32px; border-radius: 8px; display: inline-block; text-transform: uppercase;">Ativar Consultório Virtual Grátis →</a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; text-align: center;">Ou agende uma apresentação rápida com nossa coordenação: <a href="https://plantayraiz.com.br/reuniao-parceiros" style="color: #34d399; text-decoration: underline;">plantayraiz.com.br/reuniao-parceiros</a></p>
      </td>
    </tr>
  </table>
</body></html>`;
}

function buildDoctorStep2Html(doctorName) {
  const cleanName = String(doctorName || 'Doutor(a)').replace(/^(dr|dra|dr\(a\))\.?\s+/i, '').trim();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Acervo de 40.000 Estudos Clínicos | Planta y Raíz</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b130e; margin: 0; padding: 24px 0; color: #e2e8f0; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #121e16; border-radius: 14px; overflow: hidden; border: 1px solid #1f3a2b;">
    <tr>
      <td style="background: linear-gradient(135deg, #064e3b 0%, #121e16 100%); padding: 32px 30px; text-align: center; border-bottom: 1px solid #1f3a2b;">
        <span style="background-color: rgba(16,185,129,0.2); color: #6ee7b7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px;">Etapa 2 de 3 · Rigor Científico</span>
        <h1 style="color: #10b981; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">Biblioteca Científica Planta y Raíz</h1>
        <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">Evidências Clínicas para Embasamento de Condutas e Laudos</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 30px;">
        <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Dr(a). ${cleanName},</p>
        <p style="font-size: 14.5px; color: #cbd5e1;">A segurança do médico prescritor está ancorada em literatura científica indexada. Na Planta y Raíz, disponibilizamos um acervo vivo com <strong>mais de 40.000 ensaios clínicos e estudos de casos</strong> (PubMed, Cochrane, Frontiers) categorizados por patologia:</p>
        
        <ul style="font-size: 14px; color: #e2e8f0; padding-left: 18px;">
          <li style="margin-bottom: 6px;">Dor Crônica, Fibromialgia e Neuropatias</li>
          <li style="margin-bottom: 6px;">Ansiedade Refratária, Insônia e TEPT</li>
          <li style="margin-bottom: 6px;">Transtorno do Espectro Autista (TEA) e Epilepsia</li>
          <li style="margin-bottom: 6px;">Suporte Oncológico e Cuidados Paliativos</li>
        </ul>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://plantayraiz.com.br/biblioteca?utm_source=brevo_email&utm_medium=cold_outreach&utm_campaign=regua_step2" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #042f2e; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 32px; border-radius: 8px; display: inline-block; text-transform: uppercase;">Acessar Biblioteca Científica →</a>
        </div>
      </td>
    </tr>
  </table>
</body></html>`;
}

function buildDoctorStep3Html(doctorName) {
  const cleanName = String(doctorName || 'Doutor(a)').replace(/^(dr|dra|dr\(a\))\.?\s+/i, '').trim();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Plano VIP Prescritor R$ 99/mês | Planta y Raíz</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b130e; margin: 0; padding: 24px 0; color: #e2e8f0; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #121e16; border-radius: 14px; overflow: hidden; border: 1px solid #1f3a2b;">
    <tr>
      <td style="background: linear-gradient(135deg, #78350f 0%, #121e16 100%); padding: 32px 30px; text-align: center; border-bottom: 1px solid #1f3a2b;">
        <span style="background-color: rgba(245,158,11,0.25); color: #fde68a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px;">Etapa 3 de 3 · Oferta VIP</span>
        <h1 style="color: #fbbf24; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">Plano Médico VIP Prescritor</h1>
        <p style="color: #fde68a; margin: 4px 0 0 0; font-size: 13px;">Destaque Ouro na Vitrine & Prioridade da Enfª Brisa por R$ 99/mês</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 30px;">
        <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Dr(a). ${cleanName},</p>
        <p style="font-size: 14.5px; color: #cbd5e1;">Quer acelerar o preenchimento da sua agenda de telemedicina? No <strong>Plano VIP Prescritor por apenas R$ 99,00/mês</strong>, você conta com os maiores benefícios do mercado:</p>
        
        <div style="background-color: #1e1b4b; border: 1.5px solid #f59e0b; border-radius: 10px; padding: 18px; margin: 20px 0;">
          <ul style="margin: 0; padding-left: 18px; font-size: 13.5px; color: #fde68a;">
            <li style="margin-bottom: 8px;"><strong>Topo Absoluto da Vitrine:</strong> Seu card é exibido com Selo Ouro de Verificação para milhares de visitantes mensais.</li>
            <li style="margin-bottom: 8px;"><strong>Roteamento Prioritário com IA:</strong> Pacientes triados 24h pela Enfª Brisa no WhatsApp e no site são direcionados para os médicos VIP.</li>
            <li style="margin-bottom: 8px;"><strong>100% dos Honorários no 1º Mês (Taxa Zero)</strong> e 93% líquido via PIX a partir do 2º mês. Uma única consulta já paga todo o seu plano!</li>
            <li><strong>Ferramenta de Prontuários:</strong> Importação/Exportação da sua carteira de pacientes com busca rápida por Nome ou CPF.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://plantayraiz.com.br/consultorio?utm_source=brevo_email&utm_medium=cold_outreach&utm_campaign=regua_vip99" target="_blank" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0f172a; text-decoration: none; font-size: 15px; font-weight: 900; padding: 15px 34px; border-radius: 8px; display: inline-block; text-transform: uppercase;">Garantir Minha Vaga VIP por R$ 99 →</a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; text-align: center;">Dúvidas? Fale no WhatsApp Oficial: (11) 99136-3154</p>
      </td>
    </tr>
  </table>
</body></html>`;
}

// ─── Template para Farmácias e Dispensários B2B (RDC 660 / 327) ───
function buildPharmacyInviteHtml(pharmacyName) {
  const cleanName = pharmacyName || 'Parceiro(a) Farmacêutico(a)';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Parceria Comercial & Integração de Catálogo | Planta y Raíz</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b130e; margin: 0; padding: 24px 0; color: #e2e8f0; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #121e16; border-radius: 14px; overflow: hidden; border: 1px solid #1f3a2b;">
    <tr>
      <td style="background: linear-gradient(135deg, #065f46 0%, #121e16 100%); padding: 32px 30px; text-align: center; border-bottom: 1px solid #1f3a2b;">
        <span style="background-color: rgba(16,185,129,0.2); color: #6ee7b7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px;">Expansão B2B · Farmácias & Importadoras</span>
        <h1 style="color: #10b981; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">Planta y Raíz Hub Farmacêutico</h1>
        <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">Conectando Prescrições Auditadas ao Catálogo Autorizado</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 30px;">
        <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Prezados da ${cleanName},</p>
        <p style="font-size: 14.5px; color: #cbd5e1;">A <strong>Planta y Raíz</strong> opera uma das redes médicas de telemedicina integrativa com maior crescimento no país, gerando centenas de prescrições mensais de produtos à base de cannabis (RDC 660 / RDC 327).</p>
        
        <p style="font-size: 14.5px; color: #cbd5e1;">Gostaríamos de apresentar nossa proposta de <strong>integração tecnológica de catálogo sem taxa de adesão</strong>, direcionando nossos pacientes com receitas válidas e assinadas digitalmente diretamente para o balcão virtual da sua farmácia.</p>

        <div style="background-color: #172a1e; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <strong style="color: #34d399; font-size: 14px;">🤝 Vantagens para sua Farmácia / Dispensário:</strong>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">• Zero taxa de adesão ou mensalidade fixa.<br>• Pacientes já com laudo e receita emitida.<br>• Rastreabilidade total e conformidade com a Anvisa.</p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://plantayraiz.com.br/reuniao-parceiros?utm_source=brevo_email&utm_medium=b2b_outreach&utm_campaign=farmacia_parceria" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #042f2e; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 32px; border-radius: 8px; display: inline-block; text-transform: uppercase;">Agendar Apresentação de 15 Min →</a>
        </div>
      </td>
    </tr>
  </table>
</body></html>`;
}

// ─── Motor da Régua Multicanal ───
export async function runMultiPipelineBatch(maxPerRun = 25) {
  log(`🚀 Iniciando rodada do Agente Brevo Multi-Pipeline (Lote máximo: ${maxPerRun})...`);

  // Carrega fontes de leads
  const candidateFiles = [
    path.join(__dirname, 'clinicos_gerais_pos2020_leads.json'),
    path.join(__dirname, 'unregistered_doctors_leads.json'),
    path.join(__dirname, 'prescritores_master_list.json')
  ];

  let rawDoctors = [];
  for (const f of candidateFiles) {
    if (fs.existsSync(f)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (Array.isArray(parsed)) rawDoctors.push(...parsed);
      } catch (_) {}
    }
  }

  // Deduplicação por e-mail
  const doctorMap = new Map();
  for (const doc of rawDoctors) {
    const email = String(doc.email || '').trim().toLowerCase();
    if (email && email.includes('@') && !email.includes('example.com') && !email.includes('teste') && !email.endsWith('.fake')) {
      if (!doctorMap.has(email)) doctorMap.set(email, doc);
    }
  }

  const allDoctors = Array.from(doctorMap.values());
  log(`📋 Total de médicos únicos mapeados para a régua: ${allDoctors.length}`);

  let processedInThisRun = 0;
  const now = Date.now();

  for (const doc of allDoctors) {
    if (processedInThisRun >= maxPerRun) break;
    const email = doc.email.toLowerCase().trim();
    const entry = state.pipelineProgress[email] || { persona: 'medico', step: 0, lastSentAt: 0, completed: false };

    if (entry.completed) continue;

    // Verifica cadência temporal de 48h
    if (entry.lastSentAt && now - entry.lastSentAt < CADENCE_STEP_MS) {
      continue;
    }

    const nextStep = (entry.step || 0) + 1;
    let subject = '';
    let htmlContent = '';
    let textContent = '';

    if (nextStep === 1) {
      subject = `Dr(a). ${doc.name || 'Doutor(a)'}, Consultório Virtual com Taxa Zero e Repasse via PIX`;
      htmlContent = buildDoctorStep1Html(doc.name);
      textContent = `Olá Dr(a). ${doc.name}, conheça o Consultório Virtual da Planta y Raíz com Taxa Zero no 1º mês e 93% via PIX. Ative em https://plantayraiz.com.br/cadastro-profissional`;
    } else if (nextStep === 2) {
      subject = `Dr(a). ${doc.name || 'Doutor(a)'}, Acesso a 40.000 Estudos Clínicos na Planta y Raíz`;
      htmlContent = buildDoctorStep2Html(doc.name);
      textContent = `Olá Dr(a). ${doc.name}, acesse nosso acervo científico de medicina canabinoide em https://plantayraiz.com.br/biblioteca`;
    } else if (nextStep === 3) {
      subject = `Dr(a). ${doc.name || 'Doutor(a)'}, Destaque Ouro na Vitrine por Apenas R$ 99/mês`;
      htmlContent = buildDoctorStep3Html(doc.name);
      textContent = `Olá Dr(a). ${doc.name}, seja VIP por R$ 99/mês com topo da vitrine e pacientes da Enfª Brisa: https://plantayraiz.com.br/consultorio`;
    } else {
      entry.completed = true;
      state.pipelineProgress[email] = entry;
      saveState();
      continue;
    }

    log(`📤 Disparando [RÉGUA ETAPA ${nextStep}] para ${doc.name} <${email}>...`);
    const res = await sendTransactionalEmail(email, doc.name, subject, htmlContent, textContent);

    if (res.ok) {
      entry.step = nextStep;
      entry.lastSentAt = Date.now();
      if (nextStep >= 3) entry.completed = true;
      state.pipelineProgress[email] = entry;

      if (nextStep === 1) state.metrics.step1Sent++;
      if (nextStep === 2) state.metrics.step2Sent++;
      if (nextStep === 3) state.metrics.step3Sent++;

      saveState();
      processedInThisRun++;
      log(`✅ [RÉGUA ETAPA ${nextStep}] Enviado com sucesso via ${res.provider}!`);
      await sleep(1500); // 1.5s entre envios
    } else {
      log(`❌ Erro no envio para ${email}: ${res.error}`);
    }
  }

  log(`🏁 Rodada concluída: ${processedInThisRun} e-mails processados. Total Brevo hoje: ${state.dailyBrevoCount}/${DAILY_BREVO_LIMIT}`);
}

// Disparo quando executado diretamente
async function startPipelineDaemon() {
  log('🚀 [MÓDULO 2] Agente Brevo Multi-Pipeline Ativo em Loop Contínuo');
  while (true) {
    try {
      await runMultiPipelineBatch(20);
    } catch (e) {
      log(`⚠️ Erro no ciclo do pipeline: ${e.message}`);
    }
    await sleep(15 * 60 * 1000); // Aguarda 15 minutos entre lotes
  }
}

startPipelineDaemon().catch(err => {
  log(`🔥 Erro crítico: ${err.message}`);
  process.exit(1);
});
