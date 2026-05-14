import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, UserMinus, ShieldCheck, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

type KPI = {
  key: string;
  label: string;
  value: string;
  target: string;
  pct: number; // 0-100 progresso vs meta
  status: "green" | "yellow" | "red";
  icon: typeof DollarSign;
  hint: string;
};

const statusColor: Record<KPI["status"], string> = {
  green: "text-green-400 border-green-500/30 bg-green-500/10",
  yellow: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  red: "text-red-400 border-red-500/30 bg-red-500/10",
};

const barColor: Record<KPI["status"], string> = {
  green: "bg-green-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

export const ManusCEOKPIPanel = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const compute = async () => {
    setLoading(true);
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [{ data: appts }, { data: triage }, { data: hashAudit }] = await Promise.all([
        supabase
          .from("appointments")
          .select("amount, payment_status, status, created_at")
          .gte("created_at", monthStart.toISOString()),
        supabase
          .from("whatsapp_brisa_log")
          .select("id, created_at")
          .gte("created_at", monthStart.toISOString()),
        supabase
          .from("prescription_hash_audit")
          .select("invalid_count, total_checked, audited_at")
          .order("audited_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const paid = (appts || []).filter((a) => a.payment_status === "paid");
      const faturamento = paid.reduce((s, a) => s + Number(a.amount || 0), 0);
      const metaFat = 50000;
      const fatPct = Math.min(100, (faturamento / metaFat) * 100);

      const triageCount = (triage || []).length;
      const conversao = triageCount > 0 ? (paid.length / triageCount) * 100 : 0;

      // Churn proxy: cancellations / total
      const total = (appts || []).length;
      const cancelled = (appts || []).filter((a) => a.status === "cancelled").length;
      const churn = total > 0 ? (cancelled / total) * 100 : 0;

      // Compliance: 100% se nenhuma hash inválida na última auditoria
      const audit = hashAudit as { invalid_count?: number; total_checked?: number } | null;
      const compliance = audit && audit.total_checked
        ? Math.max(0, 100 - ((audit.invalid_count || 0) / audit.total_checked) * 100)
        : 100;

      // Load time (web vitals proxy via performance API)
      let loadMs = 0;
      if (typeof window !== "undefined" && window.performance) {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        loadMs = nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0;
      }
      const loadSec = loadMs / 1000;

      const data: KPI[] = [
        {
          key: "fat",
          label: "Faturamento Mensal",
          value: `R$ ${faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          target: `Meta R$ ${metaFat.toLocaleString("pt-BR")}`,
          pct: fatPct,
          status: fatPct >= 80 ? "green" : fatPct >= 40 ? "yellow" : "red",
          icon: DollarSign,
          hint: "Receita aprovada do mês corrente",
        },
        {
          key: "conv",
          label: "Conversão Triagem→Pago",
          value: `${conversao.toFixed(1)}%`,
          target: "Meta ≥ 35%",
          pct: Math.min(100, (conversao / 35) * 100),
          status: conversao >= 35 ? "green" : conversao >= 20 ? "yellow" : "red",
          icon: TrendingUp,
          hint: "Pagantes / Mensagens Brisa",
        },
        {
          key: "churn",
          label: "Churn (Cancelamentos)",
          value: `${churn.toFixed(1)}%`,
          target: "Meta < 5%",
          pct: Math.min(100, ((5 - Math.min(churn, 5)) / 5) * 100),
          status: churn < 5 ? "green" : churn < 10 ? "yellow" : "red",
          icon: UserMinus,
          hint: "Consultas canceladas / total",
        },
        {
          key: "comp",
          label: "Compliance ANVISA",
          value: `${compliance.toFixed(1)}%`,
          target: "Meta 100%",
          pct: compliance,
          status: compliance >= 99 ? "green" : compliance >= 90 ? "yellow" : "red",
          icon: ShieldCheck,
          hint: "Hashes válidos na última auditoria",
        },
        {
          key: "load",
          label: "Load Time",
          value: loadSec > 0 ? `${loadSec.toFixed(2)}s` : "—",
          target: "Meta < 1.2s",
          pct: loadSec > 0 ? Math.min(100, ((1.2 / Math.max(loadSec, 0.1)) * 100)) : 100,
          status: loadSec === 0 ? "yellow" : loadSec < 1.2 ? "green" : loadSec < 2.5 ? "yellow" : "red",
          icon: Gauge,
          hint: "Tempo de carga desta sessão",
        },
      ];

      setKpis(data);
      setUpdatedAt(new Date());
    } catch (e) {
      console.error("[ManusCEOKPIPanel]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    compute();
    const t = setInterval(compute, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Gauge size={14} className="text-primary" />
          Operational Matrix · Manus CEO
        </CardTitle>
        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
          {loading ? "Atualizando…" : `Atualizado ${updatedAt.toLocaleTimeString("pt-BR")}`}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {kpis.map((k, i) => (
            <motion.div
              key={k.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`rounded-2xl border p-4 ${statusColor[k.status]} bg-card/40`}
            >
              <div className="flex items-center justify-between mb-2">
                <k.icon size={16} />
                <Badge variant="outline" className={`text-[9px] uppercase font-black ${statusColor[k.status]}`}>
                  {k.status === "green" ? "OK" : k.status === "yellow" ? "ATENÇÃO" : "CRÍTICO"}
                </Badge>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{k.label}</p>
              <p className="text-xl md:text-2xl font-black text-foreground mt-1">{k.value}</p>
              <p className="text-[10px] opacity-70 mt-1">{k.target}</p>
              <div className="h-1.5 rounded-full bg-background/40 mt-3 overflow-hidden">
                <motion.div
                  className={`h-full ${barColor[k.status]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, k.pct))}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground mt-2">{k.hint}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
