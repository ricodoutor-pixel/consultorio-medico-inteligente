import { useState, useEffect, useRef } from 'react';
import { RuViewWebSocketService } from '@/services/ruview-socket';
import { VitalSignsPayload } from '@/types/monitoring';

export function useVitalSignsMonitoring(wsUrl: string) {
  const [currentVitals, setCurrentVitals] = useState<VitalSignsPayload | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [vitalsHistory, setVitalsHistory] = useState<{ time: string; hr: number; resp: number }[]>([]);
  const socketRef = useRef<RuViewWebSocketService | null>(null);

  useEffect(() => {
    socketRef.current = new RuViewWebSocketService(wsUrl);
    setConnectionStatus('connecting');

    socketRef.current.connect((data: VitalSignsPayload) => {
      setConnectionStatus('connected');
      setCurrentVitals(data);

      setVitalsHistory((prev) => {
        const newPoint = {
          time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          hr: data.heart_rate.bpm,
          resp: data.respiration.rpm
        };
        const updated = [...prev, newPoint];
        // Keep last 50 points
        return updated.length > 50 ? updated.slice(updated.length - 50) : updated;
      });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [wsUrl]);

  return { currentVitals, connectionStatus, vitalsHistory };
}
