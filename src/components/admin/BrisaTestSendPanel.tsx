import { useState } from "react";
import { Send, Loader2, CheckCircle2, XCircle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Result = {
  ok?: boolean;
  number?: string;
  instance?: string;
  sendStatus?: number;
  sendBody?: string;
  sendError?: string;
  connectionState?: { status: number; body: string; error?: string };
  hint?: string;
  error?: string;
  missing?: Record<string, boolean>;
};

const DEFAULT_TEXT =
  "✅ Teste Brisa 2.0 — Dr. Edilson, sistema Planta y Raiz online. Canal WhatsApp autônomo confirmado. Se receber, responda OK. 🌿";

export default function BrisaTestSendPanel() {
  const [number, setNumber] = useState("5511987131241");
  const [text, setText] = useState(DEFAULT_TEXT);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-brisa-test-send", {
        body: { number: number.replace(/\D/g, ""), text },
      });
      if (error) {
        // Try to read the real HTTP body (functions.invoke masks it as generic non-2xx).
        const details =
          (error as any).context && typeof (error as any).context.text === "function"
            ? await (error as any).context.text().catch(() => "")
            : error.message;
        setResult({ ok: false, error: details || error.message });
        toast.error("Falha ao disparar teste Brisa");
      } else {
        setResult(data as Result);
        (data as Result)?.ok
          ? toast.success(`Mensagem enviada para ${(data as Result).number}`)
          : toast.warning("Envio não confirmado — veja diagnóstico");
      }
    } catch (e: any) {
      setResult({ ok: false, error: e?.message ?? String(e) });
      toast.error(e?.message ?? "Erro inesperado");
    } finally {
      setSending(false);
    }
  };

  const state = result?.connectionState?.body ?? "";
  const stateLabel =
    !result ? null :
    state.includes('"state":"open"') ? { label: "Conectado", color: "text-emerald-400" } :
    state.includes('"state":"connecting"') ? { label: "Conectando", color: "text-yellow-400" } :
    state.includes('"state":"close"') ? { label: "Desconectado", color: "text-red-400" } :
    { label: "Desconhecido", color: "text-muted-foreground" };

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
      <header className="flex items-center gap-2">
        <Send className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Teste Brisa · WhatsApp</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          Auditoria + disparo controlado (admin)
        </span>
      </header>

      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Número (E.164, só dígitos)</span>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="5511987131241"
            className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Mensagem</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <button
        onClick={send}
        disabled={sending || !number || !text}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? "Enviando..." : "Enviar teste para Dr. Edilson"}
      </button>

      {result && (
        <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            {result.ok ? (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Envio confirmado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-400">
                <XCircle className="w-4 h-4" /> Falhou
              </span>
            )}
            {stateLabel && (
              <span className={`inline-flex items-center gap-1 ${stateLabel.color}`}>
                <Activity className="w-4 h-4" /> Instância: {stateLabel.label}
              </span>
            )}
            {result.instance && (
              <span className="text-muted-foreground">
                Instância Evolution: <code className="font-mono">{result.instance}</code>
              </span>
            )}
            {typeof result.sendStatus === "number" && (
              <span className="text-muted-foreground">HTTP {result.sendStatus}</span>
            )}
          </div>

          {result.missing && (
            <div className="text-red-400">
              Config faltando: {Object.entries(result.missing)
                .filter(([, v]) => v)
                .map(([k]) => k)
                .join(", ")}
            </div>
          )}

          {result.hint && <p className="text-yellow-300">💡 {result.hint}</p>}

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Diagnóstico completo</summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed">
{JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
