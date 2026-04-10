import React, { useEffect, useState } from "react";
import { useGamification, type GamificationDashboardData, type RevenueDistributionData } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Trophy, Gift, Flame, Target, Award, TrendingUp,
  Crown, DollarSign, Users, Clock, Zap,
} from "lucide-react";

interface GamificationDashboardProps {
  professionalId: string;
  doctorId?: string;
}

const rarityColors: Record<string, string> = {
  common: "bg-muted text-muted-foreground border-border",
  uncommon: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  rare: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  epic: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  legendary: "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

const rankIcons = ["🥇", "🥈", "🥉"];

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  professionalId,
  doctorId,
}) => {
  const { getDashboard, checkBadges, getRevenueDistribution, loading } = useGamification();
  const [data, setData] = useState<GamificationDashboardData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDistributionData | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [dashData, revData] = await Promise.all([
          getDashboard(professionalId),
          getRevenueDistribution(doctorId),
        ]);
        setData(dashData);
        setRevenueData(revData);

        // Auto-check for new badges
        const badgeResult = await checkBadges(professionalId);
        if (badgeResult.totalNew > 0) {
          toast.success(`🏆 ${badgeResult.totalNew} nova(s) conquista(s) desbloqueada(s)!`, {
            description: badgeResult.newBadges.join(", "),
          });
          // Refresh dashboard
          const refreshed = await getDashboard(professionalId);
          setData(refreshed);
        }
      } catch {
        toast.error("Erro ao carregar gamificação");
      }
    };
    loadAll();
  }, [professionalId, doctorId]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        Conquistas, Metas & Distribuição
      </h2>

      <Tabs defaultValue="gamification" className="w-full">
        <TabsList className="w-full bg-muted/30">
          <TabsTrigger value="gamification" className="flex-1 text-xs gap-1">
            <Trophy className="h-3 w-3" /> Gamificação
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex-1 text-xs gap-1">
            <DollarSign className="h-3 w-3" /> Distribuição 10%
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1 text-xs gap-1">
            <Crown className="h-3 w-3" /> Ranking
          </TabsTrigger>
        </TabsList>

        {/* ── Gamification Tab ── */}
        <TabsContent value="gamification" className="space-y-4 mt-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="relative overflow-hidden border-border">
              <div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary"
                style={{ width: `${data.npsProgress.progress}%` }}
              />
              <CardContent className="pt-5 pb-4 px-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Meta NPS</p>
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-black text-foreground">
                  {data.npsProgress.currentNPS}
                  <span className="text-sm text-muted-foreground font-normal">/{data.npsProgress.targetNPS}</span>
                </p>
                <Progress value={data.npsProgress.progress} className="mt-2 h-1.5" />
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-5 pb-4 px-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Bônus</p>
                  <Gift className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-emerald-500">{data.pendingBonuses.count}</p>
                <p className="text-[10px] text-muted-foreground">
                  R$ {(data.pendingBonuses.totalAmount / 100).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-5 pb-4 px-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Conquistas</p>
                  <Award className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-2xl font-black text-foreground">{data.achievements.count}</p>
                <p className="text-[10px] text-muted-foreground">badges</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-5 pb-4 px-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Streak</p>
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-2xl font-black text-orange-500">
                  {data.streak.currentStreak}
                  <span className="text-sm text-muted-foreground font-normal"> dias</span>
                </p>
                <p className="text-[10px] text-muted-foreground">Máx: {data.streak.maxStreak}</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Meta */}
          {data.currentMeta && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Meta Ativa</span>
                  {data.npsProgress.completed && (
                    <Badge className="bg-emerald-500 text-white text-[10px]">✅ Atingida!</Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">NPS Alvo</p>
                    <p className="text-lg font-black text-foreground">{data.currentMeta.nps_target}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Bônus</p>
                    <p className="text-lg font-black text-emerald-500">
                      R$ {(data.currentMeta.bonus_amount / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Período</p>
                    <p className="text-lg font-black text-foreground capitalize">{data.currentMeta.period}</p>
                  </div>
                </div>
                <Progress value={data.npsProgress.progress} className="mt-3 h-2" />
              </CardContent>
            </Card>
          )}

          {/* Achievements Grid */}
          {data.achievements.items.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="h-4 w-4" /> Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {data.achievements.items.map((a) => (
                    <div
                      key={a.id}
                      className={`p-2.5 rounded-lg border text-center transition-all hover:scale-105 ${
                        rarityColors[a.gamification_badges?.rarity || "common"]
                      }`}
                    >
                      <span className="text-2xl block mb-0.5">{a.gamification_badges?.icon || "🏆"}</span>
                      <p className="text-[11px] font-semibold truncate">{a.gamification_badges?.name}</p>
                      <Badge variant="outline" className="text-[9px] mt-0.5 capitalize">
                        {a.gamification_badges?.rarity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Bonuses */}
          {data.pendingBonuses.items.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gift className="h-4 w-4 text-emerald-500" /> Bônus Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.pendingBonuses.items.map((bonus) => (
                  <div key={bonus.id} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div>
                      <p className="text-xs font-medium text-foreground">{bonus.reason}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{bonus.bonus_type.replace(/_/g, " ")}</p>
                    </div>
                    <Badge className="bg-emerald-500 text-white text-[10px]">
                      R$ {(bonus.amount / 100).toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Distribution Tab ── */}
        <TabsContent value="distribution" className="space-y-4 mt-4">
          {revenueData ? (
            <>
              {/* Pool Summary */}
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      Pool de Distribuição — {revenueData.summary.distributionRate} dos Lucros
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Receita Total</p>
                      <p className="text-lg font-black text-foreground">
                        R$ {revenueData.summary.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Pool 10%</p>
                      <p className="text-lg font-black text-emerald-500">
                        R$ {revenueData.summary.distributionPool.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Médicos</p>
                      <p className="text-lg font-black text-foreground">{revenueData.summary.totalDoctors}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Score Total</p>
                      <p className="text-lg font-black text-foreground">{revenueData.summary.totalWeightedScore}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* My Distribution */}
              {revenueData.myDistribution && (
                <Card className="border-emerald-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-bold text-foreground">Sua Participação</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <Users className="h-4 w-4 mx-auto mb-1 text-blue-400" />
                        <p className="text-lg font-black text-foreground">{revenueData.myDistribution.consultations}</p>
                        <p className="text-[10px] text-muted-foreground">Consultas</p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <Clock className="h-4 w-4 mx-auto mb-1 text-emerald-400" />
                        <p className="text-lg font-black text-foreground">{revenueData.myDistribution.hoursOnline}h</p>
                        <p className="text-[10px] text-muted-foreground">Horas Online</p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-black text-foreground">{revenueData.myDistribution.sharePercentage}%</p>
                        <p className="text-[10px] text-muted-foreground">Sua Fatia</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <p className="text-[10px] text-muted-foreground">Valor Estimado Este Mês</p>
                      <p className="text-2xl font-black text-emerald-500">
                        R$ {revenueData.myDistribution.estimatedAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formula */}
              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-foreground mb-2">📐 Fórmula de Cálculo</p>
                  <p className="text-[11px] text-muted-foreground font-mono bg-muted/30 p-2 rounded">
                    {revenueData.formula.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(revenueData.formula.multipliers).map(([tier, mult]) => (
                      <Badge key={tier} variant="outline" className="text-[9px] capitalize">
                        {tier}: {mult}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Dados de distribuição não disponíveis</p>
            </div>
          )}
        </TabsContent>

        {/* ── Leaderboard Tab ── */}
        <TabsContent value="leaderboard" className="space-y-4 mt-4">
          {data.leaderboard.top10.length > 0 ? (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" /> Top 10 Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {data.leaderboard.top10.map((entry, i) => (
                  <div
                    key={entry.professional_id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                      entry.professional_id === professionalId
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-lg w-7 text-center">
                      {i < 3 ? rankIcons[i] : <span className="text-xs font-black text-muted-foreground">#{i + 1}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {entry.profiles?.full_name || "Profissional"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        NPS: {entry.nps_score} · {entry.achievement_count} conquistas
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">{entry.nps_score}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Crown className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Leaderboard será atualizado em breve</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
