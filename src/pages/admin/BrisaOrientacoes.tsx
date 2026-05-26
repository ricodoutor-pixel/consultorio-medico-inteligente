import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
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
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brisa_orientacao_payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
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

  const complete = async (row: Row) => {
    setBusyId(row.id);
    const { data, error } = await supabase.rpc("complete_brisa_orientacao", {
      _payment_row_id: row.id,
      _notes: notes[row.id] ?? null,
    });
    setBusyId(null);
    if (error) {
      toast({ title: "Falha ao concluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Orientação concluída", description: "Repasse liberado para Dr. Edilson." });
    setNotes((n) => ({ ...n, [row.id]: "" }));
    void load();
  };

  const stats = {
    total: rows.length,
    aprovados: rows.filter((r) => r.status === "approved").length,
    pendentes: rows.filter((r) => r.status === "approved" && !r.consultation_completed_at).length,
    concluidos: rows.filter((r) => !!r.consultation_completed_at).length,
    liberados: rows.filter((r) => !!r.payout_released_at).length,
  };

  return (
    <div className="min-h-dvh bg-background text-foreground p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Orientações Brisa · Dr. Edilson</h1>
            <p className="text-sm text-muted-foreground">
              Pagamentos R$30 via WhatsApp · auto-libera repasse após 48h
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Atualizar</span>
          </Button>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, icon: MessageSquare },
            { label: "Aprovados", value: stats.aprovados, icon: CheckCircle2 },
            { label: "Aguardando", value: stats.pendentes, icon: Clock },
            { label: "Concluídos", value: stats.concluidos, icon: CheckCircle2 },
            { label: "Repasses OK", value: stats.liberados, icon: CheckCircle2 },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum pagamento registrado ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const isApproved = r.status === "approved";
              const isDone = !!r.consultation_completed_at;
              const isReleased = !!r.payout_released_at;
              return (
                <Card key={r.id} className="border-border/60">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {r.patient_name ?? "Paciente"}{" "}
                          <span className="text-muted-foreground font-normal">
                            · R$ {Number(r.amount).toFixed(2)}
                          </span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} ·
                          MP #{r.payment_id}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={isApproved ? "default" : "secondary"}>{r.status}</Badge>
                        {isDone && <Badge variant="outline">Concluída</Badge>}
                        {isReleased && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700">Repasse OK</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {r.patient_phone && (
                        <a
                          href={`https://wa.me/${r.patient_phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Phone className="h-4 w-4" /> {r.patient_phone}
                        </a>
                      )}
                      {r.patient_email && (
                        <span className="text-muted-foreground truncate">{r.patient_email}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        Médico avisado:{" "}
                        {r.doctor_notified_at
                          ? format(new Date(r.doctor_notified_at), "dd/MM HH:mm")
                          : "—"}
                      </span>
                      <span>
                        Paciente avisado:{" "}
                        {r.patient_notified_at
                          ? format(new Date(r.patient_notified_at), "dd/MM HH:mm")
                          : "—"}
                      </span>
                    </div>

                    {isApproved && !isDone && (
                      <div className="space-y-2 pt-2 border-t border-border/40">
                        <Textarea
                          placeholder="Notas da orientação (opcional, fica registrado)"
                          value={notes[r.id] ?? ""}
                          onChange={(e) =>
                            setNotes((n) => ({ ...n, [r.id]: e.target.value }))
                          }
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => complete(r)}
                            disabled={busyId === r.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {busyId === r.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            <span className="ml-2">Marcar concluída & liberar repasse</span>
                          </Button>
                          <a
                            href={`https://wa.me/${BRISA_PHONE}?text=${encodeURIComponent(
                              `Brisa, atualização sobre ${r.patient_name ?? "paciente"} (MP ${r.payment_id})`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4" />
                              <span className="ml-2">Falar com Brisa</span>
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}

                    {!isApproved && (
                      <div className="flex items-center gap-2 text-xs text-amber-500">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Aguardando confirmação Mercado Pago
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
