export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  totalActivities: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // em dias
  progress: number; // 0-100
  completed: boolean;
  completedDate?: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedDate?: Date;
  progress?: number; // Para badges progressivas
}

export interface UserGamification {
  userId: string;
  level: number;
  totalPoints: number;
  streaks: UserStreak[];
  badges: Badge[];
  challenges: Challenge[];
  leaderboardPosition: number;
}

export class GamificationService {
  /**
   * Atualiza streak do usuário
   */
  static updateStreak(streak: UserStreak, isActive: boolean): UserStreak {
    const today = new Date();
    const lastActivity = new Date(streak.lastActivityDate);
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (isActive) {
      if (daysDiff === 1) {
        // Continuou o streak
        streak.currentStreak += 1;
        streak.totalActivities += 1;
      } else if (daysDiff === 0) {
        // Mesmo dia, não incrementa
        return streak;
      } else {
        // Streak quebrado, reinicia
        streak.currentStreak = 1;
        streak.totalActivities += 1;
      }

      streak.lastActivityDate = today;

      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    }

    return streak;
  }

  /**
   * Cria desafios automáticos
   */
  static generateChallenges(): Challenge[] {
    const challenges: Challenge[] = [
      {
        id: 'challenge_1',
        name: 'Primeira Consulta',
        description: 'Agende sua primeira consulta com um especialista',
        icon: '🏥',
        points: 100,
        difficulty: 'easy',
        duration: 7,
        progress: 0,
        completed: false,
      },
      {
        id: 'challenge_2',
        name: 'Investidor Iniciante',
        description: 'Faça seu primeiro investimento',
        icon: '💰',
        points: 150,
        difficulty: 'easy',
        duration: 14,
        progress: 0,
        completed: false,
      },
      {
        id: 'challenge_3',
        name: 'Referenciador',
        description: 'Indique 3 amigos para a plataforma',
        icon: '👥',
        points: 200,
        difficulty: 'medium',
        duration: 30,
        progress: 0,
        completed: false,
      },
      {
        id: 'challenge_4',
        name: 'Leitor Ávido',
        description: 'Leia 5 artigos da biblioteca científica',
        icon: '📚',
        points: 100,
        difficulty: 'easy',
        duration: 14,
        progress: 0,
        completed: false,
      },
      {
        id: 'challenge_5',
        name: 'Investidor Estratégico',
        description: 'Atinja R$ 10.000 em investimentos',
        icon: '📈',
        points: 300,
        difficulty: 'hard',
        duration: 90,
        progress: 0,
        completed: false,
      },
      {
        id: 'challenge_6',
        name: 'Comunidade Ativa',
        description: 'Participe de 10 discussões na comunidade',
        icon: '💬',
        points: 150,
        difficulty: 'medium',
        duration: 30,
        progress: 0,
        completed: false,
      },
      {
        id: 'challenge_7',
        name: 'Saúde em Primeiro Lugar',
        description: 'Sincronize dados de wearable por 7 dias',
        icon: '⌚',
        points: 120,
        difficulty: 'easy',
        duration: 7,
        progress: 0,
        completed: false,
      },
      {
        id: 'challenge_8',
        name: 'Mestre dos Investimentos',
        description: 'Atinja nível 10 de experiência',
        icon: '👑',
        points: 500,
        difficulty: 'hard',
        duration: 180,
        progress: 0,
        completed: false,
      },
    ];

    return challenges;
  }

  /**
   * Cria badges disponíveis
   */
  static generateBadges(): Badge[] {
    const badges: Badge[] = [
      {
        id: 'badge_1',
        name: 'Bem-vindo',
        description: 'Crie sua conta na Planta & Raiz',
        icon: '🎉',
        rarity: 'common',
      },
      {
        id: 'badge_2',
        name: 'Investidor',
        description: 'Faça seu primeiro investimento',
        icon: '💎',
        rarity: 'common',
      },
      {
        id: 'badge_3',
        name: 'Afiliado',
        description: 'Indique seu primeiro amigo',
        icon: '🤝',
        rarity: 'common',
      },
      {
        id: 'badge_4',
        name: 'Streaker',
        description: 'Mantenha um streak de 7 dias',
        icon: '🔥',
        rarity: 'rare',
      },
      {
        id: 'badge_5',
        name: 'Milionário',
        description: 'Atinja R$ 1.000.000 em investimentos',
        icon: '💰',
        rarity: 'legendary',
      },
      {
        id: 'badge_6',
        name: 'Influenciador',
        description: 'Indique 50 pessoas',
        icon: '⭐',
        rarity: 'epic',
      },
      {
        id: 'badge_7',
        name: 'Saúde em Dia',
        description: 'Sincronize wearable por 30 dias',
        icon: '💪',
        rarity: 'rare',
      },
      {
        id: 'badge_8',
        name: 'Especialista',
        description: 'Tenha 10 consultas com especialistas',
        icon: '🏆',
        rarity: 'epic',
      },
    ];

    return badges;
  }

  /**
   * Calcula nível baseado em pontos
   */
  static calculateLevel(totalPoints: number): number {
    return Math.floor(totalPoints / 1000) + 1;
  }

  /**
   * Calcula pontos para próximo nível
   */
  static getPointsToNextLevel(totalPoints: number): number {
    const currentLevel = this.calculateLevel(totalPoints);
    const pointsForCurrentLevel = (currentLevel - 1) * 1000;
    const pointsForNextLevel = currentLevel * 1000;
    return pointsForNextLevel - totalPoints;
  }

  /**
   * Desbloqueia badge
   */
  static unlockBadge(badge: Badge): Badge {
    return {
      ...badge,
      unlockedDate: new Date(),
    };
  }

  /**
   * Completa desafio
   */
  static completeChallenge(challenge: Challenge): Challenge {
    return {
      ...challenge,
      completed: true,
      completedDate: new Date(),
      progress: 100,
    };
  }

  /**
   * Gera progressão visual
   */
  static generateProgressionVisuals(gamification: UserGamification): {
    levelProgress: number;
    streakVisual: string;
    badgeGrid: Badge[];
    challengeProgress: number;
  } {
    const levelProgress = ((gamification.totalPoints % 1000) / 1000) * 100;
    const streakVisual = '🔥'.repeat(Math.min(gamification.streaks[0]?.currentStreak || 0, 10));
    const badgeGrid = gamification.badges.slice(0, 8);
    const challengeProgress = Math.round(
      (gamification.challenges.filter((c) => c.completed).length / gamification.challenges.length) * 100
    );

    return {
      levelProgress,
      streakVisual,
      badgeGrid,
      challengeProgress,
    };
  }

  /**
   * Gera notificação de gamificação
   */
  static generateGamificationNotification(
    type: 'level_up' | 'badge_unlocked' | 'challenge_completed' | 'streak',
    data: any
  ): string {
    switch (type) {
      case 'level_up':
        return `🎉 Parabéns! Você atingiu o nível ${data.level}!`;
      case 'badge_unlocked':
        return `🏆 Novo badge desbloqueado: ${data.badgeName}!`;
      case 'challenge_completed':
        return `✅ Desafio completo: ${data.challengeName}! +${data.points} pontos`;
      case 'streak':
        return `🔥 Streak ativo! Você tem ${data.streak} dias consecutivos!`;
      default:
        return 'Parabéns por sua atividade!';
    }
  }
}
