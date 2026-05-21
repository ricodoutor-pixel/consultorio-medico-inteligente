import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Channel = "whatsapp" | "instagram_dm" | "messenger" | "fb_comment" | "ig_comment";
export type LeadClass = "patient" | "professional" | "b2b" | "influencer" | "unknown";
export type FunnelStage = "new" | "triaged" | "paid_30" | "scheduled" | "consulted" | "recurring" | "lost";

export interface UnifiedContact {
  id: string;
  phone_e164: string | null;
  whatsapp_jid: string | null;
  instagram_id: string | null;
  instagram_username: string | null;
  facebook_psid: string | null;
  display_name: string | null;
  lead_classification: LeadClass;
  funnel_stage: FunnelStage;
  total_messages: number;
  last_channel: Channel | null;
  last_message_at: string | null;
  first_seen_at: string;
}

export interface UnifiedMessage {
  id: string;
  contact_id: string;
  channel: Channel;
  direction: "inbound" | "outbound";
  message_type: string;
  content: string | null;
  audio_transcript: string | null;
  intent: string | null;
  urgency_score: number | null;
  is_bot_handled: boolean;
  created_at: string;
}

export interface BrisaMetrics {
  active24h: number;
  leadsR30: number;
  leadsB2B: number;
  leadsProfessional: number;
  conversionRate24h: number;
}

const POLL_MS = 15_000;

export function useBrisaConversations(filters: {
  channel?: Channel | "all";
  classification?: LeadClass | "all";
  urgent?: boolean;
} = {}) {
  const [contacts, setContacts] = useState<UnifiedContact[]>([]);
  const [metrics, setMetrics] = useState<BrisaMetrics>({
    active24h: 0,
    leadsR30: 0,
    leadsB2B: 0,
    leadsProfessional: 0,
    conversionRate24h: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      let query = supabase
        .from("brisa_unified_contacts")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(100);

      if (filters.channel && filters.channel !== "all") {
        query = query.eq("last_channel", filters.channel);
      }
      if (filters.classification && filters.classification !== "all") {
        query = query.eq("lead_classification", filters.classification);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setContacts((data as UnifiedContact[]) ?? []);

      // Métricas 24h
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: active } = await supabase
        .from("brisa_unified_contacts")
        .select("id,lead_classification,funnel_stage")
        .gte("last_message_at", since);

      const list = active ?? [];
      const leadsR30 = list.filter((c: any) => c.funnel_stage === "paid_30").length;
      const leadsB2B = list.filter((c: any) => c.lead_classification === "b2b").length;
      const leadsProf = list.filter((c: any) => c.lead_classification === "professional").length;
      const consulted = list.filter((c: any) => c.funnel_stage === "consulted" || c.funnel_stage === "scheduled").length;
      setMetrics({
        active24h: list.length,
        leadsR30,
        leadsB2B,
        leadsProfessional: leadsProf,
        conversionRate24h: list.length ? Math.round((consulted / list.length) * 100) : 0,
      });
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  }, [filters.channel, filters.classification]);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, POLL_MS);
    return () => clearInterval(t);
  }, [fetchData]);

  return { contacts, metrics, loading, error, refresh: fetchData };
}

export function useBrisaConversationHistory(contactId: string | null) {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contactId) {
      setMessages([]);
      return;
    }
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("brisa_unified_conversations")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (active) {
        setMessages((data as UnifiedMessage[]) ?? []);
        setLoading(false);
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [contactId]);

  return { messages, loading };
}

export async function takeOverConversation(contactId: string, minutes = 30, reason?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();
  const { error } = await supabase
    .from("brisa_human_takeover")
    .upsert({
      contact_id: contactId,
      taken_by: user.id,
      taken_at: new Date().toISOString(),
      expires_at: expiresAt,
      reason: reason ?? null,
    });
  if (error) throw error;
}

export async function releaseTakeover(contactId: string) {
  const { error } = await supabase.from("brisa_human_takeover").delete().eq("contact_id", contactId);
  if (error) throw error;
}
