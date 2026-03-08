import { memo } from "react";
import { motion } from "framer-motion";
import { FrogExpression } from "./useFrogAnimations";

interface FrogAccessoriesProps {
  size: number;
  isWaving: boolean;
  expression: FrogExpression;
  cheekBlush: number;
}

export const FrogAccessories = memo(({ size, isWaving, expression, cheekBlush }: FrogAccessoriesProps) => {
  return (
    <>
      {/* Bow tie */}
      <svg
        className="absolute pointer-events-none z-30"
        style={{ top: size * 0.58, left: (size - size * 0.3) / 2, width: size * 0.3, height: size * 0.18 }}
        viewBox="0 0 60 34"
        fill="none"
      >
        <path d="M30 17 L2 2 L2 32 Z" fill="white" stroke="#d4d4d4" strokeWidth="1.5" />
        <path d="M30 17 L58 2 L58 32 Z" fill="white" stroke="#d4d4d4" strokeWidth="1.5" />
        <circle cx="30" cy="17" r="5" fill="white" stroke="#d4d4d4" strokeWidth="1.5" />
        <circle cx="28" cy="15" r="1.5" fill="white" opacity="0.8" />
      </svg>

      {/* Cheek blush */}
      {cheekBlush > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none z-25"
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
        >
          <circle cx={size * 0.28} cy={size * 0.52} r={size * 0.035} fill="#ff6b6b" opacity={cheekBlush * 0.4} />
          <circle cx={size * 0.72} cy={size * 0.52} r={size * 0.035} fill="#ff6b6b" opacity={cheekBlush * 0.4} />
        </svg>
      )}

      {/* Waving arm */}
      {isWaving && (
        <motion.svg
          className="absolute pointer-events-none z-40"
          style={{ top: size * 0.42, right: -size * 0.1, width: size * 0.35, height: size * 0.35 }}
          viewBox="0 0 50 50"
          fill="none"
          animate={{ rotate: [0, -20, 15, -20, 15, 0] }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        >
          <path d="M10 40 Q15 25 25 15 Q30 10 35 8" stroke="#4ade80" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="35" cy="8" r="5" fill="#4ade80" />
          <path d="M33 4 L31 1" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
          <path d="M36 3 L36 0" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
          <path d="M39 4 L41 1" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
        </motion.svg>
      )}

      {/* Sleeping Z's */}
      {expression === "sleeping" && (
        <svg className="absolute pointer-events-none z-40" style={{ top: -size * 0.1, right: -size * 0.05, width: size * 0.4, height: size * 0.3 }} viewBox="0 0 40 30">
          <text x="5" y="25" fontSize="14" fill="#a8e6cf" opacity="0.8" fontWeight="bold">
            Z
            <animate attributeName="y" values="25;10" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
          </text>
          <text x="18" y="20" fontSize="10" fill="#a8e6cf" opacity="0.6" fontWeight="bold">
            z
            <animate attributeName="y" values="20;5" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0" dur="2.5s" repeatCount="indefinite" />
          </text>
          <text x="28" y="22" fontSize="8" fill="#a8e6cf" opacity="0.5" fontWeight="bold">
            z
            <animate attributeName="y" values="22;8" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0" dur="3s" repeatCount="indefinite" />
          </text>
        </svg>
      )}
    </>
  );
});

FrogAccessories.displayName = "FrogAccessories";
