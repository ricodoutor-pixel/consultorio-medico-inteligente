# 🤖 PROMPT PARA MANUS IA — Migração Hostinger → Oracle Cloud + Cloudflare
# Versão: 2.0 (24/05/2026) — usa Terraform + GitHub Actions + Health-Check

Você é o **Manus IA** executando a migração técnica da plataforma **Planta y Raiz** (plantayraiz.com.br) de Hostinger VPS para arquitetura grátis (Oracle Cloud ARM + Cloudflare Pages). O usuário (Dr. Edilson) já criou as contas. Sua missão: executar 100% sem intervenção.

---

## 🔑 CREDENCIAIS QUE O USUÁRIO VAI TE FORNECER

```
ORACLE_TENANCY_OCID=<preencher>
ORACLE_COMPARTMENT_OCID=<preencher>
ORACLE_REGION=sa-saopaulo-1
ORACLE_AVAILABILITY_DOMAIN=<preencher>          # Ex: Uocm:SA-SAOPAULO-1-AD-1
ORACLE_SSH_PRIVATE_KEY=<conteúdo ~/.ssh/id_ed25519>
ORACLE_SSH_PUBLIC_KEY=<conteúdo ~/.ssh/id_ed25519.pub>
ORACLE_CONFIG=<conteúdo ~/.oci/config>

CLOUDFLARE_API_TOKEN=<token com Pages:Edit + Zone:DNS:Edit>
CLOUDFLARE_ACCOUNT_ID=<32 chars>
CLOUDFLARE_ZONE_ID=<32 chars para plantayraiz.com.br>

GITHUB_TOKEN=<PAT com repo + workflow>
GITHUB_REPO=ricodoutor-pixel/consultorio-medico-inteligente

REGISTRO_BR_USER=<CPF Dr. Edilson>
REGISTRO_BR_PASS=<senha>                        # OU usuário já trocou NS manualmente

SUPABASE_PROJECT_REF=shmbwdjuddvquszwkvuq
SUPABASE_ACCESS_TOKEN=<service role para CLI>
```

---

## 📋 EXECUÇÃO — 7 FASES

### FASE 1 — Provisionar VM Oracle ARM via Terraform
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Preencher com as credenciais Oracle acima
terraform init
terraform apply -auto-approve
PUBLIC_IP=$(terraform output -raw public_ip)
echo "VM criada em $PUBLIC_IP"
```

### FASE 2 — Bootstrap da stack Docker na VM
```bash
ssh -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP \
  "sudo bash -c 'curl -fsSL https://raw.githubusercontent.com/ricodoutor-pixel/consultorio-medico-inteligente/main/infra/oracle-cloud/bootstrap.sh | bash'"

# Editar /opt/planta-infra/infra/oracle-cloud/.env via SCP com senhas geradas:
#   openssl rand -hex 32      → N8N_ENCRYPTION_KEY, PLAUSIBLE_SECRET_KEY_BASE
#   openssl rand -base64 24   → senhas DB
#   openssl rand -hex 24      → EVOLUTION_API_KEY
# Re-rodar: docker compose up -d
```

### FASE 3 — DNS Cloudflare (via API)
Para cada subdomínio (n8n, api, assinaturas, analytics), criar registro A apontando para `$PUBLIC_IP` com **proxy DESLIGADO (cinza)** — Traefik gerencia SSL via Let's Encrypt direto:

```bash
for SUB in n8n api assinaturas analytics; do
  curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"A\",\"name\":\"$SUB\",\"content\":\"$PUBLIC_IP\",\"ttl\":300,\"proxied\":false}"
done
```

### FASE 4 — Configurar Cloudflare Pages
```bash
# Criar projeto Pages conectado ao repo GitHub
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"plantayraiz","production_branch":"main","build_config":{"build_command":"bun install && bun run build","destination_dir":"dist"}}'

# Adicionar GitHub Secrets para CI:
# CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, VITE_SUPABASE_URL,
# VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID, VITE_DOCTOR_WHATSAPP_NUMBER
gh secret set CLOUDFLARE_API_TOKEN -b"$CLOUDFLARE_API_TOKEN" -R $GITHUB_REPO
# (repetir para os outros)

# Trigger primeiro deploy (workflow .github/workflows/deploy-cloudflare-pages.yml já existe)
gh workflow run deploy-cloudflare-pages.yml -R $GITHUB_REPO
```

Adicionar domínio custom em Pages:
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/plantayraiz/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data '{"name":"plantayraiz.com.br"}'
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/plantayraiz/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data '{"name":"www.plantayraiz.com.br"}'
```

### FASE 5 — DNS root + www (Cloudflare Pages)
```bash
# Cloudflare Pages exige CNAME apontando para plantayraiz.pages.dev (proxy LIGADO/laranja)
for REC in "@" "www"; do
  curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    --data "{\"type\":\"CNAME\",\"name\":\"$REC\",\"content\":\"plantayraiz.pages.dev\",\"ttl\":1,\"proxied\":true}"
done
```

### FASE 6 — Re-parear WhatsApp Brisa_CEO na nova Evolution API
1. Acessar `https://api.plantayraiz.com.br/manager` com `EVOLUTION_API_KEY`.
2. Criar instance `Brisa_CEO`.
3. Pegar QR Code via endpoint `/instance/connect/Brisa_CEO`.
4. **PEDIR AO Dr. EDILSON** escanear no WhatsApp (+55 11 99136-3154).
5. Configurar webhook:
```bash
curl -X POST "https://api.plantayraiz.com.br/webhook/set/Brisa_CEO" \
  -H "apikey: $EVOLUTION_API_KEY" \
  --data "{\"url\":\"https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/whatsapp-brisa-bot?token=$EVOLUTION_WEBHOOK_SECRET\",\"events\":[\"MESSAGES_UPSERT\"]}"
```

### FASE 7 — Atualizar Supabase Secrets + Validação
```bash
# Atualizar secrets que apontavam para Hostinger
supabase secrets set --project-ref $SUPABASE_PROJECT_REF \
  EVOLUTION_API_URL=https://api.plantayraiz.com.br \
  EVOLUTION_API_KEY=$EVOLUTION_API_KEY \
  N8N_WEBHOOK_BASE=https://n8n.plantayraiz.com.br

# RODAR HEALTH-CHECK FINAL
bash infra/validation/health-check.sh --vm-ip $PUBLIC_IP
# Esperar: 0 FAIL. Se houver, reportar ao Dr. Edilson com logs.
```

---

## ⚠️ REGRAS INVIOLÁVEIS

1. **NÃO** desligar o Hostinger antes do health-check passar com 0 FAIL.
2. **NÃO** trocar nameservers no Registro.br sem confirmar com Dr. Edilson (offline 2-24h).
3. **NÃO** alterar visual do frontend (`mem://constraints/no-visual-changes`).
4. **NÃO** rodar migrations Supabase nesta fase — só infra.
5. Webhooks Mercado Pago, ManyChat, Twilio **continuam apontando para Supabase Edge Functions** — não mover.
6. Se qualquer comando falhar 2x, **PARAR** e gerar relatório com stack trace para Dr. Edilson.

---

## ✅ ENTREGÁVEL FINAL

Relatório markdown com:
- IP público da VM Oracle
- URLs ativas (n8n, api, assinaturas, analytics)
- Status do QR WhatsApp (conectado/pendente)
- Output do `health-check.sh`
- Próximo passo para desligar Hostinger
