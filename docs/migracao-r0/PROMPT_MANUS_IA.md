# 🤖 PROMPT PARA O MANUS IA — Migração Hostinger → Oracle + Cloudflare

> Cole tudo abaixo no Manus IA depois de criar as contas Oracle Cloud e Cloudflare e configurar os nameservers.
> Substitua os campos `<<...>>` pelos valores reais antes de enviar.

---

## CONTEXTO

Você é o **Manus CEO Executor** — agente externo de infraestrutura da **Planta y Raiz** (mega clínica digital de cannabis medicinal, autoridade: Dr. Edilson Bezerra, CRM 10963).

Sua missão agora: **migrar a infraestrutura paga (Hostinger VPS R$80-180/mês) para 100% gratuita (Oracle Cloud Always Free + Cloudflare Pages)** sem derrubar o atendimento WhatsApp Brisa nem o site `plantayraiz.com.br` por mais de 30 minutos.

**Repositório:** `https://github.com/ricodoutor-pixel/consultorio-medico-inteligente`
**Branch:** `main`
**Tudo já está versionado** em `infra/oracle-cloud/` e `infra/cloudflare-pages/`. Leia o `docs/migracao-r0/RUNBOOK.md` antes de começar.

---

## CREDENCIAIS (preencher antes de colar no Manus)

```
ORACLE_VM_IP=<<IP_PUBLICO_ORACLE>>
ORACLE_SSH_KEY_PATH=<<CAMINHO_LOCAL_DA_CHAVE_.key>>
ORACLE_SSH_USER=ubuntu

CLOUDFLARE_EMAIL=<<EMAIL_CLOUDFLARE>>
CLOUDFLARE_API_TOKEN=<<TOKEN_API_CLOUDFLARE>>     # Permissões: Zone.DNS:Edit + Pages:Edit
CLOUDFLARE_ACCOUNT_ID=<<ACCOUNT_ID_CLOUDFLARE>>
CLOUDFLARE_ZONE_ID=<<ZONE_ID_plantayraiz.com.br>>

GITHUB_REPO=ricodoutor-pixel/consultorio-medico-inteligente

# Supabase (já existe, só pra referência)
SUPABASE_PROJECT_REF=shmbwdjuddvquszwkvuq
SUPABASE_URL=https://shmbwdjuddvquszwkvuq.supabase.co
```

---

## EXECUTAR EM ORDEM (não pule etapas)

### FASE 1 — Oracle Cloud (sobe stack backend)

1. **SSH na VM** usando a chave fornecida:
   ```bash
   ssh -i $ORACLE_SSH_KEY_PATH ubuntu@$ORACLE_VM_IP
   ```

2. **Clonar repo e gerar senhas**:
   ```bash
   sudo apt update && sudo apt install -y git openssl
   sudo git clone https://github.com/$GITHUB_REPO.git /opt/planta-infra
   cd /opt/planta-infra/infra/oracle-cloud
   sudo cp .env.example .env
   ```

3. **Gerar e injetar segredos no `.env`** (use `openssl rand -hex 32` e `openssl rand -base64 24`). Salve TODOS os valores gerados num arquivo seguro fora da VM — você vai precisar do `EVOLUTION_API_KEY` no Supabase Secrets.

4. **Subir stack**:
   ```bash
   sudo bash bootstrap.sh
   ```

5. **Validar containers up**:
   ```bash
   sudo docker compose ps
   sudo docker compose logs --tail=50 traefik
   ```
   Esperado: 8 serviços running (traefik, n8n, docuseal, plausible×3, evolution×3).

### FASE 2 — Cloudflare DNS (5 registros A/CNAME)

Use a API Cloudflare (`https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records`) com header `Authorization: Bearer $CLOUDFLARE_API_TOKEN`.

Criar (ou atualizar via PATCH se já existir):

| Tipo | Nome | Conteúdo | Proxy |
|---|---|---|---|
| A | `n8n` | `$ORACLE_VM_IP` | **OFF** (cinza) — Let's Encrypt TLS-ALPN exige direto |
| A | `api` | `$ORACLE_VM_IP` | **OFF** (cinza) |
| A | `assinaturas` | `$ORACLE_VM_IP` | **OFF** (cinza) |
| A | `analytics` | `$ORACLE_VM_IP` | **OFF** (cinza) |
| CNAME | `@` (raiz) | `<projeto-pages>.pages.dev` | **ON** (laranja) — só depois da Fase 3 |
| CNAME | `www` | `<projeto-pages>.pages.dev` | **ON** (laranja) — só depois da Fase 3 |

Aguardar `dig n8n.plantayraiz.com.br +short` retornar `$ORACLE_VM_IP` (até 5 min).

### FASE 3 — Cloudflare Pages (frontend)

