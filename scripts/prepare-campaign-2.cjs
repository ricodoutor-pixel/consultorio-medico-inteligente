const fs = require('fs');
const path = require('path');

const originalPath = 'scripts/send-brevo-campaign.mjs';
const newPath = 'scripts/send-brevo-campaign-2.mjs';
const imagePath = 'C:/Users/ricod/.gemini/antigravity/brain/8fc9dbcb-be88-4ed8-8f60-cef90f4dfc20/.user_uploaded/media_1787724443703.jpg';

let content = fs.readFileSync(originalPath, 'utf-8');

// Replace SUBJECT
content = content.replace(
  /const SUBJECT\s*=\s*'.*?';/, 
  "const SUBJECT = 'Convite Exclusivo Por Tempo Limitado: Seja Médico Sócio Prescritor na Planta y Raíz';"
);

// New HTML
const newHTMLFunc = `
function buildHTML(doctorName) {
  return \`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Convite Especial</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;color:#1e293b;-webkit-font-smoothing:antialiased;">

<div style="max-w-width:640px;margin:30px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
  
  <div style="background:linear-gradient(135deg, #0f766e 0%, #047857 100%);padding:40px 32px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">A Revolução da Medicina Canabinoide</h1>
    <p style="margin:12px 0 0;color:#d1fae5;font-size:16px;">Seja Médico Sócio Prescritor na Planta y Raíz</p>
  </div>

  <div style="padding:40px 32px;">
    <p style="font-size:16px;line-height:1.6;margin:0 0 20px;">Prezado(a) <strong>\${doctorName}</strong>,</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 20px;">A medicina canabinoide no Brasil vive uma expansão sem precedentes. No entanto, sabemos que a grande maioria das plataformas tradicionais de telemedicina sufoca a autonomia médica com taxas comissionais abusivas, repasses demorados e ferramentas tecnológicas ultrapassadas.</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 32px;">É com grande honra que convidamos você para se tornar Médico Sócio Prescritor na Planta y Raíz — oficialmente desenvolvida para ser a melhor, mais rentável e mais completa plataforma de telemedicina canabinoide do planeta.</p>

    <h2 style="font-size:20px;color:#047857;margin:0 0 16px;">🏆 Planta y Raíz vs. Mercado Tradicional</h2>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Compilamos os nossos diferenciais para demonstrar por que a nossa plataforma é incomparável:</p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 32px;font-size:14px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:12px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Diferencial</th>
          <th style="padding:12px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Plataformas Tradicionais</th>
          <th style="padding:12px;border:1px solid #e2e8f0;text-align:left;color:#047857;">Planta y Raíz</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px;border:1px solid #e2e8f0;font-weight:600;">Taxa da Plataforma</td>
          <td style="padding:12px;border:1px solid #e2e8f0;">De 20% a 40% por consulta</td>
          <td style="padding:12px;border:1px solid #e2e8f0;color:#047857;font-weight:700;">Apenas 7% (você retém 93%)</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e2e8f0;font-weight:600;">Repasse Financeiro</td>
          <td style="padding:12px;border:1px solid #e2e8f0;">30 a 60 dias para receber</td>
          <td style="padding:12px;border:1px solid #e2e8f0;color:#047857;font-weight:700;">PIX Instantâneo ao término</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e2e8f0;font-weight:600;">Preço da Consulta</td>
          <td style="padding:12px;border:1px solid #e2e8f0;">Tabela fixa imposta</td>
          <td style="padding:12px;border:1px solid #e2e8f0;color:#047857;font-weight:700;">Total Liberdade para cobrar o valor que desejar</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e2e8f0;font-weight:600;">Modelo de Parceria</td>
          <td style="padding:12px;border:1px solid #e2e8f0;">Apenas prestador de serviço</td>
          <td style="padding:12px;border:1px solid #e2e8f0;color:#047857;font-weight:700;">Sócio Prescritor com distribuição de lucros</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e2e8f0;font-weight:600;">Plano de Indicação</td>
          <td style="padding:12px;border:1px solid #e2e8f0;">Inexistente</td>
          <td style="padding:12px;border:1px solid #e2e8f0;color:#047857;font-weight:700;">Rede de até 3ª Geração com comissões recorrentes</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e2e8f0;font-weight:600;">Suporte Diagnóstico</td>
          <td style="padding:12px;border:1px solid #e2e8f0;">Prontuários genéricos</td>
          <td style="padding:12px;border:1px solid #e2e8f0;color:#047857;font-weight:700;">Robô IA Auxiliar de triagem e suporte clínico</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e2e8f0;font-weight:600;">Custo de Adesão</td>
          <td style="padding:12px;border:1px solid #e2e8f0;">Mensalidades ou taxas de adesão</td>
          <td style="padding:12px;border:1px solid #e2e8f0;color:#047857;font-weight:700;">Cadastro 100% Gratuito</td>
        </tr>
      </tbody>
    </table>

    <h2 style="font-size:20px;color:#047857;margin:0 0 16px;">🚀 O que torna a Planta y Raíz Irresistível?</h2>
    
    <h3 style="font-size:16px;color:#334155;margin:0 0 8px;">💰 Potencial Financeiro de Elite</h3>
    <ul style="margin:0 0 20px 20px;padding:0;font-size:15px;line-height:1.5;">
      <li><strong>Retenção de 93%:</strong> Cobramos a menor taxa do mercado (apenas 7%). O fruto do seu trabalho fica com você.</li>
      <li><strong>Pagamento via PIX em Tempo Real:</strong> Concluiu o atendimento? O valor entra direto na sua conta.</li>
      <li><strong>Distribuição de Lucros por Desempenho:</strong> Como Sócio Prescritor, você participa do resultado global da plataforma.</li>
      <li><strong>Plano de Indicação em 3 Gerações:</strong> Monte sua rede de médicos parceiros e receba bonificações recorrentes.</li>
    </ul>

    <h3 style="font-size:16px;color:#334155;margin:0 0 8px;">🧠 Tecnologia de Ponta a Ponta & IA</h3>
    <ul style="margin:0 0 20px 20px;padding:0;font-size:15px;line-height:1.5;">
      <li><strong>Robô Auxiliar de Atendimento:</strong> Inteligência Artificial integrada que consolida a triagem.</li>
      <li><strong>Prescritor Canábico Inteligente:</strong> Calculadora de dosagem de CBD/THC e checagem de interações hepáticas (CYP450).</li>
      <li><strong>Workspace Split-Pane:</strong> Sala de videoconferência em HD criptografada e prontuário na mesma tela.</li>
      <li><strong>Perfil de Visibilidade Global:</strong> Seu perfil médico destacado para milhares de pacientes no Brasil e no mundo.</li>
    </ul>

    <h3 style="font-size:16px;color:#334155;margin:0 0 8px;">🛡️ Compliance Rígido, Segurança e Assistência Jurídica</h3>
    <ul style="margin:0 0 32px 20px;padding:0;font-size:15px;line-height:1.5;">
      <li>Atuamos em 100% de conformidade com o CFM, normativas da ANVISA e LGPD.</li>
      <li>Disponibilizamos suporte e assistência jurídica especializada em medicina canabinoide.</li>
    </ul>

    <blockquote style="margin:0 0 32px;padding:16px 20px;background:#f1f5f9;border-left:4px solid #10b981;font-size:16px;font-style:italic;color:#334155;">
      "Não seja apenas mais um médico cadastrado em plataformas que valorizam apenas a própria margem. Seja sócio da plataforma que valoriza o seu conhecimento e a sua liberdade."
    </blockquote>

    <div style="text-align:center;margin:40px 0;">
      <p style="font-size:16px;margin:0 0 16px;font-weight:600;">🌿 Faça Parte Desta Revolução! O cadastro é totalmente gratuito e leva menos de 2 minutos.</p>
      <a href="https://plantayraiz.com.br" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;font-size:18px;padding:18px 36px;border-radius:8px;box-shadow:0 4px 14px 0 rgba(5,150,105,0.39);">Realizar Cadastro Gratuito Agora</a>
    </div>

  </div>

  <div style="background:#f1f5f9;border-top:1px solid #e2e8f0;padding:24px 32px;">
    <p style="margin:0 0 8px;font-size:15px;color:#475569;">Atenciosamente,</p>
    <p style="margin:0 0 2px;font-size:16px;font-weight:800;color:#0a3d2e;">Diretoria Médica & Conselho Executivo</p>
    <p style="margin:0 0 12px;font-size:13px;color:#64748b;">Planta y Raíz — A Plataforma nº 1 de Telemedicina Canabinoide</p>
    
    <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;">
      💬 Fale conosco: (11) 99136-3154 (WhatsApp - Enfª Brisa)<br>
      ✉️ contato@plantayraiz.com.br
    </p>
  </div>
</div>
</body>
</html>\`;
}
`;

// Replace buildHTML function completely
content = content.replace(/function buildHTML.*?^}/ms, newHTMLFunc);

// Read image as base64
let imageBase64 = "";
try {
  imageBase64 = fs.readFileSync(imagePath, 'base64');
} catch(e) {
  console.log("Image not found");
}

const sendEmailFunc = `
async function sendEmail(contact) {
  const fullName = \`\${contact.FIRSTNAME || ''} \${contact.LASTNAME || ''}\`.trim() || 'Doutor(a)';

  const payload = {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: contact.EMAIL, name: fullName }],
    replyTo: { email: FROM_EMAIL, name: FROM_NAME },
    subject: SUBJECT,
    htmlContent: buildHTML(fullName),
    attachment: [
      {
        content: "${imageBase64}",
        name: "Planta-y-Raiz-Telemedicina.jpg"
      }
    ],
    tags: ['invite-prescritores-nova-rodada', 'campanha-2'],
    headers: { 'X-Campaign': 'invite-prescritores-2' },
    trackOpens: 1,
    trackClicks: 1,
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
`;

content = content.replace(/async function sendEmail\(contact\).*?^}/ms, sendEmailFunc);

fs.writeFileSync(newPath, content);
console.log('Created ' + newPath);
