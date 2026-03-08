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

      {/* Lipstick kiss mark on right cheek — PERMANENT & VISIBLE */}
      <svg
        className="absolute inset-0 pointer-events-none z-30"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
      >
        <g transform={`translate(${size * 0.72}, ${size * 0.46}) rotate(-12) scale(${size * 0.0025})`}>
          {/* Upper lip */}
          <path
            d="M-10 0 Q-8 -12 -2 -6 Q0 -4 2 -6 Q8 -12 10 0"
            fill="#cc0000"
            opacity="0.9"
          />
          {/* Lower lip */}
          <path
            d="M-10 0 Q-5 10 0 7 Q5 10 10 0"
            fill="#e60000"
            opacity="0.85"
          />
          {/* Lip gloss shine */}
          <ellipse cx="-3" cy="-4" rx="2.5" ry="1.5" fill="#ff4444" opacity="0.6" />
          <ellipse cx="3" cy="-4" rx="2" ry="1" fill="#ff6666" opacity="0.4" />
          {/* Lipstick smudge glow */}
          <circle cx="0" cy="0" r="12" fill="#ff0000" opacity="0.08" />
        </g>
      </svg>

      {/* Floating mini hearts around kiss mark when in love */}
      {(expression === "love" || cheekBlush > 0) && (
        <svg
          className="absolute inset-0 pointer-events-none z-35"
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
        >
          <text x={size * 0.78} y={size * 0.38} fontSize={size * 0.06} opacity="0.8">
            💕
            <animate attributeName="y" values={`${size * 0.38};${size * 0.28}`} dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
          </text>
          <text x={size * 0.82} y={size * 0.44} fontSize={size * 0.04} opacity="0.6">
            ❤️
            <animate attributeName="y" values={`${size * 0.44};${size * 0.32}`} dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0" dur="2.5s" repeatCount="indefinite" />
          </text>
          <text x={size * 0.66} y={size * 0.36} fontSize={size * 0.05} opacity="0.7">
            💋
            <animate attributeName="y" values={`${size * 0.36};${size * 0.26}`} dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="3s" repeatCount="indefinite" />
          </text>
        </svg>
      )}

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

      {/* Waving arm removed — replaced by daydream */}

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
