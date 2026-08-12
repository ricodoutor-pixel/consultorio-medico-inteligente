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
}

export function VipUpgradePopup({ role, className = "" }: VipUpgradePopupProps) {
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
    medico: "Atenda mais, seja médico VIP agora!",
    paciente: "Acesse Benefícios, seja VIP agora!",
    lojista: "Venda mais, seja Loja VIP agora!",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`absolute z-[60] cursor-pointer ${className}`}
        onClick={handleCheckout}
      >
        <div className="relative flex items-center justify-center group">
          {/* Luz de fundo (Backlight) pulsante bem forte (green glow) */}
          <div className="absolute -inset-6 bg-emerald-500/30 rounded-full blur-2xl animate-pulse group-hover:bg-emerald-500/50 transition-colors duration-500" />
          <div className="absolute -inset-2 bg-primary/40 rounded-full blur-xl animate-pulse delay-75" />
          
          {/* Corpo do Pop-up Estilo Badge Premium */}
          <div className="relative flex items-center gap-2 bg-gradient-to-r from-[#003b24] via-primary to-emerald-600 border-2 border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.4)] rounded-full px-4 py-2 overflow-hidden">
            {/* Brilho varrendo (shimmer) */}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-20deg] animate-[shimmer_3s_infinite]" />
            
            {loading ? (
              <Loader2 size={16} className="text-white animate-spin shrink-0" />
            ) : (
              <Star size={16} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-[pulse_2s_infinite] shrink-0" />
            )}
            
            <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest drop-shadow-md whitespace-nowrap">
              {textMap[role]}
            </span>
            
            <Sparkles size={14} className="text-emerald-200 shrink-0" />
          </div>
          
          {/* Seta indicativa para baixo (Balão apontando para o avatar) */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-600 rotate-45 transform origin-center border-b-2 border-r-2 border-emerald-400/50 shadow-md" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
