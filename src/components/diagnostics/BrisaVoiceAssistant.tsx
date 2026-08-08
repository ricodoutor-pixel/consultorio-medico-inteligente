import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import brisaImg from '@/assets/brisa-enfermeira.webp';

export const BrisaVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [brisaResponse, setBrisaResponse] = useState('');
  const [mood, setMood] = useState<'neutral' | 'happy' | 'thinking' | 'speaking'>('neutral');

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) recognitionRef.current.stop();
          handleSilence();
        }, 5000);
      };

      recognition.onresult = (event: any) => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error', e.error);
        if (e.error === 'no-speech') handleSilence();
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.stop();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
      processQuestion(transcript.trim());
    }
  }, [isListening, transcript]);

  const handleSilence = () => {
    const msg = 'Sou a Enfermeira Brisa, em que posso ajudar hoje para melhorar sua saúde?';
    setBrisaResponse(msg);
    speak(msg);
  };

  const processQuestion = async (question: string) => {
    setIsProcessing(true);
    setMood('thinking');
    try {
      const { data, error } = await supabase.functions.invoke('chat-brisa', {
        body: { question },
      });
      if (error) throw error;
      setBrisaResponse(data.answer);
      speak(data.answer);
    } catch {
      const errorMsg = 'Desculpe, tive um pequeno problema de conexão. Pode repetir?';
      setBrisaResponse(errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text: string) => {
    speechSynthesis.cancel();
    setMood('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.onend = () => setMood('happy');
    speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setBrisaResponse('');
        setTranscript('');
        setMood('happy');
        try {
          recognitionRef.current.start();
        } catch {
          // already started
        }
      } else {
        alert('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
          Assistente de Saúde por Voz
        </span>
      </div>

      {/* Main card — bust + chat side by side */}
      <div className="relative rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-500/10 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-[280px_1fr]">
          {/* ── LEFT — Bust + Mic button ────────────────── */}
          <div className="flex flex-col items-center justify-center gap-6 p-8 border-b md:border-b-0 md:border-r border-cyan-500/20 bg-gradient-to-b from-cyan-900/10 to-transparent">
            {/* Bust photo */}
            <motion.div
              className="relative"
              animate={mood === 'speaking' ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            >
              {/* Outer glow ring */}
              <div
                className={`absolute -inset-3 rounded-full transition-opacity duration-500 ${
                  mood === 'speaking'
                    ? 'opacity-100 bg-cyan-400/20 blur-md'
                    : 'opacity-0'
                }`}
              />
              {/* Avatar */}
              <div className="w-40 h-40 rounded-full border-4 border-cyan-400 overflow-hidden bg-slate-800 shadow-[0_0_40px_rgba(6,182,212,0.3)] relative z-10">
                <img
                  src={brisaImg}
                  alt="Enfermeira Brisa"
                  loading="eager"
                  // @ts-ignore
                  fetchPriority="high"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {/* Status badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-900 border border-cyan-500/40 px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isListening
                      ? 'bg-red-400 animate-ping'
                      : mood === 'speaking'
                      ? 'bg-cyan-400 animate-pulse'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                  {isListening ? 'Ouvindo' : mood === 'speaking' ? 'Falando' : 'Online'}
                </span>
              </div>
            </motion.div>

            {/* Name */}
            <div className="text-center">
              <h3 className="text-white font-black text-2xl leading-tight">Enfª Brisa</h3>
              <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                Assistente de Voz IA
              </p>
            </div>

            {/* ── Mic button ── */}
            <button
              id="brisa-mic-button"
              onClick={toggleListening}
              aria-label={isListening ? 'Parar gravação' : 'Iniciar gravação de voz'}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-400/40 ${
                isListening
                  ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.7)] scale-110'
                  : 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_8px_30px_rgba(6,182,212,0.5)] hover:scale-105 hover:shadow-[0_12px_40px_rgba(6,182,212,0.6)]'
              }`}
            >
              {/* Ping ring while listening */}
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75" />
                  <span className="absolute -inset-3 rounded-full border-2 border-red-300 animate-ping opacity-40" />
                </>
              )}
              {isListening ? (
                <Square size={36} fill="white" className="text-white" />
              ) : (
                <Mic size={40} className="text-white" />
              )}
            </button>

            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center">
              {isListening ? 'Toque para parar' : 'Toque para falar'}
            </p>
          </div>

          {/* ── RIGHT — Conversation area ────────────────── */}
          <div className="flex flex-col p-8 min-h-[340px] justify-center gap-4">
            {/* User transcript bubble */}
            <AnimatePresence>
              {transcript && (
                <motion.div
                  key="transcript"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="self-end max-w-[85%] bg-slate-700/60 border border-slate-600/40 backdrop-blur-sm p-4 rounded-2xl rounded-tr-sm shadow-md"
                >
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Você
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed">"{transcript}"</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing indicator */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 self-start"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-cyan-400 overflow-hidden bg-slate-800 shrink-0">
                    <img src={brisaImg} alt="Brisa" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="bg-cyan-950/50 border border-cyan-500/30 px-5 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Brisa está pensando…
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Brisa response bubble */}
            <AnimatePresence>
              {brisaResponse && !isProcessing && (
                <motion.div
                  key="response"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="self-start max-w-[92%] flex gap-3"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-cyan-400 overflow-hidden bg-slate-800 shrink-0 mt-1">
                    <img src={brisaImg} alt="Brisa" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-sm p-5 rounded-2xl rounded-tl-sm shadow-lg">
                    <span className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-black uppercase mb-2">
                      <Volume2
                        size={12}
                        className={mood === 'speaking' ? 'animate-pulse text-cyan-300' : ''}
                      />
                      Enfermeira Brisa responde
                    </span>
                    <p className="text-sm md:text-base text-slate-100 leading-relaxed">
                      {brisaResponse}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!transcript && !isProcessing && !brisaResponse && (
              <div className="flex flex-col items-center justify-center flex-1 opacity-50 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Mic className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-300">Olá! Sou a Enfermeira Brisa.</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    Aperte o botão do microfone ao lado e me faça qualquer pergunta sobre seus
                    exames ou saúde.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
