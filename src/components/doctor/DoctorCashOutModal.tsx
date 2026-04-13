import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Banknote, Coins, ShieldCheck, ArrowRight, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateCashOutValue } from "@/lib/domination-services";

type Step = "review" | "confirm" | "processing" | "success" | "error";

interface DoctorCashOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balanceReais: number;
  plantaCoinBalance: number;
  pixKey: string | null;
  doctorId: string;
  onSuccess?: () => void;
}

export function DoctorCashOutModal({
  open,
  onOpenChange,
  balanceReais,
  plantaCoinBalance,
  pixKey,
  doctorId,
  onSuccess,
}: DoctorCashOutModalProps) {
  const [step, setStep] = useState<Step>("review");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [convertCoins, setConvertCoins] = useState(false);
  const [coinsToConvert, setCoinsToConvert] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const MIN_WITHDRAWAL = 100;
  const coinCashValue = coinsToConvert ? calculateCashOutValue(Number(coinsToConvert)) : 0;
  const totalWithdraw = Number(withdrawAmount || 0) + (convertCoins ? coinCashValue : 0);
  const feeRate = 0.05;
  const fee = Math.round(totalWithdraw * feeRate * 100) / 100;
  const netAmount = Math.round((totalWithdraw - fee) * 100) / 100;

  const canProceed =
    totalWithdraw >= MIN_WITHDRAWAL &&
    totalWithdraw <= balanceReais + (convertCoins ? coinCashValue : 0) &&
    pixKey &&
    pixKey.length >= 5;

  const handleReset = () => {
    setStep("review");
    setWithdrawAmount("");
    setConvertCoins(false);
    setCoinsToConvert("");
    setConfirmPassword("");
    setTransactionId("");
  };

  const handleConfirmStep = () => {
    if (!canProceed) return;
    setStep("confirm");
  };

  const handleProcessWithdrawal = async () => {
    if (!confirmPassword || confirmPassword.length < 6) {
      toast.error("Digite sua senha para confirmar o saque.");
      return;
    }

    setStep("processing");

    try {
      // Verify password via re-auth
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.email) throw new Error("Usuário não autenticado");

      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: confirmPassword,
      });
      if (authErr) {
        toast.error("Senha incorreta. Tente novamente.");
        setStep("confirm");
        return;
      }

      // Call process-withdrawal edge function
      const { data: session } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("process-withdrawal", {
        body: {
          amount: totalWithdraw,
          pixKey: pixKey,
        },
      });

      if (res.error || !res.data?.success) {
        throw new Error(res.data?.error || "Erro ao processar saque");
      }

      setTransactionId(res.data.withdrawal?.id || "N/A");
      setStep("success");
      toast.success("Saque solicitado com sucesso!");
      onSuccess?.();
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      toast.error(err.message || "Erro ao processar saque");
      setStep("error");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleReset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md border-border bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-foreground">
            <Banknote size={20} className="text-primary" />
            {step === "success" ? "Saque Confirmado" : "Solicitar Saque"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* STEP 1: Review */}
          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Balance Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <Banknote size={18} className="text-primary mx-auto" />
                  <p className="text-lg font-display font-black text-foreground mt-1">
                    R$ {balanceReais.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-bold">Saldo Disponível</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-center">
                  <Coins size={18} className="text-accent mx-auto" />
                  <p className="text-lg font-display font-black text-foreground mt-1">
                    {plantaCoinBalance} 🪙
                  </p>
                  <p className="text-[10px] text-muted-foreground font-bold">Planta-Coins</p>
                </div>
              </div>

              {/* Withdraw Amount */}
              <div>
                <Label className="text-xs font-bold text-foreground">Valor do Saque (R$)</Label>
                <Input
                  type="number"
                  placeholder={`Mínimo R$ ${MIN_WITHDRAWAL}`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-1"
                  min={MIN_WITHDRAWAL}
                  max={balanceReais}
                />
              </div>

              {/* Planta-Coin Conversion Toggle */}
              {plantaCoinBalance >= 100 && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={convertCoins}
                      onChange={(e) => setConvertCoins(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-xs font-bold text-foreground">Converter Planta-Coins em dinheiro</span>
                  </label>
                  {convertCoins && (
                    <div>
                      <Input
                        type="number"
                        placeholder="Qtd de coins (mín. 100)"
                        value={coinsToConvert}
                        onChange={(e) => setCoinsToConvert(e.target.value)}
                        min={100}
                        max={plantaCoinBalance}
                        className="mt-1"
                      />
                      {Number(coinsToConvert) >= 100 && (
                        <p className="text-[10px] text-primary mt-1 font-bold">
                          {coinsToConvert} coins = R$ {coinCashValue.toFixed(2)} (taxa {Number(coinsToConvert) >= 500 ? "15%" : "20%"})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Pix Destination */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground font-bold mb-1">Destino Pix</p>
                <p className="text-sm font-bold text-foreground font-mono">
                  {pixKey ? `${pixKey.substring(0, 4)}****${pixKey.slice(-4)}` : "Nenhuma chave cadastrada"}
                </p>
              </div>

              {/* Summary */}
              {totalWithdraw > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Valor bruto</span><span className="text-foreground font-bold">R$ {totalWithdraw.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Taxa manutenção (5%)</span><span className="text-destructive font-bold">- R$ {fee.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-foreground font-bold">Valor líquido</span><span className="text-primary font-black">R$ {netAmount.toFixed(2)}</span></div>
                  </div>
                </>
              )}

              <Button onClick={handleConfirmStep} disabled={!canProceed} className="w-full gap-2">
                Continuar <ArrowRight size={16} />
              </Button>

              {totalWithdraw > 0 && totalWithdraw < MIN_WITHDRAWAL && (
                <p className="text-[10px] text-destructive text-center flex items-center justify-center gap-1">
                  <AlertTriangle size={12} /> Saque mínimo: R$ {MIN_WITHDRAWAL}
                </p>
              )}
            </motion.div>
          )}

          {/* STEP 2: Confirm with password */}
          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                <ShieldCheck size={32} className="text-primary mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">Verificação de Segurança</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Confirme sua senha para autorizar o saque de <span className="text-primary font-bold">R$ {netAmount.toFixed(2)}</span>
                </p>
              </div>

              <div>
                <Label className="text-xs font-bold text-foreground">Senha da conta</Label>
                <Input
                  type="password"
                  placeholder="Digite sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("review")} className="flex-1">Voltar</Button>
                <Button onClick={handleProcessWithdrawal} disabled={confirmPassword.length < 6} className="flex-1 gap-2">
                  <ShieldCheck size={16} /> Confirmar Saque
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Processing */}
          {step === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8 text-center space-y-4">
              <Loader2 size={48} className="text-primary mx-auto animate-spin" />
              <p className="text-sm font-bold text-foreground">Transferindo para sua conta...</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>✅ Verificando saldo</p>
                <p>✅ Aplicando taxa de manutenção (5%)</p>
                <p className="animate-pulse text-primary">⏳ Registrando transação...</p>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Success */}
          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} className="text-primary" />
              </div>
              <div>
                <p className="text-lg font-display font-black text-foreground">Saque Solicitado!</p>
                <p className="text-xs text-muted-foreground mt-1">Transferência em processamento</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border text-left space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">ID Transação</span><span className="font-mono font-bold text-foreground">{transactionId.substring(0, 8).toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor líquido</span><span className="text-primary font-bold">R$ {netAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Destino</span><span className="font-mono text-foreground">{pixKey ? `${pixKey.substring(0, 4)}****` : "Pix"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-amber-500/10 text-amber-500 text-[9px]">Processando</Badge></div>
              </div>

              <Button onClick={() => onOpenChange(false)} className="w-full">Fechar</Button>
            </motion.div>
          )}

          {/* STEP 5: Error */}
          {step === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 text-center space-y-4">
              <AlertTriangle size={48} className="text-destructive mx-auto" />
              <p className="text-sm font-bold text-foreground">Erro ao processar saque</p>
              <p className="text-xs text-muted-foreground">Tente novamente ou entre em contato com o suporte.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Fechar</Button>
                <Button onClick={() => setStep("review")} className="flex-1">Tentar Novamente</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
