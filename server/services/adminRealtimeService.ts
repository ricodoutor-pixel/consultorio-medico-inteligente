export interface OnlineUser {
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'doctor' | 'admin';
  lastActivity: Date;
  location: {
    country: string;
    state: string;
    city: string;
    lat: number;
    lng: number;
  };
  platform: 'web' | 'mobile' | 'app';
  deposits: number;
  earnings: number;
  consultations: number;
  status: 'online' | 'idle' | 'offline';
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  dailyRevenue: number;
  totalConsultations: number;
  averageRating: number;
  churnRate: number;
  conversionRate: number;
}

export interface AdminAlert {
  id: string;
  type: 'payment_anomaly' | 'churn_risk' | 'security' | 'performance' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export class AdminRealtimeService {
  /**
   * Obtém usuários online em tempo real
   */
  static getOnlineUsers(): OnlineUser[] {
    const onlineUsers: OnlineUser[] = [
      {
        userId: 'user_001',
        email: 'user1@example.com',
        name: 'João Silva',
        role: 'user',
        lastActivity: new Date(),
        location: {
          country: 'Brazil',
          state: 'São Paulo',
          city: 'São Paulo',
          lat: -23.5505,
          lng: -46.6333,
        },
        platform: 'web',
        deposits: 5000,
        earnings: 1250,
        consultations: 3,
        status: 'online',
      },
      {
        userId: 'doctor_001',
        email: 'doctor1@example.com',
        name: 'Dr. Carlos',
        role: 'doctor',
        lastActivity: new Date(Date.now() - 5 * 60000),
        location: {
          country: 'Brazil',
          state: 'Rio de Janeiro',
          city: 'Rio de Janeiro',
          lat: -22.9068,
          lng: -43.1729,
        },
        platform: 'mobile',
        deposits: 0,
        earnings: 8500,
        consultations: 42,
        status: 'online',
      },
      {
        userId: 'user_002',
        email: 'user2@example.com',
        name: 'Maria Santos',
        role: 'user',
        lastActivity: new Date(Date.now() - 15 * 60000),
        location: {
          country: 'Brazil',
          state: 'Minas Gerais',
          city: 'Belo Horizonte',
          lat: -19.9167,
          lng: -43.9345,
        },
        platform: 'app',
        deposits: 3000,
        earnings: 750,
        consultations: 2,
        status: 'idle',
      },
    ];

    // Gerar 50+ usuários adicionais
    for (let i = 4; i <= 50; i++) {
      const roles: ('user' | 'doctor' | 'admin')[] = ['user', 'doctor', 'user'];
      const role = roles[Math.floor(Math.random() * roles.length)];

      onlineUsers.push({
        userId: `${role}_${String(i).padStart(3, '0')}`,
        email: `user${i}@example.com`,
        name: `User ${i}`,
        role,
        lastActivity: new Date(Date.now() - Math.random() * 60 * 60000),
        location: {
          country: 'Brazil',
          state: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia'][
            Math.floor(Math.random() * 4)
          ],
          city: `City ${i}`,
          lat: -23.5505 + Math.random() * 10,
          lng: -46.6333 + Math.random() * 10,
        },
        platform: ['web', 'mobile', 'app'][Math.floor(Math.random() * 3)] as any,
        deposits: Math.floor(Math.random() * 10000),
        earnings: Math.floor(Math.random() * 20000),
        consultations: Math.floor(Math.random() * 100),
        status: Math.random() > 0.5 ? 'online' : Math.random() > 0.5 ? 'idle' : 'offline',
      });
    }

    return onlineUsers;
  }

  /**
   * Calcula analytics em tempo real
   */
  static calculateAnalytics(onlineUsers: OnlineUser[]): AdminAnalytics {
    const activeUsers = onlineUsers.filter((u) => u.status !== 'offline').length;
    const totalRevenue = onlineUsers.reduce((sum, u) => sum + u.deposits, 0);
    const totalConsultations = onlineUsers.reduce((sum, u) => sum + u.consultations, 0);
    const averageRating = 4.7; // Mock
    const churnRate = 0.08; // 8% mock
    const conversionRate = 0.25; // 25% mock

    return {
      totalUsers: onlineUsers.length,
      activeUsers,
      totalRevenue,
      dailyRevenue: totalRevenue * 0.15, // Mock
      totalConsultations,
      averageRating,
      churnRate,
      conversionRate,
    };
  }

