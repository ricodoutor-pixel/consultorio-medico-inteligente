import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, ArrowUpRight, DollarSign, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MIN_WITHDRAWAL = 100;

export function AffiliateWalletCard() {
  const [pixKey, setPixKey] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const queryClient = useQueryClient();

  const { data: wallet, isLoading } = useQuery({
    queryKey: ["affiliate-wallet"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("affiliate_wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["affiliate-withdrawals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("affiliate_withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const requestWithdrawal = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
        throw new Error(`Valor mínimo para saque: R$ ${MIN_WITHDRAWAL},00`);
      }
      if (!wallet || amount > (wallet.available_balance || 0)) {
        throw new Error("Saldo insuficiente");
      }
      if (!pixKey.trim()) {
        throw new Error("Informe sua chave PIX");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("affiliate_withdrawals").insert({
        user_id: user.id,
        amount,
        pix_key: pixKey,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação de saque enviada! Processamento em até 48h.");
      setWithdrawAmount("");
      setPixKey("");
      queryClient.invalidateQueries({ queryKey: ["affiliate-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-withdrawals"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const available = wallet?.available_balance || 0;
  const pending = wallet?.pending_balance || 0;
  const totalEarnings = wallet?.total_earnings || 0;
  const totalWithdrawn = wallet?.total_withdrawn || 0;

  return (
    <div className="space-y-4">
      {/* Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Disponível</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">
              R$ {available.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Pendente</span>
            </div>
            <p className="text-xl font-bold text-amber-400">
              R$ {pending.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Total Ganho</span>
            </div>
            <p className="text-xl font-bold text-blue-400">
              R$ {totalEarnings.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Sacado</span>
            </div>
            <p className="text-xl font-bold text-purple-400">
              R$ {totalWithdrawn.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Form */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5" />
            Solicitar Saque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Valor (mín. R$ 100,00)"
              type="number"
              min={MIN_WITHDRAWAL}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            <Input
              placeholder="Chave PIX (CPF, e-mail ou celular)"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
            />
          </div>
          <Button
            onClick={() => requestWithdrawal.mutate()}
            disabled={requestWithdrawal.isPending || available < MIN_WITHDRAWAL}
            className="w-full"
          >
            {requestWithdrawal.isPending ? "Processando..." : `Solicitar Saque via PIX`}
          </Button>
          {available < MIN_WITHDRAWAL && (
            <p className="text-xs text-muted-foreground text-center">
              Saldo mínimo de R$ {MIN_WITHDRAWAL},00 necessário para saque
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Withdrawals */}
      {withdrawals && withdrawals.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Últimos Saques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {withdrawals.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between text-sm border-b border-border/30 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${
                      w.status === "completed" ? "text-emerald-400" :
                      w.status === "pending" ? "text-amber-400" : "text-red-400"
                    }`} />
                    <span>R$ {w.amount?.toFixed(2)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
