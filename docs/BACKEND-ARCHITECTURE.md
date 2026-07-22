# 🌿 Planta y Raiz — Arquitetura Backend (2026)

> **Fonte da verdade da inteligência da clínica.**
> Toda lógica de telemedicina, bot da Enfermeira Brisa e monitoramento vive **exclusivamente** nas Supabase Edge Functions. O frontend é apresentação e orquestração de UX — nunca gera tokens, nunca chama provedores externos direto.

---

## 1. Telemedicina (Jitsi / JaaS 8x8)

Fluxo E2EE em conformidade com **CFM 2.314/2022** e LGPD. O frontend **não gera JWT Jitsi**.

### `POST /functions/v1/create-video-room` (médico)
- **Auth:** JWT do Supabase do médico.
- **Body:** `{ consultationId: uuid, appointmentId?: uuid }`
- **Resposta canônica:**
  ```json
  { "roomName": "plr-<hash>", "secureToken": "<token>", "patientAccessPath": "/sala/<token>" }
  ```
- **Compat legado (ainda emitido):** `room_name`, `room_url`, `jitsi_config` — o cliente atual (`VideoCall.tsx`) lê ambos os formatos até a migração completa.
- **Responsabilidade:** cria/renova `telemed_sessions`, define `expires_at` (4h), habilita lobby + E2EE, entrega `secureToken` que o médico repassa ao paciente.

### `POST /functions/v1/join-video-room` (médico ou paciente)
- **Auth:** JWT do Supabase (médico) **ou** `secureToken` no body (paciente).
- **Body:** `{ consultationId: uuid, token: string, as: "patient" | "doctor" }`
- **Resposta:** `{ jwt, roomName, domain }`
- **Responsabilidade:** valida o token, gera JWT Jitsi final com claims corretos (moderador vs guest), devolve `domain` com prefixo do tenant JaaS quando aplicável.

### Regras invioláveis do frontend
1. **Nunca** importar `jose`, `SignJWT` ou similar para gerar JWT do Jitsi.
2. **Nunca** compor `roomName` no cliente — usar exatamente o valor retornado pelo backend.
3. `JitsiMeetExternalAPI` recebe `domain` e `roomName` **como vieram** — em JaaS 8x8, o `roomName` já contém o prefixo do tenant.
4. `secureToken` do paciente é entregue via WhatsApp (Brisa) ou link direto — não expor em query string pública sem TTL.

---

## 2. Bot WhatsApp — Enfermeira Brisa 3.4

Toda inteligência conversacional saiu do frontend e vive em Edge Functions.

| Função | Papel |
| --- | --- |
| `brisa-bot` | Cérebro. Gemini 1.5 flash/pro com **System Prompt Master Concierge**. 5 fluxos: Pacientes, Médicos (B2B), Lojistas, Notificações do Sistema, Assistência Executiva (Dr. Edilson). |
| `brisa-waha-connect` | Webhook público da WAHA. Roteia payloads para `brisa-bot`. |
| `whatsapp-brisa-bot` | Cadeia de envio com fallback: **WAHA → Evolution → Twilio**. |
| `brisa-send-now` / `brisa-test-send` | Disparo manual (admin autenticado). |

**Frontend só lê** `whatsapp_messages` para exibir histórico no painel administrativo. Não envia, não interpreta, não escala.

---

## 3. Monitoramento de Sistema

### `GET /functions/v1/brisa-health-check`
Retorna status agregado (verde/amarelo/vermelho) de:
- Conexão WAHA / Evolution / Twilio
- Banco de dados
- Chaves das IAs (Gemini, Lovable Gateway)
- Última execução do bot

Consumido pelo componente `src/components/admin/BrisaHealthChecklist.tsx` no painel `/admin`.

---

## 4. Contratos frontend ↔ backend (resumo)

| Domínio | Componente | Edge Function |
| --- | --- | --- |
| Sala de vídeo (médico) | `src/components/VideoCall.tsx` | `create-video-room` |
| Sala de vídeo (paciente) | `src/pages/SalaEspera.tsx` | `join-video-room` (via `secureToken`) |
| Embed Jitsi | `src/components/consultation/JitsiRoom.tsx` | — (recebe `roomName` + `jwt` já prontos) |
| Health status | `src/components/admin/BrisaHealthChecklist.tsx` | `brisa-health-check` |
| Histórico WhatsApp | Painel `/admin` | leitura direta em `whatsapp_messages` |

---

## 5. Deploy & GitHub

- **Edge Functions:** deploy automático a cada push (Lovable → Supabase).
- **Sync GitHub:** two-way. Toda mudança no editor Lovable gera commit no repositório conectado sem ação manual.
- **Secrets críticos** (não versionar): `JITSI_APP_ID`, `JITSI_SECRET`, `GEMINI_API_KEY`, `WAHA_API_KEY`, `LOVABLE_API_KEY`, `TWILIO_*`.

---

_Última atualização: alinhamento pós-migração backend consolidada (Telemedicina + WAHA + Gemini via Edge Functions)._
