# 🚚 Runbook: Migração Total Hostinger → Oracle (Zero Downtime, Custo Zero)

**Resultado:** Hostinger 100% desligada. Toda a stack (n8n, Evolution/Brisa, Plausible, DocuSeal, Postgres, Redis, Traefik) rodando exclusivamente na Oracle Cloud Always Free.

**Tempo estimado:** 60–90 min (depende do tamanho dos volumes).
**Janela de downtime real:** ~5–15 min (somente entre "parar Hostinger" e "subir Oracle").

---

## 📁 Estrutura dos scripts

```
infra/migration-final/scripts/
├── 01-export-hostinger.sh      # roda na HOSTINGER  → gera tar.gz + sha256
├── 02-transfer-to-oracle.sh    # roda na HOSTINGER  → rsync para Oracle
├── 03-import-oracle.sh         # roda na ORACLE     → restaura volumes + dumps
├── 04-validate.sh              # roda na ORACLE     → health-check completo
└── 05-shutdown-hostinger.sh    # roda na HOSTINGER  → wipe seguro + shred
```

---

## ✅ Pré-requisitos (uma vez)

1. Oracle já rodando a stack (confirmado: `147.15.63.175`, portas 80/443 abertas, DNS apontando).
2. Chave SSH da Hostinger autorizada na Oracle:
   ```bash
   # NA HOSTINGER:
   ssh-keygen -t ed25519 -f /root/.ssh/oracle_key -N ""
   cat /root/.ssh/oracle_key.pub
   # NA ORACLE: adicionar a chave em ~ubuntu/.ssh/authorized_keys
   ```
3. Repo clonado nos dois lados em `/opt/planta-infra` (apenas para ter os scripts).

---

## 🟠 FASE 1 — EXPORTAÇÃO (Hostinger — serviços ainda no ar)

```bash
ssh root@<IP_HOSTINGER>
cd /opt/planta-infra
git pull
chmod +x infra/migration-final/scripts/*.sh
sudo bash infra/migration-final/scripts/01-export-hostinger.sh
```

O script:
- Faz `pg_dumpall` consistente do Plausible e Evolution (sem precisar parar containers).
- Força `SAVE` no Redis (snapshot RDB atualizado).
- `tar --numeric-owner -czpf` em cada volume Docker — **preserva uid/gid/permissões**.
- Empacota `.env` + `docker-compose.yml`.
- Gera SHA-256 do pacote final.

**Saída:** `/root/planta-migration-FINAL-<timestamp>.tar.gz` (+ `.sha256`).

---

## 🟠 FASE 2 — TRANSFERÊNCIA (Hostinger → Oracle)

Ainda na Hostinger:
```bash
sudo ORACLE_IP=147.15.63.175 bash infra/migration-final/scripts/02-transfer-to-oracle.sh
```

- Usa `rsync -aP` (preserva permissões, mostra progresso, retoma se cair conexão).
- Valida SHA-256 no destino automaticamente. Se falhar → reenvia.

---

## 🟢 FASE 3 — DOWNTIME CONTROLADO + IMPORT (Oracle)

### 3.1 — Parar Hostinger (início do downtime, t=0)
```bash
# NA HOSTINGER:
cd /opt/planta-infra/infra/vps-traefik
docker compose stop
```
A partir daqui Brisa/n8n/Plausible/DocuSeal estão offline ~5–15 min.

### 3.2 — Importar na Oracle
```bash
ssh ubuntu@147.15.63.175
cd /opt/planta-infra
git pull
sudo bash infra/migration-final/scripts/03-import-oracle.sh
```

O script:
1. Para a stack atual da Oracle (`docker compose down`) — necessário para não corromper volumes em uso.
2. Extrai o tar.gz recebido.
3. `tar -xzpf --numeric-owner` em cada volume → **permissões idênticas**.
4. **Compara `.env` Hostinger vs Oracle** (mostra diff) e pergunta se quer substituir.
5. Sobe stack (`docker compose up -d`).
6. Restaura dumps Postgres dentro dos containers vivos.

