// 🌿 Planta y Raiz — Orientação Técnica no site (Dr. Edilson Bezerra On)
// Fluxo: triagem (site) → pagamento real R$ 30 (Mercado Pago) → sala do agente
// com cronômetro de 30 minutos. A liberação NUNCA é feita pelo cliente: a função
// consulta a API do Mercado Pago pelo external_reference e só abre a sessão se o
// pagamento estiver aprovado.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { drEdilsonPersona, ORIENTACAO_MINUTES } from "../_shared/agents.ts";
import { buildScientificContextBlock } from "../_shared/scientific-context.ts";
import { GATEWAY_GEMINI_PRIMARY, GATEWAY_NO_REASONING } from "../_shared/gemini.ts";

type SessionRow = {
  id: string;
  user_id: string;
  external_reference: string;
  expires_at: string;
  status: string;
  messages_count: number | null;
};

const secondsLeft = (row: SessionRow) =>
  Math.max(0, Math.floor((new Date(row.expires_at).getTime() - Date.now()) / 1000));

function sanitize(input: unknown, max = 4000): string {
  if (typeof input !== "string") return "";
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, max);
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authErr } = await authed.auth.getUser();
    if (authErr || !authData?.user) return json({ error: "Unauthorized" }, 401);
    const uid = authData.user.id;

    const sb = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "status";

    const loadActive = async (): Promise<SessionRow | null> => {
      const { data } = await sb
        .from("ot_web_sessions")
        .select("id, user_id, external_reference, expires_at, status, messages_count")
        .eq("user_id", uid)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as SessionRow | null) ?? null;
    };

    // ── STATUS ────────────────────────────────────────────────────────────
    if (action === "status") {
      const row = await loadActive();
      if (!row) return json({ active: false });
      return json({
        active: true,
        session_id: row.id,
        seconds_left: secondsLeft(row),
        minutes: ORIENTACAO_MINUTES,
      });
    }

    // ── UNLOCK (valida pagamento no Mercado Pago) ─────────────────────────
    if (action === "unlock") {
      const existing = await loadActive();
      if (existing) {
        return json({
          active: true,
          session_id: existing.id,
          seconds_left: secondsLeft(existing),
          minutes: ORIENTACAO_MINUTES,
        });
      }

      const ref = sanitize(body?.external_reference, 200);
      if (!ref || !ref.startsWith("orientacao") || !ref.includes(`:${uid}:`)) {
        return json({ error: "Referência de pagamento inválida" }, 400);
      }

      // Já consumida?
      const { data: used } = await sb
        .from("ot_web_sessions")
        .select("id")
        .eq("external_reference", ref)
        .maybeSingle();
      if (used) return json({ active: false, reason: "session_already_used" });

      const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!mpToken) return json({ error: "Mercado Pago não configurado" }, 500);

      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(ref)}`,
        { headers: { Authorization: `Bearer ${mpToken}` } },
      );
      if (!mpRes.ok) {
        console.error("[ot-edilson-web] MP search error", mpRes.status, await mpRes.text());
        return json({ error: "Não foi possível confirmar o pagamento agora" }, 502);
      }
      const mpData = await mpRes.json();
      const approved = (mpData?.results || []).find((p: any) => p?.status === "approved");
      if (!approved) {
        const pending = (mpData?.results || [])[0];
        return json({ active: false, reason: pending ? "payment_pending" : "payment_not_found" });
      }

      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + ORIENTACAO_MINUTES * 60_000);
      const { data: inserted, error: insErr } = await sb
        .from("ot_web_sessions")
        .insert({
          user_id: uid,
          external_reference: ref,
          mp_payment_id: String(approved.id),
          triage: body?.triage && typeof body.triage === "object" ? body.triage : {},
          started_at: startedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: "active",
        })
        .select("id, user_id, external_reference, expires_at, status, messages_count")
        .single();

      if (insErr || !inserted) {
        console.error("[ot-edilson-web] insert error", insErr?.message);
        return json({ error: "Erro ao abrir a sessão" }, 500);
      }

      return json({
        active: true,
        session_id: (inserted as SessionRow).id,
        seconds_left: secondsLeft(inserted as SessionRow),
        minutes: ORIENTACAO_MINUTES,
      });
    }

    // ── CHAT (streaming, exige sessão paga ativa) ─────────────────────────
    if (action === "chat") {
      const row = await loadActive();
      if (!row) return json({ error: "session_expired" }, 402);

      const messages = Array.isArray(body?.messages) ? body.messages : [];
      if (messages.length === 0) return json({ error: "messages array required" }, 400);

      const clean = messages.slice(-14).map((m: any) => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: sanitize(m?.content, 4000),
      })).filter((m: { content: string }) => m.content.length > 0);

      const lastUser = [...clean].reverse().find((m) => m.role === "user")?.content || "";
      const evidence = await buildScientificContextBlock(lastUser, 3).catch(() => "");

      const minutes = Math.max(1, Math.ceil(secondsLeft(row) / 60));
      const triageBlock = body?.triage && typeof body.triage === "object"
        ? `\n\n=== TRIAGEM JÁ REALIZADA (não repita estas perguntas) ===\n${sanitize(JSON.stringify(body.triage), 2000)}`
        : "";

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) return json({ error: "AI não configurada" }, 500);

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GATEWAY_GEMINI_PRIMARY,
          reasoning: GATEWAY_NO_REASONING,
          stream: true,
          messages: [
            { role: "system", content: drEdilsonPersona(minutes) + triageBlock + evidence },
            ...clean,
          ],
        }),
      });

      if (aiRes.status === 429) return json({ error: "Muitas mensagens agora. Tente em instantes." }, 429);
      if (aiRes.status === 402) return json({ error: "Créditos de IA esgotados." }, 402);
      if (!aiRes.ok || !aiRes.body) {
        console.error("[ot-edilson-web] gateway", aiRes.status, await aiRes.text().catch(() => ""));
        return json({ error: "Erro no agente" }, 502);
      }

      await sb
        .from("ot_web_sessions")
        .update({
          messages_count: (row.messages_count ?? 0) + 1,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      return new Response(aiRes.body, {
        headers: { ...cors, "Content-Type": "text/event-stream" },
      });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("[ot-edilson-web]", e);
    return json({ error: "Erro interno" }, 500);
  }
});
