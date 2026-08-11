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
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`absolute -top-10 -left-6 z-50 cursor-pointer ${className}`}
        onClick={handleCheckout}
      >
        <div className="relative group">
          {/* Fundo pulsante brilhante */}
          <div className="absolute inset-0 bg-primary/40 rounded-full blur-md animate-pulse group-hover:bg-primary/60 transition-colors" />
          
          {/* Bolha principal */}
          <div className="relative flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary to-emerald-600 rounded-full shadow-xl border border-primary/50 text-primary-foreground whitespace-nowrap overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-15deg] animate-[shimmer_2.5s_infinite]" />
            
            {loading ? (
              <Loader2 size={12} className="animate-spin shrink-0" />
            ) : (
              <Sparkles size={12} className="text-yellow-300 shrink-0" />
            )}
            
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight drop-shadow-md">
              {textMap[role]}
            </span>
          </div>

          {/* Seta do Balão apontando pra baixo */}
          <div className="absolute -bottom-1.5 left-8 w-3 h-3 bg-emerald-600 rotate-45 transform origin-center border-b border-r border-primary/50 shadow-md" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
