import fs from 'fs/promises';
import path from 'path';

// Configurações
const API_KEY = process.env.BREVO_API_KEY || "";
const SENDER_EMAIL = "contato@plantayraiz.com.br";
const SENDER_NAME = "Planta y Raiz";
const DELAY_MS = 30000; // 30 segundos
const FILE_PATH = path.join(process.cwd(), 'mined_doctor_leads_500.json');
const STATE_FILE = path.join(process.cwd(), 'email_sent_state.json');

// Função para pausar (sleep)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function carregarEstado() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { processados: [] };
  }
}

async function salvarEstado(estado) {
  await fs.writeFile(STATE_FILE, JSON.stringify(estado, null, 2), 'utf-8');
}

async function enviarEmail(contato) {
  const url = "https://api.brevo.com/v3/smtp/email";
  
  const corpoHTML = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Convite Exclusivo: Seja Médico Sócio Prescritor na Planta y Raíz</h2>
      <p>Olá, <strong>${contato.name}</strong>,</p>
      
      <p>Acompanhamos o seu trabalho na área de <strong>${contato.specialty}</strong> e acreditamos que você tem o perfil ideal para fazer parte do seleto grupo de médicos prescritores da Planta y Raíz.</p>
      
      <p>A <strong>Planta y Raíz</strong> é uma plataforma moderna focada em conectar pacientes a profissionais especializados, com infraestrutura completa de prontuário, consultório virtual (com chat e vídeo), sistema financeiro automatizado (sem taxas abusivas) e assinatura digital inclusa.</p>
      
      <h3>Por que se juntar a nós?</h3>
      <ul>
        <li><strong>Taxa Zero</strong> de intermediação para os seus pacientes.</li>
        <li><strong>Pagamentos direto</strong> na sua conta via Mercado Pago.</li>
        <li><strong>Pacientes qualificados</strong> e sistema de triagem com IA.</li>
      </ul>
      
      <p>Estamos selecionando 500 profissionais para receberem benefícios exclusivos (VIP) no lançamento. Gostaríamos de contar com sua expertise.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://www.plantayraiz.com.br/cadastro" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">Acesse a Plataforma e Seja VIP</a>
      </div>
      
      <p>Ficamos à disposição para agendar um bate-papo rápido se desejar conhecer mais.</p>
      
      <p>Atenciosamente,<br/><strong>Equipe Planta y Raíz</strong><br/><a href="https://plantayraiz.com.br">plantayraiz.com.br</a></p>
    </div>
  `;

  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: contato.email, name: contato.name }],
    subject: "Convite Exclusivo: Seja Médico Sócio Prescritor na Planta y Raíz",
    htmlContent: corpoHTML
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": API_KEY
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha ao enviar: ${response.status} - ${errText}`);
  }

  return response.json();
}

async function run() {
  console.log("🚀 Iniciando disparador de e-mails via Brevo (Sendinblue)...");
  
  let leads = [];
  try {
    const fileData = await fs.readFile(FILE_PATH, 'utf-8');
    leads = JSON.parse(fileData);
    console.log(`✅ ${leads.length} leads carregados do arquivo.`);
  } catch (err) {
    console.error("❌ Erro ao ler o arquivo de leads:", err.message);
    process.exit(1);
  }

  const estado = await carregarEstado();
  const processados = new Set(estado.processados);

  let enviadosSessao = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    if (!lead.email || lead.email.toLowerCase() === "n/a" || !lead.email.includes("@")) {
      console.log(`⚠️ Pulando ${lead.name} (E-mail inválido ou ausente)`);
      continue;
    }

    if (processados.has(lead.email)) {
      console.log(`⏩ Pulando ${lead.name} (${lead.email}) - Já enviado.`);
      continue;
    }

    console.log(`⏳ Enviando convite para ${lead.name} (${lead.email})...`);

    try {
      await enviarEmail(lead);
      console.log(`✅ E-mail enviado com sucesso para ${lead.email}!`);
      
      // Registrar no estado
      estado.processados.push(lead.email);
      await salvarEstado(estado);
      enviadosSessao++;

      console.log(`⏸️ Aguardando ${DELAY_MS / 1000} segundos até o próximo envio...`);
      await sleep(DELAY_MS);
      
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${lead.email}: `, err.message);
      console.log("⏸️ Aguardando antes de tentar o próximo por precaução...");
      await sleep(DELAY_MS);
    }
  }

  console.log(`🎉 Disparo concluído! ${enviadosSessao} e-mails enviados nesta sessão.`);
}

run();
