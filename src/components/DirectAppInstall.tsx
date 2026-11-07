import { useState } from "react";
import { Check, Download, Share, Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function DirectAppInstall() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const install = async () => {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      setDismissed(outcome !== "accepted");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center space-y-6">
        <img src="/dr-verdinho-192.png" alt="Dr. Verdinho" width={96} height={96} className="mx-auto rounded-2xl" />
        <h1 className="text-3xl font-display font-bold">Planta y Raiz</h1>
        <p className="text-muted-foreground">{isInstalled ? "App instalado neste navegador." : "Instalar no seu dispositivo"}</p>
        {isInstalled ? (
          <Button asChild size="lg" className="w-full gap-2"><Link to="/"><Check size={20} /> Abrir Planta y Raiz</Link></Button>
        ) : canInstall ? (
          <>
            <Button onClick={install} disabled={busy} size="lg" className="w-full gap-2"><Download size={20} />{busy ? "Abrindo instalação…" : "Instalar app"}</Button>
            <p className="text-sm text-muted-foreground">{dismissed ? "Instalação não concluída. Toque novamente para tentar." : "Confirme a instalação na janela do navegador."}</p>
          </>
        ) : isIOS ? (
          <ol className="text-left space-y-4 text-sm">
            <li className="flex gap-3"><Share className="shrink-0 text-primary" size={22} /><span>No Safari, toque em <strong>Compartilhar</strong>.</span></li>
            <li className="flex gap-3"><Plus className="shrink-0 text-primary" size={22} /><span>Escolha <strong>Adicionar à Tela de Início</strong> e confirme em <strong>Adicionar</strong>.</span></li>
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Abra no Chrome ou Edge. No menu do navegador, escolha “Instalar app” ou “Adicionar à tela inicial”. Se disponível, o botão de instalação aparecerá aqui.</p>
        )}
        <Button asChild variant="ghost" className="gap-2"><Link to="/"><ArrowLeft size={16} /> Continuar no site</Link></Button>
      </div>
    </main>
  );
}