import { Component, lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type LazyModule<T extends ComponentType<any>> = Promise<{ default: T }>;

interface LazyRecoveryOptions<T extends ComponentType<any>> {
  fallback?: T;
  sourceRef?: string;
}

const REPORTED_ERRORS = new Set<string>();
const CHUNK_ERROR_PATTERNS = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "ChunkLoadError",
  "Loading chunk",
  "Failed to load module script",
];

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error("Unknown runtime error");
  }
}

export function isChunkLoadError(error: unknown): boolean {
  const normalized = toError(error);
  const text = `${normalized.name} ${normalized.message} ${normalized.stack ?? ""}`;
  return CHUNK_ERROR_PATTERNS.some((pattern) => text.includes(pattern));
}

export function reportFrontendRuntimeError(
  error: unknown,
  meta: { sourceRef?: string; phase?: string; context?: Record<string, unknown> } = {}
) {
  if (typeof window === "undefined") return;

  const normalized = toError(error);
  const fingerprint = `${meta.sourceRef ?? window.location.pathname}|${normalized.name}|${normalized.message.slice(0, 180)}`;
  if (REPORTED_ERRORS.has(fingerprint)) return;
  REPORTED_ERRORS.add(fingerprint);

  const payload = {
    source: "frontend",
    source_ref: meta.sourceRef ?? window.location.pathname,
    error_type: normalized.name,
    error_message: normalized.message,
    stack: normalized.stack,
    context: {
      phase: meta.phase ?? "runtime",
      chunk_load_error: isChunkLoadError(normalized),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...meta.context,
    },
  };

  try {
    // Nota: o insert direto em `error_logs` é bloqueado por RLS para visitantes
    // (401). O registro server-side é feito exclusivamente pela edge function
    // `ai-error-gateway`, que usa service role + deduplicação.



    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-error-gateway`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // noop
  }
}

export function RecoverableRender({
  fallback,
  sourceRef,
  children,
}: {
  fallback?: ReactNode;
  sourceRef: string;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={fallback ?? null}>
      <SafeRenderBoundary sourceRef={sourceRef} fallback={fallback}>
        {children}
      </SafeRenderBoundary>
    </Suspense>
  );
}

class SafeRenderBoundary extends Component<
  { children: ReactNode; sourceRef: string; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    reportFrontendRuntimeError(error, {
      sourceRef: this.props.sourceRef,
      phase: "component-render",
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}

function RouteRecoveryFallback() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <AlertTriangle className="mx-auto text-destructive" size={40} />
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-black text-foreground">Falha ao carregar esta tela</h1>
          <p className="text-sm text-muted-foreground">
            Detectamos uma instabilidade de carregamento e já registramos um alerta automático.
          </p>
        </div>
        <Button onClick={() => window.location.reload()} className="rounded-xl font-bold">
          <RefreshCw className="mr-2" size={16} /> Recarregar agora
        </Button>
      </div>
    </div>
  );
}

export function lazyWithRecovery<T extends ComponentType<any>>(
  importer: () => LazyModule<T>,
  options: LazyRecoveryOptions<T> = {}
): LazyExoticComponent<T> {
  const fallback = options.fallback ?? (RouteRecoveryFallback as unknown as T);

  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      reportFrontendRuntimeError(error, {
        sourceRef: options.sourceRef,
        phase: "lazy-import",
      });

      return { default: fallback };
    }
  });
}
