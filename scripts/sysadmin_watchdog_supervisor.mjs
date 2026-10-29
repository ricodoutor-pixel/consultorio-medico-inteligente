import os from 'os';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, 'sysadmin_watchdog.log');

const EXPECTED_SERVICES = [
  'brisa-live-responder',
  'doctor-kyc-listener',
  'patient-traffic-booster',
  'growth-engine',
  'lead-harvesters-master',
  'meta-social-engine',
  'apify-lead-sync',
  'anvisa-rdc660-rpa',
  'brevo-multi-pipeline',
  'partner-meeting-scheduler',
  'organic-analytics-reporter'
];

function log(msg) {
  const line = `[${new Date().toISOString()}] [SYSADMIN-WATCHDOG] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {}
}

async function checkApiConnectivity(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return { ok: true, status: res.status };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, error: err.message };
  }
}

async function inspectSystemResources() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
  const loadAvg = os.loadavg();

  let diskInfo = 'N/A';
  try {
    diskInfo = execSync("df -h / | tail -1 | awk '{print $5}'").toString().trim();
  } catch (e) {}

  log(`🖥️ RECURSOS: RAM ${memUsagePercent}% usada (${(usedMem / 1024 / 1024).toFixed(0)}MB / ${(totalMem / 1024 / 1024).toFixed(0)}MB) | Carga: [${loadAvg.map(l => l.toFixed(2)).join(', ')}] | Disco: ${diskInfo}`);
}

async function checkAndHealPM2Services() {
  const failedServices = [];
  try {
    const pm2JsonRaw = execSync('pm2 jlist').toString();
    const pm2List = JSON.parse(pm2JsonRaw);
    const activeMap = new Map();

    for (const proc of pm2List) {
      activeMap.set(proc.name, proc.pm2_env.status);
    }

    for (const serviceName of EXPECTED_SERVICES) {
      const status = activeMap.get(serviceName);
      if (!status) {
        log(`⚠️ Serviço PM2 '${serviceName}' NÃO ENCONTRADO na lista ativa. Iniciando...`);
        try {
          execSync(`pm2 start ecosystem.config.cjs --only ${serviceName}`);
          log(`✅ Serviço '${serviceName}' iniciado.`);
        } catch (e) {
          log(`❌ Falha ao iniciar '${serviceName}': ${e.message}`);
          failedServices.push(serviceName);
        }
      } else if (status !== 'online') {
        log(`🚨 Serviço PM2 '${serviceName}' em estado '${status}'. Reiniciando...`);
        try {
          execSync(`pm2 restart ${serviceName}`);
          log(`✅ Serviço '${serviceName}' reiniciado com sucesso.`);
        } catch (e) {
          log(`❌ Falha ao reiniciar '${serviceName}': ${e.message}`);
          failedServices.push(serviceName);
        }
      } else {
        log(`🟢 Serviço PM2 '${serviceName}': ONLINE`);
      }
    }
  } catch (err) {
    log(`❌ Erro ao inspecionar PM2 via CLI: ${err.message}`);
    failedServices.push('pm2-cli-error');
  }
  return { failed: failedServices.length > 0, services: failedServices };
}

async function checkExternalApis() {
  const apis = [
    { name: 'Supabase Cloud', url: (process.env.VITE_SUPABASE_URL || 'https://shmbwdjuddvquszwkvuq.supabase.co') + '/rest/v1/' },
    { name: 'Evolution WhatsApp VPS', url: (process.env.EVOLUTION_URL_VPS || 'https://whatsapp.plantayraiz.com.br') + '/instance/fetchInstances' },
    { name: 'Brevo API', url: 'https://api.brevo.com/v3/account' },
    { name: 'Apify API', url: 'https://api.apify.com/v2/users/me' },
    { name: 'Meta Graph API', url: 'https://graph.facebook.com/v21.0' }
  ];

  for (const api of apis) {
    const result = await checkApiConnectivity(api.url);
    if (result.ok) {
      log(`🌐 API [${api.name}]: CONECTADA (Status: ${result.status})`);
    } else {
      log(`⚠️ API [${api.name}]: ALERTA (${result.error})`);
    }
  }
}

let consecutiveCriticalFailures = 0;
const ADMIN_EMAIL = 'plantayraizadm@gmail.com';
const BREVO_KEY = process.env.BREVO_API_KEY;

async function sendEmergencyAlert(reason) {
  if (!BREVO_KEY) return;
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Watchdog Sentinela Planta y Raíz', email: 'alerta@plantayraiz.com.br' },
        to: [{ email: ADMIN_EMAIL, name: 'Dr. Edilson Bezerra / Diretoria' }],
        subject: '🚨 [ALERTA CRÍTICO SRE] Falha persistente na VPS Hostinger',
        htmlContent: `<h2>🚨 ALERTA DE EMERGÊNCIA — PLANTA Y RAÍZ SRE</h2>
          <p>O sentinela autônomo detectou falha crítica persistente por mais de 3 ciclos consecutivos (30 min).</p>
          <p><strong>Detalhes:</strong> ${reason}</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Acesse o terminal: <code>ssh root@179.236.244.168</code> e execute <code>pm2 status</code>.</p>`
      })
    });
    log(`🚨 Notificação de emergência enviada para ${ADMIN_EMAIL}`);
  } catch (err) {
    log(`⚠️ Falha ao disparar e-mail de alerta: ${err.message}`);
  }
}

async function runWatchdogCycle() {
  log("========================================================================");
  log("🩺 INICIANDO CICLO DE SUPERVISÃO SYSADMIN WATCHDOG");
  log("========================================================================");

  let hasCriticalFailure = false;
  let failureReasons = [];

  await inspectSystemResources();
  const healResult = await checkAndHealPM2Services();
  if (healResult && healResult.failed) {
    hasCriticalFailure = true;
    failureReasons.push(`Serviços PM2 com falha de recuperação: ${healResult.services.join(', ')}`);
  }

  await checkExternalApis();

  if (hasCriticalFailure) {
    consecutiveCriticalFailures++;
    log(`⚠️ Falhas detectadas neste ciclo. Contador consecutivo: ${consecutiveCriticalFailures}/3`);
    if (consecutiveCriticalFailures >= 3) {
      await sendEmergencyAlert(failureReasons.join(' | '));
    }
  } else {
    consecutiveCriticalFailures = 0;
  }

  log("✅ CICLO DE SUPERVISÃO CONCLUÍDO COM SUCESSO. Próximo ciclo em 10 minutos.");
}

// Execução contínua a cada 10 minutos
runWatchdogCycle();
setInterval(runWatchdogCycle, 10 * 60 * 1000);
