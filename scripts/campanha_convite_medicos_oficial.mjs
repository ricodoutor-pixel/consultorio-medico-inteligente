/**
 * scripts/campanha_convite_medicos_oficial.mjs
 * 
 * NOVA CAMPANHA OFICIAL DE E-MAILS: CONVITE MÉDICOS SÓCIOS PRESCRITORES
 * Planta y Raíz Ltda
 * 
 * Envia convites personalizados com foco exclusivo na base de médicos cadastrados
 * e prospectados (Brevo Listas 6, 8, 9 + Base de Prescritores).
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const DOCTORS_FILE = path.join(__dirname, 'unregistered_doctors_leads.json');
const MASTER_FILE = path.join(__dirname, 'prescritores_master_list.json');
const PROGRESS_FILE = path.join(__dirname, 'campanha_medicos_oficial_progress.json');
const LOG_FILE = path.join(__dirname, 'campanha_medicos_oficial.log');

const SMTP_USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SENDER_NAME = 'Planta y Raíz | Expansão Médica';

// Transporter Hostinger SMTP Oficial
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  pool: true,
  maxConnections: 1,
  rateLimit: 1
});

function log(msg) {
  const line = `[${new Date().toISOString()}] [CAMPANHA-MEDICOS] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch {}
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Carregar progresso da campanha
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {}
  }
  return {
    startedAt: new Date().toISOString(),
    totalSent: 0,
    totalFailed: 0,
    sentEmails: {}
  };
}

function saveProgress(prog) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(prog, null, 2), 'utf8');
  } catch {}
}

// Carregar e deduplicar médicos
function loadAllDoctors() {
  const map = new Map();

  function addDoc(doc) {
    const email = (doc.email || '').trim().toLowerCase();
    if (!email || !email.includes('@') || email.includes('undefined') || email.endsWith('.fake')) return;
    if (!map.has(email)) {
      map.set(email, {
        nome: doc.name || doc.nome || 'Doutor(a)',
        crm: doc.crm || '',
        estado: doc.estado || doc.crm_state || '',
        especialidade: doc.especialidade || doc.specialty || 'Medicina Canabinoide',
        email
      });
    }
  }

  if (fs.existsSync(DOCTORS_FILE)) {
    try {
      const list = JSON.parse(fs.readFileSync(DOCTORS_FILE, 'utf8'));
      list.forEach(addDoc);
    } catch {}
  }

  if (fs.existsSync(MASTER_FILE)) {
    try {
      const list = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf8'));
      list.forEach(addDoc);
    } catch {}
  }

  return Array.from(map.values());
}

// Gerar HTML de Alta Conversão
function generateDoctorInviteHTML(doc) {
  let nomeLimpo = doc.nome.replace(/^Dr\(a\)\.\s*/i, '').replace(/^Dr\.\s*/i, '').replace(/^Dra\.\s*/i, '').trim();
  const nomeExibicao = nomeLimpo ? `Dr(a). ${nomeLimpo}` : 'Prezado(a) Doutor(a)';
  const linkAtivacao = `https://www.plantayraiz.com.br/medicos/ativar?utm_source=email_campanha_oficial&utm_medium=email&utm_campaign=convite_socios_prescritores_2026&email=${encodeURIComponent(doc.email)}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite Oficial: Médico Sócio Prescritor | Planta y Raíz</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 0; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    
    <!-- Cabeçalho -->
    <tr>
      <td style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 36px 30px; text-align: center;">
        <span style="background-color: rgba(255,255,255,0.18); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 20px; display: inline-block; margin-bottom: 12px;">
          Convite Exclusivo para Prescritores
        </span>
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Planta y Raíz Ltda</h1>
        <p style="color: #a7f3d0; margin: 8px 0 0 0; font-size: 14px; font-weight: 500;">
          A Maior Rede de Medicina Canabinoide Integrativa & Telemedicina do Brasil
        </p>
      </td>
    </tr>

    <!-- Corpo do E-mail -->
    <tr>
      <td style="padding: 36px 30px;">
        <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 18px;">
          Olá, ${nomeExibicao},
        </p>
        
        <p style="font-size: 15px; line-height: 1.65; color: #334155; margin-bottom: 20px;">
          A medicina canabinoide no Brasil vive seu momento de maior expansão científica e regulatória. No entanto, sabemos que a maioria das plataformas tradicionais de telemedicina cobra taxas comissionadas abusivas (de 20% a até 40%), atrasa repasses financeiros e impõe burocracias desnecessárias ao médico.
        </p>

        <p style="font-size: 15px; line-height: 1.65; color: #334155; margin-bottom: 24px;">
          É com imensa honra que convidamos você para se tornar <strong>Médico(a) Sócio(a) Prescritor(a)</strong> na <strong>Planta y Raíz</strong> — desenvolvida por médicos e farmacêuticos para garantir <em>autonomia total, segurança jurídica perante o CFM/Anvisa e a maior rentabilidade do país</em>.
        </p>

        <!-- Tabela Comparativa de Diferenciais -->
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; margin-bottom: 26px;">
          <h3 style="margin: 0 0 14px 0; font-size: 15px; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px;">
            🏆 Por que a Planta y Raíz é Incomparável:
          </h3>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Sua Retenção de Honorários:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #047857; font-weight: 700; text-align: right;">93% (Taxa de apenas 7%)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Repasse Financeiro:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #047857; font-weight: 700; text-align: right;">Instantâneo via PIX após consulta</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Preço da Consulta:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #047857; font-weight: 700; text-align: right;">100% Livre (Você define seu valor)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Prontuário & Emissão de Receitas:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #047857; font-weight: 700; text-align: right;">Assinatura Digital ICP-Brasil + IA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #475569;"><strong>Custo de Adesão:</strong></td>
              <td style="padding: 8px 0; color: #047857; font-weight: 700; text-align: right;">100% Gratuito</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 15px; line-height: 1.65; color: #334155; margin-bottom: 26px;">
          Além disso, você conta com o suporte da <strong>Enfermeira Brisa</strong> para fazer a acolhida e a triagem preliminar dos pacientes antes de entrar no seu consultório, poupando seu tempo clínico para o que realmente importa: a escuta qualificada e o plano terapêutico.
        </p>

        <!-- Botão de Ação (CTA) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 32px 0;">
          <tr>
            <td align="center">
              <a href="${linkAtivacao}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 36px; border-radius: 8px; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.35); letter-spacing: 0.2px;">
                Ativar Meu Consultório Virtual Grátis →
              </a>
            </td>
          </tr>
        </table>

        <!-- Suporte e Contato Oficial -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; text-align: center;">
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #166534; font-weight: 600;">
            Tem dúvidas ou gostaria de falar com nossa coordenação médica?
          </p>
          <p style="margin: 0; font-size: 14px; color: #047857;">
            📱 WhatsApp Oficial de Apoio Clínico: 
            <a href="https://wa.me/5511991363154" style="color: #047857; font-weight: 800; text-decoration: underline;">
              (11) 99136-3154
            </a>
          </p>
        </div>
      </td>
    </tr>

    <!-- Rodapé -->
    <tr>
      <td style="background-color: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
          <strong>Planta y Raíz Ltda</strong> — CNPJ 58.742.607/0001-39<br>
          São Paulo, SP | Atendimento Nacional em Telemedicina
        </p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          Conformidade CFM nº 2.314/2022 | ANVISA RDC nº 660/2022 e RDC nº 327/2019.<br>
          Se não deseja receber mais estes convites, <a href="https://www.plantayraiz.com.br/optout?email=${encodeURIComponent(doc.email)}" style="color: #94a3b8; text-decoration: underline;">clique aqui para descadastrar</a>.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Execução Principal da Campanha
async function startCampaign() {
  log('================================================================');
  log('🚀 INICIANDO NOVA CAMPANHA OFICIAL DE E-MAILS PARA MÉDICOS 2026');
  log('================================================================');

  const progress = loadProgress();
  const allDoctors = loadAllDoctors();

  log(`📋 Total de médicos únicos na base: ${allDoctors.length}`);
  log(`📊 Total já disparados anteriormente nesta campanha: ${Object.keys(progress.sentEmails).length}`);

  const pendingDoctors = allDoctors.filter(d => !progress.sentEmails[d.email]);
  log(`🎯 Médicos pendentes para envio nesta campanha: ${pendingDoctors.length}`);

  if (pendingDoctors.length === 0) {
    log('🎉 Todos os médicos da lista já receberam o convite oficial!');
    return;
  }

  for (let i = 0; i < pendingDoctors.length; i++) {
    const doc = pendingDoctors[i];
    const html = generateDoctorInviteHTML(doc);
    const subject = `Convite Oficial: Seja Médico Sócio Prescritor na Planta y Raíz | A Revolução da Medicina Canabinoide`;

    try {
      log(`[${i + 1}/${pendingDoctors.length}] 🎯 Enviando para: ${doc.nome} <${doc.email}>...`);

      const info = await transporter.sendMail({
        from: `"${SENDER_NAME}" <${SMTP_USER}>`,
        to: doc.email,
        subject,
        html,
        headers: {
          'X-Campaign': 'Convite-Medicos-Socios-2026',
          'X-Entity-Ref-ID': `doc_${Date.now()}`
        }
      });

      log(`   ✅ E-mail entregue com sucesso! MsgID: ${info.messageId}`);

      progress.sentEmails[doc.email] = {
        sentAt: new Date().toISOString(),
        messageId: info.messageId,
        doctorName: doc.nome,
        specialty: doc.especialidade
      };
      progress.totalSent++;
      saveProgress(progress);

      // Intervalo seguro anti-spam (55 a 75 segundos entre disparos)
      const delay = Math.floor(Math.random() * (75000 - 55000 + 1)) + 55000;
      log(`   ⏳ Aguardando ${Math.round(delay / 1000)}s antes do próximo disparo...`);
      await sleep(delay);

    } catch (err) {
      log(`   ❌ Erro ao enviar para ${doc.email}: ${err.message}`);
      progress.totalFailed++;
      saveProgress(progress);
      await sleep(30000); // Pausa de recuperação em caso de erro
    }
  }

  log('🏁 CAMPANHA DE CONVITES PARA MÉDICOS FINALIZADA COM SUCESSO!');
}

startCampaign().catch(err => {
  log(`💥 Erro fatal na campanha: ${err.message}`);
});
