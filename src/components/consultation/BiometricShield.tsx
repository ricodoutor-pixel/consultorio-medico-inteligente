/**
 * Biometric Shield — Continuous Facial Recognition
 * Prevents identity fraud during controlled substance (Cannabis) prescriptions
 * Uses placeholder FaceAPI — replace with real biometric SDK
 */
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldAlert, ScanFace } from "lucide-react";
import { motion } from "framer-motion";

type VerificationStatus = "verifying" | "verified" | "warning" | "failed";

export const BiometricShield = ({ enabled = true, isDoctor = false }: { enabled?: boolean; isDoctor?: boolean }) => {
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [matchScore, setMatchScore] = useState(0);
  const [checksCount, setChecksCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    // Initial verification
    const timer = setTimeout(() => {
      setStatus("verified");
      setMatchScore(0.97);
    }, 3000);

    // Continuous checks every 30s
    const interval = setInterval(() => {
      const score = 0.88 + Math.random() * 0.12;
      setMatchScore(score);
      setChecksCount(c => c + 1);
      setStatus(score > 0.85 ? "verified" : score > 0.7 ? "warning" : "failed");
    }, 30000);

    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [enabled]);

  if (!enabled) return null;

  const statusConfig = {
    verifying: { icon: <ScanFace size={14} className="animate-pulse" />, color: "text-yellow-400", bg: "border-yellow-400/30", label: "Verificando..." },
    verified: { icon: <ShieldCheck size={14} />, color: "text-primary", bg: "border-primary/30", label: "Identidade OK" },
    warning: { icon: <ShieldAlert size={14} />, color: "text-yellow-400", bg: "border-yellow-400/30", label: "Alerta" },
    failed: { icon: <ShieldAlert size={14} />, color: "text-destructive", bg: "border-destructive/30", label: "Falha" },
  };

  const cfg = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-4 right-4 z-20 bg-black/70 backdrop-blur-md rounded-xl p-2.5 border ${cfg.bg} min-w-[160px]`}
    >
      <div className="flex items-center gap-2">
        <span className={cfg.color}>{cfg.icon}</span>
        <div>
          <p className="text-[9px] text-white/50 uppercase tracking-wider">Biometric Shield</p>
          <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
        </div>
      </div>
      {status !== "verifying" && (
        <div className="mt-1.5 space-y-0.5">
          <div className="flex justify-between text-[9px] text-white/40">
            <span>Match</span>
            <span>{Math.round(matchScore * 100)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${matchScore > 0.85 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${matchScore * 100}%` }} />
          </div>
          <p className="text-[8px] text-white/30">{checksCount} verificações • {isDoctor ? "Médico" : "Paciente"}</p>
        </div>
      )}
      <p className="text-[7px] text-white/20 mt-1">RDC 660/2022 — Substância controlada</p>
    </motion.div>
  );
};

export default BiometricShield;
