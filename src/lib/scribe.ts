/** Escriba de IA: utilidades puras (formato de áudio, junção da transcrição e registro de consentimento). */
export type ScribeMode = "ditado" | "consulta";

/** Cada trecho é enviado a cada 4 min e 30 s (fica bem abaixo do limite de 10 MB por trecho). */
export const SCRIBE_CHUNK_MS = 270_000;
/** Teto de segurança: a consulta tem 45 min; a gravação para sozinha aos 50 min. */
export const SCRIBE_MAX_MS = 50 * 60_000;

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

export function pickAudioMimeType(isSupported: (type: string) => boolean): string | undefined {
  return MIME_CANDIDATES.find((t) => {
    try {
      return isSupported(t);
    } catch {
      return false;
    }
  });
}

/** Junta os trechos na ordem em que foram gravados, ignorando trechos vazios. */
export function joinTranscript(segments: { index: number; text: string }[]): string {
  return [...segments]
    .sort((a, b) => a.index - b.index)
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join("\n");
}

export function consentLine(mode: ScribeMode, at: Date): string {
  const when = at.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  return mode === "consulta"
    ? `[Escriba IA: paciente autorizou a gravação da consulta para transcrição em ${when}. Áudio não armazenado.]`
    : `[Escriba IA: ditado do médico transcrito em ${when}. Áudio não armazenado.]`;
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
