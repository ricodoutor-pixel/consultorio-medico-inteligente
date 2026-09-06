require('dotenv').config();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const MASTER_LIST_PATH = path.join(__dirname, 'prescritores_master_list.json');
const PROGRESS_FILE = path.join(__dirname, 'emails_concluidos.json');

// 10 segundos entre cada e-mail para não bloquear na Hostinger (360 emails/hora)
const INTERVAL_MS = 10 * 1000; 

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return [];
}

function saveProgress(sentList) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(sentList, null, 2));
}

// Configuração do Email (Hostinger)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const TEMPLATE = (nome) => `Prezado(a) Dr(a). ${nome},

Seja muito bem-vindo(a) à Planta y Raíz! É uma imensa satisfação ter você conosco como nosso médico(a) sócio(a) prescritor(a). A plataforma foi projetada para eliminar sobrecargas administrativas, garantir segurança jurídica e valorizar o seu tempo clínico.

O Fluxo de Atendimento na Plataforma

Recepção Acolhedora: O paciente inicia o contato diretamente pelo WhatsApp com a Enfermeira Brisa, sendo recebido de forma humanizada e ágil.

Triagem Automatizada: Coletamos o histórico de saúde preliminar para que você receba o caso clínico já organizado antes da teleconsulta.

Pagamento Seguro: O processamento financeiro é transparente e pré-pago.

Atendimento Clínico Completo: A teleconsulta ocorre em ambiente criptografado, integrado ao prontuário eletrônico e às ferramentas de emissão de receituários digitais.

Total Autonomia e Benefícios para Você

Liberdade de Honorários: Você define o valor da sua consulta de forma 100% autônoma.

Flexibilidade de Tempo: Você determina o tempo necessário para uma escuta qualificada.

Seu Link Exclusivo: Você conta com um link direto e personalizado de agendamento para divulgar em suas redes sociais.

Programa de Indicação: Nosso ecossistema bonifica a sua participação ativa na expansão da rede.

Próximos Passos

Para explorar a plataforma e iniciar seus atendimentos, acesse o botão "Passo a Passo / Manual do Médico" diretamente no menu do seu Consultório Virtual na plataforma Planta y Raiz (https://plantayraiz.com.br).

Estamos prontos para caminhar juntos!

Atenciosamente,

Enfª Brisa | Marketing Médico & Suporte Clínico
📱 WhatsApp: (11) 99136-3154 (À disposição 24/7)
🌿 Planta y Raíz — Inovação, Autonomia e Cuidado Integral`;

async function delay(time) {
  return new Promise(function(resolve) { setTimeout(resolve, time) });
}

async function runBot() {
  if (!fs.existsSync(MASTER_LIST_PATH)) {
    console.error('Lista mestre não encontrada!');
    return;
  }

  const contacts = JSON.parse(fs.readFileSync(MASTER_LIST_PATH, 'utf8'));
  const sentList = loadProgress();
  
  let validEmailsCount = contacts.filter(c => c.email && c.email.includes('@')).length;

  console.log(`\n==================================================`);
  console.log(`🤖 INICIANDO ROBÔ DE DISPARO DE E-MAILS (Hostinger SMTP)`);
  console.log(`Total de contatos na lista: ${contacts.length}`);
  console.log(`Contatos com e-mail válido: ${validEmailsCount}`);
  console.log(`E-mails já enviados (histórico): ${sentList.length}`);
  console.log(`Faltam enviar: ${validEmailsCount - sentList.length}`);
  console.log(`==================================================\n`);

  let countSentSession = 0;

  for (let i = 0; i < contacts.length; i++) {
    const doc = contacts[i];
    
    // Validar e-mail
    const email = doc.email ? String(doc.email).trim() : '';
    if (!email || !email.includes('@')) {
      continue; // Pula se não tem e-mail
    }
    
    // Pular se já enviamos
    if (sentList.includes(email)) {
      continue;
    }

    let name = (doc.nome || '').trim();
    if (name.toUpperCase().startsWith('DR')) {
      name = name.replace(/^Dr\.\s*|^Dra\.\s*|^Dr\s*|^Dra\s*/i, '');
    }

    const msg = TEMPLATE(name);
    console.log(`➡️ [${new Date().toLocaleTimeString()}] Enviando e-mail para: Dr(a). ${name} (${email})`);

    try {
      await transporter.sendMail({
        from: `"Planta y Raiz" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Bem-vindo à Planta y Raíz - Instruções para Iniciar",
        text: msg
      });
      console.log(`✅ Sucesso!`);
      
      // Registrar como concluído
      sentList.push(email);
      saveProgress(sentList);
      countSentSession++;
      
      // Esperar 10s para o próximo (evitar limite de spam da Hostinger)
      await delay(INTERVAL_MS);
      
    } catch (err) {
      console.error(`❌ Erro para ${email}:`, err.message);
      // Aguarda 1 minuto se der erro (ex: limite atingido temporário)
      await delay(60000); 
    }
  }

  console.log(`\n🎉 Fim da lista!`);
  console.log(`Total de e-mails disparados nesta sessão: ${countSentSession}`);
  console.log(`Total geral registrado no histórico: ${sentList.length}`);
}

runBot().catch(console.error);
