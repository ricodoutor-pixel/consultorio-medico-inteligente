import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Envia ao AI Error Gateway (autocura) — fire-and-forget, sem auth
    try {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-error-gateway`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          source: "frontend",
          source_ref: window.location.pathname,
          error_type: error.name,
          error_message: error.message,
          stack: error.stack,
          context: {
            componentStack: info?.componentStack?.slice(0, 2000),
            userAgent: navigator.userAgent,
            url: window.location.href,
          },
        }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* noop */ }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error) {
        console.error("[PlantaYRaiz ErrorBoundary caught runtime error]:", this.state.error);
      }
      const errorMsg = this.state.error?.message || (this.state.error ? String(this.state.error) : "Erro inesperado.");
      const stack = this.state.error?.stack;

      return (
        <div className="min-h-dvh bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-lg w-full">
            <AlertTriangle size={48} className="text-destructive mx-auto mb-4 animate-pulse" />
            <h1 className="text-2xl font-display font-black text-foreground mb-2">Algo deu errado</h1>
            <p className="text-muted-foreground mb-4 text-sm">
              Ocorreu um erro inesperado. Tente recarregar a página ou voltar ao início.
            </p>

            {/* Diagnóstico visível imediatamente para depuração e suporte */}
            <div className="mb-6 text-left bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs text-destructive">
              <p className="font-bold text-[11px] uppercase tracking-wider text-destructive mb-1">
                Diagnóstico do Erro:
              </p>
              <p className="font-mono break-all text-[12px] font-semibold text-foreground select-all">
                {errorMsg}
              </p>
              {stack && (
                <details open className="mt-2 text-[10px]">
                  <summary className="cursor-pointer font-bold text-destructive hover:underline">
                    Rastreamento (stack trace)
                  </summary>
                  <pre className="mt-1 font-mono text-[9px] text-destructive/80 whitespace-pre-wrap max-h-40 overflow-y-auto select-all">
                    {stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="rounded-xl font-bold"
              >
                Tentar Novamente
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="bg-primary text-primary-foreground rounded-xl font-bold"
              >
                Recarregar Página
              </Button>
              <Button
                variant="ghost"
                onClick={() => { window.location.href = "/"; }}
                className="rounded-xl font-bold text-xs"
              >
                Ir para o Início
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
