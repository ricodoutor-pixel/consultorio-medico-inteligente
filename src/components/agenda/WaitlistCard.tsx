import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  doctorDbId: string;
  doctorName: string;
  modality: string;
  userId: string | null;
}

const WAITLIST_MODALITIES = new Set(["video", "chat", "premium", "renovacao"]);

/**
 * Sem horário livre: o paciente entra na lista de espera e recebe um único aviso no WhatsApp quando a agenda do
 * médico abrir vaga (cron consultation-reminders). Nada é reservado: a vaga é de quem agendar primeiro.
 */
export function WaitlistCard({ doctorDbId, doctorName, modality, userId }: Props) {
  const navigate = useNavigate();
  const [entryId, setEntryId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const mod = WAITLIST_MODALITIES.has(modality) ? modality : "video";

  useEffect(() => {
    if (!userId) {
      setChecking(false);
      return;
    }
    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela nova ainda fora dos tipos gerados
    void (supabase as any)
      .from("consultation_waitlist")
      .select("id")
      .eq("patient_id", userId)
      .eq("doctor_id", doctorDbId)
      .eq("modality", mod)
      .eq("status", "waiting")
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => {
        if (!active) return;
        setEntryId(data?.id ?? null);
        setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [userId, doctorDbId, mod]);

  const join = async () => {
    if (!userId) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setBusy(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela nova ainda fora dos tipos gerados
    const { data, error } = await (supabase as any)
      .from("consultation_waitlist")
      .insert({ patient_id: userId, doctor_id: doctorDbId, modality: mod })
      .select("id")
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error("Não foi possível entrar na lista de espera agora. Tente de novo.");
      return;
    }
    setEntryId(data.id);
    toast.success("Pronto! Avisaremos no seu WhatsApp quando abrir horário.");
  };

  const leave = async () => {
    if (!entryId) return;
    setBusy(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela nova ainda fora dos tipos gerados
    const { error } = await (supabase as any)
      .from("consultation_waitlist")
      .update({ status: "cancelled" })
      .eq("id", entryId);
    setBusy(false);
    if (error) toast.error("Não foi possível sair da lista agora.");
    else setEntryId(null);
  };

  return (
    <Card className="border-amber-500/40 bg-amber-500/5 rounded-2xl">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-black text-foreground inline-flex items-center gap-2">
            <BellRing size={16} className="text-amber-600" /> Sem horários livres com {doctorName} agora
          </p>
          <p className="text-xs text-muted-foreground">
            {entryId
              ? "Você está na lista de espera. Avisaremos uma vez no WhatsApp quando abrir vaga."
              : "Entre na lista de espera e receba um aviso no WhatsApp assim que abrir horário. Cadastre seu celular no perfil."}
          </p>
        </div>
        {checking ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : entryId ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 size={14} /> Na lista
            </span>
            <Button size="sm" variant="ghost" onClick={() => void leave()} disabled={busy} className="text-xs">
              Sair da lista
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => void join()} disabled={busy} className="rounded-xl font-black text-xs h-9">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Avise-me quando abrir"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
