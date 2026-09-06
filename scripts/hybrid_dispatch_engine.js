/**
 * scripts/hybrid_dispatch_engine.js
 * 
 * Motor Híbrido de Disparo com Failover Automático & Loop Contínuo 24 Horas
 * Meta Global: 3.000 e-mails entregues para farmácias e drogarias em todo o Brasil.
 * 
 * Arquitetura de Gateways:
 * 1. Gateway Primário (Brevo API v3):
 *    - Teto diário: 300 e-mails por ciclo de 24h.
 *    - Throttle: 60 segundos entre envios.
 * 2. Gateway Secundário (Hostinger SMTP - Failover Automático):
 *    - Servidor: smtp.hostinger.com (Porta 465 SSL).
 *    - Alternância imediata ao atingir cota do Brevo ou receber erro 429/Quota.
 *    - Throttle: 50 segundos entre envios para proteção de score de domínio e reputação de IP.
 *    - Ao virar meia-noite (UTC-3), reavalia o Brevo e consome a cota diária antes de voltar à Hostinger.
 * 
 * Resiliência e Auditoria:
 * - Em falhas ou timeouts: loga em dispatch_log.json, aguarda 90 segundos e retoma o próximo registro.
 * - Persistência em tempo real a cada disparo em dispatch_state.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

const PHARMACIES_FILE = path.join(ROOT_DIR, 'pharmacies_raw.json');
const LOG_FILE        = path.join(ROOT_DIR, 'dispatch_log.json');
const STATE_FILE      = path.join(ROOT_DIR, 'dispatch_state.json');

// Credenciais e Parâmetros
const BREVO_API_KEY   = process.env.BREVO_API_KEY || '';
const BREVO_SMTP_URL  = 'https://api.brevo.com/v3/smtp/email';

const SMTP_HOST       = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT       = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER       = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const SMTP_PASS       = process.env.SMTP_PASS || '95654045Pa#';

const SENDER_EMAIL    = 'contato@plantayraiz.com.br';
const SENDER_NAME     = 'Planta y Raíz Expansão';
const SUBJECT         = 'Credenciamento Exclusivo: Expansão de Dispensação de Cannabis Medicinal | Parceria Planta y Raíz';
const TAGS            = ['prospeccao-farmacia', 'credenciamento-2026', 'rede-nacional'];

const BREVO_DAILY_LIMIT = 300;
const GLOBAL_TARGET_GOAL = 3000;

const BREVO_THROTTLE_MS     = 60000; // 60 segundos
const HOSTINGER_THROTTLE_MS = 50000; // 50 segundos (45s a 60s)
const ERROR_RETRY_PAUSE_MS  = 90000; // 90 segundos em caso de falha de conexão

// Flags de linha de comando
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const customThrottleArg = args.find(a => a.startsWith('--throttle='));
const OVERRIDE_THROTTLE = customThrottleArg ? parseInt(customThrottleArg.split('=')[1]) : null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSaoPauloDate() {
  return new Intl.DateTimeFormat('pt-BR', { 
    timeZone: 'America/Sao_Paulo', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(new Date());
}

/**
 * Cria ou recupera o transporte SMTP Hostinger
 */
let hostingerTransporter = null;
function getHostingerTransporter() {
  if (!hostingerTransporter) {
    hostingerTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      pool: true,
      maxConnections: 1,
      maxMessages: 100,
    });
  }
  return hostingerTransporter;
}

/**
 * Carrega estado persistente do despachante
 */
function loadState() {
  const today = getSaoPauloDate();
  let state = {
    totalSent: 0,
    brevoSentToday: 0,
    hostingerSent: 0,
    lastOffset: 0,
    targetGoal: GLOBAL_TARGET_GOAL,
    currentGateway: 'BREVO',
    currentDate: today,
    lastUpdated: new Date().toISOString()
  };

  if (fs.existsSync(STATE_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      state = { ...state, ...saved };
      
      // Checar virada de meia-noite
      if (state.currentDate !== today) {
        console.log(`🌅 Virada de meia-noite detectada (${today})! Cota diária do Brevo resetada para 300.`);
        state.brevoSentToday = 0;
        state.currentDate = today;
        state.currentGateway = 'BREVO';
      }
    } catch {
      console.warn('⚠️ Erro ao ler dispatch_state.json, inicializando novo.');
    }
  }

  return state;
}

