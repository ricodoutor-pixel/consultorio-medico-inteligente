/**
 * VideoCall — Sala de telemedicina Jitsi (Planta y Raíz)
 * CFM 2.314/2022 · Lobby obrigatório · E2EE · Controles do médico
 *
 * Props:
 *   consultationId — ID único da consulta (obrigatório)
 *   displayName    — Nome a exibir na sala
 *   isDoctor       — true = médico (moderador, pode expulsar, mutar todos)
 *   onReady        — callback quando sala estiver pronta
 *   onClose        — callback quando usuário encerrar
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Tipos do Jitsi External API (carregado via script tag).
// Outro componente (JitsiRoom.tsx) já declara `JitsiMeetExternalAPI: any` no
// escopo global; para evitar TS2717 (declarações duplicadas com tipos
// divergentes), fazemos cast local em vez de re-declarar aqui.
interface JitsiOptions {
  roomName: string;
  parentNode: HTMLElement;
  jwt?: string;
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  userInfo?: { displayName: string; email: string };
  lang?: string;
}
interface JitsiAPI {
  addListener(event: string, cb: (data?: unknown) => void): void;
  removeEventListener(event: string, cb: (data?: unknown) => void): void;
  executeCommand(cmd: string, ...args: unknown[]): void;
  dispose(): void;
  isAudioMuted(): Promise<boolean>;
  isVideoMuted(): Promise<boolean>;
  getParticipantsInfo(): Array<{ participantId: string; displayName: string }>;
}

interface VideoCallProps {
  consultationId: string;
  displayName?: string;
  isDoctor?: boolean;
  onReady?: () => void;
  onClose?: () => void;
}

const JITSI_SCRIPT_URL = "https://meet.jit.si/external_api.js";

export function VideoCall({
  consultationId,
  displayName = "Participante",
  isDoctor = false,
  onReady,
  onClose,
}: VideoCallProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const apiRef         = useRef<JitsiAPI | null>(null);
  const [phase, setPhase]     = useState<"loading" | "waiting" | "active" | "error">("loading");
  const [error, setError]     = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [jitsiJwt, setJitsiJwt] = useState<string | null>(null);
  const [jitsiDomain, setJitsiDomain] = useState("meet.jit.si");
  const [participants, setParticipants] = useState(0);

  // 1. Buscar sala no backend (create-video-room edge function)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase("loading");
      setError(null);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("create-video-room", {
          body: {
            consultation_id: consultationId,
            display_name: displayName,
            is_doctor: isDoctor,
          },
        });
        if (cancelled) return;
        if (fnErr) throw fnErr;
        if (!data?.room_name) throw new Error("Sala indisponível — tente novamente");
        setRoomName(data.room_name);
        setJitsiJwt(data.jitsi_config?.jwt ?? null);
        setJitsiDomain(data.jitsi_config?.domain ?? "meet.jit.si");
        setPhase("waiting");
      } catch (e: unknown) {
        if (!cancelled) {
          setError((e as Error)?.message ?? "Falha ao abrir a sala");
          setPhase("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [consultationId, displayName, isDoctor]);

  // 2. Carregar script Jitsi e inicializar API quando roomName estiver pronto
  const initJitsi = useCallback(() => {
    if (!roomName || !containerRef.current) return;
    if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }

    const opts: JitsiOptions = {
      roomName,
      parentNode: containerRef.current,
      ...(jitsiJwt ? { jwt: jitsiJwt } : {}),
      lang: "pt",
      userInfo: { displayName, email: "" },
      configOverwrite: {
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        startWithAudioMuted: !isDoctor,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        defaultLanguage: "pt",
        // Lobby — paciente aguarda aprovação do médico
        enableLobby: true,
        // E2EE
        e2ee: {
          labels: {
            labelTooltip: "Sessão criptografada (E2EE) — somente participantes veem o conteúdo",
            labelKey: "encrypted",
          },
        },
        toolbarButtons: [
          "microphone", "camera", "desktop", "chat", "raisehand",
          "tileview", "hangup", "fullscreen",
          ...(isDoctor ? ["mute-everyone", "kick", "security", "recording", "livestreaming"] : []),
        ],
      },
      interfaceConfigOverwrite: {
        DEFAULT_BACKGROUND: "#0a0c10",
        DEFAULT_REMOTE_DISPLAY_NAME: isDoctor ? "Paciente" : "Médico(a)",
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        MOBILE_APP_PROMO: false,
        HIDE_INVITE_MORE_HEADER: true,
      },
    };

    const api = new window.JitsiMeetExternalAPI(jitsiDomain, opts);
    apiRef.current = api;

    // Eventos
    api.addListener("videoConferenceJoined", () => {
      setPhase("active");
      onReady?.();
      // Médico ativa lobby automaticamente
      if (isDoctor) {
        setTimeout(() => api.executeCommand("toggleLobby", true), 1500);
        setTimeout(() => api.executeCommand("toggleE2EE", true), 2000);
      }
    });
    api.addListener("participantJoined", () => {
      setParticipants(api.getParticipantsInfo().length + 1);
    });
    api.addListener("participantLeft", () => {
      setParticipants(Math.max(1, api.getParticipantsInfo().length + 1));
    });
    api.addListener("videoConferenceLeft", () => {
      setPhase("loading");
      onClose?.();
    });
    api.addListener("readyToClose", () => {
      onClose?.();
    });
  }, [roomName, jitsiJwt, jitsiDomain, displayName, isDoctor, onReady, onClose]);

  useEffect(() => {
    if (phase !== "waiting") return;
    if (typeof window.JitsiMeetExternalAPI !== "undefined") {
      initJitsi(); return;
    }
    // Carregar script dinamicamente
    const script = document.createElement("script");
    script.src = JITSI_SCRIPT_URL;
    script.async = true;
    script.onload = () => initJitsi();
    script.onerror = () => { setError("Falha ao carregar Jitsi Meet"); setPhase("error"); };
    document.head.appendChild(script);
    return () => {
      // cleanup: não remover script pois pode ser reusado
    };
  }, [phase, initJitsi]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => { apiRef.current?.dispose(); apiRef.current = null; };
  }, []);

  // ── UI ──────────────────────────────────────────────────────
  const baseClass = "w-full min-h-[520px] rounded-2xl overflow-hidden border bg-neutral-950";

  if (phase === "loading") {
    return (
      <div className={`${baseClass} border-primary/20 flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Preparando sala segura...
          </p>
          <p className="text-[10px] text-muted-foreground/50">Criptografia E2EE · Lobby ativo</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={`${baseClass} border-red-500/30 flex items-center justify-center`}>
        <div className="text-center space-y-4 max-w-sm px-6">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-sm font-bold text-red-300">Sala indisponível</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button
            size="sm" variant="outline"
            onClick={() => { setPhase("loading"); setRoomName(null); }}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClass} border-primary/20 relative shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)]`}
         style={{ height: "100%", minHeight: "520px" }}>

      {/* Badges de status */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 flex-wrap">
        <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] flex items-center gap-1">
          <ShieldCheck size={10} /> E2EE · CFM 2.314/2022
        </Badge>
        {phase === "active" && (
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] flex items-center gap-1">
            <Wifi size={10} /> {participants} na sala
          </Badge>
        )}
        {phase === "waiting" && (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] flex items-center gap-1 animate-pulse">
            <WifiOff size={10} />
            {isDoctor ? "Aguardando paciente..." : "Aguardando médico autorizar..."}
          </Badge>
        )}
      </div>

      {/* Container Jitsi */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export default VideoCall;
