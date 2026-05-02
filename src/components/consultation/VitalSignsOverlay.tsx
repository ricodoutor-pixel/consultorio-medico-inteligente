/**
 * Biofeedback Module — rPPG Vital Signs Overlay
 * Extracts simulated heart rate from video stream via rPPG API placeholder
 * Displays real-time vitals on doctor's view during teleconsultation
 */
import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Heart, Thermometer, Activity, Wind, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VitalReading {
  heartRate: number;
  spO2: number;
  respRate: number;
  stress: "low" | "moderate" | "high";
  confidence: number;
}

// Simulated rPPG signal processing — replace with real API
const simulateRPPG = (): VitalReading => ({
  heartRate: 68 + Math.floor(Math.random() * 15),
  spO2: 96 + Math.floor(Math.random() * 4),
  respRate: 14 + Math.floor(Math.random() * 6),
  stress: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "moderate" : "low",
  confidence: 0.85 + Math.random() * 0.12,
});

export const VitalSignsOverlay = ({ enabled = true }: { enabled?: boolean }) => {
  const [vitals, setVitals] = useState<VitalReading | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const reading = simulateRPPG();
      setVitals(reading);
      setHistory(prev => [...prev.slice(-29), reading.heartRate]);
    }, 2000);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || !vitals) return null;

  const stressColor = vitals.stress === "high" ? "text-destructive" : vitals.stress === "moderate" ? "text-yellow-400" : "text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 left-4 z-20 space-y-2"
    >
      <div className="bg-black/70 backdrop-blur-md rounded-xl p-3 border border-primary/20 min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <Eye size={12} className="text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">rPPG Biofeedback</span>
          <Badge variant="outline" className="text-[8px] h-4 border-primary/30 text-primary">
            {Math.round(vitals.confidence * 100)}% conf.
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <VitalCard icon={<Heart size={14} />} label="FC" value={`${vitals.heartRate}`} unit="bpm" color="text-red-400" />
          <VitalCard icon={<Activity size={14} />} label="SpO₂" value={`${vitals.spO2}`} unit="%" color="text-blue-400" />
          <VitalCard icon={<Wind size={14} />} label="FR" value={`${vitals.respRate}`} unit="rpm" color="text-cyan-400" />
          <VitalCard icon={<Thermometer size={14} />} label="Stress" value={vitals.stress.toUpperCase()} unit="" color={stressColor} />
        </div>

        {/* Mini ECG-like waveform */}
        <div className="mt-2 h-8 flex items-end gap-[2px]">
          {history.map((hr, i) => (
            <div
              key={i}
              className="bg-primary/60 rounded-sm flex-1 min-w-[3px] transition-all duration-300"
              style={{ height: `${Math.max(10, ((hr - 55) / 35) * 100)}%` }}
            />
          ))}
        </div>
        <p className="text-[8px] text-white/30 mt-1">⚠️ Valores estimados por rPPG — não substitui oxímetro clínico</p>
      </div>
    </motion.div>
  );
};

const VitalCard = ({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) => (
  <div className="flex items-center gap-1.5">
    <span className={color}>{icon}</span>
    <div>
      <p className="text-[9px] text-white/50">{label}</p>
      <p className={`text-sm font-bold ${color}`}>
        {value}<span className="text-[8px] font-normal ml-0.5">{unit}</span>
      </p>
    </div>
  </div>
);

export default VitalSignsOverlay;
