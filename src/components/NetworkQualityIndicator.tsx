import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

type Quality = "excellent" | "good" | "fair" | "poor";

const QUALITY_CONFIG: Record<Quality, { color: string; bars: number }> = {
  excellent: { color: "text-emerald-500", bars: 4 },
  good: { color: "text-green-400", bars: 3 },
  fair: { color: "text-yellow-500", bars: 2 },
  poor: { color: "text-red-500", bars: 1 },
};

export const NetworkQualityIndicator = () => {
  const { t } = useLanguage();
  const [quality, setQuality] = useState<Quality>("good");
  const [rtt, setRtt] = useState(0);
  const [downlink, setDownlink] = useState(0);

  useEffect(() => {
    const measure = () => {
      const conn = (navigator as any).connection;
      if (conn) {
        setRtt(conn.rtt || 0);
        setDownlink(conn.downlink || 0);
        if (conn.rtt < 50 && conn.downlink > 5) setQuality("excellent");
        else if (conn.rtt < 100 && conn.downlink > 2) setQuality("good");
        else if (conn.rtt < 200 && conn.downlink > 0.5) setQuality("fair");
        else setQuality("poor");
      } else {
        // Fallback: measure with performance API
        const start = performance.now();
        fetch("/favicon.ico", { cache: "no-store" })
          .then(() => {
            const elapsed = performance.now() - start;
            if (elapsed < 100) setQuality("excellent");
            else if (elapsed < 300) setQuality("good");
            else if (elapsed < 600) setQuality("fair");
            else setQuality("poor");
            setRtt(Math.round(elapsed));
          })
          .catch(() => setQuality("poor"));
      }
    };

    measure();
    const interval = setInterval(measure, 10000);
    return () => clearInterval(interval);
  }, []);

  const cfg = QUALITY_CONFIG[quality];
  const label = t(`network.${quality}`);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={`gap-1 text-[10px] border-border cursor-default ${cfg.color}`}
          aria-label={`${t("network.quality")}: ${label}`}
        >
          {quality === "poor" ? <WifiOff size={10} /> : <Wifi size={10} />}
          <div className="flex gap-0.5 items-end h-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-[3px] rounded-sm transition-colors ${
                  i <= cfg.bars ? "bg-current" : "bg-muted"
                }`}
                style={{ height: `${i * 3 + 2}px` }}
              />
            ))}
          </div>
          <span className="hidden sm:inline">{label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        <p>{t("network.quality")}: {label}</p>
        {rtt > 0 && <p>RTT: {rtt}ms</p>}
        {downlink > 0 && <p>↓ {downlink} Mbps</p>}
      </TooltipContent>
    </Tooltip>
  );
};
