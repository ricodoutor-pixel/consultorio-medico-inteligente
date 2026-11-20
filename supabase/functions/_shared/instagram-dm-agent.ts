// 📸 Agente de Directs do Instagram — Enf. Brisa (cérebro Gemini via brisa-ai.ts)
// Reaproveita: persona/CTA, política de segurança (emergência, humano, opt-out, reembolso),
// memória omnichannel e dedup atômico. Só texto sai daqui; nada clínico é inventado.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { quickResponse, repeatedWithinDay, sanitizeOutboundAnswer } from "./brisa-response-policy.mjs";
import { containsHarassment, classifyLead } from "./brisa-persona.ts";
import { BRISA_SYSTEM_PROMPT, processar_triagem_brisa } from "./brisa-ai.ts";
import { IG_PAGE_ACCESS_TOKEN } from "./meta-secrets.ts";

const GRAPH = "https://graph.facebook.com/v19.0";
const MAX_REPLY_CHARS = 900; // limite da API do Instagram ≈ 1000 bytes

const INSTAGRAM_ADDENDUM = `

━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 CANAL: DIRECT DO INSTAGRAM (@plantayraizltda)
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Texto puro: SEM markdown (nada de ** ou #), no máximo 4 linhas curtas e 1 emoji.
• Seja transparente: você é a Enf. Brisa, assistente virtual; a equipe humana acompanha. Nunca diga que é pessoa real.
• Nunca diagnostique, indique medicamento, dose ou produto. Oriente a Orientação Técnica (R$ 30) ou consulta com médico em ${"https://www.plantayraiz.com.br/profissionais"}.
• Nunca invente preços, horários, vagas ou promessas de cura. Se não souber, diga que a equipe confirma.
• Sempre feche com UM próximo passo claro (link ou pergunta simples).`;

export type IgMessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    is_deleted?: boolean;
    attachments?: Array<{ type?: string }>;
  };
};

let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_sb) {
    _sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _sb;
}

export function igAutoReplyEnabled(): boolean {
  return (Deno.env.get("IG_DM_AUTOREPLY") || "on").toLowerCase() !== "off" && Boolean(IG_PAGE_ACCESS_TOKEN);
}

/** Texto limpo para o Instagram: sem markdown, limitado. */
export function toInstagramText(answer: string): string {
  const clean = sanitizeOutboundAnswer(answer)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\n)#{1,6}\s*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return clean.length > MAX_REPLY_CHARS ? clean.slice(0, MAX_REPLY_CHARS - 1).trimEnd() + "…" : clean;
}

