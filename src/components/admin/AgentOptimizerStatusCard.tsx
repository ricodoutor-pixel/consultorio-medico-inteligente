import { useState, useEffect } from "react";
import { Bot, Cpu, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AgentRow {
  slug: string;
  name: string;
  role: string;
  is_active: boolean | null;
  last_run_at: string | null;
  edge_function: string | null;
}

export const AgentOptimizerStatusCard = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("agent_registry")
        .select("slug, name, role, is_active, last_run_at, edge_function")
        .order("name");
      if (!alive) return;
      setAgents((data || []) as AgentRow[]);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const total = agents.length;
  const active = agents.filter((a) => a.is_active).length;
  const inactive = total - active;
  const withFunction = agents.filter((a) => !!a.edge_function).length;
  const lastRun = agents
    .map((a) => a.last_run_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const fmt = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "Sem execução registrada";

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Auditoria da Frota de Agentes
                <Badge
                  variant="outline"
                  className={
                    inactive === 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]"
                  }
                >
                  {loading ? "Carregando..." : inactive === 0 ? "TODOS ATIVOS" : `${inactive} INATIVOS`}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Dados lidos diretamente do registro de agentes do banco</p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/admin/kyc-agentes")}
            className="text-xs rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <Cpu size={12} className="mr-1.5" />
            Painel Completo de Agentes
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Agentes Cadastrados</span>
            <p className="text-2xl font-black text-foreground mt-0.5">{total}</p>
            <span className="text-[10px] text-muted-foreground">Registro real</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Ativos</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{active}</p>
            <span className="text-[10px] text-emerald-400/80 font-medium">is_active = true</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Com Função Edge</span>
            <p className="text-2xl font-black text-sky-400 mt-0.5">{withFunction}</p>
            <span className="text-[10px] text-sky-400/80 font-medium">Executáveis</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Última Execução</span>
            <p className="text-sm font-black text-foreground mt-1">{fmt(lastRun)}</p>
            <span className="text-[10px] text-muted-foreground">Mais recente da frota</span>
          </div>
        </div>

        {total === 0 && !loading && (
          <p className="text-xs text-muted-foreground">Nenhum agente registrado no banco.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {agents.map((a) => (
            <div key={a.slug} className="p-2.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{a.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {a.role} · {a.last_run_at ? fmt(a.last_run_at) : "sem execução"}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  a.is_active
                    ? "text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "text-[9px] bg-rose-500/10 text-rose-400 border-rose-500/30"
                }
              >
                {a.is_active ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
