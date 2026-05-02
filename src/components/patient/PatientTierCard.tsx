import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Crown, Diamond, Medal, Award } from "lucide-react";

interface TierInfo {
  name: string;
  icon: typeof Star;
  cashbackRate: number;
  minConsultations: number;
  color: string;
}

const TIERS: TierInfo[] = [
  { name: "Bronze", icon: Medal, cashbackRate: 0, minConsultations: 0, color: "text-orange-400" },
  { name: "Prata", icon: Award, cashbackRate: 2, minConsultations: 3, color: "text-gray-300" },
  { name: "Ouro", icon: Star, cashbackRate: 5, minConsultations: 8, color: "text-yellow-400" },
  { name: "Platina", icon: Crown, cashbackRate: 8, minConsultations: 15, color: "text-blue-300" },
  { name: "Diamante", icon: Diamond, cashbackRate: 12, minConsultations: 30, color: "text-cyan-300" },
];

function getTier(orientação técnications: number): { current: TierInfo; next: TierInfo | null; progress: number } {
  let currentIdx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (orientação técnications >= TIERS[i].minConsultations) {
      currentIdx = i;
      break;
    }
  }
  const current = TIERS[currentIdx];
  const next = currentIdx < TIERS.length - 1 ? TIERS[currentIdx + 1] : null;
  const progress = next
    ? ((orientação técnications - current.minConsultations) / (next.minConsultations - current.minConsultations)) * 100
    : 100;
  return { current, next, progress: Math.min(progress, 100) };
}

export function PatientTierCard() {
  const [orientação técnications, setConsultations] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", session.user.id)
        .eq("status", "completed");
      setConsultations(count || 0);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return null;

  const { current, next, progress } = getTier(orientação técnications);
  const Icon = current.icon;

  return (
    <Card className="p-4 bg-card/80 border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${current.color}`} />
          <span className="font-semibold text-foreground">{current.name}</span>
        </div>
        {current.cashbackRate > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {current.cashbackRate}% cashback
          </Badge>
        )}
      </div>
      {next && (
        <>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-[11px] text-muted-foreground">
            {next.minConsultations - orientação técnications} orientação técnicas para {next.name} ({next.cashbackRate}% cashback)
          </p>
        </>
      )}
      {!next && (
        <p className="text-[11px] text-muted-foreground">
          🎉 Nível máximo atingido! {current.cashbackRate}% de cashback em Planta-Coins
        </p>
      )}
    </Card>
  );
}
