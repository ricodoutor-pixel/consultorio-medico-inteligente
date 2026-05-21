import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

/**
 * Widget de gatilho de urgência: mostra "X médicos plantonistas disponíveis agora".
 * Oscila realisticamente entre 3 e 7 a cada ~6s.
 */
export function DoctorsOnlineWidget() {
  const [count, setCount] = useState(() => 4 + Math.floor(Math.random() * 3)); // 4-6 inicial

  useEffect(() => {
    const tick = () => {
      setCount((prev) => {
        const delta = Math.random() < 0.5 ? -1 : 1;
        const next = prev + delta;
        if (next < 3) return 4;
        if (next > 7) return 6;
        return next;
      });
    };
    const id = setInterval(tick, 5500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-md shadow-lg shadow-primary/10"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
      </span>
      <Activity size={14} className="text-primary" aria-hidden />
      <span className="text-xs sm:text-sm font-black text-foreground">
        <span className="text-primary tabular-nums">{count}</span>{" "}
        médicos plantonistas online agora
      </span>
    </div>
  );
}

export default DoctorsOnlineWidget;
