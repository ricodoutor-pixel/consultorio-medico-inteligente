import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Phone,
  Zap,
} from "lucide-react";
import { format, formatDistanceToNowStrict, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

type Row = {
  id: string;
  payment_id: string;
  external_reference: string;
  status: string;
  amount: number;
  patient_phone: string | null;
  patient_name: string | null;
  patient_email: string | null;
  doctor_notified_at: string | null;
  patient_notified_at: string | null;
  consultation_completed_at: string | null;
  payout_released_at: string | null;
  created_at: string;
};

const BRISA_PHONE = "5511991363154";

export default function BrisaOrientacoes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<"pendentes" | "repassados" | "todos">("pendentes");

  // Dialog "Finalizar Consulta"
  const [dialogRow, setDialogRow] = useState<Row | null>(null);
  const [notes, setNotes] = useState("");
  const [emergency, setEmergency] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brisa_orientacao_payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setRows((data as Row[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const counts = useMemo(() => {
    const approved = rows.filter((r) => r.status === "approved");
    return {
      pendentes: approved.filter((r) => !r.payout_released_at).length,
      repassados: approved.filter((r) => !!r.payout_released_at).length,
      total: approved.length,
      urgentes: approved.filter(
        (r) => !r.payout_released_at && differenceInHours(new Date(), new Date(r.created_at)) >= 40,
      ).length,
    };
  }, [rows]);

  const visible = useMemo(() => {
    const approved = rows.filter((r) => r.status === "approved");
    if (tab === "pendentes") return approved.filter((r) => !r.payout_released_at);
    if (tab === "repassados") return approved.filter((r) => !!r.payout_released_at);
    return approved;
  }, [rows, tab]);

  const openFinalize = (row: Row, isEmergency = false) => {
    setDialogRow(row);
    setNotes("");
    setEmergency(isEmergency);
  };

  const submitFinalize = async () => {
    if (!dialogRow) return;
    setBusyId(dialogRow.id);
    const { error } = await supabase.rpc("complete_brisa_orientacao", {
      _payment_row_id: dialogRow.id,
      _notes: emergency
        ? `[FORÇA LIBERAÇÃO] ${notes || "Liberação manual de emergência pelo admin"}`
        : notes || null,
    });
    setBusyId(null);
    if (error) {
      toast({ title: "Falha ao finalizar", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: emergency ? "Repasse forçado liberado" : "Consulta finalizada",
      description: "Pagamento marcado para repasse ao Dra. Suelen.",
    });
    setDialogRow(null);
    setNotes("");
    setEmergency(false);
    void load();
  };

  return (
    <div className="min-h-dvh bg-background text-foreground p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Orientações Brisa · Dra. Suelen</h1>
            <p className="text-sm text-muted-foreground">
              Auditoria de pagamentos R$30 · auto-libera em 48h
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Atualizar</span>
          </Button>
        </header>

        {/* Indicadores de auditoria */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Pendentes" value={counts.pendentes} icon={Clock} accent="amber" />
          <StatCard label="Repassados" value={counts.repassados} icon={CheckCircle2} accent="emerald" />
          <StatCard label="Total Aprovados" value={counts.total} icon={CheckCircle2} accent="primary" />
          <StatCard label="Urgentes (>40h)" value={counts.urgentes} icon={AlertTriangle} accent="red" />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="pendentes">Pendentes ({counts.pendentes})</TabsTrigger>
            <TabsTrigger value="repassados">Repassados ({counts.repassados})</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum pagamento {tab === "pendentes" ? "pendente" : "encontrado"}.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visible.map((r) => (
              <PaymentRow
                key={r.id}
                row={r}
                busy={busyId === r.id}
                onFinalize={() => openFinalize(r, false)}
                onForce={() => openFinalize(r, true)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog Finalizar/Forçar */}
      <Dialog open={!!dialogRow} onOpenChange={(o) => !o && setDialogRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {emergency ? "⚡ Forçar Liberação de Repasse" : "Finalizar Consulta"}
            </DialogTitle>
          </DialogHeader>
          {dialogRow && (
            <div className="space-y-3">
              <div className="text-sm">
                <p>
                  <span className="text-muted-foreground">Paciente:</span>{" "}
                  <strong>{dialogRow.patient_name ?? "—"}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">WhatsApp:</span>{" "}
                  {dialogRow.patient_phone ?? "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Valor:</span> R${" "}
                  {Number(dialogRow.amount).toFixed(2)}
                </p>
                <p>
                  <span className="text-muted-foreground">MP ID:</span> {dialogRow.payment_id}
                </p>
              </div>
              {emergency && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Liberação forçada antes do prazo de 48h. Registra log de auditoria.
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Notas de Orientação Final (opcional, registradas no banco)
                </label>
                <Textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Paciente orientado sobre dosagem inicial 2 gotas 12/12h. Reavaliar em 30 dias."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogRow(null)}>
              Cancelar
            </Button>
            <Button
              onClick={submitFinalize}
              disabled={!!busyId}
              className={
                emergency
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {busyId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : emergency ? (
                <Zap className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span className="ml-2">
                {emergency ? "Forçar liberação agora" : "Finalizar & liberar repasse"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Clock;
  accent: "amber" | "emerald" | "primary" | "red";
}) {
  const ring =
    accent === "red"
      ? "ring-red-500/40 text-red-400"
      : accent === "amber"
        ? "ring-amber-500/40 text-amber-400"
        : accent === "emerald"
          ? "ring-emerald-500/40 text-emerald-400"
          : "ring-primary/40 text-primary";
  return (
    <Card className={`ring-1 ${ring} bg-card/60`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentRow({
  row,
  busy,
  onFinalize,
  onForce,
}: {
  row: Row;
  busy: boolean;
  onFinalize: () => void;
  onForce: () => void;
}) {
  const hours = differenceInHours(new Date(), new Date(row.created_at));
  const released = !!row.payout_released_at;
  const isUrgent = !released && hours >= 40;
  const isCritical = !released && hours >= 48;

  return (
    <Card
      className={`border ${
        isCritical
          ? "border-red-500/60"
          : isUrgent
            ? "border-amber-500/60"
            : "border-border/60"
      }`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="font-semibold truncate">
              {row.patient_name ?? "Paciente"}{" "}
              <span className="text-muted-foreground font-normal text-sm">
                · R$ {Number(row.amount).toFixed(2)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(row.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} · MP #
              {row.payment_id}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {released ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-700">Repassado</Badge>
            ) : isCritical ? (
              <Badge className="bg-red-600 hover:bg-red-700">⚠ Crítico {hours}h</Badge>
            ) : isUrgent ? (
              <Badge className="bg-amber-600 hover:bg-amber-700">Urgente {hours}h</Badge>
            ) : (
              <Badge variant="outline">
                {formatDistanceToNowStrict(new Date(row.created_at), { locale: ptBR })}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-sm">
          {row.patient_phone && (
            <a
              href={`https://wa.me/${row.patient_phone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <Phone className="h-3.5 w-3.5" /> {row.patient_phone}
            </a>
          )}
          {row.patient_email && (
            <span className="text-muted-foreground truncate text-xs">{row.patient_email}</span>
          )}
        </div>

        {!released && (
          <div className="flex gap-2 flex-wrap pt-1 border-t border-border/40">
            <Button
              size="sm"
              onClick={onFinalize}
              disabled={busy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="ml-2">Finalizar Consulta</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onForce}
              disabled={busy}
              className="border-amber-500/60 text-amber-400 hover:bg-amber-500/10"
            >
              <Zap className="h-4 w-4" />
              <span className="ml-2">Forçar Liberação</span>
            </Button>
            <a
              href={`https://wa.me/${BRISA_PHONE}?text=${encodeURIComponent(
                `Brisa, atualização sobre ${row.patient_name ?? "paciente"} (MP ${row.payment_id})`,
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="ghost">
                <MessageSquare className="h-4 w-4" />
                <span className="ml-2">Brisa</span>
              </Button>
            </a>
          </div>
        )}

        {released && row.payout_released_at && (
          <p className="text-xs text-emerald-400/80">
            Repassado em{" "}
            {format(new Date(row.payout_released_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
