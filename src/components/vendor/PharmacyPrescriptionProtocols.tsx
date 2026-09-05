import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, RefreshCw, Copy, ExternalLink, Search, ShieldCheck, Clock, Truck, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVendorDashboard, type InboxItem } from "@/hooks/useVendorDashboard";

const FLOW: string[] = [
  "recebida",
  "em_analise_farmaceutica",
  "aprovada_dispensacao",
  "medicamento_separado",
  "despachada",
  "entregue",
];

const LABEL: Record<string, string> = {
  recebida: "Recebida",
  em_analise_farmaceutica: "Em análise farmacêutica",
  aprovada_dispensacao: "Aprovada para dispensação",
  medicamento_separado: "Medicamento separado",
  despachada: "Despachada",
  entregue: "Entregue",
  recusada: "Recusada",
};

const TONE: Record<string, string> = {
  recebida: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  em_analise_farmaceutica: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  aprovada_dispensacao: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  medicamento_separado: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  despachada: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  entregue: "bg-emerald-600/20 text-emerald-300 border-emerald-500/40",
  recusada: "bg-red-500/15 text-red-400 border-red-500/30",
};

function protocolOf(item: InboxItem) {
  const d = new Date(item.created_at);
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `RX-${ym}-${item.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function StatusBadge({ status }: { status: string }) {
  const Icon =
    status === "recusada" ? XCircle
      : status === "despachada" ? Truck
      : status === "entregue" ? CheckCircle2
      : Clock;
  return (
    <Badge className={`text-[10px] font-bold ${TONE[status] || "bg-muted text-muted-foreground border-border"}`}>
      <Icon size={11} className="mr-1" /> {LABEL[status] || status}
    </Badge>
  );
}

export function PharmacyPrescriptionProtocols() {
  const { toast } = useToast();
  const { loading, authError, inbox, reload, updateInboxStatus } = useVendorDashboard();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inbox;
    return inbox.filter((i) =>
      [protocolOf(i), i.patient_name, i.status, i.tracking_code || "", i.regulatory_hash]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [inbox, query]);

  const kpis = useMemo(() => ({
    total: inbox.length,
    pendentes: inbox.filter((i) => ["recebida", "em_analise_farmaceutica"].includes(i.status)).length,
    separacao: inbox.filter((i) => ["aprovada_dispensacao", "medicamento_separado"].includes(i.status)).length,
    concluidas: inbox.filter((i) => ["despachada", "entregue"].includes(i.status)).length,
  }), [inbox]);

  const advance = async (item: InboxItem) => {
    const idx = FLOW.indexOf(item.status);
    const next = FLOW[idx + 1];
    if (idx < 0 || !next) return;
    setBusy(item.id);
    try {
      const extra =
        next === "despachada" && !item.tracking_code
          ? { tracking_code: `PYR-${Math.floor(100000 + Math.random() * 900000)}-BR` }
          : {};
      await updateInboxStatus(item.id, next, extra);
      toast({ title: "Status atualizado", description: `${protocolOf(item)} → ${LABEL[next]}` });
    } catch (e: any) {
      toast({ title: "Erro ao atualizar", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const refuse = async (item: InboxItem) => {
    const motivo = window.prompt("Motivo da recusa farmacêutica:");
    if (!motivo) return;
    setBusy(item.id);
    try {
      await updateInboxStatus(item.id, "recusada", { motivo_recusa: motivo });
      toast({ title: "Receita recusada", description: protocolOf(item) });
    } catch (e: any) {
      toast({ title: "Erro ao recusar", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="text-primary w-5 h-5" /> Receitas Recebidas · Protocolo & Dispensação
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Cada solicitação recebe um protocolo único e é acompanhada até a entrega ao paciente.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => reload()} className="rounded-xl text-xs">
          <RefreshCw size={13} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {authError && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300">
            {authError}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total recebidas", value: kpis.total, tone: "text-foreground" },
            { label: "Aguardando análise", value: kpis.pendentes, tone: "text-amber-400" },
            { label: "Em separação", value: kpis.separacao, tone: "text-violet-400" },
            { label: "Despachadas/entregues", value: kpis.concluidas, tone: "text-emerald-400" },
          ].map((k) => (
            <div key={k.label} className="p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">{k.label}</span>
              <p className={`text-2xl font-black mt-0.5 ${k.tone}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por protocolo, paciente, status ou rastreio"
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="rounded-2xl border border-border overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs">Protocolo</TableHead>
                <TableHead className="text-xs">Paciente</TableHead>
                <TableHead className="text-xs">Recebida em</TableHead>
                <TableHead className="text-xs">Hash SHA-512</TableHead>
                <TableHead className="text-xs">Rastreio</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    {loading ? "Carregando receitas…" : "Nenhuma receita recebida até o momento."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((item) => {
                  const proto = protocolOf(item);
                  const idx = FLOW.indexOf(item.status);
                  const next = idx >= 0 ? FLOW[idx + 1] : undefined;
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono font-bold">
                        <button
                          onClick={() => { navigator.clipboard.writeText(proto); toast({ title: "Protocolo copiado", description: proto }); }}
                          className="inline-flex items-center gap-1.5 hover:text-primary"
                        >
                          {proto} <Copy size={11} />
                        </button>
                        <div className="text-[10px] text-muted-foreground font-sans mt-0.5">
                          {item.dispatch_mode === "automatic_1click" ? "Envio 1-clique" : "Upload manual"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold">
                        {item.patient_name}
                        {item.patient_whatsapp && (
                          <div className="text-[10px] font-normal text-muted-foreground">{item.patient_whatsapp}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                          <ShieldCheck size={10} className="mr-1 text-emerald-400" />
                          {(item.regulatory_hash || "").slice(0, 10)}…
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground">
                        {item.tracking_code || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                        {item.motivo_recusa && (
                          <div className="text-[10px] text-red-400 mt-1">{item.motivo_recusa}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          {item.prescription_pdf_url && (
                            <Button size="sm" variant="outline" asChild className="h-8 text-[11px] rounded-xl">
                              <a href={item.prescription_pdf_url} target="_blank" rel="noreferrer">
                                <ExternalLink size={12} className="mr-1" /> PDF
                              </a>
                            </Button>
                          )}
                          {next && (
                            <Button
                              size="sm"
                              disabled={busy === item.id}
                              onClick={() => advance(item)}
                              className="h-8 text-[11px] rounded-xl font-bold"
                            >
                              {LABEL[next]}
                            </Button>
                          )}
                          {item.status !== "recusada" && !["despachada", "entregue"].includes(item.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy === item.id}
                              onClick={() => refuse(item)}
                              className="h-8 text-[11px] rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              Recusar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default PharmacyPrescriptionProtocols;
