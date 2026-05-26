/**
 * Monitor Cardíaco PPG — mede BPM via câmera traseira + flash.
 * 100% local. Nenhum frame sai do dispositivo.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Heart, Camera, AlertTriangle, Share2, MessageCircle, RotateCw, Save, Brain, Activity, Gauge, Wind, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { butterworthBandpassPPG } from "@/lib/ppg-butterworth";
import { computeBiomarkers, stressLabel, recoveryLabel, autonomicLabel, type Biomarkers } from "@/lib/ppg-biomarkers";


type Phase = "idle" | "permission" | "measuring" | "result" | "error";
type Quality = "fraca" | "boa" | "otima";

const DURATION_S = 30;
const TARGET_FPS = 30;
const BRISA_WA = "5511991363154";

interface Result {
  bpm: number;
  hrv: number | null;
  quality: Quality;
  classification: "normal" | "atencao" | "critico";
  label: string;
  message: string;
}

function classify(bpm: number): Pick<Result, "classification" | "label" | "message"> {
  if (bpm < 50) return { classification: "critico", label: "Bradicardia", message: "Consulte um médico." };
  if (bpm < 60) return { classification: "atencao", label: "Abaixo do normal", message: "Pode ser normal em atletas." };
  if (bpm <= 100) return { classification: "normal", label: "Normal", message: "Seu coração está saudável 💚" };
  if (bpm <= 120) return { classification: "atencao", label: "Elevado", message: "Descanse e meça novamente." };
  return { classification: "critico", label: "Taquicardia", message: "Consulte um médico." };
}

function hrvMessage(hrv: number | null): string {
  if (hrv == null) return "";
  if (hrv < 20) return "Alto nível de estresse detectado.";
  if (hrv <= 50) return "Nível de estresse moderado.";
  return "Boa recuperação — sistema nervoso equilibrado.";
}

/** Detecta picos em sinal PPG após filtro Butterworth band-pass 0.5–3.5 Hz. */
function detectPeaks(signal: number[], fps: number): number[] {
  if (signal.length < fps * 3) return [];
  // Filtro Butterworth band-pass 4ª ordem (0.5–3.5 Hz, zero-phase)
  const sm = butterworthBandpassPPG(signal, fps);
  // Std para threshold dinâmico
  const mean = sm.reduce((a, b) => a + b, 0) / sm.length;
  const std = Math.sqrt(sm.reduce((a, b) => a + (b - mean) ** 2, 0) / sm.length);
  const thr = mean + std * 0.5;

  const minDist = Math.round(fps * 0.4); // 150 BPM máx
  const peaks: number[] = [];
  for (let i = 1; i < sm.length - 1; i++) {
    if (sm[i] > thr && sm[i] > sm[i - 1] && sm[i] >= sm[i + 1]) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDist) {
        peaks.push(i);
      }
    }
  }
  return peaks;
}

function computeBPM(signal: number[], fps: number): { bpm: number; hrv: number | null; quality: Quality } {
  const peaks = detectPeaks(signal, fps);
  const duration = signal.length / fps;
  const bpm = Math.round((peaks.length / duration) * 60);

  // HRV via SDNN dos intervalos RR (ms)
  let hrv: number | null = null;
  if (peaks.length >= 4) {
    const rr = peaks.slice(1).map((p, i) => ((p - peaks[i]) / fps) * 1000);
    const m = rr.reduce((a, b) => a + b, 0) / rr.length;
    hrv = Math.round(Math.sqrt(rr.reduce((a, b) => a + (b - m) ** 2, 0) / rr.length));
  }

  // Qualidade: baseada na regularidade dos intervalos
  let quality: Quality = "fraca";
  if (peaks.length >= 8 && hrv != null && hrv < 200) {
    quality = hrv < 80 ? "otima" : "boa";
  } else if (peaks.length >= 5) {
    quality = "boa";
  }
  return { bpm: Math.max(0, Math.min(220, bpm)), hrv, quality };
}

