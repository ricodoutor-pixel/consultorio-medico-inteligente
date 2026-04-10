import React, { useEffect, useState } from "react";
import { useNPS, type NPSSummary, type NPSAlert } from "@/hooks/useNPS";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Star,
  MessageCircle,
  Bell,
} from "lucide-react";

export const NPSDashboard: React.FC = () => {
  const { getSummary, getAlerts, acknowledgeAlert, loading } = useNPS();
  const [summary, setSummary] = useState<NPSSummary | null>(null);
  const [alerts, setAlerts] = useState<NPSAlert[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryData, alertsData] = await Promise.all([getSummary(), getAlerts()]);
      setSummary(summaryData);
      setAlerts(alertsData.alerts);
    } catch {
      toast.error("Erro ao carregar dados de NPS");
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success("Alerta reconhecido");
    } catch {
      toast.error("Erro ao reconhecer alerta");
    }
  };

  const getNPSColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 30) return "text-yellow-500";
    return "text-red-500";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive" as const;
      case "high": return "destructive" as const;
      case "medium": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        Dashboard NPS
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">NPS Score</p>
                <p className={`text-3xl font-bold ${getNPSColor(summary?.npsScore || 0)}`}>
                  {summary?.npsScore || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média</p>
                <p className="text-3xl font-bold">{summary?.avgScore || 0}</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Respostas</p>
                <p className="text-3xl font-bold">{summary?.totalResponses || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas</p>
                <p className="text-3xl font-bold text-destructive">{alerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution */}
      {summary && summary.totalResponses > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm w-24 text-green-600 font-medium">Promotores</span>
                <Progress value={(summary.promoters / summary.totalResponses) * 100} className="flex-1 h-3" />
                <span className="text-sm font-bold w-12 text-right">{summary.promoters}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-24 text-yellow-600 font-medium">Passivos</span>
                <Progress value={(summary.passives / summary.totalResponses) * 100} className="flex-1 h-3" />
                <span className="text-sm font-bold w-12 text-right">{summary.passives}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-24 text-red-600 font-medium">Detratores</span>
                <Progress value={(summary.detractors / summary.totalResponses) * 100} className="flex-1 h-3" />
                <span className="text-sm font-bold w-12 text-right">{summary.detractors}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertas Ativos ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50 animate-in fade-in"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAcknowledge(alert.id)}
                    className="shrink-0"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    OK
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Feedback */}
      {summary?.recentFeedback && summary.recentFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Feedback Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recentFeedback.map((fb, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`text-lg font-bold ${fb.score >= 9 ? "text-green-500" : fb.score >= 7 ? "text-yellow-500" : "text-red-500"}`}>
                    {fb.score}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{fb.feedback}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(fb.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
