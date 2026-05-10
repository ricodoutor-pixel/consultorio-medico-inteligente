# 🛡️ Stack Soberano — VPS Hostinger Planta y Raiz

Configura **n8n + DocuSeal + Plausible + Evolution API** atrás do Traefik com SSL automático Let's Encrypt nos 4 subdomínios já apontados pelo `hostinger-sync` v3.

## Mapa de domínios

| URL | Serviço | Porta interna |
|---|---|---|
| `https://n8n.plantayraiz.com.br` | n8n (workflows) | 5678 |
| `https://assinaturas.plantayraiz.com.br` | DocuSeal (assinaturas) | 3000 |
| `https://analytics.plantayraiz.com.br` | Plausible (visitas, sem cookies) | 8000 |
| `https://api.plantayraiz.com.br` | Evolution API (WhatsApp) | 8080 |

VPS: `srv1641464.hstgr.cloud` (`2.24.69.154`) — KVM 2, 8GB RAM, Ubuntu 24.04 + Docker/Traefik.

---

## 🚀 Deploy em 1 comando (VPS root)

```bash
ssh root@2.24.69.154
curl -fsSL https://raw.githubusercontent.com/ricodoutor-pixel/consultorio-medico-inteligente/main/infra/vps-traefik/bootstrap.sh | bash
```

O script:
1. Atualiza o sistema
2. Instala/garante Docker + Compose v2
3. Abre firewall UFW (22, 80, 443)
4. Clona o repo em `/opt/planta-infra`
5. Pausa para você editar `.env` com senhas reais
6. Sobe a stack (`docker compose up -d`)

---

## 🔐 Senhas (gere antes de subir)

```bash
# Edite /opt/planta-infra/infra/vps-traefik/.env
openssl rand -hex 32        # N8N_ENCRYPTION_KEY, PLAUSIBLE_SECRET_KEY_BASE
openssl rand -base64 24     # senhas de DB e admin
openssl rand -hex 24        # EVOLUTION_API_KEY
```

---

## 📡 Pós-deploy

**Aguarde 2-5 min** para Let's Encrypt validar (precisa do DNS já propagado — confirmado pelo `hostinger-sync` ✅).

```bash
docker compose logs -f traefik   # acompanhar emissão de SSL
docker compose ps                # ver tudo rodando
```

### Configurações por serviço

- **n8n**: já cria admin via Basic Auth (`N8N_USER` / `N8N_PASSWORD`)
- **DocuSeal**: crie admin no 1º acesso pela UI
- **Plausible**: registro `invite_only` — primeiro user vira admin; cadastre o domínio `plantayraiz.com.br` e cole o snippet no `<head>` do site Lovable
- **Evolution API**: use o `AUTHENTICATION_API_KEY` no header `apikey` para criar instâncias WhatsApp:
  ```bash
  curl -X POST https://api.plantayraiz.com.br/instance/create \
    -H "apikey: SEU_EVOLUTION_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"instanceName":"brisa","qrcode":true}'
  ```

---

## 🔄 Manutenção

```bash
cd /opt/planta-infra/infra/vps-traefik
git pull
docker compose pull && docker compose up -d   # atualiza imagens
docker compose logs -f n8n                    # logs específicos
docker compose restart evolution              # reinicia 1 serviço
```

Snapshots semanais da VPS já são criados automaticamente pelo `hostinger-sync` (cron 03:00 UTC).

---

## ⚠️ Antes de produção

- [ ] Trocar `N8N_BASIC_AUTH` por OAuth real (n8n suporta SSO)
- [ ] DocuSeal: configurar e-mail SMTP via Lovable Email/Resend
- [ ] Plausible: validar que o snippet está só no `index.html` do Lovable, não duplicado
- [ ] Evolution: salvar `EVOLUTION_API_KEY` como secret no Lovable Cloud (`secrets--add_secret`) para o backend chamar a API
