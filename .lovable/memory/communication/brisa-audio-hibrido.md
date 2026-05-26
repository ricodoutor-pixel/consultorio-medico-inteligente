---
name: Brisa Audio Híbrido (ElevenLabs Sarah)
description: Decisão híbrida texto/áudio via shouldUseVoice(), edge brisa-tts-elevenlabs envia narrated voice no WhatsApp, kill-switch + orçamento mensal em brisa_audio_config, log de custo em brisa_audio_usage, painel em /admin/brisa-ceo.
type: feature
---

**Voz oficial:** Sarah (`EXAVITQu4vr4xnSDxMaL`), modelo `eleven_multilingual_v2`.

**shouldUseVoice() (em `_shared/brisa-persona.ts`):**
- ÁUDIO se: `senior` / `prefers_audio` / pediu áudio na msg / intent=`pay` / intent=`sexual` / resposta > 400 chars.
- TEXTO se: 22h-7h Brasília / lead profissional/b2b / < 40 chars / link puro.

**Fluxo:** `brisa-whatsapp` envia texto via Evolution → dispara fire-and-forget para `brisa-tts-elevenlabs` se `decision.useVoice` → TTS gera mp3 → Evolution `/message/sendWhatsAppAudio/{instance}` com base64 → registra em `brisa_audio_usage` (custo ~R$ 0.0009/char).

**Kill-switch:** `brisa_audio_config` (singleton). Auto-desliga quando gasto mensal ≥ `monthly_budget_brl` (default R$ 300). Admin pausa/ativa em `/admin/brisa-ceo` (componente `BrisaAudioPanel`).

**RLS:** apenas admin lê/edita config e usage. Edge usa service-role (bypassa RLS).
