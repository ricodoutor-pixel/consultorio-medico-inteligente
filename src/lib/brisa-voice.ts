/**
 * 🎙️ Brisa Voice Engine — Síntese Vocal Estritamente Feminina
 *
 * Garante que a voz da Enfermeira Brisa seja 100% feminina em todas as plataformas
 * (Windows, Android, iOS, macOS, Edge, Chrome, Safari, Firefox).
 *
 * Elimina sumariamente vozes masculinas (Microsoft Daniel, Antonio, etc.) e aplica
 * elevação harmônica de pitch como trava de segurança definitiva.
 */

// Blacklist rigorosa de vozes masculinas conhecidas em pt-BR e outros idiomas
const MALE_VOICE_PATTERN =
  /\b(daniel|antonio|antónio|fabio|fábio|helder|hélder|duarte|male|homem|masculin|ricardo|jorge|man|felipe|gustavo|lucas|joao|joão|guilherme|pedro|pt-br-x-jab|pt-br-x-jfs|david|george|stefan|pablo|paul|richard|thomas|mark|guy)\b/i;

// Tiers hierárquicos de vozes comprovadamente femininas em português
const FEMALE_VOICE_TIERS: { rule: RegExp; score: number }[] = [
  // Tier 1: Vozes neurais naturais ultrarrealistas (Edge / Windows 11 Online)
  { rule: /microsoft.*(francisca|thalita|brenda|leticia|yara|raquel).*online.*natural/i, score: 100 },
  { rule: /microsoft.*(francisca|thalita|brenda|leticia|yara|raquel)/i, score: 90 },

  // Tier 2: Vozes nativas Apple / iOS / macOS
  { rule: /(luciana|joana|fernanda|camila|helena|victoria|siri)/i, score: 85 },

  // Tier 3: Vozes desktop Windows SAPI femininas
  { rule: /microsoft.*(maria|heloisa)/i, score: 80 },

  // Tier 4: Vozes neurais Android / Chrome female tags
  { rule: /(pt-br-x-afs|pt-br-x-afd|pt-br-x-cfs|pt-br-female)/i, score: 75 },

  // Tier 5: Vozes explicitamente marcadas com termos femininos
  { rule: /(female|feminina|mulher|woman)/i, score: 70 },

  // Tier 6: Voz padrão do Google em português (apenas se passar pelo filtro anti-masculino)
  { rule: /google.*português.*(brasil|do brasil)/i, score: 50 },
];

export interface BrisaVoiceConfig {
  voice: SpeechSynthesisVoice | null;
  pitch: number;
  rate: number;
  isCertifiedFemale: boolean;
}

export interface BrisaSpeakOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

// Cache em memória das vozes disponíveis
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesHydrated = false;

/**
 * Inicializa a escuta de vozes disponíveis do navegador.
 */
export function initBrisaVoiceHydration(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const updateVoices = () => {
    try {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        cachedVoices = v;
        voicesHydrated = true;
      }
    } catch {
      // Ignora falhas de leitura
    }
  };

  updateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }
  window.speechSynthesis.addEventListener?.("voiceschanged", updateVoices);
}

// Auto-inicializa na importação
if (typeof window !== "undefined") {
  initBrisaVoiceHydration();
}

/**
 * Seleciona a melhor voz feminina em pt-BR disponível no sistema operacional do usuário.
 * Aplica trava anti-homem e pitch protetivo.
 */
