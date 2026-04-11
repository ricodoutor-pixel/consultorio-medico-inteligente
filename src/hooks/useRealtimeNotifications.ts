import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

const POLL_INTERVAL_MS = 15_000; // 15 seconds

export function useRealtimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      // Detect new notifications for toast
      setNotifications((prev) => {
        const prevIds = new Set(prev.map((n) => n.id));
        const newOnes = (data as Notification[]).filter((n) => !prevIds.has(n.id));
        for (const n of newOnes) {
          toast({ title: n.title, description: n.message });
        }
        return data as Notification[];
      });
      setUnreadCount(data.length);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchNotifications();

    // Poll for new notifications
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
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
