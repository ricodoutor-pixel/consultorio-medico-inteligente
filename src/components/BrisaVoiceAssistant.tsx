import { useEffect, useRef, useState } from "react";
import { Mic, Loader2, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  contextBpm?: number | null;
}

type Status = "idle" | "recording" | "processing" | "speaking" | "error";

export default function BrisaVoiceAssistant({ contextBpm }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [lastReply, setLastReply] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg("");
    try {
      // pausa qualquer áudio anterior
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
    } catch (e) {
      console.error(e);
      setErrorMsg("Não consegui acessar o microfone. Permita o acesso e tente de novo.");
      setStatus("error");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleStop = async () => {
    setStatus("processing");
    try {
      const mr = mediaRecorderRef.current;
      const mime = mr?.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      if (blob.size < 1000) {
        setStatus("idle");
        setErrorMsg("Áudio muito curto. Segure o botão e fale.");
        return;
      }
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

      if (res.status === 429) {
        setErrorMsg("Muitas perguntas seguidas. Espere alguns segundos.");
        setStatus("error");
        return;
      }
      if (res.status === 402) {
        setErrorMsg("Serviço temporariamente indisponível. Tente mais tarde.");
        setStatus("error");
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        console.error("Brisa voice error:", data);
        setErrorMsg(
          data.error === "no_speech_detected"
            ? "Não entendi. Fale mais perto do microfone."
            : "A Brisa não conseguiu responder agora. Tente novamente.",
        );
        setStatus("error");
        return;
      }

      setLastTranscript(data.transcript || "");
      setLastReply(data.reply || "");
      historyRef.current.push(
        { role: "user", content: data.transcript || "" },
        { role: "assistant", content: data.reply || "" },
      );

      // toca a resposta
      const audioUrl = `data:${data.mimeType || "audio/mpeg"};base64,${data.audioBase64}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setStatus("speaking");
      audio.onended = () => setStatus("idle");
      audio.onerror = () => setStatus("idle");
      await audio.play().catch(() => setStatus("idle"));
    } catch (e) {
      console.error(e);
      setErrorMsg("Algo deu errado. Tente novamente.");
      setStatus("error");
    }
  };

  const isRecording = status === "recording";
  const isBusy = status === "processing" || status === "speaking";

  return (
    <Card className="p-5 bg-card border-primary/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <Volume2 className="text-primary" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-base">Fale com a Enfermeira Brisa</h3>
          <p className="text-xs text-muted-foreground">
            Segure o botão, faça sua pergunta, solte. Ela responde por voz.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          aria-label="Segure para falar com a Brisa"
          disabled={isBusy}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={() => isRecording && stopRecording()}
          onTouchStart={(e) => {
            e.preventDefault();
            startRecording();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopRecording();
          }}
          className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all select-none touch-none ${
            isRecording
              ? "bg-red-600 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.6)]"
              : isBusy
              ? "bg-primary/40 cursor-wait"
              : "bg-primary hover:bg-primary/90 active:scale-95"
          } disabled:opacity-70`}
        >
          {status === "processing" ? (
            <Loader2 className="text-white animate-spin" size={42} />
          ) : status === "speaking" ? (
            <Volume2 className="text-white animate-pulse" size={42} />
          ) : (
            <Mic className={`text-white ${isRecording ? "animate-pulse" : ""}`} size={42} />
          )}
          {isRecording && (
            <span className="absolute inset-0 rounded-full border-4 border-red-300/60 animate-ping" />
          )}
        </button>

        <p className="text-sm text-center font-medium min-h-[1.5rem]">
          {status === "idle" && "Segure e fale com a Brisa"}
          {status === "recording" && "Estou ouvindo… solte para enviar"}
          {status === "processing" && "Brisa está pensando…"}
          {status === "speaking" && "Brisa está respondendo…"}
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
      // remove "data:...;base64,"
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
