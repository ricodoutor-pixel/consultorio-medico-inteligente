import { motion, AnimatePresence } from "framer-motion";

interface FrogDoctorModeProps {
  size: number;
  isDoctor: boolean;
  lookingAtChart: boolean;
}

export const FrogDoctorMode = ({ size, isDoctor, lookingAtChart }: FrogDoctorModeProps) => {
  const coatW = size * 0.34;
  const coatH = size * 0.22;

  return (
    <AnimatePresence>
      {isDoctor && (
        <motion.div
          className="absolute inset-0 z-30 pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* White doctor coat with vertical dark tie and pocket with pen */}
          <svg
            className="absolute pointer-events-none"
            style={{
              bottom: size * 0.10,
              left: (size - coatW) / 2,
              width: coatW,
              height: coatH,
            }}
            viewBox="0 0 120 80"
            fill="none"
          >
            <path
              d="M8 8 Q8 0 20 0 L100 0 Q112 0 112 8 L115 72 Q115 80 105 80 L15 80 Q5 80 5 72 Z"
              fill="url(#coatGrad2)"
              stroke="#c8c8c8"
              strokeWidth="1"
            />
            <path d="M38 0 L60 22 L48 0 Z" fill="#e8e8e8" opacity="0.7" />
            <path d="M82 0 L60 22 L72 0 Z" fill="#e8e8e8" opacity="0.7" />
            <path d="M32 0 Q40 10 60 13 Q80 10 88 0" stroke="#bbb" strokeWidth="1.5" fill="none" />

            {/* Dark vertical tie (gravata vertical escura) — raised 10% */}
            <rect x="57" y="7" width="6" height="55" rx="2" fill="#1a1a1a" />
            <rect x="58" y="8" width="4" height="53" rx="1.5" fill="#222" opacity="0.8" />
            {/* Tie knot */}
            <path d="M55 6 L60 12 L65 6 Z" fill="#111" />
            <rect x="56" y="5" width="8" height="4" rx="1.5" fill="#1a1a1a" />
            {/* Tie tip */}
            <path d="M57 62 L60 68 L63 62 Z" fill="#1a1a1a" />

            {/* Left pocket with pen */}
            <rect x="15" y="38" width="18" height="14" rx="2.5" fill="#f5f5f5" stroke="#d0d0d0" strokeWidth="0.8" />
            <rect x="22" y="32" width="2" height="12" rx="0.8" fill="#1a1a1a" />
            <rect x="22" y="31" width="2" height="3" rx="0.5" fill="#2563eb" />
            <circle cx="23" cy="31" r="1" fill="#3b82f6" />

            {/* Buttons */}
            <circle cx="50" cy="22" r="2.5" fill="#e0e0e0" stroke="#aaa" strokeWidth="0.6" />
            <circle cx="50" cy="36" r="2.5" fill="#e0e0e0" stroke="#aaa" strokeWidth="0.6" />
            <circle cx="50" cy="50" r="2.5" fill="#e0e0e0" stroke="#aaa" strokeWidth="0.6" />

            {/* Name badge */}
            <rect x="72" y="38" width="28" height="12" rx="2.5" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.6" />
            <text x="86" y="46" textAnchor="middle" fontSize="4.5" fill="#1e40af" fontWeight="bold">Dr. Verdinho</text>

            <defs>
              <linearGradient id="coatGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#fafafa" />
                <stop offset="100%" stopColor="#f0f1f3" />
              </linearGradient>
            </defs>
          </svg>

           {/* Head mirror — lowered 40% more + 30% bigger */}
          <svg
            className="absolute pointer-events-none"
            style={{
              top: size * 0.242,
              left: size * 0.31,
              width: size * 0.4,
              height: size * 0.157,
            }}
            viewBox="0 0 60 22"
            fill="none"
          >
            <path d="M5 14 Q30 4 55 14" stroke="#999" strokeWidth="1.8" fill="none" />
            <circle cx="30" cy="9" r="7" fill="url(#mirrorGrad2)" stroke="#aaa" strokeWidth="1.2" />
            <circle cx="27" cy="7" r="2.5" fill="white" opacity="0.65" />
            <defs>
              <radialGradient id="mirrorGrad2" cx="38%" cy="33%">
                <stop offset="0%" stopColor="#f8f8f8" />
                <stop offset="100%" stopColor="#b8b8b8" />
              </radialGradient>
            </defs>
          </svg>

          {/* Clipboard/chart — lowered 10% more + 10% bigger */}
          <motion.svg
            className="absolute pointer-events-none"
            style={{
              right: -size * 0.12,
              top: size * 0.50,
              width: size * 0.33,
              height: size * 0.319,
            }}
            viewBox="0 0 45 60"
            fill="none"
            animate={{
              opacity: lookingAtChart ? 1 : 0.6,
              scale: lookingAtChart ? 1.05 : 0.95,
              rotate: lookingAtChart ? -5 : -2,
            }}
            transition={{ duration: 0.8 }}
          >
            <rect x="2" y="6" width="40" height="52" rx="3" fill="#f5f0e0" stroke="#c4a44a" strokeWidth="1.5" />
            <rect x="14" y="1" width="18" height="9" rx="2.5" fill="#8B7355" stroke="#6b5a3e" strokeWidth="1" />
            <circle cx="23" cy="5.5" r="2.2" fill="#c4a44a" />
            <rect x="6" y="13" width="30" height="5" rx="1" fill="#f5f0e0" />
            <text x="21" y="17" textAnchor="middle" fontSize="3.5" fill="#8B7355" fontWeight="bold">Paciente</text>
            <line x1="6" y1="22" x2="36" y2="22" stroke="#ccc" strokeWidth="0.8" />
            <line x1="6" y1="27" x2="32" y2="27" stroke="#ccc" strokeWidth="0.8" />
            <line x1="6" y1="32" x2="34" y2="32" stroke="#ccc" strokeWidth="0.8" />
            <line x1="6" y1="37" x2="28" y2="37" stroke="#ccc" strokeWidth="0.8" />
            <rect x="6" y="41" width="3" height="3" rx="0.5" stroke="#888" strokeWidth="0.5" fill="none" />
            <line x1="6.5" y1="42.5" x2="7.5" y2="43.5" stroke="#22c55e" strokeWidth="0.8" />
            <line x1="7.5" y1="43.5" x2="9" y2="41.5" stroke="#22c55e" strokeWidth="0.8" />
            <line x1="11" y1="43" x2="30" y2="43" stroke="#ccc" strokeWidth="0.6" />
            <rect x="6" y="46" width="3" height="3" rx="0.5" stroke="#888" strokeWidth="0.5" fill="none" />
            <line x1="11" y1="48" x2="28" y2="48" stroke="#ccc" strokeWidth="0.6" />
            <polyline
              points="6,53 10,53 12,47 14,57 16,51 18,53 22,53 24,47 26,55 28,53 30,53 34,53"
              stroke="#ef4444"
              strokeWidth="1"
              fill="none"
            />
          </motion.svg>

          {/* Green frog hand holding clipboard — lowered */}
          <svg
            className="absolute pointer-events-none"
            style={{
              right: -size * 0.02,
              top: size * 0.78,
              width: size * 0.12,
              height: size * 0.1,
            }}
            viewBox="0 0 20 16"
            fill="none"
          >
            <ellipse cx="10" cy="8" rx="8" ry="6" fill="#5bb85b" />
            <ellipse cx="10" cy="8" rx="6" ry="4.5" fill="#6ecf6e" opacity="0.7" />
          </svg>

          {/* Doctor emoji floating */}
          <motion.span
            className="absolute -top-1 -right-1 text-sm z-40"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            🩺
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