/**
 * Grava estado em tempo real
 */
function saveState(state) {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Registra evento no dispatch_log.json
 */
function appendLog(entry) {
  let logs = [];
  if (fs.existsSync(LOG_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
      if (!Array.isArray(logs)) logs = [];
    } catch {
      logs = [];
    }
  }
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

/**
 * Gera o template executivo oficial em HTML
 */
function buildPharmacyEmailHtml(pharmacy) {
  const pharmacyName = pharmacy.nome_fantasia || pharmacy.razao_social || 'Drogaria / Farmácia Parceira';
  const location = pharmacy.cidade && pharmacy.uf ? `${pharmacy.cidade} - ${pharmacy.uf}` : 'Brasil';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credenciamento Exclusivo: Expansão de Dispensação de Cannabis Medicinal</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#090d16;color:#e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#090d16;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="640" border="0" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background-color:#0f172a;border:1px solid #1e293b;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#047857 50%,#0f766e 100%);padding:40px 32px;text-align:center;border-bottom:3px solid #10b981;">
              <span style="display:inline-block;padding:6px 14px;background-color:rgba(255,255,255,0.15);color:#ecfdf5;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;border-radius:999px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.2);">
                REDE NACIONAL DE DISPENSAÇÃO FARMACÊUTICA • RDC 327/2019
              </span>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:900;line-height:1.3;letter-spacing:-0.5px;">
                Planta y Raíz · Expansão Comercial
              </h1>
              <p style="margin:8px 0 0;color:#a7f3d0;font-size:15px;font-weight:500;">
                Credenciamento de Drogarias & Farmácias Parceiras
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 24px;">
              <p style="font-size:16px;line-height:1.6;color:#f8fafc;margin:0 0 16px;">
                Prezado(a) <strong>Responsável Técnico(a) e Gestor(a) Farmacêutico(a)</strong> da <strong>${pharmacyName}</strong> (${location}),
              </p>
              <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 18px;">
                A <strong>Planta y Raíz</strong> convida sua drogaria/farmácia a integrar nossa rede credenciada nacional de dispensação de produtos à base de Cannabis medicinal, conectando seu estoque à demanda contínua de pacientes atendidos em nosso ecossistema clínico de telemedicina.
              </p>
              <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 24px;">
                Com o avanço das prescrições médicas sob a <strong>RDC 327/2019 da ANVISA</strong>, estruturamos uma infraestrutura tecnológica que direciona o paciente consultado diretamente para a farmácia parceira mais próxima ou com capacidade de entrega rápida, eliminando barreiras logísticas e burocráticas.
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#1e293b;border:1px solid #334155;border-radius:18px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <h3 style="margin:0 0 16px;color:#34d399;font-size:17px;font-weight:800;">
                      ⭐ Vantagens do Credenciamento para sua Farmácia
                    </h3>
                    <ul style="margin:0;padding-left:18px;color:#e2e8f0;font-size:14px;line-height:1.8;">
                      <li style="margin-bottom:10px;"><strong style="color:#ffffff;">Demanda Qualificada e Recorrente:</strong> Recebimento direto de pedidos gerados por nosso corpo clínico ativo em todo o Brasil (produtos como Prati-Donaduzzi, Eurofarma, Ease Labs e fitofármacos autorizados).</li>
                      <li style="margin-bottom:10px;"><strong style="color:#34d399;">Split de Pagamento Automatizado (95% Líquido):</strong> A plataforma opera liquidação direta no checkout. O valor integral do produto (95%) e 100% do frete caem imediatamente na conta da farmácia via Mercado Pago/Pix, eliminando bitributação ou retenção financeira intermediária.</li>
                      <li style="margin-bottom:10px;"><strong style="color:#ffffff;">Validação ICP-Brasil Nativa:</strong> Todas as prescrições médicas chegam ao seu painel com hash de integridade e assinatura digital qualificada padrão ICP-Brasil (emissão de Receitas de Controle Especial C1 em conformidade com o CFM e ANVISA).</li>
                      <li style="margin-bottom:10px;"><strong style="color:#ffffff;">Painel de Dispensação Dedicado:</strong> Acesso a um ambiente exclusivo para gestão de pedidos, upload de comprovantes fiscais, inserção de código de rastreio e controle simplificado de estoque.</li>
                      <li><strong style="color:#ffffff;">Custo Zero de Adesão:</strong> Não cobramos taxa de adesão, mensalidade de software nem fidelidade contratual; a operação remunera-se exclusivamente no sucesso de cada dispensação efetuada.</li>
                    </ul>
                  </td>
                </tr>
              </table>
              <h3 style="margin:0 0 14px;color:#f8fafc;font-size:16px;font-weight:800;">
                🔄 Como Funciona o Fluxo Operacional
              </h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr><td style="padding:12px;background-color:#162033;border-left:4px solid #10b981;border-radius:0 12px 12px 0;"><p style="margin:0;font-size:13.5px;color:#e2e8f0;"><strong style="color:#34d399;">1. Aprovação do Pedido:</strong> O médico prescreve na teleconsulta, o paciente adquire o item em nosso Shopping e escolhe a opção de envio ou retirada.</p></td></tr>
                <tr><td height="8"></td></tr>
                <tr><td style="padding:12px;background-color:#162033;border-left:4px solid #10b981;border-radius:0 12px 12px 0;"><p style="margin:0;font-size:13.5px;color:#e2e8f0;"><strong style="color:#34d399;">2. Notificação no Painel:</strong> Sua equipe recebe a notificação da receita assinada com validação digital e dados para separação do produto.</p></td></tr>
                <tr><td height="8"></td></tr>
                <tr><td style="padding:12px;background-color:#162033;border-left:4px solid #10b981;border-radius:0 12px 12px 0;"><p style="margin:0;font-size:13.5px;color:#e2e8f0;"><strong style="color:#34d399;">3. Dispensação e Logística:</strong> A farmácia emite o cupom fiscal/DANFE, anexa o código de rastreamento do envio e confirma a entrega com um clique.</p></td></tr>
              </table>
              <h3 style="margin:0 0 12px;color:#f8fafc;font-size:16px;font-weight:800;">
                🚀 Próximos Passos para Ativação Cadastral
              </h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius:14px;background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:14px 28px;">
                          <a href="https://plantayraiz.com.br/cadastro-farmacia" target="_blank" style="color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;">
                            📋 Realizar Pré-Cadastro da Farmácia →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td height="12"></td></tr>
                <tr>
                  <td align="center">
                    <a href="https://wa.me/5511987131241?text=Ol%C3%A1%2C%20gostaria%20de%20credenciar%20nossa%20farm%C3%A1cia%20na%20Planta%20y%20Ra%C3%ADz" target="_blank" style="color:#34d399;font-size:13.5px;font-weight:700;text-decoration:none;">
                      💬 WhatsApp Comercial: (11) 98713-1241
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top:1px solid #1e293b;padding-top:20px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:14px;font-weight:700;color:#f8fafc;">Equipe de Relações Institucionais & Expansão</p>
                    <p style="margin:2px 0 0;font-size:13px;color:#10b981;font-weight:600;">Planta y Raíz Tecnologia em Saúde LTDA</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#64748b;">contato@plantayraiz.com.br • (11) 98713-1241</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0b1120;padding:24px 32px;text-align:center;border-top:1px solid #1e293b;">
              <p style="margin:0;font-size:11px;color:#64748b;line-height:1.5;">
                Planta y Raíz LTDA • CNPJ: 58.283.475/0001-00 • São Paulo/SP<br>
                Telemedicina e Dispensação Farmacêutica em conformidade com o CFM nº 2.314/2022 e ANVISA RDC nº 327/2019.
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

/**
 * Envia e-mail via Brevo API v3
 */
async function sendViaBrevo(pharmacy, html) {
  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: pharmacy.email, name: pharmacy.nome_fantasia || pharmacy.razao_social }],
    replyTo: { name: SENDER_NAME, email: SENDER_EMAIL },
    subject: SUBJECT,
    htmlContent: html,
    tags: TAGS
  };

  const res = await fetch(BREVO_SMTP_URL, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  let parsed = {};
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }

  return {
    status: res.status,
    ok: res.ok,
    messageId: parsed.messageId || null,
    error: res.ok ? null : (parsed.message || text),
    isQuotaExceeded: res.status === 429 || (res.status === 400 && text.toLowerCase().includes('quota'))
  };
}

