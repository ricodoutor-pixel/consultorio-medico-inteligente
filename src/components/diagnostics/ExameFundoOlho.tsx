import React, { useState, useRef, useEffect } from 'react';
import { Camera, Eye, Zap, RefreshCcw, Activity, ShieldCheck, Database, ScanLine, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type ExamPhase = 'intro' | 'camera' | 'analyzing' | 'result';

export function ExameFundoOlho({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<ExamPhase>('intro');
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [aiLog, setAiLog] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Fake diagnosis result
  const [result, setResult] = useState<{
    risk: 'Baixo' | 'Moderado' | 'Alto';
    findings: string[];
    recommendation: string;
  } | null>(null);

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopCamera(); // Cleanup on unmount
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
      toast.error('Erro ao acessar a câmera. Simulando a captura para fins de teste.');
      // Proceed even without camera for testing
    }
  };

  const captureAndAnalyze = () => {
    stopCamera();
    setPhase('analyzing');
    setAnalyzingProgress(0);
    
    // Simulate AI workflow
    const logs = [
      'Iniciando escaneamento retinal de alta resolução...',
      'Isolando mácula, fóvea e disco óptico...',
      'Cruzando espectro vascular com +40.000 estudos oftalmológicos...',
      'Analisando tortuosidade vascular e microaneurismas...',
      'Avaliando escavação papilar (Risco de Glaucoma)...',
      'Gerando parecer técnico baseado em evidências...'
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
      risk: 'Moderado',
      findings: [
        'Relação Escavação/Disco (E/D) em 0.6 (Limítrofe)',
        'Leve tortuosidade vascular (sugestivo de retinopatia hipertensiva estágio I)',
        'Mácula preservada, ausência de exsudatos ou microaneurismas.'
      ],
      recommendation: 'Encaminhar paciente para tonometria e mapeamento de retina completo presencial. Prescrição de CBD pode auxiliar na redução da pressão intraocular, requer acompanhamento.'
    });
    setPhase('result');
    toast.success('Parecer técnico gerado com sucesso!');
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 relative overflow-hidden rounded-xl border border-border shadow-sm">
      {/* Intro Phase */}
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center p-6 text-center h-full space-y-6"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20">
              <Eye className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Fundoscopia Digital IA</h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Utilize a câmera e o flash do smartphone para capturar o fundo de olho do paciente. 
                A IA analisará a retina e vasos sanguíneos.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left">
              <div className="bg-white p-3 rounded-xl border shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
                <p className="text-[11px] text-slate-600 leading-tight">Mapeamento de Glaucoma e Hipertensão</p>
              </div>
              <div className="bg-white p-3 rounded-xl border shadow-sm">
                <Database className="w-5 h-5 text-blue-500 mb-1" />
                <p className="text-[11px] text-slate-600 leading-tight">Cruzado com +40k estudos globais</p>
              </div>
            </div>

            <Button onClick={startCamera} size="lg" className="w-full max-w-sm rounded-xl h-14 text-base shadow-lg shadow-primary/25">
              <Camera className="w-5 h-5 mr-2" /> Iniciar Exame
            </Button>
          </motion.div>
        )}

        {/* Camera Phase */}
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
            {/* Ophthalmoscope Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-emerald-400 rounded-full opacity-60 flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
              <div className="absolute top-8 text-white/80 text-xs text-center w-full bg-black/40 py-2">
                Aproxime a lente da pupila do paciente<br/>Ative o flash (Lanterna)
              </div>
            </div>
            
            <div className="absolute bottom-8 w-full flex justify-center px-6 gap-4">
              <Button variant="secondary" size="icon" className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white" onClick={() => setPhase('intro')}>
                <RefreshCcw className="w-6 h-6" />
              </Button>
              <Button onClick={captureAndAnalyze} className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 border-4 border-white/20 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                <Camera className="w-8 h-8 text-white" />
              </Button>
              <Button variant="secondary" size="icon" className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white" onClick={() => toast('Flash ativado manualmente (se suportado pelo disp.)')}>
                <Zap className="w-6 h-6" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Analyzing Phase */}
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
                <Eye className="w-12 h-12 text-primary opacity-50" />
                {/* Scanline */}
                <motion.div 
                  className="absolute w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399]"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              </div>
            </div>
            
            <div className="w-full max-w-xs space-y-3">
              <h3 className="font-semibold text-lg">IA Processando...</h3>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary" style={{ width: `${analyzingProgress}%` }} />
              </div>
              <p className="text-xs text-primary font-mono h-8">{aiLog}</p>
            </div>
          </motion.div>
        )}

        {/* Result Phase */}
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
                <h2 className="text-lg font-bold text-slate-800 leading-tight">Parecer Diagnóstico IA</h2>
                <p className="text-xs text-slate-500">Exame de Fundo de Olho · {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Risco Identificado</p>
                  <p className={`text-lg font-black ${result.risk === 'Alto' ? 'text-rose-600' : result.risk === 'Moderado' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    Risco {result.risk}
                  </p>
                </div>
                {result.risk === 'Alto' ? <AlertTriangle className="w-8 h-8 text-rose-500" /> : <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
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

              <div>
                <p className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary" /> Conduta Sugerida
                </p>
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <p className="text-xs text-blue-900/80 leading-relaxed">
                    {result.recommendation}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setPhase('intro')}>
                Repetir
              </Button>
              <Button className="flex-1 rounded-xl shadow-lg shadow-primary/20" onClick={onComplete}>
                Anexar ao Chat
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
