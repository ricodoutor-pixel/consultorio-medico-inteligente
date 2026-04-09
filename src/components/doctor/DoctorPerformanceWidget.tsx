import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Clock, Star, Award, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface PerformanceData {
  consultations: number;
  hoursOnline: number;
  rating: number;
  planTier: string;
  baseScore: number;
  multiplier: number;
  weightedScore: number;
  estimatedShare: number;
}

const TIER_CONFIG: Record<string, { label: string; color: string; nextTier: string | null; nextThreshold: number }> = {
  basic: { label: "Básico", color: "bg-zinc-500", nextTier: "professional", nextThreshold: 50 },
  professional: { label: "Profissional", color: "bg-blue-500", nextTier: "premium", nextThreshold: 120 },
  premium: { label: "Premium", color: "bg-amber-500", nextTier: "enterprise", nextThreshold: 250 },
  enterprise: { label: "Enterprise", color: "bg-purple-500", nextTier: null, nextThreshold: 999 },
};

export const DoctorPerformanceWidget = ({ doctorId }: { doctorId: string }) => {
  const [perf, setPerf] = useState<PerformanceData>({
    consultations: 0, hoursOnline: 0, rating: 5.0,
    planTier: "basic", baseScore: 0, multiplier: 1, weightedScore: 0, estimatedShare: 0,
  });

  useEffect(() => {
    if (!doctorId) return;
    fetchPerformance();
  }, [doctorId]);

  const fetchPerformance = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Fetch subscription tier
    const { data: sub } = await supabase
      .from("medical_subscriptions")
      .select("plan_tier")
      .eq("doctor_id", doctorId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const tier = sub?.plan_tier || "basic";

    // Fetch this month's appointments
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, status, duration_minutes")
      .eq("doctor_id", doctorId)
      .gte("scheduled_at", startOfMonth)
      .lte("scheduled_at", endOfMonth);

    const completed = appts?.filter(a => a.status === "completed") || [];
    const consultations = completed.length;
    const hoursOnline = completed.reduce((s, a) => s + (a.duration_minutes || 30), 0) / 60;

    // Fetch doctor rating
    const { data: doc } = await supabase
      .from("doctors")
      .select("rating")
      .eq("id", doctorId)
      .single();

    const rating = Number(doc?.rating || 5.0);

    // Calculate score via DB function
    const { data: scoreResult } = await supabase.rpc("calculate_doctor_performance", {
      _consultations: consultations,
      _hours_online: hoursOnline,
      _rating: rating,
      _plan_tier: tier,
    });

    const result = scoreResult as any;

    setPerf({
      consultations,
      hoursOnline: Math.round(hoursOnline * 10) / 10,
      rating,
      planTier: tier,
      baseScore: result?.base_score || 0,
      multiplier: result?.multiplier || 1,
      weightedScore: result?.weighted_score || 0,
      estimatedShare: (result?.weighted_score || 0) * 12, // simplified estimate
    });
  };

  const tierInfo = TIER_CONFIG[perf.planTier] || TIER_CONFIG.basic;
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
          <Badge className={`${tierInfo.color} text-white text-xs font-bold px-3 py-1`}>
            {tierInfo.label} {perf.multiplier > 1 && `× ${perf.multiplier}`}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <motion.div whileHover={{ scale: 1.03 }} className="bg-muted/30 rounded-xl p-3 border border-border text-center">
            <Users size={16} className="text-primary mx-auto mb-1" />
            <p className="text-xl font-display font-black text-foreground">{perf.consultations}</p>
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
        <div className="bg-muted/20 rounded-xl p-4 border border-border mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-muted-foreground">Score Ponderado</span>
            </div>
            <span className="text-lg font-display font-black text-amber-400">{perf.weightedScore.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Participação Estimada</span>
            </div>
            <span className="text-lg font-display font-black text-primary">
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
