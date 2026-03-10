import { motion, AnimatePresence } from "framer-motion";

interface FrogDoctorModeProps {
  size: number;
  isDoctor: boolean;
  lookingAtChart: boolean;
}

export const FrogDoctorMode = ({ size, isDoctor, lookingAtChart }: FrogDoctorModeProps) => {
  const s = size;

  return (
    <AnimatePresence>
      {isDoctor && (
        <motion.div
          className="absolute inset-0 z-30 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <svg
            viewBox={`0 0 ${s} ${s}`}
            width={s}
            height={s}
            className="absolute inset-0"
          >
            {/* White coat / jaleco — collar and lapels */}
            <path
              d={`M ${s * 0.28} ${s * 0.58} 
                  Q ${s * 0.25} ${s * 0.62} ${s * 0.22} ${s * 0.72}
                  L ${s * 0.22} ${s * 0.95}
                  L ${s * 0.78} ${s * 0.95}
                  L ${s * 0.78} ${s * 0.72}
                  Q ${s * 0.75} ${s * 0.62} ${s * 0.72} ${s * 0.58}`}
              fill="white"
              stroke="#e0e0e0"
              strokeWidth="1.5"
              opacity="0.92"
            />
            {/* Coat center line */}
            <line
              x1={s * 0.5} y1={s * 0.6}
              x2={s * 0.5} y2={s * 0.95}
              stroke="#d0d0d0"
              strokeWidth="0.8"
              strokeDasharray="3 2"
            />
            {/* Left lapel */}
            <path
              d={`M ${s * 0.42} ${s * 0.55} L ${s * 0.38} ${s * 0.65} L ${s * 0.45} ${s * 0.68} Z`}
              fill="#f5f5f5"
              stroke="#ddd"
              strokeWidth="0.8"
            />
            {/* Right lapel */}
            <path
              d={`M ${s * 0.58} ${s * 0.55} L ${s * 0.62} ${s * 0.65} L ${s * 0.55} ${s * 0.68} Z`}
              fill="#f5f5f5"
              stroke="#ddd"
              strokeWidth="0.8"
            />
            {/* Pocket */}
            <rect
              x={s * 0.3} y={s * 0.75}
              width={s * 0.12} height={s * 0.08}
              rx={s * 0.01}
              fill="none"
              stroke="#ccc"
              strokeWidth="0.8"
            />
            {/* Pen in pocket */}
            <line
              x1={s * 0.34} y1={s * 0.73}
              x2={s * 0.34} y2={s * 0.77}
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Stethoscope around neck */}
            <path
              d={`M ${s * 0.38} ${s * 0.52}
                  Q ${s * 0.35} ${s * 0.58} ${s * 0.33} ${s * 0.65}
                  Q ${s * 0.30} ${s * 0.75} ${s * 0.35} ${s * 0.82}
                  Q ${s * 0.38} ${s * 0.86} ${s * 0.40} ${s * 0.88}`}
              fill="none"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={`M ${s * 0.62} ${s * 0.52}
                  Q ${s * 0.65} ${s * 0.58} ${s * 0.67} ${s * 0.65}
                  Q ${s * 0.70} ${s * 0.75} ${s * 0.65} ${s * 0.82}
                  Q ${s * 0.62} ${s * 0.86} ${s * 0.60} ${s * 0.88}`}
              fill="none"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Stethoscope chest piece */}
            <circle
              cx={s * 0.50} cy={s * 0.90}
              r={s * 0.04}
              fill="#555"
              stroke="#333"
              strokeWidth="1.5"
            />
            <circle
              cx={s * 0.50} cy={s * 0.90}
              r={s * 0.02}
              fill="#888"
            />
            {/* Stethoscope tube connecting to chest piece */}
            <path
              d={`M ${s * 0.40} ${s * 0.88} Q ${s * 0.45} ${s * 0.91} ${s * 0.46} ${s * 0.90}`}
              fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"
            />
            <path
              d={`M ${s * 0.60} ${s * 0.88} Q ${s * 0.55} ${s * 0.91} ${s * 0.54} ${s * 0.90}`}
              fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"
            />
            {/* Earpieces */}
            <circle cx={s * 0.38} cy={s * 0.51} r={s * 0.015} fill="#555" />
            <circle cx={s * 0.62} cy={s * 0.51} r={s * 0.015} fill="#555" />
          </svg>

          {/* Clipboard / Prontuário — held in left hand */}
          <motion.div
            className="absolute z-40 pointer-events-none"
            style={{
              left: -s * 0.25,
              top: s * 0.35,
              width: s * 0.35,
              height: s * 0.45,
            }}
            animate={{
              rotate: lookingAtChart ? -5 : -25,
              y: lookingAtChart ? 0 : s * 0.05,
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 50 65" width="100%" height="100%">
              {/* Board */}
              <rect x="5" y="8" width="40" height="52" rx="3" fill="#8B6914" stroke="#6B4F10" strokeWidth="1.5" />
              {/* Paper */}
              <rect x="8" y="14" width="34" height="43" rx="1" fill="white" stroke="#ddd" strokeWidth="0.5" />
              {/* Clip */}
              <rect x="18" y="4" width="14" height="10" rx="2" fill="#888" stroke="#666" strokeWidth="1" />
              <rect x="21" y="6" width="8" height="4" rx="1" fill="#aaa" />
              {/* Text lines */}
              <line x1="12" y1="20" x2="35" y2="20" stroke="#ccc" strokeWidth="1" />
              <line x1="12" y1="25" x2="32" y2="25" stroke="#ccc" strokeWidth="1" />
              <line x1="12" y1="30" x2="37" y2="30" stroke="#ccc" strokeWidth="1" />
              <line x1="12" y1="35" x2="28" y2="35" stroke="#ccc" strokeWidth="1" />
              <line x1="12" y1="40" x2="34" y2="40" stroke="#ccc" strokeWidth="1" />
              {/* Green check */}
              <path d="M 14 44 L 17 48 L 24 40" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Vital signs icon */}
              <path d="M 28 46 L 30 42 L 32 50 L 34 44 L 36 46" stroke="#ef4444" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
