import React, { useState } from "react";
import { useNPS } from "@/hooks/useNPS";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Star, Send, MessageCircle } from "lucide-react";

interface NPSFormProps {
  consultationId: string;
  patientId: string;
  professionalId: string;
  professionalName?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const scoreColors: Record<number, string> = {
  0: "bg-red-500",
  1: "bg-red-500",
  2: "bg-red-400",
  3: "bg-orange-500",
  4: "bg-orange-400",
  5: "bg-yellow-500",
  6: "bg-yellow-400",
  7: "bg-lime-400",
  8: "bg-lime-500",
  9: "bg-green-500",
  10: "bg-green-600",
};

export const NPSForm: React.FC<NPSFormProps> = ({
  consultationId,
  patientId,
  professionalId,
  professionalName,
  onSuccess,
  onClose,
}) => {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const { submitResponse, loading } = useNPS();

  const getCategory = (s: number) => {
    if (s <= 6) return { label: "Detrator", color: "text-red-500" };
    if (s <= 8) return { label: "Passivo", color: "text-yellow-500" };
    return { label: "Promotor", color: "text-green-500" };
  };

  const handleSubmit = async () => {
    if (score === null) {
      toast.error("Por favor, selecione uma nota");
      return;
    }
    try {
      await submitResponse({
        consultationId,
        patientId,
        professionalId,
        score,
        feedback: feedback.trim() || undefined,
      });
      toast.success("🎉 Obrigado pelo seu feedback!");
      onSuccess?.();
    } catch {
      toast.error("Erro ao enviar resposta. Tente novamente.");
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto border-primary/20 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Como foi sua experiência?</CardTitle>
        </div>
        {professionalName && (
          <p className="text-sm text-muted-foreground">
            Consulta com <span className="font-medium text-foreground">{professionalName}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Scale */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
            <span>Nada provável</span>
            <span>Muito provável</span>
          </div>
          <div className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => setScore(i)}
                className={`h-11 rounded-lg font-bold text-sm transition-all duration-200 ${
                  score === i
                    ? `${scoreColors[i]} text-white scale-110 shadow-md ring-2 ring-offset-2 ring-primary/50`
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105"
                }`}
              >
                {i}
              </button>
            ))}
          </div>

          {/* Category indicator */}
          {score !== null && (
            <div className="mt-3 text-center animate-in fade-in duration-300">
              <span className={`text-sm font-semibold ${getCategory(score).color}`}>
                {score <= 6 ? "😔" : score <= 8 ? "😐" : "😊"} {getCategory(score).label}
              </span>
            </div>
          )}
        </div>

        {/* Feedback textarea */}
        {score !== null && score < 9 && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>Como podemos melhorar?</span>
            </div>
            <Textarea
              placeholder="Conte-nos sua experiência..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{feedback.length}/500</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Agora não
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={loading || score === null}
            className="flex-1 gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
