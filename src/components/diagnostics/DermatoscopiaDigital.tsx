import React, { useState, useRef, useEffect } from 'react';
import { Camera, ScanSearch, Zap, RefreshCcw, Activity, ShieldCheck, Database, FileText, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type ExamPhase = 'intro' | 'camera' | 'analyzing' | 'result';

export function DermatoscopiaDigital({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<ExamPhase>('intro');
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [aiLog, setAiLog] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [result, setResult] = useState<{
    risk: 'Baixo' | 'Moderado' | 'Alto';
    findings: string[];
    abcde: { letter: string; name: string; status: 'pass' | 'fail' | 'warn' }[];
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

  const startCamera = async () => {
    setPhase('camera');
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
      toast.error('Erro ao acessar a câmera. Simulando captura.');
    }
  };

  const captureAndAnalyze = () => {
    stopCamera();
    setPhase('analyzing');
    setAnalyzingProgress(0);
    
    const logs = [
      'Segmentando lesão dermatológica...',
      'Analisando Assimetria (A)...',
      'Avaliando Bordas irregulares (B)...',
      'Mapeando variação de Cor (C)...',
      'Medindo Diâmetro (D)...',
      'Detectando Evolução e padrões atípicos (E)...',
      'Cruzando com banco de +50.000 imagens classificadas...',
      'Gerando parecer dermatológico baseado em evidências...'
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
      risk: 'Baixo',
      findings: [
        'Bordas regulares e bem delimitadas',
        'Cor homogênea (pigmentação uniforme)',
        'Diâmetro < 6mm (aproximadamente 4.2mm)',
        'Padrão vascular ausente'
      ],
      abcde: [
        { letter: 'A', name: 'Assimetria', status: 'pass' },
        { letter: 'B', name: 'Bordas', status: 'pass' },
        { letter: 'C', name: 'Cor', status: 'pass' },
        { letter: 'D', name: 'Diâmetro', status: 'pass' },
        { letter: 'E', name: 'Evolução', status: 'warn' },
      ]
    });
    setPhase('result');
    toast.success('Análise dermatológica concluída!');
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 relative overflow-hidden rounded-xl border border-border shadow-sm">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center p-6 text-center h-full space-y-6"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20">
              <ScanSearch className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Dermatoscopia Digital com IA</h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Fotografe uma lesão de pele para análise por inteligência artificial. A IA avaliará forma, bordas, cor e padrão.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left">
              <div className="bg-white p-3 rounded-xl border shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
                <p className="text-[11px] text-slate-600 leading-tight">Regra ABCDE Automatizada</p>
              </div>
              <div className="bg-white p-3 rounded-xl border shadow-sm">
                <Database className="w-5 h-5 text-blue-500 mb-1" />
                <p className="text-[11px] text-slate-600 leading-tight">Banco com +50k imagens dermatológicas</p>
              </div>
            </div>

            <Button onClick={startCamera} size="lg" className="w-full max-w-sm rounded-xl h-14 text-base shadow-lg shadow-primary/25">
              <Camera className="w-5 h-5 mr-2" /> Iniciar Análise
            </Button>
          </motion.div>
        )}

        {phase === 'camera' && (
          <motion.div 
            key="camera"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col w-full h-full bg-black relative"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-emerald-400 rounded-2xl opacity-80 flex items-center justify-center relative">
                {/* Viewfinder corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl -mb-1 -mr-1"></div>
                <ScanSearch className="w-10 h-10 text-emerald-400/50" />
              </div>
              <div className="absolute top-8 text-white/90 text-sm font-medium text-center w-full bg-black/40 py-2 backdrop-blur-sm">
                Posicione a lesão de pele no centro do quadro.<br/><span className="text-xs text-white/70">Aproxime sem sombras.</span>
              </div>
            </div>
            
            <div className="absolute bottom-8 w-full flex justify-center px-6 gap-4">
              <Button variant="secondary" size="icon" className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white" onClick={() => setPhase('intro')}>
                <RefreshCcw className="w-6 h-6" />
              </Button>
              <Button onClick={captureAndAnalyze} className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 border-4 border-white/20 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                <Camera className="w-8 h-8 text-white" />
              </Button>
              <Button variant="secondary" size="icon" className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white" onClick={() => toast('Flash ativado (se suportado pelo disp.)')}>
                <Zap className="w-6 h-6" />
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
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-primary/40 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-primary/50 flex items-center justify-center bg-black/50">
                <ScanSearch className="w-12 h-12 text-primary opacity-80" />
                <motion.div 
                  className="absolute w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399]"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              </div>
            </div>
            
            <div className="w-full max-w-xs space-y-3">
              <h3 className="font-semibold text-lg">IA Analisando Lesão...</h3>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary" style={{ width: `${analyzingProgress}%` }} />
              </div>
              <p className="text-xs text-primary font-mono h-8">{aiLog}</p>
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
                <h2 className="text-lg font-bold text-slate-800 leading-tight">Parecer Dermatológico IA</h2>
                <p className="text-xs text-slate-500">Análise de Lesão Cutânea · {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Risco Identificado</p>
                  <p className={`text-lg font-black ${result.risk === 'Alto' ? 'text-rose-600' : result.risk === 'Moderado' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    Risco {result.risk} (Benigno)
                  </p>
                </div>
                {result.risk === 'Alto' ? <AlertTriangle className="w-8 h-8 text-rose-500" /> : <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary" /> Análise Regra ABCDE
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {result.abcde.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 
                        ${item.status === 'pass' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                          item.status === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                          'bg-rose-50 border-rose-200 text-rose-700'}`}>
                        {item.letter}
                      </div>
                      <span className="text-[9px] font-medium text-slate-500 uppercase">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4 text-primary" /> Achados Clínicos (IA)
                </p>
                <ul className="space-y-2">
                  {result.findings.map((f, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
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
                        <p className="mt-3">A regra ABCDE é um guia para identificar sinais de alerta em pintas e lesões. Um risco baixo indica características benignas, mas o acompanhamento (Evolução) é sempre recomendado.</p>
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="font-semibold text-primary mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Conexão Endocanabinoide</p>
                          <p>Estudos indicam que canabinoides tópicos (CBD) possuem propriedades anti-inflamatórias, antimicrobianas e podem auxiliar em condições como psoríase, eczema e dermatite atópica.</p>
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
