require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const MASTER_LIST_PATH = path.join(__dirname, 'prescritores_master_list.json');
const PROGRESS_FILE = path.join(__dirname, 'disparos_concluidos.json');

// O intervalo de 10 minutos (em milissegundos)
const INTERVAL_MS = 10 * 60 * 1000; 

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

Para explorar a plataforma e iniciar seus atendimentos, acesse o botão "Passo a Passo / Manual do Médico" diretamente no menu do seu Consultório Virtual.

Estamos prontos para caminhar juntos!

Atenciosamente,

Enfª Brisa | Marketing Médico & Suporte Clínico
📱 WhatsApp: (11) 99136-3154 (À disposição 24/7)
🌿 Planta y Raíz — Inovação, Autonomia e Cuidado Integral`;

async function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

async function runBot() {
  if (!fs.existsSync(MASTER_LIST_PATH)) {
    console.error('Lista mestre não encontrada!');
    return;
  }

  const contacts = JSON.parse(fs.readFileSync(MASTER_LIST_PATH, 'utf8'));
  const sentList = loadProgress();
  
  console.log(`Iniciando Bot de Envios (E-mail + WhatsApp).`);
  console.log(`Contatos totais: ${contacts.length} | Já processados: ${sentList.length}`);

  // Configura o Puppeteer para salvar a sessão do WhatsApp
  const browser = await puppeteer.launch({ 
    headless: false, // Abre o navegador na sua tela!
    userDataDir: path.join(__dirname, 'whatsapp_session'),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2' });

  console.log('⏳ Aguardando autenticação do WhatsApp Web...');
  console.log('⚠️ SE O NAVEGADOR ABRIR E PEDIR QR CODE, LEIA COM O CELULAR DA BRISA!');
  
  try {
    await page.waitForSelector('#pane-side', { timeout: 0 }); // Espera infinita até ler o QR code
    console.log('✅ WhatsApp Web conectado com sucesso!');
  } catch (e) {
    console.log('Erro ao esperar WhatsApp carregar:', e);
  }

  for (let i = 0; i < contacts.length; i++) {
    const doc = contacts[i];
    
    // Identificador único (telefone ou email) para marcar como concluído
    const uid = doc.email || doc.phone || `doc_${i}`;
    
    // Pular se já enviamos
    if (sentList.includes(uid)) {
      continue;
    }

    let name = (doc.nome || '').trim();
    if (name.toUpperCase().startsWith('DR')) {
      name = name.replace(/^Dr\.\s*|^Dra\.\s*|^Dr\s*|^Dra\s*/i, '');
    }

    const msg = TEMPLATE(name);
    console.log(`\n==================================================`);
    console.log(`➡️ [${new Date().toLocaleTimeString()}] Processando: Dr(a). ${name}`);

    // 1. ENVIAR E-MAIL
    if (doc.email) {
      try {
        await transporter.sendMail({
          from: `"Planta y Raiz" <${process.env.SMTP_USER}>`,
          to: doc.email,
          subject: "Bem-vindo à Planta y Raíz - Instruções para Iniciar",
          text: msg
        });
        console.log(`📧 E-mail enviado com sucesso para ${doc.email}`);
      } catch (err) {
        console.error(`❌ Erro no E-mail para ${doc.email}:`, err.message);
      }
    }

    // 2. ENVIAR WHATSAPP
    let phone = doc.phone || doc.telefone_raw || '';
    if (phone) {
      phone = String(phone).replace(/\D/g, '');
      if (phone.length === 10 || phone.length === 11) phone = '55' + phone;
      
      const link = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
      
      try {
        await page.goto(link, { waitUntil: 'networkidle2' });
        await page.waitForSelector('span[data-icon="send"]', { timeout: 30000 });
        await delay(2000);
        await page.click('span[data-icon="send"]');
        console.log(`📱 WhatsApp enviado com sucesso para ${phone}`);
        await delay(3000);
      } catch (err) {
        console.log(`⚠️ Não foi possível enviar WhatsApp para ${phone} (Número sem WhatsApp?). Erro ignorado.`);
      }
    }

    // Registrar como concluído e salvar
    sentList.push(uid);
    saveProgress(sentList);
    
    console.log(`⏳ Aguardando 10 minutos para o próximo envio...`);
    await delay(INTERVAL_MS);
  }

  console.log('🎉 Fim da lista! Todos os contatos foram processados.');
  await browser.close();
}

runBot().catch(console.error);
