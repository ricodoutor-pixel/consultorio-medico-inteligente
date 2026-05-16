import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { publicChannel } from "@/lib/realtime-channels";
import { toast } from "sonner";

interface Args {
  onChange: () => void;
  onAlert?: (a: { kind: string; title: string; message: string; created_at: string }) => void;
}

/**
 * Subscribe admin dashboard to live database changes.
 * Triggers `onChange` (debounced 1500ms) to refetch dashboard data,
 * and `onAlert` for events that deserve a toast notification.
 */
export function useAdminRealtime({ onChange, onAlert }: Args) {
  const timer = useRef<number | null>(null);
  const queue = (reason: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      console.debug("[admin-realtime] refetch:", reason);
      onChange();
    }, 1500) as unknown as number;
  };

  useEffect(() => {
    const channel = supabase
      .channel(publicChannel("admin-pulse"))

      // Revenue / orders
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (p) => {
        queue("orders");
        if (p.eventType === "INSERT") toast.success("💰 Nova venda registrada", { description: `Pedido R$ ${(p.new as any)?.total ?? "?"}` });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orientacao_tecnica_orders" }, (p) => {
        queue("ot");
        if (p.eventType === "INSERT") toast.success("🩺 Nova Orientação Técnica", { description: `${(p.new as any)?.patient_name ?? "Paciente"} · R$ ${(p.new as any)?.amount ?? ""}` });
      })

      // Leads + queue
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (p) => {
        queue("leads");
        toast("✨ Novo lead", { description: `${(p.new as any)?.name ?? ""} · ${(p.new as any)?.source ?? ""}` });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "consultation_queue" }, () => queue("queue"))
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => queue("appointments"))

      // Audit
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_log" }, () => queue("audit"))

      // Alerts — CRITICAL
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "error_logs" }, (p) => {
        const row = p.new as any;
        const sev = String(row?.severity ?? "").toLowerCase();
        if (sev === "critical" || sev === "high" || sev === "error") {
          toast.error("🚨 Erro crítico detectado", { description: row?.message?.slice(0, 120) ?? "Veja /admin para detalhes" });
          onAlert?.({ kind: "error", title: `Erro ${sev}`, message: row?.message ?? "", created_at: row?.created_at ?? new Date().toISOString() });
        }
        queue("error_logs");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_provider_health" }, (p) => {
        const row = p.new as any;
        if (row?.status === "down" || row?.status === "degraded") {
          toast.error(`⛔ Pagamentos: ${row.provider} ${row.status}`, {
            description: `Latência ${row.latency_ms ?? "?"}ms · erro ${row.error_rate ?? "?"}%`,
            duration: 10000,
          });
          onAlert?.({ kind: "payment", title: `Pagamentos ${row.status}`, message: `${row.provider} · ${row.latency_ms ?? "?"}ms`, created_at: row?.checked_at ?? new Date().toISOString() });
        }
        queue("payment_health");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alert_history" }, (p) => {
        const row = p.new as any;
        toast.warning(`🔔 ${row?.title ?? "Alerta"}`, { description: row?.message ?? "" });
        onAlert?.({ kind: "alert", title: row?.title ?? "Alerta", message: row?.message ?? "", created_at: row?.created_at ?? new Date().toISOString() });
        queue("alert_history");
      })

      .subscribe((status) => {
        if (status === "SUBSCRIBED") console.info("[admin-realtime] LIVE");
      });

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
