/**
 * Serviço de Programa de Incentivos por Dados de Saúde
 * Recompensa usuários com pontos de fidelidade por compartilharem dados de wearables
 */

export interface HealthDataReward {
  userId: string;
  wearableType: 'apple_healthkit' | 'fitbit' | 'oura' | 'manual';
  dataType: 'heart_rate' | 'sleep' | 'steps' | 'stress' | 'temperature' | 'oxygen' | 'recovery';
  pointsEarned: number;
  timestamp: Date;
  multiplier: number; // 1x, 1.5x, 2x baseado em streak
  streak: number; // dias consecutivos
  totalPointsToday: number;
}

export interface HealthChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  metric: 'steps' | 'sleep_hours' | 'stress_level' | 'heart_rate' | 'oxygen';
  pointsReward: number;
  duration: 'daily' | 'weekly' | 'monthly';
  difficulty: 'easy' | 'medium' | 'hard';
  active: boolean;
  progress?: number;
  completed?: boolean;
}

export interface HealthBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  pointsBonus: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
}

export class HealthDataIncentivesService {
  // Tabela de pontos por tipo de dado
  private static readonly POINTS_TABLE = {
    heart_rate: 10,
    sleep: 15,
    steps: 20,
    stress: 12,
    temperature: 8,
    oxygen: 15,
    recovery: 25,
  };

  // Badges disponíveis
  private static readonly BADGES: HealthBadge[] = [
    {
      id: 'first_sync',
      name: '🎯 Primeiro Sincronismo',
      description: 'Sincronizou dados de wearable pela primeira vez',
      icon: '🎯',
      requirement: 'Sincronizar 1 dado',
      pointsBonus: 50,
      rarity: 'common',
    },
    {
      id: 'weekly_warrior',
      name: '⚔️ Guerreiro Semanal',
      description: 'Compartilhou dados por 7 dias consecutivos',
      icon: '⚔️',
      requirement: 'Streak de 7 dias',
      pointsBonus: 100,
      rarity: 'rare',
    },
    {
      id: 'monthly_master',
      name: '👑 Mestre Mensal',
      description: 'Compartilhou dados por 30 dias consecutivos',
      icon: '👑',
      requirement: 'Streak de 30 dias',
      pointsBonus: 300,
      rarity: 'epic',
    },
    {
      id: 'health_legend',
      name: '🏆 Lenda de Saúde',
      description: 'Ganhou 10.000 pontos com dados de saúde',
      icon: '🏆',
      requirement: '10.000 pontos totais',
      pointsBonus: 500,
      rarity: 'legendary',
    },
    {
      id: 'sleep_champion',
      name: '😴 Campeão do Sono',
      description: 'Compartilhou dados de sono 50 vezes',
      icon: '😴',
      requirement: '50 sincronizações de sono',
      pointsBonus: 150,
      rarity: 'rare',
    },
    {
      id: 'activity_master',
      name: '🏃 Mestre da Atividade',
      description: 'Compartilhou dados de passos 50 vezes',
      icon: '🏃',
      requirement: '50 sincronizações de passos',
      pointsBonus: 150,
      rarity: 'rare',
    },
    {
      id: 'stress_warrior',
      name: '🧘 Guerreiro do Estresse',
      description: 'Manteve nível de estresse baixo por 14 dias',
      icon: '🧘',
      requirement: 'Estresse < 40 por 14 dias',
      pointsBonus: 200,
      rarity: 'epic',
    },
    {
      id: 'all_data_collector',
      name: '📊 Coletor de Dados',
      description: 'Sincronizou todos os 7 tipos de dados',
      icon: '📊',
      requirement: 'Sincronizar todos os tipos',
      pointsBonus: 250,
      rarity: 'epic',
    },
  ];

