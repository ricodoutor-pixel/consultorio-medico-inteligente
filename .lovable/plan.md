# 🤖 Manus Growth CEO — Agente Autônomo de Crescimento

Plano de implementação completo, versionado em GitHub (código-fonte, não dados), auditável e com dashboard gráfico no admin.

---

## 1. Banco de dados (migrations versionadas)

Novas tabelas em `public` (todas com RLS admin-only via `has_role(auth.uid(),'admin')`):

| Tabela | Função |
|---|---|
| `manus_growth_logs` | Log imutável de cada ação do agente (fase, url, antes/depois, kpi_delta, status) |
| `manus_growth_runs` | 1 linha por execução diária (started_at, finished_at, pages_analyzed, pages_optimized, posts_generated, errors, summary_md) |
| `manus_growth_kpis` | Snapshot diário por URL (clicks, impressions, ctr, position, conv_rate) — série histórica para os gráficos |
| `manus_growth_proposals` | Mudanças pendentes que tocam código estrutural → vira **GitHub Issue** antes de aplicar |
| `manus_seo_overrides` | Patches de metadata/H1/H2/Schema.org por rota (consumidos pelo `prerender-seo.ts`) |
| `manus_social_queue` | Roteiros gerados para IG/FB/YT/TikTok (status: draft/approved/posted) |

Trigger imutabilidade em `manus_growth_logs` (sem UPDATE/DELETE para não-admin).

---

## 2. Edge Function orquestradora

**`supabase/functions/manus-growth-agent/index.ts`** — 4 fases sequenciais:

```text
┌─ Fase 1: DIAGNÓSTICO ──────────────────────────┐
│ GSC API → últimos 7d de cliques/CTR/pos        │
│ Filtra páginas pos 4-15 ("quase lá")           │
│ Lê conversões internas (orientacao_tecnica)    │
│ Grava snapshot em manus_growth_kpis            │
└────────────────────────────────────────────────┘
            ↓
┌─ Fase 2: OTIMIZAÇÃO ON-PAGE ───────────────────┐
│ Gemini analisa páginas alvo                    │
│ Gera novo Meta Title/Desc/H1/H2 + Schema.org   │
│ Injeta evidência via pubmed-search (RAG)       │
│ Grava em manus_seo_overrides (consumido no     │
│ próximo build pelo scripts/prerender-seo.ts)   │
│ ⚠️ Valida disclaimer ANVISA + CRM 10963        │
└────────────────────────────────────────────────┘
            ↓
┌─ Fase 3: DISTRIBUIÇÃO ─────────────────────────┐
│ Gera roteiros IG/FB/YT/TikTok → social_queue   │
│ Envia insights p/ brisa-ceo-orchestrator       │
│ (dores top-pesquisadas viram script da Brisa)  │
└────────────────────────────────────────────────┘
            ↓
┌─ Fase 4: AUTO-AUDITORIA ───────────────────────┐
│ Resumo markdown + métricas → manus_growth_runs │
│ WhatsApp p/ Dr. Edilson (5511987131241)        │
└────────────────────────────────────────────────┘
```

**Stack:**
- IA: Lovable AI Gateway → `google/gemini-2.5-pro` (raciocínio analítico)
- GSC: connector já conectado (`GOOGLE_SEARCH_CONSOLE_API_KEY` + `LOVABLE_API_KEY`)
- WhatsApp: `evolution-api-proxy` existente
- Auth: `requireServiceAuth` (cron only)

---

## 3. Guardrails inegociáveis

| Regra | Implementação |
|---|---|
| Não tocar código estrutural | Whitelist: só pode escrever em `manus_seo_overrides` e `manus_social_queue`. Qualquer outra mudança → `manus_growth_proposals` + GitHub Issue via `GITHUB_BACKUP_TOKEN` |
| Preservar disclaimer ANVISA | Regex obrigatório no output: `RDC 660` ∧ `CRM 10963` ∧ `Dr. Edilson` |
| Moeda BRL | Forçado em todo Schema.org gerado |
| Rate-limit IA | Máx 30 páginas/dia para não estourar créditos |

---

## 4. Cron diário (pg_cron)

```sql
select cron.schedule(
  'manus-growth-daily',
  '0 9 * * *',  -- 06h BRT
  $$ select net.http_post(
       url:='https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/manus-growth-agent',
       headers:=jsonb_build_object('Authorization','Bearer '||current_setting('app.service_role_key'))
     ) $$
);
```

---

## 5. Dashboard admin (gráfico em tempo real)

**Rota nova:** `/admin/growth` → `src/pages/admin/GrowthDashboard.tsx`

Componentes:
- **KPI cards**: posição média (7d/30d), CTR delta, páginas otimizadas hoje
- **Gráfico Recharts**: série temporal de clicks/impressions/position por URL top-10
- **Tabela `manus_growth_logs`**: últimas 50 ações (fase, página, kpi_delta, status)
- **Tabela `manus_social_queue`**: posts pendentes de aprovação
- **Botão "Executar agora"** (admin only) → invoca edge function manualmente
- **Relatório semanal**: agregação automática segunda-feira 8h → PDF salvo em `master-reports` bucket

Link no menu admin existente (`AdminDashboard.tsx`).

---

## 6. Versionamento GitHub (auditoria permanente)

Tudo nasce como código-fonte em:
```
supabase/functions/manus-growth-agent/
  ├── index.ts            (orquestrador)
  ├── phases/
  │   ├── diagnose.ts
  │   ├── optimize.ts
  │   ├── distribute.ts
  │   └── audit.ts
  ├── guardrails.ts
  └── github-issue.ts     (propostas de mudança estrutural)

supabase/migrations/<ts>_manus_growth_ceo.sql
src/pages/admin/GrowthDashboard.tsx
scripts/prerender-seo.ts (patch: consome manus_seo_overrides)
```

Commit automático no repo `ricodoutor-pixel/consultorio-medico-inteligente` via webhook Lovable → Hostinger sync.

---

## 7. Ordem de execução

1. **Migration** (tabelas + RLS + cron) — `supabase--migration`
2. **Edge function** `manus-growth-agent` (4 fases + guardrails) — deploy automático
3. **Patch** `scripts/prerender-seo.ts` para ler `manus_seo_overrides`
4. **Dashboard** `/admin/growth` com Recharts
5. **Link** no AdminDashboard
6. **Smoke test**: invocar manualmente e validar log + WhatsApp recebido

---

## 8. KPIs alvo (90 dias)

| Métrica | Baseline | Meta |
|---|---|---|
| Posição média GSC | ~12 | < 5 |
| CTR médio | ~2% | > 6% |
| Páginas em top-3 | 0 | 15+ |
| Tráfego orgânico/mês | — | +300% |

---

**Aprova para executar?** Vou começar pela migration (passo 1) assim que confirmar.