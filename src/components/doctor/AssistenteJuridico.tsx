import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Scale, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { functionErrorMessage } from "@/lib/function-error";

interface Usage {
  limit: number;
  used: number;
  remaining: number;
  paid: boolean;
}

const SUGGESTIONS = [
  "Posso divulgar o preço da consulta nas redes sociais segundo o CFM?",
  "Quais cuidados de LGPD preciso ter ao guardar exames enviados pelo WhatsApp?",
  "Que exigências a Anvisa faz para prescrever produto de cannabis?",
  "O que o prontuário da teleconsulta precisa registrar?",
];

/** Assistente jurídico do médico: 10 perguntas por dia nos planos pagos (função doctor-legal-assistant). */
export function AssistenteJuridico() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadUsage = useCallback(async () => {
    const { data } = await supabase.functions.invoke("doctor-legal-assistant", { body: { action: "status" } });
    if (data && typeof data.limit === "number") setUsage(data as Usage);
  }, []);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const ask = async (preset?: string) => {
    const question = (preset ?? input).trim();
    if (question.length < 5) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    if (!preset) setInput("");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("doctor-legal-assistant", { body: { question } });
    setLoading(false);
    if (error || !data?.answer) {
      const msg = await functionErrorMessage(error, "O assistente não respondeu agora. Tente de novo.");
      setMessages((m) => [...m, { role: "assistant", text: `⚠️ ${msg}` }]);
      toast.error(msg);
    } else {
      setMessages((m) => [...m, { role: "assistant", text: String(data.answer) }]);
    }
    void loadUsage();
  };

  const blocked = usage ? !usage.paid || usage.remaining <= 0 : false;

  return (
    <Card className="border-indigo-500/30">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-600" /> Assistente Jurídico do Médico
          </CardTitle>
          {usage && usage.paid && (
            <Badge variant="outline" className="border-indigo-500 text-indigo-700">
              Restam {usage.remaining} de {usage.limit} hoje
            </Badge>
          )}
        </div>
        <CardDescription>
          Dúvidas sobre ética médica (CFM), telemedicina, publicidade, LGPD, prontuário e prescrição de cannabis (Anvisa).
          Orientação informativa: para um caso concreto, procure um advogado com OAB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {usage && !usage.paid && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            O assistente jurídico faz parte dos planos de assinatura (a partir do VIP). Assine na aba de planos para liberar
            10 perguntas por dia.
          </p>
        )}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Button key={s} size="sm" variant="outline" className="h-auto whitespace-normal text-left" disabled={blocked || loading} onClick={() => void ask(s)}>
                {s}
              </Button>
            ))}
          </div>
        )}
        <div className="space-y-3 max-h-[480px] overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white"
                  : "mr-auto max-w-[95%] rounded-xl border border-border bg-muted/40 px-3 py-2"
              }
            >
              {m.role === "user" ? (
                m.text
              ) : (
                <div className="text-sm text-foreground [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_strong]:font-bold [&_a]:underline [&_a]:break-all">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Analisando a norma...
            </p>
          )}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva sua dúvida (sem nome ou dados de paciente)"
            rows={2}
            maxLength={2000}
            disabled={blocked}
          />
          <Button onClick={() => void ask()} disabled={blocked || loading || input.trim().length < 5} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
