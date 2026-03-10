// ============================================================================
// REFERRAL PROGRAM SERVICE — PROGRAMA DE REFERÊNCIA AUTOMÁTICO
// Planta & Raiz 3.0 — Recompensas Automáticas para Médicos e Profissionais
// ============================================================================

import { db } from '../db';
import { notifyOwner } from '../_core/notification';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ReferralReward {
  id: string;
  referrerId: string;
  referredId: string;
  rewardType: 'cash' | 'commission_boost' | 'feature_unlock';
  amount: number;
  percentage?: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: Date;
  paidAt?: Date;
}

export interface ReferralLink {
  id: string;
  doctorId: string;
  code: string;
  url: string;
  createdAt: Date;
  clicks: number;
  conversions: number;
  active: boolean;
}

export interface ReferralStats {
  doctorId: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalRewards: number;
  pendingRewards: number;
  paidRewards: number;
  conversionRate: number;
}

export interface ReferralTier {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  minReferrals: number;
  maxReferrals: number;
  rewardPercentage: number;
  bonusPercentage: number;
  features: string[];
}

// ============================================================================
// REFERRAL PROGRAM SERVICE
// ============================================================================

export class ReferralProgramService {
  private referralTiers: ReferralTier[] = [
    {
      tier: 'bronze',
      minReferrals: 0,
      maxReferrals: 4,
      rewardPercentage: 5,
      bonusPercentage: 0,
      features: ['Link de referência básico'],
    },
    {
      tier: 'silver',
      minReferrals: 5,
      maxReferrals: 14,
      rewardPercentage: 7,
      bonusPercentage: 2,
      features: ['Link de referência avançado', 'Dashboard de referências'],
    },
    {
      tier: 'gold',
      minReferrals: 15,
      maxReferrals: 49,
      rewardPercentage: 10,
      bonusPercentage: 5,
      features: ['Link de referência premium', 'Dashboard avançado', 'Suporte prioritário'],
    },
    {
      tier: 'platinum',
      minReferrals: 50,
      maxReferrals: Infinity,
      rewardPercentage: 15,
      bonusPercentage: 10,
      features: ['Link de referência platinum', 'Dashboard VIP', 'Suporte 24/7', 'Comissão especial'],
    },
  ];

  /**
   * Gerar link de referência para médico
   */
  public async generateReferralLink(doctorId: string): Promise<ReferralLink> {
    try {
      const code = this.generateReferralCode();
      const url = `https://plantayraizmed.manus.space/register?ref=${code}`;

      const referralLink: ReferralLink = {
        id: `REF_LINK_${Date.now()}`,
        doctorId,
        code,
        url,
        createdAt: new Date(),
        clicks: 0,
        conversions: 0,
        active: true,
      };

      // Salvar em banco de dados
      await this.saveReferralLink(referralLink);

      console.log(`[ReferralProgram] Link de referência gerado: ${code}`);

      return referralLink;
    } catch (error) {
      console.error('[ReferralProgram] Erro ao gerar link de referência:', error);
      throw error;
    }
  }

  /**
   * Processar clique em link de referência
   */
  public async processReferralClick(code: string): Promise<void> {
    try {
      const referralLink = await this.getReferralLinkByCode(code);

      if (!referralLink) {
        console.warn(`[ReferralProgram] Link de referência não encontrado: ${code}`);
        return;
      }

      // Incrementar contador de cliques
      referralLink.clicks++;
      await this.updateReferralLink(referralLink);

      console.log(`[ReferralProgram] Clique registrado: ${code} (Total: ${referralLink.clicks})`);
    } catch (error) {
      console.error('[ReferralProgram] Erro ao processar clique:', error);
    }
  }

  /**
   * Processar conversão de referência (novo médico registrado)
   */
  public async processReferralConversion(code: string, newDoctorId: string): Promise<ReferralReward | null> {
    try {
      const referralLink = await this.getReferralLinkByCode(code);

      if (!referralLink) {
        console.warn(`[ReferralProgram] Link de referência não encontrado: ${code}`);
        return null;
      }

      // Incrementar contador de conversões
      referralLink.conversions++;
      await this.updateReferralLink(referralLink);

      // Obter tier do referidor
      const stats = await this.getReferralStats(referralLink.doctorId);
      const tier = this.getTierByReferrals(stats.totalReferrals);

      // Calcular recompensa
      const rewardAmount = this.calculateRewardAmount(tier);

      // Criar recompensa
      const reward: ReferralReward = {
        id: `REWARD_${Date.now()}`,
        referrerId: referralLink.doctorId,
        referredId: newDoctorId,
        rewardType: 'cash',
        amount: rewardAmount,
        status: 'pending',
        createdAt: new Date(),
      };

      // Salvar recompensa
      await this.saveReferralReward(reward);

      // Notificar referidor
      await this.notifyReferralReward(referralLink.doctorId, rewardAmount, tier);

      console.log(`[ReferralProgram] Conversão processada: ${code} -> ${newDoctorId} (Recompensa: R$ ${rewardAmount})`);

      return reward;
    } catch (error) {
      console.error('[ReferralProgram] Erro ao processar conversão:', error);
      return null;
    }
  }

  /**
   * Aprovar recompensa de referência
   */
  public async approveReferralReward(rewardId: string): Promise<void> {
    try {
      const reward = await this.getReferralReward(rewardId);

      if (!reward) {
        console.warn(`[ReferralProgram] Recompensa não encontrada: ${rewardId}`);
        return;
      }

      reward.status = 'approved';
      await this.updateReferralReward(reward);

      console.log(`[ReferralProgram] Recompensa aprovada: ${rewardId}`);
    } catch (error) {
      console.error('[ReferralProgram] Erro ao aprovar recompensa:', error);
    }
  }

