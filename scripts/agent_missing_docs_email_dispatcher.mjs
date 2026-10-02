/**
 * scripts/agent_missing_docs_email_dispatcher.mjs
 * 
 * Agente Antigravity — Notificação de Documentos Faltantes (KYC Médicos)
 * Planta y Raíz Ltda
 * 
 * Disparo oficial de e-mails transacionais a partir de:
 * contato@plantayraiz.com.br
 * 
 * Regras:
 * 1. Canal: Hostinger SMTP primário com failover automático para Brevo Transactional Relay.
 * 2. Rate limiting seguro: 12 segundos entre cada envio para proteger o score de reputação do domínio.
 * 3. E-mail personalizado contendo a lista individualizada de documentos pendentes de cada médico.
 * 4. Rastreamento e log detalhado em JSON e console.
 * 5. Dra. Leuma Leão Netta EXCLUÍDA (card desativado a pedido da mesma).
 * 6. Médicos com 100% do dossiê anexado (Dra. Barbara, Dr. Daniel Colombo, Dr. José Geraldo, Dr. Albert) EXCLUÍDOS.
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const SMTP_PASS = process.env.SMTP_PASS;
const BREVO_KEY = process.env.BREVO_API_KEY;

const LOG_FILE = 'scripts/email_missing_docs_log.json';

export const PENDING_DOCS_DOCTORS = [
  {
    name: "Prof. Dr. Luiz Roberto Medina dos Santos",
    crm: "11496/SC",
    email: "lrmsbob2@terra.com.br",
    missingDocs: [
      "Foto de perfil oficial em alta resolução com jaleco em fundo neutro/branco",
      "Cópia do Diploma de Especialista / Título de Livre-Docência",
      "Certidão de Quitação e Regularidade recente do CRM-SC"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. Diego Cartaxo Jácome",
    crm: "14828/PB",
    email: "diegocartaxo2010@gmail.com",
    missingDocs: [
      "Cédula de Identidade Médica (CRM-PB frente e verso)",
      "Documento de Identificação oficial com foto (RG ou CNH)"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. Eduardo Miguéis Corrêa",
    crm: "CRMV 19333/SP",
    email: "edu.correa.vet@gmail.com",
    missingDocs: [
      "Cédula de Identidade Profissional do CRMV-SP (frente e verso)",
      "Comprovante de Endereço do Consultório ou Clínica Veterinária"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. José Roberto Silva Coutinho",
    crm: "520668646/RJ",
    email: "josercoutinho@gmail.com",
    missingDocs: [
      "Cópia legível da Cédula do CRM-RJ (frente e verso)",
      "Documento de Identidade oficial com foto (RG ou CNH)"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dra. Ana Paula Ferreira Lima",
    crm: "36942/PR",
    email: "dranapaulaflima@gmail.com",
    missingDocs: [
      "Homologação e validação da Assinatura Digital ICP-Brasil / Gov.br",
      "Confirmação da Chave PIX cadastrada para recebimento de honorários clínicos"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. Gustavo Simões Llivi Ibañez",
    crm: "7684/RO",
    email: "gustavo.ibanez@hotmail.com",
    missingDocs: [
      "Cópia da Cédula do CRM-RO (frente e verso)",
      "Comprovante de Endereço residencial ou profissional recente"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. Guilherme Campos Silva",
    crm: "49694/PR",
    email: "guilhermeccampos2@gmail.com",
    missingDocs: [
      "Cópia da Cédula do CRM-PR (frente e verso)",
      "Documento oficial de Identificação com foto (RG ou CNH)"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. João Pedro Girardello Detoni",
    crm: "42912/RS",
    email: "jpdetoni@yahoo.com.br",
    missingDocs: [
      "Cópia legível da Cédula do CRM-RS (frente e verso)",
      "Comprovante de Endereço atualizado"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dra. Angela Beatriz Mercado Acevedo",
    crm: "52580846/RJ",
    email: "dra.angela.acevedo@gmail.com",
    missingDocs: [
      "Cópia da Cédula do CRM-RJ (frente e verso)",
      "Documento de Identidade oficial com foto (RG ou CNH)"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dra. Ingrid Chiullo Miranda",
    crm: "216629/SP",
    email: "icmpmed2@gmail.com",
    missingDocs: [
      "Cópia da Cédula do CRM-SP (frente e verso)",
      "Comprovante de Endereço profissional ou residencial"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. Adeonis Oliveira Lima",
    crm: "9060/SE",
    email: "dradeonis@gmail.com",
    missingDocs: [
      "Cópia da Cédula do CRM-SE (frente e verso)",
      "Documento de Identificação com foto (RG ou CNH)"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. Alexandre Stramandinoli Corrêa da Silva",
    crm: "17266/PB",
    email: "alexgoju2@gmail.com",
    missingDocs: [
      "Cópia da Cédula do CRM-PB (frente e verso)",
      "Documento de Identidade com foto (RG ou CNH)"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. Gustavo Nobre Damiani Pereira",
    crm: "35632/PR",
    email: "drgustavodamiani@gmail.com",
    missingDocs: [
      "Cópia da Cédula do CRM-PR (frente e verso)",
      "Comprovante de Endereço atualizado"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dra. Marianna Coimbra Arzamendia",
    crm: "12110/MS",
    email: "marihcoimbra@gmail.com",
    missingDocs: [
      "Cópia da Cédula do CRM-MS (frente e verso)",
      "Documento de Identidade com foto (RG ou CNH)"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. Victor Henrique Bueno da Fonseca",
    crm: "206873/SP",
    email: "contato@doutorvictorfonseca.com",
    missingDocs: [
      "Assinatura digital do Contrato de Credenciamento CFM na plataforma",
      "Confirmação da Chave PIX cadastrada para recebimento de honorários",
      "Envio de cópia da Cédula de Identidade Médica (CRM-SP) para arquivo definitivo"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. Otávio Paiva Bassete",
    crm: "CRMV 21907/PR",
    email: "acupetcbd@gmail.com",
    missingDocs: [
      "Assinatura digital do Termo de Credenciamento Veterinário no painel",
      "Confirmação da Chave PIX para recebimento direto de consultas"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dr. Sadi Roberto Menta",
    crm: "16301/SC",
    email: "sadi.blumenau@gmail.com",
    missingDocs: [
      "Assinatura digital do Contrato de Credenciamento CFM no painel",
      "Confirmação da Chave PIX cadastrada para recebimento de honorários"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dra. Geovana Torres Mozaner",
    crm: "98083/MG • 247790/SP",
    email: "drageovanamozaner@gmail.com",
    missingDocs: [
      "Assinatura digital do Contrato de Credenciamento CFM no painel",
      "Confirmação da Chave PIX cadastrada para recebimento de honorários"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Dra. Grace Adriana Lopes Conceição",
    crm: "190386/SP • 10372/BA",
    email: "dragracelopes66@gmail.com",
    missingDocs: [
      "Assinatura digital do Contrato de Credenciamento CFM no painel",
      "Confirmação da Chave PIX cadastrada para recebimento de honorários"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  },
  {
    name: "Frederico Menezes",
    crm: "Pendente/GO",
    email: "fmgsaudeemfamilia@gmail.com",
    missingDocs: [
      "Conclusão do preenchimento cadastral (CRM e UF de atuação)",
      "Cédula de Identidade Médica (frente e verso)",
      "CPF e Comprovante de Residência",
      "Assinatura do Contrato de Credenciamento CFM"
    ],
    activationLink: "https://plantayraiz.com.br/atualizar-documentos-medico"
  }
];

function buildHtmlTemplate(doctorName, crm, missingDocs, activationLink) {
  const docsListHtml = missingDocs
    .map(
      (doc) => `
        <li style="margin-bottom: 10px; color: #f87171; font-weight: 600;">
          <span style="color: #cbd5e1; font-weight: normal;">• </span>
          <strong style="color: #fecdd3;">${doc}</strong>
        </li>
      `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentos Pendentes para Homologação | Planta y Raíz</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060919; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #060919; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 640px; background: #0c122b; border: 1px solid #1e294b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Branding -->
          <tr>
            <td style="padding: 35px 40px 25px 40px; background: linear-gradient(135deg, #0e1738 0%, #064e3b 100%); border-bottom: 1px solid rgba(16, 185, 129, 0.2); text-align: center;">
              <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                🌿 <span style="color: #10b981;">Planta y Raíz</span>
              </div>
              <div style="font-size: 13px; color: #a7f3d0; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                Comitê de Homologação Clínica & Credenciamento
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 40px 25px 40px;">
              <h1 style="color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 20px; font-weight: 700; line-height: 1.4;">
                Prezado(a) ${doctorName},
              </h1>

              <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 18px;">
                É uma honra contar com sua presença em nosso ecossistema de saúde integrativa e modulação do Sistema Endocanabinoide humano. O seu card profissional já está registrado em nossa plataforma (Registro: <strong>${crm}</strong>) e preparado para receber agendamentos de pacientes de todo o Brasil.
              </p>

              <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 22px;">
                Para que possamos <strong>finalizar a auditoria de conformidade (KYC)</strong>, habilitar integralmente a sua agenda para teleconsultas por vídeo e homologar sua assinatura digital padrão ICP-Brasil, identificamos a pendência do envio dos seguintes itens em seu dossiê clínico:
              </p>

              <!-- Pending Docs Box -->
              <div style="background-color: #1b1226; border: 1px solid #7f1d1d; border-radius: 12px; padding: 22px 24px; margin-bottom: 28px;">
                <div style="font-size: 15px; color: #fb7185; margin-bottom: 14px; font-weight: 700; display: flex; align-items: center;">
                  ⚠️ Itens Pendentes para Homologação:
                </div>

                <ul style="padding-left: 20px; margin: 0; font-size: 14px; list-style-type: none;">
                  ${docsListHtml}
                </ul>
              </div>

              <!-- Vitrine & Ready Notice -->
              <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 18px 20px; border-radius: 0 10px 10px 0; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 14px; color: #e2e8f0; line-height: 1.5;">
                  🚀 <strong>Pacientes aguardando:</strong> Com o envio desses documentos, o seu card clínico passa imediatamente ao status <strong>🟢 ONLINE (100% Homologado)</strong> no topo da vitrine de especialistas, permitindo que pacientes agendem consultas presenciais ou por telemedicina com total segurança jurídica perante o CFM.
                </p>
              </div>

              <!-- Main Action Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${activationLink}" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 16px 36px; border-radius: 50px; display: inline-block; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                  👉 ANEXAR DOCUMENTOS PENDENTES AGORA
                </a>
              </div>

              <!-- Consultório info -->
              <div style="background-color: #0b1126; border: 1px dashed #24356e; border-radius: 10px; padding: 18px 20px; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
                  🏥 <strong>Acesso ao Consultório Virtual:</strong> O seu painel clínico já está liberado em <a href="https://plantayraiz.com.br/consultorio" target="_blank" style="color: #38bdf8; text-decoration: underline;">plantayraiz.com.br/consultorio</a>. Você pode acessar com seu e-mail para acompanhar agendamentos, prontuários eletrônicos e emitir seu link exclusivo de indicação para seus pacientes particulares.
                </p>
              </div>

              <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 25px;">
                Caso tenha dúvidas sobre o upload ou necessite de assistência direta com a digitalização de algum documento, responda diretamente a este e-mail ou conte com o suporte 24h da Enfermeira Brisa IA na plataforma.
              </p>

              <p style="font-size: 14px; color: #94a3b8; margin-top: 30px; margin-bottom: 0;">
                Atenciosamente,<br>
                <strong style="color: #ffffff;">Equipe de Credenciamento & Conformidade Médica</strong><br>
                Planta y Raíz Ltda<br>
                <span style="font-size: 12px; color: #64748b;">contato@plantayraiz.com.br | plantayraiz.com.br</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #080c1d; border-top: 1px solid #17203d; text-align: center; font-size: 11px; color: #64748b;">
              Você está recebendo este e-mail transacional prioritário porque é um médico cadastrado no corpo clínico da Planta y Raíz Ltda.
              <br>© 2026 Planta y Raíz Ltda — Todos os direitos reservados. CNPJ 58.740.063/0001-08.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPlainTextTemplate(doctorName, crm, missingDocs, activationLink) {
  const docsListText = missingDocs.map((d) => `  - ${d}`).join('\n');

  return `Prezado(a) ${doctorName},

É uma honra contar com sua presença em nosso ecossistema de saúde integrativa e modulação do Sistema Endocanabinoide humano. O seu card profissional já está registrado em nossa plataforma (Registro: ${crm}) e preparado para receber agendamentos de pacientes de todo o Brasil.

Para que possamos finalizar a auditoria de conformidade (KYC), habilitar integralmente a sua agenda para teleconsultas por vídeo e homologar sua assinatura digital padrão ICP-Brasil, identificamos a pendência do envio dos seguintes itens em seu dossiê clínico:

${docsListText}

👉 Para anexar seus documentos pendentes de forma rápida e segura, acesse:
${activationLink}

O seu Consultório Virtual já está liberado em:
https://plantayraiz.com.br/consultorio

Com o envio desses documentos, o seu card clínico passa imediatamente ao status 🟢 ONLINE (100% Homologado) no topo da vitrine de especialistas.

Caso tenha alguma dúvida, basta responder diretamente a este e-mail.

Atenciosamente,
Equipe de Credenciamento & Conformidade Médica
Planta y Raíz Ltda
contato@plantayraiz.com.br | plantayraiz.com.br`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendViaBrevo(toEmail, toName, subject, htmlContent, textContent) {
  if (!BREVO_KEY) throw new Error('BREVO_API_KEY não configurada no .env');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'Planta y Raíz · Credenciamento',
        email: SMTP_USER
      },
      to: [{ email: toEmail, name: toName }],
      replyTo: {
        email: SMTP_USER,
        name: 'Planta y Raíz Suporte Médico'
      },
      subject,
      htmlContent,
      textContent,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'PlantaYRaiz-KYC-Compliance-v1.0'
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo API Error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.messageId;
}

async function runMissingDocsDispatcher() {
  console.log('================================================================');
  console.log('📑 AGENTE DE COBRANÇA INDIVIDUALIZADA DE DOCUMENTOS KYC FALTANTES');
  console.log('================================================================');
  console.log(`Remetente Oficial: ${SMTP_USER}`);
  console.log(`Total de Médicos com Documentos Pendentes: ${PENDING_DOCS_DOCTORS.length}\n`);

  // Carregar histórico de log
  let history = { sent: {}, failed: [] };
  if (fs.existsSync(LOG_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch (_) {}
  }
  if (!history.sent) history.sent = {};
  if (!history.failed) history.failed = [];

  const subject = 'Planta y Raíz | Documentos Pendentes para Homologação do seu Consultório Virtual';

  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < PENDING_DOCS_DOCTORS.length; i++) {
    const doc = PENDING_DOCS_DOCTORS[i];
    const emailKey = doc.email.toLowerCase().trim();

    // Idempotência opcional (permite reenvio se explicitamente solicitado ou pula se já enviado na mesma execução)
    if (history.sent[emailKey] && history.sent[emailKey].status === 'success' && history.sent[emailKey].sentToday) {
      console.log(`[${i + 1}/${PENDING_DOCS_DOCTORS.length}] ⏭️ Pulando ${doc.name} (${doc.email}): Já enviado recentemente.`);
      skippedCount++;
      continue;
    }

    console.log(`[${i + 1}/${PENDING_DOCS_DOCTORS.length}] 📤 Preparando notificação para: ${doc.name} <${doc.email}>...`);
    console.log(`   Itens faltantes (${doc.missingDocs.length}): [${doc.missingDocs.join(', ')}]`);

    const html = buildHtmlTemplate(doc.name, doc.crm, doc.missingDocs, doc.activationLink);
    const text = buildPlainTextTemplate(doc.name, doc.crm, doc.missingDocs, doc.activationLink);

    let messageId = null;
    let provider = null;

    // Tentativa 1: Hostinger SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });

      const info = await transporter.sendMail({
        from: `"Planta y Raíz · Credenciamento" <${SMTP_USER}>`,
        replyTo: SMTP_USER,
        to: doc.email,
        subject,
        text,
        html
      });
      messageId = info.messageId;
      provider = 'Hostinger SMTP';
    } catch (hostingerErr) {
      console.log(`   ℹ️ Hostinger SMTP indisponível (${hostingerErr.message}). Acionando Relay Autorizado Brevo para ${SMTP_USER}...`);

      // Tentativa 2: Relay Autorizado Brevo com remetente contato@plantayraiz.com.br
      try {
        messageId = await sendViaBrevo(doc.email, doc.name, subject, html, text);
        provider = 'Brevo Relay (contato@plantayraiz.com.br)';
      } catch (brevoErr) {
        console.error(`   ❌ Falha em ambos os canais para ${doc.email}:`, brevoErr.message);
        history.failed.push({
          name: doc.name,
          email: doc.email,
          crm: doc.crm,
          missingDocs: doc.missingDocs,
          error: brevoErr.message,
          failedAt: new Date().toISOString()
        });
        errorCount++;
        continue;
      }
    }

    if (messageId) {
      console.log(`   ✅ Enviado com sucesso via ${provider}! Message-ID: ${messageId}`);
      history.sent[emailKey] = {
        name: doc.name,
        crm: doc.crm,
        email: doc.email,
        missingDocs: doc.missingDocs,
        messageId,
        provider,
        sentAt: new Date().toISOString(),
        sentToday: true,
        status: 'success'
      };
      sentCount++;

      // Salvar log após cada envio
      fs.writeFileSync(LOG_FILE, JSON.stringify(history, null, 2), 'utf8');
    }

    // Rate limiting: 12 segundos seguros entre envios
    if (i < PENDING_DOCS_DOCTORS.length - 1) {
      console.log('   ⏳ Aguardando 12s de rate limiting de segurança...\n');
      await sleep(12000);
    }
  }

  console.log('\n================================================================');
  console.log('📊 RELATÓRIO FINAL DO DISPARO DE DOCUMENTOS PENDENTES:');
  console.log(`✅ Enviados com sucesso: ${sentCount}`);
  console.log(`⏭️ Ignorados: ${skippedCount}`);
  console.log(`❌ Falhas: ${errorCount}`);
  console.log(`📁 Log detalhado salvo em: ${LOG_FILE}`);
  console.log('================================================================');
}

runMissingDocsDispatcher().catch((err) => {
  console.error('Erro na execução do dispatcher:', err);
  process.exit(1);
});
