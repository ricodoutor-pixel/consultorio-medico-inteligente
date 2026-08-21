import { useState, useCallback, useRef } from 'react';
import { 
  RPPGMetrics, 
  StethoscopeTelemetry, 
  VocalBiomarkers, 
  FHIRObservation 
} from '@/types/clinical-diagnostics';
import { toast } from 'sonner';

/**
 * Encapsula a lógica de IoMT e Diagnóstico Clínico.
 * Para consolidação INPI, esta estrutura abstrai as APIs nativas do navegador 
 * (Web Bluetooth, Web Audio API, getUserMedia) transformando sinais brutos 
 * em recursos HL7 FHIR assináveis criptograficamente.
 */
export const useIoMT = () => {
  // 1. Fotopletismografia Remota (rPPG)
  const [rppgData, setRppgData] = useState<RPPGMetrics>({
    heartRateBpm: 0,
    hrvRmssdMs: 0,
    respiratoryRateRpm: 0,
    perfusionIndex: 0,
    signalQuality: 0,
    isProcessing: false
  });

  // 2. Auscultação Digital / Estetoscópio BLE
  const [stethoscope, setStethoscope] = useState<StethoscopeTelemetry>({
    isConnected: false,
    deviceName: 'Desconectado',
    filterMode: 'wide',
    rawAudioBuffer: new Float32Array(0),
    heartSounds: {
      s1Detected: false,
      s2Detected: false,
      murmurConfidence: 0,
      arrhythmiaSuspected: false
    }
  });

  // 3. Biomarcadores Vocais
  const [vocalData, setVocalData] = useState<VocalBiomarkers>({
    f0Hz: 0,
    jitterPct: 0,
    shimmerPct: 0,
    hnrDb: 0,
    vocalStrainIndex: 'normal',
    stressScore: 0
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Inicializa o fluxo da câmera para rPPG.
   * Utiliza processamento no Canvas para extração de intensidade espectral (G channel).
   */
  const startRPPG = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoElement.srcObject = stream;
      setRppgData(prev => ({ ...prev, isProcessing: true }));
      
      // Simulação de processamento de quadros e DSP para arquitetura (Mock MVP)
      // Em produção, aplicaria-se FFT sobre o array extraído do canvas
      const interval = setInterval(() => {
        setRppgData(prev => ({
          ...prev,
          heartRateBpm: 65 + Math.random() * 5,
          hrvRmssdMs: 40 + Math.random() * 10,
          respiratoryRateRpm: 14 + Math.random() * 2,
          perfusionIndex: 1.2 + Math.random() * 0.3,
          signalQuality: 0.85 + Math.random() * 0.1
        }));
      }, 1000);

      return () => {
        clearInterval(interval);
        stream.getTracks().forEach(t => t.stop());
        setRppgData(prev => ({ ...prev, isProcessing: false }));
      };
    } catch (err) {
      toast.error('Falha ao acessar a câmera para rPPG. Verifique as permissões.');
      throw err;
    }
  }, []);

  /**
   * Conecta a um estetoscópio digital via Web Bluetooth API.
   * Exemplo de perfil GATT genérico (Heart Rate / Audio Stream).
   */
  const connectDigitalStethoscope = useCallback(async () => {
    if (!(navigator as any).bluetooth) {
      toast.error('Web Bluetooth não é suportado neste navegador.');
      return;
    }
    try {
      // Requerimento do dispositivo focado em saúde (BLE)
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'battery_service'] // IDs padronizados GATT
      });

      setStethoscope(prev => ({ 
        ...prev, 
        isConnected: true, 
        deviceName: device.name || 'Estetoscópio BLE Genérico' 
      }));
      toast.success(`Estetoscópio ${device.name || ''} conectado com sucesso!`);

      // Mock de streaming contínuo
      setInterval(() => {
        setStethoscope(prev => ({
          ...prev,
          rawAudioBuffer: new Float32Array(1024).map(() => Math.random() * 2 - 1),
          heartSounds: {
            s1Detected: Math.random() > 0.5,
            s2Detected: Math.random() > 0.5,
            murmurConfidence: Math.random() * 0.2,
            arrhythmiaSuspected: false
          }
        }));
      }, 1000);

    } catch (err) {
      console.error(err);
      toast.error('Conexão BLE cancelada ou falhou.');
    }
  }, []);

  /**
   * Altera o filtro digital do estetoscópio (Sino / Diafragma).
   */
  const setStethoscopeFilter = useCallback((mode: 'bell' | 'diaphragm' | 'wide') => {
    setStethoscope(prev => ({ ...prev, filterMode: mode }));
    toast.info(`Filtro acústico alterado para: ${mode.toUpperCase()}`);
  }, []);

  /**
   * Inicia a extração de biomarcadores vocais usando Web Audio API (AnalyserNode).
   */
  const startVocalAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);

      const analyzeFrame = () => {
        analyser.getFloatFrequencyData(dataArray);
        // Extração simulada de métricas baseadas na energia espectral
        setVocalData({
          f0Hz: 120 + Math.random() * 80, // Frequência fundamental média
          jitterPct: 0.5 + Math.random() * 1.5,
          shimmerPct: 2.0 + Math.random() * 3.0,
          hnrDb: 15 + Math.random() * 5,
          vocalStrainIndex: 'normal',
          stressScore: Math.floor(Math.random() * 30)
        });
        requestAnimationFrame(analyzeFrame);
      };
      analyzeFrame();

      return () => {
        stream.getTracks().forEach(t => t.stop());
        audioContextRef.current?.close();
      };
    } catch (err) {
      toast.error('Falha ao acessar o microfone para análise vocal.');
    }
  }, []);

  /**
   * Empacota um diagnóstico em um recurso HL7 FHIR (Observation) com assinatura Ed25519 (Mock).
   */
  const generateFHIRRecord = useCallback(async (
    patientRef: string,
    diagnosticType: 'rPPG' | 'Vocal' | 'PCG'
  ): Promise<FHIRObservation> => {
    
    // Hash HMAC Simulado (MVP de Proveniência INPI)
    const encoder = new TextEncoder();
    const data = encoder.encode(Date.now().toString() + patientRef);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const mockHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const baseObservation: FHIRObservation = {
      resourceType: 'Observation',
      id: `obs-${Date.now()}`,
      status: 'final',
      category: 'vital-signs',
      code: { system: 'http://loinc.org', code: '8716-3', display: 'Vital signs' },
      subject: { reference: `Patient/${patientRef}` },
      effectiveDateTime: new Date().toISOString(),
      securitySignature: {
        algorithm: 'Ed25519',
        hash: mockHash,
        verified: true
      }
    };

    if (diagnosticType === 'rPPG') {
      baseObservation.component = [
        { code: { text: 'Heart Rate' }, valueQuantity: { value: rppgData.heartRateBpm, unit: 'bpm' } },
        { code: { text: 'Respiratory Rate' }, valueQuantity: { value: rppgData.respiratoryRateRpm, unit: 'rpm' } }
      ];
    } else if (diagnosticType === 'Vocal') {
      baseObservation.category = 'audio-biomarker';
      baseObservation.component = [
        { code: { text: 'Stress Score' }, valueQuantity: { value: vocalData.stressScore, unit: 'score' } },
        { code: { text: 'Fundamental Frequency' }, valueQuantity: { value: vocalData.f0Hz, unit: 'Hz' } }
      ];
    }

    return baseObservation;
  }, [rppgData, vocalData]);

  return {
    rppgData,
    stethoscope,
    vocalData,
    startRPPG,
    connectDigitalStethoscope,
    setStethoscopeFilter,
    startVocalAnalysis,
    generateFHIRRecord
  };
};
