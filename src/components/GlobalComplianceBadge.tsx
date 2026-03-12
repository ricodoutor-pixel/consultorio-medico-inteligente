import { Shield, Globe, Lock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface Props {
  region?: "br" | "us" | "bo" | "latam";
  variant?: "default" | "hero";
}

const REGION_CONFIG = {
  br: { label: "CFM 2314 + LGPD", icon: "🇧🇷", color: "border-emerald-500/30 text-emerald-500" },
  us: { label: "HIPAA Compliant", icon: "🇺🇸", color: "border-blue-500/30 text-blue-500" },
  bo: { label: "Ley 164 + ADSIB", icon: "🇧🇴", color: "border-yellow-500/30 text-yellow-500" },
  latam: { label: "GDPR-like + E-Sign", icon: "🌎", color: "border-purple-500/30 text-purple-500" },
};

export const GlobalComplianceBadge = ({ region = "br", variant = "default" }: Props) => {
  const cfg = REGION_CONFIG[region];

  if (variant === "hero") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-2xl cursor-help hover:bg-emerald-500/20 transition-all group">
              <div className="bg-emerald-500 rounded-full p-1 group-hover:scale-110 transition-transform">
                <CheckCircle size={14} className="text-white" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Selo de Conformidade</span>
                <span className="text-sm font-bold text-foreground">{cfg.label}</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-xs max-w-[240px] p-3 bg-card border-border">
            <div className="space-y-2">
              <p className="font-bold flex items-center gap-2 text-emerald-500"><Shield size={14} /> Plataforma Homologada</p>
              <div className="space-y-1 text-muted-foreground">
                <p className="flex items-center gap-1"><Lock size={12} /> Criptografia de Ponta-a-Ponta</p>
                <p>• Vídeo e Chat E2EE</p>
                <p>• Dados Protegidos (AES-256)</p>
                <p>• Servidores: {region === "br" ? "AWS São Paulo (Soberania BR)" : "AWS Regional"}</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex" aria-label={`Conformidade: ${cfg.label}`}>
            <Badge variant="outline" className={`gap-1 text-[10px] cursor-default py-1 px-2 ${cfg.color}`}>
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
            <p>Soberania de dados: {region === "br" ? "AWS São Paulo" : "AWS regional"}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