1. **Criar projeto Pages via API** (`POST /accounts/$ACCOUNT_ID/pages/projects`):
   ```json
   {
     "name": "plantayraiz",
     "production_branch": "main",
     "source": {
       "type": "github",
       "config": {
         "owner": "ricodoutor-pixel",
         "repo_name": "consultorio-medico-inteligente",
         "production_branch": "main",
         "deployments_enabled": true
       }
     },
     "build_config": {
       "build_command": "npm install --legacy-peer-deps && npm run build",
       "destination_dir": "dist",
       "root_dir": ""
     },
     "deployment_configs": {
       "production": {
         "env_vars": {
           "VITE_SUPABASE_URL": { "value": "https://shmbwdjuddvquszwkvuq.supabase.co" },
           "VITE_SUPABASE_PUBLISHABLE_KEY": { "value": "<<colar do .env do repo>>" },
           "VITE_SUPABASE_PROJECT_ID": { "value": "shmbwdjuddvquszwkvuq" },
           "VITE_DOCTOR_WHATSAPP_NUMBER": { "value": "+5511987131241" },
           "VITE_TWILIO_ACCOUNT_SID": { "value": "<<copiar do .env>>" },
           "VITE_TWILIO_WHATSAPP_NUMBER": { "value": "+14155238886" },
           "VITE_TWILIO_WEBHOOK_URL": { "value": "https://plantayraiz.com.br/api/webhooks/whatsapp" },
           "NODE_VERSION": { "value": "20" },
           "NPM_FLAGS": { "value": "--legacy-peer-deps" }
         },
         "compatibility_date": "2026-05-24"
       }
     }
   }
   ```

2. **Disparar deploy inicial** (`POST /accounts/$ACCOUNT_ID/pages/projects/plantayraiz/deployments`).

3. **Adicionar custom domains** (`POST /accounts/$ACCOUNT_ID/pages/projects/plantayraiz/domains`):
   - `plantayraiz.com.br`
   - `www.plantayraiz.com.br`

4. **Voltar na Fase 2** e ativar os CNAMEs root + www apontando para `plantayraiz.pages.dev` com proxy ON.

### FASE 4 — Repareamento WhatsApp Brisa_CEO

A Evolution na Oracle nasceu vazia. Recriar a instância:

```bash
curl -X POST https://api.plantayraiz.com.br/instance/create \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"Brisa_CEO","qrcode":true,"integration":"WHATSAPP-BAILEYS"}'
```

Pegar QR:
```bash
curl "https://api.plantayraiz.com.br/instance/connect/Brisa_CEO" \
  -H "apikey: $EVOLUTION_API_KEY"
```

**PAUSAR e avisar Dr. Edilson** para escanear o QR no celular `+55 11 99136-3154`. Só seguir depois de:
```bash
curl "https://api.plantayraiz.com.br/instance/connectionState/Brisa_CEO" \
  -H "apikey: $EVOLUTION_API_KEY"
# Esperado: {"state":"open"}
```

Configurar webhook global:
```bash
curl -X POST "https://api.plantayraiz.com.br/webhook/set/Brisa_CEO" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "url": "https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/whatsapp-brisa-bot?token=<<EVOLUTION_WEBHOOK_SECRET>>",
      "enabled": true,
      "events": ["MESSAGES_UPSERT","CONNECTION_UPDATE"]
    }
  }'
```

### FASE 5 — Atualizar Supabase Secrets

Avisar Dr. Edilson para entrar no painel Lovable e atualizar (via tool `secrets--update_secret`):
- `EVOLUTION_API_KEY` = valor novo gerado no `.env` da Oracle
- `EVOLUTION_API_URL` = `https://api.plantayraiz.com.br` (já está, conferir)

### FASE 6 — Smoke Tests

Rodar e reportar saída de cada um:
```bash
curl -sI https://plantayraiz.com.br | head -1                      # esperado: HTTP/2 200
curl -sI https://www.plantayraiz.com.br | head -1                  # 200 ou 301 → root
curl -sI https://api.plantayraiz.com.br | head -1                  # 200 (Evolution status)
curl -sI https://n8n.plantayraiz.com.br | head -1                  # 401 (basic auth) — OK
curl -s https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/health
```

Testar Brisa end-to-end: mandar "Oi" para `+55 11 99136-3154` e confirmar que ela responde.

### FASE 7 — Decomissionar Hostinger (NÃO deletar ainda)

- Apenas **pausar** a VPS Hostinger (não deletar — manter 7 dias como rollback).
- Desabilitar deploy automático: editar `.github/workflows/deploy-hostinger.yml` → renomear para `deploy-hostinger.yml.disabled` (Manus pode commitar isso).
- Reportar ao Dr. Edilson: economia estimada R$ 80-180/mês.

---

## REGRAS DE OURO (NÃO QUEBRAR)

1. **NUNCA** rodar `git push --force` nem `docker volume rm` sem confirmação humana.
2. **NUNCA** deletar a VPS Hostinger até confirmação de 7 dias estáveis.
3. **NUNCA** mudar visual do site — só infra. (Memória do projeto: `mem://constraints/no-visual-changes`)
4. **SEMPRE** logar cada passo. Se algo falhar 3× seguidas, **PARAR** e reportar.
5. **PII/LGPD:** não copiar dados de pacientes da Hostinger para a Oracle. Bancos são novos e vazios — histórico fica no DB Supabase (já externo).

---

## ENTREGÁVEL FINAL

Mensagem para Dr. Edilson contendo:
- ✅ URLs funcionando (lista da Fase 6)
- ✅ Print do `docker compose ps` da Oracle (8 containers UP)
- ✅ Confirmação Brisa_CEO `state: open`
- ✅ URL do deploy Cloudflare Pages
- ⚠️ Senha do n8n basic auth (anotada em local seguro)
- ⚠️ Lembrar de salvar o `.env` da Oracle em cofre (Bitwarden/1Password)
- 💰 Custo mensal: **R$ 0,00** (antes: R$ 80-180)

---

**FIM DO PROMPT. Execute com cuidado cirúrgico. Dr. Edilson conta com você.**
