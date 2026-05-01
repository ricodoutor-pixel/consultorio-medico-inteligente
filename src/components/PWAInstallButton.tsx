import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check, Smartphone, Share2 } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallButton({ variant = "default" }: { variant?: "default" | "compact" }) {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (isInstalled) {
    return (
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-primary text-sm font-bold">
        <Check size={16} /> App Instalado
      </motion.div>
    );
  }

  const handleInstall = async () => {
    if (canInstall) {
      setInstalling(true);
      await promptInstall();
      setInstalling(false);
      return;
    }
    // Fallback: show manual install instructions (iOS Safari, etc.)
    setShowIOSHelp(true);
  };

  if (variant === "compact") {
    return (
      <Button onClick={handleInstall} size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 gap-2">
        <Download size={14} />
        Instalar
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Smartphone size={20} className="text-primary" />
        </div>
        <div>
          <p className="font-bold text-sm text-foreground">Instalar Planta y Raiz</p>
          <p className="text-xs text-muted-foreground">Acesso rápido direto da sua tela</p>
        </div>
      </div>
      <Button onClick={handleInstall} disabled={installing} className="w-full bg-primary text-primary-foreground font-bold rounded-xl gap-2">
        <Download size={16} />
        {installing ? "Instalando..." : "Instalar App Gratuito"}
      </Button>

      <AnimatePresence>
        {showIOSHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 rounded-xl bg-muted/50 border border-border text-xs text-foreground space-y-2"
          >
            {isIOS ? (
              <>
                <p className="font-bold flex items-center gap-1.5">
                  <Share2 size={14} className="text-primary" /> Como instalar no iPhone/iPad:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Toque no botão <b>Compartilhar</b> (ícone de seta) na barra do Safari.</li>
                  <li>Role e selecione <b>“Adicionar à Tela de Início”</b>.</li>
                  <li>Toque em <b>Adicionar</b> no canto superior direito.</li>
                </ol>
              </>
            ) : (
              <>
                <p className="font-bold">Instalação manual:</p>
                <p className="text-muted-foreground">
                  Abra o menu do navegador (⋮) e toque em <b>“Instalar app”</b> ou <b>“Adicionar à tela inicial”</b>.
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
