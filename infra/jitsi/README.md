# Jitsi próprio — vídeo das consultas

Substitui o `meet.jit.si` público, que derruba chamadas embutidas após poucos minutos e não oferece proteção de dados de saúde. Roda na VPS Hostinger que já hospeda a stack de `infra/vps-traefik` (Traefik, n8n, Evolution), sem custo por minuto.

## Como funciona

1. Paciente e médico abrem a consulta paga e em andamento.
2. As telas pedem a sala à função `consultation-video-token`. Ela confere se quem pede é o paciente ou o médico daquela consulta e devolve um token JWT de 2 horas. O médico entra como moderador.
3. O Jitsi aceita apenas esse token. Pessoas sem token não entram.
4. Sem os segredos configurados, a função devolve o `meet.jit.si`, como hoje. A troca não exige mudança de código.

## Requisitos

- VPS com pelo menos 2 vCPU e 4 GB de RAM livres. Cada consulta 1:1 usa pouco, mas o Jitsi reserva memória.
- Stack `infra/vps-traefik` no ar, com a rede Docker `proxy` e o resolvedor de certificados `le`.
- Registro DNS **A** `meet.plantayraiz.com.br` → IP público da VPS.
- Porta **UDP 10000** liberada no firewall da VPS (painel Hostinger → VPS → Firewall).

## Instalação (na VPS, por SSH)

```bash
cd /opt && git clone <repositório> plantayraiz && cd plantayraiz/infra/jitsi
cp .env.example .env
nano .env   # preencher VPS_PUBLIC_IP, JITSI_APP_SECRET, JICOFO_AUTH_PASSWORD, JVB_AUTH_PASSWORD; fixar JITSI_IMAGE_VERSION
mkdir -p data/{web,prosody/config,prosody/plugins-custom,jicofo,jvb}
docker compose up -d
docker compose ps        # 4 serviços "running"
curl -I https://meet.plantayraiz.com.br   # 200 com certificado válido
```

## Ligar na plataforma (Lovable Cloud → Secrets)

| Segredo | Valor |
|---|---|
| `JITSI_DOMAIN` | `meet.plantayraiz.com.br` |
| `JITSI_APP_ID` | o mesmo do `.env` (ex.: `plantayraiz`) |
| `JITSI_APP_SECRET` | o mesmo do `.env` |

Implante a função `consultation-video-token` e publique o site. O `public/_headers` já libera `meet.plantayraiz.com.br`.

## Verificação

- Sem login: `https://meet.plantayraiz.com.br/qualquer-sala` deve pedir autenticação.
- Numa consulta paga, médico e paciente se veem por mais de 10 minutos sem queda.
- Se um lado não tiver vídeo ou áudio, confira se a porta UDP 10000 está aberta e se o `VPS_PUBLIC_IP` está correto.

## Reverter

Apague os três segredos `JITSI_*` no Lovable Cloud. As consultas voltam ao `meet.jit.si` na hora.
