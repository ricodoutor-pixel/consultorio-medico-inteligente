import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PlanSku } from "@/lib/pricing";

interface VipUpgradePopupProps {
  role: "medico" | "paciente" | "lojista";
  className?: string;
  /** Renderiza em fluxo normal (sem absolute) para evitar sobreposição */
  inline?: boolean;
}

export function VipUpgradePopup({ role, className = "", inline = false }: VipUpgradePopupProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado para assinar o plano.");
        navigate("/login");
        return;
      }

      const skuMap: Record<string, PlanSku> = {
        medico: "plano_medico",
        paciente: "plano_paciente",
        lojista: "plano_lojista",
      };

      const sku = skuMap[role];

      const { data, error } = await supabase.functions.invoke("mp-checkout", {
        body: {
          sku,
          returnUrl: "https://www.plantayraiz.com.br/pagamento/sucesso",
        },
      });

      if (error) throw error;

      if (data?.init_point) {
        toast.success("Redirecionando para o Mercado Pago...");
        window.location.href = data.init_point;
      } else {
        toast.error(data?.error || "Erro ao gerar checkout");
      }
    } catch (err) {
      console.error("[VipUpgradePopup]", err);
      toast.error("Erro ao iniciar assinatura. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const textMap = {
    medico: "Atenda mais, seja médico VIP agora! R$ 99/mês",
    paciente: "Acesse Benefícios, seja VIP agora! R$ 99/mês",
    lojista: "Venda mais, seja Loja VIP agora! R$ 99/mês",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`${inline ? "relative inline-flex" : "absolute"} z-[60] cursor-pointer ${className}`}
        onClick={handleCheckout}
        role="button"
        aria-label={textMap[role]}
      >
        <div className="relative flex items-center justify-center group">
          {/* Luz de fundo (Backlight) pulsante bem forte (green glow) */}
          <div className="absolute -inset-4 bg-emerald-500/30 rounded-full blur-xl animate-pulse group-hover:bg-emerald-500/50 transition-colors duration-500" />
          <div className="absolute -inset-1 bg-primary/40 rounded-full blur-md animate-pulse delay-75" />
          
          {/* Corpo do Pop-up Estilo Badge Premium */}
          <div className="relative flex items-center gap-1.5 bg-gradient-to-r from-[#003b24] via-primary to-emerald-600 border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.4)] rounded-full px-2.5 py-1 overflow-hidden">
            {/* Brilho varrendo (shimmer) */}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-20deg] animate-[shimmer_3s_infinite]" />
            
            {loading ? (
              <Loader2 size={10} className="text-white animate-spin shrink-0" />
            ) : (
              <Star size={10} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)] animate-[pulse_2s_infinite] shrink-0" />
            )}
            
            <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-wider drop-shadow-md whitespace-nowrap">
              {textMap[role]}
            </span>
            
            <Sparkles size={10} className="text-emerald-200 shrink-0" />
          </div>
          
          {/* Seta indicativa para baixo (Balão apontando para o avatar) */}
          {!inline && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 rotate-45 transform origin-center border-b border-r border-emerald-400/50 shadow-md" />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
