/**
 * Campanha de Email — Planta y Raíz Ltda
 * Envia convites via BREVO API (transacional)
 * com cabeçalho executivo e marcação de leitura
 *
 * Uso:
 *   $env:BREVO_API_KEY="xkeysib-SEU_TOKEN_AQUI" ; node scripts/send-brevo-campaign.mjs
 *   Opções: --batch=50  --offset=0  --dry-run
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CONFIGURAÇÃO ─────────────────────────────────────────────
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const FROM_EMAIL    = 'contato@plantayraiz.com.br';
const FROM_NAME     = 'Planta y Raíz · Enf. Brisa';
const SUBJECT       = 'Convite Exclusivo: Seja Médico Sócio Prescritor de Cannabis Medicinal na Planta y Raíz Ltda | A Revolução da Medicina Canabinoide';

// ── ARGS ─────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const BATCH     = parseInt((args.find(a => a.startsWith('--batch='))   || '--batch=50').split('=')[1]);
const OFFSET    = parseInt((args.find(a => a.startsWith('--offset='))  || '--offset=0').split('=')[1]);
// ─────────────────────────────────────────────────────────────

function buildHTML(fullName) {
  const firstName = (fullName || 'Doutor(a)').trim().split(' ')[0];
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">

<div style="max-width:680px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

  <!-- ═══ CABEÇALHO EXECUTIVO ═══ -->
  <div style="background:linear-gradient(135deg,#0a3d2e 0%,#10b981 100%);padding:40px 30px 36px;text-align:center;">
    <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:4px;text-transform:uppercase;font-weight:600;">BRASIL · TELEMEDICINA CANABINOIDE</p>
    <h1 style="margin:0;font-size:30px;font-weight:900;color:#ffffff;letter-spacing:3px;text-transform:uppercase;line-height:1.2;">PLANTA Y RAÍZ LTDA</h1>
    <p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,0.80);letter-spacing:4px;font-weight:700;text-transform:uppercase;">MEGA CLÍNICA DIGITAL</p>
    <div style="width:70px;height:2px;background:rgba(255,255,255,0.35);margin:20px auto 0;border-radius:2px;"></div>
  </div>

  <!-- ═══ CORPO ═══ -->
  <div style="padding:38px 32px;color:#1e293b;font-size:15px;line-height:1.75;">

    <p style="margin:0 0 16px;">Prezado(a) <strong>Dr(a). ${firstName}</strong>,</p>

    <p>A medicina canabinoide no Brasil vive uma expansão <strong>sem precedentes</strong>, com empresas faturando na casa dos <strong>R$ 30 milhões por ano</strong>. No entanto, sabemos que a grande maioria das plataformas tradicionais de telemedicina sufoca a autonomia médica com taxas comissionais abusivas, repasses demorados e ferramentas tecnológicas ultrapassadas.</p>

    <p>É com grande honra que convidamos você para se tornar <strong style="color:#059669;">Médico Sócio Prescritor</strong> na <strong>Planta y Raíz</strong> — oficialmente desenvolvida por médicos para ser a mais rentável, mais completa e mais justa plataforma de telemedicina canabinoide do país.</p>

    <!-- Tabela comparativa -->
    <h3 style="color:#0a3d2e;font-size:16px;margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #10b981;">🏆 Planta y Raíz vs. Mercado Tradicional</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:22px;">
      <thead>
        <tr style="background:#0a3d2e;color:#ffffff;">
          <th style="padding:10px 12px;text-align:left;border:1px solid #1e6b50;">Diferencial</th>
          <th style="padding:10px 12px;text-align:center;border:1px solid #1e6b50;">Plataformas Tradicionais</th>
          <th style="padding:10px 12px;text-align:center;border:1px solid #1e6b50;background:#059669;">✅ Planta y Raíz</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background:#f8fafb;"><td style="padding:9px 12px;border:1px solid #e2e8f0;font-weight:600;">Taxa da Plataforma</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">20% a 45%</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:700;">Apenas 7%</td></tr>
        <tr><td style="padding:9px 12px;border:1px solid #e2e8f0;font-weight:600;">Repasse Financeiro</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">30 a 60 dias</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:700;">PIX Instantâneo</td></tr>
        <tr style="background:#f8fafb;"><td style="padding:9px 12px;border:1px solid #e2e8f0;font-weight:600;">Preço da Consulta</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Tabela Fixa</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:700;">Liberdade Total</td></tr>
        <tr><td style="padding:9px 12px;border:1px solid #e2e8f0;font-weight:600;">Modelo de Parceria</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;">Prestador de serviço</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:700;">Sócio Prescritor</td></tr>
        <tr style="background:#f8fafb;"><td style="padding:9px 12px;border:1px solid #e2e8f0;font-weight:600;">Plano de Indicação</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Inexistente</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:700;">Rede 3ª Geração</td></tr>
        <tr><td style="padding:9px 12px;border:1px solid #e2e8f0;font-weight:600;">IA de Suporte</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;">Prontuários genéricos</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:700;">Robô IA Integrado</td></tr>
        <tr style="background:#f8fafb;"><td style="padding:9px 12px;border:1px solid #e2e8f0;font-weight:600;">Custo de Adesão</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Mensalidades</td><td style="padding:9px 12px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:700;">100% Gratuito</td></tr>
      </tbody>
    </table>

    <h3 style="color:#0a3d2e;margin:26px 0 12px;">🚀 Por que ser Sócio Prescritor?</h3>

    <p><strong>💰 Potencial de até R$ 45.000/mês</strong><br>
    Atenda 10 pacientes/dia a R$ 150. Retenção de 93%. PIX ao término de cada consulta. Distribuição de lucros por desempenho. Plano de Indicação em 3 gerações.</p>

    <p><strong>🧠 Tecnologia de Ponta</strong><br>
    Robô de triagem IA, prescritor canábico inteligente com calculadora de dosagem CBD/THC/CYP450, workspace split-pane HD (vídeo + prontuário), perfil de visibilidade global.</p>

    <p><strong>🛡️ Compliance & Segurança Jurídica</strong><br>
    100% conforme CFM, ANVISA e LGPD. Assistência jurídica especializada em medicina canabinoide inclusa.</p>

    <blockquote style="border-left:4px solid #10b981;padding:14px 18px;margin:24px 0;background:#f0fdf4;font-style:italic;color:#065f46;font-size:14px;border-radius:0 8px 8px 0;">
      "Não seja apenas mais um médico cadastrado em plataformas que valorizam apenas a própria margem. Seja sócio da plataforma que valoriza o seu conhecimento e a sua liberdade clínica."
    </blockquote>

    <h3 style="color:#0a3d2e;margin:26px 0 12px;">🌿 Como Começar?</h3>
    <p>Cadastro <strong>totalmente gratuito</strong> nesta campanha para os primeiros 100 médicos. Leva menos de 2 minutos.</p>

    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="https://plantayraiz.com.br/cadastro-profissional?utm_source=email&utm_medium=campanha&utm_campaign=prescritores-abrace&utm_content=cta-principal" style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:#fff;padding:17px 44px;font-size:17px;font-weight:800;text-decoration:none;border-radius:8px;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(16,185,129,0.45);">
        👉 FAÇA SEU CADASTRO GRATUITO
      </a>
    </div>

    <p style="text-align:center;font-size:13px;color:#64748b;margin:0;">
      Dúvidas? <strong>WhatsApp: (11) 99136-3154</strong><br>
      <a href="https://plantayraiz.com.br" style="color:#059669;">plantayraiz.com.br</a>
    </p>

  </div>

  <!-- ═══ RODAPÉ EXECUTIVO ═══ -->
  <div style="background:#f1f5f9;border-top:1px solid #e2e8f0;padding:24px 32px;">
    <p style="margin:0 0 4px;font-size:14px;color:#475569;">Atenciosamente,</p>
    <p style="margin:0;font-size:16px;font-weight:800;color:#0a3d2e;">Enf. Brisa</p>
    <p style="margin:3px 0 0;font-size:12px;color:#64748b;">Departamento de Marketing Médico · Planta y Raíz Ltda</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
    <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
      Planta y Raíz Ltda · MEGA CLÍNICA DIGITAL · A Plataforma nº 1 de Telemedicina Canabinoide<br>
      Para descadastrar responda com <em>REMOVER</em> ou clique
      <a href="https://plantayraiz.com.br/unsubscribe" style="color:#10b981;">aqui</a>.
    </p>
  </div>

</div>
</body>
</html>`;
}

// ── Parsing simples de CSV (suporta campos entre aspas) ──────
function parseCSV(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map(line => {
    const values = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { values.push(cur.trim().replace(/^"|"$/g, '')); cur = ''; }
      else cur += ch;
    }
    values.push(cur.trim().replace(/^"|"$/g, ''));
    const obj = {};
    header.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  }).filter(c => c.EMAIL && c.EMAIL.includes('@'));
}

// ── Importar contato no Brevo CRM ───────────────────────────
async function importContact(contact) {
  const payload = {
    email: contact.EMAIL,
    attributes: {
      FIRSTNAME:  contact.FIRSTNAME  || '',
      LASTNAME:   contact.LASTNAME   || '',
      SPECIALTY:  contact.SPECIALTY  || '',
      CITY:       contact.CITY       || '',
      STATE:      contact.STATE      || '',
      SMS:        contact.PHONE      || '',
    },
    listIds: [2],
    updateEnabled: true,
  };

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  // 204 = sucesso; "duplicate_parameter" = já existe (OK)
  return res.status === 204 || res.ok || text.includes('duplicate_parameter');
}

// ── Enviar email via Brevo transacional ─────────────────────
async function sendEmail(contact) {
  const fullName = `${contact.FIRSTNAME || ''} ${contact.LASTNAME || ''}`.trim() || 'Doutor(a)';

  const payload = {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: contact.EMAIL, name: fullName }],
    replyTo: { email: FROM_EMAIL, name: FROM_NAME },
    subject: SUBJECT,
    htmlContent: buildHTML(fullName),
    tags: ['invite-prescritores-abrace', 'campanha-2026'],
    headers: {
        'X-Campaign': 'invite-prescritores-abrace',
    },
    // ─── TRACKING COMPLETO ───────────────────────────────────
    trackOpens:  1,   // Pixel de abertura (saber quem leu)
    trackClicks: 1,   // Rastrear cliques no link CTA
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const data = await res.json();
    return { ok: true, messageId: data.messageId };
  } else {
    const err = await res.text();
    return { ok: false, error: err };
  }
}

// ── MAIN ────────────────────────────────────────────────────
async function main() {
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║   PLANTA Y RAÍZ — Campanha de Convite via BREVO API    ║');
  console.log('╚' + '═'.repeat(58) + '╝');

  if (!BREVO_API_KEY) {
    console.error('\n❌ ERRO: BREVO_API_KEY não definida!');
    console.error('   Execute: $env:BREVO_API_KEY="xkeysib-..." ; node scripts/send-brevo-campaign.mjs\n');
    process.exit(1);
  }

  console.log(`\n  Modo:   ${DRY_RUN ? '🔵 DRY RUN (sem envio)' : '🚀 ENVIO REAL'}`);
  console.log(`  Batch:  ${BATCH} contatos`);
  console.log(`  Offset: ${OFFSET}`);

  const csvPath = path.join(__dirname, '..', 'prescritores_abrace.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`\n❌ CSV não encontrado: ${csvPath}`);
    process.exit(1);
  }

  const allContacts = parseCSV(csvPath);
  const batch = allContacts.slice(OFFSET, OFFSET + BATCH);

  console.log(`\n  📋 Total no CSV:       ${allContacts.length}`);
  console.log(`  📨 Processando:        ${OFFSET + 1} → ${OFFSET + batch.length}`);
  console.log('  ' + '─'.repeat(56));

  let imported = 0, sent = 0, failed = 0;
  const log = [];

  for (let i = 0; i < batch.length; i++) {
    const c = batch[i];
    const fullName = `${c.FIRSTNAME} ${c.LASTNAME}`.trim();
    const idx = `[${String(OFFSET + i + 1).padStart(4, '0')}/${allContacts.length}]`;

    // 1. Importar no CRM
    let crmOk = false;
    if (!DRY_RUN) {
      try { crmOk = await importContact(c); if (crmOk) imported++; }
      catch { /* ignorar */ }
    } else {
      crmOk = true; imported++;
    }

    // 2. Enviar email
    if (!DRY_RUN) {
      const result = await sendEmail(c);
      if (result.ok) {
        console.log(`  ✅ ${idx} Enviado: ${fullName} <${c.EMAIL}>`);
        log.push({ status: 'sent', email: c.EMAIL, name: fullName, messageId: result.messageId, ts: new Date().toISOString() });
        sent++;
      } else {
        console.log(`  ❌ ${idx} Falha:   ${fullName} <${c.EMAIL}> → ${result.error?.substring(0, 80)}`);
        log.push({ status: 'failed', email: c.EMAIL, name: fullName, error: result.error });
        failed++;
      }
      // Respeitar limite de envio Brevo: ~2/seg
      await new Promise(r => setTimeout(r, 600));
    } else {
      console.log(`  🔵 ${idx} [DRY] ${fullName} <${c.EMAIL}>`);
      log.push({ status: 'dry', email: c.EMAIL, name: fullName });
      sent++;
    }
  }

  // Salvar log
  const logFile = path.join(__dirname, '..', `campaign_log_${OFFSET}-${OFFSET + batch.length}_${Date.now()}.json`);
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf-8');

  console.log('\n  ' + '═'.repeat(56));
  console.log(`  ✅ Importados no CRM: ${imported}`);
  console.log(`  📧 Emails enviados:   ${sent}`);
  console.log(`  ❌ Falhas:            ${failed}`);
  console.log(`  📄 Log salvo:         ${path.basename(logFile)}`);
  if (OFFSET + batch.length < allContacts.length) {
    console.log(`\n  ▶ Próximo lote:  node scripts/send-brevo-campaign.mjs --offset=${OFFSET + BATCH} --batch=${BATCH}`);
  } else {
    console.log(`\n  🎉 Campanha completa! Todos os contatos processados.`);
  }
  console.log('  ' + '═'.repeat(56) + '\n');
}

main().catch(console.error);
