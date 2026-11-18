/**
 * scripts/agent_doctor_kyc_listener_daemon.mjs
 * 
 * Daemon contínuo gerenciado pelo PM2 ('doctor-kyc-listener') e supervisionado pelo watchdog.
 * Escuta, audita e processa em tempo real documentos KYC enviados por médicos via WhatsApp.
 */

import dns from 'node:dns';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { runKycComplianceAudit } from './agent_doctor_kyc_compliance.mjs';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHECK_INTERVAL_MS = 60 * 1000; // a cada 60 segundos

let isRunning = false;
let keepAlive = true;

async function runCycle() {
  if (isRunning) return;
  isRunning = true;
  try {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    console.log(`[KYC-Listener-Daemon ${timestamp}] Executando ciclo de auditoria e escuta de documentos...`);
    await runKycComplianceAudit();
  } catch (err) {
    console.error(`[KYC-Listener-Daemon] Erro durante o ciclo:`, err?.message || err);
  } finally {
    isRunning = false;
  }
}

async function startDaemon() {
  console.log('====================================================');
  console.log('🩺 INICIANDO DOCTOR KYC LISTENER DAEMON (PM2)');
  console.log(`🕒 Intervalo de verificação: ${CHECK_INTERVAL_MS / 1000}s`);
  console.log('====================================================');

  // Executa o primeiro ciclo imediatamente no startup
  await runCycle();

  // Loop contínuo
  const interval = setInterval(async () => {
    if (!keepAlive) {
      clearInterval(interval);
      return;
    }
    await runCycle();
  }, CHECK_INTERVAL_MS);

  const shutdown = () => {
    console.log('[KYC-Listener-Daemon] Encerrando graciosamente...');
    keepAlive = false;
    clearInterval(interval);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startDaemon().catch((err) => {
  console.error('[KYC-Listener-Daemon] Falha fatal na inicialização:', err);
  process.exit(1);
});
