import { VitalSignsPayload } from '@/types/monitoring';

type VitalCallback = (data: VitalSignsPayload) => void;

export class RuViewWebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private onDataCallback: VitalCallback | null = null;
  private reconnectInterval: number = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
  }

  public connect(onData: VitalCallback): void {
    this.onDataCallback = onData;
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('[RuView WS] Conectado ao servidor de sensoriamento');
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const parsed: VitalSignsPayload = JSON.parse(event.data);
          if (this.onDataCallback) {
            this.onDataCallback(parsed);
          }
        } catch (err) {
          console.error('[RuView WS] Erro ao decodificar frame:', err);
        }
      };

      this.socket.onerror = (err) => {
        console.error('[RuView WS] Erro de conexão:', err);
      };

      this.socket.onclose = () => {
        console.warn('[RuView WS] Conexão encerrada. Tentando reconectar...');
        this.scheduleReconnect();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.onDataCallback) this.connect(this.onDataCallback);
    }, this.reconnectInterval);
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
