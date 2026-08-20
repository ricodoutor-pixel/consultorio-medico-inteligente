export interface VitalSignsPayload {
  timestamp: number;
  patient_id?: string;
  heart_rate: {
    bpm: number; // Faixa: 40 - 120
    confidence: number; // 0.0 a 1.0 (ou %)
    status: 'normal' | 'tachycardia' | 'bradycardia' | 'noise';
  };
  respiration: {
    rpm: number; // Faixa: 6 - 30
    confidence: number; // 0.0 a 1.0 (ou %)
    status: 'normal' | 'apnea_suspected' | 'tachypnea' | 'shallow';
  };
  rf_signal: {
    rssi_dbm: number;
    phase_variance: number;
    motion_energy: number;
    presence: boolean;
    persons_count: number;
  };
  semantic_states: {
    is_sleeping: boolean;
    is_distressed: boolean;
    fall_detected: boolean;
    motion_state: 'still' | 'micro_movement' | 'active' | 'empty';
  };
  security: {
    signature_ed25519?: string;
    verified: boolean;
  };
}

export interface VitalSignsHistoryItem {
  timestamp: string;
  heart_rate: number;
  respiration: number;
  sleep_state: number; // 0 = Awake, 1 = Light, 2 = Deep/REM
}
