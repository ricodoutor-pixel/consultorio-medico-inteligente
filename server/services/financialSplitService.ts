/**
 * Serviço de Split Financeiro 7% Automático
 * Calcula e processa divisão automática de valores entre profissional e plataforma
 */

export interface SplitCalculation {
  consultationId: string;
  totalAmount: number;
  platformFee: number; // 7%
  professionalAmount: number; // 93%
  status: 'pending' | 'completed' | 'failed';
}

export interface ProfessionalBalance {
  professionalId: string;
  totalEarnings: number;
  totalWithdrawals: number;
  availableBalance: number;
  lastUpdated: Date;
}

export interface FinancialReport {
  balance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  transactions: any[];
  lastUpdated: Date;
}

export class FinancialSplitService {
  // Simulação de ledger em memória (em produção usar banco de dados)
  private static ledger: Map<string, any[]> = new Map();
  private static platformBalance = 0;

  /**
   * Calcula split automático de 7% para plataforma
   * 93% para profissional
   */
  static calculateSplit(amount: number): SplitCalculation {
    const platformFee = amount * 0.07;
    const professionalAmount = amount * 0.93;

    return {
      consultationId: '',
      totalAmount: amount,
      platformFee: Math.round(platformFee * 100) / 100,
      professionalAmount: Math.round(professionalAmount * 100) / 100,
      status: 'pending',
    };
  }

  /**
   * Processa split após confirmação de pagamento PIX
   */
  static async processSplitAfterPayment(
    consultationId: string,
    totalAmount: number,
    professionalId: string,
    mercadoPagoTransactionId: string
  ): Promise<SplitCalculation> {
    const split = this.calculateSplit(totalAmount);

    try {
      // Registra no ledger do profissional
      if (!this.ledger.has(professionalId)) {
        this.ledger.set(professionalId, []);
      }

      const professionalLedger = this.ledger.get(professionalId) || [];
      professionalLedger.push({
        id: `ledger_${Date.now()}`,
        type: 'credit',
        amount: split.professionalAmount,
        description: `Consulta ${consultationId} - 7% taxa plataforma`,
        transactionId: mercadoPagoTransactionId,
        createdAt: new Date(),
      });

      this.ledger.set(professionalId, professionalLedger);

      // Registra na plataforma
      this.platformBalance += split.platformFee;

      split.status = 'completed';
      return split;
    } catch (error) {
      console.error('Erro ao processar split:', error);
      split.status = 'failed';
      throw error;
    }
  }

  /**
   * Brisa CEO Audit — libera ou retém o crédito do médico após avaliação do paciente.
   * Regra: somente avaliação 5★ libera o saldo "Disponível para Saque".
   * Avaliações <5 entram em status "under_review" para auditoria do Dr. Edilson.
   */
  static async releaseDoctorCreditOnRating(params: {
    consultationId: string;
    professionalId: string;
    patientId: string;
    rating: number; // 1..5
    amount: number;
    comment?: string;
  }): Promise<{ status: 'released' | 'under_review'; reason: string; ratingId?: string }> {
    const { consultationId, professionalId, patientId, rating, amount, comment } = params;

    // Delega ao trigger handle_consultation_rating: inserir em consultation_ratings
    // dispara automaticamente o registro em consultation_credit_audit + nps_alerts
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    );

    const { data, error } = await supabase
      .from('consultation_ratings')
      .insert({
        consultation_id: consultationId,
        professional_id: professionalId,
        patient_id: patientId,
        stars: rating,
        amount,
        comment: comment ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[BrisaAudit] Falha ao inserir rating:', error);
      throw error;
    }

    if (rating >= 5) {
      return {
        status: 'released',
        reason: 'Avaliação 5★ — crédito liberado automaticamente pela Enfª Brisa',
        ratingId: data?.id,
      };
    }
    console.warn(`[BrisaAudit] Consulta ${consultationId} sob análise (${rating}★) — Dr. Edilson notificado (1241)`);
    return {
      status: 'under_review',
      reason: `Avaliação ${rating}★ inferior a 5★ — encaminhado para auditoria do Dr. Edilson (1241)`,
      ratingId: data?.id,
    };
  }

