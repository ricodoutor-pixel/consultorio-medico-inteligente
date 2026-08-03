import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Siren, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const EMERGENCY_WA = `https://wa.me/5511987131241?text=${encodeURIComponent(
  "Olá, eu sou paciente, estou com dor e preciso de atenção médica de urgência."
)}`;

/**
 * Botão EMERGÊNCIA pulsátil com giroflex de ambulância.
 * Só pacientes logados conseguem abrir o WhatsApp do Dr. Edilson.
 */
export function EmergencyCTA() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setIsAuthed(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setIsAuthed(!!s?.user);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthed) {
      toast({
        title: "Acesso exclusivo a pacientes cadastrados",
        description: "Faça login (ou cadastre-se gratuitamente) para falar AGORA com o Dr. Edilson em caso de urgência.",
      });
      navigate("/login?redirect=/&emergency=1");
      return;
    }
    window.open(EMERGENCY_WA, "_blank", "noopener,noreferrer");
  }, [isAuthed, navigate]);

  return (
    <div className="w-full flex flex-col items-center my-8 px-4">
      {/* Giroflex realista */}
      <div className="relative h-16 w-32 mb-3 flex items-end justify-center">
        {/* Base da ambulância (carcaça) */}
        <div className="absolute bottom-0 w-28 h-4 rounded-md bg-gradient-to-b from-zinc-200 to-zinc-400 shadow-md" />
        {/* Cúpula do giroflex */}
        <div className="absolute bottom-3 w-16 h-8 rounded-t-full overflow-hidden border border-zinc-500/40 bg-zinc-900/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]">
          {/* Luz vermelha rotativa */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              background: "conic-gradient(from 0deg, rgba(255,0,0,0.95) 0deg, rgba(255,0,0,0) 90deg, rgba(255,0,0,0) 180deg, rgba(255,0,0,0.95) 270deg, rgba(255,0,0,0) 360deg)",
              filter: "blur(4px)",
            }}
          />
          {/* Luz azul rotativa (defasada) */}
          <motion.div
            className="absolute inset-0 mix-blend-screen"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            style={{
              background: "conic-gradient(from 180deg, rgba(0,120,255,0.9) 0deg, rgba(0,120,255,0) 90deg, rgba(0,120,255,0) 180deg, rgba(0,120,255,0.9) 270deg, rgba(0,120,255,0) 360deg)",
              filter: "blur(4px)",
            }}
          />
          {/* Domo brilho */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
        </div>
        {/* Brilho ao redor (halo pulsante) */}
        <motion.div
          aria-hidden
          className="absolute bottom-3 w-16 h-8 rounded-t-full"
          animate={{ boxShadow: [
            "0 0 12px 4px rgba(255,0,0,0.6)",
            "0 0 20px 8px rgba(0,120,255,0.6)",
            "0 0 12px 4px rgba(255,0,0,0.6)",
          ] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Botão pulsátil */}
      <button
        onClick={handleClick}
        aria-label="Botão de Emergência — falar com o Dr. Edilson Bezerra ON agora"
        className="relative group inline-flex items-center justify-center gap-3 px-8 py-5 sm:px-12 sm:py-6 rounded-2xl font-display font-black text-xl sm:text-3xl tracking-wider text-white shadow-[0_0_40px_rgba(239,68,68,0.6)] overflow-hidden"
        style={{ background: "linear-gradient(135deg,#dc2626 0%,#ef4444 50%,#b91c1c 100%)" }}
      >
        {/* Pulso de fundo */}
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-red-500/60"
          animate={{ scale: [1, 1.18, 1], opacity: [0.75, 0, 0.75] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-2xl ring-4 ring-red-300/60"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
        <Siren className="relative z-10 animate-pulse" size={28} />
        <span className="relative z-10">EMERGÊNCIA</span>
        <Phone className="relative z-10" size={24} />
      </button>

      <p className="mt-3 text-center text-sm sm:text-base font-bold text-red-300 max-w-md">
        Em caso de dor, clique no botão e fale com um Médico AGORA.
      </p>
      {!isAuthed && (
        <p className="mt-1 text-center text-[11px] uppercase tracking-wider text-white/60">
          <br />
        </p>
      )}
    </div>
  );
}

export default EmergencyCTA;
