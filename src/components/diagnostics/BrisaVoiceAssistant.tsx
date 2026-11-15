import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, X, Send, Sparkles, AudioLines, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { speakBrisa, stopBrisaVoice } from '@/lib/brisa-voice';
import { brisaLinksFor, type BrisaLink } from '@/lib/brisa-links';

import brisaImg from '@/assets/brisa-enfermeira.webp';

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';
type Turn = { role: 'user' | 'assistant'; content: string };

/** Pausa na fala que encerra a escuta (a pessoa parou de falar). */
const END_OF_SPEECH_MS = 1100;
/** Tempo máximo esperando a pessoa começar a falar. */
const NO_SPEECH_MS = 8000;

const SUGGESTIONS = [
  'Como funciona o exame de fundo de olho?',
  'Como meço meus batimentos pelo celular?',
  'Quais exames eu posso fazer aqui?',
  'Como marco uma consulta com um médico?',
  'Quero me cadastrar',
];

const PHASE_LABEL: Record<Phase, string> = {
  idle: 'Toque no microfone para falar',
  listening: 'Estou ouvindo…',
  thinking: 'Só um instante…',
  speaking: 'Brisa está falando',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- API de voz do navegador sem tipos oficiais
type SpeechRecognitionLike = any;

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Luz colorida no rodapé da tela, que reage ao estado da conversa. */
function Aurora({ phase }: { phase: Phase }) {
  const active = phase !== 'idle';
  const speed = phase === 'listening' ? 1.6 : phase === 'speaking' ? 2.4 : 4.5;
  const blobs = [
    { color: 'bg-sky-500', left: '-10%', delay: 0 },
    { color: 'bg-violet-500', left: '18%', delay: 0.4 },
    { color: 'bg-fuchsia-500', left: '46%', delay: 0.8 },
    { color: 'bg-emerald-400', left: '72%', delay: 0.2 },
  ];
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] overflow-hidden" aria-hidden>
      {blobs.map((b) => (
        <motion.div
          key={b.color}
          className={`absolute bottom-[-35%] h-[70%] w-[45%] rounded-full blur-[90px] ${b.color}`}
          style={{ left: b.left }}
          animate={{
            opacity: active ? [0.35, 0.75, 0.35] : 0.22,
            scale: active ? [1, phase === 'listening' ? 1.35 : 1.18, 1] : 1,
            y: active ? [0, -30, 0] : 0,
          }}
          transition={{ duration: speed, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
        />
      ))}
    </div>
  );
}

/** Barras que se movem enquanto a Brisa escuta ou fala. */
function VoiceBars({ phase }: { phase: Phase }) {
  const moving = phase === 'listening' || phase === 'speaking';
  return (
    <div className="flex h-10 items-center justify-center gap-1.5" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-white/90"
          animate={{ height: moving ? [8, 34 - Math.abs(2 - i) * 6, 8] : phase === 'thinking' ? [8, 14, 8] : 8 }}
          transition={{
            duration: phase === 'listening' ? 0.55 : phase === 'speaking' ? 0.8 : 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.09,
          }}
        />
      ))}
    </div>
  );
}

