import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const SMTP_PASS = process.env.SMTP_PASS || '';

const MASTER_FILE = path.join(process.cwd(), 'scripts', 'prescritores_master_list.json');
const EMAIL_PROGRESS_FILE = path.join(process.cwd(), 'scripts', 'email_campaign_progress.json');

function getSentEmails() {
  if (fs.existsSync(EMAIL_PROGRESS_FILE)) {
    try {
      return new Set(JSON.parse(fs.readFileSync(EMAIL_PROGRESS_FILE, 'utf-8')));
    } catch {
      return new Set();
    }
  }
  return new Set();
}

function markEmailSent(email) {
  const sent = getSentEmails();
  sent.add(email);
  fs.writeFileSync(EMAIL_PROGRESS_FILE, JSON.stringify(Array.from(sent), null, 2));
}

function generateEmailHTML(prescritor) {
  const nomeStr = prescritor.nome ? `Dr(a). ${prescritor.nome}` : 'Prezado(a) Doutor(a)';
  const espStr = prescritor.especialidade ? `Especialista em ${prescritor.especialidade}` : 'Prescritor(a)';
  const locStr = [prescritor.cidade, prescritor.estado].filter(Boolean).join(' - ');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f7fafc; padding: 20px; }
      .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
      .header { border-bottom: 2px solid #38a169; padding-bottom: 16px; margin-bottom: 24px; text-align: center; }
      .title { color: #276749; font-size: 22px; font-weight: bold; margin: 0; }
      .subtitle { color: #718096; font-size: 14px; margin-top: 4px; }
      .badge { display: inline-block; background: #c6f6d5; color: #22543d; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }
      .table-comp { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .table-comp th, .table-comp td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
      .table-comp th { background-color: #f7fafc; }
      .cta-button { display: block; width: 220px; margin: 28px auto; padding: 14px 24px; background: #2f855a; color: #ffffff !important; text-align: center; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
      .footer { font-size: 12px; color: #a0aec0; text-align: center; margin-top: 32px; border-top: 1px solid #edf2f7; padding-top: 16px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1 class="title">Planta y Raíz Ltda</h1>
        <p class="subtitle">Plataforma nº 1 de Telemedicina e Ecossistema de Saúde Canabinoide</p>
      </div>

      <p>Prezado(a) <strong>${nomeStr}</strong>,</p>

      <p>A medicina canabinoide no Brasil vive uma expansão sem precedentes. Sabemos que a grande maioria das plataformas tradicionais de telemedicina impõe taxas abusivas, repasses demorados e pouca autonomia clínica.</p>

      <p>É com grande honra que convidamos você ${espStr ? `(${espStr})` : ''} ${locStr ? `de ${locStr}` : ''} para se tornar <strong>Médico(a) Sócio(a) Prescritor(a)</strong> na <strong>Planta y Raíz</strong>.</p>

      <table class="table-comp">
        <thead>
          <tr>
            <th>Diferencial</th>
            <th>Mercado Tradicional</th>
            <th><strong>Planta y Raíz</strong></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Sua Retenção</strong></td>
            <td>60% a 80%</td>
            <td><strong style="color:#276749;">93% da consulta fica com você</strong> (taxa de apenas 7%)</td>
          </tr>
          <tr>
            <td><strong>Repasse Financeiro</strong></td>
            <td>30 a 60 dias</td>
            <td><strong style="color:#276749;">PIX Instantâneo</strong> ao término do atendimento</td>
          </tr>
          <tr>
            <td><strong>Valor da Consulta</strong></td>
            <td>Tabela fixa imposta</td>
            <td><strong>Total Liberdade</strong> de precificação</td>
          </tr>
          <tr>
            <td><strong>Custo de Adesão</strong></td>
            <td>Mensalidades / Taxas</td>
            <td><span class="badge">100% GRATUITO</span></td>
          </tr>
        </tbody>
      </table>

      <p>Disponibilizamos também suporte com <strong>Inteligência Artificial (Enfermeira Brisa)</strong> para pré-triagem, prontuário eletrônico integrado e assistência jurídica especializada ANVISA/CFM/LGPD.</p>

      <a href="https://plantayraiz.com.br" class="cta-button">Realizar Cadastro Gratuito</a>

      <p style="font-size: 13px; color: #4a5568;">Seja muito bem-vindo(a) ao futuro da telemedicina canabinoide.</p>

      <div class="footer">
        <p>Planta y Raíz Ltda — Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)</p>
        <p>Caso não deseje mais receber nossas mensagens institucionais, responda este e-mail solicitando o descadastramento.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

async function startCampaign() {
  let nodemailer;
  try {
    nodemailer = (await import('nodemailer')).default;
  } catch (err) {
    console.error("❌ Dependência nodemailer não encontrada. Aguarde a instalação ou execute 'npm install nodemailer'.");
    process.exit(1);
  }

  if (!SMTP_USER || !SMTP_PASS) {
    console.error("❌ Credenciais SMTP ausentes no .env");
    process.exit(1);
  }

  console.log(`🔌 Conectando ao servidor SMTP Hostinger (${SMTP_HOST}:${SMTP_PORT})...`);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const list = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf-8'));
  const sentSet = getSentEmails();

  const validTargets = list.filter(item => item.email && item.email.includes('@'));
  console.log(`🚀 Iniciando envio de e-mails institucionais para ${validTargets.length} prescritores...`);
  console.log(`📊 E-mails já enviados anteriormente: ${sentSet.size}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < validTargets.length; i++) {
    const p = validTargets[i];
    if (sentSet.has(p.email)) continue;

    const nowStr = new Date().toLocaleTimeString('pt-BR');
    console.log(`[${nowStr}] [${i + 1}/${validTargets.length}] ✉️ Enviando e-mail para ${p.nome} <${p.email}>...`);

    try {
      await transporter.sendMail({
        from: `"Planta y Raíz - Diretoria Médica" <${SMTP_USER}>`,
        to: p.email,
        subject: `Convite Exclusivo: Seja Médico(a) Sócio(a) Prescritor(a) na Planta y Raíz`,
        html: generateEmailHTML(p)
      });

      console.log(`   ✅ E-mail enviado com sucesso!`);
      markEmailSent(p.email);
      sentSet.add(p.email);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Falha ao enviar para ${p.email}:`, err.message);
      failCount++;
    }

    // Intervalo de 3.5 segundos entre e-mails para evitar throttling no Hostinger SMTP
    if (i < validTargets.length - 1) {
      await new Promise(r => setTimeout(r, 3500));
    }
  }

  console.log("\n🎉 Disparo de e-mails concluído com sucesso!");
  console.log(`Total enviados: ${successCount} | Falhas: ${failCount}`);
}

startCampaign();
