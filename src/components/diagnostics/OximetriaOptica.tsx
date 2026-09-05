import React, { useState, useRef, useEffect } from 'react';
import { Camera, HeartPulse, Zap, RefreshCcw, Activity, ShieldCheck, Database, FileText, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { ComicManual } from './ComicManual';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { SaMDBiofeedbackDisclaimer } from '@/components/compliance/SaMDBiofeedbackDisclaimer';

type ExamPhase = 'intro' | 'measuring' | 'analyzing' | 'result';

export function OximetriaOptica({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<ExamPhase>('intro');
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [aiLog, setAiLog] = useState<string>('');
  const [spo2Value, setSpo2Value] = useState(98);
  const [measuringTime, setMeasuringTime] = useState(30);
  const [showExplanation, setShowExplanation] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Measuring oscillation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'measuring') {
      interval = setInterval(() => {
        setSpo2Value(Math.floor(Math.random() * (99 - 94 + 1) + 94));
        setMeasuringTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            captureAndAnalyze();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const startCamera = async () => {
    setPhase('measuring');
    setMeasuringTime(30);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', advanced: [{ torch: true } as any] } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error('Camera access error:', e);
      toast.error('Erro ao acessar a câmera. Simulando a medição.');
    }
  };

  const captureAndAnalyze = () => {
    stopCamera();
    setPhase('analyzing');
    setAnalyzingProgress(0);
    
    const logs = [
      'Processando sinal fotopletismográfico (PPG)...',
      'Analisando razão vermelho/infravermelho...',
      'Calculando saturação de oxigênio periférica...',
      'Avaliando perfusão e frequência de pulso...',
      'Cruzando dados com banco de referência clínica...',
      'Gerando parecer de oximetria...'
    ];

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setAnalyzingProgress(Math.min(100, step * (100 / logs.length)));
      setAiLog(logs[step - 1] || 'Finalizando...');

      if (step >= logs.length + 1) {
        clearInterval(interval);
        setTimeout(() => setPhase('result'), 500);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 relative overflow-hidden rounded-xl border border-border shadow-sm">
      <ComicManual 
        title="Como Fazer a Oximetria"
        icon={HeartPulse}
        brisaMessage="Vou medir o nível de oxigênio no seu sangue! Deixe o dedo bem quieto na lente."
        steps={[
          { title: 'Lave as Mãos', description: 'Certifique-se de que seus dedos estão limpos e secos.', icon: '🧼', colorClass: 'bg-blue-50' },
          { title: 'Apoie o Dedo', description: 'Coloque o dedo indicador tampando a CÂMERA e o FLASH do celular.', icon: '👆', colorClass: 'bg-red-50' },
          { title: 'Pressão Leve', description: 'Não aperte muito forte, apenas encoste o dedo cobrindo tudo.', icon: '🎈', colorClass: 'bg-yellow-50' },
          { title: 'Aguarde 30s', description: 'Fique imóvel até a contagem terminar. Respire fundo!', icon: '⏱️', colorClass: 'bg-green-50' }
        ]}
      />
      
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center p-6 text-center h-full space-y-6"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20">
              <HeartPulse className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Oximetria Óptica Digital</h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Meça sua saturação de oxigênio (SpO2) usando a câmera e o flash do smartphone. Apoie o dedo sobre a lente.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left">
              <div className="bg-white p-3 rounded-xl border shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
                <p className="text-[11px] text-slate-600 leading-tight">Tecnologia PPG Avançada</p>
              </div>
              <div className="bg-white p-3 rounded-xl border shadow-sm">
                <Database className="w-5 h-5 text-blue-500 mb-1" />
                <p className="text-[11px] text-slate-600 leading-tight">Análise em tempo real</p>
              </div>
            </div>

            <SaMDBiofeedbackDisclaimer compact toolName="A oximetria óptica digital por câmera" />

            <Button onClick={startCamera} size="lg" className="w-full max-w-sm rounded-xl h-14 text-base shadow-lg shadow-primary/25">
              <Camera className="w-5 h-5 mr-2" /> Iniciar Medição
            </Button>
          </motion.div>
        )}

        {phase === 'measuring' && (
          <motion.div 
            key="measuring"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col w-full h-full bg-black relative"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover opacity-30"
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 space-y-8">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Pulse wave animation */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-4 border-rose-500/50"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <div className="z-20 text-center">
                  <span className="text-5xl font-black text-white">{spo2Value}</span>
                  <span className="text-xl text-white/80">%</span>
                </div>
                {/* Circular Progress */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="96" cy="96" r="90"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="96" cy="96" r="90"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray={565.48}
                    strokeDashoffset={565.48 - (565.48 * (30 - measuringTime)) / 30}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
              </div>
              <div className="text-white text-center px-6">
                <p className="text-lg font-bold mb-1">Medindo SpO2...</p>
                <p className="text-sm text-white/70">Mantenha o dedo firme sobre a câmera com flash</p>
                <p className="mt-4 text-xs font-mono text-emerald-400">{measuringTime}s restantes</p>
              </div>
            </div>

            <div className="absolute bottom-8 w-full flex justify-center px-6">
              <Button variant="secondary" className="rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 text-white" onClick={() => {
                stopCamera();
                setPhase('intro');
              }}>
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}

        {phase === 'analyzing' && (
          <motion.div 
            key="analyzing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-8 text-center h-full bg-slate-900 text-white space-y-8"
          >
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-rose-500/40 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-rose-500/50 flex items-center justify-center bg-black/50">
                <HeartPulse className="w-12 h-12 text-rose-500 opacity-80" />
                <motion.div 
                  className="absolute w-full h-1 bg-rose-400 shadow-[0_0_10px_#fb7185]"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              </div>
            </div>
            
            <div className="w-full max-w-xs space-y-3">
              <h3 className="font-semibold text-lg">IA Processando Sinal PPG...</h3>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-rose-500" style={{ width: `${analyzingProgress}%` }} />
              </div>
              <p className="text-xs text-rose-400 font-mono h-8">{aiLog}</p>
            </div>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col p-5 h-full overflow-y-auto bg-white"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">Parecer Oximetria Óptica</h2>
                <p className="text-xs text-slate-500">Avaliação Respiratória · {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-xl border bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">SpO2</p>
                  <p className="text-3xl font-black text-emerald-500">97%</p>
                </div>
                <div className="flex-1 p-4 rounded-xl border bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Frequência</p>
                  <p className="text-3xl font-black text-slate-800">72 <span className="text-sm font-medium text-slate-500">bpm</span></p>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900">Normal (Saturação adequada)</h4>
                  <p className="text-xs text-emerald-800 mt-1">Sua saturação de oxigênio está dentro dos níveis esperados (95-100%).</p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <button 
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="font-semibold text-slate-800 text-sm">O que significa seu resultado?</span>
                  {showExplanation ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden bg-white"
                    >
                      <div className="p-4 pt-0 text-xs text-slate-600 space-y-3">
                        <p className="mt-3">A oximetria mede a quantidade de oxigênio que o sangue está transportando. Valores normais indicam boa função pulmonar e perfusão sanguínea adequada.</p>
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="font-semibold text-primary mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Conexão Endocanabinoide</p>
                          <p>O sistema endocanabinoide modula a resposta inflamatória pulmonar. O CBD demonstra propriedades broncodilatadoras e anti-inflamatórias, podendo ser útil na gestão de condições respiratórias crônicas.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <SaMDBiofeedbackDisclaimer compact toolName="Este parecer de oximetria por fotopletismografia" />
            </div>

            <div className="mt-auto pt-6 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setPhase('intro')}>
                Repetir
              </Button>
              <Button className="flex-1 rounded-xl shadow-lg shadow-primary/20" onClick={() => {
                toast.success('Resultado anexado ao chat!');
                if (onComplete) onComplete();
              }}>
                Anexar ao Chat
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
