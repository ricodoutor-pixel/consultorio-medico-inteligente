import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, TrendingUp, Users, Clock, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { publicChannel } from "@/lib/realtime-channels";
import { motion } from "framer-motion";

interface DownloadStats {
  total: number;
  today: number;
  thisWeek: number;
  recentDownloads: Array<{
    id: string;
    manychat_name: string | null;
    manychat_user_id: string | null;
    platform: string | null;
    source: string | null;
    created_at: string;
  }>;
}

export function LiveAppAnalytics() {
  const [stats, setStats] = useState<DownloadStats>({
    total: 0, today: 0, thisWeek: 0, recentDownloads: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [totalRes, todayRes, weekRes, recentRes] = await Promise.all([
        supabase.from("app_downloads").select("id", { count: "exact", head: true }),
        supabase.from("app_downloads").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("app_downloads").select("id", { count: "exact", head: true }).gte("created_at", weekStart),
        supabase.from("app_downloads").select("id, manychat_name, manychat_user_id, platform, source, created_at")
          .order("created_at", { ascending: false }).limit(10),
      ]);

      setStats({
        total: totalRes.count || 0,
        today: todayRes.count || 0,
        thisWeek: weekRes.count || 0,
        recentDownloads: recentRes.data || [],
      });
    } catch (err) {
      console.error("LiveAppAnalytics: fetch error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel(publicChannel("live-app-analytics"))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "app_downloads" }, () => {
        fetchStats();
      })
      .subscribe();

    const interval = setInterval(fetchStats, 30000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchStats]);

  const cards = [
    { label: "Total Downloads", value: stats.total, icon: Download, color: "text-primary" },
    { label: "Hoje", value: stats.today, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Últimos 7 dias", value: stats.thisWeek, icon: Users, color: "text-blue-400" },
  ];

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <BarChart3 size={16} className="text-primary" />
          📲 Live App Analytics (ManyChat Sync)
          <span className="ml-auto text-[10px] text-muted-foreground font-normal flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Counters */}
        <div className="grid grid-cols-3 gap-3">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center p-3 rounded-xl bg-muted/30 border border-border/50"
            >
              <Icon size={18} className={`mx-auto mb-1 ${color}`} />
              <p className="text-xl font-black text-foreground">
                {loading ? "—" : value.toLocaleString("pt-BR")}
              </p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent downloads feed */}
        {stats.recentDownloads.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Clock size={12} /> Últimos Downloads
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {stats.recentDownloads.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/20 rounded-lg px-2 py-1.5"
                >
                  <Smartphone size={12} className="text-primary shrink-0" />
                  <span className="font-medium text-foreground truncate">
                    {d.manychat_name || "Anônimo"}
                  </span>
                  {d.manychat_user_id && (
                    <span className="text-primary/60 truncate">ID: {d.manychat_user_id.slice(0, 8)}…</span>
                  )}
                  <span className="ml-auto shrink-0">
                    {d.platform || "—"} · {d.source || "direto"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
