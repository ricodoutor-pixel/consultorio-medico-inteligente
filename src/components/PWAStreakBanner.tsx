import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Flame, Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAStreakBanner() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed || !canInstall) return null;

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result === "ios") {
      // redirect to planos page where full iOS instructions exist
      window.location.href = "/planos#instalar-app";
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
          Baixe o App para não esquecer sua dose de hoje.
        </p>
      </div>
      <Button
        size="sm"
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] h-7 px-3 shrink-0 rounded-lg"
        onClick={handleInstall}
      >
        <Download size={12} className="mr-1" />
        Instalar
      </Button>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}
