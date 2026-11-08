// 🌿 Planta y Raíz — Orientação Técnica no site (Dr. Edilson Bezerra On)
// Contrato v2: Triagem salva antes da ordem MP -> Liberação SOMENTE via Webhook (status 'ready')
// -> Paciente clica em Iniciar ('start') -> 30 minutos de Orientação Técnica Educativa estilo WhatsApp.
// Suporta pausa/intervenção em tempo real pelo Dr. Edilson e geração de relatório revisado.

import { TRIAGE_KEYS, invalidTriageFields, hasEmergency, canEnterOrientation } from "../_shared/orientation-triage.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { drEdilsonPersona, ORIENTACAO_MINUTES } from "../_shared/agents.ts";
import { buildScientificContextBlock } from "../_shared/scientific-context.ts";
import { GATEWAY_GEMINI_PRIMARY, GATEWAY_NO_REASONING } from "../_shared/gemini.ts";
import { createOtStreamParser } from "../_shared/ot-stream.ts";
import { extractPmids, lookupPmids, buildPatientPmidBlock, applyCitationVerification } from "../_shared/pmid-verify.ts";
import { notifyPaymentConfirmedOnce, notifyOrientationEvent } from "../_shared/payment-notify.ts";
import { shouldAutoClose, FAREWELL_MESSAGE } from "../_shared/orientation-farewell.ts";
import { orientationCode, enforceAttendanceCode, reportAttendanceCode } from "../_shared/orientation-code.ts";
import { normalizeReportAddress } from "../_shared/orientation-report-language.ts";
import { generateChatCompletion, streamChatCompletion, GatewayError } from "npm:@lovable.dev/ai-gateway@0.1.11";
import type {} from "../_shared/generated/ai-gateway/models.d.ts";

type SessionRow = {
  id: string;
  user_id: string;
  external_reference: string;
  mp_payment_id: string | null;
  triage: Record<string, unknown> | null;
  started_at: string | null;
  expires_at: string | null;
  status: "ready" | "active" | "paused" | "expired" | "completed";
  paused: boolean;
  paused_by?: string | null;
  paused_at?: string | null;
  messages_count: number | null;
  attendance_code?: string;
  closed_at?: string | null;
};

const secondsLeft = (row: SessionRow) => {
  if (!row.expires_at) return ORIENTACAO_MINUTES * 60;
  return Math.max(0, Math.floor((new Date(row.expires_at).getTime() - Date.now()) / 1000));
};

function sanitize(input: unknown, max = 4000): string {
  if (typeof input !== "string") return "";
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, max);
}

/**
 * Garante que links de profissionais enviados ao paciente sejam reais e clicáveis.
 * Substitui qualquer ocorrência do texto literal "{id}" (com ou sem URL) pela vitrine geral,
 * e normaliza links relativos /profissionais/... para a URL completa do site.
 */
