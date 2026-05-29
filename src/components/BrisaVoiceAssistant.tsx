import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import brisaPortrait from "@/assets/enf-brisa-portrait.jpeg";

interface Props {
  contextBpm?: number | null;
}

type Status = "idle" | "recording" | "processing" | "speaking" | "error";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    0: { transcript: string };
    isFinal?: boolean;
    length: number;
  }>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
  message?: string;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const LISTEN_MS = 5000;

export default function BrisaVoiceAssistant({ contextBpm }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sessionRef = useRef(0);
  const finalizedSessionRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const voiceReadyRef = useRef(false);
  const historyRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    const hydrateVoices = () => {
      window.speechSynthesis?.getVoices();
      voiceReadyRef.current = true;
    };

    hydrateVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", hydrateVoices);

    return () => {
      cleanupTimers();
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.removeEventListener?.("voiceschanged", hydrateVoices);
    };
  }, []);

  const cleanupTimers = () => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  };

  const getRecognitionCtor = () => {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  };

  const prepareUtterance = () => {
    const utterance = new SpeechSynthesisUtterance("");
    utterance.lang = "pt-BR";
    utterance.rate = 1.12;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    utterance.voice = pickVoice();
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    utteranceRef.current = utterance;
    return utterance;
  };

  // Prefer high-quality neural voices (Google/Microsoft Natural) over the metallic eSpeak default.
  const pickVoice = () => {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const ptVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith("pt"));
    if (ptVoices.length === 0) return null;

    const tiers: RegExp[] = [
      /google.*português.*brasil/i,        // Chrome Android/Desktop — natural neural
      /microsoft.*(francisca|thalita|brenda|leticia|yara).*online.*natural/i, // Edge Natural
      /microsoft.*(francisca|thalita|brenda|leticia|yara)/i,
      /(luciana|joana|fernanda|camila|helena|maria)/i,
      /female/i,
      /pt-br/i,
    ];

    for (const rule of tiers) {
      const found = ptVoices.find((v) => rule.test(v.name));
      if (found) return found;
    }
    return ptVoices[0];
  };

  const ensureMicrophonePermission = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    stream.getTracks().forEach((track) => track.stop());
  };

  const handleTap = async () => {
    if (status === "processing") return;

    if (status === "speaking") {
      window.speechSynthesis.cancel();
    }

    if (status === "recording") {
      recognitionRef.current?.stop();
      setStatus("processing");
      return;
    }

    const RecognitionCtor = getRecognitionCtor();
    if (!RecognitionCtor) {
      setErrorMsg("Seu navegador não liberou a escuta por voz. Abra no Chrome do Android e tente novamente.");
      setStatus("error");
      return;
    }

    try {
      setErrorMsg("");
      finalizedSessionRef.current = null;
      window.speechSynthesis.cancel();
      const utterance = prepareUtterance();
      if (!voiceReadyRef.current) pickVoice();

      await ensureMicrophonePermission();
      startRecognition(RecognitionCtor, utterance);
    } catch (error) {
      console.error("Brisa mic permission failed", error);
      setErrorMsg("Permita o uso do microfone para falar com a Brisa.");
      setStatus("error");
    }
  };

  const startRecognition = (RecognitionCtor: SpeechRecognitionCtor, utterance: SpeechSynthesisUtterance) => {
    cleanupTimers();

    const sessionId = Date.now();
    sessionRef.current = sessionId;

    const recognition = new RecognitionCtor();
    let heardText = "";
    let hardError = false;

    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      heardText = transcript;
      setStatus("processing");
      cleanupTimers();
      recognition.stop();
    };

    recognition.onerror = (event) => {
      console.error("Brisa recognition error", event.error, event.message);

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        hardError = true;
        finalizeError(sessionId, "Permita o uso do microfone para falar com a Brisa.");
        return;
      }

      if (event.error === "audio-capture") {
        hardError = true;
        finalizeError(sessionId, "Não consegui acessar o microfone do celular.");
        return;
      }

      if (event.error !== "no-speech" && event.error !== "aborted") {
        hardError = true;
        finalizeError(sessionId, "Não consegui te ouvir agora. Toque e fale novamente.");
      }
    };

    recognition.onend = () => {
      if (hardError) return;
      void finalizeConversation(sessionId, heardText, utterance);
    };

    recognitionRef.current = recognition;
    setStatus("recording");
    setCountdown(Math.ceil(LISTEN_MS / 1000));

    tickTimerRef.current = window.setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    stopTimerRef.current = window.setTimeout(() => {
      recognition.stop();
    }, LISTEN_MS);

    recognition.start();
  };

  const finalizeConversation = async (
    sessionId: number,
    transcript: string,
    utterance: SpeechSynthesisUtterance,
  ) => {
    if (finalizedSessionRef.current === sessionId) return;
    finalizedSessionRef.current = sessionId;
    cleanupTimers();
    recognitionRef.current = null;

    const cleanedTranscript = transcript.trim();
    if (!cleanedTranscript) {
      speakReply("Olá! Em que posso ajudar hoje?", utterance);
      return;
    }

    setStatus("processing");

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brisa-voice-chat`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          transcript: cleanedTranscript,
          contextBpm: contextBpm ?? null,
          history: historyRef.current.slice(-6),
          now: {
            iso: new Date().toISOString(),
            human: new Date().toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short", timeZone: "America/Sao_Paulo" }),
            timezone: "America/Sao_Paulo",
          },
        }),
      });

      if (response.status === 429) {
        finalizeError(sessionId, "Muitas perguntas seguidas. Espere alguns segundos.");
        return;
      }

      if (response.status === 402) {
        finalizeError(sessionId, "O serviço de voz está indisponível no momento.");
        return;
      }

      const data = await response.json();
      if (!response.ok || !data?.reply) {
        console.error("Brisa backend error", data);
        finalizeError(sessionId, "A Brisa não conseguiu responder agora. Toque e fale novamente.");
        return;
      }

      historyRef.current.push(
        { role: "user", content: cleanedTranscript },
        { role: "assistant", content: data.reply },
      );

      speakReply(data.reply, utterance);
    } catch (error) {
      console.error("Brisa conversation failed", error);
      finalizeError(sessionId, "A Brisa não conseguiu responder agora. Toque e fale novamente.");
    }
  };

  const speakReply = (text: string, utterance?: SpeechSynthesisUtterance) => {
    const activeUtterance = utterance || utteranceRef.current || prepareUtterance();
    activeUtterance.voice = pickVoice();
    activeUtterance.text = text;
    setStatus("speaking");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(activeUtterance);
  };

  const finalizeError = (sessionId: number, message: string) => {
    if (finalizedSessionRef.current === sessionId) return;
    finalizedSessionRef.current = sessionId;
    cleanupTimers();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    window.speechSynthesis.cancel();
    setErrorMsg(message);
    setStatus("error");
  };

  const isRecording = status === "recording";
  const isProcessing = status === "processing";
  const isSpeaking = status === "speaking";

  return (
    <Card className="border-primary/30 bg-card p-5">
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 animate-pulse">
          <Volume2 className="text-primary" size={22} />
        </div>
        <h3 className="text-lg font-bold">Fale com a Enfermeira Brisa</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Toque no botão, fale por até 5 segundos e a Brisa responde com voz no seu celular.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          aria-label="Toque para falar com a Brisa"
          onClick={handleTap}
          className={cn(
            "relative flex h-28 w-28 select-none items-center justify-center rounded-full transition-all active:scale-95",
            isRecording && "bg-destructive text-destructive-foreground ring-4 ring-destructive/30 scale-110",
            isProcessing && "bg-secondary text-secondary-foreground cursor-wait",
            isSpeaking && "bg-primary text-primary-foreground ring-4 ring-primary/30",
            status === "idle" && "bg-primary text-primary-foreground animate-pulse shadow-lg shadow-primary/20",
            status === "error" && "bg-destructive/90 text-destructive-foreground"
          )}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={42} />
          ) : isSpeaking ? (
            <Volume2 className="animate-pulse" size={42} />
          ) : (
            <Mic className={cn("size-[42px]", (status === "idle" || isRecording) && "animate-pulse")} />
          )}

          <span
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full border-4 animate-ping",
              isRecording ? "border-destructive/50" : "border-primary/40"
            )}
          />
        </button>

        <p className="min-h-[1.5rem] text-center text-sm font-medium">
          {status === "idle" && "Toque para falar com a Brisa"}
          {isRecording && `Ouvindo... ${countdown}s`}
          {isProcessing && "Brisa está pensando..."}
          {isSpeaking && "Brisa está respondendo..."}
          {status === "error" && (errorMsg || "Tente novamente")}
        </p>
      </div>

      <p className="mt-4 text-center text-[10px] text-muted-foreground">
        Ferramenta de bem-estar. Não substitui avaliação médica. Em emergência, ligue 192.
      </p>
    </Card>
  );
}