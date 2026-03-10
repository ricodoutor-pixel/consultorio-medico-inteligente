// ============================================================================
// CHURN PREDICTION SERVICE — Análise Preditiva com Machine Learning
// Planta & Raiz 3.0 — CEO Autônomo
// ============================================================================

import { notifyOwner } from '../_core/notification';

interface DoctorMetrics {
  doctorId: string;
  email: string;
  name: string;
  registrationDate: number;
  lastActivityDate: number;
  totalConsultations: number;
  totalRevenue: number;
  averageRating: number;
  responseTimeHours: number;
  cancellationRate: number;
  patientRetentionRate: number;
  loginFrequencyDays: number;
  profileCompleteness: number;
  specialtyMatches: number;
  referralCount: number;
  churnRiskScore: number;
  churnProbability: number;
}

interface ChurnPrediction {
  doctorId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendedActions: string[];
  incentiveAmount: number;
  urgency: number;
}

class ChurnPredictionService {
  private doctorMetrics: Map<string, DoctorMetrics> = new Map();
  private predictions: Map<string, ChurnPrediction> = new Map();

  /**
   * Inicializar serviço de predição de churn
   */
  public async initialize(): Promise<void> {
    console.log('[ChurnPrediction] Initializing...');

    // Analisar churn a cada 6 horas
    setInterval(() => this.analyzeChurn(), 21600000);

    // Enviar incentivos a cada 24 horas
    setInterval(() => this.sendIncentives(), 86400000);

    console.log('[ChurnPrediction] Initialized');
  }

  /**
   * Analisar churn de médicos
   */
  private async analyzeChurn(): Promise<void> {
    try {
      console.log('[ChurnPrediction] Analyzing doctor churn...');

      // Simular carregamento de dados de médicos
      const doctors = await this.loadDoctorMetrics();

      for (const doctor of doctors) {
        const prediction = this.predictChurn(doctor);
        this.predictions.set(doctor.doctorId, prediction);

        // Notificar se risco crítico
        if (prediction.riskLevel === 'critical') {
          await this.notifyCriticalChurn(prediction);
        }
      }

      console.log(`[ChurnPrediction] Analyzed ${doctors.length} doctors`);
    } catch (error) {
      console.error('[ChurnPrediction] Analysis failed:', error);
    }
  }

  /**
   * Prever churn de um médico
   */
  private predictChurn(doctor: DoctorMetrics): ChurnPrediction {
    const riskFactors: string[] = [];
    let churnScore = 0;

    // Fator 1: Inatividade (peso: 25%)
    const daysSinceLastActivity = (Date.now() - doctor.lastActivityDate) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity > 30) {
      churnScore += 25;
      riskFactors.push(`Inativo por ${Math.floor(daysSinceLastActivity)} dias`);
    } else if (daysSinceLastActivity > 14) {
      churnScore += 15;
    } else if (daysSinceLastActivity > 7) {
      churnScore += 5;
    }

    // Fator 2: Baixa receita (peso: 20%)
    const monthlyRevenue = doctor.totalRevenue / ((Date.now() - doctor.registrationDate) / (1000 * 60 * 60 * 24 * 30));
    if (monthlyRevenue < 500) {
      churnScore += 20;
      riskFactors.push(`Receita mensal baixa: R$ ${monthlyRevenue.toFixed(2)}`);
    } else if (monthlyRevenue < 1000) {
      churnScore += 10;
    }

    // Fator 3: Baixa avaliação (peso: 15%)
    if (doctor.averageRating < 3.5) {
      churnScore += 15;
      riskFactors.push(`Avaliação baixa: ${doctor.averageRating.toFixed(1)}/5`);
    } else if (doctor.averageRating < 4.0) {
      churnScore += 5;
    }

    // Fator 4: Alta taxa de cancelamento (peso: 15%)
    if (doctor.cancellationRate > 0.3) {
      churnScore += 15;
      riskFactors.push(`Taxa de cancelamento alta: ${(doctor.cancellationRate * 100).toFixed(1)}%`);
    } else if (doctor.cancellationRate > 0.15) {
      churnScore += 8;
    }

