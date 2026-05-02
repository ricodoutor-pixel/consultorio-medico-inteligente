import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Clock, Star, Award, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface PerformanceData {
  orientação técnications: number;
  hoursOnline: number;
  rating: number;
  planTier: string;
  baseScore: number;
  multiplier: number;
  weightedScore: number;
  estimatedShare: number;
  feeRate: number;
}

const TIER_CONFIG: Record<string, { label: string; color: string; nextTier: string | null; nextThreshold: number; feeRate: number }> = {
  basic: { label: "VIP", color: "bg-primary", nextTier: "professional", nextThreshold: 50, feeRate: 0 },
  professional: { label: "Profissional", color: "bg-blue-500", nextTier: "premium", nextThreshold: 120, feeRate: 0.05 },
  premium: { label: "Premium", color: "bg-amber-500", nextTier: "enterprise", nextThreshold: 250, feeRate: 0.03 },
  enterprise: { label: "Enterprise", color: "bg-purple-500", nextTier: null, nextThreshold: 999, feeRate: 0 },
};

const MULTIPLIERS: Record<string, number> = {
  basic: 1.0,
  professional: 1.2,
  premium: 1.5,
  enterprise: 2.0,
};

interface Props {
  doctorId: string;
  simulatedTier?: string;
}

export const DoctorPerformanceWidget = ({ doctorId, simulatedTier }: Props) => {
  const [perf, setPerf] = useState<PerformanceData>({
    orientação técnications: 0, hoursOnline: 0, rating: 5.0,
    planTier: "basic", baseScore: 0, multiplier: 1, weightedScore: 0, estimatedShare: 0, feeRate: 0,
  });

  useEffect(() => {
    if (!doctorId) return;
    fetchPerformance();
  }, [doctorId]);

  // Real-time weight simulation when hovering plans
  useEffect(() => {
    if (!simulatedTier || simulatedTier === perf.planTier) return;
    const mult = MULTIPLIERS[simulatedTier] || 1;
    const weighted = perf.baseScore * mult;
    const tierInfo = TIER_CONFIG[simulatedTier] || TIER_CONFIG.basic;
    setPerf(prev => ({
      ...prev,
      multiplier: mult,
      weightedScore: Math.round(weighted * 100) / 100,
      estimatedShare: Math.round(weighted * 12 * 100) / 100,
      feeRate: tierInfo.feeRate,
    }));
  }, [simulatedTier]);

  const fetchPerformance = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data: sub } = await supabase
      .from("medical_subscriptions")
      .select("plan_tier")
      .eq("doctor_id", doctorId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const tier = sub?.plan_tier || "basic";

    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, status, duration_minutes")
      .eq("doctor_id", doctorId)
      .gte("scheduled_at", startOfMonth)
      .lte("scheduled_at", endOfMonth);

    const completed = appts?.filter(a => a.status === "completed") || [];
    const orientação técnications = completed.length;
    const hoursOnline = completed.reduce((s, a) => s + (a.duration_minutes || 30), 0) / 60;

    const { data: doc } = await supabase
      .from("doctors")
      .select("rating")
      .eq("id", doctorId)
      .single();

    const rating = Number(doc?.rating || 5.0);

    const { data: scoreResult } = await supabase.rpc("calculate_doctor_performance", {
      _orientação técnications: orientação técnications,
      _hours_online: hoursOnline,
      _rating: rating,
      _plan_tier: tier,
    });

    const result = scoreResult as any;
    const tierInfo = TIER_CONFIG[tier] || TIER_CONFIG.basic;

    setPerf({
      orientação técnications,
      hoursOnline: Math.round(hoursOnline * 10) / 10,
      rating,
      planTier: tier,
      baseScore: result?.base_score || 0,
      multiplier: result?.multiplier || 1,
      weightedScore: result?.weighted_score || 0,
      estimatedShare: (result?.weighted_score || 0) * 12,
      feeRate: tierInfo.feeRate,
    });
  };

  const activeTier = simulatedTier || perf.planTier;
  const tierInfo = TIER_CONFIG[activeTier] || TIER_CONFIG.basic;
  const isSimulating = simulatedTier && simulatedTier !== perf.planTier;
  const progressToNext = tierInfo.nextTier
    ? Math.min(100, (perf.weightedScore / tierInfo.nextThreshold) * 100)
    : 100;

  return (
    <Card className="border-border bg-gradient-to-br from-card to-card/80 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-black text-foreground flex items-center gap-2">
            <Award size={20} className="text-amber-400" /> Meu Desempenho
          </h3>
          <div className="flex items-center gap-2">
            {isSimulating && (
              <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30 animate-pulse">
                Simulando
              </Badge>
            )}
            <Badge className={`${tierInfo.color} text-white text-xs font-bold px-3 py-1`}>
              {tierInfo.label} {perf.multiplier > 1 && `× ${perf.multiplier}`}
            </Badge>
          </div>
        </div>

        {/* Fee Rate Banner */}
        {perf.feeRate === 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-xs font-bold text-primary">Taxa Zero — 100% dos honorários são seus!</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <motion.div whileHover={{ scale: 1.03 }} className="bg-muted/30 rounded-xl p-3 border border-border text-center">
            <Users size={16} className="text-primary mx-auto mb-1" />
            <p className="text-xl font-display font-black text-foreground">{perf.orientação técnications}</p>
            <p className="text-[10px] text-muted-foreground font-bold">Consultas/Mês</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} className="bg-muted/30 rounded-xl p-3 border border-border text-center">
            <Clock size={16} className="text-primary mx-auto mb-1" />
            <p className="text-xl font-display font-black text-foreground">{perf.hoursOnline}h</p>
            <p className="text-[10px] text-muted-foreground font-bold">Horas Online</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} className="bg-muted/30 rounded-xl p-3 border border-border text-center">
            <Star size={16} className="text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-display font-black text-foreground">{perf.rating.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground font-bold">Nota Média</p>
          </motion.div>
        </div>

        {/* Score & Estimated Share */}
        <div className={`bg-muted/20 rounded-xl p-4 border mb-4 transition-all ${isSimulating ? "border-amber-400/40 shadow-sm shadow-amber-400/10" : "border-border"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-muted-foreground">Score Ponderado</span>
            </div>
            <span className={`text-lg font-display font-black ${isSimulating ? "text-amber-300" : "text-amber-400"}`}>
              {perf.weightedScore.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Participação Estimada</span>
            </div>
            <span className={`text-lg font-display font-black ${isSimulating ? "text-emerald-300" : "text-primary"}`}>
              R$ {perf.estimatedShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {tierInfo.nextTier && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-muted-foreground">
                Próximo nível: {TIER_CONFIG[tierInfo.nextTier]?.label}
              </span>
              <span className="text-[10px] font-bold text-primary">{Math.round(progressToNext)}%</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
