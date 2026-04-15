import { AlertTriangle, Phone, Calendar, HeartPulse } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { SentimentLevel } from "@/lib/sentimentAnalysis";
import { BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";

interface UrgencyAlertProps {
  level: SentimentLevel;
  triggers: string[];
  onDismiss: () => void;
}

export const UrgencyAlert = ({ level, triggers, onDismiss }: UrgencyAlertProps) => {
  const navigate = useNavigate();

  if (level === "normal") return null;

  const configs = {
    concern: {
      icon: Calendar,
      title: "Posso te ajudar com isso!",
      description: "Nossos médicos especialistas podem avaliar seu caso.",
      cta: "Agendar Consulta",
      ctaAction: () => { onDismiss(); navigate("/agendamento"); },
      className: "border-yellow-500/30 bg-yellow-500/10",
      iconColor: "text-yellow-500",
    },
    urgent: {
      icon: AlertTriangle,
      title: "⚠️ Detectamos uma urgência",
      description: "Recomendamos atendimento médico imediato.",
      cta: "Agendar AGORA — Prioritário",
      ctaAction: () => { onDismiss(); navigate("/agendamento"); },
      className: "border-amber-500/50 bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    emergency: {
      icon: HeartPulse,
      title: "🚨 Situação de Emergência",
      description: "Ligue 192 (SAMU) ou procure o pronto-socorro mais próximo. Nossa equipe também pode ajudar.",
      cta: "Falar com Enfermeira Brisa",
      ctaAction: () => {
        window.open(
          `https://wa.me/${BRISA_WHATSAPP}?text=${encodeURIComponent("URGÊNCIA: Preciso de ajuda médica imediata!")}`,
          "_blank"
        );
      },
      className: "border-red-500/50 bg-red-500/10",
      iconColor: "text-red-500",
    },
  };

  const config = configs[level];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`mx-2 my-2 p-3 rounded-xl border ${config.className}`}
    >
      <div className="flex items-start gap-2">
        <Icon size={18} className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold ${config.iconColor}`}>{config.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{config.description}</p>
          {level === "emergency" && (
            <p className="text-[10px] font-bold text-red-400 mt-1">📞 SAMU: 192 | Bombeiros: 193</p>
          )}
          <button
            onClick={config.ctaAction}
            className={`mt-2 text-xs px-4 py-1.5 rounded-full font-bold transition-all ${
              level === "emergency"
                ? "bg-red-500 text-white animate-pulse hover:animate-none"
                : level === "urgent"
                  ? "bg-amber-500 text-black animate-pulse hover:animate-none"
                  : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {config.cta}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
