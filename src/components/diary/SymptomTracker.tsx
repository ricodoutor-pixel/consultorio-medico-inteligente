import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DiaryEntry {
  entry_date: string;
  pain_level: number | null;
  sleep_quality: number | null;
  mood: number | null;
  drops_used: number | null;
}

/**
 * "Meu Diário Planta y Raiz" — registro diário + gráfico de evolução.
 * Tabela: patient_symptom_diary (RLS: paciente só vê o próprio).
 */
export function SymptomTracker({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const [pain, setPain] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [mood, setMood] = useState(5);
  const [drops, setDrops] = useState<string>("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("patient_symptom_diary" as any)
      .select("entry_date,pain_level,sleep_quality,mood,drops_used")
      .eq("patient_id", patientId)
      .order("entry_date", { ascending: true })
      .limit(60);
    if (data) setEntries(data as any);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [patientId]);

  const save = async () => {
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      patient_id: patientId,
      entry_date: today,
      pain_level: pain,
      sleep_quality: sleep,
      mood,
      drops_used: drops ? Number(drops) : null,
    };
    const { error } = await supabase
      .from("patient_symptom_diary" as any)
      .upsert(payload, { onConflict: "patient_id,entry_date" });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Diário atualizado", description: "Registro de hoje salvo." });
      load();
    }
  };

  const firstPain = entries.find((e) => e.pain_level != null)?.pain_level ?? null;
  const lastPain = [...entries].reverse().find((e) => e.pain_level != null)?.pain_level ?? null;
  const reduction =
    firstPain && lastPain != null && firstPain > 0
      ? Math.max(0, Math.round(((firstPain - lastPain) / firstPain) * 100))
      : null;

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Meu Diário Planta y Raiz</h3>
        <p className="text-sm text-muted-foreground">Registre como você está hoje.</p>
      </div>

      <div className="grid gap-3">
        <Slider label={`Dor: ${pain}/10`} value={pain} onChange={setPain} />
        <Slider label={`Sono: ${sleep}/10`} value={sleep} onChange={setSleep} />
        <Slider label={`Humor: ${mood}/10`} value={mood} onChange={setMood} />
        <label className="text-sm">
          Gotas utilizadas hoje
          <input
            type="number"
            inputMode="decimal"
            value={drops}
            onChange={(e) => setDrops(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="ex: 6"
          />
        </label>
      </div>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? "Salvando..." : "Salvar registro de hoje"}
      </Button>

      {entries.length >= 2 && (
        <div className="space-y-2">
          {reduction != null && (
            <p className="text-sm text-primary">
              📉 Sua dor reduziu <strong>{reduction}%</strong> desde o início do protocolo.
            </p>
          )}
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={entries}>
                <XAxis dataKey="entry_date" hide />
                <YAxis domain={[0, 10]} width={24} />
                <Tooltip />
                <Line type="monotone" dataKey="pain_level" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="sleep_quality" stroke="hsl(var(--accent))" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="mood" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="text-sm">
      {label}
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-primary"
      />
    </label>
  );
}
