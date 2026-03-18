export interface UserPoints {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextLevelPoints: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'referral';
  points: number;
  description: string;
  relatedId?: string; // consultaId, compraId, etc
  timestamp: Date;
  expiresAt?: Date;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  discountPercentage: number;
  discountAmount?: number;
  maxUses?: number;
  usesRemaining: number;
  category: 'discount' | 'free-consultation' | 'product' | 'exclusive';
  validUntil: Date;
  active: boolean;
}

export interface RedemptionRecord {
  id: string;
  userId: string;
  rewardId: string;
  pointsSpent: number;
  discountApplied: number;
  usedAt: Date;
  expiresAt: Date;
  active: boolean;
}

export interface LoyaltyStats {
  totalUsers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averagePointsPerUser: number;
  redemptionRate: number;
  levelDistribution: { [level: string]: number };
  topRewards: { rewardId: string; rewardName: string; timesRedeemed: number }[];
}

export class LoyaltyProgramService {
  /**
   * Inicializa programa de fidelização para novo usuário
   */
  static initializeUserPoints(userId: string): UserPoints {
    return {
      userId,
      totalPoints: 0,
      availablePoints: 0,
      usedPoints: 0,
      level: 'bronze',
      nextLevelPoints: 500,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };
  }

  /**
   * Adiciona pontos por consulta
   */
  static addConsultationPoints(
    userId: string,
    consultationValue: number,
    consultationId: string
  ): PointTransaction {
    // 1 ponto por R$ 1 gasto em consulta
    const points = Math.floor(consultationValue);

    return {
      id: `trans_${Date.now()}`,
      userId,
      type: 'earned',
      points,
      description: `Pontos ganhos em consulta (R$ ${consultationValue.toFixed(2)})`,
      relatedId: consultationId,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Expira em 1 ano
    };
  }

