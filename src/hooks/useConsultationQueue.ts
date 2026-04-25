/**
 * useConsultationQueue — Realtime hook for Uber-style doctor matching
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { doctorChannel, userChannel } from "@/lib/realtime-channels";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface QueueEntry {
  id: string;
  patient_id: string;
  matched_doctor_id: string | null;
  specialty: string;
  status: string;
  payment_confirmed: boolean;
  jitsi_room: string | null;
  created_at: string;
  matched_at: string | null;
}

export function useConsultationQueue(userType: "patient" | "doctor") {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [myEntry, setMyEntry] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch initial queue
  useEffect(() => {
    const fetchQueue = async () => {
      const { data } = await supabase
        .from("consultation_queue")
        .select("*")
        .in("status", ["waiting", "matched"])
        .order("created_at", { ascending: true });

      if (data) setQueue(data as QueueEntry[]);
    };

    fetchQueue();

    // Subscribe to realtime changes — RLS on realtime.messages requires
    // channel names scoped to the auth user (doctor:<uid>:... or user:<uid>:...).
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const name = userType === "doctor"
        ? doctorChannel(uid, "consultation-queue-live")
        : userChannel(uid, "consultation-queue-live");
      channel = supabase
        .channel(name)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "consultation_queue" },
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const newRecord = payload.new as QueueEntry;
          const oldRecord = payload.old as QueueEntry;

          if (payload.eventType === "INSERT") {
            setQueue(prev => [...prev, newRecord]);
            if (userType === "doctor") {
              toast({ title: "🔔 Novo paciente na fila!", description: "Aceite a consulta agora." });
            }
          } else if (payload.eventType === "UPDATE") {
            setQueue(prev => prev.map(e => e.id === newRecord.id ? newRecord : e));
            if (newRecord.status === "matched" && userType === "patient" && myEntry?.id === newRecord.id) {
              toast({ title: "🎉 Médico encontrado!", description: "Sua consulta vai começar." });
              setMyEntry(newRecord);
            }
          } else if (payload.eventType === "DELETE") {
            setQueue(prev => prev.filter(e => e.id !== oldRecord.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userType, toast, myEntry?.id]);

  const joinQueue = useCallback(async (specialty?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login required");

      const { data, error } = await supabase.functions.invoke("queue-match", {
        body: { action: "join", patient_id: user.id, specialty },
      });

      if (error) throw error;
      setMyEntry({ ...data, status: "waiting" } as QueueEntry);
      toast({ title: "Na fila!", description: "Aguardando médico disponível..." });
      return data;
    } catch (err) {
      toast({ title: "Erro", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const acceptPatient = useCallback(async (queueId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login required");

      // Get doctor ID
      const { data: doctor } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!doctor) throw new Error("Doctor profile not found");

      const { data, error } = await supabase.functions.invoke("queue-match", {
        body: { action: "accept", queue_id: queueId, doctor_id: doctor.id },
      });

      if (error) throw error;
      toast({ title: "Consulta aceita!", description: "Entrando na sala..." });
      return data;
    } catch (err) {
      toast({ title: "Erro", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const waitingCount = queue.filter(e => e.status === "waiting").length;

  return { queue, myEntry, loading, joinQueue, acceptPatient, waitingCount };
}
