# Prompt para o Claude no navegador (Claude in Chrome) — Jitsi próprio na VPS Hostinger

Cole o texto abaixo no Claude do navegador, já logado no hPanel da Hostinger e no painel de DNS do domínio `plantayraiz.com.br`. Senhas e segredos **não** devem ser colados no chat: o Claude gera os segredos no próprio terminal da VPS.

---

Você vai instalar o Jitsi Meet próprio da Planta y Raíz na minha VPS Hostinger. Trabalhe só nas telas que eu já deixei logadas. Antes de qualquer ação que apague, reinicie ou substitua algo existente, pare e me pergunte. Não mexa nos containers que já estão rodando (Traefik, n8n, Evolution, responder da Brisa).

**1. Descobrir a VPS**
- No hPanel, abra **VPS** e anote o **IP público (IPv4)** e o sistema operacional.
- Confira se há pelo menos 2 vCPU e 4 GB de RAM livres. Se não houver, pare e me avise.

**2. DNS**
- No gerenciador de DNS de `plantayraiz.com.br` (hPanel → Domínios → DNS, ou onde o domínio estiver), crie um registro **A**: nome `meet`, valor = IP da VPS, TTL 300.
- Não altere nem apague nenhum outro registro.

**3. Firewall da VPS**
- hPanel → VPS → **Firewall**: adicione uma regra que **aceita UDP na porta 10000** de qualquer origem. Mantenha as regras de TCP 80 e 443.
- Se a VPS também usar `ufw`, rode no terminal: `sudo ufw allow 10000/udp`.

**4. Instalação pelo terminal do navegador** (hPanel → VPS → **Terminal**). Rode um bloco por vez e me mostre a saída:
```bash
docker network ls | grep proxy && docker ps --format '{{.Names}}' | grep -i traefik
```
Se não aparecer a rede `proxy` e o Traefik, pare e me avise.
```bash
cd /opt && (test -d plantayraiz || git clone https://github.com/ricodoutor-pixel/consultorio-medico-inteligente.git plantayraiz)
cd /opt/plantayraiz && git pull && cd infra/jitsi
cp -n .env.example .env
IP=$(curl -s https://api.ipify.org)
sed -i "s/^VPS_PUBLIC_IP=.*/VPS_PUBLIC_IP=$IP/" .env
sed -i "s/^JITSI_APP_SECRET=.*/JITSI_APP_SECRET=$(openssl rand -hex 32)/" .env
sed -i "s/^JICOFO_AUTH_PASSWORD=.*/JICOFO_AUTH_PASSWORD=$(openssl rand -hex 16)/" .env
sed -i "s/^JVB_AUTH_PASSWORD=.*/JVB_AUTH_PASSWORD=$(openssl rand -hex 16)/" .env
mkdir -p data/web data/prosody/config data/prosody/plugins-custom data/jicofo data/jvb
docker compose pull && docker compose up -d && docker compose ps
```
(Se o repositório for privado e o clone falhar, pare e me peça um token de leitura. Não tente outro caminho.)

**5. Verificação**
```bash
sleep 60; curl -sI https://meet.plantayraiz.com.br | head -1
```
- Deve responder `HTTP/2 200` com certificado válido. Abra `https://meet.plantayraiz.com.br/teste` no navegador: deve pedir autenticação e **não** deve deixar entrar sem token.

**6. Segredos da plataforma**
- Rode `grep -E '^JITSI_APP_(ID|SECRET)=' /opt/plantayraiz/infra/jitsi/.env`. **Não cole o valor no chat.**
- Abra o Lovable (projeto Planta y Raíz) → **Cloud → Secrets** e crie:
  - `JITSI_DOMAIN` = `meet.plantayraiz.com.br`
  - `JITSI_APP_ID` = o valor do `.env` (normalmente `plantayraiz`)
  - `JITSI_APP_SECRET` = o valor do `.env`, copiado direto do terminal
- Peça ao Lovable para reimplantar a função `consultation-video-token`.

**7. Relatório final**
Me diga: o IP usado, se o DNS respondeu, a saída de `docker compose ps`, o resultado do `curl` e quais segredos foram criados (só os nomes, nunca os valores).

**Para desfazer:** apague os três segredos `JITSI_*` no Lovable (as consultas voltam ao meet.jit.si na hora) e rode `cd /opt/plantayraiz/infra/jitsi && docker compose down`.
