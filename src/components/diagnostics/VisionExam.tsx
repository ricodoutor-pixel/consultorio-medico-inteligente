import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Camera, CheckCircle2, ImageUp, Loader2, RefreshCcw, Stethoscope, UserPlus, Volume2, type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { speakBrisa, stopBrisaVoice } from '@/lib/brisa-voice';
import {
  analyzeExamImage, attentionToRiskLevel, captureVideoFrame, fileToJpegDataUrl, VisionExamError,
  type VisionAnalysis, type VisionAttention, type VisionExamType,
} from '@/lib/exam-vision';
import brisaImg from '@/assets/brisa-enfermeira.webp';
import { ComicManual } from './ComicManual';

type Phase = 'intro' | 'signup' | 'camera' | 'analyzing' | 'result' | 'error';

interface ManualStep { title: string; description: string; icon: string; colorClass: string }

export interface VisionExamProps {
  examType: VisionExamType;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Pontos curtos mostrados antes de começar (o que o exame faz e o que não faz). */
  notes: string[];
  manual: { title: string; brisaMessage: string; steps: ManualStep[] };
  facingMode: 'user' | 'environment';
  cameraHint: string;
  /** Segundos de contagem depois de tocar em fotografar (para a pessoa se posicionar). */
  countdownSeconds?: number;
  /** Campos extras da introdução, como articulação e dor. */
  introExtra?: React.ReactNode;
  getContext?: () => Record<string, unknown>;
  /** Avisos fixos acima do exame. */
  header?: React.ReactNode;
  onComplete?: () => void;
}

