import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { getKycSignedUrl, KYC_LABELS, type KycKind } from "@/lib/kyc-docs";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  kind: KycKind;
  storagePath?: string | null;
  doctorName?: string;
}

/** Visualizador do documento real anexado pelo médico no cadastro (bucket privado + URL assinada). */
export default function KycDocViewer({ open, onClose, userId, kind, storagePath, doctorName }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setUrl(null);
    getKycSignedUrl(userId, kind, storagePath)
      .then((u) => alive && setUrl(u))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open, userId, kind, storagePath]);

  const isPdf = Boolean(url && (storagePath?.toLowerCase().endsWith(".pdf") || url.includes(".pdf")));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-black">
            {KYC_LABELS[kind]}
            {doctorName ? <span className="text-muted-foreground font-normal"> · {doctorName}</span> : null}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[320px] flex items-center justify-center rounded-xl bg-muted/20 border border-border overflow-hidden">
          {loading && <Loader2 className="w-6 h-6 animate-spin text-primary" />}

          {!loading && !url && (
            <div className="text-center p-6 space-y-2">
              <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto" />
              <p className="text-sm font-bold text-amber-300">Documento não anexado no cadastro</p>
              <p className="text-xs text-muted-foreground">
                O médico ainda não enviou este arquivo. Solicite o envio antes de publicar o card.
              </p>
            </div>
          )}

          {!loading && url && !isPdf && (
            <img src={url} alt={KYC_LABELS[kind]} className="max-h-[70vh] w-auto object-contain" />
          )}

          {!loading && url && isPdf && (
            <iframe src={url} title={KYC_LABELS[kind]} className="w-full h-[70vh]" />
          )}
        </div>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:underline"
          >
            <ExternalLink size={12} /> Abrir em nova aba / baixar original
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