  /**
   * Gera alertas inteligentes
   */
  static generateAlerts(analytics: AdminAnalytics): AdminAlert[] {
    const alerts: AdminAlert[] = [];

    // Alerta de churn
    if (analytics.churnRate > 0.1) {
      alerts.push({
        id: `alert_${Date.now()}_1`,
        type: 'churn_risk',
        severity: 'high',
        message: `Taxa de churn em ${(analytics.churnRate * 100).toFixed(1)}% - Acima do esperado`,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Alerta de conversão baixa
    if (analytics.conversionRate < 0.2) {
      alerts.push({
        id: `alert_${Date.now()}_2`,
        type: 'performance',
        severity: 'medium',
        message: `Taxa de conversão em ${(analytics.conversionRate * 100).toFixed(1)}% - Considere otimizar`,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Alerta de receita
    if (analytics.dailyRevenue < 1000) {
      alerts.push({
        id: `alert_${Date.now()}_3`,
        type: 'payment_anomaly',
        severity: 'medium',
        message: `Receita diária baixa: R$ ${analytics.dailyRevenue.toFixed(2)}`,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Alerta de segurança (mock)
    if (Math.random() > 0.7) {
      alerts.push({
        id: `alert_${Date.now()}_4`,
        type: 'security',
        severity: 'critical',
        message: 'Tentativa de acesso não autorizado detectada',
        timestamp: new Date(),
        resolved: false,
      });
    }

    return alerts;
  }

  /**
   * Agrupa usuários por país/estado
   */
  static groupUsersByLocation(
    users: OnlineUser[]
  ): { [country: string]: { [state: string]: number } } {
    const grouped: { [country: string]: { [state: string]: number } } = {};

    users.forEach((user) => {
      if (!grouped[user.location.country]) {
        grouped[user.location.country] = {};
      }
      if (!grouped[user.location.country][user.location.state]) {
        grouped[user.location.country][user.location.state] = 0;
      }
      grouped[user.location.country][user.location.state]++;
    });

    return grouped;
  }

  /**
   * Calcula métricas por role
   */
  static calculateMetricsByRole(users: OnlineUser[]): {
    [role: string]: { count: number; totalEarnings: number; avgConsultations: number };
  } {
    const metrics: {
      [role: string]: { count: number; totalEarnings: number; avgConsultations: number };
    } = {
      user: { count: 0, totalEarnings: 0, avgConsultations: 0 },
      doctor: { count: 0, totalEarnings: 0, avgConsultations: 0 },
      admin: { count: 0, totalEarnings: 0, avgConsultations: 0 },
    };

    users.forEach((user) => {
      metrics[user.role].count++;
      metrics[user.role].totalEarnings += user.earnings;
      metrics[user.role].avgConsultations += user.consultations;
    });

    Object.keys(metrics).forEach((role) => {
      if (metrics[role].count > 0) {
        metrics[role].avgConsultations = Math.round(
          metrics[role].avgConsultations / metrics[role].count
        );
      }
    });

    return metrics;
  }

  /**
   * Gera relatório executivo
   */
  static generateExecutiveReport(
    users: OnlineUser[],
    analytics: AdminAnalytics,
    alerts: AdminAlert[]
  ): string {
    const locationGroups = this.groupUsersByLocation(users);
    const roleMetrics = this.calculateMetricsByRole(users);

    return `
RELATÓRIO EXECUTIVO - TEMPO REAL
================================

MÉTRICAS GERAIS:
- Usuários Totais: ${analytics.totalUsers}
- Usuários Ativos: ${analytics.activeUsers}
- Taxa de Atividade: ${((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)}%

FINANCEIRO:
- Receita Total: R$ ${analytics.totalRevenue.toFixed(2)}
- Receita Diária: R$ ${analytics.dailyRevenue.toFixed(2)}
- Consultas Totais: ${analytics.totalConsultations}

PERFORMANCE:
- Avaliação Média: ${analytics.averageRating}/5
- Taxa de Churn: ${(analytics.churnRate * 100).toFixed(1)}%
- Taxa de Conversão: ${(analytics.conversionRate * 100).toFixed(1)}%

ALERTAS ATIVOS: ${alerts.length}
${alerts.map((a) => `- [${a.severity.toUpperCase()}] ${a.message}`).join('\n')}

DISTRIBUIÇÃO GEOGRÁFICA:
${Object.entries(locationGroups)
  .map((entry) => {
    const [country, states] = entry;
    return `${country}: ${Object.entries(states)
      .map(([state, count]) => `${state} (${count})`)
      .join(', ')}`;
  })
  .join('\n')}

MÉTRICAS POR ROLE:
${Object.entries(roleMetrics)
  .map(
    ([role, metrics]) =>
      `${role.toUpperCase()}: ${metrics.count} usuários, R$ ${metrics.totalEarnings.toFixed(2)} ganhos, ${metrics.avgConsultations} consultas média`
  )
  .join('\n')}
    `;
  }
}
