import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GamificationDashboardData {
  currentMeta: {
    id: string;
    nps_target: number;
    bonus_amount: number;
    period: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  npsProgress: {
    currentNPS: number;
    avgScore: number;
    targetNPS: number;
    progress: number;
    completed: boolean;
  };
  pendingBonuses: {
    count: number;
    totalAmount: number;
    items: Array<{
      id: string;
      bonus_type: string;
      amount: number;
      reason: string;
      status: string;
      created_at: string;
    }>;
  };
  achievements: {
    count: number;
    items: Array<{
      id: string;
      unlocked_at: string;
      gamification_badges: {
        name: string;
        description: string;
        icon: string;
        rarity: string;
        bonus_points: number;
      };
    }>;
  };
  streak: {
    currentStreak: number;
    maxStreak: number;
  };
  leaderboard: {
    rank: number;
    top10: Array<{
      professional_id: string;
      nps_score: number;
      total_bonuses: number;
      achievement_count: number;
      rank: number;
      profiles?: { full_name: string; avatar_url: string | null };
    }>;
  };
}

export interface RevenueDistributionData {
  summary: {
    month: number;
    year: number;
    totalRevenue: number;
    distributionRate: string;
    distributionPool: number;
    totalDoctors: number;
    totalWeightedScore: number;
  };
  myDistribution: {
    doctor_id: string;
    orientação técnications: number;
    hoursOnline: number;
    rating: number;
    tierMultiplier: number;
    baseScore: number;
    weightedScore: number;
    sharePercentage: number;
    estimatedAmount: number;
  } | null;
  topDoctors: Array<{
    doctor_id: string;
    orientação técnications: number;
    hoursOnline: number;
    weightedScore: number;
    sharePercentage: number;
    estimatedAmount: number;
  }>;
  formula: {
    description: string;
    multipliers: Record<string, string>;
  };
}

export function useGamification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDashboard = useCallback(async (professionalId: string): Promise<GamificationDashboardData> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke(
        `gamification-dashboard?professionalId=${professionalId}`,
        { method: "GET" }
      );
      if (err) throw err;
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkMetaCompletion = useCallback(async (metaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("gamification-check-meta", {
        body: { metaId },
      });
      if (err) throw err;
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkBadges = useCallback(async (professionalId: string) => {
    try {
      const { data, error: err } = await supabase.functions.invoke("auto-badge-check", {
        body: { professionalId },
      });
      if (err) throw err;
      return data;
    } catch (e) {
      console.error("Badge check error:", e);
      return { newBadges: [], totalNew: 0 };
    }
  }, []);

  const getRevenueDistribution = useCallback(async (doctorId?: string): Promise<RevenueDistributionData> => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const params = new URLSearchParams({
        month: String(now.getMonth() + 1),
        year: String(now.getFullYear()),
      });
      if (doctorId) params.set("doctorId", doctorId);

      const { data, error: err } = await supabase.functions.invoke(
        `revenue-distribution?${params.toString()}`,
        { method: "GET" }
      );
      if (err) throw err;
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getDashboard, checkMetaCompletion, checkBadges, getRevenueDistribution, loading, error };
}
