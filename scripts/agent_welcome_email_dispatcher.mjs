/**
 * scripts/agent_welcome_email_dispatcher.mjs
 * 
 * Agente Antigravity — Comunicação Automatizada e Boas-Vindas com Médicos Recém-Integrados
 * Planta y Raíz Ltda
 * 
 * Disparo oficial de e-mails de onboarding transacional a partir de:
 * contato@plantayraiz.com.br
 * 
 * Características:
 * 1. Canal: Hostinger SMTP primário com failover automático e transparente para Brevo Transactional Relay.
 * 2. Rate limiting seguro: 12 segundos entre cada envio para proteger o score do domínio e evitar spam.
 * 3. Rastreamento e log detalhado em JSON e console com Message-ID e status.
 * 4. Template HTML responsivo corporativo de alto nível + Plain Text.
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

const LOG_FILE = 'scripts/email_welcome_medicos_log.json';

// Médicos cadastrados na vitrine pública com pendência de validação/conclusão de perfil
const TARGET_DOCTORS = [
  {
    name: 'Dra. Grace Adriana Lopes Conceição',
    email: 'dragracelopes66@gmail.com',
    crm: '190386/SP • 10372/BA',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dra. Geovana Torres Mozaner',
    email: 'drageovanamozaner@gmail.com',
    crm: '98083/MG • 247790/SP',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dr. Sadi Roberto Menta',
    email: 'sadi.blumenau@gmail.com',
    crm: '16301/SC',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dr. Victor Henrique Bueno da Fonseca',
    email: 'contato@doutorvictorfonseca.com',
    crm: '206873/SP',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dr. Leuma Leao Netta',
    email: 'leumaservicosmedicos@gmail.com',
    crm: '85182/MG',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dr. Gustavo Nobre Damiani Pereira',
    email: 'drgustavodamiani@gmail.com',
    crm: '35632/PR',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dr. Albert Machado Tenório',
    email: 'albertmedicina18@gmail.com',
    crm: '16118/PB • 34660/PE',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dr. Diego Cartaxo Jácome',
    email: 'diegocartaxo2010@gmail.com',
    crm: '14828/PB',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dra. Barbara Eliane Matos',
    email: 'babymatos@hotmail.com',
    crm: '12361/SC',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dr. Luiz Roberto Medina dos Santos',
    email: 'lrmsbob2@terra.com.br',
    crm: '11496/SC',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dra. Ana Paula Ferreira Lima',
    email: 'dranapaulaflima@gmail.com',
    crm: '36942/PR',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dr. João Pedro Girardello Detoni',
    email: 'jpdetoni@yahoo.com.br',
    crm: '42912/RS',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dr. Daniel Kobayashi Colombo',
    email: 'dcollombo@hotmail.com',
    crm: '10346/MT • 5460/RO',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  },
  {
    name: 'Dr. José Geraldo Barbugli Abbade Filho',
    email: 'jgabbade@yahoo.com.br',
    crm: '32584/MG',
    activationLink: 'https://plantayraiz.com.br/atualizar-documentos-medico'
  }
];

function buildHtmlTemplate(doctorName, activationLink) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo(a) à Planta y Raíz</title>
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
                Telemedicina & Modulação Endocanabinoide
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 40px 25px 40px;">
              <h1 style="color: #ffffff; font-size: 21px; margin-top: 0; margin-bottom: 20px; font-weight: 700; line-height: 1.4;">
                Prezado(a) ${doctorName},
              </h1>

              <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 18px;">
                É uma honra dar-lhe as boas-vindas ao ecossistema <strong>Planta y Raíz</strong>. A partir de agora, você integra um corpo clínico pioneiro na prática médica moderna e na modulação terapêutica do <strong>Sistema Endocanabinoide humano</strong>.
              </p>

              <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 25px;">
                Nossa missão é fornecer a você a infraestrutura tecnológica mais avançada do mercado para que sua prática clínica atinja o mais alto nível de precisão, comodidade e alcance terapêutico.
              </p>

              <!-- Feature Box -->
              <div style="background-color: #111a3d; border: 1px solid #23356e; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
                <h2 style="font-size: 16px; color: #10b981; margin-top: 0; margin-bottom: 16px; font-weight: 700;">
                  ⚡ O que o seu Consultório Virtual Inteligente oferece:
                </h2>

                <ul style="padding-left: 20px; margin: 0; font-size: 14px; color: #cbd5e1;">
                  <li style="margin-bottom: 12px;">
                    <strong style="color: #ffffff;">Prontuário Eletrônico & Telemedicina Integrada:</strong> Videochamadas de alta definição criptografadas de ponta a ponta, histórico clínico completo, upload seguro de exames complementares e prontuário em conformidade estrita com o CFM e a LGPD.
                  </li>
                  <li style="margin-bottom: 12px;">
                    <strong style="color: #ffffff;">Prescrição com Assinatura Digital ICP-Brasil:</strong> Emissão de receituários eletrônicos válidos e aceitos em todo o território nacional.
                  </li>
                  <li style="margin-bottom: 12px;">
                    <strong style="color: #ffffff;">Ecossistema Conectado:</strong> Integração direta com farmácias autorizadas e serviços de logística, simplificando o início e a adesão ao tratamento pelos seus pacientes.
                  </li>
                  <li style="margin-bottom: 12px;">
                    <strong style="color: #ffffff;">Algoritmo de Georreferenciamento Inteligente:</strong> Pacientes são direcionados priorizando proximidade regional, respeitando particularidades locais e viabilizando o encaminhamento para consultas presenciais em seu consultório físico, caso necessário.
                  </li>
                  <li style="margin-bottom: 12px;">
                    <strong style="color: #ffffff;">Suporte Multidisciplinar Contínuo:</strong> Assistência 24/7 com inteligência artificial copiloto, suporte operacional da Enf. Brisa e nosso canal de atendimento ao profissional.
                  </li>
                  <li style="margin-bottom: 0;">
                    <strong style="color: #ffffff;">Modelo Sustentável de Participação:</strong> Reconhecimento ao seu engajamento profissional através do modelo estruturado de bonificação e participação sobre os serviços da plataforma.
                  </li>
                </ul>
              </div>

              <!-- Vitrine & CTA Callout -->
              <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 18px 20px; border-radius: 0 10px 10px 0; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 14px; color: #e2e8f0; line-height: 1.5;">
                  Seu <strong>card profissional</strong> já está visível em nossa vitrine oficial de especialistas. Para liberar sua agenda e começar a receber agendamentos de pacientes reais, resta apenas uma etapa:
                </p>
              </div>

              <!-- Main Action Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${activationLink}" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 36px; border-radius: 50px; display: inline-block; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                  👉 CONCLUIR MEU CADASTRO CLÍNICO
                </a>
              </div>

              <!-- Expansion Tip -->
              <div style="background-color: #0b1126; border: 1px dashed #24356e; border-radius: 10px; padding: 18px 20px; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
                  💡 <strong style="color: #38bdf8;">Dica de expansão:</strong> O seu link exclusivo de indicação profissional já está ativo dentro do painel. Compartilhe com os seus pacientes para que eles possam agendar consultas online com você a partir de qualquer localidade, com total conveniência e acompanhamento médico contínuo.
                </p>
              </div>

              <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 25px;">
                Agradecemos por construir conosco o futuro da saúde integrativa e da medicina de precisão.
              </p>

              <p style="font-size: 14px; color: #94a3b8; margin-top: 30px; margin-bottom: 0;">
                Atenciosamente,<br>
                <strong style="color: #ffffff;">Equipe Planta y Raíz</strong><br>
                Telemedicina & Gestão Clínica Inteligente
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #080d21; border-top: 1px solid #172142; text-align: center; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 6px 0;">
                Planta y Raíz Ltda • CNPJ sob supervisão técnica médica
              </p>
              <p style="margin: 0 0 10px 0;">
                <a href="mailto:contato@plantayraiz.com.br" style="color: #10b981; text-decoration: none;">contato@plantayraiz.com.br</a> | 
                <a href="https://plantayraiz.com.br" style="color: #10b981; text-decoration: none;">plantayraiz.com.br</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                Você recebeu este e-mail por estar cadastrado como profissional médico na plataforma Planta y Raíz.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPlainTextTemplate(doctorName, activationLink) {
  return `Prezado(a) ${doctorName},

É uma honra dar-lhe as boas-vindas ao ecossistema Planta y Raíz. A partir de agora, você integra um corpo clínico pioneiro na prática médica moderna e na modulação terapêutica do Sistema Endocanabinoide humano.

Nossa missão é fornecer a você a infraestrutura tecnológica mais avançada do mercado para que sua prática clínica atinja o mais alto nível de precisão, comodidade e alcance terapêutico.

O que o seu Consultório Virtual Inteligente oferece:
• Prontuário Eletrônico & Telemedicina Integrada: Videochamadas de alta definição criptografadas de ponta a ponta, histórico clínico completo, upload seguro de exames complementares e prontuário em conformidade estrita com o CFM e a LGPD.
• Prescrição com Assinatura Digital ICP-Brasil: Emissão de receituários eletrônicos válidos e aceitos em todo o território nacional.
• Ecossistema Conectado: Integração direta com farmácias autorizadas e serviços de logística, simplificando o início e a adesão ao tratamento pelos seus pacientes.
• Algoritmo de Georreferenciamento Inteligente: Pacientes são direcionados priorizando proximidade regional, respeitando particularidades locais e viabilizando o encaminhamento para consultas presenciais em seu consultório físico, caso necessário.
• Suporte Multidisciplinar Contínuo: Assistência 24/7 com inteligência artificial copiloto, suporte operacional da Enf. Brisa e nosso canal de atendimento ao profissional.
• Modelo Sustentável de Participação: Reconhecimento ao seu engajamento profissional através do modelo estruturado de bonificação e participação sobre os serviços da plataforma.

Seu card profissional já está visível em nossa vitrine oficial de especialistas. Para liberar sua agenda e começar a receber agendamentos de pacientes reais, resta apenas uma etapa:

👉 [CONCLUIR MEU CADASTRO CLÍNICO](${activationLink})

Dica de expansão: O seu link exclusivo de indicação profissional já está ativo dentro do painel. Compartilhe com os seus pacientes para que eles possam agendar consultas online com você a partir de qualquer localidade, com total conveniência e acompanhamento médico contínuo.

Agradecemos por construir conosco o futuro da saúde integrativa e da medicina de precisão.

Atenciosamente,

Equipe Planta y Raíz
Telemedicina & Gestão Clínica Inteligente
contato@plantayraiz.com.br | plantayraiz.com.br`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendViaBrevo(toEmail, toName, subject, htmlContent, textContent) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Planta y Raíz', email: 'contato@plantayraiz.com.br' },
      replyTo: { email: 'contato@plantayraiz.com.br', name: 'Planta y Raíz' },
      to: [{ email: toEmail, name: toName }],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'PlantaYRaiz-DoctorOnboarding-v1.0'
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

async function runWelcomeDispatcher() {
  console.log('================================================================');
  console.log('🚀 AGENTE DE ONBOARDING & BOAS-VINDAS DE MÉDICOS (PLANTA Y RAÍZ)');
  console.log('================================================================');
  console.log(`Remetente Oficial: ${SMTP_USER}`);
  console.log(`Total de Médicos Elegíveis na Vitrine: ${TARGET_DOCTORS.length}\n`);

  // Carregar histórico de log
  let history = { sent: {}, failed: [] };
  if (fs.existsSync(LOG_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch (_) {}
  }
  if (!history.sent) history.sent = {};
  if (!history.failed) history.failed = [];

  const subject = 'Bem-vindo(a) à Planta y Raíz | Seu Consultório Virtual Inteligente está Pronto';

  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < TARGET_DOCTORS.length; i++) {
    const doc = TARGET_DOCTORS[i];
    const emailKey = doc.email.toLowerCase().trim();

    // Idempotência
    if (history.sent[emailKey] && history.sent[emailKey].status === 'success') {
      console.log(`[${i + 1}/${TARGET_DOCTORS.length}] ⏭️ Pulando ${doc.name} (${doc.email}): Já enviado em ${history.sent[emailKey].sentAt}`);
      skippedCount++;
      continue;
    }

    console.log(`[${i + 1}/${TARGET_DOCTORS.length}] 📤 Preparando envio para: ${doc.name} <${doc.email}>...`);

    const html = buildHtmlTemplate(doc.name, doc.activationLink);
    const text = buildPlainTextTemplate(doc.name, doc.activationLink);

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
        from: `"Planta y Raíz" <${SMTP_USER}>`,
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
        messageId,
        provider,
        sentAt: new Date().toISOString(),
        status: 'success'
      };
      sentCount++;

      // Salvar log após cada envio com sucesso
      fs.writeFileSync(LOG_FILE, JSON.stringify(history, null, 2), 'utf8');
    }

    // Rate limiting: 12 segundos seguros entre envios
    if (i < TARGET_DOCTORS.length - 1) {
      console.log('   ⏳ Aguardando 12s de rate limiting de segurança...\n');
      await sleep(12000);
    }
  }

  console.log('\n================================================================');
  console.log('📊 RELATÓRIO FINAL DO DISPARO DE BOAS-VINDAS:');
  console.log(`✅ Enviados com sucesso: ${sentCount}`);
  console.log(`⏭️ Ignorados (já enviados): ${skippedCount}`);
  console.log(`❌ Falhas: ${errorCount}`);
  console.log(`📁 Log detalhado salvo em: ${LOG_FILE}`);
  console.log('================================================================');
}

runWelcomeDispatcher().catch(err => {
  console.error('Erro na execução do dispatcher:', err);
  process.exit(1);
});
