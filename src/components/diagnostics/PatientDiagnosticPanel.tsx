import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Activity, Mic, Bluetooth, HeartPulse } from 'lucide-react';
import { useIoMT } from '@/hooks/diagnostics/useIoMT';

export const PatientDiagnosticPanel = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { 
    rppgData, 
    vocalData, 
    startRPPG, 
    startVocalAnalysis 
  } = useIoMT();

  const [activeModule, setActiveModule] = useState<'none' | 'rppg' | 'vocal'>('none');
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopFn) stopFn();
    };
  }, [stopFn]);

  const handleStartRPPG = async () => {
    if (stopFn) stopFn();
    setActiveModule('rppg');
    if (videoRef.current) {
      const stop = await startRPPG(videoRef.current);
      setStopFn(() => stop);
    }
  };

  const handleStartVocal = async () => {
    if (stopFn) stopFn();
    setActiveModule('vocal');
    const stop = await startVocalAnalysis();
    setStopFn(() => stop);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {/* Módulo rPPG */}
      <Card className="border-green-800/20 shadow-md">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-green-900 flex items-center gap-2 text-lg">
            <Camera className="w-5 h-5 text-green-700" />
            Fotopletismografia Remota (rPPG)
          </CardTitle>
          <p className="text-xs text-green-700 opacity-80">Aferição óptica de biossinais (Câmera)</p>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          <div className="relative bg-black rounded-lg aspect-video flex items-center justify-center overflow-hidden border border-gray-200">
            {activeModule !== 'rppg' && (
              <Button onClick={handleStartRPPG} variant="outline" className="z-10">
                Ativar Rastreio Facial
              </Button>
            )}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-cover ${activeModule === 'rppg' ? 'opacity-100' : 'opacity-0'}`}
            />
            {rppgData.isProcessing && (
              <div className="absolute inset-0 border-4 border-green-500/50 rounded-lg animate-pulse pointer-events-none" />
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-3 bg-gray-50 rounded border">
              <span className="block text-xs text-muted-foreground">Frequência Cardíaca</span>
              <strong className="text-xl text-green-800">{rppgData.heartRateBpm.toFixed(0)} <span className="text-xs">BPM</span></strong>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
              <span className="block text-xs text-muted-foreground">Freq. Respiratória</span>
              <strong className="text-xl text-blue-800">{rppgData.respiratoryRateRpm.toFixed(0)} <span className="text-xs">RPM</span></strong>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
              <span className="block text-xs text-muted-foreground">VFC (RMSSD)</span>
              <strong className="text-xl text-purple-800">{rppgData.hrvRmssdMs.toFixed(0)} <span className="text-xs">ms</span></strong>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
              <span className="block text-xs text-muted-foreground">Qualidade do Sinal</span>
              <strong className="text-xl text-yellow-700">{(rppgData.signalQuality * 100).toFixed(0)}%</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulo Biomarcadores Vocais */}
      <Card className="border-blue-800/20 shadow-md">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
            <Mic className="w-5 h-5 text-blue-700" />
            Biomarcadores Vocais (DSP)
          </CardTitle>
          <p className="text-xs text-blue-700 opacity-80">Rastreio acústico de estresse e fonação</p>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center border border-gray-200 relative overflow-hidden">
             {activeModule !== 'vocal' ? (
              <Button onClick={handleStartVocal} variant="outline" className="z-10">
                Iniciar Captação Vocal
              </Button>
             ) : (
               <div className="flex gap-1 items-end h-16">
                 {[...Array(20)].map((_, i) => (
                   <div 
                     key={i} 
                     className="w-2 bg-blue-500 rounded-t animate-pulse" 
                     style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.05}s` }} 
                   />
                 ))}
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-3 bg-gray-50 rounded border">
              <span className="block text-xs text-muted-foreground">Frequência Base (F0)</span>
              <strong className="text-xl text-slate-800">{vocalData.f0Hz.toFixed(1)} <span className="text-xs">Hz</span></strong>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
              <span className="block text-xs text-muted-foreground">Jitter / Shimmer</span>
              <strong className="text-xl text-slate-800">{vocalData.jitterPct.toFixed(1)}% / {vocalData.shimmerPct.toFixed(1)}%</strong>
            </div>
            <div className="p-3 bg-gray-50 rounded border col-span-2 flex justify-between items-center">
              <div>
                <span className="block text-xs text-muted-foreground">Índice de Estresse (AI)</span>
                <strong className="text-xl text-red-600">{vocalData.stressScore} <span className="text-xs">/ 100</span></strong>
              </div>
              <Activity className="w-6 h-6 text-red-500 opacity-50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
