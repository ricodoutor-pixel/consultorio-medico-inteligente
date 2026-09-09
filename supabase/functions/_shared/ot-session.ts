// 🌿 Planta y Raiz — Controle de sessão paga de Orientação Técnica (30 min por pagamento)
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ORIENTACAO_MINUTES } from './agents.ts';

export type OtSession = {
  session_id: string;
  status: string;
  started_at: string;
  expires_at: string;
  seconds_left: number;
  opened_now: boolean;
};

export function serviceClient(): SupabaseClient | null {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export function digitsOnly(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Retorna a sessão ativa do telefone. Se não houver, abre uma nova SOMENTE
 * quando existe pagamento aprovado ainda não consumido. Sem pagamento → null.
 */
export async function resolveOtSession(
  sb: SupabaseClient,
  phone: string,
  name?: string | null,
): Promise<OtSession | null> {
  const p = digitsOnly(phone);
  if (!p) return null;
  const { data, error } = await sb.rpc('open_ot_agent_session', {
    _phone: p,
    _name: name ?? null,
    _minutes: ORIENTACAO_MINUTES,
  });
  if (error) {
    console.error('[ot-session] rpc error:', error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.session_id) return null;
  return row as OtSession;
}

/** Marca uma mensagem consumida na sessão (contador + último acesso). */
export async function touchOtSession(sb: SupabaseClient, sessionId: string): Promise<void> {
  const { data } = await sb
    .from('ot_agent_sessions')
    .select('messages_count')
    .eq('id', sessionId)
    .maybeSingle();
  const current = typeof data?.messages_count === 'number' ? data.messages_count : 0;
  await sb
    .from('ot_agent_sessions')
    .update({ messages_count: current + 1, last_message_at: new Date().toISOString() })
    .eq('id', sessionId);
}


/** Fecha a sessão (tempo esgotado). */
export async function closeOtSession(sb: SupabaseClient, sessionId: string): Promise<void> {
  await sb
    .from('ot_agent_sessions')
    .update({ status: 'expired', closed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('status', 'active');
}

/** Marca que o aviso de encerramento já foi enviado (evita repetir). */
export async function markClosingNotice(sb: SupabaseClient, sessionId: string): Promise<boolean> {
  const { data } = await sb
    .from('ot_agent_sessions')
    .update({ closing_notice_sent_at: new Date().toISOString() })
    .eq('id', sessionId)
    .is('closing_notice_sent_at', null)
    .select('id');
  return Array.isArray(data) && data.length > 0;
}

export function minutesLeft(session: OtSession): number {
  return Math.max(0, Math.ceil(session.seconds_left / 60));
}
