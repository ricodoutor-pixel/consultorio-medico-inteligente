import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BrainCircuit, Copy, FileText, Loader2, Pill, Search, Send, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { functionErrorMessage } from "@/lib/function-error";

type CopilotAction = "ask" | "check_interactions" | "titration_schedule" | "format_soap";

const TOOLS: { action: CopilotAction; label: string; icon: typeof Search; placeholder: string; field: "notes" | "patientInfo" }[] = [
  {
    action: "ask",
    label: "Pergunta clínica",
    icon: Search,
    placeholder: "Ex.: Qual a evidência de CBD na dor neuropática diabética? Há ensaios clínicos randomizados?",
    field: "notes",
  },
  {
    action: "check_interactions",
    label: "Interações",
    icon: Pill,
    placeholder: "Medicamentos em uso contínuo. Ex.: varfarina 5 mg, sertralina 50 mg, clonazepam 2 mg",
    field: "notes",
  },
  {
    action: "titration_schedule",
    label: "Titulação",
    icon: TrendingUp,
    placeholder: "Condição/sintoma, peso, idade, formulação disponível e medicamentos em uso",
    field: "notes",
  },
  {
    action: "format_soap",
    label: "Organizar SOAP",
    icon: FileText,
    placeholder: "Cole suas anotações soltas da consulta; o copiloto organiza em S/O/A/P sem inventar dados.",
    field: "notes",
  },
];

interface Usage {
  limit: number;
  used: number;
  remaining: number;
  paid: boolean;
}

/**
 * Copiloto de evidências real (função clinical-copilot): busca no PubMed, cita só PMIDs conferidos e
 * respeita o limite diário do plano. Nunca devolve respostas prontas por palavra-chave.
 */
export function CopilotoEvidencias() {
  const [tool, setTool] = useState<CopilotAction>("ask");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const current = TOOLS.find((t) => t.action === tool) ?? TOOLS[0];

  const loadUsage = useCallback(async () => {
    const { data } = await supabase.functions.invoke("clinical-copilot", { body: { action: "status" } });
    if (data && typeof data.limit === "number") setUsage(data as Usage);
  }, []);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  const run = async () => {
    const text = input.trim();
    if (text.length < 5) {
      toast.error("Escreva um pouco mais de detalhe.");
      return;
    }
    setLoading(true);
    setAnswer("");
    const { data, error } = await supabase.functions.invoke("clinical-copilot", {
      body: { action: tool, [current.field]: text },
    });
    setLoading(false);
    if (error || !data?.result) {
      toast.error(await functionErrorMessage(error, "O copiloto não respondeu agora. Tente de novo."));
      void loadUsage();
      return;
    }
    setAnswer(String(data.result));
    void loadUsage();
  };

  return (
    <Card className="border-emerald-500/30">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-emerald-600" /> Copiloto de Evidências (PubMed)
          </CardTitle>
          {usage && (
            <Badge variant="outline" className="border-emerald-500 text-emerald-700">
              Hoje: {usage.used}/{usage.limit} consultas
            </Badge>
          )}
        </div>
        <CardDescription>
          Busca estudos no PubMed a cada pergunta e mostra só referências conferidas pelo número PMID. É apoio à decisão:
          a conduta e a prescrição são sempre do médico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TOOLS.map(({ action, label, icon: Icon }) => (
            <Button
              key={action}
              size="sm"
              variant={tool === action ? "default" : "outline"}
              onClick={() => {
                setTool(action);
                setAnswer("");
              }}
            >
              <Icon className="h-4 w-4 mr-1" /> {label}
            </Button>
          ))}
        </div>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={current.placeholder}
          rows={4}
          maxLength={6000}
        />
        <p className="text-[11px] text-muted-foreground">
          Não escreva nome, CPF ou telefone do paciente: use idade, sexo e dados clínicos.
        </p>
        <Button onClick={() => void run()} disabled={loading || (usage?.remaining ?? 1) <= 0}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          {loading ? "Pesquisando estudos..." : "Consultar copiloto"}
        </Button>
        {usage && usage.remaining <= 0 && (
          <p className="text-sm text-amber-700">Limite de hoje atingido. Renova à meia-noite (horário de Brasília).</p>
        )}
        {answer && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
            <div className="text-sm text-foreground [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_strong]:font-bold [&_a]:underline [&_a]:break-all">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void navigator.clipboard.writeText(answer).then(
                  () => toast.success("Resposta copiada."),
                  () => toast.error("Não foi possível copiar."),
                )
              }
            >
              <Copy className="h-4 w-4 mr-1" /> Copiar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
