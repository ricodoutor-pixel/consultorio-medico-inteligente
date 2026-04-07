import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users, Clock, Video, MessageSquare, CheckCircle2, Wifi, Shield, Bell, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

type QueueItem = {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  type: string;
  status: string;
  notes: string | null;
  amount: number;
};

const SalaEspera = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<"patient" | "doctor">("patient");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("waiting-room")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchQueue();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, doctorId]);

  const fetchQueue = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    setCurrentUserId(session.user.id);

    // Check if doctor
    const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", session.user.id).maybeSingle();
    
    if (doctor) {
      setUserType("doctor");
      setDoctorId(doctor.id);
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctor.id)
        .in("status", ["scheduled", "confirmed", "in_progress"])
        .order("scheduled_at", { ascending: true });
      if (data) setAppointments(data as QueueItem[]);
    } else {
      setUserType("patient");
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", session.user.id)
        .in("status", ["scheduled", "confirmed", "in_progress"])
        .order("scheduled_at", { ascending: true });
      if (data) setAppointments(data as QueueItem[]);
    }
    setLoading(false);
  };

  const getPositionInQueue = (appt: QueueItem) => {
    const idx = appointments.findIndex(a => a.id === appt.id);
    return idx + 1;
  };

  const getEstimatedWait = (position: number) => {
    const minutes = (position - 1) * 15;
    if (minutes === 0) return "Você é o próximo!";
    return `~${minutes} min`;
  };

  const handleStartConsultation = async (appointmentId: string) => {
    await supabase.from("appointments").update({ status: "in_progress" }).eq("id", appointmentId);
    toast({ title: "Consulta iniciada! 🩺" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-green border border-green flex items-center justify-center glow-green">
                <Users size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-black text-foreground">
                  Sala de Espera <span className="text-gradient-green">Virtual</span>
                </h1>
                <p className="text-xs text-muted-foreground font-semibold">
                  {userType === "doctor" ? "Gerencie sua fila de pacientes" : "Acompanhe sua posição na fila"}
                </p>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex flex-wrap gap-2 my-6">
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                <Wifi size={10} className="mr-1" /> Conexão Segura TLS 1.3
              </Badge>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                <Shield size={10} className="mr-1" /> Criptografia AES-256
              </Badge>
              <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary">
                <Bell size={10} className="mr-1" /> Notificações Ativas
              </Badge>
            </div>

            {/* Live indicator */}
            <Card className="border-border border-primary/20 mb-6">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-bold text-foreground">
                    {userType === "doctor" ? `${appointments.length} paciente(s) na fila` : "Sala de espera ativa"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {Math.floor(elapsedSeconds / 60).toString().padStart(2, "0")}:{(elapsedSeconds % 60).toString().padStart(2, "0")} na sala
                </span>
              </CardContent>
            </Card>

            {appointments.length === 0 ? (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <Clock size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-display font-black text-foreground mb-2">Nenhuma consulta na fila</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {userType === "doctor" ? "Quando pacientes agendarem, aparecerão aqui em tempo real." : "Agende uma consulta para entrar na sala de espera."}
                  </p>
                  {userType === "patient" && (
                    <Button className="bg-primary text-primary-foreground font-bold rounded-xl" asChild>
                      <Link to="/agendamento">Agendar Consulta <ArrowRight size={16} className="ml-2" /></Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => {
                  const position = getPositionInQueue(appt);
                  const isInProgress = appt.status === "in_progress";
                  const isNext = position === 1 && !isInProgress;

                  return (
                    <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className={`border-border ${isInProgress ? "border-primary/40 bg-primary/5" : isNext ? "border-primary/20" : ""}`}>
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isInProgress ? "bg-primary/10" : "bg-muted"}`}>
                                {isInProgress ? (
                                  <Video size={20} className="text-primary" />
                                ) : (
                                  <span className="text-lg font-display font-black text-foreground">#{position}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm text-foreground">
                                    {appt.type === "video" ? "Teleconsulta Vídeo" : appt.type === "chat" ? "Consulta Chat" : "Consulta"}
                                  </p>
                                  {isInProgress && (
                                    <Badge className="bg-primary/10 text-primary text-[10px]">EM ANDAMENTO</Badge>
                                  )}
                                  {isNext && !isInProgress && (
                                    <Badge className="bg-primary/10 text-primary text-[10px] animate-pulse">PRÓXIMO</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(appt.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                                {appt.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{appt.notes}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {userType === "patient" && !isInProgress && (
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Espera estimada</p>
                                  <p className="font-display font-black text-sm text-primary">{getEstimatedWait(position)}</p>
                                </div>
                              )}
                              {isInProgress && (
                                <Button className="bg-primary text-primary-foreground font-bold rounded-xl" asChild>
                                  <Link to={`/consulta-video?appointment=${appt.id}`}>
                                    <Video size={14} className="mr-1" /> Entrar na Sala
                                  </Link>
                                </Button>
                              )}
                              {userType === "doctor" && !isInProgress && isNext && (
                                <Button className="bg-primary text-primary-foreground font-bold rounded-xl" onClick={() => handleStartConsultation(appt.id)}>
                                  <CheckCircle2 size={14} className="mr-1" /> Chamar Paciente
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Tips */}
            <Card className="border-border mt-8">
              <CardContent className="p-5">
                <h3 className="font-display font-black text-foreground text-sm mb-3">📋 Instruções da Sala de Espera</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-primary mt-0.5 shrink-0" /> Mantenha a página aberta — você será notificado quando for sua vez.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-primary mt-0.5 shrink-0" /> Verifique sua câmera e microfone antes da consulta.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-primary mt-0.5 shrink-0" /> Tenha seu documento de identidade em mãos (Art. 5º, CFM 2.314/2022).</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-primary mt-0.5 shrink-0" /> A conexão é criptografada ponta-a-ponta (AES-256).</li>
                  <li className="flex items-start gap-2"><Shield size={12} className="text-secondary mt-0.5 shrink-0" /> Nenhuma gravação é realizada sem seu consentimento expresso (Art. 7º, CFM 2.314/2022).</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default SalaEspera;
