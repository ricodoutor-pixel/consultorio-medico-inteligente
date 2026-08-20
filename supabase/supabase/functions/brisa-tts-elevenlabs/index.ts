// 🔊 Brisa TTS — ElevenLabs → Evolution WhatsApp Audio
// Recebe texto + telefone, gera áudio com voz Sarah, envia como narrated voice no WhatsApp,
// registra custo em brisa_audio_usage e respeita kill-switch global.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { encode as base64Encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { BRISA_VOICE_ID } from "../_shared/brisa-persona.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ElevenLabs Turbo v2.5 ≈ US$ 0.00018 / char → ~R$ 0.0009 / char @ R$ 5/USD
const COST_BRL_PER_CHAR = 0.0009;

interface TtsRequest {
  text: string;
  phone: string;
  contactId?: string | null;
  intent?: string;
  reason?: string;
  channel?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __unauth = requireServiceAuth(req, corsHeaders);
  if (__unauth) return __unauth;

  try {
    const ELEVEN_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!ELEVEN_KEY || !EVO_URL || !EVO_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "missing_credentials" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as TtsRequest;
    const { text, phone, contactId = null, intent = null, reason = null, channel = "whatsapp" } = body;

    if (!text || !phone) {
      return new Response(JSON.stringify({ ok: false, error: "text_and_phone_required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. KILL-SWITCH + ORÇAMENTO
    const { data: cfg } = await supabase
      .from("brisa_audio_config")
      .select("audio_enabled, monthly_budget_brl, paused_reason")
      .eq("id", true)
      .single();

    if (cfg && !cfg.audio_enabled) {
      return new Response(JSON.stringify({ ok: false, skipped: "audio_disabled", reason: cfg.paused_reason }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Conferir gasto do mês corrente
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { data: usage } = await supabase
      .from("brisa_audio_usage")
      .select("cost_brl")
      .gte("created_at", monthStart.toISOString());
    const spent = (usage || []).reduce((s, u: any) => s + Number(u.cost_brl || 0), 0);
    const budget = Number(cfg?.monthly_budget_brl || 300);
    if (spent >= budget) {
      // auto-desliga
      await supabase
        .from("brisa_audio_config")
        .update({ audio_enabled: false, paused_reason: `Budget atingido: R$ ${spent.toFixed(2)} / R$ ${budget.toFixed(2)}` })
        .eq("id", true);
      return new Response(JSON.stringify({ ok: false, skipped: "budget_exceeded", spent, budget }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. TTS — ElevenLabs (Sarah, multilingual v2 para PT-BR melhor)
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${BRISA_VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": ELEVEN_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed: 1.0 },
        }),
      },
    );

    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      await supabase.from("brisa_audio_usage").insert({
        contact_id: contactId, channel, phone, text_length: text.length,
        voice_id: BRISA_VOICE_ID, cost_brl: 0, intent, reason,
        success: false, error: `tts_${ttsRes.status}: ${err.slice(0, 200)}`,
      });
      return new Response(JSON.stringify({ ok: false, error: "tts_failed", status: ttsRes.status }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBuf = await ttsRes.arrayBuffer();
    const audioB64 = base64Encode(new Uint8Array(audioBuf));

    // 3. Envia via Evolution sendWhatsAppAudio (narrated voice)
    const phoneClean = phone.replace(/\D/g, "");
    const evoRes = await fetch(`${EVO_URL.replace(/\/$/, "")}/message/sendWhatsAppAudio/${EVO_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
      body: JSON.stringify({ number: phoneClean, audio: audioB64, delay: 800, encoding: true }),
    });
    const evoData = await evoRes.json().catch(() => ({}));

    const cost = +(text.length * COST_BRL_PER_CHAR).toFixed(4);

    await supabase.from("brisa_audio_usage").insert({
      contact_id: contactId, channel, phone: phoneClean, text_length: text.length,
      voice_id: BRISA_VOICE_ID, cost_brl: cost, intent, reason,
      success: evoRes.ok, error: evoRes.ok ? null : JSON.stringify(evoData).slice(0, 300),
    });

    return new Response(JSON.stringify({ ok: evoRes.ok, cost_brl: cost, evolution_id: evoData?.key?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    console.error("[brisa-tts] error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
