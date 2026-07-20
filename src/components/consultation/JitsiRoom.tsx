/**
 * JitsiRoom — embed seguro do Jitsi Meet para teleconsulta.
 * Usa o External API oficial: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
 *
 * IMPORTANTE: roomName e domain devem vir EXATAMENTE como retornados pelas
 * edge functions create-video-room / join-video-room. Nao adicione prefixos
 * nem transforme o nome aqui — o JWT emitido pelo backend contem o claim
 * `room` com o nome exato, e qualquer alteracao local quebra a validacao.
 */
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiRoomProps {
  roomName: string;
  domain?: string;
  jwt?: string;
  displayName?: string;
  isDoctor?: boolean;
  onClose?: () => void;
  onReady?: () => void;
}

const DEFAULT_DOMAIN = "meet.jit.si";

let loadedScriptDomain: string | null = null;
let scriptPromise: Promise<void> | null = null;
function loadJitsiScript(domain: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.JitsiMeetExternalAPI && loadedScriptDomain === domain) return Promise.resolve();
  if (scriptPromise && loadedScriptDomain === domain) return scriptPromise;
  loadedScriptDomain = domain;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://${domain}/external_api.js`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar Jitsi External API"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function JitsiRoom({
  roomName,
  domain,
  jwt,
  displayName,
  isDoctor,
  onClose,
  onReady,
}: JitsiRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const effectiveDomain = domain || DEFAULT_DOMAIN;

  useEffect(() => {
    let cancelled = false;
    loadJitsiScript(effectiveDomain)
      .then(() => {
        if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;
        apiRef.current = new window.JitsiMeetExternalAPI(effectiveDomain, {
          roomName,
          jwt: jwt || undefined,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName: displayName || (isDoctor ? "Médico" : "Paciente") },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            startWithAudioMuted: !isDoctor,
            startWithVideoMuted: false,
            // Controle de lobby/moderador ja vem embutido no JWT (feature
            // 'lobby-bypass', decidida pelo backend) — nao duplicar aqui.
            e2eeLabels: { e2ee: "Criptografia ponta a ponta" },
          },
          interfaceConfigOverwrite: {
            DEFAULT_BACKGROUND: "#0a0c10",
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "desktop", "chat", "raisehand",
              "tileview", "hangup", "settings", "fullscreen", "security",
            ],
          },
        });
        apiRef.current.addListener("videoConferenceJoined", () => onReady?.());
        apiRef.current.addListener("readyToClose", () => onClose?.());
      })
      .catch((err: unknown) => console.error("[JitsiRoom]", err));
    return () => {
      cancelled = true;
      try { apiRef.current?.dispose(); } catch { /* noop */ }
      apiRef.current = null;
    };
  }, [roomName, effectiveDomain, jwt, displayName, isDoctor, onClose, onReady]);

  return <div ref={containerRef} className="w-full h-full min-h-[400px] bg-black" />;
}

export default JitsiRoom;
