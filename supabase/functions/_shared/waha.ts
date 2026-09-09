// WAHA (Enfª Brisa) — canal oficial de alertas WhatsApp da plataforma.
// Usado apenas para disparos transacionais (consulta/agendamento).
// Fallback: Evolution API, caso o WAHA não esteja configurado/disponível.
import { sendWhatsApp as sendViaEvolution } from "./evolution.ts";

const RAW_URL = Deno.env.get("WAHA_API_URL") || "waha-production-4e9c.up.railway.app";
const KEY = Deno.env.get("WAHA_API_KEY") || "";
const SESSION = Deno.env.get("WAHA_SESSION") || "default";

function baseUrl(): string {
  let u = RAW_URL.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

/** Normaliza telefone brasileiro para dígitos E.164. */
export function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/\D/g, "");
  if (!p) return "";
  if (!p.startsWith("55") && p.length <= 11) p = `55${p}`;
  return p;
}

export interface WhatsAppResult {
  ok: boolean;
  channel?: "waha" | "evolution";
  status?: number;
  error?: string;
}

/** Envia texto pelo WAHA; se falhar, tenta a Evolution API. */
export async function sendWhatsAppAlert(
  phone: string,
  message: string,
): Promise<WhatsAppResult> {
  const number = normalizePhone(phone);
  if (!number) return { ok: false, error: "telefone inválido" };

  if (KEY) {
    try {
      const res = await fetch(`${baseUrl()}/api/sendText`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": KEY },
        body: JSON.stringify({
          session: SESSION,
          chatId: `${number}@c.us`,
          text: message,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) return { ok: true, channel: "waha", status: res.status };
      const txt = await res.text().catch(() => "");
      console.error(`[waha] envio falhou ${res.status}: ${txt.slice(0, 200)}`);
    } catch (e) {
      console.error("[waha] erro de rede:", e instanceof Error ? e.message : String(e));
    }
  }

  const fallback = await sendViaEvolution(number, message);
  return { ...fallback, channel: "evolution" };
}
