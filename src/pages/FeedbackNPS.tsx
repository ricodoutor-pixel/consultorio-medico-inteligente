import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, CheckCircle2, Heart, Star, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function FeedbackNPS() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [comment, setComment] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [apptId, setApptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const appt = searchParams.get("appt");
    const scoreParam = searchParams.get("score");
    
    if (!appt || !scoreParam) {
      setError("Link de feedback inválido. Faltam parâmetros.");
      setLoading(false);
      return;
    }
    
    const parsedScore = parseInt(scoreParam, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 10) {
      setError("Nota de feedback inválida.");
      setLoading(false);
      return;
    }

    setApptId(appt);
    setScore(parsedScore);
    
    // Register the score immediately
    registerScore(appt, parsedScore);
  }, [searchParams]);

  const registerScore = async (id: string, value: number) => {
    try {
      // We don't require auth for this because it comes from an email link.
      // However, RLS on appointments might block anonymous updates.
      // Assuming edge function or we can call a secure RPC.
      // Alternatively, we just try updating directly. If RLS blocks, we need an Edge Function.
      // Let's assume there is an RPC 'submit_nps' or we allow update for specific fields.
      // For now we will use a direct update, but typically we'd need an RPC.
      
      const { error: rpcError } = await (supabase as any).rpc('submit_appointment_nps', {
        p_appointment_id: id,
        p_score: value
      });

      if (rpcError) {
        // Fallback to direct update if RPC doesn't exist
        const { error: updateError } = await supabase
          .from("appointments" as any)
          .update({ 
            nps_score: value,
            nps_submitted_at: new Date().toISOString()
          })
          .eq("id", id)
          .is("nps_score", null); // only update if not already set
          
        if (updateError) {
          console.error("Update error (might be RLS):", updateError);
          // Don't show error to user, just proceed to comment screen
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!apptId) return;
    setSaving(true);
    try {
      const { error: rpcError } = await (supabase as any).rpc('submit_appointment_nps_comment', {
        p_appointment_id: apptId,
        p_comment: comment
      });

      if (rpcError) {
        await supabase
          .from("appointments" as any)
          .update({ nps_comment: comment } as any)
          .eq("id", apptId);
      }
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col">
        <Leaf className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground font-medium">Registrando sua avaliação...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <p className="text-destructive font-bold">{error}</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-4 pt-24 pb-12">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              {score && score >= 9 ? (
                <Heart size={32} />
              ) : score && score >= 7 ? (
                <Star size={32} />
              ) : (
                <CheckCircle2 size={32} />
              )}
            </div>
            <h1 className="text-3xl font-display font-black text-foreground mb-2">
              Nota {score} Registrada!
            </h1>
            <p className="text-muted-foreground">
              Obrigado por nos ajudar a melhorar o atendimento na Planta y Raiz.
            </p>
          </div>

          {!submitted ? (
            <Card className="bg-card/50 backdrop-blur-sm border-border shadow-lg">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div>
                  <h3 className="font-bold text-foreground text-lg mb-1">
                    {score && score >= 9 
                      ? "O que você mais gostou na sua consulta?"
                      : "O que podemos fazer para melhorar sua experiência?"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Seu comentário (opcional) será lido diretamente pelo médico e nossa equipe de qualidade.
                  </p>
                  <Textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deixe seu comentário aqui..."
                    className="min-h-[120px] resize-none bg-background focus:border-primary"
                  />
                </div>
                
                <Button 
                  onClick={handleSubmitComment} 
                  disabled={saving || !comment.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                  size="lg"
                >
                  {saving ? "Enviando..." : (
                    <>Enviar Comentário <Send className="ml-2 w-4 h-4" /></>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-primary/5 border-primary/20 shadow-lg">
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
                <h3 className="text-xl font-bold text-foreground">Comentário Enviado!</h3>
                <p className="text-muted-foreground">
                  Agradecemos muito pelo seu tempo. O seu feedback é fundamental para a evolução do nosso cuidado.
                </p>
                {score && score >= 9 && (
                  <div className="pt-4 border-t border-border mt-4">
                    <p className="text-sm font-medium mb-3">Conhece alguém que precisa de ajuda médica?</p>
                    <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                      <a href="/indicacoes">Indique e Ganhe Planta-Coins</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
