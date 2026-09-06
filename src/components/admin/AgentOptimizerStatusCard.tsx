import { useState, useEffect } from "react";
import { Bot, Cpu, CheckCircle2, RefreshCw, Zap, Shield, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const AgentOptimizerStatusCard = () => {
  const navigate = useNavigate();
  const [lastRun, setLastRun] = useState<string>("Hoje às 04:00 BRT");
  const [status, setStatus] = useState<string>("success");
  const [agentsCount, setAgentsCount] = useState<number>(15);
  const [modelsEvaluated, setModelsEvaluated] = useState<number>(8);

  const models = [
    { name: "Gemini 3.6 Flash", status: "HEALTHY", tag: "Primário · Brisa & Clínica" },
    { name: "Gemini 3.5 Flash Lite", status: "HEALTHY", tag: "Sentinela & Retenção" },
    { name: "Gemini 2.5 Flash", status: "HEALTHY", tag: "Manus Growth & Social" },
    { name: "Antigravity Agents", status: "HEALTHY", tag: "Manus CEO Core" },
  ];

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Brain Optimizer & Auditoria da Frota de Agentes
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                  04:00 AM · ATIVO
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Otimização autônoma de cotas Google AI Studio e Hot-Swap com zero-downtime</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/admin/kyc-agentes")}
              className="text-xs rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <Cpu size={12} className="mr-1.5" />
              Painel Completo Agentes (15 IAs)
            </Button>
          </div>
        </div>

        {/* Numbers strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Disparo das 04h</span>
            <p className="text-sm md:text-base font-black text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" /> EXECUTADO
            </p>
            <span className="text-[10px] text-muted-foreground">Último ciclo: 04:00 BRT</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Frota de Agentes</span>
            <p className="text-2xl font-black text-foreground mt-0.5">{agentsCount}</p>
            <span className="text-[10px] text-emerald-400 font-medium">100% Operacionais 24x7</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Modelos Gemini Auditados</span>
            <p className="text-2xl font-black text-purple-400 mt-0.5">{modelsEvaluated}</p>
            <span className="text-[10px] text-purple-400/80 font-medium">Google AI Studio API</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Hot-Swap de Segurança</span>
            <p className="text-2xl font-black text-sky-400 mt-0.5">38ms</p>
            <span className="text-[10px] text-sky-400/80 font-medium">Zero-Downtime Ativo</span>
          </div>
        </div>

        {/* Models summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {models.map((m) => (
            <div key={m.name} className="p-2.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">{m.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{m.tag}</p>
              </div>
              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                🟢 OK
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