### 3.3 — Trocar DNS (Cloudflare) se ainda estiver apontando para Hostinger
Já está apontando para Oracle (`147.15.63.175`) — nada a fazer. **Fim do downtime.**

---

## 🟢 FASE 4 — VALIDAÇÃO (Oracle)

```bash
sudo bash infra/migration-final/scripts/04-validate.sh
```

Checklist manual obrigatório:
- [ ] `https://n8n.plantayraiz.com.br` abre **e mostra os mesmos workflows** da Hostinger.
- [ ] `https://analytics.plantayraiz.com.br` (Plausible) mostra histórico de visitas anterior.
- [ ] `https://assinaturas.plantayraiz.com.br` (DocuSeal) lista contratos antigos.
- [ ] `https://bot.plantayraiz.com.br/manager` → instância `Brisa_CEO` aparece (pode pedir QR de novo — normal).
- [ ] Mandar "oi" no WhatsApp `+55 11 99136-3154` → Brisa responde.
- [ ] Mercado Pago: enviar webhook de teste → chega em `https://api.plantayraiz.com.br/api/webhooks/mercadopago`.

**Aguarde 24h em produção** antes da Fase 5.

---

## 🔴 FASE 5 — WIPE + DESLIGAMENTO DA HOSTINGER

```bash
ssh root@<IP_HOSTINGER>
sudo bash /opt/planta-infra/infra/migration-final/scripts/05-shutdown-hostinger.sh
# Digite: DESLIGAR HOSTINGER
```

O script:
1. `docker compose down -v` (para tudo, remove volumes).
2. **Detecta processos zumbis** (`ss -tulpn` + `ps aux`) em portas 80/443/3000/5432/6379/8080/5678.
3. `docker system prune -a --volumes -f` + remove `/var/lib/docker/volumes/*`.
4. **`shred -uzn 3`** em todos `.env`, `*.pem`, `*.key`, `*.sql.gz`, `authorized_keys` (sobrescreve 3× antes de apagar).
5. Apaga `/opt/planta-infra`, caches, logs (`journalctl --vacuum-time=1s`), histórico bash.

### Passo final no painel Hostinger
1. Painel → VPS → **Reinstall OS** (garantia adicional: disco zerado pelo provider).
2. Após reinstall → **Cancel/Delete VPS**.
3. **MANTER** a Hospedagem Web (site estático continua nela, isso não muda).

---

## 🆘 Rollback (se algo der errado na Fase 3)

```bash
# NA HOSTINGER (ainda intacta):
cd /opt/planta-infra/infra/vps-traefik
docker compose up -d
```
Em <2 min volta no ar. Cloudflare continua apontando para Oracle, mas você pode reverter o DNS no painel manualmente para `<IP_HOSTINGER>` se precisar urgência. **Por isso a Fase 5 só roda depois de 24h estável.**

---

## 🔐 Garantia de integridade dos dados

| Mecanismo | Onde |
|---|---|
| `pg_dumpall` consistente | Fase 1 (sem locks longos) |
| SHA-256 do pacote | Fases 1 e 2 (validado automaticamente) |
| `tar --numeric-owner -p` | Preserva uid/gid/modo exatos |
| Diff de `.env` Hostinger ↔ Oracle | Fase 3 (interativo) |
| `shred -uzn 3` + Reinstall OS | Fase 5 (zero rastro LGPD) |

---

## 💰 Resultado final

- Oracle Cloud Always Free: **R$ 0,00/mês perpétuo**
- Hostinger VPS: **cancelada**
- Hostinger Hospedagem Web (site estático): **mantida** (não é VPS, custo já pago)
- RTO em caso de queda Oracle: ver `infra/failover/docs/FAILOVER_PROTOCOL.md` (R2 ou nova VM)