export const BrisaVoiceAssistant = ({ activeExam }: { activeExam?: string }) => {
  const [open, setOpen] = useState(false);
  const [phase, setPhaseState] = useState<Phase>('idle');
  const [heard, setHeard] = useState('');
  const [reply, setReply] = useState('');
  const [typed, setTyped] = useState('');
  const [notice, setNotice] = useState('');
  const [links, setLinks] = useState<BrisaLink[]>([]);
  const signedInRef = useRef(false);

  const openRef = useRef(false);
  const phaseRef = useRef<Phase>('idle');
  const heardRef = useRef('');
  const historyRef = useRef<Turn[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const activeExamRef = useRef(activeExam);
  activeExamRef.current = activeExam;

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopRecognition = (abort = false) => {
    clearTimer();
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      if (abort) rec.abort();
      else rec.stop();
    } catch {
      // já parado
    }
  };

  // startListening e ask se chamam em sequência (ouvir → responder → ouvir de novo).
  const startListeningRef = useRef<() => void>(() => {});

  const speak = useCallback(
    (text: string, listenAfter: boolean) => {
      setPhase('speaking');
      const finish = () => {
        if (!openRef.current || phaseRef.current !== 'speaking') return;
        if (listenAfter) startListeningRef.current();
        else setPhase('idle');
      };
      const utterance = speakBrisa(text, {
        onEnd: finish,
        onError: () => {
          if (openRef.current && phaseRef.current === 'speaking') setPhase('idle');
        },
      });
      // Navegador sem voz: a resposta fica só na tela.
      if (!utterance) setPhase('idle');
    },
    [setPhase],
  );

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q) return;
      const requestId = ++requestRef.current;
      stopBrisaVoice();
      setNotice('');
      setHeard(q);
      setReply('');
      setLinks([]);
      setPhase('thinking');

      let answer = '';
      let failed = false;
      try {
        const { data, error } = await supabase.functions.invoke('brisa-voice-chat', {
          body: {
            transcript: q,
            history: historyRef.current.slice(-8),
            activeExam: activeExamRef.current || undefined,
            now: { human: new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' }) },
          },
        });
        if (error) throw error;
        answer = String(data?.reply || '').trim();
        if (!answer) throw new Error('empty_reply');
      } catch {
        failed = true;
        answer = 'Não consegui me conectar agora. Pode repetir a pergunta, por favor?';
      }

      if (requestId !== requestRef.current || !openRef.current) return;
      if (!failed) {
        historyRef.current = [
          ...historyRef.current,
          { role: 'user' as const, content: q },
          { role: 'assistant' as const, content: answer },
        ].slice(-10);
      }
      setReply(answer);
      // Atalho para o que a pessoa pediu; visitante sem conta sempre vê o convite ao cadastro.
      const found = brisaLinksFor(q);
      const hasSignup = found.some((l) => l.to.startsWith('/cadastro'));
      setLinks(!signedInRef.current && !hasSignup ? [...found.slice(0, 2), { to: '/cadastro', label: 'Criar meu cadastro grátis' }] : found);
      speak(answer, !failed);
    },
    [setPhase, speak],
  );

  const startListening = useCallback(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setNotice('Este navegador não reconhece voz. Escreva sua pergunta no campo abaixo.');
      setPhase('idle');
      return;
    }
    stopBrisaVoice();
    stopRecognition(true);
    requestRef.current++;
    heardRef.current = '';
    setNotice('');

    const rec = new Recognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'pt-BR';

    rec.onstart = () => {
      setPhase('listening');
      setHeard('');
      clearTimer();
      timerRef.current = setTimeout(() => stopRecognition(), NO_SPEECH_MS);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let text = '';
      let isFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      heardRef.current = text;
      setHeard(text);
      if (text.trim()) { setReply(''); setLinks([]); }
      clearTimer();
      if (isFinal) stopRecognition();
      else timerRef.current = setTimeout(() => stopRecognition(), END_OF_SPEECH_MS);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setNotice('Permita o uso do microfone no navegador para conversar por voz, ou escreva sua pergunta abaixo.');
      } else if (event?.error === 'network') {
        setNotice('Sem conexão para ouvir sua voz. Escreva sua pergunta abaixo.');
      }
    };

    rec.onend = () => {
      clearTimer();
      if (recognitionRef.current !== rec) return;
      recognitionRef.current = null;
      if (!openRef.current) return;
      const question = heardRef.current.trim();
      if (question.length > 1) void ask(question);
      else if (phaseRef.current === 'listening') setPhase('idle');
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      recognitionRef.current = null;
      setPhase('idle');
    }
  }, [ask, setPhase]);
  startListeningRef.current = startListening;

  const openWith = (question?: string) => {
    openRef.current = true;
    historyRef.current = [];
    setHeard('');
    setReply('');
    setLinks([]);
    setNotice('');
    setOpen(true);
    void supabase.auth.getSession().then(({ data }) => { signedInRef.current = Boolean(data.session); });
    if (question) void ask(question);
    else startListening();
  };

  const close = useCallback(() => {
    openRef.current = false;
    requestRef.current++;
    stopRecognition(true);
    recognitionRef.current = null;
    stopBrisaVoice();
    setPhase('idle');
    setOpen(false);
  }, [setPhase]);

  const onMicPress = () => {
    if (phaseRef.current === 'listening') stopRecognition();
    else startListening();
  };

  const onSubmitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    const q = typed.trim();
    if (!q) return;
    setTyped('');
    stopRecognition(true);
    recognitionRef.current = null;
    void ask(q);
  };

  // Tela cheia: trava a rolagem da página e fecha com Esc.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  useEffect(
    () => () => {
      openRef.current = false;
      stopRecognition(true);
      stopBrisaVoice();
    },
    [],
  );

  const listening = phase === 'listening';

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Cartão de entrada */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-5 sm:p-7 shadow-2xl">
        <div className="pointer-events-none absolute -bottom-24 left-0 right-0 h-48 opacity-60" aria-hidden>
          <div className="absolute left-[5%] h-full w-1/3 rounded-full bg-sky-500 blur-[70px]" />
          <div className="absolute left-[35%] h-full w-1/3 rounded-full bg-violet-500 blur-[70px]" />
          <div className="absolute left-[65%] h-full w-1/3 rounded-full bg-emerald-400 blur-[70px]" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          <div className="relative shrink-0">
            <div className="rounded-full bg-gradient-to-tr from-sky-400 via-violet-500 to-emerald-400 p-[3px]">
              <img
                src={brisaImg}
                alt="Enfermeira Brisa"
                loading="eager"
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover object-top bg-slate-800"
              />
            </div>
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-emerald-400" />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-sky-300">
              <Sparkles size={12} /> Conversa por voz
            </p>
            <h3 className="mt-1 text-2xl font-black text-white leading-tight">Enfª Brisa, sua anfitriã</h3>
            <p className="mt-1 text-sm text-slate-300">
              Pergunte em voz alta como funciona cada exame, quanto custa uma consulta ou qual é o próximo passo. Ela escuta, entende quando você termina e responde na hora.
            </p>
          </div>

          <button
            type="button"
            id="brisa-mic-button"
            onClick={() => openWith()}
            className="group shrink-0 inline-flex items-center gap-3 rounded-full bg-white px-6 py-4 text-slate-950 font-black shadow-[0_10px_40px_rgba(139,92,246,0.45)] transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-400/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 via-violet-500 to-fuchsia-500 text-white">
              <Mic size={20} />
            </span>
            Falar com a Brisa
          </button>
        </div>

        <div className="relative mt-5 flex flex-wrap justify-center sm:justify-start gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => openWith(s)}
              className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur transition-colors hover:bg-white/15"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Conversa em tela cheia */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="brisa-live"
                role="dialog"
                aria-modal="true"
                aria-label="Conversa por voz com a Enfermeira Brisa"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex flex-col bg-slate-950 text-white"
              >
                <Aurora phase={phase} />

                {/* Topo */}
                <div className="relative z-10 flex items-center justify-between px-4 pt-4 sm:px-8 sm:pt-6">
                  <div className="flex items-center gap-3">
                    <img src={brisaImg} alt="" className="h-10 w-10 rounded-full object-cover object-top bg-slate-800" />
                    <div>
                      <p className="text-sm font-black leading-tight">Enfª Brisa</p>
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                        <AudioLines size={12} className="text-sky-300" /> Ao vivo
                        {activeExam ? ` · ${activeExam}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Fechar conversa"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-white/20"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Conversa */}
                <div className="relative z-10 flex flex-1 flex-col justify-center overflow-y-auto px-6 py-6 sm:px-10">
                  <div className="mx-auto w-full max-w-2xl space-y-5" aria-live="polite">
                    {heard && (
                      <p className={`text-lg sm:text-xl font-medium leading-snug ${reply ? 'text-slate-400' : 'text-white'}`}>
                        {heard}
                      </p>
                    )}
                    {reply && (
                      <motion.p
                        key={reply}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl sm:text-2xl font-semibold leading-relaxed text-white"
                      >
                        {reply}
                      </motion.p>
                    )}
                    {reply && links.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-1">
                        {links.map((l) => (
                          <Link
                            key={l.to + l.label}
                            to={l.to}
                            onClick={close}
                            className="inline-flex items-center justify-between gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition-transform hover:scale-[1.03]"
                          >
                            {l.label} <ArrowRight size={16} />
                          </Link>
                        ))}
                      </div>
                    )}
                    {!heard && !reply && (
                      <div className="text-center">
                        <p className="text-2xl sm:text-3xl font-black">Olá! Pode falar.</p>
                        <p className="mt-2 text-sm text-slate-300">
                          Pergunte sobre os exames, as consultas ou como a Planta y Raiz funciona.
                        </p>
                      </div>
                    )}
                    {notice && (
                      <p className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">
                        {notice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Controles */}
                <div className="relative z-10 px-4 pb-6 sm:px-8 sm:pb-8">
                  <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3">
                    <VoiceBars phase={phase} />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-200">{PHASE_LABEL[phase]}</p>

                    <button
                      type="button"
                      onClick={onMicPress}
                      aria-label={listening ? 'Parar de ouvir' : 'Falar'}
                      className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-transform focus:outline-none focus:ring-4 focus:ring-white/40 ${
                        listening ? 'scale-110 bg-white text-slate-950' : 'bg-white/15 text-white backdrop-blur hover:bg-white/25'
                      }`}
                    >
                      {listening && <span className="absolute inset-0 rounded-full border-2 border-white/70 animate-ping" />}
                      {listening ? <Square size={26} fill="currentColor" /> : <Mic size={30} />}
                    </button>

                    <form onSubmit={onSubmitTyped} className="mt-1 flex w-full items-center gap-2">
                      <input
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        maxLength={500}
                        placeholder="Ou escreva sua pergunta"
                        aria-label="Escreva sua pergunta para a Brisa"
                        className="h-12 min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-base text-white placeholder:text-slate-300 backdrop-blur focus:border-white/60 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!typed.trim()}
                        aria-label="Enviar pergunta"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition-opacity disabled:opacity-40"
                      >
                        <Send size={18} />
                      </button>
                    </form>

                    <p className="text-center text-[11px] text-slate-300/80">
                      A Brisa explica e orienta. Ela não dá diagnóstico nem substitui a consulta com o médico.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};
