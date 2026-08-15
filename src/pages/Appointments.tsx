/**
 * Appointments — Página de consultas agendadas com botão "Entrar na Sala"
 * que roteia médico e paciente para a MESMA sala Jitsi, usando o
 * `consultation_id` real da consulta.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  status: string;
  type: string | null;
  notes: string | null;
}

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Appointment[]>([]);
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [entering, setEntering] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data: doctor } = await supabase
        .from("doctors").select("id").eq("user_id", session.user.id).maybeSingle();

      let query = supabase.from("appointments").select("*")
        .in("status", ["scheduled", "confirmed", "in_progress"])
        .order("scheduled_at", { ascending: true });

      if (doctor) {
        setRole("doctor");
        query = query.eq("doctor_id", doctor.id);
      } else {
        setRole("patient");
        query = query.eq("patient_id", session.user.id);
      }
      const { data } = await query;
      setItems((data as Appointment[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const enterRoom = async (appt: Appointment) => {
    try {
      setEntering(appt.id);
      // Pré-provisiona a sala (idempotente) para garantir que ambos
      // (médico e paciente) entrem no mesmo room_name.
      const { error } = await supabase.functions.invoke("create-video-room", {
        body: { consultation_id: appt.id },
      });
      if (error) throw error;
      if (role === "doctor") {
        navigate(`/workspace-medico?patient=${appt.patient_id}&appt=${appt.id}`);
      } else {
        navigate(`/orientacao-video?appointment=${appt.id}`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível abrir a sala");
    } finally {
      setEntering(null);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-32 pb-20">
        <header className="mb-8">
          <h1 className="text-2xl font-display font-black text-foreground">Minhas Consultas</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {role === "doctor" ? "Agenda profissional" : "Suas orientações técnicas agendadas"}
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <Card className="border-border bg-card/50">
            <CardContent className="py-16 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma consulta agendada.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map((appt) => (
              <Card key={appt.id} className="border-border bg-card/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Video size={14} className="text-primary" />
                      {appt.type || "Orientação Técnica"}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/20 bg-primary/5">
                      {appt.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} className="text-primary" />
                    {format(new Date(appt.scheduled_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <Button
                    onClick={() => enterRoom(appt)}
                    disabled={entering === appt.id}
                    className="rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {entering === appt.id ? (
                      <><Loader2 size={14} className="mr-2 animate-spin" /> Abrindo...</>
                    ) : (
                      <>Entrar na Sala <ArrowRight size={14} className="ml-2" /></>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AppointmentsPage;
