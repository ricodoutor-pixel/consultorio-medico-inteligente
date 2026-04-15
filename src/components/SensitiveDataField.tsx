import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface SensitiveDataFieldProps {
  value: string;
  maskFn?: (val: string) => string;
  label?: string;
}

const defaultMask = (val: string): string => {
  if (!val) return "•••••••••";
  if (val.length <= 4) return "••••";
  return val.slice(0, 3) + "•".repeat(Math.max(val.length - 5, 3)) + val.slice(-2);
};

export function SensitiveDataField({ value, maskFn = defaultMask, label }: SensitiveDataFieldProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-gray-500">{label}:</span>}
      <span className="text-sm text-white font-mono">
        {revealed ? value : maskFn(value)}
      </span>
      <button
        onClick={() => setRevealed(!revealed)}
        className="p-1 rounded hover:bg-white/10 transition-colors"
        title={revealed ? "Ocultar" : "Revelar"}
      >
        {revealed ? (
          <EyeOff className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <Eye className="h-3.5 w-3.5 text-emerald-400" />
        )}
      </button>
    </div>
  );
}