  // Desafios disponíveis
  private static readonly CHALLENGES: HealthChallenge[] = [
    {
      id: 'daily_steps',
      title: '🚶 10.000 Passos Diários',
      description: 'Caminhe 10.000 passos hoje',
      target: 10000,
      metric: 'steps',
      pointsReward: 50,
      duration: 'daily',
      difficulty: 'easy',
      active: true,
    },
    {
      id: 'sleep_quality',
      title: '😴 Noite de Sono Perfeita',
      description: 'Durma 8 horas com qualidade > 80%',
      target: 8,
      metric: 'sleep_hours',
      pointsReward: 75,
      duration: 'daily',
      difficulty: 'medium',
      active: true,
    },
    {
      id: 'stress_management',
      title: '🧘 Controle de Estresse',
      description: 'Mantenha estresse abaixo de 40 por 7 dias',
      target: 40,
      metric: 'stress_level',
      pointsReward: 100,
      duration: 'weekly',
      difficulty: 'hard',
      active: true,
    },
    {
      id: 'heart_health',
      title: '❤️ Coração Saudável',
      description: 'Mantenha frequência cardíaca entre 60-80 bpm',
      target: 70,
      metric: 'heart_rate',
      pointsReward: 60,
      duration: 'daily',
      difficulty: 'medium',
      active: true,
    },
    {
      id: 'oxygen_master',
      title: '💨 Oxigênio Ótimo',
      description: 'Mantenha oxigênio no sangue > 97%',
      target: 97,
      metric: 'oxygen',
      pointsReward: 80,
      duration: 'daily',
      difficulty: 'hard',
      active: true,
    },
    {
      id: 'monthly_sync',
      title: '📱 Sincronização Mensal',
      description: 'Sincronize dados todos os dias do mês',
      target: 30,
      metric: 'steps', // dummy
      pointsReward: 500,
      duration: 'monthly',
      difficulty: 'hard',
      active: true,
    },
  ];

  /**
   * Calcular pontos por sincronização de dados
   */
  static calculatePointsForSync(
    dataType: 'heart_rate' | 'sleep' | 'steps' | 'stress' | 'temperature' | 'oxygen' | 'recovery',
    streak: number = 1,
    isFirstSync: boolean = false
  ): number {
    const basePoints = this.POINTS_TABLE[dataType];
    
    // Multiplicador por streak
    let multiplier = 1;
    if (streak >= 30) multiplier = 2.5; // 30+ dias = 2.5x
    else if (streak >= 14) multiplier = 2; // 14+ dias = 2x
    else if (streak >= 7) multiplier = 1.5; // 7+ dias = 1.5x
    
    // Bônus primeira sincronização
    const firstSyncBonus = isFirstSync ? 25 : 0;
    
    return Math.round(basePoints * multiplier) + firstSyncBonus;
  }

  /**
   * Registrar sincronização de dados de saúde
   */
  static recordHealthDataSync(
    userId: string,
    wearableType: 'apple_healthkit' | 'fitbit' | 'oura' | 'manual',
    dataType: 'heart_rate' | 'sleep' | 'steps' | 'stress' | 'temperature' | 'oxygen' | 'recovery',
    streak: number = 1,
    isFirstSync: boolean = false
  ): HealthDataReward {
    const pointsEarned = this.calculatePointsForSync(dataType, streak, isFirstSync);
    const multiplier = streak >= 30 ? 2.5 : streak >= 14 ? 2 : streak >= 7 ? 1.5 : 1;

    return {
      userId,
      wearableType,
      dataType,
      pointsEarned,
      timestamp: new Date(),
      multiplier,
      streak,
      totalPointsToday: pointsEarned,
    };
  }

  /**
   * Obter badges disponíveis
   */
  static getAvailableBadges(): HealthBadge[] {
    return this.BADGES;
  }

  /**
   * Verificar se usuário conquistou badge
   */
  static checkBadgeAchievement(
    userId: string,
    badgeId: string,
    userStats: {
      totalSyncs: number;
      streak: number;
      totalPoints: number;
      dataTypesSynced: string[];
      sleepSyncs: number;
      stepsSyncs: number;
      stressAverage: number;
      earnedBadges: string[];
    }
  ): boolean {
    const badge = this.BADGES.find(b => b.id === badgeId);
    if (!badge || userStats.earnedBadges.includes(badgeId)) return false;

    switch (badgeId) {
      case 'first_sync':
        return userStats.totalSyncs >= 1;
      case 'weekly_warrior':
        return userStats.streak >= 7;
      case 'monthly_master':
        return userStats.streak >= 30;
      case 'health_legend':
        return userStats.totalPoints >= 10000;
      case 'sleep_champion':
        return userStats.sleepSyncs >= 50;
      case 'activity_master':
        return userStats.stepsSyncs >= 50;
      case 'stress_warrior':
        return userStats.stressAverage < 40 && userStats.streak >= 14;
      case 'all_data_collector':
        return userStats.dataTypesSynced.length >= 7;
      default:
        return false;
    }
  }

  /**
   * Obter desafios disponíveis
   */
  static getAvailableChallenges(): HealthChallenge[] {
    return this.CHALLENGES.filter(c => c.active);
  }

  /**
   * Verificar se desafio foi completado
   */
  static checkChallengeCompletion(
    challengeId: string,
    currentValue: number,
    target: number
  ): boolean {
    return currentValue >= target;
  }

