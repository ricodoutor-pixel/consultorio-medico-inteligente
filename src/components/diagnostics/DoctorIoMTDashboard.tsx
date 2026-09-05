import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bluetooth, HeartPulse, Stethoscope, CheckCircle, ShieldAlert } from 'lucide-react';
import { useIoMT } from '@/hooks/diagnostics/useIoMT';
import { FHIRObservation } from '@/types/clinical-diagnostics';
import { SaMDBiofeedbackDisclaimer } from '@/components/compliance/SaMDBiofeedbackDisclaimer';

export const DoctorIoMTDashboard = () => {
  const { 
    stethoscope, 
    connectDigitalStethoscope, 
    setStethoscopeFilter,
    generateFHIRRecord,
    rppgData
  } = useIoMT();

  const [fhirRecord, setFhirRecord] = useState<FHIRObservation | null>(null);

  const handleGenerateFHIR = async () => {
    const record = await generateFHIRRecord('PT-88902', 'rPPG');
    setFhirRecord(record);
  };

  return (
    <div className="space-y-4 mt-6">
      <SaMDBiofeedbackDisclaimer toolName="A telemetria de auscultação digital e fotopletismografia (IoMT)" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      {/* Estetoscópio Digital BLE */}
      <Card className="col-span-1 lg:col-span-2 border-indigo-800/20 shadow-md">
        <CardHeader className="bg-indigo-50 flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-indigo-900 flex items-center gap-2 text-lg">
              <Stethoscope className="w-5 h-5 text-indigo-700" />
              Auscultação Digital (PCG)
            </CardTitle>
            <p className="text-xs text-indigo-700 opacity-80">Conexão BLE e Fonocardiograma</p>
          </div>
          <Button 
            onClick={connectDigitalStethoscope} 
            variant={stethoscope.isConnected ? 'outline' : 'default'}
            className={stethoscope.isConnected ? 'bg-indigo-100 text-indigo-900 border-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'}
          >
            <Bluetooth className="w-4 h-4 mr-2" />
            {stethoscope.isConnected ? stethoscope.deviceName : 'Emparelhar Estetoscópio'}
          </Button>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          
          <div className="flex gap-2">
            {(['bell', 'diaphragm', 'wide'] as const).map(mode => (
              <Button 
                key={mode}
                variant={stethoscope.filterMode === mode ? 'default' : 'outline'}
                size="sm"
                className={stethoscope.filterMode === mode ? 'bg-indigo-600' : ''}
                onClick={() => setStethoscopeFilter(mode)}
              >
                {mode === 'bell' ? 'Sino (Cardíaco)' : mode === 'diaphragm' ? 'Diafragma (Pulmonar)' : 'Estendido'}
              </Button>
            ))}
          </div>

          <div className="h-40 bg-slate-900 rounded-lg border border-slate-700 relative overflow-hidden flex items-center p-2">
            {!stethoscope.isConnected ? (
              <p className="text-slate-500 text-sm w-full text-center">Aguardando fluxo de áudio IoMT...</p>
            ) : (
              <div className="w-full flex items-center h-full">
                {/* Simulador visual de PCG / Osciloscópio */}
                <svg viewBox="0 0 1000 100" className="w-full h-full stroke-green-400 fill-none" preserveAspectRatio="none">
                  <path 
                    d={`M 0 50 ${Array.from({length: 50}).map((_, i) => `L ${i * 20} ${50 + Math.random() * 80 - 40}`).join(' ')}`} 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            )}
            {stethoscope.heartSounds.s1Detected && (
              <div className="absolute top-2 right-2 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded border border-green-500/30">
                S1 / S2 Detectado (AI)
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Assinatura HL7 FHIR */}
      <Card className="border-slate-200 shadow-md">
        <CardHeader className="bg-slate-50 pb-2">
          <CardTitle className="text-slate-800 flex items-center gap-2 text-md">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Interoperabilidade FHIR
          </CardTitle>
          <p className="text-xs text-slate-500">Proveniência Ed25519</p>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Empacote os biossinais aferidos na sessão em um recurso HL7 FHIR assinado criptograficamente.
          </p>
          <Button onClick={handleGenerateFHIR} className="w-full" variant="outline">
            Assinar Diagnóstico (rPPG)
          </Button>
          
          {fhirRecord && (
            <div className="bg-slate-900 p-3 rounded-lg text-green-400 text-[10px] font-mono overflow-auto max-h-32 shadow-inner">
              <pre>{JSON.stringify(fhirRecord, null, 2)}</pre>
            </div>
          )}
          {fhirRecord?.securitySignature?.verified && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <ShieldAlert className="w-4 h-4" />
              Hash: {fhirRecord.securitySignature.hash.substring(0, 16)}...
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
