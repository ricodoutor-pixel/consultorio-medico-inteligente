/**
 * Script de Campanha de Email — Planta y Raíz Ltda
 * Importa contatos no CRM Brevo e envia convites via SMTP Hostinger
 * Com cabeçalho executivo e marcação de leitura (Disposition-Notification-To)
 * 
 * Uso: node scripts/send-invite-campaign.js [--batch=50] [--dry-run] [--offset=0]
 */
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// SMTP credentials from .env
const SMTP_HOST = 'smtp.hostinger.com';
const SMTP_PORT = 465;
const SMTP_USER = 'contato@plantayraiz.com.br';
const SMTP_PASS = process.env.SMTP_PASS || '95654045Pa#';

// Parse CLI args
const args = process.argv.slice(2);
const getDryRun = args.includes('--dry-run');
const getBatch = parseInt((args.find(a => a.startsWith('--batch=')) || '--batch=50').split('=')[1]);
const getOffset = parseInt((args.find(a => a.startsWith('--offset=')) || '--offset=0').split('=')[1]);

const SUBJECT = 'Convite Exclusivo: Seja Médico Sócio Prescritor de Cannabis Medicinal na Planta y Raíz Ltda | A Revolução da Medicina Canabinoide';

function buildHTML(doctorName) {
  const firstName = (doctorName || 'Doutor(a)').split(' ')[0];
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:680px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0f4c35 0%,#10b981 100%);padding:40px 30px;text-align:center;">
    <h1 style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:2px;">PLANTA Y RAÍZ LTDA</h1>
    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);letter-spacing:3px;font-weight:600;">MEGA CLÍNICA DIGITAL · TELEMEDICINA CANABINOIDE</p>
    <div style="width:60px;height:3px;background:rgba(255,255,255,0.4);margin:18px auto 0;border-radius:2px;"></div>
  </div>
  <div style="padding:35px 30px;line-height:1.7;color:#1e293b;font-size:15px;">
    <p style="font-size:16px;">Prezado(a) <strong>Dr(a). ${firstName}</strong>,</p>
    <p>A medicina canabinoide no Brasil vive uma expansão sem precedentes, com empresas faturando na casa dos <strong>30 milhões por ano</strong>. No entanto, sabemos que a grande maioria das plataformas tradicionais de telemedicina sufoca a autonomia médica com taxas comissionais abusivas, repasses demorados e ferramentas tecnológicas ultrapassadas.</p>
    <p>É com grande honra que convidamos você para se tornar <strong style="color:#059669;">Médico Sócio Prescritor</strong> na Planta y Raíz — oficialmente desenvolvida por médicos para ser a melhor, mais rentável e mais completa plataforma de telemedicina canabinoide do planeta.</p>
    <h3 style="color:#0f4c35;font-size:17px;margin:25px 0 10px;border-bottom:2px solid #10b981;padding-bottom:8px;">🏆 Planta y Raíz vs. Mercado Tradicional</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
      <thead><tr style="background:#0f4c35;color:#fff;">
        <th style="padding:10px 8px;text-align:left;border:1px solid #1a6b4a;">Diferencial</th>
        <th style="padding:10px 8px;text-align:center;border:1px solid #1a6b4a;">Tradicionais</th>
        <th style="padding:10px 8px;text-align:center;border:1px solid #1a6b4a;background:#059669;">Planta y Raíz</th>
      </tr></thead>
      <tbody>
        <tr style="background:#f8fafb;"><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Taxa</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">20-45%</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Apenas 7%</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Repasse</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">30-60 dias</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">PIX Instantâneo</td></tr>
        <tr style="background:#f8fafb;"><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Preço Consulta</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Tabela fixa</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Liberdade Total</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Parceria</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">Prestador</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Sócio Prescritor</td></tr>
        <tr style="background:#f8fafb;"><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Indicação</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Inexistente</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">3ª Geração</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Adesão</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Mensalidades</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">100% Gratuito</td></tr>
      </tbody>
    </table>
    <h3 style="color:#0f4c35;margin:25px 0 10px;">🚀 O que torna a Planta y Raíz Irresistível?</h3>
    <p><strong>💰 Potencial de até R$ 45.000/mês</strong> — 10 pacientes/dia a R$ 150, retenção de 93%, PIX instantâneo, distribuição de lucros e rede de indicação em 3 gerações.</p>
    <p><strong>🧠 Tecnologia & IA</strong> — Robô de triagem, prescritor canábico inteligente (CBD/THC/CYP450), workspace split-pane HD, perfil de visibilidade global.</p>
    <p><strong>🛡️ Compliance & Segurança</strong> — 100% conforme CFM, ANVISA e LGPD. Assistência jurídica especializada.</p>
    <blockquote style="border-left:4px solid #10b981;padding:12px 16px;margin:20px 0;background:#f0fdf4;font-style:italic;color:#065f46;font-size:14px;">"Não seja apenas mais um médico em plataformas que valorizam a própria margem. Seja sócio da plataforma que valoriza o seu conhecimento."</blockquote>
    <h3 style="color:#0f4c35;margin:25px 0 10px;">🌿 Faça Parte Desta Revolução!</h3>
    <p>Cadastro <strong>totalmente gratuito</strong> — menos de 2 minutos.</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="https://plantayraiz.com.br/cadastro-profissional" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:16px 40px;font-size:17px;font-weight:800;text-decoration:none;border-radius:8px;box-shadow:0 4px 14px rgba(16,185,129,0.4);">👉 CADASTRO GRATUITO</a>
    </div>
    <p style="text-align:center;font-size:13px;color:#64748b;">WhatsApp: <strong>(55) 11 99136-3154</strong> | <a href="https://plantayraiz.com.br" style="color:#059669;">plantayraiz.com.br</a></p>
  </div>
  <div style="background:#f1f5f9;border-top:1px solid #e2e8f0;padding:25px 30px;">
    <p style="margin:0 0 5px;font-size:14px;color:#334155;">Atenciosamente,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:#0f4c35;">Enf. Brisa</p>
    <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Departamento de Marketing Médico</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:15px 0;">
    <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">Planta y Raíz Ltda · A Plataforma nº 1 de Telemedicina Canabinoide do planeta.</p>
  </div>
