# Runbook: Migração VPS Hostinger → Oracle Cloud Always Free

**Custo final:** R$ 0,00/mês (Oracle Always Free é perpétuo)
**Site estático:** continua na Hospedagem Web Hostinger (não muda nada)
**O que migra:** Backend Node.js + Evolution API (Brisa WhatsApp)

---

## Pré-requisitos

Antes de começar, você precisa ter à mão:

1. **IP público da Oracle VM** (painel Oracle Cloud → Instances)
2. **Usuário SSH** (`ubuntu` em x86, `opc` em ARM Ampere)
3. **Chave SSH privada** — já salva como secret `ORACLE_VM_SSH_KEY` ✅
4. **Acesso ao Cloudflare** (DNS do `plantayraiz.com.br`)
5. **Painel Mercado Pago** (atualizar URL do webhook depois)

---

## Passo 1 — Abrir portas 80/443 no Oracle (FORA da VM)

No console Oracle Cloud → **Networking → Virtual Cloud Networks → VCN → Security Lists → Default Security List**:

Adicionar **Ingress Rules**:
- Source `0.0.0.0/0` | TCP | Destination Port `80`
- Source `0.0.0.0/0` | TCP | Destination Port `443`

Sem isso, mesmo com Nginx rodando, o tráfego não chega.

---

## Passo 2 — DNS no Cloudflare

Criar dois registros **A** apontando para o IP da Oracle VM:

| Tipo | Nome | Valor          | Proxy   |
|------|------|----------------|---------|
| A    | api  | `<IP_ORACLE>`  | **OFF** (DNS only — webhooks precisam de IP real) |
| A    | bot  | `<IP_ORACLE>`  | **OFF** |

`plantayraiz.com.br` e `www` **NÃO mexer** — continuam apontando para a Hostinger.

Aguarde 2-5 min para propagação:
```bash
dig api.plantayraiz.com.br +short
dig bot.plantayraiz.com.br +short
```

---

## Passo 3 — Bootstrap da VM (instala tudo)

Do seu computador, SSH na VM:

```bash
ssh -i ~/.ssh/oracle_vm_key ubuntu@<IP_ORACLE>
# (ou 'opc' se for ARM Ampere)
```

Dentro da VM:

```bash
curl -fsSL https://raw.githubusercontent.com/ricodoutor-pixel/consultorio-medico-inteligente/main/scripts/oracle-vm/01-bootstrap.sh \
  | sudo bash
```

Esse script instala: Node 22, PM2, Docker, Nginx, Certbot, UFW, swap 2GB, usuário `deploy`.

---

## Passo 4 — Deploy do backend

```bash
sudo -u deploy bash -c '
  curl -fsSL https://raw.githubusercontent.com/ricodoutor-pixel/consultorio-medico-inteligente/main/scripts/oracle-vm/02-deploy-backend.sh | bash
'
```

Depois edite `/home/deploy/plantayraiz/.env` preenchendo as chaves marcadas `__PREENCHER__` (pegue dos secrets da Lovable Cloud).

Reinicie:
```bash
sudo -u deploy pm2 restart plantayraiz-api
sudo -u deploy pm2 logs plantayraiz-api --lines 50
```

---

## Passo 5 — Evolution API (Brisa Bot)

```bash
sudo -u deploy bash /home/deploy/plantayraiz/scripts/oracle-vm/03-deploy-evolution.sh
```

---

## Passo 6 — Nginx + HTTPS

```bash
sudo bash /home/deploy/plantayraiz/scripts/oracle-vm/04-nginx-tls.sh
```

Valida:
```bash
curl https://api.plantayraiz.com.br/health
curl -H "apikey: $EVOLUTION_API_KEY" https://bot.plantayraiz.com.br/instance/fetchInstances
```

---

## Passo 7 — Reconectar Brisa no WhatsApp

1. Abra `https://bot.plantayraiz.com.br/manager` no navegador
2. Login com `EVOLUTION_API_KEY`
3. Instância `Brisa_CEO` → **Connect** → escaneie o QR no WhatsApp Web do número `+55 11 99136-3154`
4. Mande mensagem teste no WhatsApp → deve responder via Gemini

---

## Passo 8 — Atualizar webhooks nos serviços externos

**Mercado Pago** (painel → Suas integrações → Webhooks):
- Trocar URL antiga (Hostinger VPS) por `https://api.plantayraiz.com.br/api/webhooks/mercadopago`

**Meta/Instagram** (Facebook Developers → Webhooks):
- Callback URL: `https://api.plantayraiz.com.br/api/webhooks/meta`

---

## Passo 9 — Monitorar 48h

```bash
# Logs em tempo real
pm2 monit

# Uso de recursos
htop
docker stats evolution-api

# Validar Brisa respondendo
# Mande "oi" no WhatsApp para +55 11 99136-3154
```

Verifique também o painel `/admin/brisa-ceo` da plataforma — mensagens devem aparecer.

---

## Passo 10 — Cancelar VPS Hostinger

Após **48h estável** (sem erros no PM2, sem alertas Discord SRE, checkout funcionando):

1. Faça backup final dos logs antigos da Hostinger
2. Painel Hostinger → VPS → **Cancelar serviço**
3. **MANTER** a Hospedagem Web (onde está o site estático)

---

## Auto-deploy contínuo (opcional, recomendado)

Adicione um webhook do GitHub apontando para `https://api.plantayraiz.com.br/api/deploy-hook` com secret HMAC. O endpoint roda `git pull && bun run build && pm2 restart` automaticamente em cada push para `main`.

(Endpoint a implementar quando você confirmar.)

---

## Troubleshooting

| Sintoma | Causa provável | Fix |
|---------|---------------|-----|
| Timeout `curl https://api...` | Oracle Security List bloqueia 80/443 | Passo 1 |
| `502 Bad Gateway` no Nginx | Node não subiu | `pm2 logs plantayraiz-api` |
| Evolution não responde | Container parado | `docker logs evolution-api` |
| Brisa sem responder após migração | QR não escaneado | Refazer Passo 7 |
| RAM 100% / OOM kills | VM x86 1GB apertada | Migrar para ARM Ampere 24GB grátis |
| Webhook MP não chega | URL antiga ainda configurada | Passo 8 |

---

## Recursos Oracle Always Free usados

- **Compute:** 1× VM.Standard.A1.Flex (ARM, 4 OCPU, 24GB RAM) — **recomendado**
  - Alternativa: 2× VM.Standard.E2.1.Micro (x86, 1 OCPU, 1GB RAM cada)
- **Storage:** 50GB block volume
- **Network:** 10TB egress/mês
- **Custo:** R$ 0,00 perpétuo (não expira)
