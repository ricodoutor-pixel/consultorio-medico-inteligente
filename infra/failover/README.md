# 🟢 Planta y Raiz — Failover Oracle ↔ Hostinger

Sistema de Cold Standby: **Oracle Cloud (primário)** + **Hostinger VPS (emergência)**.

## Estrutura

```
infra/failover/
├── README.md                    ← este arquivo
├── docs/
│   └── FAILOVER_PROTOCOL.md     ← procedimento completo (LEIA PRIMEIRO)
└── scripts/
    ├── backup.sh                ← roda na Oracle (CRON diário 03:00)
    ├── deploy-emergency.sh      ← roda na Hostinger quando Oracle cai
    └── health-check.sh          ← roda na Hostinger (CRON 5min) → alerta Telegram
```

## Quickstart

1. Leia `docs/FAILOVER_PROTOCOL.md` (setup inicial 4 passos).
2. Configure secrets Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) em `/etc/environment`.
3. Instale CRONs (backup na Oracle + health-check na Hostinger).
4. Teste failover manual: `sudo bash scripts/deploy-emergency.sh` na Hostinger.

## Cancelar Hostinger?

Veja seção "🗑️ Cancelar VPS Hostinger" no protocolo. **Recomendação:** validar 48h na Oracle antes.
