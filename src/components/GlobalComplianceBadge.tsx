import { Shield, Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  region?: "br" | "us" | "bo" | "latam";
}

const REGION_CONFIG = {
  br: { label: "CFM 2314 + LGPD", icon: "🇧🇷", color: "border-emerald-500/30 text-emerald-600" },
  us: { label: "HIPAA Compliant", icon: "🇺🇸", color: "border-blue-500/30 text-blue-600" },
  bo: { label: "Ley 164 + ADSIB", icon: "🇧🇴", color: "border-yellow-500/30 text-yellow-700" },
  latam: { label: "GDPR-like + E-Sign", icon: "🌎", color: "border-purple-500/30 text-purple-600" },
};

export const GlobalComplianceBadge = ({ region = "br" }: Props) => {
  const cfg = REGION_CONFIG[region];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex" aria-label={`Conformidade: ${cfg.label}`}>
          <Badge variant="outline" className={`gap-1 text-[10px] cursor-default ${cfg.color}`}>
            <Shield size={10} />
            <span>{cfg.icon}</span>
            <span className="hidden sm:inline">{cfg.label}</span>
          </Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-xs max-w-[240px]">
        <div className="space-y-1">
          <p className="font-bold flex items-center gap-1"><Globe size={10} /> Conformidade Regional</p>
          <p><Lock size={10} className="inline" /> AES-256 (repouso) + TLS 1.3 (trânsito)</p>
          <p>E2EE para vídeo e chat</p>
          <p>Soberania de dados: {region === "br" ? "AWS São Paulo" : region === "us" ? "AWS Ohio" : "AWS regional"}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
