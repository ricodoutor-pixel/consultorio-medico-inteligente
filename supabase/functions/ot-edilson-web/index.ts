// 🌿 Planta y Raíz — Orientação Técnica no site (Dr. Edilson Bezerra On)
// Contrato v2: Triagem salva antes da ordem MP -> Liberação SOMENTE via Webhook (status 'ready')
// -> Paciente clica em Iniciar ('start') -> 30 minutos de Orientação Técnica Educativa estilo WhatsApp.
// Suporta pausa/intervenção em tempo real pelo Dr. Edilson e geração de relatório revisado.

import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { drEdilsonPersona, ORIENTACAO_MINUTES } from "../_shared/agents.ts";
import { buildScientificContextBlock } from "../_shared/scientific-context.ts";
import { GATEWAY_GEMINI_PRIMARY, GATEWAY_NO_REASONING } from "../_shared/gemini.ts";

type SessionRow = {
  id: string;
  user_id: string;
  external_reference: string;
  mp_payment_id: string | null;
  triage: Record<string, unknown> | null;
  started_at: string | null;
  expires_at: string | null;
  status: "ready" | "active" | "paused" | "expired";
  paused: boolean;
  paused_by?: string | null;
  paused_at?: string | null;
  messages_count: number | null;
};

const secondsLeft = (row: SessionRow) => {
  if (!row.expires_at) return ORIENTACAO_MINUTES * 60;
  return Math.max(0, Math.floor((new Date(row.expires_at).getTime() - Date.now()) / 1000));
};

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

    // Verifica se usuário é admin
    const checkIsAdmin = async (): Promise<boolean> => {
      const { data: hasRole } = await sb.rpc("has_role", { _user_id: uid, _role: "admin" });
      if (hasRole === true) return true;
      const { data: roleRow } = await sb.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
      return !!roleRow;
    };

    const targetSessionId = (typeof body?.sessionId === "string" ? body.sessionId : (typeof body?.session_id === "string" ? body.session_id : null));

    // Carrega a sessão do usuário (específica por ID ou a mais recente)
    const loadUserSession = async (): Promise<SessionRow | null> => {
      let q = sb.from("ot_web_sessions").select("*").eq("user_id", uid);
      if (targetSessionId) {
        q = q.eq("id", targetSessionId);
      } else {
        q = q.order("created_at", { ascending: false }).limit(1);
      }
      const { data } = await q.maybeSingle();

      if (!data) return null;
      const row = data as SessionRow;

      // Se passou da validade e ainda está com status 'active', marca como expired
      if (row.status === "active" && row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
        await sb.from("ot_web_sessions").update({ status: "expired" }).eq("id", row.id);
        row.status = "expired";
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
      }

      // Se não tem sessão, verifica se tem pedido pendente aguardando webhook
      const { data: pendingOrder } = await sb
        .from("orientacao_tecnica_orders")
        .select("id, status, created_at")
        .eq("user_id", uid)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingOrder) {
        return json({ state: "awaiting_payment" });
      }

      return json({ state: "none" });
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

      const { data: msgs } = await sb
        .from("ot_messages")
        .select("*")
        .eq("session_id", sess.id)
        .order("created_at", { ascending: true });

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

      const userText = sanitize(body?.message, 4000);
      const attachment = body?.attachment && typeof body.attachment === "object" ? body.attachment : null;

      if (!userText && !attachment) {
        return json({ error: "Mensagem vazia" }, 400);
      }

      // Persiste mensagem do paciente
      const { data: insertedMsg } = await sb.from("ot_messages").insert({
        session_id: sess.id,
        role: "patient",
        content: userText || (attachment ? `[Arquivo enviado: ${attachment.name}]` : ""),
        attachment_path: attachment?.path || null,
        attachment_name: attachment?.name || null,
        attachment_mime: attachment?.mime || null,
      }).select().single();

      // Busca contexto científico
      const evidence = await buildScientificContextBlock(userText, 3).catch(() => "");

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

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) return json({ error: "AI gateway não configurada" }, 500);

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
            {
              role: "system",
              content: drEdilsonPersona(minutes) + triageBlock + evidence + doctorsReferralBlock,
            },
            ...cleanHistory,
          ],
        }),
      });

      if (aiRes.status === 429) return json({ error: "Muitas requisições. Tente em instantes." }, 429);
      if (!aiRes.ok || !aiRes.body) {
        return json({ error: "Erro no serviço de inteligência clínica" }, 502);
      }

      // Cria tee stream para repassar ao cliente e ao mesmo tempo gravar a resposta final no banco
      const [clientStream, dbStream] = aiRes.body.tee();

      // Gravação assíncrona do texto completo da IA
      (async () => {
        try {
          const reader = dbStream.getReader();
          const decoder = new TextDecoder();
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
                try {
                  const parsed = JSON.parse(trimmed.slice(6));
                  const delta = parsed.choices?.[0]?.delta?.content || "";
                  fullText += delta;
                } catch { /* chunk parcial */ }
              }
            }
          }

          if (fullText.trim()) {
            await sb.from("ot_messages").insert({
              session_id: sess.id,
              role: "agent",
              content: fullText.trim(),
            });
            await sb.from("ot_web_sessions").update({
              messages_count: (sess.messages_count ?? 0) + 2,
              last_message_at: new Date().toISOString(),
            }).eq("id", sess.id);
          }
        } catch (e) {
          console.error("[ot-edilson-web] stream db error", e);
        }
      })();

      return new Response(clientStream, {
        headers: { ...cors, "Content-Type": "text/event-stream" },
      });
    }

    // ── 5. GENERATE REPORT (Gera rascunho de relatório individual) ─────────
    if (action === "generate_report") {
      const sess = await loadUserSession();
      if (!sess) return json({ error: "Sessão não encontrada" }, 404);

      const { data: msgs } = await sb
        .from("ot_messages")
        .select("role, content")
        .eq("session_id", sess.id)
        .order("created_at", { ascending: true });

      const conversationText = (msgs || [])
        .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const triageStr = JSON.stringify(sess.triage || {});

      const prompt =
        `Você é o Dr. Edilson Bezerra ON. Crie um Relatório de Orientação Técnica e Acolhimento Individual para o paciente com base na triagem e conversa abaixo.\n\n` +
        `DIRETRIZES LEGAIS RIGOROSAS:\n` +
        `- NÃO diagnostique, NÃO prescreva medicamentos, NÃO indique marcas comerciais nem doses/posologias.\n` +
        `- Estruture o relatório em markdown elegante:\n` +
        `  # Relatório de Orientação Técnica e Acolhimento\n` +
        `  ## 1. Identificação e Motivo do Acolhimento\n` +
        `  ## 2. Contexto Clínico e Queixas Relatadas\n` +
        `  ## 3. Aspectos Educativos sobre o Sistema Endocanabinoide e Hábitos Integrativos\n` +
        `  ## 4. Orientações Gerais e Cuidados de Saúde\n` +
        `  ## 5. Encaminhamento Sugerido para Médico Prescritor Credenciado\n` +
        `  ## 6. Parecer Técnico Educativo\n\n` +
        `Triagem: ${triageStr}\n\nConversa:\n${conversationText.slice(0, 6000)}`;

      const repRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GATEWAY_GEMINI_PRIMARY,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const repData = await repRes.json();
      const reportContent = repData.choices?.[0]?.message?.content || "Relatório em elaboração.";

      const { data: newReport, error: repErr } = await sb.from("ot_reports").insert({
        session_id: sess.id,
        user_id: uid,
        content_md: reportContent,
        status: "draft",
      }).select().single();

      if (repErr) {
        return json({ error: "Erro ao gerar rascunho de relatório" }, 500);
      }

      return json({
        success: true,
        report_id: newReport.id,
        status: "draft",
        message: "Rascunho gerado. Aguardando revisão e aprovação do Dr. Edilson Bezerra.",
      });
    }

    // ── 6. REPORTS (Lista relatórios da sessão do usuário) ───────────────────
    if (action === "reports") {
      const sess = await loadUserSession();
      if (!sess) return json({ reports: [] });

      const { data: reports } = await sb
        .from("ot_reports")
        .select("id, status, created_at, approved_at, verification_code")
        .eq("session_id", sess.id)
        .order("created_at", { ascending: false });

      return json({ reports: reports || [] });
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
        const verificationCode = `PYR-OT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        const updatePayload: Record<string, unknown> = {
          status: "approved",
          approved_by: uid,
          approved_at: new Date().toISOString(),
          verification_code: verificationCode,
        };
        if (contentMd) updatePayload.content_md = contentMd;

        const { data: approved } = await sb
          .from("ot_reports")
          .update(updatePayload)
          .eq("id", reportId)
          .select()
          .single();

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
