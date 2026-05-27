import { useEffect, useRef, useState } from "react";
import { Mic, Loader2, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  contextBpm?: number | null;
}

type Status = "idle" | "recording" | "processing" | "speaking" | "error";

const RECORD_MS = 5000;

export default function BrisaVoiceAssistant({ contextBpm }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [countdown, setCountdown] = useState<number>(0);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [lastReply, setLastReply] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const historyRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);

  useEffect(() => {
    return () => {
      cleanupTimers();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const cleanupTimers = () => {
    if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
    if (tickTimerRef.current) { clearInterval(tickTimerRef.current); tickTimerRef.current = null; }
  };

  const handleTap = async () => {
    if (status === "processing" || status === "speaking") return;
    if (status === "recording") {
      // toque novamente para encerrar antes dos 5s
      stopRecording();
      return;
    }
    await startRecording();
  };

  const startRecording = async () => {
    setErrorMsg("");
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = handleStop;
      mr.start();
      mediaRecorderRef.current = mr;
      setStatus("recording");
      setCountdown(Math.ceil(RECORD_MS / 1000));

      // contador visual
      tickTimerRef.current = window.setInterval(() => {
        setCountdown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);

      // auto-stop em 5 segundos
      stopTimerRef.current = window.setTimeout(() => {
        stopRecording();
      }, RECORD_MS);
    } catch (e) {
      console.error(e);
      setErrorMsg("Preciso de permissão para usar o microfone e o auto-falante. Toque novamente e permita.");
      setStatus("error");
    }
  };

  const stopRecording = () => {
    cleanupTimers();
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleStop = async () => {
    setStatus("processing");
    try {
      const mr = mediaRecorderRef.current;
      const mime = mr?.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      const audioBase64 = await blobToBase64(blob);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brisa-voice-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          audioBase64,
          mimeType: mime,
          contextBpm: contextBpm ?? null,
          history: historyRef.current.slice(-6),
        }),
      });

      if (res.status === 429) { setErrorMsg("Muitas perguntas seguidas. Espere alguns segundos."); setStatus("error"); return; }
      if (res.status === 402) { setErrorMsg("Serviço temporariamente indisponível."); setStatus("error"); return; }

      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        console.error("Brisa voice error:", data);
        setErrorMsg("A Brisa não conseguiu responder. Toque e fale novamente.");
        setStatus("error");
        return;
      }

      setLastTranscript(data.transcript || "");
      setLastReply(data.reply || "");
      historyRef.current.push(
        { role: "user", content: data.transcript || "" },
        { role: "assistant", content: data.reply || "" },
      );

      const audioUrl = `data:${data.mimeType || "audio/mpeg"};base64,${data.audioBase64}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setStatus("speaking");
      audio.onended = () => setStatus("idle");
      audio.onerror = () => setStatus("idle");
      await audio.play().catch(() => setStatus("idle"));
    } catch (e) {
      console.error(e);
      setErrorMsg("Algo deu errado. Toque novamente.");
      setStatus("error");
    }
  };

  const isRecording = status === "recording";
  const isProcessing = status === "processing";
  const isSpeaking = status === "speaking";

  return (
    <Card className="p-5 bg-card border-primary/30">
      <div className="flex flex-col items-center text-center gap-2 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center animate-pulse">
          <Volume2 className="text-primary" size={22} />
        </div>
        <h3 className="font-bold text-lg">Fale com a Enfermeira Brisa</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Toque no botão e faça sua pergunta. A Brisa escuta 5 segundos e responde por voz.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          aria-label="Toque para falar com a Brisa"
          onClick={handleTap}
          disabled={isProcessing || isSpeaking}
          className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all select-none ${
            isRecording
              ? "bg-red-600 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.6)]"
              : isProcessing || isSpeaking
              ? "bg-primary/40 cursor-wait"
              : "bg-primary hover:bg-primary/90 active:scale-95 animate-pulse shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
          } disabled:opacity-70`}
        >
          {isProcessing ? (
            <Loader2 className="text-white animate-spin" size={42} />
          ) : isSpeaking ? (
            <Volume2 className="text-white animate-pulse" size={42} />
          ) : (
            <Mic className="text-white animate-pulse" size={42} />
          )}
          <span className={`absolute inset-0 rounded-full border-4 ${isRecording ? "border-red-300/60" : "border-primary/40"} animate-ping pointer-events-none`} />
        </button>

        <p className="text-sm text-center font-medium min-h-[1.5rem]">
          {status === "idle" && "Toque para falar com a Brisa"}
          {isRecording && `Ouvindo… ${countdown}s`}
          {isProcessing && "Brisa está pensando…"}
          {isSpeaking && "Brisa está respondendo…"}
          {status === "error" && (errorMsg || "Tente novamente")}
        </p>
      </div>

      {(lastTranscript || lastReply) && (
        <div className="mt-4 space-y-2 text-xs">
          {lastTranscript && (
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Você:</span> {lastTranscript}
            </p>
          )}
          {lastReply && (
            <p className="text-muted-foreground">
              <span className="font-semibold text-primary">Brisa:</span> {lastReply}
            </p>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-4 text-center">
        Ferramenta de bem-estar. Não substitui avaliação médica. Em emergência, ligue 192 (SAMU).
      </p>
    </Card>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
