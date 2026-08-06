import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, AlertTriangle, Info, BookOpen, FlaskConical, Loader2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const ColorimetriaUrinaria = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const [result, setResult] = useState<{
    diagnosis: string;
    findings: string[];
    isDangerous: boolean;
    brisaSpeech: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      speechSynthesis.cancel();
    };
  }, []);

  const speakBrisa = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    speechSynthesis.speak(utterance);
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setTimer(60);
    setResult(null);
    speakBrisa("Mergulhe a tira na urina agora, retire e coloque sobre um papel branco. O cronômetro foi iniciado.");

    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          setIsTimerRunning(false);
          speakBrisa("Tempo esgotado! Por favor, tire a foto da tira reagente agora, ligue o flash se necessário.");
          if (fileInputRef.current) {
             fileInputRef.current.click();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    speakBrisa("Lendo as cores da tira. Analisando leucócitos, nitritos e glicose.");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = (reader.result as string).split(',')[1];
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data: aiResult, error } = await supabase.functions.invoke('analyze-urine-dipstick', {
        body: { 
          imageBase64: base64,
          mimeType: file.type
        }
      });

      if (error) throw error;
      
      setResult(aiResult);
      if (aiResult.brisaSpeech) {
        speakBrisa(aiResult.brisaSpeech);
      }
      
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        await supabase.from('diagnostic_exams').insert({
          user_id: session.session.user.id,
          exam_type: 'urine_dipstick',
          ai_diagnosis: aiResult,
          risk_level: aiResult.isDangerous ? 'alto' : 'baixo'
        });
      }
    } catch (err) {
      console.error("Error processing urine strip:", err);
      alert("Erro ao ler a tira reagente. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderComicManual = () => (
    <div className="space-y-4 font-sans text-sm md:text-base text-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-4 border-black rounded-lg p-4 bg-yellow-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 1</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Mergulhe a Tira</h3>
          <p className="font-bold leading-tight">Mergulhe rapidamente todos os quadradinhos da tira na urina e retire.</p>
          <div className="mt-4 flex justify-center text-5xl">🧪</div>
        </div>
        
        <div className="border-4 border-black rounded-lg p-4 bg-blue-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 2</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Fundo Branco</h3>
          <p className="font-bold leading-tight">Coloque a tira imediatamente em cima de uma folha de papel ofício branca limpa.</p>
          <div className="mt-4 flex justify-center text-5xl">📄</div>
        </div>

        <div className="border-4 border-black rounded-lg p-4 bg-green-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 3</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Espere 60s</h3>
          <p className="font-bold leading-tight">Aperte o botão de timer do app. A Brisa te avisará exatamente quando bater 1 minuto.</p>
          <div className="mt-4 flex justify-center text-5xl">⏱️</div>
        </div>

        <div className="border-4 border-black rounded-lg p-4 bg-purple-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 4</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Tire a Foto</h3>
          <p className="font-bold leading-tight">A câmera abrirá. Ligue o FLASH (muito importante) e fotografe a tira bem de perto, nítida.</p>
          <div className="mt-4 flex justify-center text-5xl">📸</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/20 overflow-hidden relative">
      <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-b border-border">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-2xl font-black text-yellow-700 dark:text-yellow-400">
            <FlaskConical className="w-8 h-8 text-yellow-500" />
            Urinálise por Câmera IA
          </CardTitle>
          <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-2 border-primary/50 text-primary font-bold hover:bg-primary/10 rounded-full">
                <BookOpen className="w-4 h-4" /> Como Funciona
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-4 border-black rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase text-center mb-4 text-yellow-600 font-comic">Manual de Urinálise</DialogTitle>
              </DialogHeader>
              {renderComicManual()}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-muted rounded-3xl bg-muted/30">
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
          />

          {!isTimerRunning && !isProcessing && !result && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <Button 
                size="lg" 
                onClick={startTimer}
                className="w-32 h-32 rounded-full shadow-[0_0_40px_rgba(234,179,8,0.3)] bg-gradient-to-br from-yellow-400 to-amber-500 hover:scale-105 transition-all text-white border-4 border-yellow-200"
              >
                <Play className="w-12 h-12 ml-2" />
              </Button>
              <h3 className="mt-6 text-xl font-black text-center text-foreground">Iniciar Cronômetro (60s)</h3>
              <p className="text-muted-foreground text-center mt-2 max-w-xs font-medium">Prepare a tira e clique aqui no exato momento que molhá-la.</p>
              
              <Button variant="link" className="mt-6 font-bold text-yellow-700" onClick={() => fileInputRef.current?.click()}>
                Já esperei. Tirar Foto Agora
              </Button>
            </motion.div>
          )}

          {isTimerRunning && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full">
              <div className="relative flex items-center justify-center h-32 w-32 border-4 border-yellow-500 rounded-full bg-yellow-50">
                <span className="text-5xl font-black text-yellow-600">{timer}</span>
              </div>
              <h3 className="mt-6 text-2xl font-black text-yellow-600 animate-pulse">Aguardando Reação...</h3>
              <p className="text-muted-foreground font-bold text-center mt-2">Coloque a tira sobre o papel branco. A câmera abrirá sozinha.</p>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <div className="w-32 h-32 flex items-center justify-center rounded-full bg-yellow-500/10 border-4 border-yellow-500 border-t-transparent animate-spin">
                <FlaskConical className="w-12 h-12 text-yellow-500 animate-bounce" />
              </div>
              <h3 className="mt-6 text-xl font-black text-yellow-600 text-center">Lendo Reagentes...</h3>
            </motion.div>
          )}

          {result && !isProcessing && (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-2xl font-black text-yellow-700">Laudo da Urinálise</h3>
                 <Button variant="outline" size="sm" onClick={() => setResult(null)} className="font-bold border-2 rounded-xl">Novo Exame</Button>
               </div>
               
               <div className={`p-5 rounded-2xl border-l-8 shadow-sm ${result.isDangerous ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-500'}`}>
                 <div className="flex items-start gap-3">
                   {result.isDangerous ? <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" /> : <FlaskConical className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-1" />}
                   <div>
                     <h4 className={`font-black text-lg ${result.isDangerous ? 'text-red-700' : 'text-emerald-700'}`}>
                       {result.isDangerous ? 'Atenção Necessária' : 'Parâmetros Normais'}
                     </h4>
                     <p className="text-gray-700 font-medium mt-1 leading-relaxed">{result.diagnosis}</p>
                   </div>
                 </div>
               </div>

               {result.findings.length > 0 && (
                 <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                   <h4 className="font-black text-sm uppercase text-muted-foreground mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Leitura dos Blocos</h4>
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
          {(isTimerRunning || isProcessing || result) && (
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
                    {isTimerRunning && "Deixe a tira repousando sobre o fundo branco. Te aviso quando o tempo acabar!"}
                    {isProcessing && "Avaliando a cor de cada parâmetro..."}
                    {result && result.brisaSpeech}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
};
