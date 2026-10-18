/**
 * Biofeedback Module — rPPG Vital Signs Overlay
 * CONFORMIDADE REGULATÓRIA: ANVISA RDC 657/2022 (SaMD) & CFM Resolução 2.314/2022
 * 
 * SEGURANÇA CLÍNICA CRÍTICA:
 * - PROIBIDO gerar sinais vitais fictícios (Math.random()) durante teleconsultas reais.
 * - Valores de FC e SpO2 são exibidos APENAS se houver sensor físico pareado ou exame real homologado.
 * - Sem sensor conectado, exibe '--' com rotulagem visível e inequívoca de 'NÃO CALIBRADO / SEM SENSOR'.
 */
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Heart, Activity, Wind, AlertTriangle, WifiOff, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export interface VitalReading {
  heartRate?: number | null;
  spO2?: number | null;
  respRate?: number | null;
  calibrated: boolean;
  source: "bluetooth_sensor" | "diagnostic_exam" | "uncalibrated_experimental" | "none";
  timestamp?: string;
}

interface VitalSignsOverlayProps {
  enabled?: boolean;
  patientId?: string;
  appointmentId?: string;
  realVitals?: VitalReading | null;
}

export const VitalSignsOverlay = ({
  enabled = true,
  patientId,
  appointmentId,
  realVitals,
}: VitalSignsOverlayProps) => {
  const [vitals, setVitals] = useState<VitalReading>({
    heartRate: null,
    spO2: null,
    respRate: null,
    calibrated: false,
    source: "none",
  });

  useEffect(() => {
    if (!enabled) return;

    // 1. Se sinais vitais reais foram passados via prop (ex: oxímetro Bluetooth ou exame)
    if (realVitals) {
      setVitals(realVitals);
      return;
    }

    // 2. Busca o último registro real de exame diagnóstico desse paciente no Supabase
    let isMounted = true;
    const fetchLatestRealExam = async () => {
      if (!patientId && !appointmentId) return;

      try {
        const query = supabase
          .from("diagnostic_exams")
          .select("exam_type, results, ai_diagnosis, created_at")
          .order("created_at", { ascending: false })
          .limit(1);

        if (patientId) query.eq("user_id", patientId);

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          if (isMounted) {
            setVitals({
              heartRate: null,
              spO2: null,
              respRate: null,
              calibrated: false,
              source: "none",
            });
          }
          return;
        }

        const latest = data[0];
        const res = (latest.results || latest.ai_diagnosis || {}) as any;
        const hr = res.bpm || res.heartRate || res.fc || null;
        const spo2 = res.spo2 || res.spO2 || null;

        if (isMounted) {
          if (hr || spo2) {
            setVitals({
              heartRate: typeof hr === "number" ? hr : null,
              spO2: typeof spo2 === "number" ? spo2 : null,
              respRate: null,
              calibrated: true,
              source: "diagnostic_exam",
              timestamp: latest.created_at,
            });
          } else {
            setVitals({
              heartRate: null,
              spO2: null,
              respRate: null,
              calibrated: false,
              source: "none",
            });
          }
        }
      } catch (err) {
        console.warn("[VitalSignsOverlay] Erro ao buscar dados clínicos reais:", err);
      }
    };

    fetchLatestRealExam();
    const interval = setInterval(fetchLatestRealExam, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [enabled, patientId, appointmentId, realVitals]);

  if (!enabled) return null;

  const isRealData = vitals.calibrated && (vitals.heartRate !== null || vitals.spO2 !== null);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 left-4 z-20 space-y-2 max-w-[280px]"
    >
      <div className="bg-zinc-950/90 backdrop-blur-md rounded-xl p-3.5 border border-amber-500/40 shadow-xl">
        {/* Header com Alerta Regulatório Explícito */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5">
            {isRealData ? (
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            ) : (
              <WifiOff size={13} className="text-amber-400 shrink-0" />
            )}
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-200">
              {isRealData ? "Biofeedback Clínico" : "Sinais Vitais (IoMT)"}
            </span>
          </div>

          <Badge
            variant="outline"
            className={`text-[8px] h-4 px-1.5 font-bold uppercase ${
              isRealData
                ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/30"
                : "border-amber-500/50 text-amber-300 bg-amber-950/40"
            }`}
          >
            {isRealData ? "Dado Real Registrado" : "Não Calibrado / Sem Sensor"}
          </Badge>
        </div>

        {/* Grade de Valores: Mostra '--' se não houver medição real conectada */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
          <VitalCard
            icon={<Heart size={14} />}
            label="FC (Frequência)"
            value={vitals.heartRate !== null ? `${vitals.heartRate}` : "--"}
            unit={vitals.heartRate !== null ? "bpm" : ""}
            color={vitals.heartRate !== null ? "text-red-400" : "text-zinc-500"}
          />
          <VitalCard
            icon={<Activity size={14} />}
            label="SpO₂ (Saturação)"
            value={vitals.spO2 !== null ? `${vitals.spO2}` : "--"}
            unit={vitals.spO2 !== null ? "%" : ""}
            color={vitals.spO2 !== null ? "text-blue-400" : "text-zinc-500"}
          />
          <VitalCard
            icon={<Wind size={14} />}
            label="FR (Respiratória)"
            value={vitals.respRate !== null ? `${vitals.respRate}` : "--"}
            unit={vitals.respRate !== null ? "rpm" : ""}
            color={vitals.respRate !== null ? "text-cyan-400" : "text-zinc-500"}
          />
          <VitalCard
            icon={<ShieldAlert size={14} />}
            label="Status Sensor"
            value={isRealData ? "CONECTADO" : "PENDENTE"}
            unit=""
            color={isRealData ? "text-emerald-400" : "text-amber-400"}
          />
        </div>

        {/* Alerta de Segurança e Aviso de Responsabilidade Clínica */}
        <div className="mt-2.5 p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-200">
          <div className="flex items-start gap-1.5">
            <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[8.5px] leading-tight font-medium text-amber-100/90">
              {isRealData ? (
                <>
                  Medição obtida via registro clínico anterior ({new Date(vitals.timestamp || "").toLocaleTimeString()}). 
                  Valide com o paciente antes de adotar conduta.
                </>
              ) : (
                <>
                  <strong className="text-amber-300">Aviso Clínico (ANVISA RDC 657/2022):</strong> Nenhum sensor de oximetria pareado. 
                  Valores não calibrados não devem ser utilizados para diagnóstico ou decisão médica.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const VitalCard = ({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
}) => (
  <div className="flex items-center gap-1.5">
    <span className={color}>{icon}</span>
    <div>
      <p className="text-[8.5px] text-zinc-400 font-medium">{label}</p>
      <p className={`text-sm font-black ${color}`}>
        {value}
        {unit && <span className="text-[8px] font-normal text-zinc-400 ml-0.5">{unit}</span>}
      </p>
    </div>
  </div>
);

export default VitalSignsOverlay;
