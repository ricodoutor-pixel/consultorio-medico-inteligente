import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

const FROM_EMAIL    = 'contato@plantayraiz.com.br';
const FROM_NAME     = 'Planta y Raíz · Enf. Brisa';
const SUBJECT       = 'Convite Exclusivo: Seja Médico Sócio Prescritor de Cannabis Medicinal na Planta y Raíz Ltda | A Revolução da Medicina Canabinoide';

function buildHTML(fullName) {
  const firstName = (fullName || 'Doutor(a)').trim().split(' ')[0];
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<div style="max-width:680px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">
  <div style="background:linear-gradient(135deg,#0a3d2e 0%,#10b981 100%);padding:40px 30px 36px;text-align:center;">
    <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:4px;text-transform:uppercase;font-weight:600;">BRASIL · TELEMEDICINA CANABINOIDE</p>
    <h1 style="margin:0;font-size:30px;font-weight:900;color:#ffffff;letter-spacing:3px;text-transform:uppercase;line-height:1.2;">PLANTA Y RAÍZ LTDA</h1>
    <p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,0.80);letter-spacing:4px;font-weight:700;text-transform:uppercase;">MEGA CLÍNICA DIGITAL</p>
    <div style="width:70px;height:2px;background:rgba(255,255,255,0.35);margin:20px auto 0;border-radius:2px;"></div>
  </div>
  <div style="padding:38px 32px;color:#1e293b;font-size:15px;line-height:1.75;">
    <p style="margin:0 0 16px;">Prezado(a) <strong>Dr(a). ${firstName}</strong>,</p>
    <p>A medicina canabinoide no Brasil vive uma expansão <strong>sem precedentes</strong>, com empresas faturando na casa dos <strong>R$ 30 milhões por ano</strong>. No entanto, sabemos que a grande maioria das plataformas tradicionais de telemedicina sufoca a autonomia médica com taxas comissionais abusivas, repasses demorados e ferramentas tecnológicas ultrapassadas.</p>
    <p>É com grande honra que convidamos você para se tornar <strong style="color:#059669;">Médico Sócio Prescritor</strong> na <strong>Planta y Raíz</strong> — oficialmente desenvolvida por médicos para ser a mais rentável, mais completa e mais justa plataforma de telemedicina canabinoide do país.</p>
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

async function sendEmail(email, firstName, lastName) {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Doutor(a)';
  const payload = {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: email, name: fullName }],
    replyTo: { email: FROM_EMAIL, name: FROM_NAME },
    subject: SUBJECT,
    htmlContent: buildHTML(fullName),
    tags: ['invite-prescritores-abrace', 'campanha-2026'],
    headers: { 'X-Campaign': 'invite-prescritores-abrace' },
    trackOpens: 1,
    trackClicks: 1,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify(payload),
  });

  return res.ok;
}

async function main() {
  console.log('Recuperando histórico de emails enviados...');
  const sentEmails = new Set();
  
  // Lendo todos os arquivos json do root
  const files = fs.readdirSync(path.join(__dirname, '..')).filter(f => f.endsWith('.json'));
  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(__dirname, '..', f), 'utf-8');
      if (content.includes('"email"')) {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.email && item.status === 'sent') sentEmails.add(item.email.toLowerCase());
          });
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }
  
  console.log(`✅ ${sentEmails.size} emails encontrados nos logs de envio local.`);

  console.log('\nBuscando todos os contatos do Brevo (Lista 2)...');
  const allBrevoContacts = [];
  let limit = 50;
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const res = await fetch(`https://api.brevo.com/v3/contacts?limit=${limit}&offset=${offset}`, {
      headers: { 'api-key': BREVO_API_KEY }
    });
    if (!res.ok) {
      console.error('Erro ao buscar contatos do Brevo', await res.text());
      break;
    }
    const data = await res.json();
    if (data.contacts && data.contacts.length > 0) {
      allBrevoContacts.push(...data.contacts);
      offset += limit;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ ${allBrevoContacts.length} contatos encontrados na base do Brevo.`);
  
  // Filtra quem ainda nao recebeu
  const missing = allBrevoContacts.filter(c => !sentEmails.has(c.email.toLowerCase()));
  
  console.log(`\n🎯 Encontramos ${missing.length} contatos que AINDA NÃO RECEBERAM o email de convite!`);
  console.log('Iniciando o disparo final para eles com rastreamento ativado...');
  
  let sentCount = 0;
  for (let i = 0; i < missing.length; i++) {
    const c = missing[i];
    const email = c.email;
    const firstName = c.attributes?.FIRSTNAME || '';
    const lastName = c.attributes?.LASTNAME || '';
    
    const ok = await sendEmail(email, firstName, lastName);
    if (ok) {
      console.log(`  ✅ [Enviado] ${email}`);
      sentCount++;
    } else {
      console.log(`  ❌ [Falhou] ${email}`);
    }
    await new Promise(r => setTimeout(r, 600)); // Rate limit 2/seg
  }
  
  console.log(`\n🎉 Disparo dos remanescentes concluído! Foram enviados ${sentCount} emails.`);
}

main().catch(console.error);
