type ClaimStore = { from(table: string): any };

/** One insert wins even when duplicate callbacks arrive concurrently. Fail closed. */
export async function claimBrisaInbound(sb: ClaimStore, messageId: string, chatId: string): Promise<"claimed" | "duplicate" | "unavailable"> {
  if (!messageId || !chatId) return "unavailable";
  try {
    const { data, error } = await sb.from("brisa_processed_messages")
      .insert({ wa_message_id: messageId, remote_jid: chatId })
      .select("wa_message_id").maybeSingle();
    if (error?.code === "23505") return "duplicate";
    if (error || !data) return "unavailable";
    return "claimed";
  } catch { return "unavailable"; }
}