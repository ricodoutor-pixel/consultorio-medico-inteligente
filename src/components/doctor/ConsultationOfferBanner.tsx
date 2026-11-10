import { setVisibleInterval } from "@/lib/visible-interval";
// 🌿 Convite de consulta em tempo real — o profissional tem 5 minutos (janela da triagem) para aceitar.
// Exibe o contador regressivo e o relatório da triagem assim que o paciente concluir as 5 perguntas.
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Stethoscope, Timer } from "lucide-react";

interface Offer {
  id: string;
  patient_id?: string | null;
  appointment_id: string | null;
  consultation_type: string;
  amount: number;
  expires_at: string;
  response_token: string | null;
}

interface Props {
  /** id da linha em `doctors` do profissional logado */
  doctorId: string | null | undefined;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/consultation-offer`;

export function ConsultationOfferBanner({ doctorId }: Props) {
  const { toast } = useToast();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [triageNotes, setTriageNotes] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState<"yes" | "no" | null>(null);

  const load = useCallback(async () => {
    if (!doctorId) return;
    const { data } = await supabase
      .from("consultation_offers")
      .select("id, patient_id, appointment_id, consultation_type, amount, expires_at, response_token")
      .eq("doctor_id", doctorId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);
    const activeOffer = (data?.[0] as Offer | undefined) ?? null;
    setOffer(activeOffer);

    if (activeOffer?.appointment_id) {
      const { data: appt } = await supabase
        .from("appointments")
        .select("patient_id, notes")
        .eq("id", activeOffer.appointment_id)
        .maybeSingle();
      setPatientId(appt?.patient_id ?? activeOffer.patient_id ?? null);
      setTriageNotes(appt?.notes ? String(appt.notes) : null);
    } else {
      setTriageNotes(null);
    }
  }, [doctorId]);

  useEffect(() => {
    void load();
    const t = setVisibleInterval(() => void load(), 6_000);
    return () => t();
  }, [load]);

  useEffect(() => {
    if (!offer) return;
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(offer.expires_at).getTime() - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) setOffer(null);
    };
    tick();
    const t = setVisibleInterval(tick, 1000);
    return () => t();
  }, [offer]);

  const fmtCountdown = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const respond = async (reply: "yes" | "no") => {
    if (!offer?.response_token) return;
    setBusy(reply);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const res = await fetch(
        `${FN_URL}?action=respond&offer=${offer.id}&token=${offer.response_token}&reply=${reply}`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${sessionData.session?.access_token ?? anonKey}`,
          },
        },
      );
      if (!res.ok) throw new Error(String(res.status));
      if (reply === "yes" && offer.appointment_id) {
        const pId = patientId || offer.patient_id || "paciente";
        window.location.href = `/workspace-medico?patient=${encodeURIComponent(pId)}&appt=${encodeURIComponent(offer.appointment_id)}&type=${encodeURIComponent(offer.consultation_type || "video")}`;
        return;
      }
      toast({
        title: "Consulta repassada",
        description: "Encaminhamos o paciente ao próximo profissional de plantão.",
      });
      setOffer(null);
    } catch {
      toast({
        title: "Não conseguimos registrar sua resposta",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  if (!offer) return null;

  return (
    <Card className="mb-6 border-2 border-primary/50 bg-primary/5" role="alert" aria-live="assertive">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-foreground text-sm md:text-base">
                  Você tem uma consulta agora na Planta y Raiz — pode atender?
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                  Pagamento reconhecido
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Modalidade: {offer.consultation_type} · Janela de atendimento sincronizada com a triagem de 5 perguntas (5 minutos).
              </p>
              <p className="text-sm font-mono font-black text-primary mt-2 flex items-center gap-1.5">
                <Timer size={15} /> {fmtCountdown(seconds)} para atender — sem resposta em 5 min, transfere automaticamente na fila
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={() => void respond("yes")}
              disabled={busy !== null}
              className="h-11 rounded-xl font-black px-6"
            >
              {busy === "yes" ? <Loader2 className="animate-spin mr-2" size={16} /> : null} SIM, atender agora
            </Button>
            <Button
              variant="outline"
              onClick={() => void respond("no")}
              disabled={busy !== null}
              className="h-11 rounded-xl font-bold"
            >
              {busy === "no" ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Não posso agora
            </Button>
          </div>
        </div>

        {/* Relatório da triagem em tempo real assim que o paciente concluir */}
        <div className="rounded-xl border border-border bg-card/80 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <FileText size={13} className="text-primary" /> Relatório da Triagem (5 perguntas)
            </span>
            <Badge variant={triageNotes ? "default" : "secondary"} className="text-[10px]">
              {triageNotes ? "Triagem concluída pelo paciente" : "Paciente respondendo (janela de 5 min)…"}
            </Badge>
          </div>
          {triageNotes ? (
            <pre className="whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed max-h-40 overflow-y-auto pt-1">
              {triageNotes}
            </pre>
          ) : (
            <p className="text-muted-foreground">
              O relatório completo das 5 perguntas aparece aqui automaticamente assim que o paciente concluir.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ConsultationOfferBanner;

