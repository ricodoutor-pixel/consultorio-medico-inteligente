import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Médico em consulta (luz amarela): o paciente pede um WhatsApp quando ele voltar a ficar disponível.
 * Aviso único (cron doctor-free-alerts); o pedido expira em 3 horas.
 */
export function DoctorFreeAlertButton({ doctorDbId }: { doctorDbId: string }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active || !session) return;
      setUserId(session.user.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela nova ainda fora dos tipos gerados
      const { data } = await (supabase as any)
        .from("doctor_free_alerts")
        .select("id")
        .eq("patient_id", session.user.id)
        .eq("doctor_id", doctorDbId)
        .eq("status", "waiting")
        .maybeSingle();
      if (active) setAlertId(data?.id ?? null);
    });
    return () => {
      active = false;
    };
  }, [doctorDbId]);

  const subscribe = async () => {
    if (!userId) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela nova ainda fora dos tipos gerados
    const { data, error } = await (supabase as any)
      .from("doctor_free_alerts")
      .insert({ patient_id: userId, doctor_id: doctorDbId })
      .select("id")
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error("Não foi possível ativar o aviso agora. Tente de novo.");
      return;
    }
    setAlertId(data.id);
    toast.success("Combinado! Avisaremos no seu WhatsApp quando o médico ficar livre.");
  };

  if (alertId) {
    return (
      <p className="mt-1 text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
        <CheckCircle2 size={14} /> Aviso ativado: você recebe um WhatsApp quando a luz ficar verde.
      </p>
    );
  }
  return (
    <Button size="sm" variant="outline" className="mt-1 h-8 text-xs border-amber-500/60" onClick={() => void subscribe()} disabled={busy}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <BellRing className="h-3.5 w-3.5 mr-1 text-amber-600" />}
      Avise-me quando ficar livre
    </Button>
  );
}
