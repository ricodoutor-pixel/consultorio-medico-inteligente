import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AffiliateWithdrawalProps {
  availableBalance: number;
  userId: string;
  onSuccess?: () => void;
}

export function AffiliateWithdrawal({ availableBalance, userId, onSuccess }: AffiliateWithdrawalProps) {
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleWithdraw = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value < 20) {
      toast({ title: "Valor mínimo de R$ 20,00", variant: "destructive" });
      return;
    }
    if (value > availableBalance) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    if (!pixKey.trim()) {
      toast({ title: "Informe sua chave PIX", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("affiliate_withdrawals").insert({
        user_id: userId,
        amount: value,
        pix_key: pixKey,
        status: "pending",
      });

      if (error) throw error;

      // Update wallet balance
      await supabase
        .from("affiliate_wallets")
        .update({
          available_balance: availableBalance - value,
          pending_balance: value,
        })
        .eq("user_id", userId);

      setSuccess(true);
      toast({ title: "Saque solicitado!", description: `R$ ${value.toFixed(2)} será processado em até 48h.` });
      onSuccess?.();
    } catch (err) {
      toast({ title: "Erro ao solicitar saque", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center p-6">
        <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
        <h3 className="text-lg font-black text-foreground mb-2">Saque Solicitado!</h3>
        <p className="text-sm text-muted-foreground">Processamento em até 48h úteis via PIX.</p>
      </motion.div>
    );
  }

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet size={20} className="text-primary" />
          Solicitar Saque
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground">Saldo Disponível</p>
          <p className="text-2xl font-black text-primary">R$ {availableBalance.toFixed(2)}</p>
        </div>

        {availableBalance < 20 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle size={14} />
            Saldo mínimo de R$ 20,00 para saque
          </div>
        ) : (
          <>
            <Input
              type="number"
              placeholder="Valor do saque (mín. R$ 20)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background border-border"
              min={20}
              max={availableBalance}
            />
            <Input
              placeholder="Chave PIX (CPF, e-mail, telefone)"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="bg-background border-border"
            />
            <Button
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold rounded-xl gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}
              {loading ? "Processando..." : "Solicitar Saque via PIX"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Saques processados em dias úteis. Taxa: R$ 0,00.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
