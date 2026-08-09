import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, MessageCircle, FileCheck, Zap, RefreshCw, AlertTriangle, CheckCircle2, Send } from "lucide-react";

type ConvRow = { event_type: string; source: string | null; created_at: string };
type UptimeRow = { route: string; status_code: number | null; latency_ms: number | null; is_up: boolean; error: string | null; checked_at: string };
type AlertRow = { id: string; route: string; status_code: number | null; error: string | null; created_at: string; resolved_at: string | null };

const ROUTES = ["/", "/planos-tratamento", "/quiz-triagem"];

export default function AdminConversoesUptime() {
  const { toast } = useToast();
  const [conv, setConv] = useState<ConvRow[]>([]);
  const [uptime, setUptime] = useState<UptimeRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingSitemap, setSubmittingSitemap] = useState(false);
  const [runningPing, setRunningPing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [c, u, a] = await Promise.all([
      supabase.from("conversion_events").select("event_type, source, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
      supabase.from("uptime_log").select("route, status_code, latency_ms, is_up, error, checked_at").gte("checked_at", since).order("checked_at", { ascending: false }).limit(300),
      supabase.from("uptime_alerts").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setConv((c.data as ConvRow[]) ?? []);
    setUptime((u.data as UptimeRow[]) ?? []);
    setAlerts((a.data as AlertRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]);

  const counts = {
    whatsapp_click: conv.filter(c => c.event_type === "whatsapp_click").length,
    form_submit: conv.filter(c => c.event_type === "form_submit").length,
    quiz_started: conv.filter(c => c.event_type === "quiz_started").length,
    quiz_completed: conv.filter(c => c.event_type === "quiz_completed").length,
  };

  const latestByRoute = ROUTES.map(r => uptime.find(u => u.route === r));
  const openAlerts = alerts.filter(a => !a.resolved_at);

  const runPing = async () => {
    setRunningPing(true);
    const { error } = await supabase.functions.invoke("uptime-monitor");
    setRunningPing(false);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Checagem executada" }); load(); }
  };

  const submitSitemap = async () => {
    setSubmittingSitemap(true);
    const { data, error } = await supabase.functions.invoke("submit-sitemap-gsc");
    setSubmittingSitemap(false);
    if (error || !(data as any)?.ok) toast({ title: "Falha", description: error?.message ?? JSON.stringify(data), variant: "destructive" });
    else toast({ title: "Sitemap enviado ao Google Search Console ✅" });
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Conversões & Uptime</h1>
            <p className="text-muted-foreground">Últimas 24h · atualização automática a cada 30s</p>
          </div>
          <Button onClick={load} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>

        {/* KPIs conversão */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPI icon={MessageCircle} label="Cliques WhatsApp" value={counts.whatsapp_click} color="text-green-500" />
          <KPI icon={FileCheck} label="Envios de formulário" value={counts.form_submit} color="text-blue-500" />
          <KPI icon={Zap} label="Quiz iniciado" value={counts.quiz_started} color="text-yellow-500" />
          <KPI icon={CheckCircle2} label="Quiz concluído" value={counts.quiz_completed} color="text-primary" />
        </div>

        {/* Uptime */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Status das rotas</CardTitle>
            <Button onClick={runPing} disabled={runningPing} size="sm" variant="outline" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${runningPing ? "animate-spin" : ""}`} /> Checar agora
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestByRoute.map((u, i) => (
              <div key={ROUTES[i]} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${u?.is_up ? "bg-green-500" : "bg-red-500"}`} />
                  <code className="text-sm font-mono">{ROUTES[i]}</code>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant={u?.is_up ? "default" : "destructive"}>{u?.status_code ?? "—"}</Badge>
                  <span className="text-muted-foreground">{u?.latency_ms ?? "—"}ms</span>
                  <span className="text-muted-foreground hidden md:inline">{u ? new Date(u.checked_at).toLocaleTimeString("pt-BR") : "sem dados"}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /> Alertas abertos ({openAlerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {openAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta aberto. Tudo em ordem ✅</p>
            ) : (
              <ul className="space-y-2">
                {openAlerts.map(a => (
                  <li key={a.id} className="flex items-center justify-between text-sm border-l-4 border-red-500 pl-3 py-1">
                    <span><code className="font-mono">{a.route}</code> — {a.error ?? `HTTP ${a.status_code}`}</span>
                    <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Sitemap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" /> Google Search Console</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Enviar <code>sitemap.xml</code> manualmente para o Google indexar novas rotas.</p>
            <Button onClick={submitSitemap} disabled={submittingSitemap} className="gap-2">
              <Send className={`w-4 h-4 ${submittingSitemap ? "animate-pulse" : ""}`} /> Enviar agora
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

function KPI({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className={`w-5 h-5 ${color} mb-2`} />
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