  /**
   * Adiciona pontos por compra no marketplace
   */
  static addPurchasePoints(
    userId: string,
    purchaseValue: number,
    purchaseId: string
  ): PointTransaction {
    // 1.5 pontos por R$ 1 gasto em compra
    const points = Math.floor(purchaseValue * 1.5);

    return {
      id: `trans_${Date.now()}`,
      userId,
      type: 'earned',
      points,
      description: `Pontos ganhos em compra (R$ ${purchaseValue.toFixed(2)})`,
      relatedId: purchaseId,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Adiciona pontos por referência
   */
  static addReferralPoints(userId: string, referredUserId: string): PointTransaction {
    // 100 pontos por referência bem-sucedida
    const points = 100;

    return {
      id: `trans_${Date.now()}`,
      userId,
      type: 'referral',
      points,
      description: `Bônus de referência - Novo usuário: ${referredUserId}`,
      relatedId: referredUserId,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Adiciona bônus de pontos especiais
   */
  static addBonusPoints(userId: string, points: number, reason: string): PointTransaction {
    return {
      id: `trans_${Date.now()}`,
      userId,
      type: 'bonus',
      points,
      description: `Bônus especial: ${reason}`,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Resgata pontos por desconto
   */
  static redeemPointsForDiscount(
    userPoints: UserPoints,
    reward: LoyaltyReward
  ): { success: boolean; message: string; redemption?: RedemptionRecord } {
    if (userPoints.availablePoints < reward.pointsCost) {
      return {
        success: false,
        message: `Pontos insuficientes. Você tem ${userPoints.availablePoints} pontos, mas precisa de ${reward.pointsCost}.`,
      };
    }

    if (reward.usesRemaining <= 0) {
      return {
        success: false,
        message: 'Esta recompensa não está mais disponível.',
      };
    }

    const redemption: RedemptionRecord = {
      id: `redeem_${Date.now()}`,
      userId: userPoints.userId,
      rewardId: reward.id,
      pointsSpent: reward.pointsCost,
      discountApplied: reward.discountAmount || Math.floor((reward.discountPercentage / 100) * 1000),
      usedAt: new Date(),
      expiresAt: reward.validUntil,
      active: true,
    };

    return {
      success: true,
      message: `Desconto de ${reward.discountPercentage}% resgatado com sucesso!`,
      redemption,
    };
  }

  /**
   * Atualiza nível do usuário baseado em pontos totais
   */
  static updateUserLevel(userPoints: UserPoints): UserPoints {
    let level: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    let nextLevelPoints = 500;

    if (userPoints.totalPoints >= 2000) {
      level = 'platinum';
      nextLevelPoints = 5000;
    } else if (userPoints.totalPoints >= 1000) {
      level = 'gold';
      nextLevelPoints = 2000;
    } else if (userPoints.totalPoints >= 500) {
      level = 'silver';
      nextLevelPoints = 1000;
    }

    return {
      ...userPoints,
      level,
      nextLevelPoints,
      lastUpdated: new Date(),
    };
  }

  /**
   * Gera recompensas padrão do programa
   */
  static generateDefaultRewards(): LoyaltyReward[] {
    return [
      {
        id: 'reward_001',
        name: 'Desconto 10%',
        description: 'Desconto de 10% na próxima consulta',
        pointsCost: 100,
        discountPercentage: 10,
        discountAmount: 0,
        maxUses: 100,
        usesRemaining: 100,
        category: 'discount',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        active: true,
      },
      {
        id: 'reward_002',
        name: 'Desconto 20%',
        description: 'Desconto de 20% na próxima compra no marketplace',
        pointsCost: 250,
        discountPercentage: 20,
        discountAmount: 0,
        maxUses: 50,
        usesRemaining: 50,
        category: 'discount',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        active: true,
      },
      {
        id: 'reward_003',
        name: 'Consulta Grátis',
        description: 'Uma consulta grátis com especialista',
        pointsCost: 500,
        discountPercentage: 100,
        discountAmount: 150,
        maxUses: 25,
        usesRemaining: 25,
        category: 'free-consultation',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        active: true,
      },
      {
        id: 'reward_004',
        name: 'Desconto 30%',
        description: 'Desconto de 30% em qualquer produto',
        pointsCost: 750,
        discountPercentage: 30,
        discountAmount: 0,
        maxUses: 30,
        usesRemaining: 30,
        category: 'discount',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        active: true,
      },
      {
        id: 'reward_005',
        name: 'Acesso VIP',
        description: 'Acesso VIP por 1 mês com prioridade em agendamentos',
        pointsCost: 1000,
        discountPercentage: 0,
        discountAmount: 0,
        maxUses: 20,
        usesRemaining: 20,
        category: 'exclusive',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        active: true,
      },
    ];
  }

  /**
   * Calcula estatísticas do programa de fidelização
   */
  static calculateLoyaltyStats(
    allUserPoints: UserPoints[],
    allTransactions: PointTransaction[],
    allRedemptions: RedemptionRecord[]
  ): LoyaltyStats {
    const totalPointsIssued = allTransactions
      .filter((t) => t.type === 'earned' || t.type === 'bonus' || t.type === 'referral')
      .reduce((sum, t) => sum + t.points, 0);

    const totalPointsRedeemed = allRedemptions.reduce((sum, r) => sum + r.pointsSpent, 0);

    const levelDistribution: { [level: string]: number } = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
    };

    allUserPoints.forEach((up) => {
      levelDistribution[up.level]++;
    });

    return {
      totalUsers: allUserPoints.length,
      totalPointsIssued,
      totalPointsRedeemed,
      averagePointsPerUser: Math.round(totalPointsIssued / Math.max(allUserPoints.length, 1)),
      redemptionRate:
        totalPointsIssued > 0
          ? Math.round((totalPointsRedeemed / totalPointsIssued) * 100) / 100
          : 0,
      levelDistribution,
      topRewards: [],
    };
  }

  /**
   * Gera histórico de pontos do usuário
   */
  static getUserPointsHistory(
    userId: string,
    transactions: PointTransaction[],
    limit: number = 20
  ): PointTransaction[] {
    return transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Verifica e expira pontos antigos
   */
  static expireOldPoints(transactions: PointTransaction[]): PointTransaction[] {
    const now = new Date();
    return transactions.map((t) => {
      if (t.expiresAt && t.expiresAt < now && t.type === 'earned') {
        return {
          ...t,
          type: 'expired',
          description: `${t.description} (EXPIRADO)`,
        };
      }
      return t;
    });
  }

  /**
   * Calcula pontos disponíveis (não expirados)
   */
  static calculateAvailablePoints(transactions: PointTransaction[]): number {
    const now = new Date();
    return transactions
      .filter(
        (t) =>
          (t.type === 'earned' || t.type === 'bonus' || t.type === 'referral') &&
          (!t.expiresAt || t.expiresAt > now)
      )
      .reduce((sum, t) => sum + t.points, 0);
  }

  /**
   * Gera recomendação de recompensa para usuário
   */
  static getRecommendedReward(
    userPoints: UserPoints,
    availableRewards: LoyaltyReward[]
  ): LoyaltyReward | null {
    // Filtrar recompensas que o usuário pode comprar
    const affordableRewards = availableRewards.filter(
      (r) => r.pointsCost <= userPoints.availablePoints && r.active && r.usesRemaining > 0
    );

    if (affordableRewards.length === 0) return null;

    // Recomendar a recompensa com melhor valor (maior desconto por ponto)
    return affordableRewards.reduce((best, current) => {
      const bestValue = best.discountPercentage / best.pointsCost;
      const currentValue = current.discountPercentage / current.pointsCost;
      return currentValue > bestValue ? current : best;
    });
  }

  /**
   * Simula impacto de programa de fidelização
   */
  static simulateLoyaltyImpact(
    currentLTV: number,
    estimatedUsersInProgram: number,
    conversionRateIncrease: number = 0.25 // 25%
  ): {
    currentTotalLTV: number;
    projectedTotalLTV: number;
    ltvIncrease: number;
    additionalRevenue: number;
  } {
    const currentTotalLTV = currentLTV * estimatedUsersInProgram;
    const projectedLTV = currentLTV * (1 + conversionRateIncrease);
    const projectedTotalLTV = projectedLTV * estimatedUsersInProgram;
    const ltvIncrease = projectedLTV - currentLTV;
    const additionalRevenue = ltvIncrease * estimatedUsersInProgram;

    return {
      currentTotalLTV,
      projectedTotalLTV,
      ltvIncrease,
      additionalRevenue,
    };
  }
}
