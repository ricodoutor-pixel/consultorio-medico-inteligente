# 🚨 Protocolo de Failover — Oracle (Primário) → Hostinger (Cold Standby)

**Custo:** R$ 0,00/mês (Oracle Free) + manter VPS Hostinger só até validação 100% (depois cancelar).
**RTO (tempo de recuperação):** ~5 min após DNS propagar.
**RPO (perda máx de dados):** 24h (backup diário às 03:00 BRT).

---

## Arquitetura

```text
┌─────────────────────────┐         ┌──────────────────────────┐
│  ORACLE CLOUD (PROD)    │  rsync  │  HOSTINGER VPS (STANDBY) │
│  147.15.63.175          │ ──────► │  2.24.69.154             │
│  • n8n, Evolution,      │  diário │  • Snapshots em          │
│    Plausible, DocuSeal  │  03:00  │    /opt/planta-failover  │
│  • Stack DOCKER ATIVA   │         │  • Stack PARADA          │
└─────────────────────────┘         └──────────────────────────┘
            ▲                                     ▲
            └──────── Cloudflare DNS ─────────────┘
                  (api/bot/n8n/assinaturas/analytics)
```

---

## 🔄 Setup Inicial (uma única vez)

### 1. Gerar chave SSH dedicada na Oracle
```bash
ssh ubuntu@147.15.63.175
sudo ssh-keygen -t ed25519 -f /root/.ssh/failover_key -N ""
sudo cat /root/.ssh/failover_key.pub
# Copie a chave pública
```

### 2. Autorizar na Hostinger
```bash
ssh root@2.24.69.154
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "<chave_publica_oracle>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
mkdir -p /opt/planta-failover
```

### 3. Instalar CRON de backup na Oracle
```bash
sudo crontab -e
# Adicione:
0 3 * * * TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=yyy /opt/planta-infra/infra/failover/scripts/backup.sh >> /var/log/planta-backup.log 2>&1
```

### 4. Instalar Health Check na Hostinger (monitora a Oracle de fora)
```bash
ssh root@2.24.69.154
mkdir -p /opt/planta-failover
# copiar health-check.sh para /opt/planta-failover/
crontab -e
*/5 * * * * TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=yyy /opt/planta-failover/health-check.sh
```

---

## 🚨 Procedimento de Failover (quando Oracle cai)

### Passo 1 — Confirmar que Oracle realmente está fora
```bash
curl -I https://api.plantayraiz.com.br/health
ping -c 4 147.15.63.175
```
Se ambos falham > 5 min, prossiga.

### Passo 2 — Ativar standby na Hostinger
```bash
ssh root@2.24.69.154
sudo bash /opt/planta-failover/deploy-emergency.sh
```
O script:
- Restaura volumes Docker do último snapshot
- Restaura dumps PostgreSQL (Plausible + Evolution)
- Restaura `.env` com chaves atualizadas
- Sobe stack completa via `docker compose up -d`

### Passo 3 — Trocar DNS no Cloudflare
Acesse `dash.cloudflare.com` → `plantayraiz.com.br` → DNS → Records.

Edite **cada** registro abaixo, trocando o IP de `147.15.63.175` (Oracle) para `2.24.69.154` (Hostinger):

| Tipo | Nome        | Novo Valor       | Proxy |
|------|-------------|------------------|-------|
| A    | api         | 2.24.69.154      | OFF   |
| A    | bot         | 2.24.69.154      | OFF   |
| A    | n8n         | 2.24.69.154      | OFF   |
| A    | assinaturas | 2.24.69.154      | OFF   |
| A    | analytics   | 2.24.69.154      | OFF   |

**TTL recomendado:** 60s (para propagação rápida).

### Passo 4 — Validar
```bash
dig api.plantayraiz.com.br +short    # deve retornar 2.24.69.154
curl -I https://api.plantayraiz.com.br/health
```

### Passo 5 — Reconectar WhatsApp
1. Abra `https://api.plantayraiz.com.br/manager` (Evolution)
2. Instância `Brisa_CEO` → Connect → escaneie QR no WhatsApp
   (o número `+55 11 99136-3154` perde sessão na troca de servidor — normal)

### Passo 6 — Atualizar webhooks
- **Mercado Pago:** webhook continua `https://api.plantayraiz.com.br/...` (DNS já redirecionou, nada a fazer)
- **Meta/Instagram:** idem

---

## 🔁 Voltar para Oracle (após reativação)

1. SSH na Oracle → confirmar que stack subiu (`docker compose ps`)
2. Restaurar snapshot recente da Hostinger (caso novos dados tenham entrado durante o failover):
   ```bash
   # NA HOSTINGER:
   rsync -avz -e "ssh -i /root/.ssh/failover_key" \
     /opt/planta-failover/latest/ \
     ubuntu@147.15.63.175:/opt/planta-restore/
   ```
3. NA ORACLE: rodar `deploy-emergency.sh` adaptado, OU restaurar manualmente dumps Postgres.
4. Cloudflare DNS → reverter IPs para `147.15.63.175`
5. NA HOSTINGER: `docker compose down` (volta a ser standby)

---

## 🔐 Segurança das Chaves

O `.env` espelhado contém todas as chaves (Evolution API, Plausible secret, DB passwords, encryption keys do n8n).
**Boas práticas:**
- Rotacionar chaves a cada 90 dias (atualizar Oracle + rodar backup → Hostinger fica em sincronia automática)
- Não commitar `.env` no Git (já está no `.gitignore`)
- Permissões: `chmod 600 .env` em ambos os servidores
- Hostinger só aceita SSH com chave (desabilitar password auth: `PasswordAuthentication no` em `/etc/ssh/sshd_config`)

---

## 📊 Monitoramento

### Telegram Bot (recomendado)
1. Crie bot via `@BotFather` → pegue `TELEGRAM_BOT_TOKEN`
2. Mande `/start` para o bot → pegue `TELEGRAM_CHAT_ID` em `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Exporte em `/etc/environment` na Oracle E na Hostinger:
   ```bash
   TELEGRAM_BOT_TOKEN=123:abc
   TELEGRAM_CHAT_ID=987654321
   ```

### Alertas disparados
| Evento | Origem | Mensagem |
|--------|--------|----------|
| Backup OK | Oracle 03:05 | ✅ Backup concluído |
| Backup FAIL | Oracle | 🚨 Backup falhou na linha X |
| Oracle DOWN | Hostinger | 🚨 Oracle não responde — ative failover |
| Oracle UP novamente | Hostinger | ✅ Oracle voltou |

---

## 🗑️ Cancelar VPS Hostinger (decisão final)

**NÃO cancele até validar 48h estável na Oracle.** Após validação:

**Opção A — Manter Hostinger como standby (R$ ~15/mês):**
- Mantém RPO 24h e RTO 5 min
- Recomendado para faturamento crítico

**Opção B — Cancelar Hostinger (R$ 0 total):**
- Backup vai para storage Cloudflare R2 (10GB grátis) ou Google Drive via rclone
- RTO sobe para ~30 min (precisa provisionar VM nova)
- Aceitável se Oracle Always Free tem SLA suficiente

**Comando para reconfigurar backup para R2 (Opção B):**
```bash
rclone config  # criar remote "r2"
# trocar rsync por:
rclone sync /tmp/planta-snapshot-* r2:planta-backups/ --transfers=4
```
