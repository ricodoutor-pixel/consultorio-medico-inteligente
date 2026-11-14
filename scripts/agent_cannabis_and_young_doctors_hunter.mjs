/**
 * scripts/agent_cannabis_and_young_doctors_hunter.mjs
 * 
 * 🌿 Planta y Raíz Ltda — Missão Humanitária e Clínica Digital 24x7
 * 
 * Agente Autônomo Especializado:
 * 1. Médicos Prescritores de Cannabis Medicinal (Fitocanabinoides / Endocanabinologia / RDC 660)
 * 2. Médicos Formados em 2020 a 2026 (Clínicos Gerais / Jovens Médicos à procura de Consultório Digital)
 * 
 * Execução 100% autônoma, sem necessidade de supervisão manual.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'node:dns';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const STATE_FILE = path.join(__dirname, 'cannabis_young_doctors_hunter_state.json');
const LOG_FILE = path.join(__dirname, 'cannabis_young_doctors_hunter.log');

// Credenciais e Configurações
const BREVO_KEY = process.env.BREVO_API_KEY || '';
const BREVO_BASE = 'https://api.brevo.com/v3';
const BREVO_LIST_MEDICOS = Number(process.env.BREVO_LIST_MEDICOS || 6);

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const SMTP_PASS = process.env.SMTP_PASS || 'SuaSenhaAqui';

// Transporter Hostinger seguro
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
  const line = `[${new Date().toISOString()}] [HUNTER-2020-CANNABIS] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {}
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    processedKeys: [],
    emailsSentCount: 0,
    brevoSyncedCount: 0,
    lastCycleAt: null
  };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {}
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Limpeza e normalização de telefone brasileiro
function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    return digits;
  }
  return null;
}

// Extrai e sanitiza e-mail
function extractEmail(str) {
  if (!str) return null;
  const match = String(str).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  if (!match) return null;
  const em = match[0].toLowerCase().trim();
  if (em.includes('doctoralia') || em.includes('wix') || em.includes('sentry') || em.includes('example')) return null;
  return em;
}

// Classifica o médico nos dois públicos-alvo prioritários
function classifyTargetDoctor(lead) {
  const text = `${lead.name || ''} ${lead.specialty || ''} ${lead.headline || ''} ${lead.bio || ''}`.toLowerCase();
  
  // 1. Prescritor de Cannabis
  const isCannabis = /(cannabis|canabidiol|cbd|thc|endocanabin|fitoterapi|medicina integrativa|dor cr[oô]nica|fitocanabin|p[oó]s em cannabis)/i.test(text);
  if (isCannabis) {
    return {
      segment: 'PRESCRITOR_CANNABIS',
      tag: 'PRESCRITOR_CANNABIS_MEDICINAL',
      roleLabel: 'Médico(a) Prescritor(a) de Cannabis Medicinal'
    };
  }

  // 2. Médico Formado pós-2020 / Clínico Geral / Generalista
  return {
    segment: 'FORMADO_POS_2020',
    tag: 'CLINICO_GERAL_POS_2020',
    roleLabel: 'Médico(a) Clínico Geral / Saúde Integrativa'
  };
}

// Inserção / Atualização no Brevo CRM Lista 6
async function syncToBrevoCRM(lead, classification) {
  const email = lead.email;
  const phone = normalizePhone(lead.phone);
  if (!email && !phone) return false;

  const fallbackEmail = email || `medico_${phone}@lead.plantayraiz.com.br`;

  const cleanName = (lead.name || 'Doutor(a)').replace(/^dr\(a\)\.?\s+/i, '').replace(/^dr\.?\s+/i, '').replace(/^dra\.?\s+/i, '').trim();

  const attributes = {
    NOME: cleanName,
    ESPECIALIDADE: lead.specialty || classification.roleLabel,
    CRM: lead.crm || 'EM_VALIDACAO',
    UF: lead.state || lead.uf || 'BR',
    CIDADE: lead.city || '',
    CATEGORIA_MEDICO: classification.segment,
    STATUS_PROSPECCAO: 'CONVITE_ENVIADO'
  };

  if (phone) {
    attributes.WHATSAPP = phone;
  }

  try {
    const res = await fetch(`${BREVO_BASE}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email: fallbackEmail,
        attributes,
        listIds: [BREVO_LIST_MEDICOS],
        updateEnabled: true
      })
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      log(`   📥 [BREVO CRM] Médico cadastrado com sucesso: Dr(a). ${cleanName} (${fallbackEmail}) [${classification.segment}]`);
      return true;
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.code === 'duplicate_parameter') return true;
      log(`   ⚠️ [BREVO AVISO]: ${err.message || res.statusText}`);
      return false;
    }
  } catch (e) {
    log(`   ⚠️ [BREVO ERRO CONEXÃO]: ${e.message}`);
    return false;
  }
}

// Constrói HTML do e-mail oficial personalizado
function buildInvitationEmailHtml(lead, classification) {
  const cleanName = (lead.name || 'Doutor(a)').replace(/^dr\(a\)\.?\s+/i, '').replace(/^dr\.?\s+/i, '').replace(/^dra\.?\s+/i, '').trim();
  const isCannabis = classification.segment === 'PRESCRITOR_CANNABIS';

  const headline = isCannabis
    ? `Acolhimento e Consultório Digital Completo para sua Prática Canabinoide`
    : `Seu Consultório Digital e Telemedicina Completa sem Custos Fixos`;

  const focusParagraph = isCannabis
    ? `Sabemos da alta demanda de pacientes que necessitam de terapia com fitocanabinoides (CBD/THC) com segurança regulatória (RDC 660 e 327 da ANVISA). Na Planta y Raíz, nós estruturamos um ecossistema que entrega pacientes já triados e educados pela nossa Enfermeira Brisa diretamente para a sua agenda médica, com total autonomia para sua conduta e titulação de doses.`
    : `Como colegas médicos, sabemos dos desafios de custos fixos, aluguel de consultório e burocracia para quem busca independência clínica. Criamos a Planta y Raíz exatamente para ser o seu ecossistema digital pronto: prontuário CFM integrado, emissor de receitas com QR Code e encaminhamento direto de pacientes para sua agenda de telemedicina, sem qualquer mensalidade de entrada.`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Convite Oficial Planta y Raíz</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7faf8; margin: 0; padding: 24px; color: #1f2937;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
    
    <!-- Cabeçalho Institucional -->
    <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Planta y Raíz 🌿🩺</h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Medicina Integrativa • Telemedicina CFM • Cannabis Medicinal</p>
    </div>

    <!-- Corpo do E-mail -->
    <div style="padding: 32px 28px; line-height: 1.6; font-size: 15px;">
      <p style="font-size: 17px; font-weight: 600; color: #064e3b; margin-top: 0;">
        Olá, Dr(a). ${cleanName}, tudo bem?
      </p>

      <p>
        Me chamo <strong>Dr. Edilson Bezerra</strong>, sou médico formado em 2018 com atuação em medicina integrativa e fundador da <strong>Planta y Raíz</strong>.
      </p>

      <p>
        Estou entrando em contato diretamente com o senhor(a) porque identificamos seu perfil como profissional de grande destaque na área de <strong>${lead.specialty || classification.roleLabel}</strong>.
      </p>

      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #065f46;">${headline}</h3>
        <p style="margin: 0; font-size: 14px; color: #047857;">${focusParagraph}</p>
      </div>

      <p><strong>Por que prescrever na Planta y Raíz?</strong></p>
      <ul style="padding-left: 20px; color: #374151;">
        <li style="margin-bottom: 8px;"><strong>Consultório Virtual Gratuito:</strong> Sem taxas de adesão ou mensalidades obrigatórias.</li>
        <li style="margin-bottom: 8px;"><strong>Prontuário Eletrônico CFM:</strong> Anamnese, histórico integrado e suporte ao protocolo terapêutico de 8 semanas.</li>
        <li style="margin-bottom: 8px;"><strong>Receitas Digitais com QR Code:</strong> Aceitas em 100% das farmácias do Brasil e processos de importação ANVISA (RDC 660 e 327).</li>
        <li style="margin-bottom: 8px;"><strong>Pacientes 100% do Médico:</strong> Total soberania de conduta, acompanhamento e retornos agendados diretamente com você.</li>
        <li style="margin-bottom: 8px;"><strong>Repasse Financeiro Instantâneo via PIX:</strong> 93% líquido do valor da consulta (taxa fixa de apenas 7% da plataforma), com Plano Premium opcional (R$ 99/mês) para prioridade na fila e ferramentas de IA.</li>
      </ul>

      <!-- CTA Principal -->
      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="https://www.plantayraiz.com.br/cadastro-profissional?origem=convite_diretoria" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 6px rgba(5,150,105,0.3);">
          Ativar Meu Consultório Virtual Gratuito
        </a>
      </div>

      <p style="font-size: 13px; text-align: center; color: #6b7280; margin-bottom: 24px;">
        Leva menos de 2 minutos. Você pode enviar seus documentos (CRM, RG/CNH) diretamente pelo nosso WhatsApp.
      </p>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <p style="margin-bottom: 4px;">
        Caso prefira tirar qualquer dúvida técnica diretamente comigo ou com a nossa coordenação clínica:
      </p>
      <p style="margin: 0; font-size: 14px;">
        💬 <strong>WhatsApp da Coordenação Clínica:</strong> <a href="https://wa.me/5511991363154" style="color: #059669; text-decoration: none;">(11) 99136-3154</a><br>
        🌐 <strong>Conheça a Vitrine:</strong> <a href="https://plantayraiz.com.br/profissionais" style="color: #059669; text-decoration: none;">plantayraiz.com.br/profissionais</a>
      </p>

      <p style="margin-top: 24px; font-size: 14px; color: #374151;">
        Será uma honra tê-lo(a) conosco construindo a maior e mais humanizada clínica digital do país.<br><br>
        Um caloroso abraço colegiado,<br>
        <strong>Dr. Edilson Bezerra</strong><br>
        <span style="font-size: 13px; color: #6b7280;">Fundador & Diretor Técnico • Planta y Raíz Ltda</span>
      </p>
    </div>

    <!-- Rodapé -->
    <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
      Planta y Raíz Ltda • Plataforma de Telemedicina e Saúde Integrativa<br>
      Resolução CFM nº 2.314/2022 • RDC ANVISA 660/2022
    </div>
  </div>
</body>
</html>
  `;
}

// Envia o e-mail oficial via Brevo API Transacional com fallback SMTP
async function sendDoctorInvitationEmail(lead, classification) {
  if (!lead.email) return false;

  const cleanName = (lead.name || 'Doutor(a)').replace(/^dr\(a\)\.?\s+/i, '').replace(/^dr\.?\s+/i, '').replace(/^dra\.?\s+/i, '').trim();
  const isCannabis = classification.segment === 'PRESCRITOR_CANNABIS';

  const subject = isCannabis
    ? `Dr(a). ${cleanName}, convite para o corpo clínico de prescritores da Planta y Raíz 🌿🩺`
    : `Dr(a). ${cleanName}, seu Consultório Digital e Telemedicina sem custos fixos na Planta y Raíz 🌿🩺`;

  const html = buildInvitationEmailHtml(lead, classification);

  // 1. Envio primário via Brevo API Transacional (Alta entregabilidade, DKIM/SPF 100% verificado)
  try {
    const res = await fetch(`${BREVO_BASE}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Dr. Edilson Bezerra | Planta y Raíz', email: 'contato@plantayraiz.com.br' },
        to: [{ email: lead.email, name: `Dr(a). ${cleanName}` }],
        subject,
        htmlContent: html
      })
    });

    if (res.ok || res.status === 201) {
      log(`   ✉️ [E-MAIL ENVIADO VIA BREVO]: Dr(a). ${cleanName} <${lead.email}> [${classification.segment}]`);
      return true;
    } else {
      const errData = await res.json().catch(() => ({}));
      log(`   ⚠️ Brevo retorno (${res.status}): ${errData.message || res.statusText}`);
    }
  } catch (e) {
    log(`   ⚠️ Brevo SMTP falhou, tentando fallback: ${e.message}`);
  }

  // 2. Fallback via Hostinger SMTP
  try {
    await transporter.sendMail({
      from: `"Dr. Edilson Bezerra | Planta y Raíz" <${SMTP_USER}>`,
      replyTo: SMTP_USER,
      to: lead.email,
      subject,
      html
    });
    log(`   ✉️ [E-MAIL ENVIADO VIA HOSTINGER]: Dr(a). ${cleanName} <${lead.email}> [${classification.segment}]`);
    return true;
  } catch (e) {
    log(`   ⚠️ [FALHA E-MAIL]: ${lead.email} - ${e.message}`);
    return false;
  }
}

}

// Carrega todos os leads disponíveis nas bases locais
function loadAllLocalLeads() {
  const allLeads = [];
  const files = [
    { name: 'unregistered_doctors_leads.json', defaultSegment: 'FORMADO_POS_2020' },
    { name: 'clinicos_gerais_pos2020_leads.json', defaultSegment: 'FORMADO_POS_2020' },
    { name: 'linkedin_prescribers_leads.json', defaultSegment: 'PRESCRITOR_CANNABIS' }
  ];

  for (const f of files) {
    const p = path.join(__dirname, f.name);
    if (fs.existsSync(p)) {
      try {
        const list = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (Array.isArray(list)) {
          for (const item of list) {
            allLeads.push({
              name: item.name || item.title || '',
              email: extractEmail(item.email),
              phone: normalizePhone(item.phone || item.whatsapp),
              specialty: item.specialty || item.headline || '',
              city: item.city || '',
              state: item.state || item.uf || '',
              crm: item.crm || ''
            });
          }
        }
      } catch (e) {}
    }
  }

  // Deduplicação inicial
  const seen = new Set();
  const unique = [];
  for (const l of allLeads) {
    const key = l.email || l.phone;
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(l);
    }
  }

  return unique;
}

// Ciclo Principal Autônomo
async function runHuntingCycle() {
  log(`\n========================================================================`);
  log(`🚀 INICIANDO CICLO DE CAPTAÇÃO: MÉDICOS PRESCRITORES & FORMADOS PÓS-2020`);
  log(`========================================================================`);

  const state = loadState();
  const allLeads = loadAllLocalLeads();
  log(`📊 Total de médicos minerados na base de conhecimento: ${allLeads.length}`);

  let sentInThisCycle = 0;
  const maxPerCycle = 15; // Lote seguro por rodada para máxima entregabilidade

  for (const lead of allLeads) {
    const leadKey = lead.email || lead.phone;
    if (!leadKey || state.processedKeys.includes(leadKey)) {
      continue;
    }

    const classification = classifyTargetDoctor(lead);
    log(`🎯 Processando lead: ${lead.name} (${lead.email || lead.phone}) -> [${classification.segment}]`);

    // 1. Cadastra/Atualiza no Brevo CRM (Lista 6)
    await syncToBrevoCRM(lead, classification);
    state.brevoSyncedCount = (state.brevoSyncedCount || 0) + 1;

    // 2. Se possuir e-mail válido, dispara a carta convite do Dr. Edilson
    if (lead.email) {
      const sent = await sendDoctorInvitationEmail(lead, classification);
      if (sent) {
        state.emailsSentCount = (state.emailsSentCount || 0) + 1;
        sentInThisCycle++;
      }
    }

    state.processedKeys.push(leadKey);
    saveState(state);

    if (sentInThisCycle >= maxPerCycle) {
      log(`🛑 Lote de ${maxPerCycle} e-mails concluído com sucesso neste ciclo.`);
      break;
    }

    // Intervalo suave de 30 a 60 segundos entre cada médico
    const delay = Math.floor(Math.random() * 30000) + 30000;
    await sleep(delay);
  }

  state.lastCycleAt = new Date().toISOString();
  saveState(state);

  log(`✨ Ciclo finalizado! Total acumulado: ${state.emailsSentCount || 0} e-mails enviados | ${state.brevoSyncedCount || 0} médicos sincronizados no Brevo CRM.`);
  log(`⏳ Próximo ciclo agendado para 15 minutos...`);
}

// Loop 24x7 contínuo e auto-recuperável
async function main() {
  log(`🌟 AGENTE HUNTER: Prescritores Cannabis & Médicos 2020+ INICIALIZADO (24/7 Autônomo)`);

  while (true) {
    try {
      await runHuntingCycle();
    } catch (err) {
      log(`❌ Erro no ciclo de captação: ${err.message}. Auto-recuperando em 60 segundos...`);
    }
    await sleep(15 * 60 * 1000); // 15 minutos entre rodadas
  }
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
});
