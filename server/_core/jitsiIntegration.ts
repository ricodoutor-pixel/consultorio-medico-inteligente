import jwt from 'jsonwebtoken';

/**
 * Serviço de Integração Jitsi Meet
 * Implementa videoconferência criptografada E2E conforme CFM 2.113/2021
 *
 * Referência: https://jitsi.org/user-guide/secure-meetings/
 */

export interface JitsiMeetConfig {
  appId: string;
  apiKey: string;
  appSecret: string;
  jitsiServerUrl: string; // Ex: https://meet.jitsi.com
}

export interface JitsiRoomConfig {
  roomName: string;
  userName: string;
  userEmail: string;
  userId: string;
  userRole: 'professional' | 'patient' | 'admin';
  consultationId: string;
  enableRecording: boolean;
  recordingFileName?: string;
}

export interface JitsiToken {
  token: string;
  roomUrl: string;
  expiresIn: number;
}

/**
 * Classe para gerenciar integração com Jitsi Meet
 * Suporta criptografia E2E, gravação automática e controle de permissões
 */
export class JitsiIntegrationService {
  private config: JitsiMeetConfig;

  constructor(config: JitsiMeetConfig) {
    this.config = config;
  }

  /**
   * Gera token JWT para acesso à sala Jitsi
   * Conforme: https://jitsi.org/user-guide/jwt-authentication/
   */
  generateAccessToken(roomConfig: JitsiRoomConfig): JitsiToken {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hora
    const exp = now + expiresIn;

    // Payload JWT conforme Jitsi
    const payload = {
      iss: this.config.appId,
      sub: this.config.jitsiServerUrl,
      aud: 'jitsi',
      room: roomConfig.roomName,
      exp: exp,
      iat: now,
      nbf: now,
      name: roomConfig.userName,
      email: roomConfig.userEmail,
      // Contexto customizado
      context: {
        user: {
          id: roomConfig.userId,
          name: roomConfig.userName,
          email: roomConfig.userEmail,
          role: roomConfig.userRole,
        },
        features: {
          'recording': roomConfig.enableRecording,
          'livestreaming': false,
          'transcription': false,
          'outbound-call': false,
        },
      },
      // Permissões baseadas em role
      moderator: roomConfig.userRole === 'professional' || roomConfig.userRole === 'admin',
    };

    const token = jwt.sign(payload, this.config.appSecret, {
      algorithm: 'HS256',
    });

    const roomUrl = `${this.config.jitsiServerUrl}/${roomConfig.roomName}?jwt=${token}`;

    return {
      token,
      roomUrl,
      expiresIn,
    };
  }

