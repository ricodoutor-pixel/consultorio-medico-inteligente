import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Lock, CheckCircle2, Flame, Star, Trophy, Heart, Zap, Crown, Users, BookOpen } from "lucide-react";
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

interface BadgeData {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  rarity: string;
  bonus_points: number;
  criteria: { type: string; min?: number } | null;
  unlocked?: boolean;
  unlocked_at?: string;
}

const rarityConfig: Record<string, { label: string; color: string; glow: string; order: number }> = {
  common: { label: "Bronze 🥉", color: "from-amber-700/20 to-amber-900/10 border-amber-600/40", glow: "", order: 1 },
  uncommon: { label: "Prata 🥈", color: "from-slate-300/20 to-slate-500/10 border-slate-400/40", glow: "", order: 2 },
  rare: { label: "Ouro 🥇", color: "from-yellow-400/20 to-amber-500/10 border-yellow-500/40", glow: "shadow-yellow-500/10", order: 3 },
  epic: { label: "Épico 💜", color: "from-purple-500/20 to-purple-700/10 border-purple-500/40", glow: "shadow-purple-500/20", order: 4 },
  legendary: { label: "Platina 💎", color: "from-cyan-400/20 to-blue-500/10 border-cyan-400/40", glow: "shadow-cyan-400/30 shadow-lg", order: 5 },
};

const fallbackIcons: Record<string, React.ReactNode> = {
  consultations: <Users className="h-8 w-8" />,
  nps_score: <Star className="h-8 w-8" />,
  streak: <Flame className="h-8 w-8" />,
  nps_sustained: <Heart className="h-8 w-8" />,
};

const Badges: React.FC = () => {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Fetch all badges
      const { data: allBadges } = await supabase
        .from("gamification_badges")
        .select("*")
        .order("rarity", { ascending: true });

      if (!allBadges) { setLoading(false); return; }

      // Fetch user achievements if logged in
      let unlockedIds = new Set<string>();
      let achievementMap = new Map<string, string>();
      if (user) {
        const { data: achievements } = await supabase
          .from("gamification_achievements")
          .select("badge_id, unlocked_at")
          .eq("professional_id", user.id);
        (achievements || []).forEach(a => {
          unlockedIds.add(a.badge_id);
          achievementMap.set(a.badge_id, a.unlocked_at);
        });
      }

      const enriched: BadgeData[] = allBadges.map(b => ({
        ...b,
        criteria: b.criteria as BadgeData["criteria"],
        unlocked: unlockedIds.has(b.id),
        unlocked_at: achievementMap.get(b.id),
      }));

      // Sort: unlocked first, then by rarity
      enriched.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return (rarityConfig[a.rarity]?.order || 0) - (rarityConfig[b.rarity]?.order || 0);
      });

      setBadges(enriched);
      setLoading(false);
    };
    load();
  }, []);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length;
  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-dvh bg-background">
      <SEO
        title="Badges & Conquistas | Planta & Raiz"
        description="Desbloqueie badges e conquistas no sistema de gamificação da Planta & Raiz. Profissionais com melhor NPS ganham recompensas exclusivas."
      />
      <ResponsiveNavbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Sistema de Conquistas</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
            Badges & Conquistas
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Desbloqueie badges exclusivas alcançando metas de NPS, consultas e dedicação contínua à plataforma.
          </p>
        </div>

        {/* Progress */}
        {userId && (
          <Card className="mb-8 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progresso Geral</span>
                <span className="text-sm font-bold text-primary">{unlockedCount}/{totalCount}</span>
              </div>
              <Progress value={progressPct} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">{progressPct}% das conquistas desbloqueadas</p>
            </CardContent>
          </Card>
        )}

        {/* Tier Legend */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {Object.entries(rarityConfig).map(([key, cfg]) => (
            <Badge key={key} variant="outline" className="text-xs capitalize">
              {cfg.label}
            </Badge>
          ))}
        </div>

        {/* Badge Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : badges.length === 0 ? (
          <div className="text-center py-16">
            <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma badge cadastrada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {badges.map((badge) => {
              const rarity = rarityConfig[badge.rarity] || rarityConfig.common;
              return (
                <Card
                  key={badge.id}
                  className={`relative overflow-hidden border bg-gradient-to-br transition-all duration-300 hover:scale-105 ${rarity.color} ${rarity.glow} ${
                    !badge.unlocked ? "opacity-60 grayscale" : ""
                  }`}
                >
                  {badge.unlocked && (
                    <div className="absolute top-1.5 right-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                  )}
                  {!badge.unlocked && (
                    <div className="absolute top-1.5 right-1.5">
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                  <CardContent className="p-3 text-center">
                    <div className="text-3xl mb-2">
                      {badge.icon || (fallbackIcons[(badge.criteria as any)?.type] || "🏆")}
                    </div>
                    <p className="text-xs font-bold text-foreground truncate mb-0.5">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
                      {badge.description || "Conquista especial"}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <Badge variant="outline" className="text-[9px] capitalize">{rarity.label}</Badge>
                    </div>
                    {badge.bonus_points > 0 && (
                      <p className="text-[10px] text-primary font-semibold mt-1">+{badge.bonus_points} pts</p>
                    )}
                    {badge.unlocked && badge.unlocked_at && (
                      <p className="text-[9px] text-emerald-500 mt-1">
                        ✅ {new Date(badge.unlocked_at).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Criteria Info */}
        <Card className="mt-8 border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Como desbloquear?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div><strong className="text-foreground">Orientações Técnicas</strong>: Realize consultas com pacientes para desbloquear badges de atendimento.</div>
              </div>
              <div className="flex items-start gap-2">
                <Star className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <div><strong className="text-foreground">NPS Score</strong>: Mantenha seu NPS acima do limite para ganhar badges de qualidade.</div>
              </div>
              <div className="flex items-start gap-2">
                <Flame className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div><strong className="text-foreground">Streak</strong>: Fique online por dias consecutivos para badges de dedicação.</div>
              </div>
              <div className="flex items-start gap-2">
                <Crown className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <div><strong className="text-foreground">Bônus Camadas</strong>: Bronze (1x), Prata (1.2x), Ouro (1.35x), Platina (1.5x).</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Badges;
