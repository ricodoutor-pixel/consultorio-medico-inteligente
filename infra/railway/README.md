# 🚂 Railway — Evolution API (Brisa WhatsApp Bot)

Deploy soberano da Evolution API no Railway. Custo: **~US$5/mês** (cobertos pelos US$5 de crédito de trial nos primeiros meses; depois plano Hobby US$5).

Por que Railway e não Render Free:
- Render Free **hiberna após 15 min** → o bot perde sessão Baileys e precisa re-scan do QR. Inaceitável.
- Railway **nunca hiberna** + deploy Docker direto + Postgres/Redis como add-on 1-clique.

---

## 📋 Passo a passo (humano — 10 min)

### 1. Criar conta Railway
1. Entre em https://railway.com/login → **Login with GitHub** (use a mesma conta `ricodoutor-pixel`).
2. Os US$5 de crédito de trial são liberados automaticamente.

### 2. Criar projeto a partir do repo
1. Dashboard → **New Project** → **Deploy from GitHub repo**.
2. Selecione `ricodoutor-pixel/consultorio-medico-inteligente`.
3. Quando perguntar o **Root Directory**, digite: `infra/railway`
4. Railway detecta o `Dockerfile` automaticamente.

### 3. Adicionar Postgres e Redis (1-clique)
No mesmo projeto:
1. **+ New** → **Database** → **Add PostgreSQL**.
2. **+ New** → **Database** → **Add Redis**.

### 4. Configurar variáveis da Evolution
No serviço `evolution` (que vem do Dockerfile), aba **Variables**, cole:

```
SERVER_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
AUTHENTICATION_API_KEY=<gere com: openssl rand -hex 32>
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
DATABASE_ENABLED=true
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=${{Redis.REDIS_URL}}
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_LOCAL_ENABLED=false
LANGUAGE=pt-BR
CONFIG_SESSION_PHONE_CLIENT=Planta y Raiz
CONFIG_SESSION_PHONE_NAME=Chrome
CONFIG_SESSION_PHONE_VERSION=2.3000.1015901307
QRCODE_LIMIT=30
QRCODE_COLOR=#1B4332
DEL_INSTANCE=false
DEL_TEMP_INSTANCES=true
LOG_LEVEL=ERROR,WARN,INFO
LOG_COLOR=true
LOG_BAILEYS=error
WEBHOOK_GLOBAL_URL=https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/whatsapp-brisa-bot?token=<EVOLUTION_WEBHOOK_SECRET>
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
```

> Substitua `<EVOLUTION_WEBHOOK_SECRET>` pelo valor já salvo no Supabase Vault (mesma chave que valida o webhook).

### 5. Gerar domínio público
Serviço `evolution` → aba **Settings** → **Networking** → **Generate Domain**.
Anote a URL (ex: `evolution-production-xxxx.up.railway.app`).

### 6. Volume persistente (sessão WhatsApp)
Serviço `evolution` → **Settings** → **Volumes** → **+ New Volume**:
- Mount path: `/evolution/instances`
- Size: 1 GB

Sem isso o QR re-aparece a cada redeploy.

### 7. Apontar Brisa CEO pro novo endpoint
**Me avise quando o passo 5 estiver pronto** — eu atualizo os secrets `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` no Supabase pra apontar pra Railway. Depois disso o bot volta a operar 100%.

### 8. (Opcional) Subdomínio próprio
Em **Settings → Networking → Custom Domain** adicione `api.plantayraiz.com.br` e cole o CNAME no Cloudflare (DNS-only, sem proxy).

---

## ✅ Checklist final
- [ ] Projeto Railway criado a partir do repo
- [ ] Postgres + Redis adicionados
- [ ] Variáveis coladas no serviço `evolution`
- [ ] Volume `/evolution/instances` criado
- [ ] Domínio público gerado
- [ ] Você me mandou a URL pra eu atualizar os secrets do Supabase
- [ ] Scan do QR pelo WhatsApp do Dr. Edilson (uma vez só)

Tempo total: **~10 min** depois que o repo conectar.
