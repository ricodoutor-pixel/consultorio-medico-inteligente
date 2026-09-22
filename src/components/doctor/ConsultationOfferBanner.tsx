// 🌿 Convite de consulta em tempo real — o profissional tem 1 minuto para aceitar.
// Se recusar ou o tempo esgotar, a consulta passa automaticamente ao próximo
// profissional online com KYC 100% verde (regra oficial da plataforma).
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Stethoscope, Timer } from "lucide-react";

interface Offer {
  id: string;
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
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState<"yes" | "no" | null>(null);

  const load = useCallback(async () => {
    if (!doctorId) return;
    const { data } = await supabase
      .from("consultation_offers")
      .select("id, appointment_id, consultation_type, amount, expires_at, response_token")
      .eq("doctor_id", doctorId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);
    setOffer((data?.[0] as Offer | undefined) ?? null);
  }, [doctorId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 10_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!offer) return;
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(offer.expires_at).getTime() - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) setOffer(null);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [offer]);

  const respond = async (reply: "yes" | "no") => {
    if (!offer?.response_token) return;
    setBusy(reply);
    try {
      const res = await fetch(
        `${FN_URL}?action=respond&offer=${offer.id}&token=${offer.response_token}&reply=${reply}`,
      );
      if (!res.ok) throw new Error(String(res.status));
      if (reply === "yes" && offer.appointment_id) {
        window.location.href = `/consultorio?appointment=${offer.appointment_id}`;
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
      <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-foreground text-sm md:text-base">
              Você tem uma consulta agora na Planta y Raiz — pode atender?
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Modalidade {offer.consultation_type} · pagamento confirmado · triagem da Enfª Brisa anexada.
            </p>
            <p className="text-xs font-bold text-primary mt-2 flex items-center gap-1">
              <Timer size={14} /> {seconds}s para responder — depois passa ao próximo profissional
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={() => void respond("yes")}
            disabled={busy !== null}
            className="h-11 rounded-xl font-black px-6"
          >
            {busy === "yes" ? <Loader2 className="animate-spin mr-2" size={16} /> : null} SIM, atender
          </Button>
          <Button
            variant="outline"
            onClick={() => void respond("no")}
            disabled={busy !== null}
            className="h-11 rounded-xl font-bold"
          >
            {busy === "no" ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Não
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ConsultationOfferBanner;
