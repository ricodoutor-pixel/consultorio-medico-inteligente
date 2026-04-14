import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Wifi, WifiOff, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FunctionStatus {
  name: string;
  displayName: string;
  description: string;
}

const FUNCTIONS: FunctionStatus[] = [
  { name: "publish-to-facebook", displayName: "Publish to Facebook", description: "Posts automáticos no Feed do Facebook" },
  { name: "publish-to-instagram", displayName: "Publish to Instagram", description: "Feed, Carrossel e Stories no IG" },
  { name: "social-analytics", displayName: "Social Analytics", description: "Relatórios FB + IG + interno" },
  { name: "visitor-tracking", displayName: "Visitor Tracking", description: "UTM, exit intent, page views" },
  { name: "manychat-webhook", displayName: "ManyChat Hub", description: "100 automações cross-platform" },
];

export function EdgeFunctionStatusGrid() {
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["manychat-health"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manychat-webhook", {
        body: { action: "health" },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: fbTest, isLoading: fbLoading } = useQuery({
    queryKey: ["fb-status"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("social-analytics", {
          body: { action: "page_insights", period: "day" },
        });
        if (error) return { status: "error", error: error.message };
        return { status: "ok", data };
      } catch (e) {
        return { status: "error", error: String(e) };
      }
    },
    refetchInterval: 60000,
  });

  const { data: visitorTest } = useQuery({
    queryKey: ["visitor-status"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("visitor-tracking", {
          body: { request_action: "analytics", period: "day" },
        });
        if (error) return { status: "error" };
        return { status: "ok", data };
      } catch {
        return { status: "error" };
      }
    },
    refetchInterval: 30000,
  });

  const getStatus = (fnName: string) => {
    if (fnName === "manychat-webhook") {
      if (healthLoading) return "loading";
      return healthData?.manychat === "connected" ? "online" : "error";
    }
    if (fnName === "social-analytics" || fnName === "publish-to-facebook") {
      if (fbLoading) return "loading";
      if (fbTest?.status === "error" && String(fbTest?.error || "").includes("blocked")) return "blocked";
      return fbTest?.status === "ok" ? "online" : "warning";
    }
    if (fnName === "visitor-tracking") {
      return visitorTest?.status === "ok" ? "online" : "loading";
    }
    if (fnName === "publish-to-instagram") {
      return fbTest?.status === "ok" ? "online" : "warning";
    }
    return "loading";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Wifi className="w-3 h-3 mr-1" /> Online</Badge>;
      case "error":
        return <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" /> Offline</Badge>;
      case "blocked":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><AlertTriangle className="w-3 h-3 mr-1" /> Blocked</Badge>;
      case "warning":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><AlertTriangle className="w-3 h-3 mr-1" /> Warning</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30"><Clock className="w-3 h-3 mr-1" /> Loading</Badge>;
    }
  };

  const hasFbBlocked = getStatus("publish-to-facebook") === "blocked";

  return (
    <div className="space-y-4">
      {hasFbBlocked && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-300 text-sm">API Access Blocked (Code 200)</h4>
              <p className="text-amber-200/70 text-xs mt-1">
                A API do Facebook retornou "API access blocked". Revise as permissões <code className="bg-amber-900/40 px-1 rounded">pages_manage_posts</code>, <code className="bg-amber-900/40 px-1 rounded">pages_read_engagement</code> e <code className="bg-amber-900/40 px-1 rounded">pages_read_user_content</code> no{" "}
                <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline text-amber-300">Facebook Developer Console</a>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400">Edge Functions</h3>
        <Button variant="ghost" size="sm" onClick={() => refetchHealth()} className="text-slate-400 hover:text-slate-200 h-7 text-xs">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {FUNCTIONS.map((fn) => {
          const status = getStatus(fn.name);
          return (
            <Card key={fn.name} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${status === "online" ? "bg-emerald-400 animate-pulse" : status === "error" ? "bg-red-400" : status === "blocked" ? "bg-amber-400" : "bg-slate-500"}`} />
                    <CardTitle className="text-xs font-medium text-slate-200 leading-tight">{fn.displayName}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                <p className="text-[10px] text-slate-500 leading-tight">{fn.description}</p>
                <div className="flex items-center justify-between">
                  {getStatusBadge(status)}
                  <span className="text-[10px] text-slate-600">{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {healthData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {Object.entries(healthData.automations || {}).filter(([k]) => k !== "total").map(([key, val]) => (
            <div key={key} className="bg-slate-800/30 rounded-lg p-2 text-center">
              <p className="text-[10px] text-slate-500 capitalize">{key.replace(/_/g, " ")}</p>
              <p className="text-lg font-bold text-slate-200">{String(val)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