function sanitizeOutboundLinks(text: string): string {
  const SITE = "https://plantayraiz.com.br";
  let out = text;
  // Remove placeholder literal em qualquer formato: /profissionais/{id}, {id} solto em link, etc.
  out = out.replace(/https?:\/\/[^\s)]*\/profissionais\/\{[^}]*\}/gi, `${SITE}/profissionais`);
  out = out.replace(/\/profissionais\/\{[^}]*\}/g, "/profissionais");
  // Completa links relativos da vitrine para URL absoluta clicável.
  out = out.replace(/(?<!https?:\/\/[^\s)]*)\/profissionais(\/[0-9a-fA-F-]{36})?/g, `${SITE}/profissionais$1`);
  return out;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Serviço indisponível" }, 500);

    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authErr } = await authed.auth.getUser();
    if (authErr || !authData?.user) return json({ error: "Unauthorized" }, 401);
    const uid = authData.user.id;

    const sb = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "status";

    // Verifica se usuário é admin
    const checkIsAdmin = async (): Promise<boolean> => {
      const { data: hasRole } = await sb.rpc("has_role", { _user_id: uid, _role: "admin" });
      if (hasRole === true) return true;
      const { data: roleRow } = await sb.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
      return !!roleRow;
    };

    const targetSessionId = (typeof body?.sessionId === "string" ? body.sessionId : (typeof body?.session_id === "string" ? body.session_id : null));

    const patientName = async (userId: string): Promise<string> => {
      const { data: prof } = await sb.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      return (prof as { full_name?: string } | null)?.full_name || "Paciente";
    };

    /** Aviso de encerramento ao Dr. Edilson (dedup por pedido; sem dados de saúde). */
    const fireClosedNotice = (sess: SessionRow, rating: number | null, waitForRating = false) => {
      EdgeRuntime.waitUntil((async () => {
        // Give the visible rating screen time to save. Submission can dispatch sooner;
        // both paths use the same atomic event claim, never duplicate the notice.
        if (waitForRating) await new Promise(resolve => setTimeout(resolve, 40_000));
        const { data: saved } = await sb.from("avaliacoes_orientacao").select("rating").eq("session_id", sess.id).maybeSingle();
        const { data: closed } = await sb.from("ot_web_sessions").select("closed_at").eq("id", sess.id).maybeSingle();
        const durationMin = sess.started_at
          ? Math.max(0, Math.round((Date.parse(closed?.closed_at || new Date().toISOString()) - Date.parse(sess.started_at)) / 60000)) : null;
        await notifyOrientationEvent(sb, {
          externalReference: sess.external_reference,
          patientName: await patientName(sess.user_id),
          event: "fim",
          rating: saved?.rating ?? rating,
          durationMin,
          attendanceCode: sess.attendance_code,
        });
      })());
    };

    // Carrega a sessão do usuário (específica por ID ou a mais recente)
    const loadUserSession = async (): Promise<SessionRow | null> => {
      let q = sb.from("ot_web_sessions").select("*").eq("user_id", uid);
      if (targetSessionId) {
        q = q.eq("id", targetSessionId);
      } else if (typeof body.external_reference === "string") {
        q = q.eq("external_reference", body.external_reference);
      } else {
        q = q.order("created_at", { ascending: false }).limit(1);
      }
      const { data } = await q.maybeSingle();

      if (!data) return null;
      const row = data as SessionRow;

      const { data: order } = await sb.from("orientacao_tecnica_orders")
        .select("id, status, triagem, ai_analysis, flow_status")
        .eq("external_reference", row.external_reference).eq("user_id", uid).maybeSingle();
      let triage = order?.triagem || {};
      if (!Object.keys(triage).length && order?.ai_analysis) {
        try { triage = JSON.parse(order.ai_analysis); } catch { /* legacy */ }
      }
      // Sala já existente foi aberta por um gate anterior: não revalidar o formato
      // de respostas antigas (ex.: "45 anos"); exigir apenas pagamento aprovado e ausência de emergência.
      const paid = ["approved", "completed", "dispatched"].includes(order?.status ?? "");
      if (!order || !paid || hasEmergency(triage as Record<string, unknown>)) return null;
      row.attendance_code = orientationCode(order.id);

      // Fim dos 30 min: encerra no servidor (sala vira somente leitura e a avaliação aparece).
      if (row.status === "active" && row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
        const { error: closeError } = await sb.from("ot_web_sessions").update({ status: "completed", closed_at: new Date().toISOString() }).eq("id", row.id);
        if (closeError) throw closeError;
        await sb.from("ot_messages").insert({
          session_id: row.id,
          role: "system",
          content: `⏱️ Os ${ORIENTACAO_MINUTES} minutos da Orientação Técnica chegaram ao fim. A sala foi encerrada — avalie o atendimento abaixo e baixe seu relatório.`,
        });
        row.status = "completed";
        fireClosedNotice(row, null, true);
      }

      return row;
    };

    // ── 1. STATUS (Retorna o estado oficial para o frontend) ─────────────────
    if (action === "status") {
      const sess = await loadUserSession();

      if (sess) {
        if (sess.status === "ready" || sess.status === "active" || sess.status === "paused") {
          return json({
            state: sess.status,
            session: sess,
            minutesLeft: Math.max(0, Math.ceil(secondsLeft(sess) / 60)),
            secondsLeft: secondsLeft(sess),
          });
        }
        if (sess.status === "expired") {
          return json({
            state: "expired",
            session: sess,
            minutesLeft: 0,
            secondsLeft: 0,
          });
        }
        if (sess.status === "completed") {
          const { data: ratingRow } = await sb.from("avaliacoes_orientacao")
            .select("rating").eq("session_id", sess.id).maybeSingle();
          return json({
            state: "completed",
            session: sess,
            minutesLeft: 0,
            secondsLeft: 0,
            rating: ratingRow?.rating ?? null,
          });
        }
      }

      let query = sb.from("orientacao_tecnica_orders")
        .select("id, external_reference, status, flow_status, triagem, qr_code, qr_code_base64, mp_payment_id, created_at")
        .eq("user_id", uid).order("created_at", { ascending: false }).limit(1);
      if (typeof body.external_reference === "string") query = query.eq("external_reference", body.external_reference);
      const { data: order } = await query.maybeSingle();
      if (!order) return json({ state: "none" });
      if (order.status === "pending" && order.mp_payment_id) {
        // Reconciliação: consulta o Mercado Pago diretamente caso o webhook não tenha chegado.
        const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
        if (token) {
          try {
            const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(order.mp_payment_id)}`, { headers: { Authorization: `Bearer ${token}` } });
            if (r.ok) {
              const p = await r.json();
              const amt = Number(p.transaction_amount);
              const refOk = !p.external_reference || p.external_reference === order.external_reference;
              if (p.status === "approved" && amt === 30 && refOk) {
                const { data: upd } = await sb.from("orientacao_tecnica_orders")
                  .update({ status: "approved", paid_at: p.date_approved || new Date().toISOString(), flow_status: order.flow_status === "aguardando_pagamento" ? "pago" : order.flow_status })
                  .eq("id", order.id).eq("status", "pending").select("id");
                console.log(`[ot-reconcile] pedido ${order.id} aprovado via consulta MP (${upd?.length ?? 0})`);
                order.status = "approved";
                if (upd?.length) {
                  // Webhook não chegou: o aviso de pagamento ao Dr. Edilson sai por aqui, uma única vez.
                  const { data: prof } = await sb.from("profiles").select("full_name").eq("id", uid).maybeSingle();
                  EdgeRuntime.waitUntil(notifyPaymentConfirmedOnce(sb, {
                    externalReference: order.external_reference,
                    patientName: (prof as any)?.full_name || "Paciente",
                    amountBrl: amt,
                    service: "Orientação Técnica",
                    paymentId: order.mp_payment_id,
                  }));
                }
              } else if (p.status === "rejected") {
                await sb.from("orientacao_tecnica_orders").update({ status: "rejected" }).eq("id", order.id).eq("status", "pending");
                order.status = p.status;
              }
            }
          } catch (e) { console.error("[ot-reconcile] falha", (e as Error).message); }
        }
      }
      if (order.status === "pending") return json({ state: "awaiting_payment", order });
      if (order.status === "approved") {
        // Auto-cura: triagem já completa e sem emergência, mas a sala não foi criada.
        const tri = (order.triagem || {}) as Record<string, unknown>;
        if (invalidTriageFields(tri).length === 0 && !hasEmergency(tri)) {
          const { data: ex } = await sb.from("ot_web_sessions").select("id").eq("external_reference", order.external_reference).maybeSingle();
          if (!ex) {
            await sb.from("ot_web_sessions").upsert({
              user_id: uid, external_reference: order.external_reference, mp_payment_id: order.mp_payment_id,
              triage: tri, status: "ready", messages_count: 0,
            }, { onConflict: "external_reference", ignoreDuplicates: true });
            await sb.from("orientacao_tecnica_orders").update({ flow_status: "sala_liberada" }).eq("id", order.id);
          }
          const s2 = await loadUserSession();
          if (s2) return json({ state: s2.status, session: s2, minutesLeft: Math.max(0, Math.ceil(secondsLeft(s2) / 60)), secondsLeft: secondsLeft(s2) });
        }
        return json({ state: "triage", order });
      }
      return json({ state: "none", order });
    }

    if (action === "save_triage") {
      if (typeof body.external_reference !== "string" || !body.answer || typeof body.answer !== "object" || Array.isArray(body.answer)) return json({ error: "triage_invalid", fields: ["answer"] }, 400);
      const answer = body.answer as Record<string, unknown>;
      const keys = Object.keys(answer);
      if (keys.length !== 1 || !TRIAGE_KEYS.includes(keys[0] as typeof TRIAGE_KEYS[number])) return json({ error: "triage_invalid", fields: keys }, 400);
      const fields = invalidTriageFields(answer, false);
      if (fields.length) return json({ error: "triage_invalid", fields }, 400);
      const { data: order } = await sb.from("orientacao_tecnica_orders").select("*")
        .eq("external_reference", body.external_reference).eq("user_id", uid).maybeSingle();
      if (!order || order.status !== "approved") return json({ error: "payment_not_approved" }, 403);
      const { data: existingSession } = await sb.from("ot_web_sessions").select("id").eq("external_reference", order.external_reference).maybeSingle();
      // Sala já criada: não trava o paciente, apenas devolve para a sala.
      if (existingSession) return json({ state: "ready", triagem: order.triagem || {} });
      const triagem = { ...(order.triagem || {}), ...answer };
      const emergency = hasEmergency(triagem);
      const complete = invalidTriageFields(triagem).length === 0;
      const flowStatus = complete && !emergency ? "triagem_concluida" : "pago";
      const { error } = await sb.from("orientacao_tecnica_orders").update({
        triagem, flow_status: flowStatus, ai_analysis: JSON.stringify(triagem),
        ...(complete && !emergency ? { triage_completed_at: new Date().toISOString() } : {}),
      }).eq("id", order.id).eq("user_id", uid).eq("status", "approved");
      if (error) {
        console.error("[ot] triage_save_failed", { message: error.message, details: error.details, hint: error.hint, code: error.code });
        return json({ error: "triage_save_failed" }, 500);
      }
      if (complete && !emergency) {
        const { error: sessionError } = await sb.from("ot_web_sessions").upsert({
          user_id: uid, external_reference: order.external_reference, mp_payment_id: order.mp_payment_id,
          triage: triagem, status: "ready", messages_count: 0,
        }, { onConflict: "external_reference", ignoreDuplicates: true });
        if (sessionError) return json({ error: "session_save_failed" }, 500);
        await sb.from("orientacao_tecnica_orders").update({ flow_status: "sala_liberada" }).eq("id", order.id);
      }
      return json({ state: emergency ? "emergency" : complete ? "ready" : "triage", triagem });
    }

    // ── 2. START (Ativa a sessão 'ready' iniciando o cronômetro de 30 min) ──
    if (action === "start") {
      const sess = await loadUserSession();
      if (!sess) return json({ error: "Nenhuma sessão encontrada" }, 404);

      if (sess.status === "ready") {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ORIENTACAO_MINUTES * 60_000);

        const { data: updated, error: upErr } = await sb
          .from("ot_web_sessions")
          .update({
            status: "active",
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .eq("id", sess.id)
          .select("*")
          .single();

        if (upErr || !updated) {
          return json({ error: "Erro ao iniciar sessão" }, 500);
        }

        // Mensagem de boas-vindas do sistema/agente
        const welcomeText =
          `Olá! Sou o **Dr. Edilson Bezerra ON**, persona de inteligência artificial supervisionada pelo Dr. Edilson Bezerra (CRM Bolívia nº 10963).\n\n` +
          `Estou aqui para acolher você, entender em detalhes suas queixas e necessidades, cruzar com nosso acervo de evidências científicas e orientar os melhores caminhos antes de uma consulta formal com um médico prescritor da nossa vitrine.\n\n` +
          `*Lembrando: esta é uma orientação técnica educativa; eu não emito receitas nem prescrevo medicamentos.* Como posso te ajudar hoje?`;

        await sb.from("ot_messages").insert({
          session_id: sess.id,
          role: "agent",
          content: welcomeText,
        });

        // Aviso de início da Orientação ao Dr. Edilson (uma única vez por pedido).
        EdgeRuntime.waitUntil((async () => {
          await notifyOrientationEvent(sb, {
            externalReference: sess.external_reference,
            patientName: await patientName(uid),
            event: "inicio",
            attendanceCode: sess.attendance_code,
          });
        })());

        return json({
          state: "active",
          session: updated,
          minutesLeft: ORIENTACAO_MINUTES,
          secondsLeft: ORIENTACAO_MINUTES * 60,
        });
      }

      return json({
        state: sess.status,
        session: sess,
        minutesLeft: Math.max(0, Math.ceil(secondsLeft(sess) / 60)),
        secondsLeft: secondsLeft(sess),
      });
    }

    // ── 3. MESSAGES (Lista histórico de mensagens da sessão) ─────────────────
    if (action === "messages") {
      const sess = await loadUserSession();
      if (!sess) return json({ messages: [] });

      const { data: msgs, error: messagesError } = await sb
        .from("ot_messages")
        .select("*")
        .eq("session_id", sess.id)
        .order("created_at", { ascending: true });

      if (messagesError) return json({ error: "Não foi possível carregar a conversa. Tente novamente." }, 500);
      return json({ messages: msgs || [] });
    }

    // ── 4. CHAT (Envia mensagem do paciente e faz streaming da resposta) ────
    if (action === "chat") {
      const sess = await loadUserSession();
      if (!sess) return json({ error: "Sessão não encontrada" }, 404);

      if (sess.status === "paused" || sess.paused) {
        return json({ error: "A sessão está pausada temporariamente pelo Dr. Edilson para acompanhamento." }, 423);
      }

      if (sess.status === "expired") {
        return json({ error: "O tempo da sua sessão encerrou." }, 402);
      }
      if (sess.status !== "active") return json({ error: "Inicie a orientação antes de enviar mensagens." }, 409);

      const userText = sanitize(body?.message, 4000);
      const attachment = body?.attachment && typeof body.attachment === "object" ? body.attachment : null;

      if (!userText && !attachment) {
        return json({ error: "Mensagem vazia" }, 400);
      }

      // Persiste mensagem do paciente
      const { error: messageError } = await sb.from("ot_messages").insert({
        session_id: sess.id,
        role: "patient",
        content: userText || (attachment ? `[Arquivo enviado: ${attachment.name}]` : ""),
        attachment_path: attachment?.path || null,
        attachment_name: attachment?.name || null,
        attachment_mime: attachment?.mime || null,
      }).select().single();
      if (messageError) return json({ error: "Não foi possível gravar sua mensagem. Tente novamente." }, 500);

      // Encerramento automático: o agente perguntou "posso ajudar em mais alguma coisa?"
      // e o paciente confirmou que não precisa de mais nada → despedida curta, sem nova
      // pergunta, sala encerrada no servidor (a avaliação aparece sem exigir botão).
      const { data: lastAgent } = await sb
        .from("ot_messages")
        .select("content")
        .eq("session_id", sess.id)
        .eq("role", "agent")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (shouldAutoClose(userText, lastAgent?.content ?? null)) {
        await sb.from("ot_messages").insert({
          session_id: sess.id,
          role: "agent",
          content: FAREWELL_MESSAGE,
        });
        const { error: closeError } = await sb.from("ot_web_sessions").update({
          status: "completed",
          closed_at: new Date().toISOString(),
        }).eq("id", sess.id).neq("status", "completed");
        if (closeError) return json({ error: "Não foi possível encerrar a sala. Tente de novo." }, 500);
        fireClosedNotice(sess, null, true);
        return json({ closed: true, state: "completed", farewell: FAREWELL_MESSAGE });
      }

      // Busca contexto científico (biblioteca interna + PubMed em tempo real).
      // Auditoria: registra apenas os termos clínicos genéricos enviados ao PubMed,
      // a hora e o total — nunca texto livre do paciente.
      const evidence = await buildScientificContextBlock(userText, 3, {
        onPubMedResult: (result) => {
          if (!result.query) return;
          const auditInsert = sb.from("pubmed_query_audit").insert({
            session_id: sess.id,
            source: "orientacao",
            query: result.query,
            total: result.total,
            status: result.status,
          });
          const waitUntil = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime?.waitUntil;
          if (waitUntil) waitUntil(auditInsert.then(() => undefined));
          else auditInsert.then(() => undefined);
        },
      }).catch(() => "");

      // PMIDs pedidos pelo paciente: consulta real ao PubMed antes da resposta.
      const askedPmids = extractPmids(userText);
      const askedLookup = await lookupPmids(askedPmids);
      const patientPmidBlock = buildPatientPmidBlock(askedLookup, askedPmids);

      // Busca médicos reais cadastrados na vitrine (para encaminhamento humanizado sem veterinários)
      const { data: realDocs } = await sb
        .from("doctors")
        .select("id, name, specialty, crm, bio")
        .neq("specialty", "Veterinária")
        .neq("specialty", "Médico Veterinário")
        .limit(10);

      let doctorsReferralBlock = "";
      if (realDocs && realDocs.length > 0) {
        doctorsReferralBlock = `\n\n=== MÉDICOS CREDENCIADOS NA VITRINE PLANTA Y RAÍZ (Indique o mais adequado se oportuno) ===\n` +
          realDocs.map((d: any) => `• ${d.name} (${d.specialty || "Medicina Integrativa"}) - Link: /profissionais/${d.id}`).join("\n");
      }

      // Monta histórico recente
      const { data: history } = await sb
        .from("ot_messages")
        .select("role, content")
        .eq("session_id", sess.id)
        .order("created_at", { ascending: false })
        .limit(12);

      const cleanHistory = (history || [])
        .reverse()
        .map((m: any) => ({
          role: m.role === "patient" ? "user" : "assistant",
          content: sanitize(m.content, 4000),
        }));

      const minutes = Math.max(1, Math.ceil(secondsLeft(sess) / 60));
      const triageBlock = sess.triage
        ? `\n\n=== DADOS DA TRIAGEM DO PACIENTE ===\n${sanitize(JSON.stringify(sess.triage), 2000)}`
        : "";

      // Continuidade real: o agente só pode mencionar atendimentos anteriores se existirem.
      const { count: priorCount } = await sb
        .from("ot_web_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .in("status", ["completed", "expired"])
        .neq("id", sess.id);
      const continuityBlock = (priorCount ?? 0) > 0
        ? `\n\n=== CONTINUIDADE ===\nEste paciente já teve ${priorCount} atendimento(s) anterior(es) registrado(s) na plataforma. Você pode mencionar continuidade se fizer sentido.`
        : `\n\n=== CONTINUIDADE ===\nEsta é a PRIMEIRA conversa registrada com este paciente. NUNCA diga "desde nossa última conversa", "como conversamos antes" ou qualquer frase que sugira atendimento anterior.`;

      const completionStream = await streamChatCompletion({
          model: "google/gemini-3.8-flash",
          reasoning: GATEWAY_NO_REASONING,
          messages: [
            {
              role: "system",
              content: drEdilsonPersona(minutes) + triageBlock + continuityBlock + evidence + patientPmidBlock + doctorsReferralBlock,
            },
            ...cleanHistory,
          ],
      });
      const aiRes = completionStream.toResponse();
      if (!aiRes.body) {
        return json({ error: "Erro no serviço de inteligência clínica" }, 502);
      }

      // Resposta completa é lida no servidor e cada PMID é conferido no PubMed
      // antes de chegar ao paciente: metadados vêm do registro real, nunca do modelo.
      const reader = aiRes.body.getReader();
      const decoder = new TextDecoder();
      const parse = createOtStreamParser();
      let rawText = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          rawText += parse(decoder.decode(value, { stream: true }));
        }
        rawText += parse(decoder.decode() + "\n");
      } catch {
        return json({ error: "A resposta foi interrompida. Tente novamente." }, 502);
      }
      let finalText = sanitizeOutboundLinks(rawText.trim());
      const citedPmids = extractPmids(finalText);
      if (citedPmids.length) {
        const lookup = await lookupPmids(citedPmids);
        const urls = citedPmids.map((id) => `https://pubmed.ncbi.nlm.nih.gov/${id}/`);
        const { data: libRows } = await sb.from("scientific_articles").select("url").in("url", [...urls, ...urls.map((u) => u.slice(0, -1))]);
        const libraryPmids = new Set((libRows || []).map((r: any) => String(r.url).match(/(\d+)\/?$/)?.[1]).filter(Boolean) as string[]);
        finalText = applyCitationVerification(finalText, lookup, libraryPmids, userText);
      }
      if (finalText) {
        const { error: replyError } = await sb.from("ot_messages").insert({ session_id: sess.id, role: "agent", content: finalText });
        if (replyError) console.error("[ot-edilson-web] reply save failed", replyError);
        await sb.from("ot_web_sessions").update({
          messages_count: (sess.messages_count ?? 0) + 2,
          last_message_at: new Date().toISOString(),
        }).eq("id", sess.id);
      }
      const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: finalText } }] })}\n\ndata: [DONE]\n\n`;
      return new Response(sse, {
        headers: { ...cors, "Content-Type": "text/event-stream" },
      });
    }

    // ── 5. GENERATE REPORT (Gera rascunho de relatório individual) ─────────
    if (action === "generate_report") {
      const sess = await loadUserSession();
      if (!sess) return json({ error: "Sessão não encontrada" }, 404);

      const { data: msgs, error: historyError } = await sb
        .from("ot_messages")
        .select("role, content")
        .eq("session_id", sess.id)
        .order("created_at", { ascending: true });
      if (historyError) return json({ error: "Não foi possível carregar a conversa para o relatório." }, 500);
      if (!msgs?.some(m => m.role === "patient")) return json({ error: "Converse com a assistente antes de gerar seu relatório." }, 409);
      const { data: existingDraft } = await sb.from("ot_reports").select("id").eq("session_id", sess.id).in("status", ["draft", "approved"]).limit(1).maybeSingle();
      if (existingDraft) return json({ success: true, report_id: existingDraft.id, status: "draft" });

      // Durable per-session claim: concurrent clicks must not bill twice.
      const started = Date.now();
      const { data: claim, error: claimError } = await sb.from("ot_web_sessions")
        .update({ report_generation_started_at: new Date(started).toISOString() })
        .eq("id", sess.id).is("report_generation_started_at", null).select("id").maybeSingle();
      if (claimError) return json({ error: "Não foi possível preparar o relatório." }, 500);
      if (!claim) return json({ error: "A geração já está em andamento. Consulte seus relatórios ou chame a equipe sem pagar novamente." }, 409);

      const conversationText = (msgs || [])
        .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      const triageStr = JSON.stringify(sess.triage || {});

      // Identificação estruturada do atendimento (não depende da redação da IA).
      const attendanceCode = sess.attendance_code || orientationCode(sess.id);
      const name = await patientName(uid);
      const quando = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(new Date());

      const prompt =
        `Você é o Dr. Edilson Bezerra ON. Crie um Relatório de Orientação Técnica e Acolhimento Individual para o paciente com base na triagem e conversa abaixo.\n\n` +
        `IDENTIFICAÇÃO OBRIGATÓRIA (use exatamente estes dados na seção 1):\n` +
        `- Paciente: ${name}\n` +
        `- Código do atendimento: ${attendanceCode}\n` +
        `- Data e hora: ${quando} (São Paulo)\n\n` +
        `REDACÃO: use sempre "você", inclusive nas perguntas ao médico: "Quais alternativas terapêuticas seguras você recomenda?". NUNCA use "senhor(a)", "senhor", "senhora", "o você", "a você" ou tratamento com barra de gênero.\n\n` +
        `DIRETRIZES LEGAIS RIGOROSAS:\n` +
        `- NÃO diagnostique, NÃO prescreva medicamentos, NÃO indique marcas comerciais nem doses/posologias.\n` +
        `- Estruture o relatório em markdown elegante:\n` +
        `  # Relatório de Orientação Técnica e Acolhimento\n` +
        `  ## 1. Identificação e Motivo do Acolhimento\n` +
        `  ## 2. Contexto Clínico e Queixas Relatadas\n` +
        `  ## 3. Aspectos Educativos sobre o Sistema Endocanabinoide e Hábitos Integrativos\n` +
        `  ## 4. Orientações Gerais e Cuidados de Saúde\n` +
        `  ## 5. Encaminhamento Sugerido para Médico Prescritor Credenciado\n` +
        `  ## 6. Perguntas para levar ao médico\n` +
        `  ## 7. Aviso: orientação educativa gerada por IA; revisão médica pendente. Não é receita nem assinatura médica.\n` +
        `Não invente estudos, DOI, referências, dados pessoais, formação ou validação médica. Não cite referências de memória.\n\n` +
        `Triagem: ${triageStr}\n\nConversa:\n${conversationText.slice(-16000)}`;

      let repData;
      try {
        repData = await generateChatCompletion({
          model: "google/gemini-3.8-flash",
          messages: [{ role: "user", content: prompt }],
        }, { metadata: { orientation_session_id: sess.id } });
      } catch (error) {
        console.error("[ot-report] generation_failed", error instanceof GatewayError ? error.toJSON() : "application_error");
        // Unknown inference outcome is not automatically replayed.
        if (error instanceof GatewayError && error.outcome === "not_started") await sb.from("ot_web_sessions").update({ report_generation_started_at: null }).eq("id", sess.id);
        return json({ error: "Não foi possível finalizar o relatório. Chame a equipe; não precisa pagar novamente." }, 502);
      }
      const reportContent = repData.choices?.[0]?.message?.content;
      if (typeof reportContent !== "string" || !reportContent.trim()) return json({ error: "O relatório não foi concluído. Tente novamente." }, 502);

      // Garante o tratamento neutro mesmo se a IA desobedecer ao prompt.
      const neutralContent = enforceAttendanceCode(sanitizeOutboundLinks(normalizeReportAddress(reportContent)), attendanceCode);

      const contentHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(neutralContent)))).map(b => b.toString(16).padStart(2, "0")).join("");
      const { data: newReport, error: repErr } = await sb.from("ot_reports").insert({
        session_id: sess.id,
        user_id: uid,
        content_md: neutralContent,
        verification_code: attendanceCode,
        status: "draft",
        educational_released_at: new Date().toISOString(),
        generation_ms: Date.now() - started,
        content_hash: contentHash,
      }).select().single();

      if (repErr) {
        return json({ error: "Erro ao gerar rascunho de relatório" }, 500);
      }

      return json({
        success: true,
        report_id: newReport.id,
        status: "draft",
        code: attendanceCode,
        message: "Relatório educativo disponível para baixar. Gerado por IA; revisão médica pendente.",
      });
    }

    // ── 6. REPORTS (Lista relatórios da sessão do usuário) ───────────────────
    if (action === "reports") {
      const sess = await loadUserSession();
      if (!sess) return json({ reports: [] });

      const { data: reports, error: reportsError } = await sb
        .from("ot_reports")
        .select("id, status, created_at, approved_at, verification_code, educational_released_at")
        .eq("session_id", sess.id)
        .order("created_at", { ascending: false });

      if (reportsError) return json({ error: "Não foi possível carregar seus relatórios. Tente novamente." }, 500);
      return json({ reports: reports || [] });
    }

    // ── 7. CLOSE SESSION (despedida: servidor marca a sala como encerrada) ──
    if (action === "close_session") {
      const sess = await loadUserSession();
      if (!sess) return json({ error: "Sessão não encontrada" }, 404);
      if (sess.status === "completed") return json({ success: true, state: "completed" });
      if (sess.status === "ready") return json({ error: "A sessão ainda não foi iniciada." }, 409);
      const { error: closeError } = await sb.from("ot_web_sessions").update({
        status: "completed",
        closed_at: new Date().toISOString(),
      }).eq("id", sess.id).neq("status", "completed");
      if (closeError) return json({ error: "Não foi possível encerrar a sala. Tente de novo." }, 500);
      fireClosedNotice(sess, null, true);
      return json({ success: true, state: "completed" });
    }

    // ── 8. SUBMIT RATING (avaliação por três carinhas; uma por atendimento) ──
    if (action === "submit_rating") {
      const sess = await loadUserSession();
      if (!sess) return json({ error: "Sessão não encontrada" }, 404);
      const rating = Number(body?.rating);
      if (sess.status !== "completed") return json({ error: "Encerre a orientação antes de avaliar." }, 409);
      if (![1, 2, 3].includes(rating)) return json({ error: "rating_invalid" }, 400);
      const comment = sanitize(body?.comment, 1000) || null;

      const { data: existing } = await sb.from("avaliacoes_orientacao")
        .select("id, rating, comment").eq("session_id", sess.id).maybeSingle();
      if (!existing) {
        const { error: rErr } = await sb.from("avaliacoes_orientacao").upsert({
          session_id: sess.id,
          user_id: uid,
          rating,
          comment,
        }, { onConflict: "session_id", ignoreDuplicates: true });
        if (rErr) return json({ error: "rating_save_failed" }, 500);
      }
      const { data: saved, error: readError } = await sb.from("avaliacoes_orientacao")
        .select("rating, comment").eq("session_id", sess.id).single();
      if (readError || !saved) return json({ error: "Não foi possível confirmar a avaliação. Tente de novo." }, 500);
      fireClosedNotice(sess, saved.rating);
      return json({ success: true, state: "completed", alreadyRated: !!existing, rating: saved.rating, comment: saved.comment, code: sess.attendance_code });
    }

    // ── 9. SKIP RATING (paciente pulou: registra encerramento sem avaliação) ──
    if (action === "skip_rating") {
      const sess = await loadUserSession();
      if (!sess) return json({ error: "Sessão não encontrada" }, 404);
      await sb.from("ot_web_sessions").update({
        status: "completed",
        closed_at: new Date().toISOString(),
      }).eq("id", sess.id).neq("status", "completed");
      fireClosedNotice(sess, null);
      return json({ success: true, state: "completed", rating: null });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // AÇÕES ADMINISTRATIVAS (Dr. Edilson Bezerra / Admin)
    // ══════════════════════════════════════════════════════════════════════════
    const isAdmin = await checkIsAdmin();

    if (action.startsWith("admin_")) {
      if (!isAdmin) return json({ error: "Acesso restrito ao Dr. Edilson Bezerra e administradores" }, 403);

      if (action === "admin_sessions") {
        const { data: list } = await sb
          .from("ot_web_sessions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);
        return json({ sessions: list || [] });
      }

      if (action === "admin_messages") {
        const sessionId = sanitize(body?.session_id, 100);
        const { data: msgs } = await sb
          .from("ot_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });
        return json({ messages: msgs || [] });
      }

      if (action === "admin_pause") {
        const sessionId = sanitize(body?.session_id, 100);
        await sb.from("ot_web_sessions").update({
          status: "paused",
          paused: true,
          paused_by: uid,
          paused_at: new Date().toISOString(),
        }).eq("id", sessionId);

        await sb.from("ot_messages").insert({
          session_id: sessionId,
          role: "system",
          content: "⏸️ Sessão pausada pelo Dr. Edilson Bezerra para avaliação direta.",
        });

        return json({ success: true, status: "paused" });
      }

      if (action === "admin_resume") {
        const sessionId = sanitize(body?.session_id, 100);
        await sb.from("ot_web_sessions").update({
          status: "active",
          paused: false,
        }).eq("id", sessionId);

        await sb.from("ot_messages").insert({
          session_id: sessionId,
          role: "system",
          content: "▶️ Sessão retomada.",
        });

        return json({ success: true, status: "active" });
      }

      if (action === "admin_send") {
        const sessionId = sanitize(body?.session_id, 100);
        const text = sanitize(body?.message, 4000);
        if (!text) return json({ error: "Mensagem vazia" }, 400);

        const { data: newMsg } = await sb.from("ot_messages").insert({
          session_id: sessionId,
          role: "supervisor",
          content: text,
        }).select().single();

        return json({ success: true, message: newMsg });
      }

      if (action === "admin_reports") {
        const { data: reps } = await sb
          .from("ot_reports")
          .select("*, ot_web_sessions(external_reference, triage)")
          .order("created_at", { ascending: false })
          .limit(30);
        return json({ reports: reps || [] });
      }

      if (action === "admin_approve_report") {
        const reportId = sanitize(body?.report_id, 100);
        const contentMd = typeof body?.content_md === "string" ? body.content_md : undefined;
        const { data: original } = await sb.from("ot_reports").select("content_md, verification_code, session_id").eq("id", reportId).single();
        if (!original) return json({ error: "Relatório não encontrado." }, 404);
        const verificationCode = reportAttendanceCode(original);

        const updatePayload: Record<string, unknown> = {
          status: "approved",
          approved_by: uid,
          approved_at: new Date().toISOString(),
          verification_code: verificationCode,
        };
        if (contentMd) updatePayload.content_md = contentMd;

        const { data: approved, error: approvalError } = await sb
          .from("ot_reports")
          .update(updatePayload)
          .eq("id", reportId)
          .select()
          .single();
        if (approvalError || !approved) return json({ error: "Não foi possível aprovar o relatório." }, 500);

        return json({ success: true, report: approved });
      }

      if (action === "admin_reject_report") {
        const reportId = sanitize(body?.report_id, 100);
        await sb.from("ot_reports").update({ status: "rejected" }).eq("id", reportId);
        return json({ success: true, status: "rejected" });
      }
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("[ot-edilson-web] erro:", e);
    return json({ error: "Erro interno no servidor" }, 500);
  }
});
