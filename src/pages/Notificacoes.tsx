import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle2, Calendar, Pill, DollarSign, MessageSquare, AlertTriangle, Info, X } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const iconMap: Record<string, any> = {
  appointment: Calendar,
  prescription: Pill,
  payment: DollarSign,
  message: MessageSquare,
  alert: AlertTriangle,
  info: Info,
};

const POLL_INTERVAL_MS = 15_000;

const Notificacoes = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setNotifications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", session.user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
                  <Bell size={28} className="inline text-primary mr-2" /> Notificações
                </h1>
                {unreadCount > 0 && <Badge className="bg-primary/10 text-primary border-green text-xs ml-2">{unreadCount} não lidas</Badge>}
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={markAllRead}>
                  <CheckCircle2 size={12} className="mr-1" /> Marcar todas como lidas
                </Button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <Card className="border-border">
                <CardContent className="p-8 text-center">
                  <Bell size={32} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map(n => {
                  const Icon = iconMap[n.type] || Info;
                  return (
                    <Card key={n.id} className={`border-border transition-colors ${!n.is_read ? "bg-primary/5 border-primary/20" : ""}`}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? "bg-primary/10" : "bg-muted/30"}`}>
                          <Icon size={16} className={!n.is_read ? "text-primary" : "text-muted-foreground"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        </div>
                        {!n.is_read && (
                          <button onClick={() => markAsRead(n.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Notificacoes;
