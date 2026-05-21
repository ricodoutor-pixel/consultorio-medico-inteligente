# Plano: Brisa 360° Omnichannel — Execução em Cascata

Vou executar as 4 frentes em sequência (não dá pra paralelizar totalmente porque a #3 depende da tabela criada na #1, e a #4 valida tudo). Ordem por impacto no funil de receita.

---

## 🥇 PRIORIDADE 1 — Memória Cross-Channel (base de tudo)

**Por quê primeiro:** sem isso, paciente que vem do Insta e migra pro WhatsApp repete triagem e abandona. É a fundação que os outros 3 usam.

**O que entra:**
- Nova tabela `brisa_unified_contacts` (telefone E.164 como chave primária + handles instagram_id, facebook_psid, whatsapp_jid)
- Tabela `brisa_unified_conversations` (channel, last_message_at, lead_classification, stage do funil, intent_history jsonb)
- Função `upsert_unified_contact(phone, channel, handle, payload)` SECURITY DEFINER
- RLS: só admins e service_role leem; usuários comuns sem acesso (PII)
- Helper `_shared/brisa-memory.ts` para os 4 edge functions chamarem antes de responder
- Migration de backfill: importa logs existentes de `whatsapp_brisa_log` + `instagram_dm_log` (se houver)

---

## 🥈 PRIORIDADE 2 — Comentários FB/IG → DM Automático (motor de captação)

**Por quê:** maior alavanca de top-funnel hoje. Cada comentário "PROTOCOLO/QUERO/INFO" vira lead capturado.

**O que entra:**
- Edge function `meta-comment-to-dm` (webhook Meta `feed`/`comments`)
- Keywords-trigger configuráveis: `PROTOCOLO`, `QUERO`, `INFO`, `CANNABIS`, `RECEITA`, `PRECO`
- Resposta pública no comentário (curta, sem CRM/Dr. Edilson) + Private Reply API → puxa para DM
- Anti-spam: dedup por `comment_id` (idempotência via `webhook_idempotency`)
- Rate-limit por author_id (3 comentários/hora) via `check_edge_rate_limit`
- Integração com Memória Unificada (P1): cria contact + abre conversation no DM
- HMAC validação do Meta signature (X-Hub-Signature-256)

---

## 🥉 PRIORIDADE 3 — Dashboard Brisa CEO (visibilidade + takeover)

**Por quê:** sem painel, Dr. Edilson voa cego. Precisa ver conversas dos 4 canais ao vivo.

**O que entra:**
- Rota `/admin/brisa-ceo` (protegida por `has_role admin`)
- Vista unificada: lista de conversas (todos canais), badge de canal, classificação de lead, último intent, score de urgência
- Polling 15s (não Realtime — segue regra do projeto) via `useBrisaConversations`
- Drawer de conversa: histórico cross-channel, transcript de áudio, takeover humano (botão "Assumir → silencia bot por 30min")
- Métricas topo: conversas ativas / leads R$30 / leads B2B / leads profissionais / taxa conversão 24h
- Filtros: canal, classificação, urgência, status

---

## 🏁 PRIORIDADE 4 — Validação ao Vivo (smoke test)

**Por quê:** garante que P1+P2+P3 estão integrados de verdade antes de declarar live.

**O que entra:**
- Script `bun run brisa:smoke` que dispara:
  - 1 mensagem WhatsApp Evolution simulada → confirma log + contact criado
  - 1 webhook Instagram DM simulado → confirma cross-channel merge se mesmo telefone
  - 1 webhook Messenger simulado → idem
  - 1 webhook comentário FB/IG com keyword PROTOCOLO → confirma reply + DM
- Saída JSON em `/mnt/documents/brisa-smoke-report.json` com latência, status, persona-check
- Logs via `supabase--edge_function_logs` filtrados pelos 4 functions

---

## 📋 Detalhes técnicos (consolidado)

**Edge functions afetadas/criadas:**
- ✅ existentes: `whatsapp-brisa-bot`, `meta-messenger-bot`, `brisa-whatsapp`, `whatsapp-chatbot` (atualizar para usar memória unificada)
- 🆕 `meta-comment-to-dm`

**Migrations:** 1 só, atômica — tabelas + funções + RLS + backfill.

**Frontend:** 1 página nova (`src/pages/admin/BrisaCEO.tsx`) + 1 hook (`src/hooks/useBrisaConversations.ts`) + 1 component (`BrisaConversationDrawer.tsx`). Usa tokens de design existentes — zero mudança visual fora dessa rota nova.

**Segurança:** RLS restritiva em todas tabelas novas (admin-only), HMAC nos webhooks Meta, rate-limit por author_id, dedup por comment_id/message_id.

**Memória do projeto:** atualizo `mem://architecture/brisa-omnichannel-360` no final.

---

## ⏱ Ordem real de execução (sem pausas)

1. Migration P1 (memória) → aprovação
2. `_shared/brisa-memory.ts` + atualizar 4 bots existentes
3. Edge `meta-comment-to-dm` + deploy
4. Página `/admin/brisa-ceo` + hook + drawer
5. Script smoke test + rodar + relatório
6. Atualizar memória do projeto
7. Sugerir publish

**Único bloqueio possível:** aprovação da migration P1 (precisa do seu clique). Resto roda direto.

Confirmo execução?