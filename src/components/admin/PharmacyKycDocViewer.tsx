import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Download, ExternalLink, FileText } from "lucide-react";
import { getPharmacyKycUrl, PHARMACY_KYC_LABELS, type PharmacyKycKind } from "@/lib/pharmacy-kyc-docs";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  kind: PharmacyKycKind;
  storagePath?: string | null;
  fileUrl?: string | null;
  pharmacyName?: string;
}

/** Visualizador de documentos e alvarás KYC da Farmácia/Lojista */
export default function PharmacyKycDocViewer({
  open,
  onClose,
  userId,
  kind,
  storagePath,
  fileUrl,
  pharmacyName,
}: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setUrl(null);

    getPharmacyKycUrl(userId, kind, storagePath, fileUrl)
      .then((u) => alive && setUrl(u))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [open, userId, kind, storagePath, fileUrl]);

  const isPdf = Boolean(
    url &&
      (storagePath?.toLowerCase().endsWith(".pdf") ||
        fileUrl?.toLowerCase().endsWith(".pdf") ||
        url.includes(".pdf"))
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-black flex items-center justify-between gap-2">
            <span>
              {PHARMACY_KYC_LABELS[kind]}
              {pharmacyName ? (
                <span className="text-muted-foreground font-normal"> · {pharmacyName}</span>
              ) : null}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[320px] flex items-center justify-center rounded-xl bg-muted/20 border border-border overflow-hidden p-2">
          {loading && <Loader2 className="w-6 h-6 animate-spin text-primary" />}

          {!loading && !url && (
            <div className="text-center p-6 space-y-2">
              <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto" />
              <p className="text-sm font-bold text-amber-300">Documento não anexado no cadastro</p>
              <p className="text-xs text-muted-foreground">
                A farmácia ainda não enviou este arquivo. Exija o envio antes de liberar a loja para vendas.
              </p>
            </div>
          )}

          {!loading && url && !isPdf && (
            <img
              src={url}
              alt={PHARMACY_KYC_LABELS[kind]}
              className="max-h-[70vh] w-auto object-contain rounded-lg shadow-sm"
            />
          )}

          {!loading && url && isPdf && (
            <div className="w-full flex flex-col items-center justify-center py-8 space-y-4">
              <FileText className="w-16 h-16 text-emerald-400" />
              <p className="font-bold text-sm text-foreground">Documento Digitalizado (PDF Oficial)</p>
              <iframe src={url} title={PHARMACY_KYC_LABELS[kind]} className="w-full h-[55vh] rounded-lg border border-border" />
            </div>
          )}
        </div>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex w-full mt-3 items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors text-sm shadow-md"
          >
            <Download size={18} /> Baixar Arquivo em Alta Resolução (Original)
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