const ATTENTION_UI: Record<VisionAttention, { label: string; box: string; text: string; alert: boolean }> = {
  sem_sinais: { label: 'Sem sinais de alerta nesta foto', box: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', alert: false },
  acompanhar: { label: 'Vale acompanhar', box: 'bg-sky-50 border-sky-200', text: 'text-sky-700', alert: false },
  atencao: { label: 'Merece avaliação médica', box: 'bg-amber-50 border-amber-200', text: 'text-amber-700', alert: true },
  urgente: { label: 'Procure atendimento logo', box: 'bg-rose-50 border-rose-200', text: 'text-rose-700', alert: true },
  indeterminado: { label: 'Não foi possível avaliar', box: 'bg-slate-100 border-slate-200', text: 'text-slate-700', alert: false },
};

const ERROR_TEXT: Record<string, string> = {
  limite: 'Foram muitas análises em pouco tempo. Aguarde um minuto e tente de novo.',
  indisponivel: 'A análise não está disponível agora. Nenhum resultado foi gerado. Tente de novo em instantes.',
};

/** Fluxo único dos exames por foto: cadastro → câmera → leitura real da Brisa → orientação e médico. */
export function VisionExam(props: VisionExamProps) {
  const { examType, title, description, icon: Icon, notes, manual, facingMode, cameraHint, countdownSeconds = 0 } = props;
  const [phase, setPhase] = useState<Phase>('intro');
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [errorText, setErrorText] = useState('');
  const [cameraFailed, setCameraFailed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [saved, setSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => () => { stopCamera(); stopBrisaVoice(); }, []);

  // A tela da câmera pode montar antes ou depois de a câmera abrir: liga o vídeo nos dois casos.
  const attachVideo = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      void el.play().catch(() => {});
    }
  };

  const start = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setPhase('signup'); return; }
    setPhoto(null);
    setAnalysis(null);
    setCameraFailed(false);
    setCountdown(0);
    setPhase('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1920 } } });
      streamRef.current = stream;
      attachVideo(videoRef.current);
    } catch {
      setCameraFailed(true);
    }
  };

  const analyze = async (jpegDataUrl: string) => {
    stopCamera();
    setPhoto(jpegDataUrl);
    setSaved(false);
    setPhase('analyzing');
    try {
      const context = props.getContext?.() ?? {};
      const result = await analyzeExamImage(examType, jpegDataUrl, context);
      setAnalysis(result);
      setPhase('result');
      if (result.brisa_summary) speakBrisa(result.brisa_summary);

      // Só leitura feita em imagem válida entra no histórico do paciente.
      if (result.image_ok) {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user.id;
        if (userId) {
          const { error } = await supabase.from('diagnostic_exams').insert({
            user_id: userId,
            exam_type: examType,
            results: JSON.parse(JSON.stringify({ source: 'camera_image', context, measurements: result.measurements, observations: result.observations })),
            ai_diagnosis: JSON.parse(JSON.stringify({ ...result, human_supervision_required: true, review_status: 'pending_doctor_review' })),
            risk_level: attentionToRiskLevel(result.attention),
          });
          if (!error) setSaved(true);
        }
      }
    } catch (e) {
      if (e instanceof VisionExamError && e.code === 'login') { setPhase('signup'); return; }
      setErrorText(ERROR_TEXT[e instanceof VisionExamError ? e.code : 'indisponivel'] ?? ERROR_TEXT.indisponivel);
      setPhase('error');
    }
  };

  const shoot = () => {
    const frame = captureVideoFrame(videoRef.current);
    if (!frame) { toast.error('A câmera ainda não está pronta. Aguarde a imagem aparecer.'); return; }
    void analyze(frame);
  };

  const onCapturePress = () => {
    if (countdown > 0) return;
    if (!countdownSeconds) { shoot(); return; }
    setCountdown(countdownSeconds);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          shoot();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const dataUrl = await fileToJpegDataUrl(file);
    if (!dataUrl) { toast.error('Não consegui abrir essa foto. Escolha outra imagem.'); return; }
    void analyze(dataUrl);
  };

  const ui = analysis ? ATTENTION_UI[analysis.attention] : null;

  return (
    <div className="flex flex-col w-full h-full min-h-[500px] bg-slate-50 relative overflow-hidden rounded-xl border border-border shadow-sm">
      {props.header && <div className="p-4 pb-0">{props.header}</div>}
      <ComicManual title={manual.title} icon={Icon} brisaMessage={manual.brisaMessage} steps={manual.steps} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-6 pt-14 text-center flex-1 space-y-5">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20">
              <Icon className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">{description}</p>
            </div>
            <ul className="w-full max-w-sm space-y-2 text-left">
              {notes.map((n) => (
                <li key={n} className="flex items-start gap-2 bg-white p-3 rounded-xl border shadow-sm text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {n}
                </li>
              ))}
            </ul>
            {props.introExtra}
            <Button onClick={start} size="lg" className="w-full max-w-sm rounded-xl h-14 text-base shadow-lg shadow-primary/25">
              <Camera className="w-5 h-5 mr-2" /> Iniciar exame
            </Button>
          </motion.div>
        )}

        {phase === 'signup' && (
          <motion.div key="signup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-6 pt-14 text-center flex-1 space-y-5">
            <img src={brisaImg} alt="Enfermeira Brisa" className="w-24 h-24 rounded-full object-cover object-top border-4 border-primary/30" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Cadastre-se grátis para fazer o exame</h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Com o cadastro, a Enfª Brisa lê a sua foto, explica o resultado e guarda tudo em Meus Exames para o senhor ou a senhora mostrar ao médico. Leva menos de um minuto.
              </p>
            </div>
            <Button size="lg" className="w-full max-w-sm rounded-xl h-14 text-base shadow-lg shadow-primary/25" asChild>
              <Link to="/cadastro"><UserPlus className="w-5 h-5 mr-2" /> Criar meu cadastro grátis</Link>
            </Button>
            <Button variant="outline" className="w-full max-w-sm rounded-xl" asChild>
              <Link to="/login">Já tenho cadastro: entrar</Link>
            </Button>
          </motion.div>
        )}

        {phase === 'camera' && (
          <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col w-full flex-1 min-h-[500px] bg-black relative">
            {cameraFailed ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <p className="text-sm max-w-xs">Não consegui abrir a câmera. Libere a câmera no navegador ou envie uma foto da galeria.</p>
              </div>
            ) : (
              <video ref={attachVideo} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0" />
            )}
            <div className="absolute top-0 inset-x-0 bg-black/55 text-white text-xs text-center py-2 px-12">{cameraHint}</div>
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-8xl font-black text-white drop-shadow-lg">{countdown}</span>
              </div>
            )}
            <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-5 px-6">
              <Button variant="secondary" size="icon" aria-label="Voltar" className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white"
                onClick={() => { stopCamera(); setPhase('intro'); }}>
                <RefreshCcw className="w-6 h-6" />
              </Button>
              {!cameraFailed && (
                <Button onClick={onCapturePress} aria-label="Fotografar" disabled={countdown > 0}
                  className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 border-4 border-white/30">
                  <Camera className="w-8 h-8 text-white" />
                </Button>
              )}
              <Button variant="secondary" size="icon" aria-label="Enviar foto da galeria" className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white"
                onClick={() => fileRef.current?.click()}>
                <ImageUp className="w-6 h-6" />
              </Button>
            </div>
          </motion.div>
        )}

        {phase === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-8 text-center flex-1 bg-slate-900 text-white space-y-6">
            {photo && <img src={photo} alt="Foto enviada para análise" className="w-40 h-40 rounded-2xl object-cover border-2 border-primary/50" />}
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-lg">A Enfª Brisa está lendo a sua foto…</h3>
              <p className="text-xs text-slate-300 mt-1">Isso leva alguns segundos. A foto não fica guardada.</p>
            </div>
          </motion.div>
        )}

        {phase === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-6 text-center flex-1 space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
            <p className="text-sm text-slate-700 max-w-sm">{errorText}</p>
            <Button onClick={start} className="rounded-xl"><RefreshCcw className="w-4 h-4 mr-2" /> Tentar de novo</Button>
          </motion.div>
        )}

        {phase === 'result' && analysis && ui && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col p-5 pt-14 flex-1 overflow-y-auto bg-white space-y-4 text-left">
            <div className="flex items-center gap-3 pb-3 border-b">
              {photo && <img src={photo} alt="Foto analisada" className="w-14 h-14 rounded-xl object-cover border" />}
              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">Leitura da Enfª Brisa</h2>
                <p className="text-xs text-slate-500">{title} · {new Date(analysis.analyzed_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
            </div>

            {!analysis.image_ok ? (
              <div className="p-4 rounded-xl border bg-amber-50 border-amber-200 space-y-1">
                <p className="text-sm font-bold text-amber-800 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> A foto não serviu para o exame</p>
                <p className="text-xs text-amber-800">{analysis.image_problem}</p>
              </div>
            ) : (
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${ui.box}`}>
                <div>
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Resultado da triagem</p>
                  <p className={`text-base font-black ${ui.text}`}>{ui.label}</p>
                </div>
                {ui.alert ? <AlertTriangle className={`w-7 h-7 shrink-0 ${ui.text}`} /> : <CheckCircle2 className={`w-7 h-7 shrink-0 ${ui.text}`} />}
              </div>
            )}

            {analysis.brisa_summary && (
              <div className="flex gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <img src={brisaImg} alt="" className="w-10 h-10 rounded-full object-cover object-top shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 leading-relaxed">{analysis.brisa_summary}</p>
                  <button type="button" onClick={() => speakBrisa(analysis.brisa_summary)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <Volume2 className="w-3.5 h-3.5" /> Ouvir de novo
                  </button>
                </div>
              </div>
            )}

            {analysis.measurements.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis.measurements.map((m) => (
                  <div key={m.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">{m.label}</p>
                    <p className="text-sm text-slate-800">{m.value}</p>
                  </div>
                ))}
              </div>
            )}

            {analysis.observations.length > 0 && (
              <div>
                <p className="text-sm font-bold text-slate-800 mb-2">O que apareceu na foto</p>
                <ul className="space-y-1.5">
                  {analysis.observations.map((o) => (
                    <li key={o} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.orientation.length > 0 && (
              <div>
                <p className="text-sm font-bold text-slate-800 mb-2">Orientações</p>
                <ul className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1.5">
                  {analysis.orientation.map((o) => <li key={o} className="text-xs text-blue-900 leading-relaxed">• {o}</li>)}
                </ul>
              </div>
            )}

            <div className="p-4 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-3">
              <p className="text-sm font-bold text-slate-800 flex items-start gap-2">
                <Stethoscope className="w-5 h-5 text-primary shrink-0" /> {analysis.doctor_advice}
              </p>
              <Button className="w-full rounded-xl h-12 font-bold" asChild>
                <Link to="/profissionais">Consultar um médico agora</Link>
              </Button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Triagem feita por inteligência artificial a partir de uma foto. Não é diagnóstico e não substitui o exame presencial.
              {saved && ' Resultado guardado em Meus Exames.'}
            </p>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { stopBrisaVoice(); void start(); }}>
                <RefreshCcw className="w-4 h-4 mr-2" /> {analysis.image_ok ? 'Repetir' : 'Refazer a foto'}
              </Button>
              {props.onComplete && (
                <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => { stopBrisaVoice(); props.onComplete?.(); }}>
                  Ver outros exames
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
