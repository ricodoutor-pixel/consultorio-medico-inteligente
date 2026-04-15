import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallButton({ variant = "default" }: { variant?: "default" | "compact" }) {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  if (isInstalled) {
    return (
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-primary text-sm font-bold">
        <Check size={16} /> App Instalado
      </motion.div>
    );
  }

  if (!canInstall) return null;

  const handleInstall = async () => {
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
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
    </motion.div>
  );
}
