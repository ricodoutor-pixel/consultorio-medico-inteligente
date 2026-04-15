import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";

interface MandatoryNPSModalProps {
  open: boolean;
  consultationId: string;
  patientId: string;
  professionalId: string;
  professionalName?: string;
  flowType: "consultation" | "delivery";
  onComplete: () => void;
}

const SCORE_LABELS: Record<number, string> = {
  0: "Péssimo",
  1: "Muito ruim",
  2: "Ruim",
  3: "Regular",
  4: "Abaixo da média",
  5: "Médio",
  6: "Aceitável",
  7: "Bom",
  8: "Muito bom",
  9: "Excelente",
  10: "Excepcional",
};

export const MandatoryNPSModal = ({
  open,
  consultationId,
  patientId,
  professionalId,
  professionalName,
  flowType,
  onComplete,
}: MandatoryNPSModalProps) => {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { log } = useAuditLog();

  const getCategory = (s: number): "detractor" | "passive" | "promoter" => {
    if (s <= 6) return "detractor";
    if (s <= 8) return "passive";
    return "promoter";
  };

  const handleSubmit = async () => {
    if (score === null) {
      toast.error("Selecione uma nota de 0 a 10");
      return;
    }

    setLoading(true);
    try {
      const category = getCategory(score);
      const sentiment = score >= 7 ? "positive" : score >= 4 ? "neutral" : "negative";

      const { error } = await supabase.from("nps_responses").insert({
        consultation_id: consultationId,
        patient_id: patientId,
        professional_id: professionalId,
        score,
        category,
        sentiment,
        feedback: feedback.trim() || null,
      });

      if (error) throw error;

      await log("nps_submitted", "nps_responses", consultationId, null, {
        score,
        category,
        flow_type: flowType,
      });

      setSubmitted(true);
      toast.success("Obrigado pela sua avaliação! 💚");

      setTimeout(() => onComplete(), 2000);
    } catch (err) {
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <Dialog open={open}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center py-8 space-y-4">
            <Heart size={48} className="text-primary animate-pulse" />
            <h3 className="text-lg font-bold text-foreground">Obrigado!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Sua avaliação nos ajuda a oferecer o melhor cuidado.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-card border-border" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-foreground">
            {flowType === "consultation"
              ? "Como foi sua consulta?"
              : "Como foi sua experiência?"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {professionalName && (
            <p className="text-xs text-center text-muted-foreground">
              Avalie o atendimento de <strong>{professionalName}</strong>
            </p>
          )}

          {/* Score selector */}
          <div className="space-y-2">
            <div className="flex justify-between px-1">
              <span className="text-[10px] text-muted-foreground">Improvável</span>
              <span className="text-[10px] text-muted-foreground">Muito provável</span>
            </div>
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, i) => {
                const isSelected = score === i;
                const getColor = () => {
                  if (!isSelected) return "bg-muted/50 text-muted-foreground hover:bg-muted";
                  if (i <= 6) return "bg-destructive text-destructive-foreground";
                  if (i <= 8) return "bg-yellow-500 text-foreground";
                  return "bg-primary text-primary-foreground";
                };
                return (
                  <button
                    key={i}
                    onClick={() => setScore(i)}
                    className={`h-10 rounded-lg text-sm font-bold transition-all ${getColor()}`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
            {score !== null && (
              <p className="text-xs text-center font-medium text-foreground">
                {SCORE_LABELS[score]}
              </p>
            )}
          </div>

          {/* Optional feedback */}
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Conte-nos mais sobre sua experiência (opcional)..."
            className="bg-muted border-border text-sm resize-none"
            rows={3}
          />

          <Button
            className="w-full bg-primary text-primary-foreground"
            onClick={handleSubmit}
            disabled={score === null || loading}
          >
            {loading ? "Enviando..." : (
              <>
                <Send size={14} className="mr-2" /> Enviar Avaliação
              </>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground">
            Sua avaliação é obrigatória e confidencial.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
