import { useEffect, useState } from "react";
import { Copy, Loader2, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { functionErrorMessage } from "@/lib/function-error";
import {
  DOCTOR_PRO_TOOLS, doctorPlan, type DoctorProTool,
} from "../../../supabase/functions/_shared/doctor-plans";

interface ToolStatus {
  plan: string;
  planName: string;
  unlocked: DoctorProTool[];
  limit: number;
  used: number;
  remaining: number;
}

const PLACEHOLDER: Record<DoctorProTool, string> = {
  interacoes: "Ex.: paciente 62 anos em uso de clobazam 10 mg, varfarina 5 mg e sertralina 50 mg. Planejo CBD 50 mg/dia.",
  laudo_anvisa: "Ex.: dor neuropática pós-herpética (CID B02.2) há 2 anos; falha com pregabalina e amitriptilina; proposta de óleo CBD 3000 mg/30 mL...",
  resumo_paciente: "Cole o histórico, exames e anotações (sem nome, CPF ou telefone do paciente).",
  conteudo_etico: "Ex.: tema 'insônia e higiene do sono', público adulto, tom acolhedor.",
  plano_terapeutico: "Ex.: fibromialgia, 45 anos, sono ruim, EVA 8/10, sem uso de psicotrópicos, hipertensa controlada.",
};

/** Ferramentas exclusivas dos planos Ouro → Black. O servidor confere o plano a cada uso. */
export function DoctorProTools({ onSeePlans }: { onSeePlans?: () => void }) {
  const [status, setStatus] = useState<ToolStatus | null>(null);
  const [tool, setTool] = useState<DoctorProTool>("interacoes");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.functions.invoke("doctor-pro-tools", { body: { action: "status" } }).then(({ data }) => {
      if (data && Array.isArray(data.unlocked)) setStatus(data as ToolStatus);
    });
  }, []);

  const unlocked = status?.unlocked.includes(tool) ?? false;
  const min = doctorPlan(DOCTOR_PRO_TOOLS[tool].minPlan);

  const run = async () => {
    setBusy(true);
    setAnswer("");
    const { data, error } = await supabase.functions.invoke("doctor-pro-tools", { body: { tool, input } });
    setBusy(false);
    if (error || !data?.answer) {
      toast.error(await functionErrorMessage(error, "Não foi possível usar a ferramenta agora."));
      return;
    }
    setAnswer(data.answer);
    setStatus((s) => (s ? { ...s, used: data.used, remaining: data.remaining } : s));
  };

  return (
    <Card className="border-violet-500/30">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="inline-flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" /> Ferramentas exclusivas do plano
          </CardTitle>
          {status && (
            <Badge variant="outline">
              {status.planName} · {status.limit > 0 ? `${status.used}/${status.limit} hoje` : "a partir do Ouro"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(DOCTOR_PRO_TOOLS) as DoctorProTool[]).map((t) => {
            const open = status?.unlocked.includes(t);
            const p = doctorPlan(DOCTOR_PRO_TOOLS[t].minPlan);
            return (
              <button
                key={t}
                type="button"
                onClick={() => { setTool(t); setAnswer(""); }}
                className={`text-left rounded-xl border p-3 transition-colors ${tool === t ? "border-violet-500 bg-violet-500/10" : "border-border hover:border-violet-500/50"}`}
              >
                <p className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
                  {!open && <Lock className="h-3.5 w-3.5 text-muted-foreground" />} {DOCTOR_PRO_TOOLS[t].title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{DOCTOR_PRO_TOOLS[t].description}</p>
                <p className="text-[10px] font-bold text-violet-500 mt-1">Plano {p.name} em diante</p>
              </button>
            );
          })}
        </div>

        {unlocked ? (
          <>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={PLACEHOLDER[tool]}
              rows={5}
              maxLength={8000}
            />
            <Button onClick={() => void run()} disabled={busy || input.trim().length < 10}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar {DOCTOR_PRO_TOOLS[tool].title.toLowerCase()}
            </Button>
            {answer && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText(answer); toast.success("Copiado!"); }}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">{answer}</pre>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">{DOCTOR_PRO_TOOLS[tool].title}</strong> faz parte do plano {min.name} (R$ {min.priceBrl.toLocaleString("pt-BR")}/mês) em diante.
            {onSeePlans && (
              <Button size="sm" variant="outline" className="ml-2" onClick={onSeePlans}>Ver planos</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
