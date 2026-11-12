/**
 * Chat ao vivo da consulta paga (paciente ↔ médico). As mensagens ficam gravadas no servidor
 * (`consultation_chats`), visíveis só aos participantes; o envio só é aceito com a consulta paga
 * e em andamento (regras no banco, migração 0022).
 */
export type ConsultationChatSender = "patient" | "doctor" | "system";

export interface ConsultationChatRow {
  id: string;
  appointment_id: string;
  sender_type: ConsultationChatSender;
  sender_id: string | null;
  content: string;
  created_at: string;
}

export const CONSULTATION_CHAT_MAX_LENGTH = 4000;

/** Junta mensagens sem duplicar (realtime + recarga) e mantém a ordem de envio. */
export function mergeConsultationMessages(
  current: ConsultationChatRow[],
  incoming: ConsultationChatRow[],
): ConsultationChatRow[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
}

/** Texto pronto para envio, ou null se vazio. Corta no limite aceito pelo banco. */
export function normalizeConsultationMessage(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, CONSULTATION_CHAT_MAX_LENGTH);
}

export function isConsultationAppointmentId(id: string | null | undefined): id is string {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
