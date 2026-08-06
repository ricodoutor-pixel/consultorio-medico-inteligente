import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, Volume2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import brisaImg from '/lovable-uploads/ebfc53d1-432d-48bd-bb55-a0833a695dd8.png';

export const BrisaVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [brisaResponse, setBrisaResponse] = useState('');
  const [isOpen, setIsOpen] = useState(false);
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

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-center">
        <motion.div 
          className="relative cursor-pointer group"
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsOpen(true)}
        >
          <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-cyan-400 overflow-hidden bg-muted shadow-2xl relative z-10">
            <img 
              src={brisaImg} 
              alt="Brisa - IA" 
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-cyan-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg z-20 border border-background animate-bounce uppercase">
            Brisa IA
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-96 bg-card border-4 border-cyan-500 rounded-3xl shadow-[0_10px_40px_rgba(6,182,212,0.3)] z-[100] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-cyan-500 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden bg-white">
            <img src={brisaImg} alt="Brisa" className="w-full h-full object-cover object-center" />
          </div>
          <div>
            <h3 className="text-white font-black text-lg leading-tight">Enfª Brisa</h3>
            <p className="text-cyan-100 text-[10px] font-bold uppercase tracking-wider">Assistente de Voz</p>
          </div>
        </div>
        <button onClick={() => { setIsOpen(false); speechSynthesis.cancel(); recognitionRef.current?.stop(); }} className="text-white hover:bg-white/20 p-1 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 min-h-[200px] flex flex-col justify-center items-center bg-cyan-50/50">
        
        {/* User Transcript */}
        {transcript && (
          <div className="w-full bg-white p-3 rounded-2xl rounded-tr-none border border-cyan-100 text-sm text-cyan-900 font-medium mb-4 self-end shadow-sm">
            <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">Você</span>
            "{transcript}"
          </div>
        )}

        {/* Brisa Response */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 mb-4">
              <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
              <span className="text-xs font-bold text-cyan-600 uppercase">Brisa está pensando...</span>
            </motion.div>
          )}

          {brisaResponse && !isProcessing && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full bg-cyan-100 p-4 rounded-2xl rounded-tl-none border border-cyan-200 text-sm text-cyan-900 font-medium self-start shadow-sm mb-4 relative">
              <span className="text-[10px] text-cyan-600 font-black uppercase block mb-1 flex items-center gap-1">
                <Volume2 size={12} className={mood === 'speaking' ? 'animate-pulse text-cyan-500' : ''} />
                Enfª Brisa
              </span>
              {brisaResponse}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!transcript && !isProcessing && !brisaResponse && (
          <div className="text-center text-cyan-600/70 text-sm font-medium italic">
            Toque no microfone abaixo e faça sua pergunta.
          </div>
        )}

      </div>

      {/* Footer / Mic Button */}
      <div className="p-4 bg-white border-t border-cyan-100 flex justify-center pb-6">
        <button
          onClick={toggleListening}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:scale-105' 
              : 'bg-cyan-500 text-white shadow-[0_10px_20px_rgba(6,182,212,0.4)] hover:bg-cyan-600 hover:scale-105'
          }`}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
          )}
          {isListening ? <Square size={32} fill="currentColor" /> : <Mic size={36} />}
        </button>
      </div>

    </motion.div>
  );
};
