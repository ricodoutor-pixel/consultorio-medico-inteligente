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
    <div style="font-family: Arial, Helvetica, sans-serif; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- HEADER PADRÃO PAPEL TIMBRADO -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">PLANTA Y RAÍZ LTDA</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; text-transform: uppercase; font-weight: bold;">MEGA CLÍNICA DIGITAL</p>
      </div>
      
      <!-- CONTEÚDO -->
      <div style="padding: 30px;">
        <p>Prezado(a) <strong>\${contato.name}</strong>,</p>
        
        <p>A medicina canabinoide no Brasil vive uma expansão sem precedentes com empresas faturando na casa dos 30 milhões por ano. No entanto, sabemos que a grande maioria das plataformas tradicionais de telemedicina sufoca a autonomia médica com taxas comissionais abusivas, repasses demorados e ferramentas tecnológicas ultrapassadas.</p>
        
        <p>É com grande honra que convidamos você para se tornar Médico Sócio Prescritor na <strong>Planta y Raíz</strong> — oficialmente desenvolvida por médicos para ser a melhor, mais rentável e mais completa plataforma de telemedicina canabinoide do planeta.</p>
        
        <h3 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 5px; margin-top: 30px;">🏆 Planta y Raíz vs. Mercado Tradicional</h3>
        <p>Compilamos os nossos diferenciais para demonstrar por que a nossa plataforma é incomparável:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 12px; border: 1px solid #cbd5e1; text-align: left;">Diferencial</th>
              <th style="padding: 12px; border: 1px solid #cbd5e1; text-align: left; color: #64748b;">Plataformas Tradicionais</th>
              <th style="padding: 12px; border: 1px solid #cbd5e1; text-align: left; color: #059669;">Planta y Raíz</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Taxa da Plataforma</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; color: #64748b;">De 20% a 45% por consulta</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">Apenas 7% (você retém 93%)</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Repasse Financeiro</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; color: #64748b;">30 a 60 dias para receber</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">PIX Instantâneo ao término</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Preço da Consulta</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; color: #64748b;">Tabela fixa imposta</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">Total Liberdade de valor</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Modelo de Parceria</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; color: #64748b;">Apenas prestador de serviço</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">Sócio Prescritor (dist. lucros)</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Plano de Indicação</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; color: #64748b;">Inexistente</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">Rede 3ª Geração recorrente</td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 5px; margin-top: 30px;">🚀 O que torna a Planta y Raíz Irresistível?</h3>
        <ul>
          <li style="margin-bottom: 10px;"><strong>💰 Potencial Financeiro de Elite (Ganhe até R$ 45.000/mês):</strong> Atenda a 10 pacientes no valor de 150 R$ cada todos os dias com Retenção de 93%. O fruto do seu trabalho fica com você. Pagamento via PIX em Tempo Real.</li>
          <li style="margin-bottom: 10px;"><strong>📈 Distribuição de Lucros:</strong> Como médico Sócio Prescritor, você participa do resultado global da plataforma conforme seu desempenho clínico.</li>
          <li style="margin-bottom: 10px;"><strong>🤝 Plano de Indicação em 3 Gerações:</strong> Monte sua rede de médicos parceiros e receba bonificações recorrentes sobre os atendimentos realizados pelas suas indicações.</li>
          <li style="margin-bottom: 10px;"><strong>🧠 Tecnologia & IA:</strong> Robô Auxiliar de triagem, Calculadora de dosagem CBD/THC, checagem de interações hepáticas (CYP450) e Workspace Split-Pane (Vídeo + Prontuário na mesma tela).</li>
          <li style="margin-bottom: 10px;"><strong>🛡️ Compliance & Jurídico:</strong> 100% de conformidade CFM, ANVISA e LGPD, com assistência jurídica especializada para exercer a medicina com absoluta tranquilidade.</li>
        </ul>
        
        <p style="font-style: italic; background-color: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin: 25px 0;">
          "Não seja apenas mais um médico cadastrado em plataformas que valorizam apenas a própria margem. Seja sócio da plataforma que valoriza o seu conhecimento e a sua liberdade."
        </p>

        <h3 style="color: #059669;">🌿 Faça Parte Desta Revolução!</h3>
        <p>O cadastro é totalmente gratuito nesta campanha de recrutamento para os <strong>primeiros 100 médicos</strong> e leva menos de 2 minutos. Garanta sua posição como Sócio Prescritor e comece a faturar 200% a mais.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="https://plantayraiz.com.br/cadastro-profissional" style="background-color: #10b981; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">Realizar Meu Cadastro Gratuito</a>
        </div>
        
        <p style="text-align: center; font-size: 14px; color: #64748b;">
          Dúvidas? Fale conosco via WhatsApp: <strong>(11) 99136-3154</strong><br>
          <a href="https://wa.me/5511991363154" style="color: #059669; text-decoration: none;">Clique aqui para enviar mensagem</a>
        </p>
      </div>

      <!-- FOOTER -->
      <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #475569;">
        <p style="margin: 0;">Seja muito bem-vindo(a) ao futuro da telemedicina canabinoide.</p>
        <p style="margin: 15px 0 0 0;">Atenciosamente,<br><strong>Enf. Brisa</strong><br>Depto. de Marketing Médico<br><strong>Planta y Raíz — A Plataforma nº 1 de Telemedicina Canabinoide</strong></p>
      </div>
    </div>
  `;

  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: contato.email, name: contato.name }],
    subject: "Convite Exclusivo: Seja Médico Sócio Prescritor de Cannabis Medicinal na Planta y Raíz Ltda | A Revolução da Medicina Canabinoide",
    htmlContent: corpoHTML,
    tags: ["invite-doctors"] // Essa TAG permite filtrar relatórios na Brevo e ver taxa de abertura!
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
  // Garante que o objeto "sent" exista no estado
  if (!estado.sent) estado.sent = {};
  if (!estado.total_sent) estado.total_sent = 0;

  let enviadosSessao = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    if (!lead.email || lead.email.toLowerCase() === "n/a" || !lead.email.includes("@")) {
      console.log(`⚠️ Pulando ${lead.name} (E-mail inválido ou ausente)`);
      continue;
    }

    // Verifica se já foi enviado (com sucesso) no estado antigo
    if (estado.sent[lead.email] && estado.sent[lead.email].success) {
      console.log(`⏩ Pulando ${lead.name} (${lead.email}) - Já enviado.`);
      continue;
    }

    console.log(`⏳ Enviando convite para ${lead.name} (${lead.email})...`);

    try {
      await enviarEmail(lead);
      console.log(`✅ E-mail enviado com sucesso para ${lead.email}!`);
      
      // Registrar no estado usando a estrutura de objeto
      estado.sent[lead.email] = {
        name: lead.name,
        success: true,
        sent_at: new Date().toISOString()
      };
      estado.total_sent++;
      await salvarEstado(estado);
      enviadosSessao++;

      console.log(`⏸️ Aguardando ${DELAY_MS / 1000} segundos até o próximo envio...`);
      await sleep(DELAY_MS);
      
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${lead.email}: `, err.message);
      // Opcional: registrar falha
      estado.sent[lead.email] = {
        name: lead.name,
        success: false,
        error: err.message,
        last_attempt_at: new Date().toISOString()
      };
      await salvarEstado(estado);
      console.log("⏸️ Aguardando antes de tentar o próximo por precaução...");
      await sleep(DELAY_MS);
    }
  }

  console.log(`🎉 Disparo concluído! ${enviadosSessao} e-mails enviados nesta sessão.`);
}

run();
