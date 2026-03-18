/**
 * Jitsi Meet Integration Service
 * Handles video consultations and meetings
 * 
 * Environment Variables Required:
 * - VITE_JITSI_DOMAIN: Jitsi domain (e.g., meet.jitsi.si)
 * - VITE_JITSI_ROOM_PREFIX: Room name prefix (e.g., plantayraiz)
 */

interface JitsiRoomConfig {
  roomName: string;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  isDoctor?: boolean;
  consultationId: string;
  startTime: string;
  duration: number; // in minutes
}

interface JitsiRoomResponse {
  success: boolean;
  roomUrl?: string;
  roomName?: string;
  message: string;
  jwtToken?: string;
}

interface ConsultationData {
  consultationId: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  doctorEmail: string;
  patientEmail: string;
  startTime: string;
  duration: number;
  specialty: string;
  reason: string;
}

interface ConsultationResponse {
  success: boolean;
  roomUrl?: string;
  consultationId?: string;
  message: string;
  doctorJoinUrl?: string;
  patientJoinUrl?: string;
}

interface RecordingData {
  roomName: string;
  consultationId: string;
  doctorName: string;
  patientName: string;
}

interface RecordingResponse {
  success: boolean;
  recordingId?: string;
  status?: string;
  message: string;
  downloadUrl?: string;
}

/**
 * Generate Jitsi room URL
 */
export function generateJitsiRoomUrl(config: JitsiRoomConfig): string {
  const domain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jitsi.si';
  const roomPrefix = import.meta.env.VITE_JITSI_ROOM_PREFIX || 'plantayraiz';
  
  // Generate unique room name
  const roomName = `${roomPrefix}-${config.consultationId}`;
  
  // Build URL with parameters
  const params = new URLSearchParams({
    'userInfo.displayName': config.userName,
    'userInfo.email': config.userEmail,
  });

  if (config.userAvatarUrl) {
    params.append('userInfo.avatarUrl', config.userAvatarUrl);
  }

  // Add doctor-specific settings
  if (config.isDoctor) {
    params.append('config.startWithVideoMuted', 'false');
    params.append('config.startWithAudioMuted', 'false');
  } else {
    params.append('config.startWithVideoMuted', 'true');
    params.append('config.startWithAudioMuted', 'true');
  }

  return `https://${domain}/${roomName}?${params.toString()}`;
}

/**
 * Create a consultation room
 */
export async function createConsultationRoom(data: ConsultationData): Promise<ConsultationResponse> {
  try {
    const response = await fetch('/api/jitsi/consultations/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consultationId: data.consultationId,
        doctorId: data.doctorId,
        patientId: data.patientId,
        doctorName: data.doctorName,
        patientName: data.patientName,
        doctorEmail: data.doctorEmail,
        patientEmail: data.patientEmail,
        startTime: data.startTime,
        duration: data.duration,
        specialty: data.specialty,
        reason: data.reason,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Consultation room creation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      roomUrl: result.roomUrl,
      consultationId: result.consultationId,
      message: 'Consultation room created successfully',
      doctorJoinUrl: result.doctorJoinUrl,
      patientJoinUrl: result.patientJoinUrl,
    };
  } catch (error) {
    console.error('[Jitsi] Consultation room creation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create consultation room',
    };
  }
}

/**
 * Start recording consultation
 */
export async function startRecording(data: RecordingData): Promise<RecordingResponse> {
  try {
    const response = await fetch('/api/jitsi/recordings/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName: data.roomName,
        consultationId: data.consultationId,
        doctorName: data.doctorName,
        patientName: data.patientName,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Recording start failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      recordingId: result.recordingId,
      status: result.status,
      message: 'Recording started successfully',
    };
  } catch (error) {
    console.error('[Jitsi] Recording start error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start recording',
    };
  }
}

/**
 * Stop recording consultation
 */
