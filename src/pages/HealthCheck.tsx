import { lazy, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, MessageSquare, CreditCard, Wifi, Clock, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServiceCheck {
  ok: boolean;
  responseTime: number;
  error?: string;
  status?: number;
  note?: string;
}

interface AutomationStats {
  pending_jobs: number;
  failed_jobs: number;
  doctors_online: number;
  today_appointments: number;
}

interface HealthData {
  status: "healthy" | "degraded" | "down";
  checks: {
    database: ServiceCheck;
// ManyChat removed
    mercadopago: ServiceCheck;
    edge_functions: ServiceCheck;
    automations: AutomationStats;
  };
  totalResponseTime: number;
  timestamp: string;
}

const SERVICE_CONFIG = [
  { key: "database", label: "Database", icon: Database, critical: true },
// ManyChat removed
  { key: "mercadopago", label: "Mercado Pago", icon: CreditCard, critical: true },
  { key: "edge_functions", label: "Edge Functions", icon: Wifi, critical: true },
] as const;

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("system-health", {
        body: { action: "health" },
      });
      if (error) throw error;
      setHealth(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Health check failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusColor = (ok: boolean) => ok ? "text-green-500" : "text-red-500";
  const getStatusBg = (ok: boolean) => ok ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30";

  return (
    <div className="min-h-dvh bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Saúde das Automações</h1>
              <p className="text-sm text-muted-foreground">
                Monitoramento em tempo real • 60 automações
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {health && (
              <Badge variant={health.status === "healthy" ? "default" : "destructive"} className="text-sm px-3 py-1">
                {health.status === "healthy" ? "✅ Saudável" : "⚠️ Degradado"}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Global Stats */}
        {health && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Latência Total</p>
                  <p className="text-lg font-bold">{health.totalResponseTime}ms</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Médicos Online</p>
                  <p className="text-lg font-bold">{health.checks.automations.doctors_online}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Orientações Técnicas Hoje</p>
                  <p className="text-lg font-bold">{health.checks.automations.today_appointments}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 ${health.checks.automations.failed_jobs > 0 ? "text-destructive" : "text-primary"}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Jobs com Falha</p>
                  <p className="text-lg font-bold">{health.checks.automations.failed_jobs}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICE_CONFIG.map(({ key, label, icon: Icon, critical }) => {
            const check = health?.checks?.[key as keyof typeof health.checks] as ServiceCheck | undefined;
            const isOk = check?.ok ?? false;

            return (
              <Card key={key} className={`border ${check ? getStatusBg(isOk) : "border-muted"}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${check ? getStatusColor(isOk) : "text-muted-foreground"}`} />
                      <div>
                        <p className="font-semibold text-foreground">{label}</p>
                        {critical && <span className="text-[10px] text-muted-foreground">CRÍTICO</span>}
                      </div>
                    </div>
                    {check ? (
                      isOk ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
                    )}
                  </div>
                  {check && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Resposta: {check.responseTime}ms</span>
                      {check.error && <span className="text-destructive truncate max-w-[200px]">{check.error}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Automation Queue */}
        {health && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" /> Fila de Automações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jobs Pendentes</span>
                  <Badge variant="secondary">{health.checks.automations.pending_jobs}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jobs com Falha</span>
                  <Badge variant={health.checks.automations.failed_jobs > 0 ? "destructive" : "secondary"}>
                    {health.checks.automations.failed_jobs}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Última verificação: {lastRefresh?.toLocaleTimeString("pt-BR")} • Auto-refresh: 30s
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
