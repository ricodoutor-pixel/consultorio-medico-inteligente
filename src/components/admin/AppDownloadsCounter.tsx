import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface DownloadStats {
  total: number;
  today: number;
  thisWeek: number;
  byPlatform: Record<string, number>;
}

export function AppDownloadsCounter() {
  const [stats, setStats] = useState<DownloadStats>({ total: 0, today: 0, thisWeek: 0, byPlatform: {} });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [totalRes, todayRes, weekRes] = await Promise.all([
        supabase.from('app_downloads').select('id', { count: 'exact', head: true }),
        supabase.from('app_downloads').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('app_downloads').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
      ]);

      setStats({
        total: totalRes.count || 0,
        today: todayRes.count || 0,
        thisWeek: weekRes.count || 0,
        byPlatform: {},
      });
    } catch (err) {
      console.error('Failed to fetch download stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Realtime subscription
    const channel = supabase
      .channel('app-downloads-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_downloads' }, () => {
        fetchStats();
      })
      .subscribe();

    // Polling fallback every 30s
    const interval = setInterval(fetchStats, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const cards = [
    { label: "Total Downloads", value: stats.total, icon: Download, color: "text-primary" },
    { label: "Hoje", value: stats.today, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Últimos 7 dias", value: stats.thisWeek, icon: Users, color: "text-blue-400" },
  ];

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <Smartphone size={16} className="text-primary" />
          📲 Downloads do App (ManyChat Sync)
          <span className="ml-auto text-[10px] text-muted-foreground font-normal flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
