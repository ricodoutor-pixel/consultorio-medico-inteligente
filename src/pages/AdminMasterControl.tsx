import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  DollarSign, Users, Activity, TrendingUp, Shield, CheckCircle, XCircle,
  Clock, ArrowLeft, RefreshCw, Eye, Zap, Lock, AlertTriangle, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface KPIData {
  revenue: number;
  consultationsToday: number;
  clubMRR: number;
  pendingCommissions: number;
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  pix_key: string | null;
  status: string;
  created_at: string;
}

interface AffiliateRanking {
  user_id: string;
  total: number;
}

interface PayoutValidation {
  valid: boolean;
  withdrawal_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  pix_key: string;
  user_id: string;
  error?: string;
}

const FEE_RATE = 0.05;

const AdminMasterControl = () => {
  const [kpis, setKpis] = useState<KPIData>({ revenue: 0, consultationsToday: 0, clubMRR: 0, pendingCommissions: 0 });
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [topAffiliates, setTopAffiliates] = useState<AffiliateRanking[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { log } = useAuditLog();
  const navigate = useNavigate();

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; withdrawal: WithdrawalRequest | null; validation: PayoutValidation | null; loading: boolean }>({
    open: false, withdrawal: null, validation: null, loading: false,
  });

  // Batch modal state
  const [batchModal, setBatchModal] = useState<{ open: boolean; loading: boolean; results: any[] | null }>({
    open: false, loading: false, results: null,
  });

  // Re-auth state
  const [reAuthModal, setReAuthModal] = useState<{ open: boolean; password: string; action: "single" | "batch"; withdrawalId?: string }>({
    open: false, password: "", action: "single",
  });
  const [reAuthLoading, setReAuthLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    const today = new Date().toISOString().split("T")[0];
    const [appointmentsRes, commissionsRes, withdrawalsRes, deletionRes] = await Promise.all([
      supabase.from("appointments").select("amount, scheduled_at, status").gte("scheduled_at", today),
      supabase.from("affiliate_commissions").select("amount, status").eq("status", "pending"),
      supabase.from("affiliate_withdrawals").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("data_deletion_requests").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    ]);

    const appointments = appointmentsRes.data || [];
    const commissions = commissionsRes.data || [];

    setKpis({
      revenue: appointments.reduce((s, a) => s + Number(a.amount || 0), 0),
      consultationsToday: appointments.length,
      clubMRR: 0,
      pendingCommissions: commissions.reduce((s, c) => s + Number(c.amount || 0), 0),
    });

    setWithdrawals(withdrawalsRes.data || []);
    setDeletionRequests(deletionRes.data || []);

    const { data: allCommissions } = await supabase
      .from("affiliate_commissions")
      .select("referrer_id, amount")
      .eq("status", "paid");

    if (allCommissions) {
      const map = new Map<string, number>();
      allCommissions.forEach((c) => {
        map.set(c.referrer_id, (map.get(c.referrer_id) || 0) + Number(c.amount));
      });
      const sorted = Array.from(map.entries())
        .map(([user_id, total]) => ({ user_id, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
      setTopAffiliates(sorted);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Open payment confirmation modal
  const handlePayClick = async (w: WithdrawalRequest) => {
    const fee = Math.round(w.amount * FEE_RATE * 100) / 100;
    const netAmount = Math.round((w.amount - fee) * 100) / 100;
    setPaymentModal({
      open: true,
      withdrawal: w,
      validation: {
        valid: true,
        withdrawal_id: w.id,
        amount: w.amount,
        fee,
        net_amount: netAmount,
        pix_key: w.pix_key || "Não informada",
        user_id: w.user_id,
      },
      loading: false,
    });
  };

  // Request re-auth before executing payment
  const handleConfirmPayment = () => {
    setPaymentModal(p => ({ ...p, open: false }));
    setReAuthModal({
      open: true,
      password: "",
      action: "single",
      withdrawalId: paymentModal.withdrawal?.id,
    });
  };

  // Request re-auth for batch
  const handleBatchClick = () => {
    if (withdrawals.length === 0) {
      toast({ title: "Nenhum saque pendente", variant: "destructive" });
      return;
    }
    setReAuthModal({ open: true, password: "", action: "batch" });
  };

  // Execute after re-auth
  const handleReAuth = async () => {
    setReAuthLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) throw new Error("Sessão inválida");

      // Re-authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: reAuthModal.password,
      });

      if (authError) {
        toast({ title: "Senha incorreta", description: "Re-autenticação falhou.", variant: "destructive" });
        setReAuthLoading(false);
        return;
      }

      setReAuthModal(p => ({ ...p, open: false }));

      if (reAuthModal.action === "single" && reAuthModal.withdrawalId) {
        await executeSinglePayout(reAuthModal.withdrawalId);
      } else if (reAuthModal.action === "batch") {
        await executeBatchPayout();
      }
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setReAuthLoading(false);
    }
  };

  const executeSinglePayout = async (withdrawalId: string) => {
    setPaymentModal(p => ({ ...p, loading: true }));
    try {
      const { data, error } = await supabase.functions.invoke("process-pix-payout", {
        body: { withdrawal_id: withdrawalId },
      });

      if (error) throw error;

      const result = data?.results?.[0];
      if (result?.success) {
        await log("execute_payout", "affiliate_withdrawals", withdrawalId, null, result);
        toast({
          title: "✅ Pagamento processado",
          description: result.mode === "manual"
            ? `Saque aprovado para processamento manual. Taxa: R$ ${result.fee?.toFixed(2)}`
            : `PIX enviado. ID MP: ${result.mp_payment_id}`,
        });
      } else {
        toast({ title: "Falha no pagamento", description: result?.error || "Erro desconhecido", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPaymentModal({ open: false, withdrawal: null, validation: null, loading: false });
      fetchData();
    }
  };

  const executeBatchPayout = async () => {
    setBatchModal({ open: true, loading: true, results: null });
    try {
      const { data, error } = await supabase.functions.invoke("process-pix-payout", {
        body: { batch: true },
      });

      if (error) throw error;

      await log("execute_batch_payout", "affiliate_withdrawals", "batch", null, { count: data?.results?.length });
      setBatchModal({ open: true, loading: false, results: data?.results || [] });
      toast({ title: "Lote processado", description: `${data?.results?.length || 0} saques processados.` });
    } catch (e) {
      setBatchModal({ open: true, loading: false, results: [] });
      toast({ title: "Erro no lote", description: (e as Error).message, variant: "destructive" });
    } finally {
      fetchData();
    }
  };

  const handleRejectWithdrawal = async (w: WithdrawalRequest) => {
    const { error } = await supabase
      .from("affiliate_withdrawals")
      .update({ status: "rejected", rejected_reason: "Reprovado pelo admin" })
      .eq("id", w.id);

    if (!error) {
      // Return balance to wallet
      const { data: wallet } = await supabase
        .from("affiliate_wallets")
        .select("available_balance")
        .eq("user_id", w.user_id)
        .single();

      if (wallet) {
        await supabase
          .from("affiliate_wallets")
          .update({
            available_balance: Number(wallet.available_balance) + w.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", w.user_id);
      }

      await log("reject_withdrawal", "affiliate_withdrawals", w.id, { status: "pending" }, { status: "rejected" });
      toast({ title: "Saque rejeitado e saldo devolvido", variant: "destructive" });
      fetchData();
    }
  };

  const handleProcessDeletion = async (req: any, action: "approved" | "rejected") => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("data_deletion_requests")
      .update({
        status: action,
        processed_by: session?.user.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.id);

    if (!error) {
      await log(`${action}_deletion_request`, "data_deletion_requests", req.id);
      toast({ title: action === "approved" ? "Solicitação aprovada" : "Solicitação rejeitada" });
      fetchData();
    }
  };

  const chartData = Array.from({ length: 7 }, (_, i) => ({
    day: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i],
    consultas: Math.floor(Math.random() * 20 + 5),
    medicos: Math.floor(Math.random() * 8 + 2),
  }));

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0a0c10] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0a0c10] text-white p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="text-gray-400">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-emerald-400" />
              Master Control
            </h1>
            <p className="text-xs text-gray-500">Painel de Governança Central</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}
          className="border-emerald-500/30 text-emerald-400">
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Faturamento Bruto", value: `R$ ${kpis.revenue.toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Orientações Técnicas Hoje", value: kpis.consultationsToday.toString(), icon: Activity, color: "text-blue-400" },
          { label: "MRR Club", value: `R$ ${kpis.clubMRR.toLocaleString("pt-BR")}`, icon: TrendingUp, color: "text-purple-400" },
          { label: "Comissões Pendentes", value: `R$ ${kpis.pendingCommissions.toLocaleString("pt-BR")}`, icon: Users, color: "text-amber-400" },
        ].map((kpi, i) => (
          <Card key={i} className="bg-white/5 border-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-[10px] uppercase tracking-wider text-gray-500">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white/5 border-white/10 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Orientações Técnicas vs Médicos Online</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
              <Bar dataKey="consultas" fill="#10b981" radius={[4, 4, 0, 0]} name="Orientações Técnicas" />
              <Bar dataKey="medicos" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Médicos" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-white/5 border-white/10 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Top 10 Afiliados (Receita Total)</h3>
          {topAffiliates.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-8">Nenhum dado de afiliado ainda</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {topAffiliates.map((a, i) => (
                <div key={a.user_id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400">#{i + 1}</span>
                    <span className="text-gray-300 font-mono text-xs">{a.user_id.slice(0, 8)}...</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">R$ {a.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Withdrawal Management */}
      <Card className="bg-white/5 border-white/10 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-400" />
            Saques Pendentes ({withdrawals.length})
          </h3>
          {withdrawals.length > 0 && (
            <Button size="sm" onClick={handleBatchClick}
              className="bg-amber-600 hover:bg-amber-700 h-7 text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Executar Lote ({withdrawals.length})
            </Button>
          )}
        </div>
        {withdrawals.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">Nenhum saque pendente</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-500">ID</TableHead>
                  <TableHead className="text-gray-500">Usuário</TableHead>
                  <TableHead className="text-gray-500">Valor Bruto</TableHead>
                  <TableHead className="text-gray-500">Taxa 5%</TableHead>
                  <TableHead className="text-gray-500">Líquido</TableHead>
                  <TableHead className="text-gray-500">PIX</TableHead>
                  <TableHead className="text-gray-500">Data</TableHead>
                  <TableHead className="text-gray-500">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => {
                  const fee = Math.round(w.amount * FEE_RATE * 100) / 100;
                  const net = Math.round((w.amount - fee) * 100) / 100;
                  return (
                    <TableRow key={w.id} className="border-white/5">
                      <TableCell className="text-xs font-mono text-gray-400">{w.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs font-mono text-gray-400">{w.user_id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-semibold text-white">R$ {Number(w.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-red-400">- R$ {fee.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold text-emerald-400">R$ {net.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-gray-400 max-w-[100px] truncate">{w.pix_key || "N/A"}</TableCell>
                      <TableCell className="text-xs text-gray-400">{new Date(w.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handlePayClick(w)}
                            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />Pagar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectWithdrawal(w)}
                            className="h-7 text-xs">
                            <XCircle className="h-3 w-3 mr-1" />Rejeitar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Data Deletion Requests */}
      <Card className="bg-white/5 border-white/10 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-400" />
          Solicitações LGPD - Exclusão de Dados ({deletionRequests.length})
        </h3>
        {deletionRequests.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">Nenhuma solicitação pendente</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-500">Usuário</TableHead>
                  <TableHead className="text-gray-500">Motivo</TableHead>
                  <TableHead className="text-gray-500">Data</TableHead>
                  <TableHead className="text-gray-500">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletionRequests.map((req) => (
                  <TableRow key={req.id} className="border-white/5">
                    <TableCell className="text-xs font-mono text-gray-400">{req.user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-xs text-gray-300 max-w-[200px] truncate">{req.reason || "Não informado"}</TableCell>
                    <TableCell className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleProcessDeletion(req, "approved")}
                          className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs">Aprovar</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleProcessDeletion(req, "rejected")}
                          className="h-7 text-xs">Rejeitar</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Audit Log */}
      <Card className="bg-white/5 border-white/10 p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-400" />
          Últimas Ações no Audit Log
        </h3>
        <AuditLogViewer />
      </Card>

      {/* Payment Confirmation Modal */}
      <Dialog open={paymentModal.open} onOpenChange={(o) => !o && setPaymentModal(p => ({ ...p, open: false }))}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <DollarSign className="h-5 w-5" />
              Confirmar Pagamento PIX
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Revise os detalhes antes de executar o pagamento.
            </DialogDescription>
          </DialogHeader>
          {paymentModal.validation && (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Favorecido</span>
                  <span className="font-mono text-gray-300">{paymentModal.validation.user_id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Chave PIX</span>
                  <span className="font-mono text-emerald-400 text-xs">{paymentModal.validation.pix_key}</span>
                </div>
                <hr className="border-white/10" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Valor Bruto</span>
                  <span className="text-white font-semibold">R$ {paymentModal.validation.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Taxa 5%</span>
                  <span className="text-red-400">- R$ {paymentModal.validation.fee.toFixed(2)}</span>
                </div>
                <hr className="border-white/10" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 font-medium">Valor Líquido</span>
                  <span className="text-emerald-400 font-bold text-lg">R$ {paymentModal.validation.net_amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Será exigida re-autenticação para confirmar.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPaymentModal(p => ({ ...p, open: false }))} className="text-gray-400">
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} className="bg-emerald-600 hover:bg-emerald-700">
              <Lock className="h-4 w-4 mr-1" />
              Confirmar e Pagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-Auth Modal */}
      <Dialog open={reAuthModal.open} onOpenChange={(o) => !o && setReAuthModal(p => ({ ...p, open: false }))}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Lock className="h-5 w-5" />
              Re-autenticação Necessária
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {reAuthModal.action === "batch"
                ? `Confirme sua senha para processar ${withdrawals.length} saques pendentes.`
                : "Confirme sua senha para executar o pagamento PIX."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Sua senha de admin"
              value={reAuthModal.password}
              onChange={(e) => setReAuthModal(p => ({ ...p, password: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleReAuth()}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setReAuthModal(p => ({ ...p, open: false }))} className="text-gray-400">
              Cancelar
            </Button>
            <Button onClick={handleReAuth} disabled={!reAuthModal.password || reAuthLoading}
              className="bg-emerald-600 hover:bg-emerald-700">
              {reAuthLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Shield className="h-4 w-4 mr-1" />}
              Autenticar e Executar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Results Modal */}
      <Dialog open={batchModal.open} onOpenChange={(o) => !o && setBatchModal(p => ({ ...p, open: false }))}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Zap className="h-5 w-5" />
              Resultado do Lote
            </DialogTitle>
          </DialogHeader>
          {batchModal.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <span className="ml-3 text-gray-400">Processando saques...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {(batchModal.results || []).map((r, i) => (
                <div key={i} className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${r.success ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  <div className="flex items-center gap-2">
                    {r.success ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                    <span className="font-mono text-xs text-gray-300">{r.id?.slice(0, 8)}...</span>
                  </div>
                  <span className={`text-xs ${r.success ? "text-emerald-400" : "text-red-400"}`}>
                    {r.success ? `✓ ${r.mode}` : r.error?.slice(0, 40)}
                  </span>
                </div>
              ))}
              {(batchModal.results || []).length === 0 && (
                <p className="text-xs text-gray-600 text-center py-4">Nenhum resultado</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBatchModal(p => ({ ...p, open: false }))} className="text-gray-400">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setLogs(data || []));
  }, []);

  if (logs.length === 0) return <p className="text-xs text-gray-600 text-center py-4">Nenhum log registrado</p>;

  return (
    <div className="space-y-1 max-h-[250px] overflow-y-auto">
      {logs.map((l) => (
        <div key={l.id} className="flex items-center justify-between text-xs bg-white/5 rounded px-3 py-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{l.action}</Badge>
            <span className="text-gray-400">{l.table_name}</span>
          </div>
          <span className="text-gray-600">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
        </div>
      ))}
    </div>
  );
}

export default AdminMasterControl;
