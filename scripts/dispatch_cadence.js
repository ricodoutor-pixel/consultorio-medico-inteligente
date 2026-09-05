/**
 * Fase 3 & Fase 4: Motor de Envio Cadenciado & Auditoria, Retries e Logs
 * 
 * Especificações:
 * - Endpoint: POST https://api.brevo.com/v3/smtp/email
 * - Limite diário: Trava rígida de exatamente 300 e-mails / ciclo de 24h
 * - Throttle: sleep(60000) (pausa estrita de 60 segundos entre envios)
 * - Remetente: contato@plantayraiz.com.br (Planta y Raíz Expansão)
 * - Assunto: Credenciamento Exclusivo: Expansão de Dispensação de Cannabis Medicinal | Parceria Planta y Raíz
 * - Tags: ["prospeccao-farmacia", "credenciamento-2026"]
 * - Auditoria: dispatch_log.json com email, timestamp, messageId, status: "SENT" | "FAILED"
 * - Retries: Em erro 429 (Rate Limit) ou 400, pausa de 120 segundos e tenta reenviar 1 vez
 * - Offset & Persistência: dispatch_state.json grava último offset e contagem diária
 * 
 * Uso:
 *   node scripts/dispatch_cadence.js
 *   Opções opcionais:
 *     --dry-run       Simula sem disparar e-mails reais
 *     --interval=MS   Intervalo em ms (padrão: 60000)
 *     --limit=N       Limite específico de envios para este lote (máx 300/dia)
 *     --offset=N      Forçar offset de início
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

const PHARMACIES_FILE = path.join(ROOT_DIR, 'pharmacies_raw.json');
const LOG_FILE        = path.join(ROOT_DIR, 'dispatch_log.json');
const STATE_FILE      = path.join(ROOT_DIR, 'dispatch_state.json');

const BREVO_API_KEY   = process.env.BREVO_API_KEY || '';
const BREVO_SMTP_URL  = 'https://api.brevo.com/v3/smtp/email';

const SENDER_EMAIL    = 'contato@plantayraiz.com.br';
const SENDER_NAME     = 'Planta y Raíz Expansão';
const SUBJECT         = 'Credenciamento Exclusivo: Expansão de Dispensação de Cannabis Medicinal | Parceria Planta y Raíz';
const TAGS            = ['prospeccao-farmacia', 'credenciamento-2026'];

const MAX_DAILY_LIMIT = 300; // Trava rígida diária (Cota Free Brevo)
const DEFAULT_INTERVAL = 60000; // 60 segundos estritos entre envios
const RETRY_PAUSE_MS  = 120000; // 120 segundos em caso de 429 ou 400

// Parser de argumentos de linha de comando
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const customIntervalArg = args.find(a => a.startsWith('--interval='));
const customLimitArg = args.find(a => a.startsWith('--limit='));
const customOffsetArg = args.find(a => a.startsWith('--offset='));

const INTERVAL_MS = customIntervalArg ? parseInt(customIntervalArg.split('=')[1]) : DEFAULT_INTERVAL;
const RUN_LIMIT = customLimitArg ? parseInt(customLimitArg.split('=')[1]) : MAX_DAILY_LIMIT;
const FORCED_OFFSET = customOffsetArg ? parseInt(customOffsetArg.split('=')[1]) : null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Carrega ou inicializa o estado de auditoria e offset
 */
function loadState() {
  const today = getTodayString();
  let state = {
    lastRunDate: today,
    dailyCount: 0,
    lastOffset: 0,
    totalSent: 0,
    totalFailed: 0
  };

  if (fs.existsSync(STATE_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      state = { ...state, ...saved };
      
      // Se for um novo dia, zera o contador diário
      if (state.lastRunDate !== today) {
        console.log(`🌅 Novo ciclo diário detectado (${today}). Contador diário resetado para 0.`);
        state.lastRunDate = today;
        state.dailyCount = 0;
      }
    } catch (e) {
      console.warn('⚠️ Erro ao ler dispatch_state.json, inicializando novo estado.');
    }
  }

  if (FORCED_OFFSET !== null) {
    state.lastOffset = FORCED_OFFSET;
  }

  return state;
}

