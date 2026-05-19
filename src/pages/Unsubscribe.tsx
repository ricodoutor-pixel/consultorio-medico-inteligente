import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

type State =
  | { status: "loading" }
  | { status: "valid" }
  | { status: "already" }
  | { status: "invalid"; message: string }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ status: "invalid", message: "Link sem token. Use o link recebido no e-mail." });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.valid === true) setState({ status: "valid" });
        else if (data?.reason === "already_unsubscribed") setState({ status: "already" });
        else setState({ status: "invalid", message: data?.error ?? "Token inválido ou expirado." });
      } catch {
        setState({ status: "invalid", message: "Não foi possível validar o link agora." });
      }
    })();
  }, [token]);

  async function confirm() {
    setState({ status: "submitting" });
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) setState({ status: "success" });
      else if (data?.reason === "already_unsubscribed") setState({ status: "already" });
      else setState({ status: "error", message: data?.error ?? "Falha ao processar o pedido." });
    } catch {
      setState({ status: "error", message: "Sem conexão. Tente novamente." });
    }
  }

  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4 py-10">
      <Helmet>
        <title>Cancelar inscrição · Planta y Raiz</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <Leaf className="h-6 w-6 text-primary" aria-hidden />
          <span className="text-sm font-semibold tracking-wide uppercase text-primary">
            Planta y Raiz
          </span>
        </div>

        {state.status === "loading" && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Validando seu link…
          </div>
        )}

        {state.status === "valid" && (
          <>
            <h1 className="text-2xl font-bold mb-3">Cancelar inscrição</h1>
            <p className="text-muted-foreground mb-6">
              Confirme abaixo para não receber mais e-mails da Planta y Raiz neste endereço.
              E-mails essenciais sobre sua conta (segurança, pagamentos) continuam sendo enviados.
            </p>
            <Button onClick={confirm} className="w-full" size="lg">
              Confirmar cancelamento
            </Button>
          </>
        )}

        {state.status === "submitting" && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Processando…
          </div>
        )}

        {state.status === "success" && (
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" aria-hidden />
            <h1 className="text-2xl font-bold mb-2">Pronto!</h1>
            <p className="text-muted-foreground">
              Você foi removido(a) da nossa lista. Sentiremos sua falta. 🌱
            </p>
          </div>
        )}

        {state.status === "already" && (
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" aria-hidden />
            <h1 className="text-2xl font-bold mb-2">Já cancelado</h1>
            <p className="text-muted-foreground">Este e-mail já estava fora da nossa lista.</p>
          </div>
        )}

        {(state.status === "invalid" || state.status === "error") && (
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" aria-hidden />
            <h1 className="text-2xl font-bold mb-2">Não foi possível continuar</h1>
            <p className="text-muted-foreground">{state.message}</p>
          </div>
        )}
      </div>
    </main>
  );
}