export default function MonitorCardiaco() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const signalRef = useRef<number[]>([]);
  const startedAtRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");
  const [elapsed, setElapsed] = useState(0);
  const [partialBpm, setPartialBpm] = useState<number | null>(null);
  const [signalAmp, setSignalAmp] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("ppg_history") ?? "[]");
    } catch {
      return [];
    }
  });

  const supported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try { (t as any).applyConstraints?.({ advanced: [{ torch: false }] }); } catch { /* noop */ }
        t.stop();
      });
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const drawWave = useCallback(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#04080F";
    ctx.fillRect(0, 0, w, h);
    const sig = signalRef.current;
    const slice = sig.slice(-Math.min(sig.length, TARGET_FPS * 8));
    if (slice.length < 2) return;
    const min = Math.min(...slice);
    const max = Math.max(...slice);
    const range = max - min || 1;
    setSignalAmp(range);
    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#22C55E";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    slice.forEach((v, i) => {
      const x = (i / (slice.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 10) - 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, []);

  const captureLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const W = 80, H = 60;
    canvas.width = W;
    canvas.height = H;

    const tick = () => {
      if (!streamRef.current) return;
      try {
        ctx.drawImage(video, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;
        let sum = 0, n = 0;
        for (let i = 1; i < data.length; i += 4) {
          sum += data[i]; // canal verde
          n++;
        }
        const avg = sum / n;
        signalRef.current.push(avg);
        // limita buffer
        if (signalRef.current.length > TARGET_FPS * (DURATION_S + 2)) {
          signalRef.current.shift();
        }
      } catch { /* frame skip */ }

      const now = performance.now();
      const sec = (now - startedAtRef.current) / 1000;
      setElapsed(sec);

      // Atualizações parciais
      if (signalRef.current.length === TARGET_FPS * 10 || signalRef.current.length === TARGET_FPS * 20) {
        const { bpm } = computeBPM(signalRef.current, TARGET_FPS);
        if (bpm > 30) setPartialBpm(bpm);
      }

      drawWave();

      if (sec >= DURATION_S) {
        finalize();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawWave]);

  const finalize = useCallback(async () => {
    const { bpm, hrv, quality } = computeBPM(signalRef.current, TARGET_FPS);
    const cls = classify(bpm);
    const res: Result = { bpm, hrv, quality, ...cls };
    stopAll();
    setResult(res);
    setPhase("result");

    const newHistory = [...history, bpm].slice(-5);
    setHistory(newHistory);
    try { localStorage.setItem("ppg_history", JSON.stringify(newHistory)); } catch { /* noop */ }

    trackEvent("monitor_concluido", { bpm, hrv: hrv ?? 0, quality });
    trackEvent(res.classification === "normal" ? "monitor_resultado_normal" : "monitor_resultado_atencao", { bpm });
  }, [history, stopAll]);

  const start = useCallback(async () => {
    if (!supported) {
      setError("Seu browser não suporta câmera. Abra no Chrome ou Safari atualizado.");
      setPhase("error");
      return;
    }
    setPhase("permission");
    setError("");
    setResult(null);
    setPartialBpm(null);
    signalRef.current = [];
    trackEvent("monitor_iniciado");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: TARGET_FPS },
        },
        audio: false,
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      try {
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
      } catch { /* alguns devices não suportam torch */ }

      const v = videoRef.current!;
      v.srcObject = stream;
      v.setAttribute("playsinline", "true");
      await v.play();

      startedAtRef.current = performance.now();
      setElapsed(0);
      setPhase("measuring");
      captureLoop();
    } catch (e: any) {
      console.warn("[PPG] permission error", e);
      trackEvent("monitor_permissao_negada");
      setError("Permissão de câmera negada. Ative a câmera nas configurações do navegador.");
      setPhase("error");
    }
  }, [captureLoop, supported]);

  const cancel = useCallback(() => {
    stopAll();
    setPhase("idle");
  }, [stopAll]);

  const reset = () => {
    setResult(null);
    setPhase("idle");
  };

  const saveToProfile = async () => {
    if (!result) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para salvar." });
      return;
    }
    const { error: insErr } = await supabase.from("medicoes_cardiacas").insert({
      user_id: user.id,
      bpm: result.bpm,
      hrv_sdnn: result.hrv,
      classificacao: result.classification,
      qualidade_sinal: result.quality,
      duracao_segundos: DURATION_S,
      device_info: { ua: navigator.userAgent } as any,
    });
    if (insErr) {
      toast({ title: "Erro ao salvar", description: insErr.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo no seu perfil 💚" });
    }
  };

  const shareResult = async () => {
    if (!result) return;
    const text = `Meu coração agora: ${result.bpm} BPM (${result.label}) — medido pelo Monitor Cardíaco da Planta y Raiz 🌿`;
    if (navigator.share) {
      try { await navigator.share({ text, title: "Monitor Cardíaco" }); } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copiado!" });
    }
  };

  const talkToBrisa = () => {
    if (!result) return;
    trackEvent("monitor_brisa_acionada", { bpm: result.bpm });
    const msg = encodeURIComponent(
      `Olá Brisa! Acabei de medir meu coração pelo Monitor Cardíaco. Resultado: ${result.bpm} BPM (${result.label}). O que você acha?`,
    );
    window.open(`https://wa.me/${BRISA_WA}?text=${msg}`, "_blank");
  };

  const goConsulta = () => {
    trackEvent("monitor_consulta_agendada", { bpm: result?.bpm ?? 0 });
    window.location.href = "/falar-com-especialista";
  };

  const bpmColor =
    result?.classification === "normal" ? "text-green-400"
    : result?.classification === "atencao" ? "text-yellow-400"
    : "text-red-400";

  return (
    <div className="w-full max-w-md mx-auto">
      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {phase === "idle" && (
        <Card className="p-6 bg-card/80 backdrop-blur border border-primary/20 text-center space-y-5">
          <div className="flex justify-center">
            <Heart className="text-primary animate-pulse" size={64} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Monitor Cardíaco</h2>
            <p className="text-sm text-muted-foreground">Planta y Raiz · Tecnologia PPG</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-left space-y-2">
            <div className="flex items-start gap-3">
              <Camera className="text-primary mt-1" size={18} />
              <p className="text-sm">Apoie o <strong>dedo indicador</strong> sobre a <strong>câmera traseira</strong> e o flash do seu celular.</p>
            </div>
            <p className="text-xs text-muted-foreground">Funciona melhor em ambientes com pouca luz ambiente.</p>
          </div>
          {!supported && (
            <p className="text-xs text-red-400">Seu navegador não suporta câmera. Use Chrome ou Safari atualizado.</p>
          )}
          <Button onClick={start} disabled={!supported} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-14 text-lg">
            Iniciar Medição
          </Button>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">PPG · usado em oxímetros profissionais</p>
        </Card>
      )}

      {phase === "permission" && (
        <Card className="p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p>Aguardando permissão da câmera…</p>
        </Card>
      )}

      {phase === "error" && (
        <Card className="p-6 text-center space-y-4 border-red-500/40">
          <AlertTriangle className="mx-auto text-red-400" size={40} />
          <p className="text-sm">{error}</p>
          <Button onClick={() => setPhase("idle")} variant="outline" className="w-full">Voltar</Button>
        </Card>
      )}

      {phase === "measuring" && (
        <Card className="p-5 space-y-4 bg-card/90 border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="text-red-400 animate-pulse" size={22} />
              <span className="text-sm font-semibold">Medindo…</span>
            </div>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {Math.max(0, Math.ceil(DURATION_S - elapsed))}s
            </span>
          </div>

          <canvas ref={waveRef} width={400} height={120} className="w-full h-28 rounded-md border border-primary/20" />

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Sinal:&nbsp;
              <span className={signalAmp > 15 ? "text-green-400" : signalAmp > 6 ? "text-yellow-400" : "text-red-400"}>
                {signalAmp > 15 ? "Ótimo" : signalAmp > 6 ? "Bom" : "Fraco"}
              </span>
            </span>
            {partialBpm && (
              <span className="text-primary font-bold">~{partialBpm} BPM</span>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">Mantenha o dedo firme e quieto. Não fale.</p>

          <Button onClick={cancel} variant="outline" size="sm" className="w-full">Cancelar</Button>
        </Card>
      )}

      {phase === "result" && result && (
        <Card className="p-6 space-y-5 bg-card/90 border border-primary/30">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Sua Frequência Cardíaca</p>
            <div className="flex items-end justify-center gap-2">
              <span className={`text-7xl font-black ${bpmColor} tabular-nums leading-none`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {result.bpm}
              </span>
              <span className="text-lg text-muted-foreground mb-2">BPM</span>
            </div>
            <p className={`mt-3 font-semibold ${bpmColor}`}>{result.label}</p>
            <p className="text-sm text-muted-foreground">{result.message}</p>
          </div>

          {result.hrv != null && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Variabilidade (HRV)</p>
              <p className="text-xl font-bold">{result.hrv} ms</p>
              <p className="text-xs text-muted-foreground mt-1">{hrvMessage(result.hrv)}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Qualidade do sinal: <strong className="text-foreground capitalize">{result.quality}</strong></span>
            <span>{DURATION_S}s</span>
          </div>

          {history.length > 1 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Últimas medições</p>
              <div className="flex items-end gap-1 h-12">
                {history.map((v, i) => {
                  const max = Math.max(...history, 100);
                  return (
                    <div key={i} className="flex-1 bg-primary/60 rounded-sm" style={{ height: `${(v / max) * 100}%` }} title={`${v} BPM`} />
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={reset} variant="outline" size="sm"><RotateCw size={14} /> Medir de novo</Button>
            <Button onClick={saveToProfile} variant="outline" size="sm"><Save size={14} /> Salvar</Button>
            <Button onClick={shareResult} variant="outline" size="sm"><Share2 size={14} /> Compartilhar</Button>
            <Button onClick={talkToBrisa} size="sm" className="bg-green-600 hover:bg-green-700 text-white"><MessageCircle size={14} /> Brisa</Button>
          </div>

          {result.classification !== "normal" && (
            <Button onClick={goConsulta} size="lg" className="w-full bg-red-500 hover:bg-red-600 text-white">
              Agendar consulta agora — R$ 30
            </Button>
          )}

          <p className="text-[10px] text-muted-foreground text-center">
            ⚠️ Ferramenta educativa, não substitui avaliação médica. Em emergência ligue <strong>192 (SAMU)</strong>.
          </p>
        </Card>
      )}
    </div>
  );
}
