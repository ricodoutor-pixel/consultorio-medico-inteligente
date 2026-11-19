import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Video, MessageCircle, Clock, CalendarX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { doctorChannel } from "@/lib/realtime-channels";

interface Appt {
  id: string;
  patient_id: string;
  scheduled_at: string;
  status: string;
  type: string;
  payment_status: string;
  notes: string | null;
}

const ACTIVE = ["scheduled", "confirmed", "waiting", "in_progress"];

function typeLabel(t: string) {
  if (t === "chat") return "Chat";
  if (t === "return" || t === "retorno") return "Retorno";
  return "Vídeo";
}

/** Sala de espera real: somente consultas da médica logada, lidas do servidor. */
export function RealWaitingRoom({ doctorId }: { doctorId: string }) {
  const [appts, setAppts] = useState<Appt[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 12 * 3600_000).toISOString();
    const { data, error: err } = await supabase
      .from("appointments")
      .select("id, patient_id, scheduled_at, status, type, payment_status, notes")
      .eq("doctor_id", doctorId)
      .in("status", ACTIVE)
      .gte("scheduled_at", since)
      .order("scheduled_at", { ascending: true })
      .limit(50);
    if (err) { setError(true); setAppts([]); return; }
    setError(false);
    const rows = (data ?? []) as Appt[];
    setAppts(rows);
    const ids = [...new Set(rows.map((r) => r.patient_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setNames(Object.fromEntries((profs ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name || "Paciente"])));
    }
  }, [doctorId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      channel = supabase
        .channel(`${doctorChannel(uid, "waiting-room")}-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `doctor_id=eq.${doctorId}` }, () => load())
        .subscribe();
    });
    return () => { clearInterval(t); if (channel) supabase.removeChannel(channel); };
  }, [doctorId, load]);

  if (appts === null) return <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">Carregando suas consultas…</div>;

  if (appts.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center space-y-2">
        <CalendarX className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="font-bold text-foreground">{error ? "Não foi possível carregar suas consultas agora." : "Você ainda não tem consultas agendadas."}</p>
        <p className="text-sm text-muted-foreground">Deixe o botão ON ligado para receber pacientes. Quando um paciente pagar, ele aparece aqui.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60">
      {appts.map((a) => {
        const paid = a.payment_status === "paid";
        const when = new Date(a.scheduled_at);
        return (
          <div key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate">{names[a.patient_id] || "Paciente"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {when.toLocaleDateString("pt-BR")} {when.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {typeLabel(a.type)}
                {a.status === "in_progress" ? " · Em atendimento" : ""}
              </p>
              {a.notes ? <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.notes}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${paid ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {paid ? "Pago" : "Aguardando pagamento"}
              </span>
              {paid ? (
                <Link
                  to={`/workspace-medico?patient=${encodeURIComponent(a.patient_id)}&appt=${encodeURIComponent(a.id)}&type=${a.type === "chat" ? "chat" : "video"}`}
                  className="px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90"
                >
                  {a.type === "chat" ? <MessageCircle className="h-4 w-4" /> : <Video className="h-4 w-4" />} Entrar na sala
                </Link>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
