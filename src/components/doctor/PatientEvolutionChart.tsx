import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { intensitySeries, type IntensityPoint } from "@/lib/clinical-summary";

/** Evolução da intensidade dos sintomas (0 a 10) informada na triagem de cada consulta. */
export function PatientEvolutionChart({ patientId }: { patientId: string }) {
  const [points, setPoints] = useState<IntensityPoint[] | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    void supabase
      .from("appointments")
      .select("created_at, notes")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true })
      .limit(60)
      .then(({ data }) => {
        if (active) setPoints(intensitySeries(data ?? []));
      });
    return () => {
      active = false;
    };
  }, [patientId]);

  if (!points || points.length < 2) return null;
  const first = points[0].intensity;
  const last = points[points.length - 1].intensity;
  const delta = last - first;

  return (
    <div className="rounded-xl border border-border p-4 mb-6 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold text-sm text-foreground inline-flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-emerald-600" /> Evolução da intensidade dos sintomas (0 a 10)
        </p>
        <p className={`text-xs font-semibold ${delta < 0 ? "text-emerald-700" : delta > 0 ? "text-red-700" : "text-muted-foreground"}`}>
          {delta === 0 ? "Sem mudança" : `${delta > 0 ? "+" : ""}${delta} ponto(s) desde a primeira consulta`}
        </p>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip formatter={(v) => [`${v}/10`, "Intensidade"]} />
            <Line type="monotone" dataKey="intensity" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted-foreground">Valores informados pelo paciente na triagem de cada consulta.</p>
    </div>
  );
}
