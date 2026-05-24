# 🚀 Migração R$0/mês — Hostinger VPS → Oracle Cloud + Cloudflare Pages

> **Status:** Tudo preparado no repo. Aguardando criação das contas + DNS pronto.
> **Risco:** Médio (DNS + repareamento do WhatsApp Brisa_CEO).
> **Janela recomendada:** Madrugada (00h-05h), pois subdomínios saem do ar 2-24h durante propagação de nameservers.
> **Sem rollback automático** depois que o WhatsApp for repareado — exige escanear QR de novo.

---

## 📦 O que já está pronto no repo

| Arquivo | Propósito |
|---|---|
| `infra/oracle-cloud/docker-compose.yml` | Stack completa ARM64 (Traefik + n8n + DocuSeal + Plausible + Evolution) |
| `infra/oracle-cloud/.env.example` | Template de senhas |
| `infra/oracle-cloud/bootstrap.sh` | Setup automático da VM (Docker + iptables + clone + up) |
| `infra/cloudflare-pages/wrangler.toml` | Build config do Pages |
| `infra/cloudflare-pages/ENV_VARS.example` | Lista de variáveis VITE_* para colar no Pages |
| `public/_redirects` | SPA fallback (rotas client-side → index.html) |

---

## ✅ Checklist do Dr. Edilson (FAZER ANTES do Manus IA agir)

### 1. Oracle Cloud Always Free
- [ ] Criar conta em `https://cloud.oracle.com/free` (cartão de crédito — **não cobra**)
- [ ] Aguardar aprovação (24-72h)
- [ ] Compute → Instances → **Create Instance**:
  - Shape: `VM.Standard.A1.Flex` · **4 OCPUs · 24 GB RAM**
  - Image: **Ubuntu 22.04 (Aarch64/ARM64)**
  - Boot volume: 200 GB
  - SSH: subir chave pública (ou gerar par no navegador e baixar `.key`)
- [ ] Networking → **Reserved Public IPs** → reservar 1 IP e anexar à VM
- [ ] Networking → VCN → Security List → **Ingress Rules**: liberar `0.0.0.0/0` TCP portas **80** e **443**
- [ ] Anotar: **IP público** + caminho da chave SSH `.key`

### 2. Cloudflare (DNS + Pages)
- [ ] Criar conta gratuita em `https://cloudflare.com`
- [ ] Add site → `plantayraiz.com.br` (plano Free)
- [ ] Cloudflare mostra **2 nameservers** (ex: `xxx.ns.cloudflare.com`)
- [ ] No registrar atual (Hostinger/Registro.br) → trocar nameservers para os da Cloudflare
- [ ] Aguardar propagação (`dig NS plantayraiz.com.br` mostrar Cloudflare — pode levar 2-24h)
- [ ] Conectar GitHub em **Pages** (autorizar app)

### 3. Comunicar ao Manus IA
- [ ] Quando 1 + 2 prontos, copiar o prompt em `docs/migracao-r0/PROMPT_MANUS_IA.md` e colar no Manus, preenchendo:
  - `IP_PUBLICO_ORACLE`
  - `CAMINHO_CHAVE_SSH`
  - `EMAIL_CLOUDFLARE`
  - `API_TOKEN_CLOUDFLARE` (criar em My Profile → API Tokens → "Edit Cloudflare Workers" template)
  - `ACCOUNT_ID_CLOUDFLARE` (dashboard direito)

---

## 🤖 O que o Manus IA vai fazer (parte difícil/técnica)

1. **SSH na Oracle VM** → rodar `bootstrap.sh` → subir stack Docker
2. **Configurar DNS Cloudflare** (via API) → 4 registros A apontando para IP Oracle:
   - `n8n.plantayraiz.com.br` → IP (proxy CINZA/desligado — Let's Encrypt precisa direto)
   - `api.plantayraiz.com.br` → IP (proxy cinza)
   - `assinaturas.plantayraiz.com.br` → IP (proxy cinza)
   - `analytics.plantayraiz.com.br` → IP (proxy cinza)
   - `plantayraiz.com.br` + `www` → CNAME para `<projeto>.pages.dev` (proxy LARANJA/ligado)
3. **Aguardar Let's Encrypt** emitir SSL nos 4 subdomínios (~5min)
4. **Deploy Cloudflare Pages** (via Wrangler CLI ou Git integration) → build do frontend
5. **Colar VITE_*** no painel Pages (lista pronta em `ENV_VARS.example`)
6. **Repareamento WhatsApp Brisa_CEO** — Evolution na Oracle terá DB vazio:
   - `POST /instance/create` com nome `Brisa_CEO`
   - Pegar QR via `GET /instance/connect/Brisa_CEO`
   - Dr. Edilson escaneia no celular do número `+55 11 99136-3154`
7. **Atualizar Supabase Secrets** (via Lovable):
   - `EVOLUTION_API_URL=https://api.plantayraiz.com.br` (já está)
   - `EVOLUTION_API_KEY=<nova_key_gerada_no_.env>`
8. **Smoke test**:
   - `curl https://plantayraiz.com.br` → 200
   - `curl https://api.plantayraiz.com.br` → 200
   - Mandar mensagem teste no WhatsApp Brisa → confirmar resposta
9. **Desligar Hostinger VPS** (manter 7 dias como backup)

---

## ⏱️ Tempo estimado (após contas prontas)

| Etapa | Duração |
|---|---|
| `bootstrap.sh` na Oracle | 10-15 min |
| DNS Cloudflare (propagação subdomínios) | 5-30 min |
| Let's Encrypt SSL nos 4 subdomínios | 2-5 min |
| Build + deploy Cloudflare Pages | 5-8 min |
| Repareamento Brisa_CEO (escaneio do QR) | 2 min |
| Smoke tests | 5 min |
| **TOTAL** | **30-60 min** (sem contar propagação NS inicial) |

---

## 🚨 Pontos de atenção

- **Brisa_CEO histórico:** O DB Postgres da Evolution na Hostinger NÃO migra (chats antigos ficam só na VPS antiga). Se o histórico for crítico, fazer `pg_dump` antes e restaurar na Oracle.
- **Cron jobs n8n:** Workflows do n8n da Hostinger precisam ser exportados (`Settings → Workflows → Download all`) e importados na nova instância.
- **Plausible analytics:** Histórico de visitas fica na Hostinger. Backup via `pg_dump plausible_db` se quiser preservar.
- **Anti-clone:** O script `src/lib/anti-clone.ts` valida `window.location.hostname === 'plantayraiz.com.br'` — vai funcionar normal no Cloudflare Pages (mesmo domínio).
- **Service Worker:** O SW antigo vai cachear o domínio. O `main.tsx` já tem `clearRuntimeCaches()` que mata o SW automaticamente quando detecta chunk falho.
