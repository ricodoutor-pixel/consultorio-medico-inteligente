import React, { useState, useRef, useEffect } from 'react';
import { Camera, Accessibility, RefreshCcw, Activity, ShieldCheck, Database, FileText, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Bone, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type ExamPhase = 'intro' | 'camera' | 'analyzing' | 'result';

const JOINTS = ['Ombro', 'Cotovelo', 'Punho', 'Quadril', 'Joelho', 'Tornozelo'];

export function AvaliacaoMobilidade({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<ExamPhase>('intro');
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [aiLog, setAiLog] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState(JOINTS[0]);
  const [measuringTime, setMeasuringTime] = useState(15);
  const [currentAngle, setCurrentAngle] = useState(90);
  const [painLevel, setPainLevel] = useState(3);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [result, setResult] = useState<{
    risk: 'Normal' | 'Limitação Leve' | 'Limitação Moderada' | 'Limitação Severa';
    angle: number;
    normalRange: string;
  } | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Measurement simulation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'camera') {
      interval = setInterval(() => {
        setCurrentAngle(prev => {
          const newAngle = prev + (Math.random() * 10 - 3);
          return Math.min(180, Math.max(0, Math.round(newAngle)));
        });
        
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
    setPhase('camera');
    setMeasuringTime(15);
    setCurrentAngle(90);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error('Camera access error:', e);
      toast.error('Erro ao acessar a câmera. Simulando avaliação.');
    }
  };

  const captureAndAnalyze = () => {
    stopCamera();
    setPhase('analyzing');
    setAnalyzingProgress(0);
    
    const logs = [
      'Detectando pontos articulares via pose estimation...',
      'Calculando amplitude de movimento (ROM)...',
      'Comparando com valores de referência...',
      'Analisando simetria e compensações...',
      'Avaliando índice de dor e funcionalidade...',
      'Gerando parecer de mobilidade articular...'
    ];

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setAnalyzingProgress(Math.min(100, step * (100 / logs.length)));
      setAiLog(logs[step - 1] || 'Finalizando...');

      if (step >= logs.length + 1) {
        clearInterval(interval);
        setTimeout(() => generateResult(), 500);
      }
    }, 1200);
  };

  const generateResult = () => {
    setResult({
      risk: 'Limitação Leve',
      angle: 145,
      normalRange: '150°-180°'
    });
    setPhase('result');
    toast.success('Avaliação de mobilidade concluída!');
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 relative overflow-hidden rounded-xl border border-border shadow-sm">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center p-6 text-center h-full space-y-5"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20 shrink-0">
              <Accessibility className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Avaliação de Mobilidade</h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                Use a câmera frontal para avaliar a amplitude de movimento das suas articulações. A IA rastreará seus movimentos em tempo real.
              </p>
            </div>
            
            <div className="w-full max-w-sm">
              <p className="text-xs font-semibold text-slate-700 mb-2 text-left">Articulação a avaliar:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {JOINTS.map(joint => (
                  <button
                    key={joint}
                    onClick={() => setSelectedJoint(joint)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedJoint === joint 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-white border text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {joint}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left mt-2">
              <div className="bg-white p-3 rounded-xl border shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
                <p className="text-[11px] text-slate-600 leading-tight">Pose Estimation IA</p>
              </div>
              <div className="bg-white p-3 rounded-xl border shadow-sm">
                <Minimize2 className="w-5 h-5 text-blue-500 mb-1" />
                <p className="text-[11px] text-slate-600 leading-tight">Goniometria Digital</p>
              </div>
            </div>

            <Button onClick={startCamera} size="lg" className="w-full max-w-sm rounded-xl h-12 mt-2 text-base shadow-lg shadow-primary/25">
              <Camera className="w-5 h-5 mr-2" /> Iniciar Avaliação
            </Button>
          </motion.div>
        )}

        {phase === 'camera' && (
          <motion.div 
            key="camera"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col w-full h-full bg-slate-900 relative"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover opacity-60 scale-x-[-1]" // mirror front camera
            />
            
            {/* Skeleton Overlay Suggestion */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-48 h-64 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center">
                <Accessibility className="w-24 h-24 text-emerald-400/40" />
                
                {/* Angle measurement HUD */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2 border border-white/10">
                  <Minimize2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-mono font-bold">{currentAngle}°</span>
                </div>
              </div>
            </div>

            <div className="absolute top-8 w-full text-center px-4">
              <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full inline-block text-sm font-medium">
                Posicione-se e realize o movimento de {selectedJoint}
              </div>
              <div className="mt-4 text-3xl font-black text-white drop-shadow-md">
                00:{measuringTime.toString().padStart(2, '0')}
              </div>
            </div>
            
            <div className="absolute bottom-8 w-full flex justify-center px-6 gap-4">
              <Button variant="secondary" className="rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 text-white w-full max-w-[200px]" onClick={() => {
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
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-blue-500/40 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-blue-500/50 flex items-center justify-center bg-black/50">
                <Bone className="w-12 h-12 text-blue-400 opacity-80" />
                <motion.div 
                  className="absolute w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399]"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              </div>
            </div>
            
            <div className="w-full max-w-xs space-y-3">
              <h3 className="font-semibold text-lg">IA Calculando ROM...</h3>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-blue-500" style={{ width: `${analyzingProgress}%` }} />
              </div>
              <p className="text-xs text-blue-400 font-mono h-8">{aiLog}</p>
            </div>
          </motion.div>
        )}

        {phase === 'result' && result && (
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
                <h2 className="text-lg font-bold text-slate-800 leading-tight">Parecer Mobilidade Articular</h2>
                <p className="text-xs text-slate-500">Avaliação de {selectedJoint} · {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-xl border bg-slate-50 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Amplitude de Movimento (ROM)</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-slate-800">{result.angle}°</p>
                  <p className="text-sm text-slate-500 font-medium">/ Normal: {result.normalRange}</p>
                </div>
                <div className="mt-4 w-full h-3 bg-slate-200 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-amber-400 rounded-full"
                    style={{ width: `${(result.angle / 180) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-amber-50 border-amber-100 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900">{result.risk}</h4>
                  <p className="text-xs text-amber-800 mt-1">Sua amplitude está levemente abaixo do esperado para a articulação do {selectedJoint}.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-slate-50">
                <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary" /> Índice de Dor (EVA)
                </p>
                <div className="flex flex-col gap-2">
                  <input 
                    type="range" 
                    min="0" max="10" 
                    value={painLevel}
                    onChange={(e) => setPainLevel(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Sem dor (0)</span>
                    <span className="font-bold text-slate-800 text-sm">{painLevel}</span>
                    <span>Pior dor (10)</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden mt-4">
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
                        <p className="mt-3">A amplitude de movimento (ROM) mede a flexibilidade e saúde da sua articulação. Limitações podem indicar inflamação, desgaste ou rigidez muscular.</p>
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="font-semibold text-primary mb-1 flex items-center gap-1.5"><Bone className="w-3.5 h-3.5" /> Conexão Endocanabinoide</p>
                          <p>O CBD é amplamente estudado para dor crônica articular, artrite reumatoide e osteoartrite. O sistema endocanabinoide possui receptores CB2 concentrados nas articulações, ajudando a modular a inflamação e dor local.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
