import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, AlertCircle, CheckCircle2, Clock, Link as LinkIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase: any = _supabase;
import { toast } from "sonner";

interface Alert {
  id: string;
  type: "new_appointment" | "urgent" | "follow_up" | "document_ready";
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

interface NurseBrisaAlertSystemProps {
  doctorId: string;
}

const ALERT_ICONS = {
  new_appointment: Bell,
  urgent: AlertCircle,
  follow_up: Clock,
  document_ready: CheckCircle2,
};

const ALERT_COLORS = {
  new_appointment: "bg-blue-50 border-blue-200 text-blue-900",
  urgent: "bg-red-50 border-red-200 text-red-900",
  follow_up: "bg-amber-50 border-amber-200 text-amber-900",
  document_ready: "bg-green-50 border-green-200 text-green-900",
};

const ALERT_BADGE_COLORS = {
  new_appointment: "bg-blue-600",
  urgent: "bg-red-600",
  follow_up: "bg-amber-600",
  document_ready: "bg-green-600",
};

export function NurseBrisaAlertSystem({ doctorId }: NurseBrisaAlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (doctorId) {
      loadAlerts();
      subscribeToAlerts();
    }
  }, [doctorId]);

  useEffect(() => {
    const count = alerts.filter((a) => !a.isRead).length;
    setUnreadCount(count);
  }, [alerts]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("nurse_brisa_alerts")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        setAlerts(
          data.map((item) => ({
            id: item.id,
            type: item.alert_type as Alert["type"],
            title: item.title,
            message: item.message,
            actionUrl: item.action_url,
            isRead: item.is_read,
            createdAt: new Date(item.created_at),
          }))
        );
      }
    } catch (err) {
      console.error("Erro ao carregar alertas:", err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToAlerts = () => {
    const channel = supabase
      .channel(`nurse_brisa_alerts_${doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "nurse_brisa_alerts",
          filter: `doctor_id=eq.${doctorId}`,
        },
        (payload) => {
          const newAlert: Alert = {
            id: payload.new.id,
            type: payload.new.alert_type,
            title: payload.new.title,
            message: payload.new.message,
            actionUrl: payload.new.action_url,
            isRead: false,
            createdAt: new Date(payload.new.created_at),
          };
          setAlerts((prev) => [newAlert, ...prev]);
          toast.info(`🔔 ${newAlert.title}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("nurse_brisa_alerts")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;

      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
      );
    } catch (err) {
      console.error("Erro ao marcar como lido:", err);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      await handleMarkAsRead(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error("Erro ao descartar alerta:", err);
    }
  };

  const handleActionClick = (alert: Alert) => {
    if (alert.actionUrl) {
      window.location.href = alert.actionUrl;
    }
    handleMarkAsRead(alert.id);
  };

  if (loading) {
    return (
      <Card className="p-6 rounded-xl border-purple-200/50 bg-purple-50/50">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-xl border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center relative">
            <Bell className="h-5 w-5 text-purple-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-purple-900">
              Alertas da Enf. Brisa
            </h3>
            <p className="text-xs text-purple-700">Agente virtual de suporte</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-purple-100 text-purple-900 border-purple-300">
          {alerts.length} alertas
        </Badge>
      </div>

      {/* Alertas */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-purple-700/60">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum alerta no momento</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const IconComponent = ALERT_ICONS[alert.type];
              const colorClass = ALERT_COLORS[alert.type];
              const badgeColorClass = ALERT_BADGE_COLORS[alert.type];

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <Card
                    className={`p-4 border rounded-lg transition-all ${
                      alert.isRead
                        ? `${colorClass} opacity-60`
                        : `${colorClass} border-2 shadow-md`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${badgeColorClass}`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleDismiss(alert.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        <p className="text-xs leading-relaxed mb-3">{alert.message}</p>

                        <div className="flex items-center gap-2 flex-wrap">
                          {!alert.isRead && (
                            <Badge variant="secondary" className="text-[10px]">
                              Novo
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {alert.createdAt.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {alert.actionUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] gap-1"
                              onClick={() => handleActionClick(alert)}
                            >
                              <LinkIcon className="h-3 w-3" />
                              Abrir
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-200/50 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => {
              alerts.forEach((a) => {
                if (!a.isRead) handleMarkAsRead(a.id);
              });
            }}
          >
            Marcar todos como lidos
          </Button>
        </div>
      )}
    </Card>
  );
}

export default NurseBrisaAlertSystem;
