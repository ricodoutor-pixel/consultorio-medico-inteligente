import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, Radio, Sparkles, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { functionErrorMessage } from "@/lib/function-error";
import {
  consentLine,
  formatElapsed,
  joinTranscript,
  pickAudioMimeType,
  SCRIBE_CHUNK_MS,
  SCRIBE_MAX_MS,
  type ScribeMode,
} from "@/lib/scribe";

interface Props {
  /** Recebe o rascunho SOAP (com a linha de consentimento) para acrescentar às notas. */
  onSoap: (text: string) => void;
}

/**
 * Escriba de IA: grava o ditado do médico ou a consulta inteira (microfone + áudio da aba da chamada, com
 * consentimento do paciente), transcreve em trechos de 4,5 min e gera o rascunho SOAP. O áudio não é guardado.
 */
export function ScribeRecorder({ onSoap }: Props) {
  const [mode, setMode] = useState<ScribeMode>("ditado");
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [segments, setSegments] = useState<{ index: number; text: string }[]>([]);
  // Espelho dos trechos: "Gerar SOAP" espera os envios pendentes e precisa ler o valor mais recente.
  const segmentsRef = useRef<{ index: number; text: string }[]>([]);
  const [pending, setPending] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const streamsRef = useRef<MediaStream[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const activeRef = useRef(false);
  const chunkIndexRef = useRef(0);
  const startedAtRef = useRef(0);
  const uploadChainRef = useRef<Promise<void>>(Promise.resolve());
  const timersRef = useRef<number[]>([]);
  const modeAtStartRef = useRef<ScribeMode>("ditado");

  useEffect(() => {
    void supabase.functions.invoke("doctor-scribe", { body: { action: "status" } }).then(({ data }) => {
      if (data && typeof data.remaining === "number") setRemaining(data.remaining);
    });
  }, []);

  const cleanup = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  useEffect(() => () => {
    activeRef.current = false;
    try {
      recorderRef.current?.stop();
    } catch {
      /* já parado */
    }
    cleanup();
  }, [cleanup]);

  const upload = useCallback((blob: Blob, index: number) => {
    setPending((n) => n + 1);
    uploadChainRef.current = uploadChainRef.current.then(async () => {
      const form = new FormData();
      form.append("action", "transcribe");
      form.append("file", new File([blob], `trecho-${index}.webm`, { type: blob.type || "audio/webm" }));
      const { data, error } = await supabase.functions.invoke("doctor-scribe", { body: form });
      if (error || typeof data?.text !== "string") {
        toast.error(await functionErrorMessage(error, `Não foi possível transcrever o trecho ${index + 1}.`));
      } else {
        segmentsRef.current = [...segmentsRef.current, { index, text: data.text }];
        setSegments(segmentsRef.current);
        if (typeof data.remaining === "number") setRemaining(data.remaining);
      }
      setPending((n) => n - 1);
    });
  }, []);

  const startChunk = useCallback(
    (stream: MediaStream, mimeType: string | undefined) => {
      const index = chunkIndexRef.current++;
      const parts: Blob[] = [];
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) parts.push(e.data);
      };
      rec.onstop = () => {
        if (parts.length) upload(new Blob(parts, { type: rec.mimeType || "audio/webm" }), index);
        const elapsedMs = Date.now() - startedAtRef.current;
        if (activeRef.current && elapsedMs < SCRIBE_MAX_MS) startChunk(stream, mimeType);
        else if (activeRef.current) {
          activeRef.current = false;
          setRecording(false);
          cleanup();
          toast.info("Gravação encerrada automaticamente aos 50 minutos.");
        }
      };
      rec.start();
      timersRef.current.push(window.setTimeout(() => rec.state !== "inactive" && rec.stop(), SCRIBE_CHUNK_MS));
    },
    [cleanup, upload],
  );

  const start = async () => {
    if (mode === "consulta" && !consent) {
      toast.error("Confirme que o paciente autorizou a gravação.");
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Este navegador não permite gravar áudio. Use o Chrome ou o Edge atualizados.");
      return;
    }
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamsRef.current = [mic];
      let stream: MediaStream = mic;
      if (mode === "consulta") {
        toast.info('Escolha ESTA aba e marque "Compartilhar áudio da aba" para gravar também a voz do paciente.');
        // preferCurrentTab (Chrome) sugere a própria aba, onde está a chamada de vídeo.
        const tab = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true, preferCurrentTab: true } as DisplayMediaStreamOptions);
        streamsRef.current.push(tab);
        tab.getVideoTracks().forEach((t) => t.stop());
        if (tab.getAudioTracks().length === 0) {
          toast.warning("O áudio da aba não foi compartilhado: só a sua voz será gravada.");
        } else {
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;
          const dest = ctx.createMediaStreamDestination();
          ctx.createMediaStreamSource(mic).connect(dest);
          ctx.createMediaStreamSource(new MediaStream(tab.getAudioTracks())).connect(dest);
          stream = dest.stream;
        }
      }
      const mimeType = pickAudioMimeType((t) => MediaRecorder.isTypeSupported(t));
      segmentsRef.current = [];
      setSegments([]);
      chunkIndexRef.current = 0;
      modeAtStartRef.current = mode;
      startedAtRef.current = Date.now();
      activeRef.current = true;
      setRecording(true);
      setElapsed(0);
      startChunk(stream, mimeType);
    } catch {
      cleanup();
      toast.error("Não foi possível acessar o microfone. Permita o acesso no navegador.");
    }
  };

  const stop = () => {
    activeRef.current = false;
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    } catch {
      /* já parado */
    }
    setRecording(false);
    cleanup();
  };

  useEffect(() => {
    if (!recording) return;
    const t = window.setInterval(() => setElapsed(Date.now() - startedAtRef.current), 1000);
    return () => window.clearInterval(t);
  }, [recording]);

  const transcript = joinTranscript(segments);

  const generate = async () => {
    await uploadChainRef.current;
    const text = joinTranscript(segmentsRef.current);
    if (text.length < 20) {
      toast.error("A transcrição ficou curta demais. Grave um pouco mais.");
      return;
    }
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("doctor-scribe", { body: { action: "soap", transcript: text } });
    setGenerating(false);
    if (error || typeof data?.soap !== "string") {
      toast.error(await functionErrorMessage(error, "Não foi possível gerar o SOAP agora."));
      return;
    }
    if (typeof data.remaining === "number") setRemaining(data.remaining);
    onSoap(`${consentLine(modeAtStartRef.current, new Date())}\n${data.soap}`);
    toast.success("Rascunho SOAP inserido nas notas. Revise antes de salvar.");
  };

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-foreground inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" /> Escriba de IA
        </p>
        {remaining !== null && <Badge variant="outline" className="text-[10px]">{remaining} usos hoje</Badge>}
      </div>

      {!recording && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={mode === "ditado" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setMode("ditado")}>
            Ditar resumo
          </Button>
          <Button size="sm" variant={mode === "consulta" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setMode("consulta")}>
            Gravar a consulta
          </Button>
        </div>
      )}

      {!recording && mode === "consulta" && (
        <label className="flex items-start gap-2 text-xs text-foreground">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
          <span>
            O paciente foi informado e <strong>autorizou</strong> a gravação da consulta para transcrição por IA. O áudio
            não é armazenado; o consentimento fica registrado no prontuário.
          </span>
        </label>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!recording ? (
          <Button size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => void start()} disabled={remaining === 0}>
            <Mic className="h-3.5 w-3.5 mr-1" /> Iniciar gravação
          </Button>
        ) : (
          <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={stop}>
            <Square className="h-3.5 w-3.5 mr-1" /> Parar ({formatElapsed(elapsed)})
          </Button>
        )}
        {recording && (
          <span className="text-xs text-red-600 inline-flex items-center gap-1">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> Gravando
          </span>
        )}
        {pending > 0 && (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcrevendo {pending} trecho(s)...
          </span>
        )}
        {!recording && transcript && (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void generate()} disabled={generating || pending > 0}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
            Gerar SOAP
          </Button>
        )}
      </div>

      {transcript && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">Ver transcrição ({transcript.length} caracteres)</summary>
          <p className="mt-2 whitespace-pre-wrap text-foreground/80 max-h-48 overflow-y-auto">{transcript}</p>
        </details>
      )}
    </div>
  );
}