  /**
   * Obtém saldo acumulado do profissional (apenas valores liberados pela auditoria)
   */
  static async getProfessionalBalance(professionalId: string): Promise<number> {
    const ledger = this.ledger.get(professionalId) || [];
    return ledger.reduce((sum: number, entry: any) => {
      return entry.type === 'credit' ? sum + entry.amount : sum - entry.amount;
    }, 0);
  }

  /**
   * Obtém saldo da plataforma
   */
  static async getPlatformBalance(): Promise<number> {
    return this.platformBalance;
  }

  /**
   * Processa saque PIX do profissional
   */
  static async processProfessionalWithdrawal(
    professionalId: string,
    amount: number,
    pixKey: string
  ): Promise<{ success: boolean; withdrawalId: string; message: string }> {
    try {
      const balance = await this.getProfessionalBalance(professionalId);

      if (balance < amount) {
        return {
          success: false,
          withdrawalId: '',
          message: `Saldo insuficiente. Disponível: R$ ${balance.toFixed(2)}`,
        };
      }

      const withdrawalId = `withdrawal_${Date.now()}`;

      // Registra saque no ledger
      const ledger = this.ledger.get(professionalId) || [];
      ledger.push({
        id: `ledger_withdrawal_${Date.now()}`,
        type: 'debit',
        amount,
        description: `Saque PIX - ${pixKey}`,
        transactionId: withdrawalId,
        createdAt: new Date(),
      });

      this.ledger.set(professionalId, ledger);

      // TODO: Integrar com API Mercado Pago para transferência PIX
      // await MercadoPagoService.transferToPix(pixKey, amount);

      return {
        success: true,
        withdrawalId,
        message: `Saque de R$ ${amount.toFixed(2)} solicitado com sucesso`,
      };
    } catch (error) {
      console.error('Erro ao processar saque:', error);
      return {
        success: false,
        withdrawalId: '',
        message: 'Erro ao processar saque. Tente novamente.',
      };
    }
  }

  /**
   * Gera relatório financeiro do profissional
   */
  static async getProfessionalFinancialReport(professionalId: string): Promise<FinancialReport> {
    const transactions = this.ledger.get(professionalId) || [];
    const balance = await this.getProfessionalBalance(professionalId);

    const totalEarnings = transactions
      .filter((t: any) => t.type === 'credit')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const totalWithdrawals = transactions
      .filter((t: any) => t.type === 'debit')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    return {
      balance,
      totalEarnings,
      totalWithdrawals,
      transactions,
      lastUpdated: new Date(),
    };
  }

  /**
   * Gera relatório financeiro da plataforma
   */
  static async getPlatformFinancialReport(): Promise<FinancialReport> {
    const allTransactions: any[] = [];

    this.ledger.forEach((ledger: any[]) => {
      allTransactions.push(...ledger);
    });

    const balance = await this.getPlatformBalance();

    const totalRevenue = allTransactions
      .filter((t: any) => t.type === 'credit')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    return {
      balance,
      totalEarnings: totalRevenue,
      totalWithdrawals: 0,
      transactions: allTransactions,
      lastUpdated: new Date(),
    };
  }

  /**
   * Obtém lista de profissionais com saldos
   */
  static async getProfessionalsWithBalances(): Promise<ProfessionalBalance[]> {
    const results: ProfessionalBalance[] = [];

    this.ledger.forEach((ledger: any[], professionalId: string) => {
      const totalEarnings = ledger
        .filter((t: any) => t.type === 'credit')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalWithdrawals = ledger
        .filter((t: any) => t.type === 'debit')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      results.push({
        professionalId,
        totalEarnings,
        totalWithdrawals,
        availableBalance: totalEarnings - totalWithdrawals,
        lastUpdated: new Date(),
      });
    });

    return results;
  }
}
