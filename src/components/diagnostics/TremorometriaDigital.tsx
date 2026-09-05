import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitySquare, Play, Square, AlertTriangle, Info, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SaMDBiofeedbackDisclaimer } from "@/components/compliance/SaMDBiofeedbackDisclaimer";

export const TremorometriaDigital = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const [result, setResult] = useState<{
    diagnosis: string;
    findings: string[];
    isDangerous: boolean;
    brisaSpeech: string;
  } | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accelDataRef = useRef<{ x: number, y: number, z: number, timestamp: number }[]>([]);

  useEffect(() => {
    return () => {
      stopRecording();
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

  const handleDeviceMotion = (event: DeviceMotionEvent) => {
    if (event.acceleration) {
      accelDataRef.current.push({
        x: event.acceleration.x || 0,
        y: event.acceleration.y || 0,
        z: event.acceleration.z || 0,
        timestamp: Date.now()
      });
    }
  };

  const requestPermissionAndStart = async () => {
    try {
      // Solicitar permissão para iOS/Safari
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState !== 'granted') {
          alert('Permissão de movimento negada. Não é possível realizar o exame.');
          return;
        }
      }

      startRecording();
    } catch (err) {
      console.error(err);
      // Fallback: Tenta iniciar mesmo se não houver requestPermission (Android, navegadores antigos)
      startRecording();
    }
  };

  const startRecording = () => {
    accelDataRef.current = [];
    window.addEventListener('devicemotion', handleDeviceMotion, true);
    setIsRecording(true);
    setResult(null);
    setTimer(0);
    
    speakBrisa("Segure o celular com a mão estendida e tente mantê-lo o mais parado possível até o cronômetro zerar.");
    
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev >= 15) {
          stopRecordingAndProcess();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    window.removeEventListener('devicemotion', handleDeviceMotion, true);
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const stopRecordingAndProcess = () => {
    stopRecording();
    processTremorData();
  };

  const processTremorData = async () => {
    setIsProcessing(true);
    speakBrisa("Calculando as frequências do seu tremor. Só um momento.");
    
    const data = accelDataRef.current;
    if (data.length < 10) {
      alert("Poucos dados coletados. O celular possui acelerômetro?");
      setIsProcessing(false);
      return;
    }

    // Calcula magnitude (RMS)
    let sumSquares = 0;
    data.forEach(d => {
      const magnitude = Math.sqrt(d.x*d.x + d.y*d.y + d.z*d.z);
      sumSquares += magnitude * magnitude;
    });
    const rms = Math.sqrt(sumSquares / data.length);

    // Estimativa simples de picos (Zero-crossing) para achar a Frequência (Hz)
    let crossings = 0;
    for (let i = 1; i < data.length; i++) {
      const mag1 = Math.sqrt(data[i-1].x**2 + data[i-1].y**2 + data[i-1].z**2);
      const mag2 = Math.sqrt(data[i].x**2 + data[i].y**2 + data[i].z**2);
      // Subtrai a gravidade/média se necessário (aqui usamos 'acceleration' que não deve ter gravidade)
      if ((mag1 > 0 && mag2 < 0) || (mag1 < 0 && mag2 > 0) || (Math.sign(mag1 - rms) !== Math.sign(mag2 - rms))) {
        crossings++;
      }
    }
    
    const durationSeconds = (data[data.length - 1].timestamp - data[0].timestamp) / 1000;
    const frequencyHz = durationSeconds > 0 ? (crossings / 2) / durationSeconds : 0;

    try {
      const { data: aiResult, error } = await supabase.functions.invoke('analyze-tremor', {
        body: { 
          frequencyHz: Number(frequencyHz.toFixed(1)),
          amplitudeRMS: Number(rms.toFixed(2))
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
          exam_type: 'tremor',
          ai_diagnosis: aiResult,
          risk_level: aiResult.isDangerous ? 'alto' : 'baixo'
        });
      }
    } catch (err) {
      console.error("Error processing tremor:", err);
      alert("Ocorreu um erro ao analisar os tremores.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderComicManual = () => (
    <div className="space-y-4 font-sans text-sm md:text-base text-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel 1 */}
        <div className="border-4 border-black rounded-lg p-4 bg-orange-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 1</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Fique de Pé</h3>
          <p className="font-bold leading-tight">Levante-se e posicione-se em um local seguro, com os pés paralelos.</p>
          <div className="mt-4 flex justify-center text-5xl">🚶</div>
        </div>
        
        {/* Panel 2 */}
        <div className="border-4 border-black rounded-lg p-4 bg-blue-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 2</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Braço Estendido</h3>
          <p className="font-bold leading-tight">Estenda seu braço completamente para frente, segurando o celular firmemente.</p>
          <div className="mt-4 flex justify-center text-5xl">💪📱</div>
        </div>

        {/* Panel 3 */}
        <div className="border-4 border-black rounded-lg p-4 bg-green-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 3</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Alvo na Tela</h3>
          <p className="font-bold leading-tight">Tente manter o alvo da tela no centro. Permita que a IA leia seus movimentos.</p>
          <div className="mt-4 flex justify-center text-5xl">🎯</div>
        </div>

        {/* Panel 4 */}
        <div className="border-4 border-black rounded-lg p-4 bg-purple-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 4</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Permissão</h3>
          <p className="font-bold leading-tight">Ao iniciar, aceite a permissão de movimento se o seu navegador (Safari/iOS) pedir!</p>
          <div className="mt-4 flex justify-center text-5xl">✅</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/20 overflow-hidden relative">
      <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-border">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-2xl font-black text-orange-700 dark:text-orange-400">
            <ActivitySquare className="w-8 h-8 text-orange-500" />
            Tremorometria IA
          </CardTitle>
          <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-2 border-primary/50 text-primary font-bold hover:bg-primary/10 rounded-full">
                <BookOpen className="w-4 h-4" /> Como Funciona
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-4 border-black rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase text-center mb-4 text-orange-600 font-comic">Manual de Tremorometria</DialogTitle>
              </DialogHeader>
              {renderComicManual()}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <SaMDBiofeedbackDisclaimer compact toolName="A avaliação de tremorometria digital" />

        <div className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-muted rounded-3xl bg-muted/30">
          
          {!isRecording && !isProcessing && !result && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <Button 
                size="lg" 
                onClick={requestPermissionAndStart}
                className="w-32 h-32 rounded-full shadow-[0_0_40px_rgba(249,115,22,0.3)] bg-gradient-to-br from-orange-500 to-red-600 hover:scale-105 transition-all text-white border-4 border-orange-300"
              >
                <Play className="w-12 h-12 ml-2" />
              </Button>
              <h3 className="mt-6 text-xl font-black text-center text-foreground">Iniciar Sensor de Movimento</h3>
              <p className="text-muted-foreground text-center mt-2 max-w-xs font-medium">Estenda o braço segurando o celular e aperte Play.</p>
            </motion.div>
          )}

          {isRecording && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full">
              <div className="relative flex items-center justify-center h-32 w-32 border-4 border-orange-500 rounded-full">
                <div className="absolute w-4 h-4 bg-orange-600 rounded-full animate-ping" />
                <div className="absolute w-12 h-12 border-2 border-orange-300 rounded-full" />
                <div className="absolute w-20 h-20 border-2 border-orange-200 rounded-full" />
              </div>
              <h3 className="mt-6 text-2xl font-black text-orange-600 animate-pulse">Medindo Tremores...</h3>
              
              <div className="mt-4 text-4xl font-black font-mono bg-background px-6 py-2 rounded-xl border-2 border-orange-500/30 text-foreground">
                00:{timer.toString().padStart(2, '0')} / 15
              </div>
              <Button onClick={stopRecording} variant="ghost" className="mt-4 text-red-500 font-bold">Cancelar</Button>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <div className="w-32 h-32 flex items-center justify-center rounded-full bg-orange-500/10 border-4 border-orange-500 border-t-transparent animate-spin">
                <ActivitySquare className="w-12 h-12 text-orange-500 animate-bounce" />
              </div>
              <h3 className="mt-6 text-xl font-black text-orange-600 text-center">Calculando Hertz e RMS...</h3>
            </motion.div>
          )}

          {result && !isProcessing && (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-2xl font-black text-orange-700">Resultado Neuromotor</h3>
                 <Button variant="outline" size="sm" onClick={() => setResult(null)} className="font-bold border-2 rounded-xl">Novo Exame</Button>
               </div>
               
               <div className={`p-5 rounded-2xl border-l-8 shadow-sm ${result.isDangerous ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'}`}>
                 <div className="flex items-start gap-3">
                   {result.isDangerous ? <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" /> : <ActivitySquare className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />}
                   <div>
                     <h4 className={`font-black text-lg ${result.isDangerous ? 'text-red-700' : 'text-orange-700'}`}>
                       {result.isDangerous ? 'Atenção Necessária' : 'Achados Clínicos'}
                     </h4>
                     <p className="text-gray-700 font-medium mt-1 leading-relaxed">{result.diagnosis}</p>
                   </div>
                 </div>
               </div>

               {result.findings.length > 0 && (
                 <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                   <h4 className="font-black text-sm uppercase text-muted-foreground mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Parâmetros Mensurados</h4>
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
                    {isRecording && "Mantenha o celular na mão com o braço esticado. Tente segurar bem firme."}
                    {isProcessing && "Avaliando a frequência dos movimentos..."}
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
