import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EscrowItem {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

export const DeliveryConfirmation = ({ escrows, onConfirmed }: { escrows: EscrowItem[]; onConfirmed: () => void }) => {
  const [confirming, setConfirming] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConfirm = async (escrowId: string) => {
    setConfirming(escrowId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke("process-payout", {
        body: { action: "confirm_delivery", escrow_id: escrowId },
      });

      if (res.error) throw res.error;

      toast({
        title: "✅ Tratamento Confirmado!",
        description: "Pagamentos liberados automaticamente para médico e lojista.",
      });
      onConfirmed();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao confirmar", variant: "destructive" });
    } finally {
      setConfirming(null);
    }
  };

  const pending = escrows.filter(e => e.status === "held");
  if (pending.length === 0) return null;

  return (
    <Card className="border-[hsl(45,76%,52%)]/20 bg-[hsl(45,76%,52%)]/5">
      <CardContent className="p-5">
        <h3 className="font-display font-black text-foreground text-sm mb-3 flex items-center gap-2">
          <Package size={14} className="text-[hsl(45,76%,52%)]" /> Confirmar Recebimento
        </h3>
        <p className="text-[10px] text-muted-foreground mb-3">
          Confirme o recebimento do tratamento para liberar o pagamento aos profissionais.
        </p>
        <div className="space-y-2">
          {pending.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
              <div>
                <p className="text-sm font-bold text-foreground capitalize">{e.type}</p>
                <p className="text-xs text-muted-foreground">
                  R$ {Number(e.amount).toFixed(2)} • {new Date(e.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Button
                size="sm"
                className="rounded-xl text-xs bg-primary text-primary-foreground"
                disabled={confirming === e.id}
                onClick={() => handleConfirm(e.id)}
              >
                {confirming === e.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={14} className="mr-1" /> Recebido
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
