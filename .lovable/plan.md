# ARQUIVADO — plano Oracle descontinuado

**Status atual:** este plano não é mais a base operacional do fluxo Brisa.

**Regra vigente:** o runtime do WhatsApp/Evolution está no **Railway** e qualquer recuperação do fluxo deve partir dessa arquitetura, não de Oracle/Hostinger VPS.

**Motivo do arquivamento:** o projeto migrou e este documento passou a induzir operação errada, QR errado e troubleshooting em infraestrutura fora de uso.

## O que migra para a Oracle VM (grátis)

1. **Backend Node.js** (`dist/server.js` — tRPC v11, AI Gateway Router)
2. **Evolution API** (Brisa Bot WhatsApp — container Docker)
3. **PM2** para manter processos vivos + auto-restart
4. **Nginx** como reverse proxy + TLS Let's Encrypt
5. **Cron jobs** pesados (prerender SEO manual, backups)

## O que NÃO migra

- Site estático (`dist/` build Vite) → continua na **Hospedagem Web Hostinger** (plano barato/grátis incluso no domínio, não é VPS)
- Supabase Edge Functions → continuam na Lovable Cloud
- Banco de dados → continua no Supabase

## Arquitetura final

```text
[Usuário] ─► plantayraiz.com.br (Hostinger Web Hosting — site estático)
                │
                ├─► api.plantayraiz.com.br ──► Oracle VM (Nginx → Node tRPC :3000)
                └─► bot.plantayraiz.com.br ──► Oracle VM (Nginx → Evolution :8080)
                                                    │
                                                    └─► Supabase (DB + Edge Functions)
```

## Passos de execução

### 1. Preparar Oracle VM (via SSH usando `ORACLE_VM_SSH_KEY`)
- Atualizar sistema (Ubuntu 22.04 ARM/AMD)
- Instalar: Node.js 22, PM2, Docker, Nginx, certbot
- Abrir portas 80, 443, 3000, 8080 no firewall (iptables + Oracle Security List)
- Configurar swap 2GB (VM Always Free tem só 1GB RAM)

### 2. Deploy do backend Node.js
- Clonar repo `ricodoutor-pixel/consultorio-medico-inteligente` na VM
- `bun install && bun run build`
- PM2 start `dist/server.js` com auto-restart e logs rotacionados
- Webhook do GitHub para auto-deploy em cada push

### 3. Deploy Evolution API (Docker)
- `docker run` com volumes persistentes
- Variáveis: `EVOLUTION_API_KEY`, conexão Supabase via secrets
- Reconectar instância `Brisa_CEO` → reescanear QR no WhatsApp

### 4. Nginx + HTTPS
- Subdomínios `api.` e `bot.` com Let's Encrypt (renovação automática)
- Headers de segurança + rate limit

### 5. DNS (Cloudflare)
- Criar registros A:
  - `api.plantayraiz.com.br` → IP Oracle (proxy DESLIGADO para webhooks)
  - `bot.plantayraiz.com.br` → IP Oracle (proxy DESLIGADO)
- `plantayraiz.com.br` e `www` continuam apontando para Hostinger

### 6. Atualizar referências no código
- Trocar URL do webhook Evolution nos secrets Supabase: `EVOLUTION_API_URL=https://bot.plantayraiz.com.br`
- Atualizar `VITE_API_BASE_URL` para `https://api.plantayraiz.com.br`
- Rebuild + deploy na Hostinger Web Hosting

### 7. Validação
- `curl https://api.plantayraiz.com.br/health` → 200 OK
- `curl https://bot.plantayraiz.com.br/manager` → Evolution UI
- Testar checkout PIX completo (webhook MP chega na VM)
- Mandar mensagem WhatsApp → Brisa responde

### 8. Cancelar VPS Hostinger
- Após 48h estáveis monitorando logs PM2 e Discord SRE
- Você cancela manualmente no painel Hostinger (não tenho acesso)

## Detalhes técnicos

**Recursos Oracle Always Free usados:**
- 1× VM.Standard.E2.1.Micro (1 OCPU AMD, 1GB RAM) OU 4× ARM Ampere (24GB RAM total grátis — recomendo ARM)
- 200GB block storage
- 10TB tráfego/mês
- **Custo: R$ 0,00 para sempre** (tier perpétuo)

**Pré-requisitos que eu preciso de você:**
1. **IP público** da Oracle VM (você ainda não me passou — só a chave SSH)
2. **Usuário SSH** (geralmente `ubuntu` ou `opc`)
3. **Acesso ao painel Cloudflare** para criar os registros A (ou eu te dou o IP e você cria)
4. **Confirmação** de que a VM é ARM Ampere ou x86 (muda comandos de instalação)

## Riscos

- Evolution API precisa **rescanear QR Code** ao migrar (Brisa fica offline ~5min)
- Webhooks Mercado Pago precisam ser atualizados no painel MP para nova URL
- Se Oracle VM tiver só 1GB RAM, Node + Evolution juntos podem ficar apertados → swap obrigatório, ou usar tier ARM 24GB

## Entregáveis ao fim

- VPS Hostinger desligável (você cancela)
- Todos os serviços rodando em `api.` e `bot.plantayraiz.com.br` (Oracle grátis)
- Documentação `docs/ORACLE_VM_DEPLOY.md` com runbook
- Webhook GitHub → auto-deploy em cada push

---

**Me confirme o IP público + usuário SSH da Oracle VM e eu começo pela etapa 1.**
