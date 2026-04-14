import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const tooltipStyle = { background: "hsl(240 15% 8%)", border: "1px solid hsl(240 10% 16%)", borderRadius: "12px", color: "hsl(240 10% 93%)" };

interface EvolutionChartProps {
  userId: string;
  compact?: boolean;
  refreshKey?: number;
}

interface Outcome {
  symptom_level: number;
  mood: string;
  created_at: string;
}

export function EvolutionChart({ userId, compact = false, refreshKey = 0 }: EvolutionChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [hasAlert, setHasAlert] = useState(false);

  useEffect(() => {
    fetchOutcomes();
  }, [userId, refreshKey]);

  const fetchOutcomes = async () => {
    const { data: outcomes } = await supabase
      .from("clinical_outcomes" as any)
      .select("symptom_level, mood, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(60);

    if (outcomes && outcomes.length > 0) {
      const chartData = (outcomes as Outcome[]).map((o, i) => ({
        dia: new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        nivel: o.symptom_level,
        humor: o.mood,
      }));
      setData(chartData);

      // Detect recaída: if latest 2 points increased by 3+ from prior average
      if (chartData.length >= 3) {
        const recent = chartData.slice(-2);
        const prior = chartData.slice(0, -2);
        const priorAvg = prior.reduce((s, p) => s + p.nivel, 0) / prior.length;
        const recentAvg = recent.reduce((s, p) => s + p.nivel, 0) / recent.length;
        setHasAlert(recentAvg - priorAvg >= 3);
      }
    }
  };

  if (data.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className={`${compact ? "p-4" : "p-6"} text-center`}>
          <TrendingUp size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Nenhum registro de evolução ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border ${hasAlert ? "border-destructive/30" : ""}`}>
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-display font-black text-foreground flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
            <TrendingUp size={compact ? 14 : 16} className="text-primary" /> Curva de Evolução
          </h3>
          {hasAlert && (
            <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-1">
              <AlertTriangle size={10} /> Alerta de Recaída
            </Badge>
          )}
        </div>
        <ResponsiveContainer width="100%" height={compact ? 150 : 220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 16%)" />
            <XAxis dataKey="dia" stroke="hsl(240 10% 68%)" fontSize={10} />
            <YAxis stroke="hsl(240 10% 68%)" fontSize={10} domain={[0, 10]} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}/10`, "Sintomas"]} />
            <ReferenceLine y={5} stroke="hsl(45 80% 55%)" strokeDasharray="5 5" label={{ value: "Meta", position: "right", fontSize: 10, fill: "hsl(45 80% 55%)" }} />
            <Line
              type="monotone"
              dataKey="nivel"
              stroke={hasAlert ? "hsl(0 70% 55%)" : "hsl(152 80% 45%)"}
              strokeWidth={2}
              dot={{ fill: hasAlert ? "hsl(0 70% 55%)" : "hsl(152 80% 45%)", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Melhora</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Meta</span>
          {hasAlert && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Alerta</span>}
        </div>
      </CardContent>
    </Card>
  );
}
