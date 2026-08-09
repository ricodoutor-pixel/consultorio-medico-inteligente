/**
 * VideoCall — pagina simples de videochamada Jitsi (uso interno / links diretos).
 *
 * O fluxo canonico de teleconsulta e /orientacao-video (com TCLE, prontuario,
 * IA scribe etc). Esta pagina existe apenas para links diretos ao Jitsi
 * quando ja ha um `roomName` conhecido (ex.: rooms de diagnostico ou
 * salas geradas por edge functions externas).
 */
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { JitsiRoom } from "@/components/consultation/JitsiRoom";

export default function VideoCall() {
  const [params] = useSearchParams();
  const roomName = params.get("room") || "plantayraiz-lobby";
  const jwt = params.get("jwt") || undefined;
  const displayName = params.get("name") || undefined;
  const isDoctor = params.get("role") === "doctor";

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="h-[calc(100vh-5rem)]">
          <JitsiRoom roomName={roomName} jwt={jwt} displayName={displayName} isDoctor={isDoctor} />
        </div>
      </main>
    </div>
  );
}
