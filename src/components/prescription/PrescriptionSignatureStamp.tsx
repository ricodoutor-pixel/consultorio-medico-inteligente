import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ShieldCheck, QrCode as QrIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buildVerificationUrl, getPrescriptionTypeMeta, type PrescriptionType } from "@/lib/prescription-types";

interface PrescriptionSignatureStampProps {
  verificationCode?: string | null;
  signatureHash?: string | null;
  doctorName?: string | null;
  doctorCRM?: string | null;
  signatureDate?: string | null;
  prescriptionType?: PrescriptionType | string | null;
  provider?: string | null;
}

/**
 * Carimbo visual de assinatura digital ICP-Brasil + QR Code de verificação pública.
 */
export function PrescriptionSignatureStamp({
  verificationCode,
  signatureHash,
  doctorName,
  doctorCRM,
  signatureDate,
  prescriptionType,
  provider,
}: PrescriptionSignatureStampProps) {
  const code = verificationCode || signatureHash || null;
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setQr(null);
      return;
    }
    let active = true;
    QRCode.toDataURL(buildVerificationUrl(code), { width: 220, margin: 1 })
      .then((url) => { if (active) setQr(url); })
      .catch(() => { if (active) setQr(null); });
    return () => { active = false; };
  }, [code]);

  const typeMeta = prescriptionType
    ? getPrescriptionTypeMeta(prescriptionType as PrescriptionType)
    : null;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 rounded-lg bg-background p-2 border border-border/50">
          {qr ? (
            <img src={qr} alt="QR Code de verificação pública da receita" className="h-24 w-24" />
          ) : (
            <div className="h-24 w-24 flex items-center justify-center text-muted-foreground/50">
              <QrIcon size={28} />
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wide">
            <ShieldCheck size={14} /> Assinado digitalmente
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {provider === "clicksign" ? "ClickSign" : "ICP-Brasil (ITI / gov.br)"} — Lei 14.063/2020 e
            Resolução CFM 2.299/2021.
          </p>
          {doctorName && (
            <p className="text-[11px] text-foreground font-medium truncate">
              {doctorName}
              {doctorCRM ? ` · CRM ${doctorCRM}` : ""}
            </p>
          )}
          {signatureDate && (
            <p className="text-[10px] text-muted-foreground">
              {new Date(signatureDate).toLocaleString("pt-BR")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {typeMeta && (
              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                {typeMeta.shortLabel} · {typeMeta.copies} via{typeMeta.copies > 1 ? "s" : ""}
              </Badge>
            )}
            {code && (
              <Badge variant="outline" className="text-[10px] font-mono">
                {code.slice(0, 20)}
              </Badge>
            )}
          </div>
        </div>
      </div>
      {code && (
        <p className="mt-3 text-[10px] text-muted-foreground break-all">
          Verifique em: {buildVerificationUrl(code)}
        </p>
      )}
    </div>
  );
}

export default PrescriptionSignatureStamp;
