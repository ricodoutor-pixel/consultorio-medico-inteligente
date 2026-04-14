import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const moods = [
  { emoji: "😢", label: "Muito mal" },
  { emoji: "😟", label: "Mal" },
  { emoji: "😐", label: "Neutro" },
  { emoji: "🙂", label: "Bem" },
  { emoji: "😄", label: "Ótimo" },
];

interface PatientCheckinCardProps {
  userId: string;
  onCheckinComplete?: () => void;
}

export function PatientCheckinCard({ userId, onCheckinComplete }: PatientCheckinCardProps) {
  const [symptomLevel, setSymptomLevel] = useState(5);
  const [selectedMood, setSelectedMood] = useState("😐");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    const { error } = await supabase.from("clinical_outcomes" as any).insert({
      user_id: userId,
      symptom_level: symptomLevel,
      mood: selectedMood,
      notes: notes || null,
    });
    setSaving(false);

    if (error) {
      toast.error("Erro ao registrar evolução");
    } else {
      toast.success("Evolução registrada ✅");
      setSymptomLevel(5);
      setSelectedMood("😐");
      setNotes("");
      onCheckinComplete?.();
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-5">
        <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
          <Heart size={16} className="text-primary" /> Como você está hoje?
        </h3>

        {/* Symptom Level Slider */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground font-bold">Nível de sintomas</span>
            <span className={`text-sm font-black ${symptomLevel <= 3 ? "text-primary" : symptomLevel <= 6 ? "text-yellow-500" : "text-destructive"}`}>{symptomLevel}/10</span>
          </div>
          <Slider
            value={[symptomLevel]}
            onValueChange={([v]) => setSymptomLevel(v)}
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Sem dor</span>
            <span>Moderada</span>
            <span>Intensa</span>
          </div>
        </div>

        {/* Mood Selector */}
        <div className="mb-4">
          <span className="text-xs text-muted-foreground font-bold block mb-2">Humor geral</span>
          <div className="flex gap-2 justify-center">
            {moods.map(m => (
              <button
                key={m.emoji}
                onClick={() => setSelectedMood(m.emoji)}
                className={`text-2xl p-2 rounded-xl transition-all ${selectedMood === m.emoji ? "bg-primary/10 scale-110 ring-2 ring-primary" : "hover:bg-muted/30"}`}
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <Textarea
          placeholder="Observações (opcional): como dormiu, efeitos colaterais..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="text-xs resize-none h-16 mb-3 bg-background/50"
        />

        <Button onClick={handleSubmit} disabled={saving} className="w-full rounded-xl bg-primary text-primary-foreground text-xs">
          <Send size={12} className="mr-1" /> {saving ? "Salvando..." : "Registrar Evolução"}
        </Button>
      </CardContent>
    </Card>
  );
}
