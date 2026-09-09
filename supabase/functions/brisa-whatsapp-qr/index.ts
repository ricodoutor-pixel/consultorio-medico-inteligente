// 🌿 Planta y Raiz — QR Code do WhatsApp da Enfª Brisa / Dr. Edilson On
// Acesso restrito a administradores autenticados (has_role admin).
// Ações: status | qr | webhook | restart
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SB_URL = Deno.env.get("SUPABASE_URL") || "";
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const WAHA_SESSION = Deno.env.get("WAHA_SESSION") || "default";
const WAHA_KEY = Deno.env.get("WAHA_API_KEY") || "";
const WAHA_BASE = (() => {
  let u = (Deno.env.get("WAHA_API_URL") || "").trim().replace(/\/+$/, "");
  if (u && !/^https?:\/\//.test(u)) u = "https://" + u;
  return u;
})();

const EVO_BASE = (() => {
  let u = (Deno.env.get("EVOLUTION_API_URL") || "").trim().replace(/\/+$/, "");
  if (u && !/^https?:\/\//.test(u)) u = "https://" + u;
  return u;
})();
const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVO_INST = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

async function requireAdmin(req: Request): Promise<Response | null> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return json({ error: "Unauthorized" }, 401);
  const token = auth.slice(7).trim();
  try {
    const anon = createClient(SB_URL, SB_ANON);
    const { data, error } = await anon.auth.getUser(token);
    const uid = data?.user?.id;
    if (error || !uid) return json({ error: "Unauthorized" }, 401);

    const svc = createClient(SB_URL, SB_SERVICE);
    const { data: isAdmin } = await svc.rpc("has_role", { _user_id: uid, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);
    return null;
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }
}

async function waha(method: string, path: string, body?: unknown) {
  if (!WAHA_BASE || !WAHA_KEY) return { ok: false, status: 0, data: { error: "WAHA não configurado" } };
  try {
    const r = await fetch(`${WAHA_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", "X-Api-Key": WAHA_KEY },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(40_000),
    });
    const text = await r.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: r.ok, status: r.status, data };
  } catch (e: unknown) {
    return { ok: false, status: 0, data: { error: (e as Error)?.message ?? String(e) } };
  }
}

/** Normaliza qualquer formato de QR (base64, data URL, {value}) em data URL de imagem. */
function toDataUrl(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (s.startsWith("data:image")) return s;
    if (/^[A-Za-z0-9+/=\s]{200,}$/.test(s)) return `data:image/png;base64,${s.replace(/\s+/g, "")}`;
    return null;
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const k of ["base64", "qrcode", "code", "value", "data", "qr"]) {
      const v = o[k];
      const got = toDataUrl(v);
      if (got) return got;
    }
  }
  return null;
}

async function evolutionQr(): Promise<{ qr: string | null; state: string | null; raw: unknown }> {
  if (!EVO_BASE || !EVO_KEY) return { qr: null, state: null, raw: null };
  const inst = encodeURIComponent(EVO_INST);
  try {
    const r = await fetch(`${EVO_BASE}/instance/connect/${inst}`, {
      headers: { apikey: EVO_KEY },
      signal: AbortSignal.timeout(30_000),
    });
    const data = await r.json().catch(() => null);
    return { qr: toDataUrl(data), state: null, raw: data };
  } catch (e: unknown) {
    return { qr: null, state: null, raw: { error: (e as Error)?.message } };
  }
}

async function evolutionState(): Promise<string | null> {
  if (!EVO_BASE || !EVO_KEY) return null;
  try {
    const r = await fetch(`${EVO_BASE}/instance/connectionState/${encodeURIComponent(EVO_INST)}`, {
      headers: { apikey: EVO_KEY },
      signal: AbortSignal.timeout(15_000),
    });
    const d = await r.json().catch(() => null) as Record<string, unknown> | null;
    const inst = d?.instance as Record<string, unknown> | undefined;
    return String(inst?.state ?? d?.state ?? "") || null;
  } catch { return null; }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  let action = "status";
  try {
    const body = await req.json().catch(() => ({}));
    action = String((body as Record<string, unknown>)?.action ?? "status");
  } catch { /* keep default */ }

  // ── STATUS ──────────────────────────────────────────────────────────────
  if (action === "status") {
    const [sessions, me, evoState] = await Promise.all([
      waha("GET", "/api/sessions"),
      waha("GET", `/api/sessions/${WAHA_SESSION}/me`),
      evolutionState(),
    ]);
    const list = Array.isArray(sessions.data) ? sessions.data as Record<string, unknown>[] : [];
    const sess = list.find((s) => s?.name === WAHA_SESSION) ?? list[0];
    const wahaStatus = String(sess?.status ?? (WAHA_BASE ? "unknown" : "nao_configurado"));
    const meData = me.data as Record<string, unknown> | null;

    return json({
      ok: true,
      provider_ativo: wahaStatus === "WORKING" ? "waha" : evoState === "open" ? "evolution" : null,
      waha: { configurado: Boolean(WAHA_BASE && WAHA_KEY), session: WAHA_SESSION, status: wahaStatus },
      evolution: { configurado: Boolean(EVO_BASE && EVO_KEY), instancia: EVO_INST, state: evoState },
      conectado: wahaStatus === "WORKING" || evoState === "open",
      numero: meData?.id ? String(meData.id).replace(/@.*/, "") : null,
      precisa_qr: wahaStatus === "SCAN_QR_CODE" || (evoState !== null && evoState !== "open"),
    });
  }

  // ── QR ──────────────────────────────────────────────────────────────────
  if (action === "qr") {
    // 1) WAHA
    if (WAHA_BASE && WAHA_KEY) {
      await waha("POST", "/api/sessions/start", { name: WAHA_SESSION });
      await new Promise((r) => setTimeout(r, 1500));
      const qrR = await waha("GET", `/api/${WAHA_SESSION}/auth/qr?format=image`);
      const qr = toDataUrl(qrR.data);
      if (qr) return json({ ok: true, provider: "waha", qr_data_url: qr });
    }
    // 2) Evolution (fallback)
    const evo = await evolutionQr();
    if (evo.qr) return json({ ok: true, provider: "evolution", qr_data_url: evo.qr });

    return json({
      ok: false,
      error: "Não foi possível obter o QR Code agora.",
      detalhe: "Verifique se a sessão do WhatsApp está iniciada e tente novamente em alguns segundos.",
    }, 502);
  }

  // ── RESTART ─────────────────────────────────────────────────────────────
  if (action === "restart") {
    await waha("POST", "/api/sessions/stop", { name: WAHA_SESSION });
    await new Promise((r) => setTimeout(r, 2500));
    const r = await waha("POST", "/api/sessions/start", { name: WAHA_SESSION });
    return json({ ok: r.ok, action: "restart", status: r.status, data: r.data });
  }

  return json({ ok: false, error: `Ação desconhecida: ${action}`, acoes: ["status", "qr", "restart"] }, 400);
});
