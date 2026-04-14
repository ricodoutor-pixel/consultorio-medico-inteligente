import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ArrowUpRight, DollarSign, Clock, CheckCircle, ShieldCheck, AlertTriangle, Info, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const MIN_WITHDRAWAL = 100;
const DAILY_LIMIT = 50;
const GUARANTEE_DAYS = 7;

// PIX key validation
function validatePixKey(key: string): { valid: boolean; type: string; error?: string } {
  const trimmed = key.trim();
  if (!trimmed) return { valid: false, type: "", error: "Informe sua chave PIX" };

  // CPF: 11 digits
  if (/^\d{11}$/.test(trimmed)) return { valid: true, type: "CPF" };
  // CNPJ: 14 digits
  if (/^\d{14}$/.test(trimmed)) return { valid: true, type: "CNPJ" };
  // Phone: +55...
  if (/^\+?55\d{10,11}$/.test(trimmed.replace(/[\s()-]/g, ""))) return { valid: true, type: "Celular" };
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { valid: true, type: "E-mail" };
  // Random key (UUID format)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return { valid: true, type: "Aleatória" };

  return { valid: false, type: "", error: "Chave PIX inválida. Use CPF, CNPJ, e-mail, celular ou chave aleatória." };
}

export function AffiliateWalletCard() {
  const [pixKey, setPixKey] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixValidation, setPixValidation] = useState<{ valid: boolean; type: string; error?: string } | null>(null);
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

  // Fetch pending commissions (within 7-day guarantee window)
  const { data: pendingCommissions } = useQuery({
    queryKey: ["affiliate-pending-commissions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - GUARANTEE_DAYS);
      const { data } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("referrer_id", user.id)
        .eq("status", "pending")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false });
      return data || [];
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
        .limit(10);
      return data || [];
    },
  });

  // Query today's withdrawals to calculate daily usage
  const { data: todayWithdrawn } = useQuery({
    queryKey: ["affiliate-daily-withdrawn"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const todayStart = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
      const { data } = await supabase
        .from("affiliate_withdrawals")
        .select("amount")
        .eq("user_id", user.id)
        .gte("created_at", todayStart)
        .in("status", ["completed", "pending"]);
      return (data || []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    },
  });

  const dailyUsed = todayWithdrawn || 0;
  const dailyRemaining = Math.max(0, DAILY_LIMIT - dailyUsed);
  const isDailyLimitReached = dailyRemaining <= 0;

  const requestWithdrawal = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
        throw new Error(`Valor mínimo para saque: R$ ${MIN_WITHDRAWAL},00`);
      }
      if (amount > DAILY_LIMIT) {
        throw new Error(`Desculpe, por medidas de segurança o limite máximo de saque é de R$ ${DAILY_LIMIT},00 a cada 24 horas`);
      }
      if (dailyUsed + amount > DAILY_LIMIT) {
        throw new Error(`Desculpe, por medidas de segurança o limite máximo de saque é de R$ ${DAILY_LIMIT},00 a cada 24 horas`);
      }
      if (!wallet || amount > (wallet.available_balance || 0)) {
        throw new Error("Saldo insuficiente");
      }
      const validation = validatePixKey(pixKey);
      if (!validation.valid) {
        throw new Error(validation.error || "Chave PIX inválida");
      }

      // Use the Edge Function for server-side validation
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("process-withdrawal", {
        body: { amount, pixKey: pixKey.trim() },
      });

      if (error) {
        throw new Error(error.message || "Erro ao processar saque");
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Solicitação de saque enviada! Processamento em até 48h úteis.");
      setWithdrawAmount("");
      setPixKey("");
      setPixValidation(null);
      queryClient.invalidateQueries({ queryKey: ["affiliate-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-daily-withdrawn"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handlePixKeyChange = (value: string) => {
    setPixKey(value);
    if (value.trim().length > 3) {
      setPixValidation(validatePixKey(value));
    } else {
      setPixValidation(null);
    }
  };

  const available = wallet?.available_balance || 0;
  const pending = wallet?.pending_balance || 0;
  const totalEarnings = wallet?.total_earnings || 0;
  const totalWithdrawn = wallet?.total_withdrawn || 0;

  // Calculate guarantee release dates for pending commissions
  const pendingWithDates = (pendingCommissions || []).map((c: any) => {
    const createdAt = new Date(c.created_at);
    const releaseDate = new Date(createdAt);
    releaseDate.setDate(releaseDate.getDate() + GUARANTEE_DAYS);
    const daysLeft = Math.max(0, Math.ceil((releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return { ...c, releaseDate, daysLeft };
  });

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
            <p className="text-[10px] text-emerald-400/60 mt-1">Liberado para saque</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Em Garantia</span>
            </div>
            <p className="text-xl font-bold text-amber-400">
              R$ {pending.toFixed(2)}
            </p>
            <p className="text-[10px] text-amber-400/60 mt-1">Liberação em até {GUARANTEE_DAYS} dias</p>
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

      {/* Guarantee Period Info */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground mb-1">Prazo de Garantia — {GUARANTEE_DAYS} dias</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Comissões ficam pendentes durante o período de garantia. Após {GUARANTEE_DAYS} dias sem estorno, o valor é liberado para saque.
              </p>
              {pendingWithDates.length > 0 ? (
                <div className="space-y-2">
                  {pendingWithDates.slice(0, 5).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/50 border border-border/30">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-amber-400" />
                        <span className="text-muted-foreground">Nível {c.level}</span>
                        <span className="font-bold text-foreground">R$ {Number(c.amount).toFixed(2)}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                        {c.daysLeft > 0 ? `${c.daysLeft}d restante${c.daysLeft > 1 ? "s" : ""}` : "Liberando..."}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Nenhuma comissão pendente no momento.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Limit Info */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground mb-1">Limite diário de saque: R$ {DAILY_LIMIT},00</h4>
              <p className="text-xs text-muted-foreground">
                Por medidas de segurança, o valor máximo de saque por dia é de R$ {DAILY_LIMIT},00.
              </p>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">Sacado hoje: <span className="font-bold text-foreground">R$ {dailyUsed.toFixed(2)}</span></span>
                <span className="text-muted-foreground">Restante: <span className={`font-bold ${isDailyLimitReached ? "text-destructive" : "text-emerald-400"}`}>R$ {dailyRemaining.toFixed(2)}</span></span>
              </div>
              {isDailyLimitReached && (
                <p className="text-xs text-destructive mt-2 flex items-center gap-1 font-bold">
                  <AlertTriangle className="h-3 w-3" /> Limite diário atingido. Tente novamente amanhã.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5" />
            Solicitar Saque via PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount" className="text-xs font-bold">Valor do saque</Label>
              <Input
                id="withdraw-amount"
                placeholder={`Mínimo R$ ${MIN_WITHDRAWAL},00`}
                type="number"
                min={MIN_WITHDRAWAL}
                max={dailyRemaining}
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={isDailyLimitReached}
              />
              {withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) < MIN_WITHDRAWAL && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Valor mínimo: R$ {MIN_WITHDRAWAL},00
                </p>
              )}
              {withdrawAmount && parseFloat(withdrawAmount) > dailyRemaining && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Excede o limite diário restante de R$ {dailyRemaining.toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix-key" className="text-xs font-bold">Chave PIX</Label>
              <Input
                id="pix-key"
                placeholder="CPF, e-mail, celular ou chave aleatória"
                value={pixKey}
                onChange={(e) => handlePixKeyChange(e.target.value)}
                disabled={isDailyLimitReached}
              />
              {pixValidation && (
                <p className={`text-xs flex items-center gap-1 ${pixValidation.valid ? "text-emerald-400" : "text-destructive"}`}>
                  {pixValidation.valid ? (
                    <><CheckCircle className="h-3 w-3" /> Chave {pixValidation.type} válida</>
                  ) : (
                    <><AlertTriangle className="h-3 w-3" /> {pixValidation.error}</>
                  )}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={() => requestWithdrawal.mutate()}
            disabled={requestWithdrawal.isPending || available < MIN_WITHDRAWAL || !pixValidation?.valid || isDailyLimitReached || (parseFloat(withdrawAmount) || 0) > dailyRemaining}
            className="w-full font-bold"
          >
            {isDailyLimitReached
              ? "Limite diário atingido. Tente novamente amanhã"
              : requestWithdrawal.isPending
              ? "Processando..."
              : `Solicitar Saque — R$ ${withdrawAmount || "0,00"}`}
          </Button>

          {available < MIN_WITHDRAWAL && !isDailyLimitReached && (
            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Saldo mínimo de R$ {MIN_WITHDRAWAL},00 necessário para saque</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Withdrawals */}
      {withdrawals && withdrawals.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Histórico de Saques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {withdrawals.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between text-sm border-b border-border/30 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${
                      w.status === "completed" ? "text-emerald-400" :
                      w.status === "pending" ? "text-amber-400" :
                      w.status === "rejected" ? "text-destructive" : "text-muted-foreground"
                    }`} />
                    <div>
                      <span className="font-bold">R$ {Number(w.amount).toFixed(2)}</span>
                      {w.pix_key && (
                        <p className="text-[10px] text-muted-foreground">PIX: {w.pix_key.substring(0, 6)}***</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`text-[10px] ${
                      w.status === "completed" ? "border-emerald-500/30 text-emerald-400" :
                      w.status === "pending" ? "border-amber-500/30 text-amber-400" :
                      "border-destructive/30 text-destructive"
                    }`}>
                      {w.status === "completed" ? "Pago" : w.status === "pending" ? "Pendente" : "Rejeitado"}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(w.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
