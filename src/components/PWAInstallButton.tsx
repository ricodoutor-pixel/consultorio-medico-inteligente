import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check, Smartphone, Share2, Monitor } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function PWAInstallButton({ variant = "default" }: { variant?: "default" | "compact" }) {
  const { canInstall, isInstalled, isIOS, isDesktop, promptInstall, downloadDesktopShortcut } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (isInstalled) {
    return (
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
        <Check size={16} /> App Instalado
      </motion.div>
    );
  }

  const handleInstall = async () => {
    setInstalling(true);

    // No desktop: tenta prompt nativo ou baixa atalho oficial em 1 clique
    if (isDesktop) {
      let accepted = false;
      if (canInstall) {
        try {
          const outcome = await promptInstall();
          if (outcome === "accepted") {
            accepted = true;
            toast.success("App Planta y Raiz instalado com sucesso! 🐸");
          }
        } catch (_) {}
      }

      if (!accepted) {
        downloadDesktopShortcut();
        toast.success("Atalho do Dr. Verdinho baixado! 🐸 Verifique sua pasta Downloads.");
      }
      setInstalling(false);
      return;
    }

    if (canInstall) {
      try {
        await promptInstall();
      } catch (_) {}
      setInstalling(false);
      return;
    }

    // Fallback: show instructions (iOS Safari)
    if (isIOS) {
      setShowIOSHelp(true);
    } else {
      downloadDesktopShortcut();
      toast.success("Atalho baixado! Toque no arquivo para abrir.");
    }
    setInstalling(false);
  };

  if (variant === "compact") {
    return (
      <Button
        onClick={handleInstall}
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 shadow-md"
      >
        {isDesktop ? <Monitor size={14} /> : <Download size={14} />}
        {isDesktop ? "Baixar App PC" : "Instalar App"}
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center overflow-hidden">
          <img src="/dr-verdinho-192.png?v=9" alt="Dr. Verdinho" className="w-8 h-8 object-cover" />
        </div>
        <div>
          <p className="font-bold text-sm text-foreground">Planta y Raiz App</p>
          <p className="text-xs text-muted-foreground">1 clique • Direto no seu Desktop ou Celular</p>
        </div>
      </div>
      <Button
        onClick={handleInstall}
        disabled={installing}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl gap-2 shadow-lg shadow-emerald-900/30"
      >
        {isDesktop ? <Monitor size={16} /> : <Download size={16} />}
        {installing
          ? "Processando..."
          : isDesktop
            ? "Baixar para Desktop (1 Clique)"
            : "Instalar App Gratuito"}
      </Button>

      <AnimatePresence>
        {showIOSHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 rounded-xl bg-muted/50 border border-border text-xs text-foreground space-y-2"
          >
            <p className="font-bold flex items-center gap-1.5">
              <Share2 size={14} className="text-primary" /> Como instalar no iPhone/iPad:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Toque no botão <b>Compartilhar</b> (ícone de seta) na barra do Safari.</li>
              <li>Role e selecione <b>“Adicionar à Tela de Início”</b>.</li>
              <li>Toque em <b>Adicionar</b> no canto superior direito.</li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
