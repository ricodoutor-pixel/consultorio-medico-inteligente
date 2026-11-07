import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Link oficial: ao ler com a câmera, o aparelho abre a página de instalação do app.
export const APP_INSTALL_URL = "https://www.plantayraiz.com.br/download?origem=qrcode";

export function AppInstallQR() {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(APP_INSTALL_URL, { width: 640, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1B4332", light: "#FFFFFF" } })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, []);

  const save = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "planta-y-raiz-qrcode-app.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="mb-8 flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-border bg-card/60 p-5 max-w-lg">
      <div className="shrink-0 rounded-xl bg-white p-2">
        {dataUrl ? (
          <img src={dataUrl} alt="QR Code para instalar o app Planta y Raiz" width={150} height={150} className="block w-[150px] h-[150px]" />
        ) : (
          <div className="w-[150px] h-[150px]" />
        )}
      </div>
      <div className="text-center sm:text-left">
        <p className="flex items-center justify-center sm:justify-start gap-2 font-bold text-foreground mb-1">
          <QrCode size={18} /> Aponte a câmera do celular
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          Funciona em iPhone, Android, tablet e computador. O app abre na hora, sem loja.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={save} disabled={!dataUrl} className="gap-2">
          <Download size={16} /> Baixar QR Code
        </Button>
      </div>
    </div>
  );
}
