import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  FileCheck2,
  Loader2,
  Upload,
  ShieldCheck,
  Plane,
  Truck,
  PackageCheck,
  Search,
  FileText,
  CheckCircle2,
} from "lucide-react";

export const ANVISA_TIMELINE = [
  { key: "documentacao_enviada", label: "Documentação Enviada", icon: FileCheck2 },
  { key: "em_analise_anvisa", label: "Em Análise ANVISA", icon: Search },
  { key: "autorizacao_deferida", label: "Autorização Deferida", icon: ShieldCheck },
  { key: "pedido_despachado", label: "Pedido Internacional Despachado", icon: Plane },
  { key: "em_transito", label: "Em Trânsito", icon: Truck },
  { key: "entregue", label: "Entregue", icon: PackageCheck },
] as const;

export interface AnvisaImportProcess {
  id: string;
  patient_id: string;
  patient_name: string | null;
  patient_cpf: string | null;
  doctor_name: string | null;
  doctor_crm: string | null;
  protocol_number: string | null;
  product_name: string | null;
  id_document_url: string | null;
  address_proof_url: string | null;
  power_of_attorney_url: string | null;
  authorization_pdf_url: string | null;
  international_tracking_code: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const DOC_FIELDS = [
  { key: "id_document_url", label: "Documento oficial com foto (RG/CNH)" },
  { key: "address_proof_url", label: "Comprovante de residência" },
  { key: "power_of_attorney_url", label: "Procuração (importação excepcional)" },
] as const;

type DocKey = (typeof DOC_FIELDS)[number]["key"];

export function AnvisaTimeline({ status }: { status: string }) {
  const currentIndex = ANVISA_TIMELINE.findIndex((s) => s.key === status);
  return (
    <ol className="space-y-3">
      {ANVISA_TIMELINE.map((step, i) => {
        const done = currentIndex >= i;
        const active = currentIndex === i;
        const Icon = step.icon;
        return (
          <li key={step.key} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border ${
                done
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-border/50 bg-muted/30 text-muted-foreground/50"
              }`}
            >
              {done && !active ? <CheckCircle2 size={14} /> : <Icon size={14} />}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground/60"}`}>
                {step.label}
              </p>
              {active && (
                <Badge variant="outline" className="mt-1 text-[10px] border-emerald-500/40 text-emerald-400">
                  Etapa atual
                </Badge>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ConciergeAnvisaTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<DocKey | null>(null);
  const [processes, setProcesses] = useState<AnvisaImportProcess[]>([]);
  const [form, setForm] = useState({
    patient_name: "",
    patient_cpf: "",
    doctor_name: "",
    doctor_crm: "",
    product_name: "",
    notes: "",
    id_document_url: "",
    address_proof_url: "",
    power_of_attorney_url: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await (supabase as any)
        .from("anvisa_import_processes")
        .select("*")
        .eq("patient_id", auth.user.id)
        .order("created_at", { ascending: false });
      setProcesses((data || []) as AnvisaImportProcess[]);
      setForm((f) => ({
        ...f,
        patient_name: f.patient_name || (auth.user?.user_metadata as any)?.full_name || "",
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (key: DocKey, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 10MB.", variant: "destructive" });
      return;
    }
    setUploading(key);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Faça login para enviar documentos.");
      const path = `${auth.user.id}/anvisa/${key}_${Date.now()}_${file.name.replace(/\s/g, "_")}`;
      const { error } = await supabase.storage
        .from("medical-documents")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      setForm((f) => ({ ...f, [key]: path }));
      toast({ title: "Documento enviado", description: "Arquivo armazenado com segurança (LGPD)." });
    } catch (e) {
      toast({
        title: "Falha no upload",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!form.id_document_url || !form.address_proof_url || !form.power_of_attorney_url) {
      toast({
        title: "Documentos obrigatórios",
        description: "Envie o documento com foto, o comprovante de residência e a procuração.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Faça login para solicitar.");
      const { error } = await (supabase as any).from("anvisa_import_processes").insert({
        patient_id: auth.user.id,
        patient_name: form.patient_name || null,
        patient_cpf: form.patient_cpf || null,
        doctor_name: form.doctor_name || null,
        doctor_crm: form.doctor_crm || null,
        product_name: form.product_name || null,
        notes: form.notes || null,
        id_document_url: form.id_document_url,
        address_proof_url: form.address_proof_url,
        power_of_attorney_url: form.power_of_attorney_url,
        status: "documentacao_enviada",
      });
      if (error) throw error;
      toast({
        title: "Solicitação enviada!",
        description: "Nossa equipe protocolará a importação excepcional (RDC 660) no gov.br.",
      });
      setForm((f) => ({ ...f, id_document_url: "", address_proof_url: "", power_of_attorney_url: "", notes: "" }));
      await load();
    } catch (e) {
      toast({
        title: "Erro ao enviar",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-primary/30 bg-primary/5">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertTitle className="text-sm font-bold">Concierge ANVISA — RDC 660/2022</AlertTitle>
        <AlertDescription className="text-xs">
          A Planta y Raiz atua como plataforma de intermediação tecnológica, organizando a documentação da
          sua autorização de importação excepcional. A decisão é exclusiva da ANVISA.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Nova solicitação guiada
            </CardTitle>
            <CardDescription className="text-xs">
              Preencha os dados e anexe os três documentos obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome completo</Label>
                <Input
                  value={form.patient_name}
                  onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CPF</Label>
                <Input
                  value={form.patient_cpf}
                  onChange={(e) => setForm({ ...form, patient_cpf: e.target.value })}
                  maxLength={14}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Médico prescritor</Label>
                <Input
                  value={form.doctor_name}
                  onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CRM do prescritor</Label>
                <Input
                  value={form.doctor_crm}
                  onChange={(e) => setForm({ ...form, doctor_crm: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Produto a importar</Label>
              <Input
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                placeholder="Ex.: Óleo full spectrum CBD 3000mg"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              {DOC_FIELDS.map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{doc.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {form[doc.key] ? "Enviado ✓" : "PDF, JPG ou PNG até 10MB"}
                    </p>
                  </div>
                  <label className="flex-shrink-0">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(doc.key, file);
                      }}
                    />
                    <Button asChild variant="outline" size="sm" className="text-xs" disabled={uploading === doc.key}>
                      <span>
                        {uploading === doc.key ? (
                          <Loader2 size={14} className="mr-1.5 animate-spin" />
                        ) : (
                          <Upload size={14} className="mr-1.5" />
                        )}
                        {form[doc.key] ? "Substituir" : "Anexar"}
                      </span>
                    </Button>
                  </label>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="text-sm"
              />
            </div>

            <Button className="w-full font-bold" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <FileCheck2 size={16} className="mr-2" />}
              Enviar documentação para protocolo
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Meus processos de importação</CardTitle>
            <CardDescription className="text-xs">Acompanhe cada etapa em tempo real.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Carregando...
              </div>
            ) : processes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum processo aberto. Envie sua documentação para iniciar.
              </p>
            ) : (
              processes.map((p) => (
                <div key={p.id} className="rounded-xl border border-border/50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {p.product_name || "Importação excepcional"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Protocolo gov.br: {p.protocol_number || "aguardando emissão"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </Badge>
                  </div>
                  <AnvisaTimeline status={p.status} />
                  {p.authorization_pdf_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={async () => {
                        const { data } = await supabase.storage
                          .from("medical-documents")
                          .createSignedUrl(p.authorization_pdf_url!, 300);
                        const url = data?.signedUrl || p.authorization_pdf_url!;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <FileText size={14} className="mr-1.5" /> Autorização da ANVISA (PDF)
                    </Button>
                  )}
                  {p.international_tracking_code && (
                    <p className="text-[11px] text-muted-foreground">
                      Rastreio internacional:{" "}
                      <span className="font-mono text-foreground">{p.international_tracking_code}</span>
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ConciergeAnvisaTab;
