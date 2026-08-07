import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, Volume2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import brisaImg from '@/assets/brisa-enfermeira.png';

export const BrisaVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [brisaResponse, setBrisaResponse] = useState('');
  const [mood, setMood] = useState<"neutral" | "happy" | "thinking" | "speaking">("neutral");
  
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        // Start 5-second silence timeout
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) recognitionRef.current.stop();
          handleSilence();
        }, 5000);
      };

      recognition.onresult = (event: any) => {
        // User spoke something, clear the silence timeout!
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        // If we have a transcript, process it
        // Note: state might be stale here in closure, so we rely on a ref or we process in useEffect
        // Actually, better to handle the final result directly
      };
      
      recognition.onerror = (e: any) => {
        console.error('Speech recognition error', e.error);
        if (e.error === 'no-speech') {
          handleSilence();
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      speechSynthesis.cancel();
    };
  }, []);

  // Effect to process transcript when listening stops and we have text
  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
      processQuestion(transcript.trim());
    }
  }, [isListening, transcript]);

  const handleSilence = () => {
    const msg = "Sou a Enfermeira Brisa, em que posso ajudar hoje para melhorar sua saúde?";
    setBrisaResponse(msg);
    speak(msg);
  };

  const processQuestion = async (question: string) => {
    setIsProcessing(true);
    setMood("thinking");
    try {
      const { data, error } = await supabase.functions.invoke('chat-brisa', {
        body: { question }
      });
      if (error) throw error;
      
      setBrisaResponse(data.answer);
      speak(data.answer);
    } catch (e) {
      console.error(e);
      const errorMsg = "Desculpe, tive um pequeno problema de conexão. Pode repetir?";
      setBrisaResponse(errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text: string) => {
    speechSynthesis.cancel();
    setMood("speaking");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    
    utterance.onend = () => setMood("happy");
    speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setBrisaResponse('');
        setTranscript('');
        setMood("happy");
        try {
          recognitionRef.current.start();
        } catch (e) {
          // If already started
        }
      } else {
        alert("Seu navegador não suporta reconhecimento de voz.");
      }
    }
  };

  return (
    <div className="w-full bg-card/60 backdrop-blur-md border border-cyan-500/30 rounded-3xl shadow-xl overflow-hidden mt-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* Left column: Bust and Mic */}
        <div className="bg-gradient-to-b from-emerald-500/10 to-emerald-900/10 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-emerald-500/20">
          <motion.div 
            className="w-32 h-32 rounded-full border-4 border-emerald-400 overflow-hidden bg-muted shadow-[0_0_30px_rgba(16,185,129,0.4)] relative mb-4"
            animate={mood === 'speaking' ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <img 
              src={brisaImg} 
              alt="Enfermeira Brisa - Assistente de saúde" 
              loading="lazy"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
          <div className="text-center mb-6">
            <h3 className="text-foreground font-black text-xl leading-tight">Enfª Brisa</h3>
          </div>

          <div className="relative flex items-center justify-center">
            {/* Luz de fundo pulsante */}
            <span className="absolute w-32 h-32 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
            <span className="absolute w-24 h-24 rounded-full border border-emerald-400/40 animate-ping" />
            <button
              onClick={toggleListening}
              aria-label={isListening ? 'Parar de ouvir' : 'Falar com a Enfª Brisa'}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white transition-all ${
                isListening
                  ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.7)] hover:scale-105'
                  : 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.7)] hover:bg-emerald-400 hover:scale-105'
              }`}
            >
              {isListening ? <Square size={32} fill="currentColor" /> : <Mic size={36} />}
            </button>
          </div>
          
          <p className="text-[10px] text-muted-foreground mt-4 uppercase font-bold tracking-wider text-center">
            {isListening ? 'Ouvindo...' : 'Toque para falar com a Brisa'}
          </p>
        </div>


        {/* Right column: Chat interaction */}
        <div className="md:col-span-2 p-6 flex flex-col min-h-[300px] justify-center relative bg-gradient-to-br from-background to-cyan-950/10">
          
          {/* User Transcript */}
          {transcript && (
            <div className="w-full max-w-[85%] bg-white/5 p-4 rounded-2xl rounded-tr-none border border-cyan-100/20 text-sm text-foreground font-medium mb-4 self-end shadow-sm">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">Você</span>
              "{transcript}"
            </div>
          )}

          {/* Brisa Response */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Brisa está processando...</span>
              </motion.div>
            )}

            {brisaResponse && !isProcessing && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[90%] bg-cyan-950/30 p-5 rounded-2xl rounded-tl-none border border-cyan-500/30 text-sm md:text-base text-cyan-50 font-medium self-start shadow-lg relative backdrop-blur-sm">
                <span className="text-[10px] text-cyan-400 font-black uppercase block mb-2 flex items-center gap-1.5">
                  <Volume2 size={14} className={mood === 'speaking' ? 'animate-pulse text-cyan-300' : ''} />
                  Brisa responde
                </span>
                <p className="leading-relaxed">{brisaResponse}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!transcript && !isProcessing && !brisaResponse && (
            <div className="text-center flex flex-col items-center justify-center h-full opacity-60">
              <Volume2 className="w-12 h-12 text-cyan-500/50 mb-4" />
              <p className="text-sm font-medium text-foreground max-w-sm">
                Olá! Sou a Enfermeira Brisa. Aperte o microfone ao lado para me perguntar qualquer dúvida sobre seus exames ou saúde.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
