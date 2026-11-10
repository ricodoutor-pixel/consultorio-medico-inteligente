import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PaymentConfirmedNotice({ pix = false, label = "Continuar", to, onContinue }: {
  pix?: boolean; label?: string; to?: string; onContinue?: () => void;
}) {
  return <div role="status" aria-live="polite" className="border-2 border-emerald-500/40 bg-emerald-500/10 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
    <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0" size={24} />
    <div className="flex-1 min-w-0">
      <p className="font-bold text-emerald-700 dark:text-emerald-300">Pagamento reconhecido pelo sistema</p>
      <p className="text-sm text-muted-foreground">{pix ? "Pix confirmado com sucesso! Continue para a próxima etapa." : "Pagamento confirmado com sucesso! Continue para a próxima etapa."}</p>
    </div>
    {to ? <Button asChild className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"><Link to={to}>{label}<ArrowRight size={16} className="ml-2" /></Link></Button>
      : onContinue ? <Button onClick={onContinue} className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white">{label}<ArrowRight size={16} className="ml-2" /></Button> : null}
  </div>;
}