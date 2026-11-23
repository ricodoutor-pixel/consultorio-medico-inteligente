/**
 * Acesso à sala de vídeo da consulta paga, compartilhado pelas telas do paciente e do médico.
 *
 * A sala vem só de consultation-video-token. Em caso de falha, tenta de novo e, se continuar
 * falhando, devolve um erro para a tela mostrar "Tentar de novo"/WhatsApp. Nunca troca de servidor
 * por conta própria: o meet.jit.si público exige login de moderador, e médico e paciente em
 * servidores diferentes nunca se encontram.
 */

export type ConsultationVideoAccess = { domain: string; roomName: string; jwt?: string };

export type VideoTokenInvoke = (
  name: "consultation-video-token",
  options: { body: { appointmentId: string } },
) => Promise<{ data: unknown; error: unknown }>;

export class ConsultationVideoError extends Error {}

const DEFAULT_DELAYS_MS = [1500, 3000, 5000];
const FALLBACK_MESSAGE = "Não foi possível abrir o vídeo agora. Toque em \"Tentar de novo\" ou continue pelo chat.";

async function readErrorMessage(error: unknown): Promise<string | null> {
  const ctx = (error as { context?: { json?: () => Promise<unknown> } } | null)?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = (await ctx.json()) as { error?: unknown } | null;
      if (body && typeof body.error === "string" && body.error.trim()) return body.error;
    } catch {
      /* corpo não JSON */
    }
  }
  return null;
}

export async function requestConsultationVideoAccess(
  invoke: VideoTokenInvoke,
  appointmentId: string,
  { delaysMs = DEFAULT_DELAYS_MS, sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) } = {},
): Promise<ConsultationVideoAccess> {
  let lastMessage: string | null = null;
  for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
    if (attempt > 0) await sleep(delaysMs[attempt - 1]);
    try {
      const { data, error } = await invoke("consultation-video-token", { body: { appointmentId } });
      const d = data as { ok?: boolean; domain?: unknown; roomName?: unknown; jwt?: unknown } | null;
      if (!error && d?.ok && typeof d.domain === "string" && d.domain && typeof d.roomName === "string" && d.roomName) {
        return { domain: d.domain, roomName: d.roomName, jwt: typeof d.jwt === "string" && d.jwt ? d.jwt : undefined };
      }
      lastMessage = (await readErrorMessage(error)) ?? lastMessage;
    } catch {
      /* falha de rede: tenta de novo */
    }
  }
  throw new ConsultationVideoError(lastMessage || FALLBACK_MESSAGE);
}
