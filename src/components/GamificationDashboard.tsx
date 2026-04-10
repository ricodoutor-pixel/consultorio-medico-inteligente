import React, { useEffect, useState } from "react";
import { useGamification, type GamificationDashboardData } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Trophy,
  Gift,
  Flame,
  Target,
  Award,
  TrendingUp,
  Crown,
  Medal,
} from "lucide-react";

interface GamificationDashboardProps {
  professionalId: string;
}

const rarityColors: Record<string, string> = {
  common: "bg-gray-100 text-gray-700 border-gray-300",
  uncommon: "bg-green-50 text-green-700 border-green-300",
  rare: "bg-blue-50 text-blue-700 border-blue-300",
  epic: "bg-purple-50 text-purple-700 border-purple-300",
  legendary: "bg-amber-50 text-amber-700 border-amber-300",
};

const rankIcons = ["🥇", "🥈", "🥉"];

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  professionalId,
}) => {
  const { getDashboard, loading } = useGamification();
  const [data, setData] = useState<GamificationDashboardData | null>(null);

  useEffect(() => {
    getDashboard(professionalId)
      .then(setData)
      .catch(() => toast.error("Erro ao carregar gamificação"));
  }, [professionalId, getDashboard]);

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
        Gamificação & Metas
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NPS Progress */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary" style={{ width: `${data.npsProgress.progress}%` }} />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Meta de NPS</p>
              <Target className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">
              {data.npsProgress.currentNPS}
              <span className="text-lg text-muted-foreground font-normal">/{data.npsProgress.targetNPS}</span>
            </p>
            <Progress value={data.npsProgress.progress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{data.npsProgress.progress}% concluído</p>
          </CardContent>
        </Card>

        {/* Pending Bonuses */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Bônus Pendentes</p>
              <Gift className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">{data.pendingBonuses.count}</p>
            <p className="text-sm text-muted-foreground">
              R$ {(data.pendingBonuses.totalAmount / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Conquistas</p>
              <Award className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold">{data.achievements.count}</p>
            <p className="text-sm text-muted-foreground">badges desbloqueados</p>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Streak</p>
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-orange-500">
              {data.streak.currentStreak}
              <span className="text-lg text-muted-foreground font-normal"> dias</span>
            </p>
            <p className="text-xs text-muted-foreground">Máximo: {data.streak.maxStreak} dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Meta */}
      {data.currentMeta && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Meta Ativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Meta NPS</p>
                <p className="text-xl font-bold">{data.currentMeta.nps_target}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bônus</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {(data.currentMeta.bonus_amount / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="text-xl font-bold capitalize">{data.currentMeta.period}</p>
              </div>
            </div>
            <Progress value={data.npsProgress.progress} className="mt-4 h-3" />
            {data.npsProgress.completed && (
              <Badge className="mt-2 bg-green-500">✅ Meta Atingida!</Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Achievements Grid */}
      {data.achievements.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Conquistas Desbloqueadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {data.achievements.items.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-lg border text-center transition-all hover:scale-105 ${
                    rarityColors[a.gamification_badges?.rarity || "common"]
                  }`}
                >
                  <span className="text-3xl block mb-1">{a.gamification_badges?.icon || "🏆"}</span>
                  <p className="text-sm font-semibold truncate">{a.gamification_badges?.name}</p>
                  <Badge variant="outline" className="text-xs mt-1 capitalize">
                    {a.gamification_badges?.rarity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      {data.leaderboard.top10.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Leaderboard Top 10
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.leaderboard.top10.map((entry, i) => (
                <div
                  key={entry.professional_id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    entry.professional_id === professionalId
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-xl w-8 text-center">
                    {i < 3 ? rankIcons[i] : <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entry.profiles?.full_name || "Profissional"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      NPS: {entry.nps_score} · {entry.achievement_count} conquistas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{entry.nps_score}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Bonuses List */}
      {data.pendingBonuses.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-500" />
              Bônus Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.pendingBonuses.items.map((bonus) => (
                <div key={bonus.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div>
                    <p className="font-medium text-sm">{bonus.reason}</p>
                    <p className="text-xs text-muted-foreground capitalize">{bonus.bonus_type.replace(/_/g, " ")}</p>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    R$ {(bonus.amount / 100).toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
