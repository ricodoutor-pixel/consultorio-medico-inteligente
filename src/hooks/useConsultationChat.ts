import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { doctorChannel, userChannel } from "@/lib/realtime-channels";
import {
  type ConsultationChatRow,
  isConsultationAppointmentId,
  mergeConsultationMessages,
  normalizeConsultationMessage,
} from "@/lib/consultation-chat";

// consultation_chats ainda não consta nos tipos gerados do banco.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela fora dos tipos gerados (não editáveis)
const chats = () => (supabase as any).from("consultation_chats");

/**
 * Mensagens da consulta gravadas no servidor + tempo real para os dois lados.
 * `role` define o canal (paciente ou médico) e o tipo de remetente das mensagens enviadas.
 */
export function useConsultationChat(
  appointmentId: string | null | undefined,
  userId: string | null | undefined,
  role: "patient" | "doctor",
  enabled = true,
) {
  const [messages, setMessages] = useState<ConsultationChatRow[]>([]);
  const [sending, setSending] = useState(false);
  const active = enabled && !!userId && isConsultationAppointmentId(appointmentId);

  const reload = useCallback(async () => {
    if (!active) return;
    const { data, error } = await chats()
      .select("id, appointment_id, sender_type, sender_id, content, created_at")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (!error && Array.isArray(data)) {
      setMessages((prev) => mergeConsultationMessages(prev, data as ConsultationChatRow[]));
    }
  }, [active, appointmentId]);

  useEffect(() => {
    if (!active) return;
    void reload();
    const name = `consulta-chat-${appointmentId}`;
    const channel = supabase
      .channel(role === "doctor" ? doctorChannel(userId!, name) : userChannel(userId!, name))
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consultation_chats",
          filter: `appointment_id=eq.${appointmentId}`,
        },
        (payload: { new?: ConsultationChatRow }) => {
          if (payload?.new?.id) {
            setMessages((prev) => mergeConsultationMessages(prev, [payload.new as ConsultationChatRow]));
          }
        },
      )
      .subscribe((status) => {
        // Ao (re)conectar, busca o que pode ter chegado enquanto a conexão caiu.
        if (status === "SUBSCRIBED") void reload();
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [active, appointmentId, userId, role, reload]);

  /** Envia e devolve true se o servidor aceitou (consulta paga e em andamento). */
  const send = useCallback(
    async (text: string): Promise<boolean> => {
      const content = normalizeConsultationMessage(text);
      if (!active || !content) return false;
      setSending(true);
      try {
        const { data, error } = await chats()
          .insert({ appointment_id: appointmentId, sender_type: role, sender_id: userId, content })
          .select("id, appointment_id, sender_type, sender_id, content, created_at")
          .single();
        if (error || !data) return false;
        setMessages((prev) => mergeConsultationMessages(prev, [data as ConsultationChatRow]));
        return true;
      } finally {
        setSending(false);
      }
    },
    [active, appointmentId, role, userId],
  );

  return { messages, send, sending, reload };
}
