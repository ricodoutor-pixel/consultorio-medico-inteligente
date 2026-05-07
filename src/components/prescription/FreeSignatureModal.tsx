/**
 * Modal de Assinatura Grátis (Plano Free) — Fluxo ITI / Gov.br
 * 1. Médico baixa PDF timbrado com Carimbo CRM
 * 2. Abre https://assinador.iti.br/ em nova aba
 * 3. Faz upload do PDF assinado de volta no sistema
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, ExternalLink, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { ITI_SIGNER_URL, submitFreeSignedPdf } from "@/lib/signature-orchestrator";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prescriptionId: string;
  unsignedPdfBase64: string;
  filename: string;
  patient: { name: string; whatsapp: string };
  doctor: { name: string; crm: string };
  appointmentId?: string;
  onCompleted?: (signedUrl: string) => void;
}

export function FreeSignatureModal({
  open, onOpenChange, prescriptionId, unsignedPdfBase64, filename,
  patient, doctor, appointmentId, onCompleted,
}: Props) {
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const downloadUnsigned = () => {
    const blob = new Blob(
      [Uint8Array.from(atob(unsignedPdfBase64), (c) => c.charCodeAt(0))],
      { type: "application/pdf" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!signedFile) return;
    setSubmitting(true);
    const res = await submitFreeSignedPdf({
      prescriptionId, signedFile, patient, doctor, appointmentId,
    });
    setSubmitting(false);
    if (!res.success) {
      toast({ title: "Falha no upload", description: res.error, variant: "destructive" });
      return;
    }
    setDone(true);
    toast({ title: "Receita assinada!", description: "Enfª Brisa enviou ao paciente." });
    onCompleted?.(res.signedUrl!);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assinatura Grátis via Gov.br (ITI)</DialogTitle>
          <DialogDescription>
            Plano Free — sem custo. Assine usando sua conta Gov.br Prata/Ouro.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            <div className="flex-1">
              <p className="font-medium">Baixe o PDF timbrado</p>
              <p className="text-muted-foreground text-xs mb-2">Já vem com carimbo CRM do médico.</p>
              <Button size="sm" variant="outline" onClick={downloadUnsigned}>
                <Download className="h-4 w-4 mr-2" /> Baixar PDF
              </Button>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            <div className="flex-1">
              <p className="font-medium">Assine no Assinador ITI</p>
              <p className="text-muted-foreground text-xs mb-2">Faça login com Gov.br, envie o PDF, assine e baixe.</p>
              <Button size="sm" variant="outline" asChild>
                <a href={ITI_SIGNER_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Abrir assinador.iti.br
                </a>
              </Button>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
            <div className="flex-1">
              <p className="font-medium">Envie o PDF assinado</p>
              <p className="text-muted-foreground text-xs mb-2">A Enfª Brisa entrega ao paciente automaticamente.</p>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setSignedFile(e.target.files?.[0] ?? null)}
                disabled={done}
              />
            </div>
          </li>
        </ol>

        <Button
          onClick={handleSubmit}
          disabled={!signedFile || submitting || done}
          className="w-full mt-2"
        >
          {done ? (
            <><CheckCircle2 className="h-4 w-4 mr-2" /> Concluído</>
          ) : submitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
          ) : (
            <><Upload className="h-4 w-4 mr-2" /> Enviar Receita Assinada</>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Quer assinar direto na plataforma? Faça upgrade para o Plano VIP e use ClickSign.
        </p>
      </DialogContent>
    </Dialog>
  );
}
