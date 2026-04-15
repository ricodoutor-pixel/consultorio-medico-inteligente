/**
 * 🐸 Planta y Raiz — Offline Alert
 * Toast persistente quando o sinal cai
 */

import { useEffect, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineAlert() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const wasShown = useRef(false);

  useEffect(() => {
    if (!isOnline) wasShown.current = true;
  }, [isOnline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3 rounded-2xl bg-destructive/90 backdrop-blur-xl border border-destructive/40 shadow-2xl"
        >
          <WifiOff className="h-5 w-5 text-destructive-foreground animate-pulse" />
          <div>
            <p className="text-sm font-bold text-destructive-foreground">
              Você está em modo offline
            </p>
            <p className="text-xs text-destructive-foreground/80">
              Seus dados estão salvos localmente
            </p>
          </div>
        </motion.div>
      )}

      {wasOffline && isOnline && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/90 backdrop-blur-xl border border-primary/40 shadow-2xl"
        >
          <Wifi className="h-5 w-5 text-primary-foreground" />
          <div>
            <p className="text-sm font-bold text-primary-foreground">
              Conexão restaurada
            </p>
            <p className="text-xs text-primary-foreground/80">
              Sincronizando dados...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
