# Prompt para o Claude no navegador (Claude in Chrome) — Jitsi próprio na VPS Hostinger

Cole o texto abaixo no Claude do navegador, já logado no hPanel da Hostinger e no Lovable. Senhas e segredos **não** devem ser colados no chat: o Claude gera os segredos no próprio terminal da VPS.

---

Você vai instalar o Jitsi Meet próprio da Planta y Raíz na minha VPS Hostinger. Trabalhe só nas telas que eu já deixei logadas. Antes de qualquer ação que apague, reinicie ou substitua algo existente, pare e me pergunte. Não mexa nos containers que já estão rodando (Traefik, n8n, Evolution, responder da Brisa). **Não troque o ramo nem rode `git pull` em `/opt/plantayraiz`**: essa cópia pode estar em uso.

Fatos já conhecidos da VPS: o Traefik roda em `network_mode: host`, lê labels do Docker com `exposedbydefault=false` e emite certificados Let's Encrypt por httpchallenge na porta 80. Não existe rede `proxy`, e o compose do Jitsi já foi ajustado para isso (usa a rede local `jitsi`). A pasta `infra/jitsi` está no ramo **`main`**.

**1. Descobrir os nomes do Traefik (só leitura)**
```bash
T=$(docker ps --format '{{.Names}}' | grep -i traefik | head -1); echo $T
docker inspect $T --format '{{json .Args}}' | tr ',' '\n' | grep -E 'entrypoints\.[a-z]+\.address|certificatesresolvers\.[a-z]+\.'
```
Anote o entrypoint da porta 443 (ex.: `websecure`) e o nome do resolvedor (ex.: `le`, `letsencrypt`, `myresolver`).

**2. DNS**: crie um registro **A** `meet` → IP da VPS, TTL 300. Não altere nem apague nenhum outro registro. (Se o DNS já existir, só confira.)

**3. Copiar só a pasta do Jitsi do ramo main, sem mexer na cópia existente**
```bash
git -C /opt/plantayraiz fetch origin main
mkdir -p /opt/jitsi && git -C /opt/plantayraiz archive origin/main infra/jitsi | tar -x -C /opt/jitsi --strip-components=2
ls /opt/jitsi && cat /opt/jitsi/docker-compose.yml
```
Me mostre o `docker-compose.yml` antes de seguir.

**4. Preencher o .env** (troque `ENTRYPOINT` e `RESOLVER` pelos nomes do passo 1)
```bash
cd /opt/jitsi && cp -n .env.example .env
IP=$(curl -s https://api.ipify.org)
sed -i "s/^VPS_PUBLIC_IP=.*/VPS_PUBLIC_IP=$IP/" .env
sed -i "s/^JITSI_APP_SECRET=.*/JITSI_APP_SECRET=$(openssl rand -hex 32)/" .env
sed -i "s/^JICOFO_AUTH_PASSWORD=.*/JICOFO_AUTH_PASSWORD=$(openssl rand -hex 16)/" .env
sed -i "s/^JVB_AUTH_PASSWORD=.*/JVB_AUTH_PASSWORD=$(openssl rand -hex 16)/" .env
sed -i "s/^TRAEFIK_ENTRYPOINT=.*/TRAEFIK_ENTRYPOINT=ENTRYPOINT/" .env
sed -i "s/^TRAEFIK_CERTRESOLVER=.*/TRAEFIK_CERTRESOLVER=RESOLVER/" .env
grep -E '^(JITSI_DOMAIN|VPS_PUBLIC_IP|JITSI_IMAGE_VERSION|TRAEFIK_)' .env
```

**5. Subir**
```bash
mkdir -p data/web data/prosody/config data/prosody/plugins-custom data/jicofo data/jvb
docker compose config --quiet && docker compose pull && docker compose up -d && docker compose ps
```

**6. Verificar**
```bash
sleep 60; curl -sI https://meet.plantayraiz.com.br | head -1
docker logs $T 2>&1 | grep -i -E 'jitsi|meet\.plantayraiz' | tail -5
```
Deve responder `HTTP/2 200` com certificado válido. `https://meet.plantayraiz.com.br/teste` deve pedir autenticação e não deixar entrar sem token. Se der 404 ou erro de certificado, me mostre os logs do Traefik e não mude nada.

**7. Segredos da plataforma**: no Lovable → Cloud → Secrets, crie `JITSI_DOMAIN` = `meet.plantayraiz.com.br`, `JITSI_APP_ID` e `JITSI_APP_SECRET` com os valores de `grep -E '^JITSI_APP_(ID|SECRET)=' /opt/jitsi/.env`, copiados direto do terminal. **Nunca cole os valores no chat.** Depois peça ao Lovable para reimplantar `consultation-video-token`.

**8. Relatório final**: o IP, se o DNS respondeu, a saída de `docker compose ps`, o resultado do `curl` e os nomes (não os valores) dos segredos criados.

O firewall UDP 10000 fica com o dono da conta (hPanel → VPS → Firewall).

**Para desfazer:** apague os três segredos `JITSI_*` no Lovable (as consultas voltam ao meet.jit.si na hora) e rode `cd /opt/jitsi && docker compose down`.
