# Plano — Atualizações Críticas Planta y Raiz (Fase de Testes)

Antes de executar preciso confirmar 2 pontos bloqueantes (ver fim). O restante segue abaixo.

## 1. Admin Dashboard — Drill-down de Dados

**Tiles clicáveis em `src/pages/admin/*` e `GestaoPacientes`:**
- Criar componente reutilizável `AdminDrilldownModal.tsx` (lista + busca + export CSV).
- Cada card (Pacientes / Médicos / Lojistas / Produtores / Novos Cadastros) vira `<button>` que abre modal com query Supabase:
  - Pacientes → `profiles` join `auth.users` (nome, email, telefone, cidade/estado/país, criado_em).
  - Médicos → `doctors` + `profiles`.
  - Lojistas → `vendors`.
  - Produtores → flag em `profiles.role` ou tabela dedicada (verificar).
- Usar paginação 50/pág + filtros básicos.
- RLS: somente `has_role(admin)`.

## 2. Aba "Global Operations" — Mapa Mundial

- Nova tab em `OmniChannelDashboard` (ou `AdminBI`): `GlobalOperationsMap.tsx`.
- Google Maps JS API via `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` (connector já listado).
- **Pré-requisito:** conectar o connector `google_maps` (vou disparar `standard_connectors--connect`).
- Migration: adicionar `latitude numeric`, `longitude numeric`, `country text`, `region text`, `city text`, `geo_updated_at timestamptz` em `profiles` (se ainda não existir — verificar).
- Marcadores verdes para pacientes com `lat/lng`. Click → popup com nome + última localização + botão "Ver Prontuário".
- Realtime: subscribe em `profiles` para atualizar marcadores.

## 3. Google Auth por Categoria (Remover Login Universal)

- Cada página de cadastro (`/cadastro` paciente, `/cadastro-profissional` médico/cuidador, `/vendor-signup` lojista, `/produtor-signup` produtor) terá botão **"Entrar com Google"** próprio.
- Após OAuth callback, gravar `profiles.role` com a categoria de origem (passada via `extraParams.state` ou localStorage `pending_signup_role`).
- Redirecionar para painel da categoria:
  - paciente → `/dashboard`
  - médico/cuidador → `/consultorio`
  - lojista → `/admin/vendor`
  - produtor → `/admin/producer`
- Usar `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth/callback?role=<x>" })`.
- Página `/auth/callback` aplica role e redireciona.

## 4. Captura Granular de Geolocalização

- No primeiro login após aceitar Termos (`ConsentManager`), chamar `navigator.geolocation.getCurrentPosition`.
- Reverse-geocoding via gateway Google Maps (`/maps/api/geocode/json?latlng=...`) numa edge function `capture-user-location` (não expõe key).
- Persistir em `profiles` (lat, lng, country, region, city, geo_updated_at).
- Adicionar texto LGPD explícito no `ConsentManager` cobrindo: geolocalização contínua + dados de saúde (wearables futuros).

## 5. Protocolo de Emergência

- Botão "🚨 Emergência" no perfil paciente (admin/médico): exibe última localização + link `https://maps.google.com/?q=lat,lng` + WhatsApp do paciente.
- Edge function `emergency-ping` força refresh da localização (envia push pedindo permissão).

## 6. Splash Cleanup

- Remover `CustomLoader` (verdinho fundo escuro) do `main.tsx`/`App.tsx`.
- Manter apenas `WelcomeMascotSplash` (verdinho flutuante) OU o ícone flutuante global — confirmar com pergunta abaixo.

## 7. Brisa Autônoma (WhatsApp + Gemini via Lovable AI)

- A arquitetura já existe (edge `whatsapp-brisa-bot` com `google/gemini-2.5-flash`, fallback do Evolution+n8n na Oracle).
- Auditoria + garantia de:
  - `LOVABLE_API_KEY` presente (auto-provisioning se faltar).
  - Edge `whatsapp-brisa-bot` ativa, com retry e logging em `whatsapp_brisa_log`.
  - 12 agentes do `agent_registry` com `is_active=true` (UPDATE em massa).
- Sem mudar visual, apenas backend.

## 8. Estabilidade do Cadastro

- Já corrigido na rodada anterior (HIBP messages). Adicionar:
  - Try/catch robusto em todos OAuth callbacks.
  - Log de erro em `error_logs` para diagnóstico.

---

## Detalhes Técnicos

**Migrations necessárias:**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS geo_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS signup_role text;
```

**Connectors:** `google_maps` (browser key + gateway para geocoding server-side).

**Arquivos novos principais:**
- `src/components/admin/AdminDrilldownModal.tsx`
- `src/components/admin/GlobalOperationsMap.tsx`
- `src/pages/AuthCallback.tsx`
- `src/lib/geolocation-capture.ts`
- `supabase/functions/capture-user-location/index.ts`
- `supabase/functions/emergency-ping/index.ts`

**Arquivos editados:**
- `src/main.tsx` (remover CustomLoader)
- `src/pages/Cadastro.tsx`, `CadastroProfissional.tsx`, `VendorSignup`, `ProdutorSignup` (botão Google por categoria)
- `src/pages/OmniChannelDashboard.tsx` + `AdminBI.tsx` (drill-down + Global Ops tab)
- `src/components/ConsentManager.tsx` (texto LGPD + trigger geo)
- `src/App.tsx` (rota `/auth/callback`)

---

## ⚠️ Confirmações antes de executar

1. **Splash:** remover **CustomLoader** (verde escuro inicial) e manter **WelcomeMascotSplash** (verdinho flutuante na 1ª visita) — correto?
2. **Google Maps:** preciso ativar o connector `google_maps` (vai abrir diálogo para você autorizar). Confirma?
3. **Produtor signup:** existe página dedicada hoje ou crio nova `/cadastro-produtor`?

Se responder "ok tudo" eu assumo: (1) sim, (2) sim, (3) crio nova. Executo na sequência: connector → migration → componentes admin → auth por categoria → mapa → emergência → Brisa audit → splash → testes.
