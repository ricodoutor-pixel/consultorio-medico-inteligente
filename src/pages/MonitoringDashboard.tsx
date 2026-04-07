import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, TrendingUp, Activity } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface WebVitalsData {
  LCP: number;
  FID: number;
  CLS: number;
  FCP: number;
  TTFB: number;
}

interface MetricStatus {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: "good" | "warning" | "poor";
  description: string;
}

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<WebVitalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch metrics from performance API
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // Get metrics from performance observer
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType("paint");
        
        const fcp = paint.find(e => e.name === "first-contentful-paint")?.startTime || 0;
        const lcpEntry = performance.getEntriesByType("largest-contentful-paint").pop() as PerformanceEntry | undefined;
        const lcp = lcpEntry?.startTime || 0;
        
        setMetrics({
          LCP: Math.round(lcp),
          FID: 0, // Will be updated by web-vitals library
          CLS: 0, // Will be updated by web-vitals library
          FCP: Math.round(fcp),
          TTFB: Math.round(navigation?.responseStart || 0),
        });

        trackEvent("monitoring_dashboard_loaded", {
          lcp: Math.round(lcp),
          fcp: Math.round(fcp),
          ttfb: Math.round(navigation?.responseStart || 0),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch metrics");
      } finally {
        setLoading(false);
      }
    };

    // Delay to ensure all metrics are available
    setTimeout(fetchMetrics, 2000);
  }, []);

  const getMetricStatus = (metric: string, value: number): "good" | "warning" | "poor" => {
    const thresholds: Record<string, [number, number]> = {
      LCP: [2500, 4000], // Good: < 2.5s, Poor: > 4s
      FID: [100, 300], // Good: < 100ms, Poor: > 300ms
      CLS: [0.1, 0.25], // Good: < 0.1, Poor: > 0.25
      FCP: [1800, 3000], // Good: < 1.8s, Poor: > 3s
      TTFB: [600, 1800], // Good: < 600ms, Poor: > 1.8s
    };

    const [good, poor] = thresholds[metric] || [0, Infinity];
    
    if (value <= good) return "good";
    if (value <= poor) return "warning";
    return "poor";
  };

  const metricsData: MetricStatus[] = metrics ? [
    {
      name: "LCP",
      value: metrics.LCP,
      target: 2500,
      unit: "ms",
      status: getMetricStatus("LCP", metrics.LCP),
      description: "Largest Contentful Paint - quando o maior elemento é renderizado",
    },
    {
      name: "FCP",
      value: metrics.FCP,
      target: 1800,
      unit: "ms",
      status: getMetricStatus("FCP", metrics.FCP),
      description: "First Contentful Paint - quando o primeiro conteúdo é renderizado",
    },
    {
      name: "TTFB",
      value: metrics.TTFB,
      target: 600,
      unit: "ms",
      status: getMetricStatus("TTFB", metrics.TTFB),
      description: "Time to First Byte - tempo até receber o primeiro byte do servidor",
    },
    {
      name: "FID",
      value: metrics.FID,
      target: 100,
      unit: "ms",
      status: getMetricStatus("FID", metrics.FID),
      description: "First Input Delay - latência da primeira interação do usuário",
    },
    {
      name: "CLS",
      value: metrics.CLS,
      target: 0.1,
      unit: "score",
      status: getMetricStatus("CLS", metrics.CLS),
      description: "Cumulative Layout Shift - mudanças inesperadas de layout",
    },
  ] : [];

  const goodMetrics = metricsData.filter(m => m.status === "good").length;
  const warningMetrics = metricsData.filter(m => m.status === "warning").length;
  const poorMetrics = metricsData.filter(m => m.status === "poor").length;

  const getStatusIcon = (status: "good" | "warning" | "poor") => {
    switch (status) {
      case "good":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "poor":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: "good" | "warning" | "poor") => {
    switch (status) {
      case "good":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "poor":
        return "bg-red-50 border-red-200";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitoramento de Web Vitals e performance da aplicação</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Métricas Boas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">{goodMetrics}</span>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Atenção Necessária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-yellow-600">{warningMetrics}</span>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-red-600">{poorMetrics}</span>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {poorMetrics > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Performance Crítica</AlertTitle>
          <AlertDescription>
            {poorMetrics} métrica(s) estão abaixo do esperado. Verifique os detalhes abaixo.
          </AlertDescription>
        </Alert>
      )}

      {warningMetrics > 0 && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Atenção Necessária</AlertTitle>
          <AlertDescription>
            {warningMetrics} métrica(s) precisam de otimização.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Details */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Activity className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Carregando métricas...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar métricas</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metricsData.map((metric) => (
            <Card key={metric.name} className={`border-2 ${getStatusColor(metric.status)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{metric.name}</CardTitle>
                    <CardDescription>{metric.description}</CardDescription>
                  </div>
                  {getStatusIcon(metric.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-3xl font-bold">
                      {metric.value}
                      <span className="text-sm text-gray-600 ml-1">{metric.unit}</span>
                    </span>
                    <span className="text-sm text-gray-600">
                      Meta: {metric.target}{metric.unit}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metric.status === "good"
                          ? "bg-green-500"
                          : metric.status === "warning"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min((metric.value / (metric.target * 1.5)) * 100, 100)}%`,
                      }}
                    />
                  </div>

                  {/* Status message */}
                  <p className={`text-sm font-medium ${
                    metric.status === "good"
                      ? "text-green-700"
                      : metric.status === "warning"
                      ? "text-yellow-700"
                      : "text-red-700"
                  }`}>
                    {metric.status === "good"
                      ? "✓ Dentro do esperado"
                      : metric.status === "warning"
                      ? "⚠ Precisa otimização"
                      : "✗ Crítico - ação necessária"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações de Otimização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">LCP (Largest Contentful Paint)</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Otimize imagens com lazy loading</li>
              <li>• Minimize CSS crítico</li>
              <li>• Use CDN para servir assets</li>
              <li>• Implemente code splitting</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">FCP (First Contentful Paint)</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Reduza tamanho do bundle JavaScript</li>
              <li>• Implemente server-side rendering</li>
              <li>• Otimize fontes web</li>
              <li>• Use preload para recursos críticos</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">CLS (Cumulative Layout Shift)</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Defina dimensões para imagens</li>
              <li>• Evite inserir conteúdo acima do fold</li>
              <li>• Use transform para animações</li>
              <li>• Reserve espaço para anúncios</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
