import { memo } from "react";
import { FrogExpression } from "./useFrogAnimations";

interface FrogMouthProps {
  size: number;
  expression: FrogExpression;
  smile: boolean;
  isHovered: boolean;
  tongueOut: boolean;
}

export const FrogMouth = memo(({ size, expression, smile, isHovered, tongueOut }: FrogMouthProps) => {
  const isConfused = expression === "confused";
  const isSleeping = expression === "sleeping";
  const isSurprised = expression === "surprised";
  const isSinging = expression === "singing";
  const isLaughing = expression === "laughing";
  const isAngry = expression === "angry";
  const isSneeze = expression === "sneeze";
  const smileCurve = smile || isHovered;

  // Confused — wavy line
  if (isConfused) {
    return (
      <path
        d={`M ${size * 0.43} ${size * 0.56} Q ${size * 0.47} ${size * 0.52} ${size * 0.53} ${size * 0.57} Q ${size * 0.56} ${size * 0.53} ${size * 0.58} ${size * 0.56}`}
        fill="none" stroke="#2d8a4e" strokeWidth={1.5} strokeLinecap="round"
      />
    );
  }

  // Surprised — "O" mouth
  if (isSurprised) {
    return (
      <ellipse cx={size * 0.5} cy={size * 0.57} rx={size * 0.04} ry={size * 0.05} fill="#2d8a4e" opacity="0.7" />
    );
  }

  // Singing — animated open mouth
  if (isSinging) {
    return (
      <g>
        <ellipse cx={size * 0.5} cy={size * 0.56} rx={size * 0.035} ry={size * 0.03} fill="#2d8a4e" opacity="0.6">
          <animate attributeName="ry" values={`${size * 0.02};${size * 0.04};${size * 0.02}`} dur="0.6s" repeatCount="indefinite" />
        </ellipse>
        {/* Music notes */}
        <text x={size * 0.62} y={size * 0.48} fontSize={size * 0.06} opacity="0.6">♪</text>
        <text x={size * 0.35} y={size * 0.44} fontSize={size * 0.05} opacity="0.4">♫</text>
      </g>
    );
  }

  // Laughing — wide open mouth
  if (isLaughing) {
    return (
      <g>
        <path
          d={`M ${size * 0.38} ${size * 0.54} Q ${size * 0.5} ${size * 0.66} ${size * 0.62} ${size * 0.54}`}
          fill="#2d8a4e" opacity="0.3" stroke="#2d8a4e" strokeWidth={1.5} strokeLinecap="round"
        />
        <path
          d={`M ${size * 0.42} ${size * 0.55} Q ${size * 0.5} ${size * 0.63} ${size * 0.58} ${size * 0.55}`}
          fill="#c0392b" opacity="0.15"
        />
      </g>
    );
  }

  // Angry — frown
  if (isAngry) {
    return (
      <path
        d={`M ${size * 0.42} ${size * 0.58} Q ${size * 0.5} ${size * 0.53} ${size * 0.58} ${size * 0.58}`}
        fill="none" stroke="#2d8a4e" strokeWidth={2} strokeLinecap="round"
      />
    );
  }

  // Sneeze — puckered
  if (isSneeze) {
    return (
      <g>
        <circle cx={size * 0.5} cy={size * 0.57} r={size * 0.02} fill="#2d8a4e" opacity="0.5" />
        {/* Sneeze particles */}
        {[0, 1, 2].map(i => (
          <circle key={i} cx={size * 0.5 + (i - 1) * size * 0.04} cy={size * 0.52} r={size * 0.008} fill="#a8e6cf" opacity="0.6">
            <animate attributeName="cy" values={`${size * 0.52};${size * 0.42}`} dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0" dur="0.8s" repeatCount="indefinite" />
          </circle>
        ))}
      </g>
    );
  }

  if (isSleeping) return null;

  // Default smile + tongue
  return (
    <g>
      {smileCurve && (
        <path
          d={`M ${size * 0.4} ${size * 0.54} Q ${size * 0.5} ${size * 0.62} ${size * 0.6} ${size * 0.54}`}
          fill="none" stroke="#2d8a4e" strokeWidth={2} strokeLinecap="round"
        />
      )}
      {tongueOut && (
        <g>
          <ellipse cx={size * 0.5} cy={size * 0.6} rx={size * 0.025} ry={size * 0.03} fill="#e74c3c" opacity="0.7">
            <animate attributeName="ry" values={`${size * 0.01};${size * 0.035};${size * 0.01}`} dur="0.6s" repeatCount="1" />
          </ellipse>
        </g>
      )}
    </g>
  );
});

FrogMouth.displayName = "FrogMouth";
