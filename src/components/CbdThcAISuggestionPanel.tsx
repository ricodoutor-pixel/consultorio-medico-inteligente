import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Brain, Leaf, Pill, AlertTriangle, Sparkles, ExternalLink, FileText, Loader2, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Suggestion {
  ratio: string;
  cbdMg: number;
  thcMg: number;
  route: string;
  frequency: string;
  evidence: string;
  note: string;
  prescriptionType: "B" | "A";
}

const CONDITION_SUGGESTIONS: Record<string, Suggestion> = {
  "F41.1": {
    ratio: "20:1 (CBD:THC)",
    cbdMg: 25,
    thcMg: 1.25,
    route: "Sublingual (Óleo)",
    frequency: "2x/dia",
    evidence: "Nível B — Meta-análise 2024 (Bonaccorso et al.)",
    note: "Iniciar com 10mg CBD e titular a cada 5 dias. THC abaixo de 0.2%, dispensa Receita A.",
    prescriptionType: "B",
  },
  "F32.0": {
    ratio: "10:1 (CBD:THC)",
    cbdMg: 50,
    thcMg: 5,
    route: "Sublingual (Óleo)",
    frequency: "2x/dia",
    evidence: "Nível C — Ensaio clínico fase II (USP 2023)",
    note: "THC > 0.2% — requer Receita Tipo A. Monitorar humor nas primeiras 2 semanas.",
    prescriptionType: "A",
  },
  "R52": {
    ratio: "1:1 (CBD:THC)",
    cbdMg: 10,
    thcMg: 10,
    route: "Sublingual (Óleo) ou Vaporização",
    frequency: "A cada 8h",
    evidence: "Nível A — RCT multicêntrico (Aviram & Samuelly 2017)",
    note: "Proporção equilibrada para dor crônica. THC elevado — Receita A obrigatória.",
    prescriptionType: "A",
  },
  "G47.0": {
    ratio: "5:1 (CBD:THC)",
    cbdMg: 50,
    thcMg: 10,
    route: "Via Oral (Cápsulas)",
    frequency: "1x à noite",
    evidence: "Nível B — Revisão sistemática (Shannon 2019)",
    note: "Dose noturna única. THC auxilia indução do sono. Receita A necessária.",
    prescriptionType: "A",
  },
  "M79.7": {
    ratio: "3:1 (CBD:THC)",
    cbdMg: 30,
    thcMg: 10,
    route: "Sublingual + Tópico",
    frequency: "3x/dia",
    evidence: "Nível B — Estudo observacional (Sagy et al. 2019)",
    note: "Combinar óleo sublingual com creme tópico em pontos de dor. Receita A.",
    prescriptionType: "A",
  },
  "G40.0": {
    ratio: "Pure CBD (sem THC)",
    cbdMg: 200,
    thcMg: 0,
    route: "Via Oral",
    frequency: "2x/dia",
    evidence: "Nível A — Epidiolex trials (Devinsky et al. 2018)",
    note: "Dose alta de CBD isolado. Sem THC — Receita B padrão. Monitorar enzimas hepáticas.",
    prescriptionType: "B",
  },
};

const CONDITIONS = [
  { code: "F41.1", name: "Ansiedade generalizada" },
  { code: "F32.0", name: "Episódio depressivo leve" },
  { code: "R52", name: "Dor crônica" },
  { code: "G47.0", name: "Insônia" },
  { code: "M79.7", name: "Fibromialgia" },
  { code: "G40.0", name: "Epilepsia" },
];

interface Props {
  onApplySuggestion?: (suggestion: Suggestion) => void;
}

