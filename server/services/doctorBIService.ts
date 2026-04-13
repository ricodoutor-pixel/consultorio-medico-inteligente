/**
 * Estratégia 9: BI para Médicos (SaaS)
 * Dashboard de inteligência de negócios para médicos
 */

export interface DoctorBIMetrics {
  // Revenue
  monthlyRevenue: number;
  revenueGrowth: number;
  avgConsultationValue: number;
  consultationsThisMonth: number;
  bonusAccumulated: number;
  plantaCoinBalance: number;

  // Growth
  newPatients: number;
  retentionRate: number;
  totalPatients: number;

  // Quality
  npsScore: number;
  responseRate: number;
  avgResponseTime: number;

  // Ranking
  rank: number;
  totalDoctors: number;
  percentile: number;

  // Opportunities
  opportunities: Opportunity[];

  // Trends
  revenueHistory: { month: string; value: number }[];
  consultationHistory: { month: string; count: number }[];
}

export interface Opportunity {
  icon: string;
  title: string;
  description: string;
  potentialRevenue?: number;
  action: string;
}

export function generateOpportunities(metrics: Partial<DoctorBIMetrics>): Opportunity[] {
  const opportunities: Opportunity[] = [];

  if ((metrics.retentionRate ?? 100) < 85) {
    opportunities.push({
      icon: '⚠️',
      title: 'Pacientes em risco',
      description: `${Math.round((100 - (metrics.retentionRate ?? 100)) / 100 * (metrics.totalPatients ?? 0))} pacientes podem abandonar o tratamento`,
      potentialRevenue: Math.round((100 - (metrics.retentionRate ?? 100)) / 100 * (metrics.totalPatients ?? 0) * 150),
      action: 'Ativar campanha de retenção',
    });
  }

  if ((metrics.consultationsThisMonth ?? 0) < 50) {
    opportunities.push({
      icon: '📈',
      title: 'Aumente suas consultas',
      description: 'Compartilhe sua página personalizada para atrair mais pacientes',
      potentialRevenue: (50 - (metrics.consultationsThisMonth ?? 0)) * (metrics.avgConsultationValue ?? 150),
      action: 'Compartilhar página',
    });
  }

  if ((metrics.npsScore ?? 0) >= 8.5 && (metrics.consultationsThisMonth ?? 0) >= 100) {
    opportunities.push({
      icon: '🏆',
      title: 'Elegível para Selo de Qualidade',
      description: 'Você atende os critérios para o Selo Planta y Raiz',
      action: 'Solicitar selo',
    });
  }

  if ((metrics.avgConsultationValue ?? 0) < 200) {
    opportunities.push({
      icon: '💎',
      title: 'Upgrade de plano',
      description: 'Com o plano Premium, aumente sua tarifa e ganhe mais por consulta',
      potentialRevenue: (metrics.consultationsThisMonth ?? 0) * 50,
      action: 'Ver planos',
    });
  }

  if ((metrics.plantaCoinBalance ?? 0) >= 500) {
    opportunities.push({
      icon: '🪙',
      title: 'Planta-Coins disponíveis',
      description: `Você tem ${metrics.plantaCoinBalance} coins. Troque por cursos ou cash out!`,
      action: 'Ver marketplace',
    });
  }

  return opportunities;
}

export function calculatePercentile(rank: number, total: number): number {
  if (total === 0) return 0;
  return Math.round(((total - rank) / total) * 100);
}

export function getRevenueProjection(currentRevenue: number, growthRate: number, months: number): number[] {
  const projections: number[] = [];
  let revenue = currentRevenue;
  for (let i = 0; i < months; i++) {
    revenue *= (1 + growthRate / 100);
    projections.push(Math.round(revenue));
  }
  return projections;
}