</div>
</body></html>`;
}

function parseCSV(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    // Simple CSV parsing (handles basic cases)
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    values.push(current.trim());
    
    const obj = {};
    header.forEach((h, i) => { obj[h.trim()] = values[i] || ''; });
    return obj;
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('  PLANTA Y RAÍZ — Campanha de Convite Prescritores');
  console.log('='.repeat(60));
  console.log(`  Modo: ${getDryRun ? 'DRY RUN (sem envio real)' : 'ENVIO REAL'}`);
  console.log(`  Batch: ${getBatch} | Offset: ${getOffset}`);
  console.log('');

  // Read contacts
  const csvPath = path.join(__dirname, '..', 'prescritores_abrace.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV não encontrado:', csvPath);
    process.exit(1);
  }

  const allContacts = parseCSV(csvPath);
  console.log(`📋 Total contatos no CSV: ${allContacts.length}`);
  
  const batch = allContacts.slice(getOffset, getOffset + getBatch);
  console.log(`📨 Processando lote: ${getOffset + 1} a ${getOffset + batch.length}`);
  console.log('');

  // Create SMTP transport
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('✅ Conexão SMTP verificada com sucesso!');
  } catch (err) {
    console.error('❌ Falha na conexão SMTP:', err.message);
    process.exit(1);
  }

  let sent = 0, failed = 0;
  const log = [];

  for (let i = 0; i < batch.length; i++) {
    const contact = batch[i];
    const email = contact.EMAIL;
    const name = `${contact.FIRSTNAME || ''} ${contact.LASTNAME || ''}`.trim();
    
    if (!email || !email.includes('@')) {
      console.log(`  ⏭️  [${i + 1}/${batch.length}] Ignorado (sem email): ${name}`);
      failed++;
      continue;
    }

    try {
      if (!getDryRun) {
        const info = await transporter.sendMail({
          from: `"Planta y Raíz · Enf. Brisa" <${SMTP_USER}>`,
          to: `"${name}" <${email}>`,
          subject: SUBJECT,
          html: buildHTML(name),
          headers: {
            'Disposition-Notification-To': SMTP_USER,
            'Return-Receipt-To': SMTP_USER,
            'X-Confirm-Reading-To': SMTP_USER,
            'X-Campaign': 'invite-prescritores-abrace',
          },
        });
        
        console.log(`  ✅ [${i + 1}/${batch.length}] Enviado: ${name} <${email}> (${info.messageId})`);
        log.push({ status: 'sent', email, name, messageId: info.messageId, time: new Date().toISOString() });
      } else {
        console.log(`  🔵 [${i + 1}/${batch.length}] [DRY] ${name} <${email}>`);
        log.push({ status: 'dry', email, name });
      }
      sent++;
      
      // Rate limiting: 1 email per second
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.log(`  ❌ [${i + 1}/${batch.length}] Falha: ${name} <${email}> — ${err.message}`);
      log.push({ status: 'failed', email, name, error: err.message });
      failed++;
    }
  }

  // Save log
  const logPath = path.join(__dirname, '..', `campaign_log_${getOffset}_${getOffset + batch.length}.json`);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8');

  console.log('');
  console.log('='.repeat(60));
  console.log(`  ✅ Enviados: ${sent}`);
  console.log(`  ❌ Falhas: ${failed}`);
  console.log(`  📄 Log: ${logPath}`);
  console.log(`  📌 Próximo offset: --offset=${getOffset + batch.length}`);
  console.log('='.repeat(60));

  transporter.close();
}

main().catch(console.error);
