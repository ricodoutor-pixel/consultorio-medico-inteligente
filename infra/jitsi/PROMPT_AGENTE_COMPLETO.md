# MISSÃO: vídeo próprio das consultas da Planta y Raíz funcionando hoje (Jitsi na VPS Hostinger + teste de 45 min)

Você é o agente técnico do Dr. Edilson. Ele é médico, não programa, e quer tudo feito por você no navegador, como um técnico humano faria. Faça todas as etapas sozinho. Fale com ele só para pedir um login que não esteja aberto, para uma confirmação de risco listada abaixo, ou para entregar o relatório final. Escreva para ele em português simples.

## Regras que não podem ser quebradas
1. **Nunca cole senha, token ou segredo no chat.** Copie direto do terminal para o campo de destino.
2. **Não mexa no que já funciona.** Não pare, reinicie, apague nem atualize os containers existentes (Traefik, n8n, Evolution, Brisa/responder, Plausible, Docuseal). Não rode `git pull` nem troque o ramo em `/opt/plantayraiz`, porque essa cópia está em uso.
3. **No DNS, só crie o registro novo.** Não altere nem apague outros registros.
4. **Pare e peça confirmação** antes de qualquer comando com `down`, `rm`, `prune`, `restart` ou `reboot` que atinja algo que não seja `/opt/jitsi`.
5. Se um passo falhar duas vezes, **pare**, mostre o erro e diga o que acha que é. Não improvise outra arquitetura.
6. Não use o projeto Supabase antigo `tkxxoghzhvhjzdoomgss`. Segredos vão só no **Lovable → Cloud → Secrets** do projeto Planta y Raíz.

## Abas que precisam estar logadas (peça ao Dr. Edilson só se alguma não estiver)
- hPanel da Hostinger (VPS e DNS)
- GitHub (conta `ricodoutor-pixel`)
- Lovable (projeto Planta y Raíz)

## O que já se sabe
- **Traefik:** roda em `network_mode: host`, lê labels do Docker com `exposedbydefault=false` e emite certificado Let's Encrypt por httpchallenge na porta 80. Não existe rede `proxy`, e o compose do Jitsi já foi feito para isso (usa a rede local `jitsi`).
- **Arquivos:** ficam no repositório `ricodoutor-pixel/consultorio-medico-inteligente`, ramo **main**, pasta `infra/jitsi`.
- **Como a plataforma entra no vídeo:** a função `consultation-video-token` emite um JWT HS256 com `iss=JITSI_APP_ID`, `aud=jitsi`, `sub=*`, `room=plantayraiz-consultorio-<id>` e duração de 2 h. O médico entra como moderador. Sem os segredos `JITSI_*`, a plataforma usa o meet.jit.si.

---

## ETAPA 1 — Trocar a chave do GitHub que ficou exposta na VPS
1. No terminal da VPS (hPanel → VPS → Terminal), veja o endereço atual sem mostrar o token:
   ```bash
   git -C /opt/plantayraiz remote get-url origin | sed -E 's#://[^@]+@#://***@#'
   ```
2. No GitHub, abra Settings → Developer settings → **Fine-grained tokens** → Generate new token e preencha:
   - **Nome:** `vps-leitura-plantayraiz`
   - **Validade:** 90 dias
   - **Repository access:** só `consultorio-medico-inteligente`
   - **Permissions:** Contents = **Read-only**
   - Gere o token e copie.
3. No terminal da VPS, cole o token no lugar de `NOVO_TOKEN`:
   ```bash
   git -C /opt/plantayraiz remote set-url origin https://NOVO_TOKEN@github.com/ricodoutor-pixel/consultorio-medico-inteligente.git
   git -C /opt/plantayraiz fetch origin main && echo FETCH_OK
   ```
4. Só depois do `FETCH_OK`, apague o token antigo no GitHub (Settings → Developer settings → Personal access tokens, nas abas *classic* e *fine-grained*). Apague apenas o token que estava na VPS. Se não tiver certeza de qual era, pergunte ao Dr. Edilson listando só os nomes.

## ETAPA 2 — Firewall e DNS
1. Em hPanel → VPS → **Firewall**, garanta estas regras de entrada:
   - TCP 22, 80 e 443 (provavelmente já existem; não remova)
   - **UDP 10000** (crie)

   Se houver um firewall ativo, mas ele não estiver aplicado à VPS, aplique-o.
