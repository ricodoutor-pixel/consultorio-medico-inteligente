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
  },

  /**
   * Libera os 93% ao médico apenas se a avaliação for 5★.
   * Caso contrário, marca o crédito como `under_review` (auditoria do Dr. Edilson).
   *
   * @param ratingId  ID da linha em consultation_ratings (gerada após o paciente avaliar)
   */
  async releaseDoctorCreditOnRating(ratingId: string): Promise<{
    status: "released" | "under_review" | "error";
    message?: string;
  }> {
    try {
      const { data: rating, error: rErr } = await (supabase as any)
        .from("consultation_ratings")
        .select("id, stars, professional_id, amount, consultation_id, patient_id")
        .eq("id", ratingId)
        .maybeSingle();
      if (rErr || !rating) throw new Error(rErr?.message || "Avaliação não encontrada");

      const isFiveStar = Number(rating.stars) >= 5;
      const payoutStatus = isFiveStar ? "released" : "under_review";
      const reason = isFiveStar
        ? "Avaliação 5★ — repasse de 93% liberado para saque pelo médico."
        : `Avaliação ${rating.stars}★ < 5★ — repasse retido para auditoria do Dr. Edilson.`;

      // Atualiza o registro de auditoria criado pelo trigger handle_consultation_rating
      const { error: uErr } = await (supabase as any)
        .from("consultation_credit_audit")
        .update({ payout_status: payoutStatus, status: payoutStatus, reason })
        .eq("rating_id", ratingId);
      if (uErr) throw uErr;

      // Se 5★, credita carteira do médico
      if (isFiveStar && rating.amount) {
        const split = this.calculateSplit(Number(rating.amount));
        await (supabase as any).rpc("credit_affiliate_wallet", {
          _user_id: rating.professional_id,
          _amount: split.doctorAmount,
        }).catch((e: any) => console.warn("[credit_affiliate_wallet]", e?.message));
      }

      return { status: payoutStatus as "released" | "under_review", message: reason };
    } catch (err: any) {
      console.error("[releaseDoctorCreditOnRating]", err);
      return { status: "error", message: err?.message || String(err) };
    }
  },
};