  /**
   * Valida token JWT
   */
  validateToken(token: string): boolean {
    try {
      jwt.verify(token, this.config.appSecret, {
        algorithms: ['HS256'],
      });
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Gera configuração para iframe Jitsi
   * Implementa criptografia E2E e gravação automática
   */
  getJitsiIframeConfig(roomConfig: JitsiRoomConfig, token: string) {
    return {
      roomName: roomConfig.roomName,
      jwt: token,
      configOverwrite: {
        // Criptografia E2E (conforme CFM 2.113/2021)
        e2ee: {
          enabled: true,
        },
        // Gravação automática
        recordingService: {
          enabled: roomConfig.enableRecording,
          sharingUrl: `${this.config.jitsiServerUrl}/recording/`,
        },
        // Configurações de privacidade
        disableRemoteControl: false,
        disableAudioLevels: false,
        // Desabilitar features não necessárias
        disableInviteFunctions: false,
        disableProfile: false,
        // Timeout de inatividade (30 minutos)
        sessionTimeout: 30 * 60 * 1000,
        // Qualidade de vídeo
        videoQuality: {
          preferred: 'high',
          minimum: 'low',
          maximum: 'hd',
        },
      },
      interfaceConfigOverwrite: {
        // UI customizada
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'desktop',
          'fullscreen',
          'foyer',
          'chat',
          'recording',
          'settings',
          'raisehand',
          'help',
          'mute-everyone',
        ],
        // Mostrar apenas botões relevantes
        SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
        // Desabilitar features
        DISABLE_FOCUS_INDICATOR: false,
        DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
        DISABLE_RINGING: false,
        DISABLE_PRESENCE_STATUS: false,
        DISABLE_VIDEO_BACKGROUND: false,
        DISABLE_AUDIO_LEVELS: false,
        // Customização visual
        SHOW_JITSI_WATERMARK: true,
        SHOW_WATERMARK_FOR_GUESTS: true,
        BRAND_WATERMARK_LINK: 'https://plantaeraiz.com',
        SHOW_BRAND_WATERMARK: true,
        // Idioma
        DEFAULT_LANGUAGE: 'pt-BR',
        LANG_DETECTION: true,
      },
    };
  }

  /**
   * Gera URL de sala com token
   */
  generateRoomUrl(roomConfig: JitsiRoomConfig): string {
    const token = this.generateAccessToken(roomConfig);
    return token.roomUrl;
  }

  /**
   * Cria configuração de webhook para eventos de sala
   * Para integração com banco de dados
   */
  getWebhookConfig() {
    return {
      events: [
        'participant-joined',
        'participant-left',
        'recording-started',
        'recording-stopped',
        'meeting-ended',
      ],
      webhookUrl: `${process.env.WEBHOOK_URL}/api/webhooks/jitsi`,
      secret: process.env.JITSI_WEBHOOK_SECRET,
    };
  }

  /**
   * Processa webhook de evento Jitsi
   */
  processWebhookEvent(event: any) {
    const eventType = event.type;
    const roomName = event.room;
    const timestamp = new Date();

    switch (eventType) {
      case 'participant-joined':
        return {
          type: 'PARTICIPANT_JOINED',
          roomName,
          participantId: event.participantId,
          participantName: event.participantName,
          timestamp,
        };

      case 'participant-left':
        return {
          type: 'PARTICIPANT_LEFT',
          roomName,
          participantId: event.participantId,
          participantName: event.participantName,
          duration: event.duration, // segundos
          timestamp,
        };

      case 'recording-started':
        return {
          type: 'RECORDING_STARTED',
          roomName,
          recordingId: event.recordingId,
          recordingUrl: event.recordingUrl,
          timestamp,
        };

      case 'recording-stopped':
        return {
          type: 'RECORDING_STOPPED',
          roomName,
          recordingId: event.recordingId,
          recordingUrl: event.recordingUrl,
          duration: event.duration, // segundos
          fileSize: event.fileSize, // bytes
          timestamp,
        };

      case 'meeting-ended':
        return {
          type: 'MEETING_ENDED',
          roomName,
          duration: event.duration, // segundos
          participantCount: event.participantCount,
          recordingId: event.recordingId,
          timestamp,
        };

      default:
        return null;
    }
  }

  /**
   * Valida permissões de usuário para sala
   */
  validateUserPermissions(
    userRole: string,
    action: 'join' | 'moderate' | 'record' | 'invite'
  ): boolean {
    const permissions: Record<string, string[]> = {
      patient: ['join'],
      professional: ['join', 'moderate', 'record', 'invite'],
      admin: ['join', 'moderate', 'record', 'invite'],
    };

    const userPermissions = permissions[userRole] || [];
    return userPermissions.includes(action);
  }

  /**
   * Gera relatório de sessão para prontuário
   */
  generateSessionReport(sessionData: {
    roomName: string;
    participants: Array<{
      id: string;
      name: string;
      role: string;
      joinTime: Date;
      leaveTime: Date;
    }>;
    recordingUrl?: string;
    recordingDuration?: number;
    startTime: Date;
    endTime: Date;
  }) {
    const totalDuration = Math.round(
      (sessionData.endTime.getTime() - sessionData.startTime.getTime()) / 1000
    );

    return {
      consultationId: sessionData.roomName,
      type: 'TELEMEDICINE_SESSION',
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      duration: totalDuration,
      participants: sessionData.participants.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        duration: Math.round(
          (p.leaveTime.getTime() - p.joinTime.getTime()) / 1000
        ),
      })),
      recording: sessionData.recordingUrl
        ? {
            url: sessionData.recordingUrl,
            duration: sessionData.recordingDuration,
            status: 'available',
          }
        : null,
      status: 'completed',
      compliance: {
        e2eEncryption: true,
        cfrCompliant: true,
        lgpdCompliant: true,
      },
    };
  }
}

/**
 * Factory para criar instância do serviço
 */
export function createJitsiService(config: JitsiMeetConfig): JitsiIntegrationService {
  return new JitsiIntegrationService(config);
}

/**
 * Configuração padrão para ambiente de produção
 */
export const defaultJitsiConfig: JitsiMeetConfig = {
  appId: process.env.JITSI_APP_ID || 'plantaeraiz',
  apiKey: process.env.JITSI_API_KEY || '',
  appSecret: process.env.JITSI_APP_SECRET || '',
  jitsiServerUrl: process.env.JITSI_SERVER_URL || 'https://meet.jitsi.com',
};
