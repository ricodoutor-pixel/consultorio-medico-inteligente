import { motion, AnimatePresence } from "framer-motion";

interface FrogDoctorModeProps {
  size: number;
  isDoctor: boolean;
  lookingAtChart: boolean;
}

export const FrogDoctorMode = ({ size, isDoctor, lookingAtChart }: FrogDoctorModeProps) => {
  // Coat is 30% of original (70% reduction)
  const coatW = size * 0.27;
  const coatH = size * 0.165;

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
          {/* Small white doctor coat overlay on bottom */}
          <svg
            className="absolute pointer-events-none"
            style={{
              bottom: size * 0.05,
              left: (size - coatW) / 2,
              width: coatW,
              height: coatH,
            }}
            viewBox="0 0 100 60"
            fill="none"
          >
            <path
              d="M10 5 Q10 0 20 0 L80 0 Q90 0 90 5 L92 55 Q92 60 85 60 L15 60 Q8 60 8 55 Z"
              fill="url(#coatGrad)"
              stroke="#d0d0d0"
              strokeWidth="0.8"
            />
            {/* Collar / lapels */}
            <path d="M35 0 L50 18 L42 0 Z" fill="#e8e8e8" opacity="0.6" />
            <path d="M65 0 L50 18 L58 0 Z" fill="#e8e8e8" opacity="0.6" />
            <path d="M30 0 Q35 8 50 10 Q65 8 70 0" stroke="#ccc" strokeWidth="1.2" fill="none" />
            {/* Pocket */}
            <rect x="60" y="25" width="18" height="14" rx="2" fill="#f0f0f0" stroke="#d0d0d0" strokeWidth="0.6" />
            {/* Pen in pocket */}
            <rect x="66" y="20" width="2" height="10" rx="1" fill="#2563eb" />
            <circle cx="67" cy="20" r="1.5" fill="#1d4ed8" />
            {/* Buttons */}
            <circle cx="50" cy="22" r="2" fill="#e0e0e0" stroke="#bbb" strokeWidth="0.5" />
            <circle cx="50" cy="34" r="2" fill="#e0e0e0" stroke="#bbb" strokeWidth="0.5" />
            <circle cx="50" cy="46" r="2" fill="#e0e0e0" stroke="#bbb" strokeWidth="0.5" />
            {/* Name badge */}
            <rect x="18" y="15" width="22" height="10" rx="2" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
            <text x="29" y="22" textAnchor="middle" fontSize="4" fill="#1e40af" fontWeight="bold">Dr. Verdinho</text>
            {/* Green cross medical symbol on pocket */}
            <rect x="66" y="29" width="6" height="2" rx="0.5" fill="#22c55e" />
            <rect x="68" y="27" width="2" height="6" rx="0.5" fill="#22c55e" />
            <defs>
              <linearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f3f4f6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Stethoscope around neck — proportional, lowered 20% */}
          <svg
            className="absolute pointer-events-none"
            style={{
              top: size * 0.528,
              left: size * 0.32,
              width: size * 0.36,
              height: size * 0.13,
            }}
            viewBox="0 0 80 30"
            fill="none"
          >
            {/* Left tube */}
            <path
              d="M22 2 Q18 8 19 14 Q20 20 26 24"
              stroke="#666"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right tube */}
            <path
              d="M58 2 Q62 8 61 14 Q60 20 54 24"
              stroke="#666"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Left earpiece */}
            <circle cx="26" cy="24" r="2.5" fill="#555" stroke="#444" strokeWidth="0.6" />
            <circle cx="26" cy="24" r="1.2" fill="#777" />
            {/* Right earpiece */}
            <circle cx="54" cy="24" r="2.5" fill="#555" stroke="#444" strokeWidth="0.6" />
            <circle cx="54" cy="24" r="1.2" fill="#777" />
            {/* Chest piece hanging */}
            <path d="M40 14 L40 26" stroke="#666" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="40" cy="27" r="3.5" fill="#888" stroke="#555" strokeWidth="1" />
            <circle cx="40" cy="27" r="1.8" fill="#aaa" />
          </svg>

          {/* Head mirror on forehead */}
          <svg
            className="absolute pointer-events-none"
            style={{
              top: size * 0.12,
              left: size * 0.38,
              width: size * 0.24,
              height: size * 0.1,
            }}
            viewBox="0 0 50 20"
            fill="none"
          >
            {/* Band */}
            <path d="M5 12 Q25 4 45 12" stroke="#888" strokeWidth="1.5" fill="none" />
            {/* Mirror disc */}
            <circle cx="25" cy="8" r="6" fill="url(#mirrorGrad)" stroke="#999" strokeWidth="1" />
            <circle cx="23" cy="6" r="2" fill="white" opacity="0.6" />
            <defs>
              <radialGradient id="mirrorGrad" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#f0f0f0" />
                <stop offset="100%" stopColor="#c0c0c0" />
              </radialGradient>
            </defs>
          </svg>

          {/* Clipboard/chart in LEFT hand */}
          <motion.svg
            className="absolute pointer-events-none"
            style={{
              left: -size * 0.22,
              top: size * 0.25,
              width: size * 0.3,
              height: size * 0.4,
            }}
            viewBox="0 0 40 55"
            fill="none"
            animate={{
              opacity: lookingAtChart ? 1 : 0.5,
              scale: lookingAtChart ? 1.05 : 0.95,
              rotate: lookingAtChart ? 3 : 0,
            }}
            transition={{ duration: 0.8 }}
          >
            <rect x="2" y="5" width="36" height="48" rx="3" fill="#f5f0e0" stroke="#c4a44a" strokeWidth="1.5" />
            <rect x="12" y="1" width="16" height="8" rx="2" fill="#8B7355" stroke="#6b5a3e" strokeWidth="1" />
            <circle cx="20" cy="5" r="2" fill="#c4a44a" />
            <line x1="8" y1="18" x2="32" y2="18" stroke="#ccc" strokeWidth="0.8" />
            <line x1="8" y1="24" x2="28" y2="24" stroke="#ccc" strokeWidth="0.8" />
            <line x1="8" y1="30" x2="30" y2="30" stroke="#ccc" strokeWidth="0.8" />
            <line x1="8" y1="36" x2="25" y2="36" stroke="#ccc" strokeWidth="0.8" />
            <polyline
              points="8,44 12,44 14,38 16,48 18,42 20,44 24,44 26,38 28,46 30,44 32,44"
              stroke="#ef4444"
              strokeWidth="1.2"
              fill="none"
            />
          </motion.svg>

          {/* Stethoscope emoji */}
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
