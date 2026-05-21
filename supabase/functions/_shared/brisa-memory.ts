/**
 * BRISA Omnichannel Memory Helper
 * Centraliza upsert de contatos e log de mensagens cross-channel
 * Usado por: whatsapp-brisa-bot, meta-messenger-bot, brisa-whatsapp, meta-comment-to-dm
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export type BrisaChannel = "whatsapp" | "instagram_dm" | "messenger" | "fb_comment" | "ig_comment";
export type BrisaDirection = "inbound" | "outbound";

let _client: SupabaseClient | null = null;
function client() {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

export interface UpsertContactArgs {
  channel: BrisaChannel;
  phone?: string;
  whatsappJid?: string;
  instagramId?: string;
  instagramUsername?: string;
  facebookPsid?: string;
  displayName?: string;
}

export async function upsertUnifiedContact(args: UpsertContactArgs): Promise<string | null> {
  const { data, error } = await client().rpc("upsert_unified_contact", {
    _channel: args.channel,
    _phone: args.phone ?? null,
    _whatsapp_jid: args.whatsappJid ?? null,
    _instagram_id: args.instagramId ?? null,
    _instagram_username: args.instagramUsername ?? null,
    _facebook_psid: args.facebookPsid ?? null,
    _display_name: args.displayName ?? null,
  });
  if (error) {
    console.error("[brisa-memory] upsertUnifiedContact:", error.message);
    return null;
  }
  return data as string;
}

export interface LogMessageArgs {
  contactId: string;
  channel: BrisaChannel;
  direction: BrisaDirection;
  content: string;
  messageType?: "text" | "audio" | "image" | "video" | "document" | "reaction";
  externalId?: string;
  intent?: string;
  urgency?: number;
  audioTranscript?: string;
  raw?: unknown;
}

export async function logUnifiedMessage(args: LogMessageArgs): Promise<void> {
  const { error } = await client().rpc("log_unified_message", {
    _contact_id: args.contactId,
    _channel: args.channel,
    _direction: args.direction,
    _content: args.content,
    _message_type: args.messageType ?? "text",
    _external_id: args.externalId ?? null,
    _intent: args.intent ?? null,
    _urgency: args.urgency ?? null,
    _audio_transcript: args.audioTranscript ?? null,
    _raw: args.raw ?? null,
  });
  if (error) console.error("[brisa-memory] logUnifiedMessage:", error.message);
}

export async function isHumanTakeoverActive(contactId: string): Promise<boolean> {
  const { data, error } = await client().rpc("is_human_takeover_active", { _contact_id: contactId });
  if (error) {
    console.error("[brisa-memory] isHumanTakeoverActive:", error.message);
    return false;
  }
  return !!data;
}

/**
 * Recupera últimas N mensagens do contato (cross-channel) para dar contexto ao Gemini
 */
export async function getRecentHistory(contactId: string, limit = 8) {
  const { data, error } = await client()
    .from("brisa_unified_conversations")
    .select("channel,direction,content,created_at,intent")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[brisa-memory] getRecentHistory:", error.message);
    return [];
  }
  return (data ?? []).reverse();
}

/**
 * Atualiza classificação de lead após Gemini classificar a intenção
 */
export async function updateLeadClassification(
  contactId: string,
  classification: "patient" | "professional" | "b2b" | "influencer" | "unknown",
  funnelStage?: string,
) {
  const update: Record<string, unknown> = { lead_classification: classification, updated_at: new Date().toISOString() };
  if (funnelStage) update.funnel_stage = funnelStage;
  const { error } = await client()
    .from("brisa_unified_contacts")
    .update(update)
    .eq("id", contactId);
  if (error) console.error("[brisa-memory] updateLeadClassification:", error.message);
}