    // Fator 5: Perfil incompleto (peso: 10%)
    if (doctor.profileCompleteness < 0.7) {
      churnScore += 10;
      riskFactors.push(`Perfil incompleto: ${(doctor.profileCompleteness * 100).toFixed(0)}%`);
    } else if (doctor.profileCompleteness < 0.85) {
      churnScore += 5;
    }

    // Fator 6: Baixo engajamento (peso: 5%)
    if (doctor.loginFrequencyDays > 7) {
      churnScore += 5;
      riskFactors.push(`Frequência de login baixa: ${doctor.loginFrequencyDays} dias`);
    }

    // Normalizar score (0-100)
    const churnProbability = Math.min(churnScore / 100, 1);

    // Determinar nível de risco
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (churnProbability > 0.75) {
      riskLevel = 'critical';
    } else if (churnProbability > 0.5) {
      riskLevel = 'high';
    } else if (churnProbability > 0.25) {
      riskLevel = 'medium';
    }

    // Gerar ações recomendadas
    const recommendedActions = this.generateActions(riskFactors, doctor);

    // Calcular incentivo
    const incentiveAmount = this.calculateIncentive(churnProbability, doctor.totalRevenue);

    return {
      doctorId: doctor.doctorId,
      churnProbability,
      riskLevel,
      riskFactors,
      recommendedActions,
      incentiveAmount,
      urgency: churnProbability,
    };
  }

  /**
   * Gerar ações recomendadas
   */
  private generateActions(riskFactors: string[], doctor: DoctorMetrics): string[] {
    const actions: string[] = [];

    if (riskFactors.some((f) => f.includes('Inativo'))) {
      actions.push('Enviar email de re-engajamento com incentivo');
      actions.push('Oferecer bônus de R$ 50 para próximas consultas');
    }

    if (riskFactors.some((f) => f.includes('Receita'))) {
      actions.push('Aumentar visibilidade no marketplace');
      actions.push('Oferecer pacote de marketing gratuito');
    }

    if (riskFactors.some((f) => f.includes('Avaliação'))) {
      actions.push('Enviar feedback de pacientes');
      actions.push('Oferecer treinamento de atendimento');
    }

    if (riskFactors.some((f) => f.includes('cancelamento'))) {
      actions.push('Revisar política de cancelamento');
      actions.push('Oferecer suporte personalizado');
    }

    if (riskFactors.some((f) => f.includes('Perfil'))) {
      actions.push('Enviar notificação para completar perfil');
      actions.push('Oferecer bônus por completar perfil');
    }

    return actions;
  }

  /**
   * Calcular incentivo baseado em risco e receita
   */
  private calculateIncentive(churnProbability: number, totalRevenue: number): number {
    // Incentivo base: 5% da receita mensal
    const monthlyRevenue = totalRevenue / 12;
    const baseIncentive = monthlyRevenue * 0.05;

    // Multiplicador baseado em risco
    const riskMultiplier = 1 + churnProbability * 2; // 1x a 3x

    // Incentivo final (mínimo R$ 50, máximo R$ 500)
    return Math.min(Math.max(baseIncentive * riskMultiplier, 50), 500);
  }

  /**
   * Notificar sobre churn crítico
   */
  private async notifyCriticalChurn(prediction: ChurnPrediction): Promise<void> {
    await notifyOwner({
      title: '🚨 Médico em Risco Crítico de Churn',
      content: `Médico ${prediction.doctorId} tem ${(prediction.churnProbability * 100).toFixed(0)}% de probabilidade de sair. Risco: ${prediction.riskFactors.join(', ')}`,
    });
  }

  /**
   * Enviar incentivos para médicos em risco
   */
  private async sendIncentives(): Promise<void> {
    try {
      console.log('[ChurnPrediction] Sending incentives...');

      let totalIncentives = 0;
      let doctorsIncentivized = 0;

      for (const [, prediction] of this.predictions) {
        if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
          // Simular envio de incentivo
          await this.sendIncentiveToDoctor(prediction);
          totalIncentives += prediction.incentiveAmount;
          doctorsIncentivized++;
        }
      }

      console.log(
        `[ChurnPrediction] Sent incentives to ${doctorsIncentivized} doctors (Total: R$ ${totalIncentives.toFixed(2)})`
      );

      // Notificar owner
      if (doctorsIncentivized > 0) {
        await notifyOwner({
          title: '💰 Incentivos de Retenção Enviados',
          content: `${doctorsIncentivized} médicos receberam incentivos totalizando R$ ${totalIncentives.toFixed(2)}`,
        });
      }
    } catch (error) {
      console.error('[ChurnPrediction] Incentive sending failed:', error);
    }
  }

  /**
   * Enviar incentivo para um médico
   */
  private async sendIncentiveToDoctor(prediction: ChurnPrediction): Promise<void> {
    // Simular envio de incentivo
    console.log(
      `[ChurnPrediction] Sending R$ ${prediction.incentiveAmount.toFixed(2)} incentive to doctor ${prediction.doctorId}`
    );

    // Em produção, isso seria:
    // 1. Criar crédito na conta do médico
    // 2. Enviar email com detalhes
    // 3. Registrar transação no banco de dados
  }

  /**
   * Carregar métricas de médicos
   */
  private async loadDoctorMetrics(): Promise<DoctorMetrics[]> {
    // Simular carregamento de dados
    const doctors: DoctorMetrics[] = [
      {
        doctorId: 'doc_001',
        email: 'doctor1@example.com',
        name: 'Dr. Silva',
        registrationDate: Date.now() - 90 * 24 * 60 * 60 * 1000,
        lastActivityDate: Date.now() - 45 * 24 * 60 * 60 * 1000,
        totalConsultations: 50,
        totalRevenue: 5000,
        averageRating: 3.2,
        responseTimeHours: 24,
        cancellationRate: 0.35,
        patientRetentionRate: 0.6,
        loginFrequencyDays: 10,
        profileCompleteness: 0.65,
        specialtyMatches: 15,
        referralCount: 5,
        churnRiskScore: 0,
        churnProbability: 0,
      },
      {
        doctorId: 'doc_002',
        email: 'doctor2@example.com',
        name: 'Dra. Santos',
        registrationDate: Date.now() - 180 * 24 * 60 * 60 * 1000,
        lastActivityDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
        totalConsultations: 200,
        totalRevenue: 20000,
        averageRating: 4.8,
        responseTimeHours: 2,
        cancellationRate: 0.05,
        patientRetentionRate: 0.95,
        loginFrequencyDays: 1,
        profileCompleteness: 0.99,
        specialtyMatches: 45,
        referralCount: 120,
        churnRiskScore: 0,
        churnProbability: 0,
      },
    ];

    return doctors;
  }

  /**
   * Obter predições de churn
   */
  public getPredictions(): ChurnPrediction[] {
    return Array.from(this.predictions.values());
  }

  /**
   * Obter predição de um médico
   */
  public getPrediction(doctorId: string): ChurnPrediction | undefined {
    return this.predictions.get(doctorId);
  }

  /**
   * Obter estatísticas de churn
   */
  public getChurnStatistics(): {
    totalDoctors: number;
    criticalRisk: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    averageChurnProbability: number;
    totalIncentivesNeeded: number;
  } {
    const predictions = Array.from(this.predictions.values());
    const criticalRisk = predictions.filter((p) => p.riskLevel === 'critical').length;
    const highRisk = predictions.filter((p) => p.riskLevel === 'high').length;
    const mediumRisk = predictions.filter((p) => p.riskLevel === 'medium').length;
    const lowRisk = predictions.filter((p) => p.riskLevel === 'low').length;
    const averageChurnProbability =
      predictions.reduce((sum, p) => sum + p.churnProbability, 0) / predictions.length || 0;
    const totalIncentivesNeeded = predictions
      .filter((p) => p.riskLevel === 'high' || p.riskLevel === 'critical')
      .reduce((sum, p) => sum + p.incentiveAmount, 0);

    return {
      totalDoctors: predictions.length,
      criticalRisk,
      highRisk,
      mediumRisk,
      lowRisk,
      averageChurnProbability,
      totalIncentivesNeeded,
    };
  }
}

// Exportar instância singleton
export const churnPredictionService = new ChurnPredictionService();
