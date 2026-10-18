import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Flame, Download, Monitor } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";

export function PWAStreakBanner() {
  const { canInstall, isInstalled, isDesktop, promptInstall, downloadDesktopShortcut } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  const handleAction = async () => {
    if (isDesktop) {
      let accepted = false;
      if (canInstall) {
        try {
          const outcome = await promptInstall();
          if (outcome === "accepted") {
            accepted = true;
            toast.success("App Planta y Raiz instalado! 🐸");
          }
        } catch (_) {}
      }
      if (!accepted) {
        downloadDesktopShortcut();
        toast.success("Atalho do Dr. Verdinho baixado! 🐸 Verifique sua pasta Downloads.");
      }
      return;
    }

    if (canInstall) {
      await promptInstall();
    } else {
      downloadDesktopShortcut();
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-500/10 via-primary/10 to-orange-500/10 border border-orange-500/20 rounded-xl p-3 mx-4 mb-4 flex items-center gap-3">
      <Flame size={20} className="text-orange-400 animate-pulse shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">
          Mantenha sua ofensiva! 🔥
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {isDesktop
            ? "Baixe o atalho do Dr. Verdinho para seu Desktop em 1 clique."
            : "Baixe o App para não esquecer sua dose de hoje."}
        </p>
      </div>
      <Button
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-3 shrink-0 gap-1.5"
        onClick={handleAction}
      >
        {isDesktop ? <Monitor size={14} /> : <Download size={14} />}
        {isDesktop ? "Baixar PC" : "Instalar"}
      </Button>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Fechar aviso">
        <X size={16} />
      </button>
    </div>
  );
}
