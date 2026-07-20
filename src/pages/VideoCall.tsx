import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VideoCall } from "@/components/VideoCall";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Leaf, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Página /videochamada — usa o componente VideoCall (Jitsi real)
// URL esperada: /videochamada?consultation=CONS-XXXX&name=João&role=doctor|patient

const VideoCallPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [userDisplayName, setUserDisplayName] = useState<string>("");

  const consultationId = params.get("consultation") || params.get("id") || "";
  const roleParam      = params.get("role") || "patient";
  const nameParam      = params.get("name") || "";
  const isDoctor       = roleParam === "doctor";

  // Obter nome do usuário logado se não passou por URL
  useEffect(() => {
    if (nameParam) { setUserDisplayName(nameParam); return; }
    supabase.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata;
      setUserDisplayName(meta?.full_name || meta?.name || (isDoctor ? "Dr. Edilson Bezerra" : "Paciente"));
    });
  }, [nameParam, isDoctor]);

  // Cronômetro da consulta
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  if (!consultationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <Leaf className="w-12 h-12 text-primary mx-auto" />
          <p className="text-lg font-bold text-foreground">Link de consulta inválido</p>
          <p className="text-sm text-muted-foreground">
            Acesse pelo link enviado no seu e-mail ou WhatsApp.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft size={16} className="mr-2" /> Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col h-full gap-4"
        >
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <h1 className="text-lg font-display font-black text-foreground">
                  Teleconsulta Médica
                </h1>
                <p className="text-xs text-muted-foreground">
                  ID: <span className="font-mono">{consultationId}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5 text-[10px] font-bold">
                <ShieldCheck size={10} className="mr-1" /> E2EE · CFM 2.314/2022
              </Badge>
              <Badge className="bg-primary/10 text-primary border-primary/20 font-bold font-mono">
                {formatTime(elapsed)}
              </Badge>
            </div>
          </header>

          {/* Componente Jitsi Real */}
          <div className="flex-grow" style={{ minHeight: "600px" }}>
            <VideoCall
              consultationId={consultationId}
              displayName={userDisplayName}
              isDoctor={isDoctor}
              onClose={() => navigate("/dashboard")}
            />
          </div>

          {/* Footer disclaimer CFM */}
          <p className="text-center text-[10px] text-muted-foreground">
            Consulta criptografada (E2EE) · Planta y Raiz Ltda · Dr. Edilson Bezerra CRM-SP 10963 ·
            Conforme CFM 2.314/2022 e LGPD
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default VideoCallPage;