export const CbdThcAISuggestionPanel = ({ onApplySuggestion }: Props) => {
  const [selectedCondition, setSelectedCondition] = useState("");
  const [patientWeight, setPatientWeight] = useState(70);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loadingTitration, setLoadingTitration] = useState(false);
  const [titrationPlan, setTitrationPlan] = useState<string | null>(null);

  const generateSuggestion = () => {
    const s = CONDITION_SUGGESTIONS[selectedCondition];
    if (!s) return;
    // Adjust dosage by weight (rough: +10% per 10kg above 70)
    const weightFactor = 1 + (patientWeight - 70) * 0.01;
    setSuggestion({
      ...s,
      cbdMg: Math.round(s.cbdMg * weightFactor),
      thcMg: Math.round(s.thcMg * weightFactor * 10) / 10,
    });
    setTitrationPlan(null); // reset old plan
  };

  const generateTitrationPlan = async () => {
    if (!suggestion || !selectedCondition) return;
    setLoadingTitration(true);
    setTitrationPlan(null);
    try {
      const conditionName = CONDITIONS.find(c => c.code === selectedCondition)?.name || selectedCondition;
      const { data, error } = await supabase.functions.invoke("clinical-copilot", {
        body: {
          action: "titration_schedule",
          patientInfo: `${conditionName} (Alvo: ${suggestion.ratio})`,
          notes: `${patientWeight}kg - Dose Base Recomendada: ${suggestion.cbdMg}mg CBD / ${suggestion.thcMg}mg THC`,
        },
      });

      if (error) throw error;
      if (data?.success && data?.result) {
        setTitrationPlan(data.result);
      } else {
        setTitrationPlan("Erro ao gerar plano via IA.");
      }
    } catch (err) {
      console.error(err);
      setTitrationPlan("Falha na comunicação com o Copiloto Clínico.");
    } finally {
      setLoadingTitration(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain size={16} className="text-primary" />
        <span className="text-xs font-bold text-foreground">Sugestão IA — CBD/THC</span>
        <Badge variant="outline" className="text-[9px] ml-auto">CFM 2.454/2026</Badge>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">Condição Clínica (CID-10)</label>
        <Select value={selectedCondition} onValueChange={setSelectedCondition}>
          <SelectTrigger className="bg-muted border-border text-xs h-8">
            <SelectValue placeholder="Selecionar condição..." />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map(c => (
              <SelectItem key={c.code} value={c.code} className="text-xs">
                {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">
          Peso do Paciente: {patientWeight}kg
        </label>
        <Slider
          value={[patientWeight]}
          onValueChange={v => setPatientWeight(v[0])}
          min={30} max={150} step={1}
        />
      </div>

      <Button
        size="sm"
        onClick={generateSuggestion}
        disabled={!selectedCondition}
        className="w-full bg-primary text-primary-foreground text-xs"
      >
        <Sparkles size={12} className="mr-1" /> Gerar Sugestão IA
      </Button>

      {suggestion && (
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground flex items-center gap-1">
                <Leaf size={14} className="text-primary" /> {suggestion.ratio}
              </span>
              <Badge
                variant={suggestion.prescriptionType === "A" ? "destructive" : "outline"}
                className="text-[9px]"
              >
                {suggestion.prescriptionType === "A" ? (
                  <><AlertTriangle size={8} className="mr-1" /> Receita A</>
                ) : (
                  <><FileText size={8} className="mr-1" /> Receita B</>
                )}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-background/50 p-1.5 rounded">
                <span className="text-muted-foreground">CBD:</span>
                <span className="font-bold text-foreground ml-1">{suggestion.cbdMg}mg</span>
              </div>
              <div className="bg-background/50 p-1.5 rounded">
                <span className="text-muted-foreground">THC:</span>
                <span className="font-bold text-foreground ml-1">{suggestion.thcMg}mg</span>
              </div>
              <div className="bg-background/50 p-1.5 rounded">
                <span className="text-muted-foreground">Via:</span>
                <span className="font-bold text-foreground ml-1">{suggestion.route}</span>
              </div>
              <div className="bg-background/50 p-1.5 rounded">
                <span className="text-muted-foreground">Freq:</span>
                <span className="font-bold text-foreground ml-1">{suggestion.frequency}</span>
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground italic">
              📚 {suggestion.evidence}
            </p>
            <p className="text-[10px] text-foreground">
              💡 {suggestion.note}
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <Button
                size="sm"
                variant="default"
                className="w-full text-[11px] h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={generateTitrationPlan}
                disabled={loadingTitration}
              >
                {loadingTitration ? <Loader2 size={12} className="animate-spin mr-1" /> : <CalendarClock size={12} className="mr-1" />}
                {loadingTitration ? "Gerando Tabela..." : "Gerar Plano de Titulação (IA)"}
              </Button>
              
              {titrationPlan && (
                <div className="bg-background/80 p-2 rounded text-[10px] prose prose-sm prose-p:text-[10px] prose-headings:text-xs max-w-none border border-indigo-500/20">
                  <ReactMarkdown>{titrationPlan}</ReactMarkdown>
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-[10px] h-7"
                  onClick={() => onApplySuggestion?.(suggestion)}
                >
                  <Pill size={10} className="mr-1" /> Aplicar na Prescrição
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[10px] h-7"
                  onClick={() => window.open("https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cannabis", "_blank")}
                >
                  <ExternalLink size={10} className="mr-1" /> ANVISA
                </Button>
              </div>
            </div>

            <p className="text-[8px] text-muted-foreground bg-background/30 p-1.5 rounded">
              ⚖️ CFM 2.454/2026: Sugestões de IA são auxiliares. A decisão clínica final é exclusiva do médico.
              O profissional deve revisar e ajustar a dosagem conforme avaliação individual do paciente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
