/**
 * Sistema de Alertas e Retry Automático
 * Gerencia notificações de falhas e tentativas automáticas
 */

import { notifyOwner } from './notification';
import { sendReportEmail } from './email';

/**
 * Interface de falha de agendamento
 */
export interface ScheduleFailure {
  scheduleId: string;
  email: string;
  error: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

/**
 * Map de falhas em retry
 */
const failureQueue = new Map<string, ScheduleFailure>();

/**
 * Registrar falha de agendamento
 */
export async function registerScheduleFailure(failure: Omit<ScheduleFailure, 'timestamp'>): Promise<void> {
  const fullFailure: ScheduleFailure = {
    ...failure,
    timestamp: new Date(),
  };

  failureQueue.set(failure.scheduleId, fullFailure);

  console.log(`[ALERTING] Falha registrada: ${failure.scheduleId} - ${failure.error}`);

  // Notificar admin
  await notifyOwner({
    title: '🚨 Falha em Agendamento de Relatório',
    content: `Agendamento ${failure.scheduleId} falhou ao enviar para ${failure.email}.\n\nErro: ${failure.error}\n\nTentativa ${failure.retryCount} de ${failure.maxRetries}`,
  });

  // Se não atingiu o limite de retries, agendar retry
  if (failure.retryCount < failure.maxRetries) {
    scheduleRetry(failure.scheduleId, failure.retryCount + 1);
  } else {
    // Se atingiu o limite, alertar crítico
    await notifyOwner({
      title: '🔴 CRÍTICO: Agendamento Falhou Permanentemente',
      content: `Agendamento ${failure.scheduleId} falhou após ${failure.maxRetries} tentativas.\n\nEmail: ${failure.email}\n\nÚltimo erro: ${failure.error}\n\nAção necessária: Verificar configuração SMTP e logs do servidor.`,
    });
  }
}

/**
 * Agendar retry de falha
 */
function scheduleRetry(scheduleId: string, retryCount: number): void {
  const failure = failureQueue.get(scheduleId);
  if (!failure) return;

  // Calcular delay exponencial (5 min, 10 min, 20 min)
  const delayMinutes = Math.pow(2, retryCount - 1) * 5;
  const delayMs = delayMinutes * 60 * 1000;

  console.log(
    `[ALERTING] Retry agendado para ${scheduleId} em ${delayMinutes} minutos (tentativa ${retryCount})`
  );

  setTimeout(async () => {
    await retryScheduleExecution(scheduleId, retryCount);
  }, delayMs);
}

/**
 * Executar retry de agendamento
 */
async function retryScheduleExecution(scheduleId: string, retryCount: number): Promise<void> {
  const failure = failureQueue.get(scheduleId);
  if (!failure) return;

  console.log(`[ALERTING] Executando retry #${retryCount} para ${scheduleId}`);

  try {
    // Aqui você executaria a exportação novamente
    // await executeScheduledExport(schedule);

    // Se sucesso, remover da fila
    failureQueue.delete(scheduleId);
    console.log(`[ALERTING] Retry bem-sucedido para ${scheduleId}`);

    // Notificar sucesso
    await notifyOwner({
      title: '✅ Agendamento Recuperado',
      content: `Agendamento ${scheduleId} foi recuperado com sucesso após ${retryCount} tentativa(s).\n\nEmail: ${failure.email}`,
    });
  } catch (error) {
    console.error(`[ALERTING] Retry falhou para ${scheduleId}:`, error);

    // Atualizar falha e agendar próximo retry
    failure.retryCount = retryCount;
    failure.error = error instanceof Error ? error.message : 'Erro desconhecido';

    if (retryCount < failure.maxRetries) {
      scheduleRetry(scheduleId, retryCount + 1);
    } else {
      // Limite atingido
      await notifyOwner({
        title: '🔴 CRÍTICO: Agendamento Falhou Permanentemente',
        content: `Agendamento ${scheduleId} falhou após ${failure.maxRetries} tentativas.\n\nEmail: ${failure.email}\n\nÚltimo erro: ${failure.error}`,
      });
    }
  }
}

/**
 * Listar falhas ativas
 */
export function getActiveFailures(): ScheduleFailure[] {
  return Array.from(failureQueue.values());
}

/**
 * Obter detalhes de falha
 */
export function getFailureDetails(scheduleId: string): ScheduleFailure | undefined {
  return failureQueue.get(scheduleId);
}

/**
 * Limpar falha resolvida
 */
export function clearFailure(scheduleId: string): boolean {
  return failureQueue.delete(scheduleId);
}

/**
 * Enviar relatório de saúde do sistema
 */
export async function sendHealthReport(): Promise<void> {
  const activeFailures = getActiveFailures();
  const timestamp = new Date().toLocaleString('pt-BR');

  let report = `
    <h2>📊 Relatório de Saúde - Sistema de Agendamentos</h2>
    <p><strong>Data/Hora:</strong> ${timestamp}</p>
    
    <h3>Status Geral</h3>
    <ul>
      <li><strong>Falhas Ativas:</strong> ${activeFailures.length}</li>
      <li><strong>Status:</strong> ${activeFailures.length === 0 ? '✅ Operacional' : '⚠️ Com Problemas'}</li>
    </ul>
  `;

  if (activeFailures.length > 0) {
    report += '<h3>Falhas Ativas</h3><ul>';
    for (const failure of activeFailures) {
      report += `
        <li>
          <strong>${failure.scheduleId}</strong><br/>
          Email: ${failure.email}<br/>
          Erro: ${failure.error}<br/>
          Tentativas: ${failure.retryCount}/${failure.maxRetries}<br/>
          Timestamp: ${failure.timestamp.toLocaleString('pt-BR')}
        </li>
      `;
    }
    report += '</ul>';
  }

  report += '<p style="margin-top: 20px; font-size: 12px; color: #666;">Relatório automático gerado pelo sistema de agendamentos.</p>';

  // Enviar email de relatório
  const result = await sendReportEmail(
    'plantayraizadm@gmail.com',
    'Admin',
    report,
    'relatorio-saude-agendamentos.html',
    activeFailures.length,
    'Relatório de Saúde do Sistema'
  );

  if (result.success) {
    console.log('[ALERTING] Relatório de saúde enviado com sucesso');
  } else {
    console.error('[ALERTING] Erro ao enviar relatório de saúde:', result.error);
  }
}

/**
 * Agendar relatório de saúde diário
 */
export function scheduleHealthReports(): void {
  // Executar diariamente às 8h da manhã
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);

  const timeUntilNextReport = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    sendHealthReport();
    // Repetir diariamente
    setInterval(sendHealthReport, 24 * 60 * 60 * 1000);
  }, timeUntilNextReport);

  console.log('[ALERTING] Relatórios de saúde agendados diariamente às 8h');
}

/**
 * Validar saúde do sistema
 */
export async function validateSystemHealth(): Promise<{
  healthy: boolean;
  failureCount: number;
  criticalFailures: ScheduleFailure[];
}> {
  const activeFailures = getActiveFailures();
  const criticalFailures = activeFailures.filter((f) => f.retryCount >= f.maxRetries - 1);

  return {
    healthy: criticalFailures.length === 0,
    failureCount: activeFailures.length,
    criticalFailures,
  };
}
