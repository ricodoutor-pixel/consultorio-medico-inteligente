import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, RefreshCw, ShieldCheck, FileText } from "lucide-react";
import { ANVISA_TIMELINE, type AnvisaImportProcess } from "@/components/anvisa/ConciergeAnvisaTab";

export default function AdminImportacoesAnvisa() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AnvisaImportProcess[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [protocolDraft, setProtocolDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("anvisa_import_processes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data || []) as AnvisaImportProcess[]);
    } catch (e) {
      toast({
        title: "Erro ao carregar processos",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const patch = async (id: string, payload: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const { error } = await (supabase as any)
        .from("anvisa_import_processes")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Processo atualizado" });
      await load();
    } catch (e) {
      toast({
        title: "Falha ao atualizar",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const uploadAuthorization = async (row: AnvisaImportProcess, file: File) => {
    setBusyId(row.id);
    try {
      const path = `${row.patient_id}/anvisa/autorizacao_${Date.now()}_${file.name.replace(/\s/g, "_")}`;
      const { error } = await supabase.storage
        .from("medical-documents")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      await patch(row.id, {
        authorization_pdf_url: path,
        status: "autorizacao_deferida",
        authorized_at: new Date().toISOString(),
      });
    } catch (e) {
      toast({
        title: "Falha no upload",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <ShieldCheck className="text-primary" /> Gestão de Importações RDC 660
            </h1>
            <p className="text-sm text-muted-foreground">
              Protocolos gov.br, autorizações da ANVISA e status logístico de cada paciente.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Processos ({rows.length})</CardTitle>
            <CardDescription className="text-xs">
              Anexe o PDF da autorização e atualize a etapa do processo.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Carregando...
              </div>
            ) : rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Nenhum processo registrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Paciente</TableHead>
                    <TableHead className="text-xs">Prescritor</TableHead>
                    <TableHead className="text-xs">Protocolo gov.br</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs">
                        <p className="font-semibold text-foreground">{row.patient_name || "—"}</p>
                        <p className="text-muted-foreground">{row.patient_cpf || "CPF não informado"}</p>
                        <p className="text-muted-foreground">{row.product_name || "—"}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="text-foreground">{row.doctor_name || "—"}</p>
                        <p className="text-muted-foreground">{row.doctor_crm ? `CRM ${row.doctor_crm}` : ""}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Input
                            className="h-8 w-36 text-xs"
                            placeholder="Nº protocolo"
                            value={protocolDraft[row.id] ?? row.protocol_number ?? ""}
                            onChange={(e) =>
                              setProtocolDraft({ ...protocolDraft, [row.id]: e.target.value })
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[11px]"
                            disabled={busyId === row.id}
                            onClick={() =>
                              patch(row.id, {
                                protocol_number: protocolDraft[row.id] ?? row.protocol_number,
                                status: row.status === "documentacao_enviada" ? "em_analise_anvisa" : row.status,
                              })
                            }
                          >
                            Salvar
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Select
                          value={row.status}
                          onValueChange={(v) => patch(row.id, { status: v })}
                          disabled={busyId === row.id}
                        >
                          <SelectTrigger className="h-8 w-52 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ANVISA_TIMELINE.map((s) => (
                              <SelectItem key={s.key} value={s.key} className="text-xs">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {row.international_tracking_code && (
                          <Badge variant="outline" className="mt-1.5 font-mono text-[10px]">
                            {row.international_tracking_code}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-1.5">
                          <label>
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadAuthorization(row, f);
                              }}
                            />
                            <Button asChild size="sm" variant="outline" className="h-8 w-full text-[11px]" disabled={busyId === row.id}>
                              <span>
                                <Upload size={13} className="mr-1.5" />
                                {row.authorization_pdf_url ? "Substituir PDF" : "Anexar autorização"}
                              </span>
                            </Button>
                          </label>
                          <Input
                            className="h-8 text-xs"
                            placeholder="Rastreio internacional"
                            defaultValue={row.international_tracking_code ?? ""}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v && v !== row.international_tracking_code) {
                                patch(row.id, {
                                  international_tracking_code: v,
                                  status: "em_transito",
                                });
                              }
                            }}
                          />
                          {row.authorization_pdf_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px]"
                              onClick={async () => {
                                const { data } = await supabase.storage
                                  .from("medical-documents")
                                  .createSignedUrl(row.authorization_pdf_url!, 300);
                                if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
                              }}
                            >
                              <FileText size={13} className="mr-1.5" /> Ver PDF
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
