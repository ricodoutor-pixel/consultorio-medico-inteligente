import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Loader2, Pill, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

export const DrugInteractionChecker = () => {
  const [medications, setMedications] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const checkInteractions = async () => {
    if (!medications.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("clinical-copilot", {
        body: {
          action: "check_interactions",
          notes: medications,
        },
      });

      if (error) throw error;
      if (data?.success && data?.result) {
        setResult(data.result);
      } else {
        setResult("Não foi possível gerar a análise no momento.");
      }
    } catch (err) {
      console.error(err);
      setResult("Erro ao consultar o serviço de interações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-amber-500" />
        <span className="text-xs font-bold text-foreground">Interações P450</span>
        <Badge variant="outline" className="text-[9px] ml-auto">IA Copilot</Badge>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">
          Medicamentos em Uso (Alopatia)
        </label>
        <Textarea
          placeholder="Ex: Varfarina, Fluoxetina, Clobazam..."
          value={medications}
          onChange={(e) => setMedications(e.target.value)}
          className="text-xs min-h-[60px] bg-muted/50 border-border"
        />
      </div>

      <Button
        size="sm"
        onClick={checkInteractions}
        disabled={loading || !medications.trim()}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin mr-1" />
        ) : (
          <AlertTriangle size={12} className="mr-1" />
        )}
        {loading ? "Analisando Vias..." : "Analisar Risco de Interação"}
      </Button>

      {result && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-3 text-xs text-foreground prose prose-sm prose-p:text-xs prose-headings:text-sm prose-headings:mb-1 max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
            <p className="text-[8px] text-muted-foreground mt-3 pt-2 border-t border-border/50">
              ⚠️ Esta análise utiliza IA (Gemini) cruzando dados farmacológicos. O médico assistente deve validar as informações com literatura atualizada.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
