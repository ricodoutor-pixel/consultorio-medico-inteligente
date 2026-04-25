import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { userChannel } from "@/lib/realtime-channels";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

// Fallback poll caso o WebSocket caia (rede instável / mobile background)
const FALLBACK_POLL_MS = 60_000;

export function useRealtimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!userId) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        if (!silent) {
          setNotifications((prev) => {
            const prevIds = new Set(prev.map((n) => n.id));
            const newOnes = (data as Notification[]).filter(
              (n) => !prevIds.has(n.id)
            );
            for (const n of newOnes) {
              toast({ title: n.title, description: n.message });
            }
            return data as Notification[];
          });
        } else {
          setNotifications(data as Notification[]);
        }
        setUnreadCount(data.length);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) return;

    // 1) Carga inicial
    fetchNotifications(true);

    // 2) Realtime — canal scoped no usuário (RLS realtime.messages exige user:<uid>:%)
    const channelName = userChannel(userId, "notifications");
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((c) => c + 1);
          toast({ title: newNotif.title, description: newNotif.message });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          if (updated.is_read) {
            setNotifications((prev) => prev.filter((n) => n.id !== updated.id));
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // 3) Fallback poll defensivo (rede móvel instável)
    const interval = setInterval(() => fetchNotifications(true), FALLBACK_POLL_MS);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    setNotifications([]);
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