async function sendInstagramText(recipientId: string, text: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const r = await fetch(`${GRAPH}/me/messages?access_token=${encodeURIComponent(IG_PAGE_ACCESS_TOKEN)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: recipientId }, messaging_type: "RESPONSE", message: { text } }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: `${r.status} ${JSON.stringify(data?.error || data).slice(0, 300)}` };
    return { ok: true, id: data?.message_id };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 300) };
  }
}

async function senderProfile(igsid: string): Promise<{ name?: string; username?: string }> {
  try {
    const r = await fetch(`${GRAPH}/${igsid}?fields=name,username&access_token=${encodeURIComponent(IG_PAGE_ACCESS_TOKEN)}`);
    if (!r.ok) { await r.text(); return {}; }
    return await r.json();
  } catch { return {}; }
}

/** Processa UM Direct recebido. Nunca lança: falhas ficam no log e a mensagem NÃO é reenviada. */
export async function handleInstagramDm(ownIgId: string | undefined, ev: IgMessagingEvent): Promise<string> {
  const senderId = ev.sender?.id;
  const msg = ev.message;
  if (!senderId || !msg?.mid) return "ignored:no_sender_or_mid";
  if (msg.is_echo || msg.is_deleted) return "ignored:echo_or_deleted";
  if (ownIgId && senderId === ownIgId) return "ignored:own_account";
  if (!igAutoReplyEnabled()) return "disabled";

  const text = (msg.text || "").trim();
  const hasAttachment = Boolean(msg.attachments?.length);
  if (!text && !hasAttachment) return "ignored:empty";

  const profile = await senderProfile(senderId);
  const contactId = await sb().rpc("upsert_unified_contact", {
    _channel: "instagram_dm", _instagram_id: senderId,
    _instagram_username: profile.username ?? null, _display_name: profile.name ?? null,
  }).then((r) => (r.error ? null : (r.data as string)));
  if (!contactId) return "stopped:contact_unavailable";

  // Dedup atômico: um único INSERT vence (índice único channel+external_message_id). Falha = não responde.
  const claim = await sb().rpc("log_unified_message", {
    _contact_id: contactId, _channel: "instagram_dm", _direction: "inbound",
    _content: text || "[anexo]", _message_type: hasAttachment && !text ? "image" : "text",
    _external_id: msg.mid, _intent: null, _urgency: null, _audio_transcript: null,
    _raw: { type: msg.attachments?.[0]?.type ?? "text" },
  });
  if (claim.error) return "stopped:storage_failure";
  if (!claim.data) return "ignored:duplicate";

  // Pausas: humano assumiu / opt-out. Só o operador libera (limpa metadata.ig_handoff / ig_opt_out).
  const { data: contact } = await sb().from("brisa_unified_contacts").select("metadata").eq("id", contactId).maybeSingle();
  const meta = (contact?.metadata ?? {}) as Record<string, unknown>;
  if (meta.ig_handoff || meta.ig_opt_out) return "paused";
  const { data: takeover } = await sb().rpc("is_human_takeover_active", { _contact_id: contactId });
  if (takeover) return "paused:takeover";

  if (text && containsHarassment(text)) return "ignored:harassment"; // sem resposta

  const { data: hist } = await sb().from("brisa_unified_conversations")
    .select("direction,content,created_at").eq("contact_id", contactId).eq("channel", "instagram_dm")
    .order("created_at", { ascending: false }).limit(14);
  const history = (hist ?? []).reverse();

  const senderName = profile.name || profile.username || "";
  const quick = text
    ? quickResponse({ question: text, senderName })
    : { answer: "Recebi seu anexo, mas por aqui só consigo ler texto. Pode escrever em poucas palavras o que você precisa?", model: "attachment-response" };

  let answer = "";
  let model = "gemini";
  if (quick) {
    if ((quick as any).suppressed) return "suppressed";
    answer = quick.answer;
    model = (quick as any).model || "policy";
    if ((quick as any).handoff || (quick as any).optOut) {
      await sb().from("brisa_unified_contacts").update({
        metadata: { ...meta, [(quick as any).handoff ? "ig_handoff" : "ig_opt_out"]: new Date().toISOString() },
      }).eq("id", contactId);
    }
  } else {
    const ai = await processar_triagem_brisa(text, senderId, "instagram_dm", {
      history: history.map((h) => ({ role: h.direction === "outbound" ? "assistant" : "user", content: h.content ?? "" })),
      systemPrompt: BRISA_SYSTEM_PROMPT + INSTAGRAM_ADDENDUM,
    });
    // Falha de IA: não responde com texto genérico; a mensagem fica no log para a equipe.
    if (!ai.ok) return "stopped:ai_unavailable";
    answer = ai.reply;
    const lead = classifyLead(text);
    if (lead !== "unknown") {
      const map: Record<string, string> = { paciente: "patient", profissional: "professional", b2b: "b2b", influencer: "influencer" };
      await sb().from("brisa_unified_contacts").update({ lead_classification: map[lead] }).eq("id", contactId);
    }
  }

  const finalText = toInstagramText(answer);
  if (!finalText) return "ignored:empty_answer";
  const outHistory = history.filter((h) => h.direction === "outbound").map((h) => ({ content: h.content, created_at: h.created_at }));
  if (repeatedWithinDay(finalText, outHistory)) return "ignored:repeat_24h";

  const sent = await sendInstagramText(senderId, finalText);
  if (!sent.ok) {
    console.error("[instagram-dm-agent] envio falhou:", sent.error);
    return "stopped:send_failed";
  }
  // Só envios bem-sucedidos entram no histórico de 24 h.
  await sb().rpc("log_unified_message", {
    _contact_id: contactId, _channel: "instagram_dm", _direction: "outbound", _content: finalText,
    _message_type: "text", _external_id: sent.id ?? null, _intent: model, _urgency: null,
    _audio_transcript: null, _raw: null,
  });
  return `replied:${model}`;
}