2. No terminal, se o `ufw` estiver ativo, libere a porta também nele:
   ```bash
   sudo ufw status | head -3; sudo ufw status | grep -q active && sudo ufw allow 10000/udp
   ```
3. No DNS de `plantayraiz.com.br` (hPanel → Domínios → DNS):
   - Crie um registro **A** com nome `meet`, valor = IP público da VPS e TTL 300.
   - Se o registro já existir apontando para o IP certo, não mexa.
4. Confira:
   ```bash
   getent hosts meet.plantayraiz.com.br; curl -s https://api.ipify.org; echo
   ```
   Os dois IPs devem ser iguais. A propagação pode levar alguns minutos; espere e repita.

## ETAPA 3 — Instalar o Jitsi em /opt/jitsi
1. Descubra os nomes usados pelo Traefik (só leitura):
   ```bash
   T=$(docker ps --format '{{.Names}}' | grep -i traefik | head -1); echo "TRAEFIK=$T"
   docker inspect $T --format '{{json .Args}}' | tr ',' '\n' | grep -E 'entrypoints\.[A-Za-z0-9_-]+\.address|certificatesresolvers\.[A-Za-z0-9_-]+\.'
   ```
   Anote o **entrypoint** da porta `:443` e o nome do **resolvedor** (o trecho entre `certificatesresolvers.` e o ponto seguinte).
2. Copie só a pasta do Jitsi:
   ```bash
   mkdir -p /opt/jitsi && git -C /opt/plantayraiz archive origin/main infra/jitsi | tar -x -C /opt/jitsi --strip-components=2 && ls /opt/jitsi
   ```
3. Pegue a versão estável mais recente das imagens:
   ```bash
   VER=$(curl -s "https://hub.docker.com/v2/repositories/jitsi/web/tags?page_size=100" | grep -o '"name":"stable-[0-9-]*"' | head -1 | cut -d'"' -f4); echo "VER=$VER"
   ```
   Se vier vazio, use `stable`.
4. Preencha o `.env`. Troque `ENTRYPOINT` e `RESOLVER` pelos nomes que você anotou no item 1:
   ```bash
   cd /opt/jitsi && cp -n .env.example .env
   sed -i "s/^VPS_PUBLIC_IP=.*/VPS_PUBLIC_IP=$(curl -s https://api.ipify.org)/" .env
   sed -i "s/^JITSI_IMAGE_VERSION=.*/JITSI_IMAGE_VERSION=${VER:-stable}/" .env
   grep -q '^JITSI_APP_SECRET=.\+' .env || sed -i "s/^JITSI_APP_SECRET=.*/JITSI_APP_SECRET=$(openssl rand -hex 32)/" .env
   grep -q '^JICOFO_AUTH_PASSWORD=.\+' .env || sed -i "s/^JICOFO_AUTH_PASSWORD=.*/JICOFO_AUTH_PASSWORD=$(openssl rand -hex 16)/" .env
   grep -q '^JVB_AUTH_PASSWORD=.\+' .env || sed -i "s/^JVB_AUTH_PASSWORD=.*/JVB_AUTH_PASSWORD=$(openssl rand -hex 16)/" .env
   sed -i "s/^TRAEFIK_ENTRYPOINT=.*/TRAEFIK_ENTRYPOINT=ENTRYPOINT/" .env
   sed -i "s/^TRAEFIK_CERTRESOLVER=.*/TRAEFIK_CERTRESOLVER=RESOLVER/" .env
   chmod 600 .env
   grep -E '^(JITSI_DOMAIN|VPS_PUBLIC_IP|JITSI_IMAGE_VERSION|JITSI_APP_ID|TRAEFIK_)' .env
   ```
5. Suba os containers:
   ```bash
   mkdir -p data/web data/prosody/config data/prosody/plugins-custom data/jicofo data/jvb
   docker compose config --quiet && docker compose pull && docker compose up -d && sleep 20 && docker compose ps
   ```
   Os 4 serviços (web, prosody, jicofo e jvb) devem estar `running`. Se algum reiniciar sem parar, veja os logs com `docker compose logs --tail=50 <serviço>`.
