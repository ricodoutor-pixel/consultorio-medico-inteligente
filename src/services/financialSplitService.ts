/**
 * Financial Split Service — Planta y Raiz
 * Gerencia a distribuição de valores entre Médico, Plataforma, Marketing e Reserva.
 * Modelo: 60/20/10/10
 */

import { supabase } from "@/integrations/supabase/client";

export interface SplitResult {
  doctorAmount: number;
  platformFee: number;
  marketingFee: number;
  reserveFee: number;
}

export const financialSplitService = {
  /**
   * Calcula o split de uma transação de Orientação Técnica
   * @param grossAmount Valor bruto da transação
   */
  calculateSplit(grossAmount: number): SplitResult {
    return {
      doctorAmount: grossAmount * 0.60,
      platformFee: grossAmount * 0.20,
      marketingFee: grossAmount * 0.10,
      reserveFee: grossAmount * 0.10,
    };
  },

  /**
   * Registra o split no banco de dados para auditoria
   */
  async recordSplit(orderId: string, grossAmount: number, doctorId: string) {
    const split = this.calculateSplit(grossAmount);

    try {
      const { error } = await (supabase as any)
        .from('financial_metrics')
        .insert({
          order_id: orderId,
          doctor_id: doctorId,
          gross_amount: grossAmount,
          doctor_amount: split.doctorAmount,
          platform_fee: split.platformFee,
          marketing_fee: split.marketingFee,
          reserve_fee: split.reserveFee,
          status: 'processed',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true, split };
    } catch (err) {
      console.error("Error recording financial split:", err);
      return { success: false, error: err };
    }
  },

  /**
   * Verifica se o split de 7%/93% (modelo antigo) ainda está sendo usado em algum lugar
   * e alerta se necessário.
   */
  validateLegacySplit(rate: number): boolean {
    const legacyRate = 0.07;
    if (Math.abs(rate - legacyRate) < 0.001) {
      console.warn("⚠️ ALERTA: Detectado uso de split legado (7%). O sistema deve usar 20% para plataforma.");
      return true;
    }
    return false;
  }
};