/**
 * Salva o estado atualizado
 */
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Registra o log no arquivo dispatch_log.json
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
 * Monta o template de e-mail institucional oficial em HTML
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
        <!-- Container Principal -->
        <table width="640" border="0" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background-color:#0f172a;border:1px solid #1e293b;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          
          <!-- Cabeçalho Institucional -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#047857 50%,#0f766e 100%);padding:40px 32px;text-align:center;border-bottom:3px solid #10b981;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
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
              </table>
            </td>
          </tr>

          <!-- Corpo da Carta -->
          <tr>
            <td style="padding:36px 32px 24px;">
              
              <!-- Saudação -->
              <p style="font-size:16px;line-height:1.6;color:#f8fafc;margin:0 0 16px;">
                Prezado(a) <strong>Responsável Técnico(a) e Gestor(a) Farmacêutico(a)</strong> da <strong>${pharmacyName}</strong> (${location}),
              </p>

              <!-- Introdução -->
              <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 18px;">
                A <strong>Planta y Raíz</strong> convida sua drogaria/farmácia a integrar nossa rede credenciada nacional de dispensação de produtos à base de Cannabis medicinal, conectando seu estoque à demanda contínua de pacientes atendidos em nosso ecossistema clínico de telemedicina.
              </p>

              <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 24px;">
                Com o avanço das prescrições médicas sob a <strong>RDC 327/2019 da ANVISA</strong>, estruturamos uma infraestrutura tecnológica que direciona o paciente consultado diretamente para a farmácia parceira mais próxima ou com capacidade de entrega rápida, eliminando barreiras logísticas e burocráticas.
              </p>

              <!-- Caixa de Destaque Vantagens -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#1e293b;border:1px solid #334155;border-radius:18px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <h3 style="margin:0 0 16px;color:#34d399;font-size:17px;font-weight:800;display:flex;align-items:center;">
                      ⭐ Vantagens do Credenciamento para sua Farmácia
                    </h3>
                    
                    <ul style="margin:0;padding-left:18px;color:#e2e8f0;font-size:14px;line-height:1.8;">
                      <li style="margin-bottom:10px;">
                        <strong style="color:#ffffff;">Demanda Qualificada e Recorrente:</strong> Recebimento direto de pedidos gerados por nosso corpo clínico ativo em todo o Brasil (produtos como Prati-Donaduzzi, Eurofarma, Ease Labs e fitofármacos autorizados).
                      </li>
                      <li style="margin-bottom:10px;">
                        <strong style="color:#34d399;">Split de Pagamento Automatizado (95% Líquido):</strong> A plataforma opera liquidação direta no checkout. O valor integral do produto (95%) e 100% do frete caem imediatamente na conta da farmácia via Mercado Pago/Pix, eliminando bitributação ou retenção financeira intermediária.
                      </li>
                      <li style="margin-bottom:10px;">
                        <strong style="color:#ffffff;">Validação ICP-Brasil Nativa:</strong> Todas as prescrições médicas chegam ao seu painel com hash de integridade e assinatura digital qualificada padrão ICP-Brasil (emissão de Receitas de Controle Especial C1 em conformidade com o CFM e ANVISA).
                      </li>
                      <li style="margin-bottom:10px;">
                        <strong style="color:#ffffff;">Painel de Dispensação Dedicado:</strong> Acesso a um ambiente exclusivo para gestão de pedidos, upload de comprovantes fiscais, inserção de código de rastreio e controle simplificado de estoque.
                      </li>
                      <li>
                        <strong style="color:#ffffff;">Custo Zero de Adesão:</strong> Não cobramos taxa de adesão, mensalidade de software nem fidelidade contratual; a operação remunera-se exclusivamente no sucesso de cada dispensação efetuada.
                      </li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Fluxo Operacional -->
              <h3 style="margin:0 0 14px;color:#f8fafc;font-size:16px;font-weight:800;">
                🔄 Como Funciona o Fluxo Operacional
              </h3>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:12px;background-color:#162033;border-left:4px solid #10b981;border-radius:0 12px 12px 0;margin-bottom:8px;">
                    <p style="margin:0;font-size:13.5px;line-height:1.5;color:#e2e8f0;">
                      <strong style="color:#34d399;">1. Aprovação do Pedido:</strong> O médico prescreve na teleconsulta, o paciente adquire o item em nosso Shopping e escolhe a opção de envio ou retirada.
                    </p>
                  </td>
                </tr>
                <tr><td height="8"></td></tr>
                <tr>
                  <td style="padding:12px;background-color:#162033;border-left:4px solid #10b981;border-radius:0 12px 12px 0;">
                    <p style="margin:0;font-size:13.5px;line-height:1.5;color:#e2e8f0;">
                      <strong style="color:#34d399;">2. Notificação no Painel:</strong> Sua equipe recebe a notificação da receita assinada com validação digital e dados para separação do produto.
                    </p>
                  </td>
                </tr>
                <tr><td height="8"></td></tr>
                <tr>
                  <td style="padding:12px;background-color:#162033;border-left:4px solid #10b981;border-radius:0 12px 12px 0;">
                    <p style="margin:0;font-size:13.5px;line-height:1.5;color:#e2e8f0;">
                      <strong style="color:#34d399;">3. Dispensação e Logística:</strong> A farmácia emite o cupom fiscal/DANFE, anexa o código de rastreamento do envio e confirma a entrega com um clique.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Próximos Passos e CTA -->
              <h3 style="margin:0 0 12px;color:#f8fafc;font-size:16px;font-weight:800;">
                🚀 Próximos Passos para Ativação Cadastral
              </h3>
              <p style="font-size:14.5px;line-height:1.6;color:#cbd5e1;margin:0 0 20px;">
                Para iniciar o processo de homologação técnica e cadastrar sua lista de produtos disponíveis em estoque, basta acessar o link de credenciamento ou falar diretamente com nossa diretoria comercial:
              </p>

              <!-- Botões CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius:14px;background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:14px 28px;">
                          <a href="https://plantayraiz.com.br/cadastro-farmacia" target="_blank" style="color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;display:inline-block;letter-spacing:0.3px;">
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
                      💬 Falar via WhatsApp Comercial: (11) 98713-1241
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:14px;line-height:1.6;color:#94a3b8;margin:0 0 24px;text-align:center;">
                Ficamos à disposição para agendar uma breve demonstração de 15 minutos do painel farmacêutico.
              </p>

              <!-- Assinatura -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top:1px solid #1e293b;padding-top:20px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:14px;font-weight:700;color:#f8fafc;">
                      Equipe de Relações Institucionais & Expansão
                    </p>
                    <p style="margin:2px 0 0;font-size:13px;color:#10b981;font-weight:600;">
                      Planta y Raíz Tecnologia em Saúde LTDA
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:#64748b;">
                      E-mail: contato@plantayraiz.com.br • WhatsApp: (11) 98713-1241
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Rodapé de Conformidade Regulatória -->
          <tr>
            <td style="background-color:#0b1120;padding:24px 32px;text-align:center;border-top:1px solid #1e293b;">
              <p style="margin:0 0 6px;font-size:11px;color:#64748b;line-height:1.5;">
                Planta y Raíz LTDA • CNPJ: 58.283.475/0001-00 • São Paulo/SP<br>
                Plataforma de Telemedicina e Dispensação Farmacêutica em conformidade com o CFM nº 2.314/2022 e ANVISA RDC nº 327/2019.
              </p>
              <p style="margin:6px 0 0;font-size:10px;color:#475569;">
                Você recebeu este convite institucional oficial dirigido a estabelecimentos farmacêuticos ativos no Brasil.
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
 * Envia um e-mail transacional via API v3 do Brevo
 */