6. Confira o HTTPS:
   ```bash
   sleep 60; curl -sI https://meet.plantayraiz.com.br | head -1
   ```
   Deve dar `HTTP/2 200` com certificado válido. Se der 404 ou certificado inválido, veja os logs do Traefik:
   ```bash
   docker logs $T --since 10m 2>&1 | grep -iE 'jitsi|meet|acme|error' | tail -20
   ```
   Corrija apenas os labels em `/opt/jitsi`, e só se o problema for o nome do entrypoint ou do resolvedor. Depois rode `docker compose up -d`.

## ETAPA 4 — Teste real de 45 minutos (2 participantes)
1. Gere dois links de teste no terminal: um de médico, que entra como moderador, e um de paciente.
   ```bash
   cd /opt/jitsi && set -a && . ./.env && set +a
   b64(){ openssl base64 -A | tr '+/' '-_' | tr -d '='; }
   tok(){ H=$(printf '{"alg":"HS256","typ":"JWT"}' | b64)
          P=$(printf '{"iss":"%s","aud":"jitsi","sub":"*","room":"teste-45min","exp":%s,"context":{"user":{"name":"%s","moderator":%s}},"moderator":%s}' "$JITSI_APP_ID" $(( $(date +%s) + 7200 )) "$1" "$2" "$2" | b64)
          S=$(printf '%s.%s' "$H" "$P" | openssl dgst -sha256 -hmac "$JITSI_APP_SECRET" -binary | b64)
          echo "https://meet.plantayraiz.com.br/teste-45min?jwt=$H.$P.$S"; }
   tok "Medico Teste" true; tok "Paciente Teste" false
   ```
   Os links valem 2 horas e só abrem a sala `teste-45min`. Não cole os links no chat.
2. Abra o link do médico numa aba e o do paciente em **outra janela**. Permita câmera e microfone.
3. Confirme que **os dois participantes aparecem na sala** com áudio e vídeo.
4. Teste de segurança: abra `https://meet.plantayraiz.com.br/teste-45min` **sem** `?jwt=`. A página deve pedir autenticação e não deixar entrar.
5. Deixe a chamada aberta por **45 minutos**. A cada 15 minutos:
   - confira na tela que os dois continuam conectados;
   - rode `docker compose -f /opt/jitsi/docker-compose.yml ps` e `docker stats --no-stream | grep -i jitsi`.

   Anote se houve queda, congelamento ou reconexão.
6. Se não houver vídeo ou áudio entre os dois, quase sempre é a porta UDP 10000. Faça três coisas:
   - Revise o firewall da ETAPA 2.
   - Confira `VPS_PUBLIC_IP` no `.env`.
   - Rode `docker compose logs --tail=80 jvb | grep -iE 'ice|harvest|error'`.

## ETAPA 5 — Ligar o vídeo na plataforma (Lovable)
1. No terminal, mostre os valores:
   ```bash
   grep -E '^JITSI_APP_(ID|SECRET)=' /opt/jitsi/.env
   ```
2. No Lovable → **Cloud → Secrets**, crie ou atualize três segredos, copiando os valores do terminal (nunca pelo chat):
   - `JITSI_DOMAIN` = `meet.plantayraiz.com.br`
   - `JITSI_APP_ID` = valor do `.env`
   - `JITSI_APP_SECRET` = valor do `.env`
3. No chat do Lovable, envie exatamente:
   > Reimplante as funções consultation-video-token e doctor-pix-payout com o código atual do ramo main, sem alterar o código. Depois publique o site. Não mude nenhum outro arquivo.
4. Espere o Lovable confirmar e clique em **Publish/Update**, se ele pedir.

## ETAPA 6 — Relatório final para o Dr. Edilson (português simples, sem segredos)
- Chave do GitHub: trocada? Antiga apagada?
- Firewall UDP 10000: liberado?
- DNS `meet`: aponta para o IP certo?
- `docker compose ps`: os 4 serviços estão rodando?
- HTTPS: `200`, com certificado válido?
- Teste sem token: bloqueou?
- Teste de 45 minutos: completou sem queda? (Anote o horário de início e de fim e qualquer instabilidade.)
- Segredos `JITSI_*`: criados no Lovable? (Só os nomes.)
- Lovable: reimplantou as funções e publicou o site?
- Para desfazer: apagar os três segredos `JITSI_*` no Lovable (as consultas voltam ao meet.jit.si na hora) e rodar `cd /opt/jitsi && docker compose down`.
