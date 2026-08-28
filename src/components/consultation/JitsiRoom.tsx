/**
 * JitsiRoom — embed seguro do Jitsi Meet para teleconsulta.
 * Usa o External API oficial: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
 *
 * Inclui detecção automática de instabilidade de rede / queda de WebRTC com
 * modal de failover imediato para o WhatsApp institucional (+55 11 99136-3154).
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, RefreshCw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

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
const WHATSAPP_FALLBACK = "https://wa.me/5511991363154?text=Ol%C3%A1%2C%20minha%20conex%C3%A3o%20de%20v%C3%ADdeo%20caiu%20durante%20a%20consulta.%20Poderia%20me%20atender%20por%20aqui%3F";

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
  const userInitiatedLeave = useRef(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const effectiveDomain = domain || DEFAULT_DOMAIN;

  const handleConnectionDrop = useCallback(() => {
    if (!userInitiatedLeave.current) {
      console.warn("[JitsiRoom] Queda de conexão detectada. Exibindo modal de failover.");
      setConnectionFailed(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    userInitiatedLeave.current = false;
    setConnectionFailed(false);

    loadJitsiScript(effectiveDomain)
      .then(() => {
        if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;

        apiRef.current = new window.JitsiMeetExternalAPI(effectiveDomain, {
          roomName,
          jwt: jwt || undefined,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName: displayName || (isDoctor ? "Médico Prescritor" : "Paciente") },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            startWithAudioMuted: !isDoctor,
            startWithVideoMuted: false,
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
        apiRef.current.addListener("readyToClose", () => {
          userInitiatedLeave.current = true;
          onClose?.();
        });

        apiRef.current.addListener("videoConferenceLeft", () => {
          if (!userInitiatedLeave.current) {
            handleConnectionDrop();
          }
        });

        apiRef.current.addListener("errorOccurred", (error: any) => {
          console.warn("[JitsiRoom] Evento de erro Jitsi:", error);
          const errName = error?.error?.name || error?.name || "";
          if (
            errName.includes("connectionError") ||
            errName.includes("droppedError") ||
            errName.includes("notEstablished")
          ) {
            handleConnectionDrop();
          }
        });
      })
      .catch((err: unknown) => {
        console.error("[JitsiRoom] Erro de inicialização:", err);
        setConnectionFailed(true);
      });

    return () => {
      cancelled = true;
      try {
        apiRef.current?.dispose();
      } catch {
        /* noop */
      }
      apiRef.current = null;
    };
  }, [roomName, effectiveDomain, jwt, displayName, isDoctor, onClose, onReady, handleConnectionDrop]);

  if (connectionFailed) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6 p-8 text-center bg-zinc-950/95 border border-amber-500/20 rounded-2xl">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Radio className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-white">
            Conexão de Vídeo Instável
          </h2>
          <p className="text-sm text-zinc-400">
            Sua conexão de rede sofreu uma oscilação. Não se preocupe: você pode continuar a consulta imediatamente via WhatsApp com o médico ou tentar reconectar.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={WHATSAPP_FALLBACK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950"
          >
            <MessageCircle className="w-5 h-5" />
            Continuar pelo WhatsApp
          </a>
          <Button
            onClick={() => {
              setConnectionFailed(false);
              window.location.reload();
            }}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Reconectar
          </Button>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full min-h-[400px] bg-black rounded-xl overflow-hidden" />;
}

export default JitsiRoom;
