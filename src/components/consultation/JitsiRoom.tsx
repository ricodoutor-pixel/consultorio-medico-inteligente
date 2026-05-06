/**
 * JitsiRoom — embed seguro do Jitsi Meet para teleconsulta.
 * Usa o External API oficial: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
 */
import { useEffect, useRef } from "react";
import { APP_CONFIG } from "@/lib/app-config";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

interface JitsiRoomProps {
  roomName: string;
  displayName?: string;
  isDoctor?: boolean;
  onClose?: () => void;
  onReady?: () => void;
}

// Use the official public Jitsi domain (corrige typo "meet.jitsi.si")
const JITSI_DOMAIN = (APP_CONFIG?.JITSI?.DOMAIN || "meet.jit.si").replace("meet.jitsi.si", "meet.jit.si");
const SCRIPT_URL = `https://${JITSI_DOMAIN}/external_api.js`;

let scriptPromise: Promise<void> | null = null;
function loadJitsiScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar Jitsi External API"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function JitsiRoom({ roomName, displayName, isDoctor, onClose, onReady }: JitsiRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadJitsiScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;
        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: `plr-${roomName}`,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName: displayName || (isDoctor ? "Médico" : "Paciente") },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            startWithAudioMuted: !isDoctor,
            startWithVideoMuted: false,
          },
          interfaceConfigOverwrite: {
            DEFAULT_BACKGROUND: "#0a0c10",
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "desktop", "chat", "raisehand",
              "tileview", "hangup", "settings", "fullscreen",
            ],
          },
        });
        apiRef.current.addListener("videoConferenceJoined", () => onReady?.());
        apiRef.current.addListener("readyToClose", () => onClose?.());
      })
      .catch((err) => console.error("[JitsiRoom]", err));
    return () => {
      cancelled = true;
      try { apiRef.current?.dispose(); } catch { /* noop */ }
      apiRef.current = null;
    };
  }, [roomName, displayName, isDoctor, onClose, onReady]);

  return <div ref={containerRef} className="w-full h-full min-h-[400px] bg-black" />;
}

export default JitsiRoom;