  /**
   * Pagar recompensa de referência
   */
  public async payReferralReward(rewardId: string): Promise<void> {
    try {
      const reward = await this.getReferralReward(rewardId);

      if (!reward) {
        console.warn(`[ReferralProgram] Recompensa não encontrada: ${rewardId}`);
        return;
      }

      if (reward.status !== 'approved') {
        console.warn(`[ReferralProgram] Recompensa não está aprovada: ${rewardId}`);
        return;
      }

      reward.status = 'paid';
      reward.paidAt = new Date();
      await this.updateReferralReward(reward);

      // Notificar médico
      await this.notifyRewardPaid(reward.referrerId, reward.amount);

      console.log(`[ReferralProgram] Recompensa paga: ${rewardId} (R$ ${reward.amount})`);
    } catch (error) {
      console.error('[ReferralProgram] Erro ao pagar recompensa:', error);
    }
  }

  /**
   * Obter estatísticas de referência do médico
   */
  public async getReferralStats(doctorId: string): Promise<ReferralStats> {
    try {
      const rewards = await this.getReferralRewardsByReferrer(doctorId);

      const totalRewards = rewards.reduce((sum, r) => sum + r.amount, 0);
      const pendingRewards = rewards.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
      const paidRewards = rewards.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);

      const referralLinks = await this.getReferralLinksByDoctor(doctorId);
      const totalClicks = referralLinks.reduce((sum, l) => sum + l.clicks, 0);
      const totalConversions = referralLinks.reduce((sum, l) => sum + l.conversions, 0);

      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return {
        doctorId,
        totalReferrals: rewards.length,
        successfulReferrals: rewards.filter((r) => r.status !== 'pending').length,
        totalRewards,
        pendingRewards,
        paidRewards,
        conversionRate,
      };
    } catch (error) {
      console.error('[ReferralProgram] Erro ao obter estatísticas:', error);
      return {
        doctorId,
        totalReferrals: 0,
        successfulReferrals: 0,
        totalRewards: 0,
        pendingRewards: 0,
        paidRewards: 0,
        conversionRate: 0,
      };
    }
  }

  /**
   * Obter tier do médico
   */
  public async getReferralTier(doctorId: string): Promise<ReferralTier> {
    try {
      const stats = await this.getReferralStats(doctorId);
      return this.getTierByReferrals(stats.totalReferrals);
    } catch (error) {
      console.error('[ReferralProgram] Erro ao obter tier:', error);
      return this.referralTiers[0]; // Bronze como padrão
    }
  }

  /**
   * Obter tier por número de referências
   */
  private getTierByReferrals(referrals: number): ReferralTier {
    for (const tier of this.referralTiers) {
      if (referrals >= tier.minReferrals && referrals <= tier.maxReferrals) {
        return tier;
      }
    }
    return this.referralTiers[0]; // Bronze como padrão
  }

  /**
   * Calcular valor de recompensa
   */
  private calculateRewardAmount(tier: ReferralTier): number {
    // Recompensa base: R$ 100 + bônus por tier
    const baseReward = 100;
    const tierBonus = (baseReward * tier.bonusPercentage) / 100;
    return baseReward + tierBonus;
  }

  /**
   * Gerar código de referência único
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Notificar recompensa de referência
   */
  private async notifyReferralReward(doctorId: string, amount: number, tier: ReferralTier): Promise<void> {
    try {
      await notifyOwner({
        title: '🎉 Nova Recompensa de Referência!',
        content: `Médico ${doctorId} recebeu recompensa de R$ ${amount} por referência bem-sucedida. Tier: ${tier.tier.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('[ReferralProgram] Erro ao notificar recompensa:', error);
    }
  }

  /**
   * Notificar pagamento de recompensa
   */
  private async notifyRewardPaid(doctorId: string, amount: number): Promise<void> {
    try {
      await notifyOwner({
        title: '💰 Recompensa de Referência Paga!',
        content: `Recompensa de R$ ${amount} foi paga ao médico ${doctorId}.`,
      });
    } catch (error) {
      console.error('[ReferralProgram] Erro ao notificar pagamento:', error);
    }
  }

  /**
   * Métodos de persistência (implementar com banco de dados)
   */

  private async saveReferralLink(link: ReferralLink): Promise<void> {
    // Implementar gravação em banco de dados
    console.log('[ReferralProgram] Link de referência salvo:', link.id);
  }

  private async updateReferralLink(link: ReferralLink): Promise<void> {
    // Implementar atualização em banco de dados
    console.log('[ReferralProgram] Link de referência atualizado:', link.id);
  }

  private async getReferralLinkByCode(code: string): Promise<ReferralLink | null> {
    // Implementar busca em banco de dados
    return null;
  }

  private async getReferralLinksByDoctor(doctorId: string): Promise<ReferralLink[]> {
    // Implementar busca em banco de dados
    return [];
  }

  private async saveReferralReward(reward: ReferralReward): Promise<void> {
    // Implementar gravação em banco de dados
    console.log('[ReferralProgram] Recompensa salva:', reward.id);
  }

  private async updateReferralReward(reward: ReferralReward): Promise<void> {
    // Implementar atualização em banco de dados
    console.log('[ReferralProgram] Recompensa atualizada:', reward.id);
  }

  private async getReferralReward(rewardId: string): Promise<ReferralReward | null> {
    // Implementar busca em banco de dados
    return null;
  }

  private async getReferralRewardsByReferrer(doctorId: string): Promise<ReferralReward[]> {
    // Implementar busca em banco de dados
    return [];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const referralProgramService = new ReferralProgramService();
