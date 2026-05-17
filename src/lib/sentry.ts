// Lightweight Sentry bootstrap — fetches DSN from edge function and initializes once.
// DSN is public by design (safe in browser bundles).
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";

let initialized = false;

export async function initSentry() {
  if (initialized || typeof window === "undefined") return;
  try {
    const { data, error } = await supabase.functions.invoke("sentry-config");
    if (error || !data?.dsn) return;
    // Validate DSN format (must be a URL like https://key@oXXX.ingest.sentry.io/YYY).
    // Auth tokens (sntryu_...) are NOT valid DSNs and would throw at init.
    if (!/^https?:\/\/.+@.+\/\d+$/.test(data.dsn)) {
      console.warn("[sentry] invalid DSN format, skipping init");
      return;
    }
    Sentry.init({
      dsn: data.dsn,
      environment: data.environment ?? "production",
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      beforeSend(event) {
        // Drop noisy chunk-load errors that we already auto-recover from
        const msg = event.exception?.values?.[0]?.value || "";
        if (msg.includes("Failed to fetch dynamically imported module")) return null;
        if (msg.includes("Importing a module script failed")) return null;
        return event;
      },
    });
    initialized = true;
    console.info("[sentry] initialized");

    // Drena breadcrumbs e erros capturados antes do React montar (escudo anti-tela-preta)
    try {
      const crumbs = (window as any).__pyr_breadcrumbs as Array<{ t: number; type: string; data: any }> | undefined;
      if (Array.isArray(crumbs)) {
        crumbs.forEach((c) =>
          Sentry.addBreadcrumb({
            category: `boot.${c.type}`,
            level: c.type === "error" ? "error" : "info",
            message: typeof c.data === "object" ? JSON.stringify(c.data) : String(c.data),
            timestamp: c.t / 1000,
          })
        );
      }
      const early = (window as any).__pyr_earlyErrors as Array<{ source: string; message: string; stack?: string }> | undefined;
      if (Array.isArray(early)) {
        early.forEach((e) => {
          const err = new Error(`[early/${e.source}] ${e.message}`);
          if (e.stack) err.stack = e.stack;
          Sentry.captureException(err);
        });
      }
    } catch (_) {
      /* noop */
    }
  } catch (e) {
    console.warn("[sentry] init failed:", e);
  }
}

export { Sentry };