/**
 * Envia e-mail via Hostinger SMTP (Porta 465 SSL)
 */
async function sendViaHostinger(pharmacy, html) {
  const transporter = getHostingerTransporter();
  
  const mailOptions = {
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to: `"${pharmacy.nome_fantasia || pharmacy.razao_social}" <${pharmacy.email}>`,
    replyTo: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    subject: SUBJECT,
    html: html,
    headers: {
      'X-Campaign-Tag': 'prospeccao-farmacia-2026',
      'X-Entity-Ref-ID': pharmacy.cnpj
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      status: 200,
      ok: true,
      messageId: info.messageId || null,
      error: null
    };
  } catch (err) {
    return {
      status: 500,
      ok: false,
      messageId: null,
      error: err.message
    };
  }
}

/**
 * Motor Principal com Loop Contínuo e Failover
 */
export async function startHybridDispatchEngine() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  🌿 PLANTA Y RAÍZ — MOTOR HÍBRIDO DE DISPARO FARMACÊUTICO NACIONAL (3.000)   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  if (!fs.existsSync(PHARMACIES_FILE)) {
    console.error(`❌ ERRO: Base de dados ${PHARMACIES_FILE} não encontrada!`);
    process.exit(1);
  }

  const pharmacies = JSON.parse(fs.readFileSync(PHARMACIES_FILE, 'utf-8'));
  let state = loadState();

  console.log(`📦 Base Total de Farmácias Carregada:  ${pharmacies.length}`);
  console.log(`🎯 Meta de Entregas Global:           ${state.targetGoal} e-mails`);
  console.log(`📊 Progresso Atual:                   ${state.totalSent} / ${state.targetGoal}`);
  console.log(`📍 Offset Atual:                      ${state.lastOffset}`);
  console.log(`🏢 Gateway Ativo:                     ${state.currentGateway}`);
  console.log(`⚡ Modo de Execução:                  ${DRY_RUN ? 'SIMULAÇÃO (DRY RUN)' : 'PRODUÇÃO ATIVA'}\n`);

  if (state.totalSent >= state.targetGoal) {
    console.log(`🎉 META DE ${state.targetGoal} E-MAILS ENTREGUES JÁ FOI ALCANÇADA!`);
    return state;
  }

  let consecutiveErrors = 0;

  while (state.totalSent < state.targetGoal && state.lastOffset < pharmacies.length) {
    const today = getSaoPauloDate();

    // 1. Checagem de virada de meia-noite (UTC-3)
    if (state.currentDate !== today) {
      console.log(`\n🌅 Meia-noite (UTC-3) atingida! Data: ${today}. Reativando Gateway Primário (Brevo 300 cota diária).`);
      state.currentDate = today;
      state.brevoSentToday = 0;
      state.currentGateway = 'BREVO';
      saveState(state);
    }

    // 2. Determinação do Gateway Ativo
    if (state.currentGateway === 'BREVO' && state.brevoSentToday >= BREVO_DAILY_LIMIT) {
      console.log(`\n⚡ [FAILOVER AUTOMÁTICO] Brevo atingiu o limite de ${BREVO_DAILY_LIMIT} e-mails hoje.`);
      console.log(`   Alternando imediatamente para o Gateway Secundário: Hostinger SMTP (porta 465 SSL)...`);
      state.currentGateway = 'HOSTINGER';
      saveState(state);
    }

    const currentGateway = state.currentGateway;
    const pharmacy = pharmacies[state.lastOffset];
    const currentIndex = state.lastOffset + 1;
    const progressText = `[#${String(state.totalSent + 1).padStart(4, '0')}/${state.targetGoal}] [Idx: ${currentIndex}/${pharmacies.length}] [GW: ${currentGateway}]`;

    console.log(`📨 ${progressText} → ${pharmacy.nome_fantasia} (${pharmacy.cidade}/${pharmacy.uf}) <${pharmacy.email}>`);

    const html = buildPharmacyEmailHtml(pharmacy);
    let sendResult = null;

    if (DRY_RUN) {
      sendResult = {
        ok: true,
        messageId: `<simulated-${currentGateway.toLowerCase()}-${Date.now()}@plantayraiz.com.br>`,
        status: 200,
        error: null
      };
    } else {
      try {
        if (currentGateway === 'BREVO') {
          sendResult = await sendViaBrevo(pharmacy, html);

          // Se Brevo estourar cota ou rate limit (429/400)
          if (sendResult.isQuotaExceeded) {
            console.log(`   ⚠️ Brevo acusou cota esgotada/rate-limit (${sendResult.status}). Acionando Failover Hostinger...`);
            state.currentGateway = 'HOSTINGER';
            saveState(state);
            sendResult = await sendViaHostinger(pharmacy, html);
          }
        } else {
          // Gateway Hostinger SMTP
          sendResult = await sendViaHostinger(pharmacy, html);
        }
      } catch (err) {
        sendResult = {
          ok: false,
          status: 500,
          error: err.message,
          messageId: null
        };
      }
    }

    // 3. Processamento do Resultado e Logs
    if (sendResult.ok) {
      consecutiveErrors = 0;
      state.totalSent++;
      if (currentGateway === 'BREVO') {
        state.brevoSentToday++;
      } else {
        state.hostingerSent++;
      }

      console.log(`   ✅ SUCESSO via ${currentGateway}! MessageId: ${sendResult.messageId}`);
      appendLog({
        email: pharmacy.email,
        cnpj: pharmacy.cnpj,
        uf: pharmacy.uf,
        timestamp: new Date().toISOString(),
        messageId: sendResult.messageId,
        gateway: currentGateway,
        status: 'SENT',
        dryRun: DRY_RUN
      });
    } else {
      consecutiveErrors++;
      console.log(`   ❌ FALHA no envio (${sendResult.status}): ${sendResult.error}`);
      appendLog({
        email: pharmacy.email,
        cnpj: pharmacy.cnpj,
        uf: pharmacy.uf,
        timestamp: new Date().toISOString(),
        gateway: currentGateway,
        status: 'FAILED',
        error: sendResult.error
      });

      // Em caso de falha de conexão/rede: pausar 90 segundos sem travar o processo
      if (!DRY_RUN) {
        console.log(`   ⏳ Pausando por ${ERROR_RETRY_PAUSE_MS / 1000}s para restabelecimento de conexão...`);
        await sleep(ERROR_RETRY_PAUSE_MS);
      }
    }

    // Avança para o próximo registro
    state.lastOffset++;
    saveState(state);

    // Relatório periódico em lote (a cada 10 disparos)
    if (state.totalSent % 10 === 0 && state.totalSent > 0) {
      console.log('\n' + '─'.repeat(70));
      console.log(`📊 PARCIAL DO RECRUTAMENTO NACIONAL: ${state.totalSent} / ${state.targetGoal} (${((state.totalSent / state.targetGoal) * 100).toFixed(1)}%)`);
      console.log(`   Brevo Hoje: ${state.brevoSentToday} | Hostinger: ${state.hostingerSent} | Gateway: ${state.currentGateway}`);
      console.log('─'.repeat(70) + '\n');
    }

    // 4. Throttle de Segurança
    if (state.totalSent < state.targetGoal) {
      let delay = currentGateway === 'BREVO' ? BREVO_THROTTLE_MS : HOSTINGER_THROTTLE_MS;
      if (OVERRIDE_THROTTLE !== null) {
        delay = OVERRIDE_THROTTLE;
      } else if (DRY_RUN) {
        delay = 20; // Super-rápido no modo dry-run
      }

      if (delay > 0) {
        await sleep(delay);
      }
    }
  }

  console.log('\n' + '═'.repeat(76));
  console.log(`🏁 EXECUÇÃO FINALIZADA COM SUCESSO!`);
  console.log(`   🎯 Meta Final Atingida:       ${state.totalSent} / ${state.targetGoal}`);
  console.log(`   📫 Total Brevo:               ${state.brevoSentToday}`);
  console.log(`   📬 Total Hostinger SMTP:      ${state.hostingerSent}`);
  console.log(`   📁 Log detalhado:             ${path.basename(LOG_FILE)}`);
  console.log(`   📁 Estado final:              ${path.basename(STATE_FILE)}`);
  console.log('═'.repeat(76) + '\n');

  return state;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('hybrid_dispatch_engine.js')) {
  startHybridDispatchEngine().catch(err => {
    console.error('Erro fatal no motor híbrido:', err);
    process.exit(1);
  });
}