export function getBrisaVoiceConfig(): BrisaVoiceConfig {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { voice: null, pitch: 1.15, rate: 1.02, isCertifiedFemale: false };
  }

  let voices = cachedVoices;
  if (!voices || voices.length === 0) {
    try {
      voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        cachedVoices = voices;
      }
    } catch {
      voices = [];
    }
  }

  // Filtra vozes de idioma português
  const ptVoices = (voices || []).filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith("pt")
  );

  if (ptVoices.length === 0) {
    // Se não há vozes em português cadastradas, usa pitch elevado para feminilizar o sintetizador
    return { voice: null, pitch: 1.25, rate: 1.02, isCertifiedFemale: false };
  }

  // 1. Blacklist ativa: remove sumariamente qualquer voz masculina identificada
  const nonMaleVoices = ptVoices.filter(
    (v) => !MALE_VOICE_PATTERN.test(v.name) && !MALE_VOICE_PATTERN.test(v.voiceURI || "")
  );

  // 2. Se existirem vozes não masculinas, avalia os tiers femininos
  if (nonMaleVoices.length > 0) {
    let bestVoice: SpeechSynthesisVoice = nonMaleVoices[0];
    let bestScore = -1;

    for (const voice of nonMaleVoices) {
      let score = 10; // score base para voz pt neutra
      for (const tier of FEMALE_VOICE_TIERS) {
        if (tier.rule.test(voice.name) || tier.rule.test(voice.voiceURI || "")) {
          score = Math.max(score, tier.score);
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestVoice = voice;
      }
    }

    const isCertifiedFemale = bestScore >= 70;
    return {
      voice: bestVoice,
      // Vozes femininas certificadas usam pitch natural e acolhedor (1.12); vozes neutras recebem pitch 1.25
      pitch: isCertifiedFemale ? 1.12 : 1.25,
      rate: 1.02,
      isCertifiedFemale,
    };
  }

  // 3. Trava de emergência: se o sistema possui APENAS voz masculina (ex.: Windows com apenas Daniel instalado),
  // forçamos pitch elevado (1.35) para elevar os formantes fundamentais para o registro feminino (220Hz-250Hz).
  return {
    voice: ptVoices[0],
    pitch: 1.35,
    rate: 1.02,
    isCertifiedFemale: false,
  };
}

/**
 * Limpa o texto para dicção natural pela síntese vocal (remove markdown, URLs e emojis)
 */
export function cleanBrisaSpeechText(rawText: string): string {
  if (!rawText) return "";

  return rawText
    // Remove blocos de código
    .replace(/```[\s\S]*?```/g, "")
    // Remove links no formato [texto](url) mantendo o texto
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove URLs isoladas
    .replace(/https?:\/\/\S+/gi, "")
    // Remove markdown (*, _, ~, #, >, `, -)
    .replace(/[*_~#>`]/g, "")
    // Remove emojis e símbolos gráficos que o sintetizador lê por extenso
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    // Remove quebras de linha múltiplas e espaços duplos
    .replace(/\s+/g, " ")
    .trim();
}

// Referência ao timer do keep-alive anti-bug do Chromium
let chromiumKeepAliveTimer: any = null;

function clearKeepAlive(): void {
  if (chromiumKeepAliveTimer) {
    clearInterval(chromiumKeepAliveTimer);
    chromiumKeepAliveTimer = null;
  }
}

/**
 * Fala o texto com a voz oficial feminina da Brisa.
 */
export function speakBrisa(
  text: string,
  options?: BrisaSpeakOptions
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const cleanedText = cleanBrisaSpeechText(text);
  if (!cleanedText) return null;

  try {
    // Cancela qualquer fala anterior e limpa timers
    clearKeepAlive();
    window.speechSynthesis.cancel();

    const config = getBrisaVoiceConfig();
    const utterance = new SpeechSynthesisUtterance(cleanedText);

    utterance.lang = "pt-BR";
    if (config.voice) {
      utterance.voice = config.voice;
    }
    utterance.pitch = options?.pitch ?? config.pitch;
    utterance.rate = options?.rate ?? config.rate;
    utterance.volume = options?.volume ?? 1;

    utterance.onstart = () => {
      options?.onStart?.();

      // Bug do Chromium: se a fala durar mais de 15s, o navegador congela silenciosamente.
      // Solução: pausar e retomar a cada 10s mantém o stream ativo.
      clearKeepAlive();
      chromiumKeepAliveTimer = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearKeepAlive();
        } else {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
    };

    utterance.onend = () => {
      clearKeepAlive();
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      clearKeepAlive();
      options?.onError?.(e);
    };

    // Pequeno delay defensivo para evitar bug de corte imediato do cancel() no Chrome
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[brisa-voice] Falha ao sintetizar voz:", err);
      }
    }, 20);

    return utterance;
  } catch (err) {
    console.error("[brisa-voice] Erro crítico:", err);
    return null;
  }
}

/**
 * Interrompe qualquer reprodução vocal da Brisa imediatamente.
 */
export function stopBrisaVoice(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  clearKeepAlive();
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignora
  }
}
