import { useEffect, useState } from "react";
import { Instagram, Clock } from "lucide-react";

/**
 * Mostra contagem regressiva até a próxima execução automática
 * do cron `brisa-ig-auto-post-hourly` (no minuto :00 de cada hora UTC).
 */
function nextHourMs(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(now.getUTCHours() + 1);
  return next.getTime() - now.getTime();
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function AutoPostCountdown() {
  const [ms, setMs] = useState(nextHourMs());

  useEffect(() => {
    const t = setInterval(() => setMs(nextHourMs()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-pink-500/15 text-pink-400 flex items-center justify-center">
          <Instagram className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Próxima publicação automática (IG → FB nativo)
          </div>
          <div className="text-sm text-foreground/80">
            Cron <code className="text-primary">brisa-ig-auto-post-hourly</code> · a cada 1h
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-2xl font-mono font-bold text-primary tabular-nums">
        <Clock className="w-5 h-5 text-muted-foreground" />
        {fmt(ms)}
      </div>
    </div>
  );
}