export async function stopRecording(recordingId: string): Promise<RecordingResponse> {
  try {
    const response = await fetch(`/api/jitsi/recordings/${recordingId}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Recording stop failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      recordingId: result.recordingId,
      status: result.status,
      message: 'Recording stopped successfully',
      downloadUrl: result.downloadUrl,
    };
  } catch (error) {
    console.error('[Jitsi] Recording stop error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to stop recording',
    };
  }
}

/**
 * Get consultation room status
 */
export async function getConsultationStatus(consultationId: string): Promise<{
  success: boolean;
  status?: string;
  participants?: number;
  duration?: number;
  message: string;
}> {
  try {
    const response = await fetch(`/api/jitsi/consultations/${consultationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get consultation status: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      status: result.status,
      participants: result.participants,
      duration: result.duration,
      message: 'Consultation status retrieved successfully',
    };
  } catch (error) {
    console.error('[Jitsi] Get consultation status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get consultation status',
    };
  }
}

/**
 * End consultation
 */
export async function endConsultation(consultationId: string): Promise<{
  success: boolean;
  message: string;
  endedAt?: string;
  recordingUrl?: string;
}> {
  try {
    const response = await fetch(`/api/jitsi/consultations/${consultationId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to end consultation: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: 'Consultation ended successfully',
      endedAt: result.endedAt,
      recordingUrl: result.recordingUrl,
    };
  } catch (error) {
    console.error('[Jitsi] End consultation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to end consultation',
    };
  }
}

/**
 * Initialize Jitsi API
 */
export function initializeJitsiAPI(): void {
  if (typeof window === 'undefined') return;

  // Check if Jitsi API is already loaded
  if ((window as any).JitsiMeetExternalAPI) {
    console.log('[Jitsi] API already loaded');
    return;
  }

  // Load Jitsi API script
  const script = document.createElement('script');
  script.src = 'https://meet.jitsi.si/external_api.js';
  script.async = true;
  script.onload = () => {
    console.log('[Jitsi] API loaded successfully');
  };
  script.onerror = () => {
    console.error('[Jitsi] Failed to load API');
  };
  document.head.appendChild(script);
}

/**
 * Create Jitsi iframe
 */
export function createJitsiIframe(containerId: string, config: JitsiRoomConfig): void {
  if (typeof window === 'undefined') return;

  const domain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jitsi.si';
  const roomPrefix = import.meta.env.VITE_JITSI_ROOM_PREFIX || 'plantayraiz';
  const roomName = `${roomPrefix}-${config.consultationId}`;

  const options = {
    roomName,
    width: '100%',
    height: '100%',
    parentNode: document.getElementById(containerId),
    configOverwrite: {
      startWithVideoMuted: !config.isDoctor,
      startWithAudioMuted: !config.isDoctor,
      disableSimulcast: false,
      enableLayerSuspension: true,
      resolution: 720,
      constraints: {
        video: {
          height: {
            ideal: 720,
            max: 720,
            min: 240,
          },
        },
      },
    },
    interfaceConfigOverwrite: {
      DEFAULT_BACKGROUND: '#000000',
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      MOBILE_APP_PROMO: false,
      SHOW_PROMOTIONAL_CLOSE_PAGE: false,
      TOOLBAR_BUTTONS: [
        'microphone',
        'camera',
        'closedcaptions',
        'desktop',
        'fullscreen',
        'fodeviceselection',
        'hangup',
        'profile',
        'chat',
        'recording',
        'livestreaming',
        'etherpad',
        'sharedvideo',
        'settings',
        'raisehand',
        'videoquality',
        'filmstrip',
        'invite',
        'feedback',
        'stats',
        'shortcuts',
        'tileview',
        'toggle-camera',
        'download-logs',
      ],
    },
    userInfo: {
      displayName: config.userName,
      email: config.userEmail,
    },
  };

  try {
    const api = new (window as any).JitsiMeetExternalAPI(domain, options);

    // Event listeners
    api.addEventListener('videoConferenceJoined', () => {
      console.log('[Jitsi] User joined conference');
    });

    api.addEventListener('videoConferenceLeft', () => {
      console.log('[Jitsi] User left conference');
    });

    api.addEventListener('participantJoined', (participant: any) => {
      console.log('[Jitsi] Participant joined:', participant);
    });

    api.addEventListener('participantLeft', (participant: any) => {
      console.log('[Jitsi] Participant left:', participant);
    });

    api.addEventListener('readyToClose', () => {
      console.log('[Jitsi] Conference ready to close');
    });

    return api;
  } catch (error) {
    console.error('[Jitsi] Failed to create iframe:', error);
  }
}

export default {
  generateJitsiRoomUrl,
  createConsultationRoom,
  startRecording,
  stopRecording,
  getConsultationStatus,
  endConsultation,
  initializeJitsiAPI,
  createJitsiIframe,
};
