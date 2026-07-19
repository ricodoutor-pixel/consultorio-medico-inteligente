/**
 * VideoCall — Sala de telemedicina Jitsi (Planta y Raíz).
 * Usa @jitsi/react-sdk preservando o tema escuro/verde da plataforma.
 * Backend: chama a edge function `create-video-room` para obter o nome
 * de sala seguro e único por consulta, validado por RLS.
 */
import { useEffect, useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoCallProps {
  consultationId: string;
  displayName?: string;
  isDoctor?: boolean;
  onReady?: () => void;
  onClose?: () => void;
}

const JITSI_DOMAIN = "meet.jit.si";

export function VideoCall({ consultationId, displayName, isDoctor, onReady, onClose }: VideoCallProps) {
  const [roomName, setRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke("create-video-room", {
          body: { consultation_id: consultationId },
        });
        if (cancelled) return;
        if (error) throw error;
        if (!data?.room_name) throw new Error("Sala indisponível");
        setRoomName(data.room_name);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Falha ao abrir a sala");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [consultationId]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[500px] bg-neutral-950 flex items-center justify-center rounded-2xl border border-primary/20">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Abrindo sala segura...
          </p>
        </div>
      </div>
    );
  }

  if (error || !roomName) {
    return (
      <div className="w-full h-full min-h-[500px] bg-neutral-950 flex items-center justify-center rounded-2xl border border-red-500/30">
        <div className="text-center space-y-3 max-w-sm px-6">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-sm font-bold text-red-300">Não foi possível abrir a sala</p>
          <p className="text-xs text-muted-foreground">{error ?? "Consulta não encontrada ou acesso negado."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden bg-black border border-primary/20 shadow-[0_0_40px_-10px_rgba(34,197,94,0.35)]">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <Badge className="bg-primary/10 text-primary border-primary/20 font-bold flex items-center gap-1">
          <ShieldCheck size={12} /> Sala segura
        </Badge>
      </div>
      <JitsiMeeting
        domain={JITSI_DOMAIN}
        roomName={roomName}
        configOverwrite={{
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithAudioMuted: !isDoctor,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          defaultLanguage: "pt",
        }}
        interfaceConfigOverwrite={{
          DEFAULT_BACKGROUND: "#0a0c10",
          DEFAULT_REMOTE_DISPLAY_NAME: isDoctor ? "Paciente" : "Médico(a)",
          TOOLBAR_BUTTONS: [
            "microphone", "camera", "desktop", "chat", "raisehand",
            "tileview", "hangup", "settings", "fullscreen",
          ],
        }}
        userInfo={{
          displayName: displayName || (isDoctor ? "Médico(a) Planta y Raíz" : "Paciente"),
          email: "",
        }}
        onApiReady={() => onReady?.()}
        onReadyToClose={() => onClose?.()}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = "100%";
          iframeRef.style.width = "100%";
          iframeRef.style.minHeight = "500px";
          iframeRef.style.border = "0";
        }}
      />
    </div>
  );
}

export default VideoCall;
