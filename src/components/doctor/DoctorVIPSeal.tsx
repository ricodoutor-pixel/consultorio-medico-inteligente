import { ShieldCheck, Crown, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

type SealType = "vip" | "premium" | "enterprise" | null;

export const DoctorVIPSeal = ({ tier, size = "sm", npsScore }: { tier?: string | null; size?: "sm" | "lg"; npsScore?: number | null }) => {
  if (!tier) return null;

  const isLarge = size === "lg";

  if (tier === "basic") {
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <Badge className={`bg-primary/15 text-primary border-primary/30 font-black gap-1 ${isLarge ? "text-sm px-3 py-1" : "text-[10px] px-2"}`}
          style={{ boxShadow: "0 0 8px hsl(152 80% 45% / 0.3)" }}>
          <ShieldCheck size={isLarge ? 14 : 10} /> VIP
          <span className="text-[8px] font-bold opacity-70 ml-0.5">TAXA ZERO</span>
        </Badge>
      </motion.div>
    );
  }

  if (tier === "professional") {
    return (
      <Badge className={`bg-blue-500/15 text-blue-400 border-blue-500/30 font-black gap-1 ${isLarge ? "text-sm px-3 py-1" : "text-[10px] px-2"}`}>
        <ShieldCheck size={isLarge ? 14 : 10} /> Profissional
      </Badge>
    );
  }

  if (tier === "premium") {
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <Badge className={`bg-amber-500/15 text-amber-400 border-amber-500/30 font-black gap-1 ${isLarge ? "text-sm px-3 py-1" : "text-[10px] px-2"}`}
          style={{ boxShadow: "0 0 10px hsl(45 90% 55% / 0.25)" }}>
          <Crown size={isLarge ? 14 : 10} /> Premium
          <Sparkles size={isLarge ? 10 : 8} className="text-amber-300" />
        </Badge>
      </motion.div>
    );
  }

  if (tier === "enterprise") {
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <Badge className={`bg-purple-500/15 text-purple-400 border-purple-500/30 font-black gap-1 ${isLarge ? "text-sm px-3 py-1" : "text-[10px] px-2"}`}
          style={{ boxShadow: "0 0 12px hsl(270 60% 60% / 0.3)" }}>
          <Crown size={isLarge ? 14 : 10} /> Enterprise
          <Sparkles size={isLarge ? 10 : 8} className="text-purple-300" />
        </Badge>
      </motion.div>
    );
  }

  return null;
};

export const NPSScoreBadge = ({ score }: { score?: number | null }) => {
  if (score === null || score === undefined) return null;
  const color = score >= 70 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : score >= 30 ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : "text-red-400 border-red-500/30 bg-red-500/10";
  return (
    <Badge variant="outline" className={`${color} text-[9px] font-bold gap-0.5`}>
      <Star size={8} /> NPS {score}
    </Badge>
  );
};
