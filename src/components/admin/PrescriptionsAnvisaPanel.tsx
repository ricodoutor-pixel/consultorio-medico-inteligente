import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, RefreshCw, Search, ShieldCheck, Copy, ExternalLink,
  AlertCircle, CheckCircle2, Clock, Truck,
} from "lucide-react";
import { toast } from "sonner";

interface PrescriptionRow {
  id: string;
  patient_id: string | null;
  doctor_id: string | null;
  status: string | null;
  prescription_type: string | null;
  diagnosis_cid: string | null;
  medications: unknown;
  anvisa_code: string | null;
  verification_code: string | null;
  signature_hash: string | null;
  signature_provider: string | null;
  signature_date: string | null;
  signed_pdf_url: string | null;
  valid_until: string | null;
  created_at: string;
}

interface AnvisaRow {
  id: string;
  protocol_number: string | null;
  patient_name: string | null;
  doctor_name: string | null;
  doctor_crm: string | null;
  product_name: string | null;
  status: string | null;
  authorization_pdf_url: string | null;
  international_tracking_code: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

const ANVISA_STEPS = ["submitted", "under_review", "approved", "dispatched", "in_transit", "delivered"] as const;

const ANVISA_LABEL: Record<string, string> = {
  submitted: "Protocolada",
  under_review: "Em análise",
  approved: "Aprovada",
  dispatched: "Despachada",
  in_transit: "Em trânsito",
  delivered: "Entregue",
  rejected: "Indeferida",
};

const RX_LABEL: Record<string, string> = {
  draft: "Rascunho",
  pending: "Aguardando assinatura",
  signed: "Assinada digitalmente",
  dispensed: "Dispensada",
  expired: "Expirada",
  cancelled: "Cancelada",
};

const shortId = (id: string) => id.slice(0, 8).toUpperCase();
const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const statusTone = (s?: string | null) => {
  switch (s) {
    case "signed":
    case "approved":
    case "delivered":
    case "dispensed":
      return "bg-primary/15 text-primary border-primary/30";
    case "rejected":
    case "cancelled":
    case "expired":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "in_transit":
    case "dispatched":
    case "under_review":
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const PrescriptionsAnvisaPanel = () => {
  const [rx, setRx] = useState<PrescriptionRow[]>([]);
  const [anvisa, setAnvisa] = useState<AnvisaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [rxRes, anvisaRes] = await Promise.all([
      supabase
        .from("prescriptions")
        .select("id, patient_id, doctor_id, status, prescription_type, diagnosis_cid, medications, anvisa_code, verification_code, signature_hash, signature_provider, signature_date, signed_pdf_url, valid_until, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("anvisa_import_processes")
        .select("id, protocol_number, patient_name, doctor_name, doctor_crm, product_name, status, authorization_pdf_url, international_tracking_code, submitted_at, approved_at, delivered_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (rxRes.error) console.warn("[prescricoes]", rxRes.error.message);
    if (anvisaRes.error) console.warn("[anvisa]", anvisaRes.error.message);

    setRx((rxRes.data as PrescriptionRow[]) || []);
    setAnvisa((anvisaRes.data as AnvisaRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const q = query.trim().toLowerCase();

  const rxFiltered = useMemo(
    () =>
      rx.filter((r) =>
        !q ||
        [r.id, r.anvisa_code, r.verification_code, r.status, r.diagnosis_cid, r.signature_provider]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      ),
    [rx, q],
  );

  const anvisaFiltered = useMemo(
    () =>
      anvisa.filter((a) =>
        !q ||
        [a.protocol_number, a.patient_name, a.doctor_name, a.doctor_crm, a.product_name, a.status, a.international_tracking_code]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      ),
    [anvisa, q],
  );

  const kpis = useMemo(() => {
    const signed = rx.filter((r) => r.status === "signed" || !!r.signature_hash).length;
    const pending = rx.filter((r) => r.status !== "signed" && !r.signature_hash).length;
    const emAndamento = anvisa.filter((a) => a.status && !["delivered", "rejected"].includes(a.status)).length;
    const aprovadas = anvisa.filter((a) => !!a.approved_at).length;
    return { signed, pending, emAndamento, aprovadas };
  }, [rx, anvisa]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Protocolo copiado");
  };

  const advance = async (row: AnvisaRow) => {
    const idx = ANVISA_STEPS.indexOf((row.status || "submitted") as typeof ANVISA_STEPS[number]);
    const next = ANVISA_STEPS[Math.min(idx + 1, ANVISA_STEPS.length - 1)];
    if (next === row.status) return;
    const stamp: Record<string, string> = {
      under_review: "under_review_at",
      approved: "approved_at",
      dispatched: "dispatched_at",
      in_transit: "in_transit_at",
      delivered: "delivered_at",
    };
    const patch: Record<string, unknown> = { status: next, updated_at: new Date().toISOString() };
    if (stamp[next]) patch[stamp[next]] = new Date().toISOString();

    const { error } = await supabase.from("anvisa_import_processes").update(patch).eq("id", row.id);
    if (error) {
      toast.error("Não foi possível atualizar o processo");
      return;
    }
    toast.success(`Processo atualizado: ${ANVISA_LABEL[next]}`);
    load();
  };

  return (
    <Card className="border-border bg-card/40">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-black text-sm md:text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Prescrições & Receitas · Protocolo ANVISA
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              Acompanhamento de cada solicitação de importação e da assinatura digital das receitas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Protocolo, paciente, CRM…"
                className="h-8 pl-7 text-xs w-[220px]"
              />
            </div>
            <Button variant="outline" size="sm" className="h-8" onClick={load} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Receitas assinadas", value: kpis.signed, icon: ShieldCheck },
            { label: "Aguardando assinatura", value: kpis.pending, icon: Clock },
            { label: "ANVISA em andamento", value: kpis.emAndamento, icon: Truck },
            { label: "ANVISA aprovadas", value: kpis.aprovadas, icon: CheckCircle2 },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border border-border bg-background/40 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                <k.icon className="h-3.5 w-3.5" />
                {k.label}
              </div>
              <p className="text-xl font-black mt-1">{k.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="anvisa">
          <TabsList className="mb-3">
            <TabsTrigger value="anvisa" className="text-xs">Solicitações ANVISA ({anvisaFiltered.length})</TabsTrigger>
            <TabsTrigger value="receitas" className="text-xs">Receitas digitais ({rxFiltered.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="anvisa">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Protocolo</TableHead>
                    <TableHead className="text-xs">Paciente</TableHead>
                    <TableHead className="text-xs">Médico</TableHead>
                    <TableHead className="text-xs">Produto</TableHead>
                    <TableHead className="text-xs">Situação</TableHead>
                    <TableHead className="text-xs">Rastreio</TableHead>
                    <TableHead className="text-xs">Atualizado</TableHead>
                    <TableHead className="text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anvisaFiltered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs font-mono">
                        <button
                          className="inline-flex items-center gap-1 hover:text-primary"
                          onClick={() => copy(a.protocol_number || a.id)}
                        >
                          {a.protocol_number || shortId(a.id)}
                          <Copy className="h-3 w-3" />
                        </button>
                      </TableCell>
                      <TableCell className="text-xs">{a.patient_name || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {a.doctor_name || "—"}
                        {a.doctor_crm ? <span className="text-muted-foreground"> · CRM {a.doctor_crm}</span> : null}
                      </TableCell>
                      <TableCell className="text-xs">{a.product_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusTone(a.status)}`}>
                          {ANVISA_LABEL[a.status || ""] || a.status || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{a.international_tracking_code || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmt(a.delivered_at || a.approved_at || a.submitted_at || a.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {a.authorization_pdf_url && (
                            <Button asChild variant="ghost" size="sm" className="h-7 px-2">
                              <a href={a.authorization_pdf_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          )}
                          {a.status !== "delivered" && a.status !== "rejected" && (
                            <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => advance(a)}>
                              Avançar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!anvisaFiltered.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                        <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                        {loading ? "Carregando processos…" : "Nenhuma solicitação ANVISA registrada."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="receitas">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Protocolo</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">CID</TableHead>
                    <TableHead className="text-xs">Situação</TableHead>
                    <TableHead className="text-xs">Assinatura</TableHead>
                    <TableHead className="text-xs">Validade</TableHead>
                    <TableHead className="text-xs">Emissão</TableHead>
                    <TableHead className="text-xs text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rxFiltered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-mono">
                        <button
                          className="inline-flex items-center gap-1 hover:text-primary"
                          onClick={() => copy(r.verification_code || r.anvisa_code || r.id)}
                        >
                          {r.verification_code || r.anvisa_code || shortId(r.id)}
                          <Copy className="h-3 w-3" />
                        </button>
                      </TableCell>
                      <TableCell className="text-xs">{r.prescription_type || "—"}</TableCell>
                      <TableCell className="text-xs">{r.diagnosis_cid || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusTone(r.status)}`}>
                          {RX_LABEL[r.status || ""] || r.status || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.signature_hash ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {r.signature_provider || "digital"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">pendente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.valid_until ? new Date(r.valid_until).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(r.created_at)}</TableCell>
                      <TableCell className="text-right">
                        {r.signed_pdf_url ? (
                          <Button asChild variant="ghost" size="sm" className="h-7 px-2">
                            <a href={r.signed_pdf_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rxFiltered.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                        <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                        {loading ? "Carregando receitas…" : "Nenhuma receita emitida ainda."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
