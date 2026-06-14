import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Boas-vindas flutuante exibido na primeira visita da sessão.
 * Mostra o mascote Dr. Verdinho (favicon em tamanho máximo) com o título
 * "Planta y Raiz Ltda — Sua Mega Clínica Digital".
 */
export function WelcomeMascotSplash() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("pr_welcome_seen") === "1") return;
    } catch { /* ignore */ }
    const t = setTimeout(() => setOpen(true), 300);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem("pr_welcome_seen", "1"); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(close, 4200);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="relative flex flex-col items-center text-center"
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <motion.img
              src="/dr-verdinho-mascot.png?v=8"
              alt="Dr. Verdinho — Planta y Raiz"
              className="w-[clamp(180px,55vw,360px)] h-auto drop-shadow-[0_20px_40px_rgba(34,197,94,0.45)]"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              draggable={false}
            />
            <motion.h2
              className="mt-4 font-display font-black text-2xl sm:text-3xl text-white drop-shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              Planta y Raiz Ltda
            </motion.h2>
            <motion.p
              className="mt-1 text-sm sm:text-base font-bold text-[#22C55E]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Sua Mega Clínica Digital
            </motion.p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); close(); }}
              className="mt-5 text-xs uppercase tracking-widest text-white/70 hover:text-white"
            >
              Entrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WelcomeMascotSplash;