  /**
   * Gerar recomendação de próximo desafio
   */
  static getNextChallenge(userStats: {
    completedChallenges: string[];
    dataTypesSynced: string[];
  }): HealthChallenge | null {
    const availableChallenges = this.CHALLENGES.filter(
      c => !userStats.completedChallenges.includes(c.id)
    );

    if (availableChallenges.length === 0) return null;

    // Priorizar desafios por dificuldade
    const easyChallenge = availableChallenges.find(c => c.difficulty === 'easy');
    if (easyChallenge) return easyChallenge;

    const mediumChallenge = availableChallenges.find(c => c.difficulty === 'medium');
    if (mediumChallenge) return mediumChallenge;

    return availableChallenges[0];
  }

  /**
   * Calcular bônus por tipo de wearable
   */
  static getWearableBonus(wearableType: 'apple_healthkit' | 'fitbit' | 'oura' | 'manual'): number {
    switch (wearableType) {
      case 'apple_healthkit':
        return 1.1; // +10%
      case 'fitbit':
        return 1.15; // +15%
      case 'oura':
        return 1.2; // +20% (mais dados)
      case 'manual':
        return 1.0; // Sem bônus
      default:
        return 1.0;
    }
  }

  /**
   * Gerar notificação de pontos ganhos
   */
  static generatePointsNotification(reward: HealthDataReward): string {
    const emoji = {
      heart_rate: '❤️',
      sleep: '😴',
      steps: '🚶',
      stress: '🧘',
      temperature: '🌡️',
      oxygen: '💨',
      recovery: '⚡',
    };

    return `${emoji[reward.dataType]} Ganhou ${reward.pointsEarned} pontos por compartilhar dados de ${reward.dataType}! Streak: ${reward.streak} dias 🔥`;
  }

  /**
   * Calcular progresso para próximo tier
   */
  static calculateProgressToNextTier(totalPoints: number): {
    currentTier: string;
    nextTier: string;
    pointsNeeded: number;
    progress: number;
  } {
    const tiers = [
      { name: 'Bronze', points: 0 },
      { name: 'Silver', points: 500 },
      { name: 'Gold', points: 2000 },
      { name: 'Platinum', points: 5000 },
      { name: 'Diamond', points: 10000 },
    ];

    let currentTier = tiers[0];
    let nextTier = tiers[1];

    for (let i = 0; i < tiers.length; i++) {
      if (totalPoints >= tiers[i].points) {
        currentTier = tiers[i];
        nextTier = tiers[i + 1] || tiers[i];
      }
    }

    const pointsInCurrentTier = totalPoints - currentTier.points;
    const pointsNeededForNext = nextTier.points - currentTier.points;
    const progress = (pointsInCurrentTier / pointsNeededForNext) * 100;

    return {
      currentTier: currentTier.name,
      nextTier: nextTier.name,
      pointsNeeded: Math.max(0, nextTier.points - totalPoints),
      progress: Math.min(100, progress),
    };
  }

  /**
   * Obter estatísticas de incentivos do usuário
   */
  static getUserIncentiveStats(userId: string): {
    totalPointsEarned: number;
    currentStreak: number;
    badgesEarned: number;
    challengesCompleted: number;
    lastSyncDate: Date;
    nextReward: string;
  } {
    // Simular dados (em produção, buscar do banco de dados)
    return {
      totalPointsEarned: 2450,
      currentStreak: 12,
      badgesEarned: 3,
      challengesCompleted: 8,
      lastSyncDate: new Date(),
      nextReward: 'Ganhe 50 pontos sincronizando dados de sono hoje!',
    };
  }

  /**
   * Exportar relatório de incentivos
   */
  static generateIncentiveReport(userId: string): string {
    const stats = this.getUserIncentiveStats(userId);
    const tierInfo = this.calculateProgressToNextTier(stats.totalPointsEarned);

    return `
📊 RELATÓRIO DE INCENTIVOS
========================
Usuário: ${userId}
Data: ${new Date().toLocaleDateString('pt-BR')}

💰 PONTOS
--------
Total Ganho: ${stats.totalPointsEarned} pontos
Tier Atual: ${tierInfo.currentTier}
Próximo Tier: ${tierInfo.nextTier}
Pontos para Próximo: ${tierInfo.pointsNeeded}
Progresso: ${tierInfo.progress.toFixed(1)}%

🔥 STREAK
--------
Dias Consecutivos: ${stats.currentStreak}
Última Sincronização: ${stats.lastSyncDate.toLocaleDateString('pt-BR')}

🏆 BADGES
--------
Conquistadas: ${stats.badgesEarned}
Desafios Completos: ${stats.challengesCompleted}

💡 PRÓXIMA RECOMPENSA
--------------------
${stats.nextReward}
    `;
  }
}
