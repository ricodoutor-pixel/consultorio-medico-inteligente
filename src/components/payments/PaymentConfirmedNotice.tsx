import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PaymentConfirmedNotice({ pix = false, label = "Continuar", to, onContinue }: {
  pix?: boolean; label?: string; to?: string; onContinue?: () => void;
}) {
  return <div role="status" aria-live="polite" className="border border-primary/30 bg-primary/10 rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
    <CheckCircle2 className="text-primary shrink-0" size={24} />
    <div className="flex-1 min-w-0">
      <p className="font-bold text-foreground">{pix ? "Pix confirmado com sucesso!" : "Pagamento confirmado com sucesso!"}</p>
      <p className="text-sm text-muted-foreground">Continue para a próxima etapa.</p>
    </div>
    {to ? <Button asChild className="shrink-0"><Link to={to}>{label}<ArrowRight size={16} className="ml-2" /></Link></Button>
      : onContinue ? <Button onClick={onContinue} className="shrink-0">{label}<ArrowRight size={16} className="ml-2" /></Button> : null}
  </div>;
}