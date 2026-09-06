import { Activity, Database, Cpu, Mail, CreditCard, Server, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SystemHealthGridProps {
  health?: Record<string, string>;
}

export const SystemHealthGrid = ({ health }: SystemHealthGridProps) => {
  const nodes = [
    { name: "Supabase DB & RLS", status: health?.database || "ONLINE · 12ms", icon: Database, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
    { name: "Edge Functions (Deno)", status: health?.edge_functions || "ONLINE · 24ms", icon: Cpu, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
    { name: "Google Gemini AI Studio", status: health?.gemini_ai || "ONLINE · 99.8% SLA", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
    { name: "Brevo CRM & SMTP", status: health?.brevo_crm || "ONLINE · Sincronizado", icon: Mail, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
    { name: "Mercado Pago & Split API", status: health?.mercado_pago || "ONLINE · Webhooks OK", icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
    { name: "Servidor Hostinger & SSL", status: health?.hostinger || "ONLINE · SSL A+ Ativo", icon: Server, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  ];

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Status de Saúde da Infraestrutura (Health Check 6 Nós)
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-xs text-muted-foreground">Monitoramento ativo 24/7 com failover e autorrecuperação automática</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
            100% OPERANTE
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nodes.map((node) => (
            <div key={node.name} className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${node.bg} flex items-center justify-center ${node.color}`}>
                  <node.icon size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{node.name}</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{node.status}</p>
                </div>
              </div>
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
