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
      return (
        <div className="min-h-dvh bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertTriangle size={48} className="text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-display font-black text-foreground mb-2">Algo deu errado</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <Button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground rounded-xl font-bold">
              Recarregar Página
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