async function sendTransactionalEmail(pharmacy) {
  const pharmacyName = pharmacy.nome_fantasia || pharmacy.razao_social || 'Farmácia';
  const html = buildPharmacyEmailHtml(pharmacy);

  const payload = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL
    },
    to: [
      {
        email: pharmacy.email,
        name: pharmacyName
      }
    ],
    replyTo: {
      name: SENDER_NAME,
      email: SENDER_EMAIL
    },
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

  const responseText = await res.text();
  let parsed = {};
  try {
    parsed = JSON.parse(responseText);
  } catch {
    parsed = { raw: responseText };
  }

  return {
    status: res.status,
    ok: res.ok,
    messageId: parsed.messageId || null,
    error: res.ok ? null : (parsed.message || responseText)
  };
}

/**
 * Loop principal de envio cadenciado com travas e retries
 */
export async function runCadenceEngine() {
  console.log('================================================================');
  console.log('🚀 PLANTA Y RAÍZ — FASES 3 & 4: MOTOR DE ENVIO CADENCIADO BREVO');
  console.log('================================================================\n');

  if (!BREVO_API_KEY) {
    console.error('❌ ERRO: BREVO_API_KEY não encontrada no ambiente (.env)!');
    process.exit(1);
  }

  if (!fs.existsSync(PHARMACIES_FILE)) {
    console.error(`❌ ERRO: Arquivo ${PHARMACIES_FILE} não encontrado! Execute a Fase 1 primeiro.`);
    process.exit(1);
  }

  const pharmacies = JSON.parse(fs.readFileSync(PHARMACIES_FILE, 'utf-8'));
  const state = loadState();

  console.log(`📋 Total de farmácias na base:       ${pharmacies.length}`);
  console.log(`📅 Data do ciclo atual:             ${state.lastRunDate}`);
  console.log(`📊 Disparos já realizados hoje:     ${state.dailyCount} / ${MAX_DAILY_LIMIT}`);
  console.log(`📍 Offset de partida:               ${state.lastOffset}`);
  console.log(`⏱️  Intervalo (Throttle):           ${INTERVAL_MS / 1000}s`);
  console.log(`🔒 Modo de Operação:                ${DRY_RUN ? 'SIMULAÇÃO (DRY RUN)' : 'REAL (ENVIO ATIVO)'}\n`);

  if (state.dailyCount >= MAX_DAILY_LIMIT) {
    console.log(`🛑 [TRAVA RÍGIDA] O limite diário de ${MAX_DAILY_LIMIT} e-mails por ciclo de 24 horas já foi atingido hoje.`);
    console.log(`   O processo será retomado no próximo ciclo diário a partir do offset ${state.lastOffset}.`);
    return { finished: true, reason: 'DAILY_LIMIT_ALREADY_REACHED' };
  }

  let sentInThisRun = 0;
  let failedInThisRun = 0;

  for (let i = state.lastOffset; i < pharmacies.length; i++) {
    // 1. Checar trava rígida diária de 300 e-mails
    if (state.dailyCount >= MAX_DAILY_LIMIT) {
      console.log(`\n🛑 [TRAVA RÍGIDA ATINGIDA] Limite de ${MAX_DAILY_LIMIT} disparos diários alcançado com precisão!`);
      console.log(`   Gravando offset ${i} para continuação automática no próximo ciclo.`);
      state.lastOffset = i;
      saveState(state);
      break;
    }

    // 2. Checar limite desta execução específica (--limit)
    if (sentInThisRun >= RUN_LIMIT) {
      console.log(`\n🏁 Limite configurado para esta sessão (${RUN_LIMIT}) alcançado.`);
      state.lastOffset = i;
      saveState(state);
      break;
    }

    const pharmacy = pharmacies[i];
    const itemNum = i + 1;
    const prefix = `[${String(itemNum).padStart(3, '0')}/${pharmacies.length}] [Hoje: ${state.dailyCount + 1}/${MAX_DAILY_LIMIT}]`;

    console.log(`\n📨 ${prefix} Processando: ${pharmacy.nome_fantasia} <${pharmacy.email}>`);

    if (DRY_RUN) {
      console.log(`   🔵 [DRY-RUN] Simulação de envio com sucesso.`);
      appendLog({
        email: pharmacy.email,
        cnpj: pharmacy.cnpj,
        timestamp: new Date().toISOString(),
        messageId: `<dry-run-simulated-${Date.now()}@plantayraiz.com.br>`,
        status: 'SENT',
        dryRun: true
      });
      sentInThisRun++;
      state.dailyCount++;
      state.totalSent++;
      state.lastOffset = i + 1;
      saveState(state);
      continue;
    }

    // Envio real com tratamento de erros 429/400 e retry
    let response = await sendTransactionalEmail(pharmacy);

    // Se retornar 429 (Rate Limit) ou 400, pausar 120s e tentar 1 vez
    if (response.status === 429 || response.status === 400) {
      console.log(`   ⚠️ Resposta do Brevo (${response.status}): ${response.error}`);
      console.log(`   ⏳ Pausando execução por 120 segundos conforme protocolo de retry...`);
      await sleep(RETRY_PAUSE_MS);

      console.log(`   🔄 Tentando reenviar e-mail para ${pharmacy.email}...`);
      response = await sendTransactionalEmail(pharmacy);
    }

    if (response.ok) {
      console.log(`   ✅ ENVIADO com sucesso! MessageId: ${response.messageId}`);
      appendLog({
        email: pharmacy.email,
        cnpj: pharmacy.cnpj,
        timestamp: new Date().toISOString(),
        messageId: response.messageId,
        status: 'SENT'
      });
      sentInThisRun++;
      state.dailyCount++;
      state.totalSent++;
      state.lastOffset = i + 1;
      saveState(state);
    } else {
      console.log(`   ❌ FALHA no envio (${response.status}): ${response.error}`);
      appendLog({
        email: pharmacy.email,
        cnpj: pharmacy.cnpj,
        timestamp: new Date().toISOString(),
        messageId: null,
        status: 'FAILED',
        error: response.error
      });
      failedInThisRun++;
      state.totalFailed++;
      state.lastOffset = i + 1;
      saveState(state);
    }

    // 3. Throttle cadenciado: pausa entre envios consecutivos
    const isLastItem = (i === pharmacies.length - 1) || (state.dailyCount >= MAX_DAILY_LIMIT) || (sentInThisRun >= RUN_LIMIT);
    if (!isLastItem && !DRY_RUN) {
      console.log(`   ⏳ Aguardando ${INTERVAL_MS / 1000}s (throttle cadenciado de 60s)...`);
      await sleep(INTERVAL_MS);
    }
  }

  console.log('\n' + '═'.repeat(64));
  console.log('📊 RESUMO DA SESSÃO DE DISPARO CADENCIADO:');
  console.log(`   ✅ Enviados nesta sessão:     ${sentInThisRun}`);
  console.log(`   ❌ Falhas nesta sessão:       ${failedInThisRun}`);
  console.log(`   📈 Total acumulado hoje:      ${state.dailyCount} / ${MAX_DAILY_LIMIT}`);
  console.log(`   📍 Próximo offset gravado:    ${state.lastOffset}`);
  console.log(`   📁 Log de auditoria:          ${path.basename(LOG_FILE)}`);
  console.log(`   📁 Estado de execução:        ${path.basename(STATE_FILE)}`);
  console.log('═'.repeat(64) + '\n');

  return { sentInThisRun, failedInThisRun, state };
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('dispatch_cadence.js')) {
  runCadenceEngine().catch(err => {
    console.error('Erro no motor de cadência:', err);
    process.exit(1);
  });
}
