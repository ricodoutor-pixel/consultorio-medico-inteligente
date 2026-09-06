export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'preliminary' | 'final' | 'amended';
  category: 'vital-signs' | 'exam' | 'audio-biomarker';
  code: {
    system: string; // LOINC / SNOMED-CT
    code: string;
    display: string;
  };
  subject: { reference: string; display?: string };
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  component?: Array<{
    code: { text: string };
    valueQuantity?: { value: number; unit: string };
    valueString?: string;
  }>;
  securitySignature?: {
    algorithm: 'Ed25519';
    hash: string;
    verified: boolean;
  };
}

export interface RPPGMetrics {
  heartRateBpm: number;
  hrvRmssdMs: number;
  respiratoryRateRpm: number;
  perfusionIndex: number;
  signalQuality: number; // 0.0 a 1.0
  isProcessing: boolean;
}

export interface StethoscopeTelemetry {
  isConnected: boolean;
  deviceName: string;
  batteryLevel?: number;
  filterMode: 'bell' | 'diaphragm' | 'wide'; // Cardíaco (20-200Hz), Pulmonar (100-1000Hz), Estendido
  rawAudioBuffer: Float32Array;
  heartSounds: {
    s1Detected: boolean;
    s2Detected: boolean;
    murmurConfidence: number;
    arrhythmiaSuspected: boolean;
  };
}

export interface VocalBiomarkers {
  f0Hz: number;
  jitterPct: number;
  shimmerPct: number;
  hnrDb: number; // Harmonics-to-Noise Ratio
  vocalStrainIndex: 'normal' | 'moderate' | 'elevated';
  stressScore: number; // 0 a 100
}
