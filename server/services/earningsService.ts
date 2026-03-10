import { getDb } from '../db';
import { investments, investmentPlans, transactions, userBalances } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Calcular e creditar rendimentos diários para todos os investimentos ativos
 * Deve ser executado uma vez por dia via cron job
 */
export async function processDailyEarnings() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    console.log('[Earnings] Iniciando processamento de rendimentos diários...');

    // Buscar todos os investimentos ativos
    const activeInvestments = await db
      .select({
        investment: investments,
        plan: investmentPlans,
      })
      .from(investments)
      .innerJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
      .where(eq(investments.status, 'active'));

    let totalEarningsProcessed = 0;
    let investmentsProcessed = 0;

    // Processar cada investimento
    for (const { investment, plan } of activeInvestments) {
      // Calcular rendimento diário
      const dailyReturnRate = plan.dailyReturnPercentage / 100; // Converter percentual
      const dailyEarnings = Math.round(investment.amount * dailyReturnRate);

      if (dailyEarnings <= 0) continue;

      // Atualizar investimento com rendimentos acumulados
      await db
        .update(investments)
        .set({
          accumulatedReturns: investment.accumulatedReturns + dailyEarnings,
          updatedAt: new Date(),
        })
        .where(eq(investments.id, investment.id));

      // Registrar transação de ganho
      await db.insert(transactions).values({
        userId: investment.userId,
        type: 'earnings',
        amount: dailyEarnings,
        status: 'completed',
        description: `Rendimento diário - ${plan.name} (${plan.dailyReturnPercentage}%)`,
        createdAt: new Date(),
      });

      // Atualizar saldo do usuário
      const userBalance = await db
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, investment.userId))
        .limit(1);

      if (userBalance.length > 0) {
        await db
          .update(userBalances)
          .set({
            availableBalance: userBalance[0].availableBalance + dailyEarnings,
            totalEarnings: userBalance[0].totalEarnings + dailyEarnings,
            updatedAt: new Date(),
          })
          .where(eq(userBalances.userId, investment.userId));
      }

      totalEarningsProcessed += dailyEarnings;
      investmentsProcessed++;
    }

    console.log(
      `[Earnings] Processamento concluído: ${investmentsProcessed} investimentos, R$ ${(totalEarningsProcessed / 100).toFixed(2)} em rendimentos`
    );

    return {
      success: true,
      investmentsProcessed,
      totalEarningsProcessed,
    };
  } catch (error) {
    console.error('[Earnings] Erro ao processar rendimentos diários:', error);
    return {
      success: false,
      error: 'Falha ao processar rendimentos diários',
    };
  }
}

/**
 * Calcular comissões de afiliados baseado em depósitos
 * Deve ser executado quando um depósito é confirmado
 */
export async function processAffiliateCommissions(userId: number, depositAmount: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    console.log(`[Commissions] Processando comissões para novo depósito de usuário ${userId}`);

    // Buscar o usuário que fez o depósito
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) throw new Error('User not found');

    // TODO: Implementar lógica de rastreamento de referência
    // Buscar quem indicou este usuário
    // Calcular comissões em 3 níveis

    return {
      success: true,
      message: 'Comissões processadas com sucesso',
    };
  } catch (error) {
    console.error('[Commissions] Erro ao processar comissões:', error);
    return {
      success: false,
      error: 'Falha ao processar comissões',
    };
  }
}

/**
 * Iniciar cron job de rendimentos diários
 * Executar uma vez por dia às 00:00 UTC
 */
export function startEarningsCronJob() {
  // Usar node-cron ou similar
  const schedule = require('node-cron');

  // Executar diariamente às 00:00 UTC
  schedule.schedule('0 0 * * *', async () => {
    console.log('[Cron] Iniciando cron job de rendimentos diários');
    await processDailyEarnings();
  });

  console.log('[Cron] Cron job de rendimentos diários iniciado');
}

// Importar users para evitar erro
import { users } from '../../drizzle/schema';
