import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Volume2, AlertTriangle, Info, BookOpen, Wind, Loader2, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const AuscultaPulmonar = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{
    diagnosis: string;
    findings: string[];
    isDangerous: boolean;
    brisaSpeech: string;
  } | null>(null);
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    checkPermissionsAndAutoStart();
    return () => {
      stopRecording();
      speechSynthesis.cancel();
    };
  }, []);

  const checkPermissionsAndAutoStart = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (permission.state === 'granted') {
        startCountdown();
      }
    } catch (e) {
      console.log('Permissions API not supported or mic not queryable', e);
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    speakBrisa("Permissão reconhecida. O exame iniciará em 3 segundos. Posicione-se.");
    
    let currentCount = 3;
    const interval = setInterval(() => {
      currentCount -= 1;
      setCountdown(currentCount);
      if (currentCount <= 0) {
        clearInterval(interval);
        setCountdown(null);
        startRecording(true); // pass true to avoid speaking the prompt again
      }
    }, 1000);
  };

  const speakBrisa = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1.1; // Voz mais suave e acolhedora
    speechSynthesis.speak(utterance);
  };

  const startRecording = async (isAuto = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setResult(null);
      setTimer(0);
      
      // Encorajamento inicial (Ausculta Pulmonar)
      if (!isAuto) {
        speakBrisa("Vamos escutar seus pulmões. Por favor, encoste o celular nas costas, respire fundo pela boca e depois repita a palavra trinta e três.");
      } else {
        speakBrisa("Iniciando gravação. Fale trinta e três.");
      }
      
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev >= 20) { // Aumentado para 20 segundos
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões do seu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const b64 = base64String.split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    speakBrisa("Muito bem, estou analisando o fluxo de ar nos seus pulmões. Aguarde um instante.");
    
    try {
      const base64 = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke('analyze-lung-sound', {
        body: { 
          audioBase64: base64,
          mimeType: blob.type
        }
      });

      if (error) throw error;
      
      setResult(data);
      if (data.brisaSpeech) {
        speakBrisa(data.brisaSpeech);
      }
      
      // Salvar no banco
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        await supabase.from('diagnostic_exams').insert({
          user_id: session.session.user.id,
          exam_type: 'pulmonary',
          ai_diagnosis: data,
          risk_level: data.isDangerous ? 'alto' : 'baixo'
        });
      }
    } catch (err) {
      console.error("Error processing audio:", err);
      alert("Ocorreu um erro ao analisar o áudio. Tente novamente em um ambiente mais silencioso.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderComicManual = () => (
    <div className="space-y-4 font-sans text-sm md:text-base text-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel 1 */}
        <div className="border-4 border-black rounded-lg p-4 bg-yellow-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 1</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Silêncio Total!</h3>
          <p className="font-bold leading-tight">Vá para um ambiente totalmente silencioso. A respiração é um som muito sutil.</p>
          <div className="mt-4 flex justify-center">
            <span className="text-6xl">🤫</span>
          </div>
        </div>
        
        {/* Panel 2 */}
        <div className="border-4 border-black rounded-lg p-4 bg-blue-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 2</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Capa de Celular? Não!</h3>
          <p className="font-bold leading-tight">Tire a capinha para o microfone ficar livre. Encoste-o diretamente nas suas costas ou peito.</p>
          <div className="mt-4 flex justify-center">
            <span className="text-6xl">📱</span>
          </div>
        </div>

        {/* Panel 3 */}
        <div className="border-4 border-black rounded-lg p-4 bg-green-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 3</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Respire Fundo (Boca Aberta)</h3>
          <p className="font-bold leading-tight">Ao gravar, inspire e expire com a BOCA ABERTA de forma constante.</p>
          <div className="mt-4 flex justify-center">
            <span className="text-6xl">😮‍💨</span>
          </div>
        </div>

        {/* Panel 4 */}
        <div className="border-4 border-black rounded-lg p-4 bg-purple-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 4</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Teste da Voz</h3>
          <p className="font-bold leading-tight">Diga "Trinta e Três" enquanto grava, para a IA analisar a ressonância do som no pulmão.</p>
          <div className="mt-4 flex justify-center">
            <span className="text-6xl">🗣️</span>
          </div>
        </div>
        {/* Panel 5 */}
        <div className="border-4 border-black rounded-lg p-4 bg-cyan-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)] md:col-span-2">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">DICA DE OURO</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight text-center">Microfone Externo</h3>
          <p className="font-bold leading-tight text-center">Para obter o melhor resultado e a avaliação mais precisa possível, conecte um fone de ouvido com microfone ou um microfone de lapela ao seu celular!</p>
          <div className="mt-4 flex justify-center gap-4">
            <span className="text-5xl">🎧</span>
            <span className="text-5xl">🎤</span>
          </div>
        </div>
      </div>
      
      <div className="bg-primary text-primary-foreground p-4 rounded-xl border-4 border-black font-black flex items-center gap-3">
        <Wind className="w-12 h-12" />
        <p className="leading-tight text-lg">A Enfermeira Brisa vai te dar as instruções. O áudio será captado por 20 segundos!</p>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/20 overflow-hidden relative">
      <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-2xl font-black text-cyan-700 dark:text-cyan-400">
            <Wind className="w-8 h-8 text-cyan-500" />
            Ausculta Pulmonar IA
          </CardTitle>
          <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-2 border-primary/50 text-primary font-bold hover:bg-primary/10 rounded-full">
                <BookOpen className="w-4 h-4" /> Como Funciona
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-4 border-black rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase text-center mb-4 text-cyan-600 font-comic">Manual de Ausculta Pulmonar</DialogTitle>
              </DialogHeader>
              {renderComicManual()}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Área de Gravação */}
        <div className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-muted rounded-3xl bg-muted/30">
          
          {countdown !== null && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <div className="w-32 h-32 flex items-center justify-center rounded-full bg-cyan-500 text-white text-6xl font-black shadow-[0_0_40px_rgba(6,182,212,0.6)] animate-pulse">
                {countdown}
              </div>
              <h3 className="mt-6 text-2xl font-black text-cyan-600 text-center">Iniciando Automaticamente...</h3>
              <p className="text-muted-foreground font-medium text-center mt-2">Posicione-se, o microfone já está liberado.</p>
            </motion.div>
          )}

          {!isRecording && !isProcessing && !result && countdown === null && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <Button 
                size="lg" 
                onClick={() => startRecording()}
                className="w-32 h-32 rounded-full shadow-[0_0_40px_rgba(6,182,212,0.3)] bg-gradient-to-br from-cyan-500 to-blue-600 hover:scale-105 transition-all text-white border-4 border-cyan-300"
              >
                <Mic className="w-12 h-12" />
              </Button>
              <h3 className="mt-6 text-xl font-black text-center text-foreground">Aperte para Iniciar Ausculta</h3>
              <p className="text-muted-foreground text-center mt-2 max-w-xs font-medium">Você precisa estar em silêncio. Respire fundo e fale 'Trinta e Três'.</p>
              
              <div className="mt-6 bg-cyan-50 border border-cyan-200 p-3 rounded-xl flex items-start gap-3 max-w-sm">
                <Info className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-cyan-800 leading-tight">
                  Dica da Brisa: Para um resultado muito mais preciso, conecte um microfone externo (de lapela ou fone de ouvido) ao seu celular!
                </p>
              </div>
            </motion.div>
          )}

          {isRecording && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" style={{ animationDuration: '1s' }} />
                <Button 
                  size="lg" 
                  onClick={stopRecording}
                  className="w-32 h-32 rounded-full shadow-[0_0_40px_rgba(239,68,68,0.5)] bg-gradient-to-br from-red-500 to-red-700 hover:scale-105 transition-all text-white border-4 border-red-300 z-10"
                >
                  <Square className="w-12 h-12" />
                </Button>
              </div>
              <h3 className="mt-6 text-2xl font-black text-red-500 animate-pulse">Ouvindo os Pulmões...</h3>
              
              {/* Cronômetro */}
              <div className="mt-4 text-4xl font-black font-mono bg-background px-6 py-2 rounded-xl border-2 border-red-500/30 text-foreground">
                00:{timer.toString().padStart(2, '0')} / 20
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-muted-foreground font-bold bg-muted px-4 py-2 rounded-full">
                <Volume2 className="w-5 h-5 animate-pulse" /> Captando ruídos adventícios...
              </div>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <div className="w-32 h-32 flex items-center justify-center rounded-full bg-cyan-500/10 border-4 border-cyan-500 border-t-transparent animate-spin">
                <Wind className="w-12 h-12 text-cyan-500 animate-bounce" />
              </div>
              <h3 className="mt-6 text-xl font-black text-cyan-600 text-center">Processando Sinais...</h3>
              <p className="text-muted-foreground font-medium text-center mt-2">Brisa está cruzando seu áudio com bancos de pneumologia.</p>
            </motion.div>
          )}

          {result && !isProcessing && (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-2xl font-black text-cyan-700">Resultado da Avaliação</h3>
                 <Button variant="outline" size="sm" onClick={() => setResult(null)} className="font-bold border-2 rounded-xl">Novo Exame</Button>
               </div>
               
               <div className={`p-5 rounded-2xl border-l-8 shadow-sm ${result.isDangerous ? 'bg-red-50 border-red-500' : 'bg-cyan-50 border-cyan-500'}`}>
                 <div className="flex items-start gap-3">
                   {result.isDangerous ? <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" /> : <Activity className="w-8 h-8 text-cyan-500 flex-shrink-0 mt-1" />}
                   <div>
                     <h4 className={`font-black text-lg ${result.isDangerous ? 'text-red-700' : 'text-cyan-700'}`}>
                       {result.isDangerous ? 'Atenção Necessária' : 'Achados Clínicos'}
                     </h4>
                     <p className="text-gray-700 font-medium mt-1 leading-relaxed">{result.diagnosis}</p>
                   </div>
                 </div>
               </div>

               {result.findings.length > 0 && (
                 <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                   <h4 className="font-black text-sm uppercase text-muted-foreground mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Achados Técnicos</h4>
                   <ul className="space-y-1">
                     {result.findings.map((f, i) => (
                       <li key={i} className="text-sm font-medium flex items-center gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">{f}</li>
                     ))}
                   </ul>
                 </div>
               )}
             </motion.div>
          )}
        </div>

        {/* Janela da Enf. Brisa (Assistente de Voz) */}
        <AnimatePresence>
          {(isRecording || isProcessing || result) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 border-4 border-black rounded-2xl bg-[#ffde59] p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 rounded-bl-lg">Brisa Voice Assistant</div>
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-white border-2 border-black rounded-full overflow-hidden flex-shrink-0 shadow-inner flex items-center justify-center">
                  <span className="text-4xl">🐸</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="font-black text-lg md:text-xl text-black leading-tight italic">
                    {countdown !== null && "Permissão reconhecida, vamos iniciar!"}
                    {isRecording && "Lembre-se: respire fundo pela boca e fale trinta e três..."}
                    {isProcessing && "Quase lá! Analisando o fluxo de ar..."}
                    {result && result.brisaSpeech}
                  </p>
                  {result && (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => speakBrisa(result.brisaSpeech)}
                      className="mt-3 self-start bg-black text-white font-black hover:bg-gray-800 rounded-full gap-2 text-xs h-8"
                    >
                      <Volume2 className="w-3 h-3" /> Repetir Voz
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
};
