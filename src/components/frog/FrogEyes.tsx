import { memo } from "react";
import { FrogExpression } from "./useFrogAnimations";

const LEFT_EYE = { cx: 0.35, cy: 0.38 };
const RIGHT_EYE = { cx: 0.65, cy: 0.38 };
const PUPIL_RADIUS_RATIO = 0.045;

interface FrogEyesProps {
  size: number;
  expression: FrogExpression;
  blink: boolean;
  eyeOffset: { x: number; y: number };
  eyeSparkle: boolean;
}

export const FrogEyes = memo(({ size, expression, blink, eyeOffset, eyeSparkle }: FrogEyesProps) => {
  const pupilR = size * PUPIL_RADIUS_RATIO;
  const isSleeping = expression === "sleeping";
  const isConfused = expression === "confused";
  const isLove = expression === "love";
  const isDizzy = expression === "dizzy";
  const isSurprised = expression === "surprised";
  const isCool = expression === "cool";
  const isCrying = expression === "crying";

  // Sleeping eyes — curved lines
  if (isSleeping) {
    return (
      <>
        <path d={`M ${size * LEFT_EYE.cx - pupilR * 1.5} ${size * LEFT_EYE.cy} Q ${size * LEFT_EYE.cx} ${size * LEFT_EYE.cy + pupilR} ${size * LEFT_EYE.cx + pupilR * 1.5} ${size * LEFT_EYE.cy}`} fill="none" stroke="#2d8a4e" strokeWidth={1.5} strokeLinecap="round" />
        <path d={`M ${size * RIGHT_EYE.cx - pupilR * 1.5} ${size * RIGHT_EYE.cy} Q ${size * RIGHT_EYE.cx} ${size * RIGHT_EYE.cy + pupilR} ${size * RIGHT_EYE.cx + pupilR * 1.5} ${size * RIGHT_EYE.cy}`} fill="none" stroke="#2d8a4e" strokeWidth={1.5} strokeLinecap="round" />
      </>
    );
  }

  // Love eyes — hearts
  if (isLove && !blink) {
    const heartPath = (cx: number, cy: number) => {
      const s = pupilR * 1.2;
      return `M ${cx} ${cy + s * 0.4} C ${cx - s} ${cy - s * 0.6} ${cx - s * 0.3} ${cy - s} ${cx} ${cy - s * 0.3} C ${cx + s * 0.3} ${cy - s} ${cx + s} ${cy - s * 0.6} ${cx} ${cy + s * 0.4} Z`;
    };
    return (
      <>
        <path d={heartPath(size * LEFT_EYE.cx, size * LEFT_EYE.cy)} fill="#e74c3c" opacity="0.9">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d={heartPath(size * RIGHT_EYE.cx, size * RIGHT_EYE.cy)} fill="#e74c3c" opacity="0.9">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="0.8s" repeatCount="indefinite" />
        </path>
      </>
    );
  }

  // Dizzy eyes — spirals
  if (isDizzy && !blink) {
    return (
      <>
        {[LEFT_EYE, RIGHT_EYE].map((eye, i) => (
          <g key={i}>
            <circle cx={size * eye.cx} cy={size * eye.cy} r={pupilR * 0.8} fill="none" stroke="#111" strokeWidth={1}>
              <animateTransform attributeName="transform" type="rotate" from={`0 ${size * eye.cx} ${size * eye.cy}`} to={`360 ${size * eye.cx} ${size * eye.cy}`} dur="1s" repeatCount="indefinite" />
            </circle>
            <path d={`M ${size * eye.cx} ${size * eye.cy - pupilR * 0.6} A ${pupilR * 0.3} ${pupilR * 0.3} 0 1 1 ${size * eye.cx + pupilR * 0.3} ${size * eye.cy}`} fill="none" stroke="#111" strokeWidth={0.8}>
              <animateTransform attributeName="transform" type="rotate" from={`0 ${size * eye.cx} ${size * eye.cy}`} to={`360 ${size * eye.cx} ${size * eye.cy}`} dur="1s" repeatCount="indefinite" />
            </path>
          </g>
        ))}
      </>
    );
  }

  // Surprised eyes — big circles
  if (isSurprised && !blink) {
    return (
      <>
        {[LEFT_EYE, RIGHT_EYE].map((eye, i) => (
          <g key={i}>
            <circle cx={size * eye.cx} cy={size * eye.cy} r={pupilR * 1.5} fill="#111" opacity="0.85" />
            <circle cx={size * eye.cx - pupilR * 0.3} cy={size * eye.cy - pupilR * 0.5} r={pupilR * 0.5} fill="white" opacity="0.9" />
            <circle cx={size * eye.cx + pupilR * 0.4} cy={size * eye.cy - pupilR * 0.3} r={pupilR * 0.25} fill="white" opacity="0.7" />
          </g>
        ))}
      </>
    );
  }

  // Cool eyes — sunglasses line
  if (isCool && !blink) {
    const lx = size * LEFT_EYE.cx;
    const rx = size * RIGHT_EYE.cx;
    const y = size * LEFT_EYE.cy;
    const gr = pupilR * 1.8;
    return (
      <>
        <rect x={lx - gr} y={y - gr * 0.7} width={gr * 2} height={gr * 1.4} rx={2} fill="#1a1a2e" opacity="0.9" />
        <rect x={rx - gr} y={y - gr * 0.7} width={gr * 2} height={gr * 1.4} rx={2} fill="#1a1a2e" opacity="0.9" />
        <line x1={lx + gr} y1={y} x2={rx - gr} y2={y} stroke="#1a1a2e" strokeWidth={1.5} />
        {/* Lens glare */}
        <line x1={lx - gr * 0.5} y1={y - gr * 0.3} x2={lx + gr * 0.3} y2={y - gr * 0.3} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeLinecap="round" />
        <line x1={rx - gr * 0.5} y1={y - gr * 0.3} x2={rx + gr * 0.3} y2={y - gr * 0.3} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeLinecap="round" />
      </>
    );
  }

  // Confused eyes — spiral
  if (isConfused && !blink) {
    return (
      <>
        {[LEFT_EYE, RIGHT_EYE].map((eye, i) => (
          <g key={i}>
            <circle cx={size * eye.cx} cy={size * eye.cy} r={pupilR * 0.8} fill="none" stroke="#111" strokeWidth={1.2} />
            <path d={`M ${size * eye.cx} ${size * eye.cy - pupilR * 0.4} A ${pupilR * 0.4} ${pupilR * 0.4} 0 1 1 ${size * eye.cx + pupilR * 0.4} ${size * eye.cy}`} fill="none" stroke="#111" strokeWidth={1} />
          </g>
        ))}
      </>
    );
  }

  // Blink state
  if (blink) {
    return (
      <>
        <line x1={size * LEFT_EYE.cx - pupilR * 1.2} y1={size * LEFT_EYE.cy} x2={size * LEFT_EYE.cx + pupilR * 1.2} y2={size * LEFT_EYE.cy} stroke="#2d8a4e" strokeWidth={2} strokeLinecap="round" />
        <line x1={size * RIGHT_EYE.cx - pupilR * 1.2} y1={size * RIGHT_EYE.cy} x2={size * RIGHT_EYE.cx + pupilR * 1.2} y2={size * RIGHT_EYE.cy} stroke="#2d8a4e" strokeWidth={2} strokeLinecap="round" />
      </>
    );
  }

  // Default eyes with tracking + sparkle — clean white sclera
  const eyeWhiteR = pupilR * 2.2;
  return (
    <>
      {[LEFT_EYE, RIGHT_EYE].map((eye, i) => (
        <g key={i}>
          {/* Clean white eye background */}
          <circle cx={size * eye.cx} cy={size * eye.cy} r={eyeWhiteR} fill="white" opacity="0.95" />
          <circle cx={size * eye.cx} cy={size * eye.cy} r={eyeWhiteR} fill="none" stroke="#2d8a4e" strokeWidth={0.8} opacity="0.3" />
          {/* Pupil */}
          <circle cx={size * eye.cx + eyeOffset.x} cy={size * eye.cy + eyeOffset.y} r={pupilR} fill="#111" opacity="0.9" />
          {/* Highlight */}
          <circle cx={size * eye.cx + eyeOffset.x * 0.3 - pupilR * 0.35} cy={size * eye.cy + eyeOffset.y * 0.3 - pupilR * 0.45} r={pupilR * 0.35} fill="white" opacity="0.95" />
          {eyeSparkle && (
            <circle cx={size * eye.cx + pupilR * 0.3} cy={size * eye.cy - pupilR * 0.6} r={pupilR * 0.2} fill="#ffd700" opacity="0.8">
              <animate attributeName="r" values={`${pupilR * 0.15};${pupilR * 0.25};${pupilR * 0.15}`} dur="0.6s" repeatCount="indefinite" />
            </circle>
          )}
        </g>
      ))}
      {/* Crying tears */}
      {isCrying && (
        <>
          {[LEFT_EYE, RIGHT_EYE].map((eye, i) => (
            <circle key={`tear-${i}`} cx={size * eye.cx} cy={size * eye.cy + pupilR * 1.5} r={pupilR * 0.3} fill="#74b9ff" opacity="0.7">
              <animate attributeName="cy" values={`${size * eye.cy + pupilR};${size * eye.cy + pupilR * 4}`} dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="1.2s" repeatCount="indefinite" />
            </circle>
          ))}
        </>
      )}
    </>
  );
});

FrogEyes.displayName = "FrogEyes";
