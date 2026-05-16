import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";
import { exportCSV } from "@/lib/admin-export";

export type DrillSource =
  | "orders" | "ot_orders" | "leads" | "appointments"
  | "audit_log" | "error_logs" | "queue" | "notifications";

const PERIODS = [
  { key: "24h", label: "24h", hours: 24 },
  { key: "7d", label: "7 dias", hours: 168 },
  { key: "30d", label: "30 dias", hours: 720 },
  { key: "90d", label: "90 dias", hours: 2160 },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  source: DrillSource | null;
  title: string;
}

const SOURCE_CFG: Record<DrillSource, { table: string; cols: string; orderBy: string; columns: { key: string; label: string; fmt?: (v: any) => string }[] }> = {
  orders: {
    table: "orders",
    cols: "id,total,status,payment_method,created_at,user_id",
    orderBy: "created_at",
    columns: [
      { key: "created_at", label: "Quando", fmt: (v) => new Date(v).toLocaleString("pt-BR") },
      { key: "total", label: "Valor", fmt: (v) => `R$ ${Number(v).toFixed(2)}` },
      { key: "status", label: "Status" },
      { key: "payment_method", label: "Método" },
    ],
  },
  ot_orders: {
    table: "orientacao_tecnica_orders",
    cols: "id,patient_name,amount,status,payment_method,created_at,patient_whatsapp",
    orderBy: "created_at",
    columns: [
      { key: "created_at", label: "Quando", fmt: (v) => new Date(v).toLocaleString("pt-BR") },
      { key: "patient_name", label: "Paciente" },
      { key: "amount", label: "Valor", fmt: (v) => `R$ ${Number(v).toFixed(2)}` },
      { key: "status", label: "Status" },
      { key: "payment_method", label: "Método" },
    ],
  },
  leads: {
    table: "leads",
    cols: "id,name,source,lead_score,status,created_at,phone",
    orderBy: "created_at",
    columns: [
      { key: "created_at", label: "Quando", fmt: (v) => new Date(v).toLocaleString("pt-BR") },
      { key: "name", label: "Nome" },
      { key: "source", label: "Fonte" },
      { key: "lead_score", label: "Score" },
      { key: "status", label: "Status" },
    ],
  },
  appointments: {
    table: "appointments",
    cols: "id,status,scheduled_for,created_at,patient_id,doctor_id",
    orderBy: "created_at",
    columns: [
      { key: "created_at", label: "Criado", fmt: (v) => new Date(v).toLocaleString("pt-BR") },
      { key: "scheduled_for", label: "Agendado", fmt: (v) => v ? new Date(v).toLocaleString("pt-BR") : "—" },
      { key: "status", label: "Status" },
    ],
  },
  audit_log: {
    table: "audit_log",
    cols: "id,action,table_name,user_id,created_at,record_id",
    orderBy: "created_at",
    columns: [
      { key: "created_at", label: "Quando", fmt: (v) => new Date(v).toLocaleString("pt-BR") },
      { key: "action", label: "Ação" },
      { key: "table_name", label: "Tabela" },
      { key: "record_id", label: "Registro" },
    ],
  },
  error_logs: {
    table: "error_logs",
    cols: "id,message,severity,context,created_at",
    orderBy: "created_at",
    columns: [
      { key: "created_at", label: "Quando", fmt: (v) => new Date(v).toLocaleString("pt-BR") },
      { key: "severity", label: "Severidade" },
      { key: "message", label: "Mensagem" },
    ],
  },
  queue: {
    table: "consultation_queue",
    cols: "id,status,priority,created_at,patient_id",
    orderBy: "created_at",
    columns: [
      { key: "created_at", label: "Entrou", fmt: (v) => new Date(v).toLocaleString("pt-BR") },
      { key: "status", label: "Status" },
      { key: "priority", label: "Prioridade" },
    ],
  },
  notifications: {
    table: "notifications",
    cols: "id,title,message,type,is_read,created_at",
    orderBy: "created_at",
    columns: [
      { key: "created_at", label: "Quando", fmt: (v) => new Date(v).toLocaleString("pt-BR") },
      { key: "title", label: "Título" },
      { key: "type", label: "Tipo" },
      { key: "is_read", label: "Lida", fmt: (v) => v ? "✓" : "—" },
    ],
  },
};

export function KpiDrillDown({ open, onOpenChange, source, title }: Props) {
  const [period, setPeriod] = useState("7d");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !source) return;
    const cfg = SOURCE_CFG[source];
    const hours = PERIODS.find((p) => p.key === period)?.hours ?? 24;
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    setLoading(true);
    supabase
      .from(cfg.table as any)
      .select(cfg.cols)
      .gte(cfg.orderBy, since)
      .order(cfg.orderBy, { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) console.error("[Drill]", error);
        setRows((data as any[]) ?? []);
        setLoading(false);
      });
  }, [open, source, period]);

  if (!source) return null;
  const cfg = SOURCE_CFG[source];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 flex-wrap">
            <span>{title}</span>
            <Badge variant="outline" className="text-[10px]">{rows.length} registros</Badge>
          </DialogTitle>
          <DialogDescription>Drill-down ao vivo · Filtrar por período</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <Button
                key={p.key}
                size="sm"
                variant={period === p.key ? "default" : "outline"}
                className="h-7 text-[10px] px-3"
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px]"
            onClick={() => exportCSV(`${source}-${period}`, rows)}
            disabled={!rows.length}
          >
            <Download size={12} className="mr-1" /> CSV
          </Button>
        </div>

        <div className="overflow-auto flex-1 border border-border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={16} /> Carregando…
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-xs">
              Sem dados no período selecionado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {cfg.columns.map((c) => (
                    <TableHead key={c.key} className="text-[10px] uppercase">{c.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.id ?? i}>
                    {cfg.columns.map((c) => (
                      <TableCell key={c.key} className="text-xs whitespace-nowrap">
                        {c.fmt ? c.fmt(r[c.key]) : String(r[c.key] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
