import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  DollarSign, Users, Activity, TrendingUp, Shield, CheckCircle, XCircle,
  Clock, ArrowLeft, RefreshCw, Eye
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

  const fetchData = async () => {
    setRefreshing(true);

    // KPIs
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

    // Top affiliates
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
  };

  useEffect(() => { fetchData(); }, []);

  const handleApproveWithdrawal = async (w: WithdrawalRequest) => {
    const { error } = await supabase
      .from("affiliate_withdrawals")
      .update({ status: "approved", processed_at: new Date().toISOString() })
      .eq("id", w.id);

    if (!error) {
      await log("approve_withdrawal", "affiliate_withdrawals", w.id, { status: "pending" }, { status: "approved" });
      toast({ title: "Saque aprovado", description: `R$ ${w.amount.toFixed(2)} aprovado para pagamento.` });
      fetchData();
    }
  };

  const handleRejectWithdrawal = async (w: WithdrawalRequest) => {
    const { error } = await supabase
      .from("affiliate_withdrawals")
      .update({ status: "rejected", rejected_reason: "Reprovado pelo admin" })
      .eq("id", w.id);

    if (!error) {
      await log("reject_withdrawal", "affiliate_withdrawals", w.id, { status: "pending" }, { status: "rejected" });
      toast({ title: "Saque rejeitado", variant: "destructive" });
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

  // Mock chart data
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    day: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i],
    consultas: Math.floor(Math.random() * 20 + 5),
    medicos: Math.floor(Math.random() * 8 + 2),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-4 md:p-6 pb-24">
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
          { label: "Consultas Hoje", value: kpis.consultationsToday.toString(), icon: Activity, color: "text-blue-400" },
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
          <h3 className="text-sm font-medium text-gray-400 mb-3">Consultas vs Médicos Online</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} />
              <Bar dataKey="consultas" fill="#10b981" radius={[4, 4, 0, 0]} name="Consultas" />
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
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-amber-400" />
          Saques Pendentes ({withdrawals.length})
        </h3>
        {withdrawals.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">Nenhum saque pendente</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-500">ID</TableHead>
                  <TableHead className="text-gray-500">Valor</TableHead>
                  <TableHead className="text-gray-500">Data</TableHead>
                  <TableHead className="text-gray-500">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id} className="border-white/5">
                    <TableCell className="text-xs font-mono text-gray-400">{w.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-semibold text-white">R$ {Number(w.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-gray-400">{new Date(w.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleApproveWithdrawal(w)}
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
                ))}
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
