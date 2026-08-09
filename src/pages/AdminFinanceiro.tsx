import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, TrendingDown, Users, BarChart3,
  ArrowUpRight, ArrowDownRight, Wallet, RefreshCw, AlertTriangle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

function formatBRL(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

export default function AdminFinanceiro() {
  const [period, setPeriod] = useState<"month" | "week" | "all">("month");

  const periodFilter = (() => {
    const now = new Date();
    if (period === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString();
    }
    if (period === "month") {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return d.toISOString();
    }
    return "2020-01-01T00:00:00.000Z";
  })();

  // Escrow transactions (revenue)
  const { data: escrows, isLoading: loadingEscrows, refetch: refetchEscrows } = useQuery({
    queryKey: ["admin-escrows", period],
    queryFn: async () => {
      const { data } = await supabase
        .from("escrow_transactions")
        .select("*")
        .gte("created_at", periodFilter)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Payment webhooks
  const { data: webhooks, isLoading: loadingWebhooks } = useQuery({
    queryKey: ["admin-webhooks", period],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_webhooks")
        .select("*")
        .gte("created_at", periodFilter)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // Affiliate commissions
  const { data: commissions } = useQuery({
    queryKey: ["admin-commissions", period],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .gte("created_at", periodFilter);
      return data || [];
    },
  });

  // Compute metrics
  const totalRevenue = (escrows || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const platformFees = (escrows || []).reduce((s, e) => s + Number(e.platform_fee || 0), 0);
  const doctorPayouts = (escrows || []).reduce((s, e) => s + Number(e.doctor_payout || 0), 0);
  const vendorPayouts = (escrows || []).reduce((s, e) => s + Number(e.vendor_payout || 0), 0);
  const approvedPayments = (webhooks || []).filter((w) => w.status === "approved").length;
  const pendingPayments = (webhooks || []).filter((w) => w.status === "pending").length;
  const totalCommissions = (commissions || []).reduce((s, c) => s + Number(c.amount || 0), 0);
  const paidCommissions = (commissions || []).filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount || 0), 0);
  const consultations = (escrows || []).filter((e) => e.type === "consultation").length;
  const orders = (escrows || []).filter((e) => e.type === "marketplace").length;

  const isLoading = loadingEscrows || loadingWebhooks;

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-black text-foreground">
              Dashboard <span className="text-gradient-green">Financeiro</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Painel executivo em tempo real</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-border overflow-hidden">
              {(["week", "month", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p === "week" ? "7 Dias" : p === "month" ? "Mês" : "Total"}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchEscrows()} className="rounded-xl">
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard icon={DollarSign} label="Receita Bruta" value={formatBRL(totalRevenue)} color="emerald" trend={consultations + orders > 0 ? `${consultations + orders} transações` : undefined} />
          <KPICard icon={TrendingUp} label="Taxa Plataforma" value={formatBRL(platformFees)} color="blue" trend={totalRevenue > 0 ? `${((platformFees / totalRevenue) * 100).toFixed(1)}%` : undefined} />
          <KPICard icon={Users} label="Comissões Afiliados" value={formatBRL(totalCommissions)} color="amber" trend={`${paidCommissions > 0 ? formatBRL(paidCommissions) + " pago" : "0 pago"}`} />
          <KPICard icon={Wallet} label="Split Médicos" value={formatBRL(doctorPayouts)} color="purple" trend={vendorPayouts > 0 ? `Lojistas: ${formatBRL(vendorPayouts)}` : undefined} />
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Orientações Técnicas" value={consultations} icon={<BarChart3 size={16} className="text-primary" />} />
          <MetricCard label="Pedidos Marketplace" value={orders} icon={<ArrowUpRight size={16} className="text-primary" />} />
          <MetricCard label="Pagamentos Aprovados" value={approvedPayments} icon={<TrendingUp size={16} className="text-emerald-400" />} />
          <MetricCard label="Pagamentos Pendentes" value={pendingPayments} icon={<AlertTriangle size={16} className="text-amber-400" />} />
        </div>

        <Tabs defaultValue="escrow" className="space-y-4">
          <TabsList className="bg-muted/50 rounded-xl">
            <TabsTrigger value="escrow" className="rounded-xl text-xs font-bold">Escrow</TabsTrigger>
            <TabsTrigger value="webhooks" className="rounded-xl text-xs font-bold">Webhooks</TabsTrigger>
            <TabsTrigger value="commissions" className="rounded-xl text-xs font-bold">Comissões</TabsTrigger>
          </TabsList>

          <TabsContent value="escrow">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Transações Escrow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2">Data</th>
                        <th className="text-left py-2 px-2">Tipo</th>
                        <th className="text-right py-2 px-2">Valor</th>
                        <th className="text-right py-2 px-2">Taxa</th>
                        <th className="text-right py-2 px-2">Médico</th>
                        <th className="text-center py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(escrows || []).slice(0, 20).map((e) => (
                        <tr key={e.id} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="py-2 px-2 text-muted-foreground">{new Date(e.created_at).toLocaleDateString("pt-BR")}</td>
                          <td className="py-2 px-2">
                            <Badge variant="outline" className="text-[10px]">{e.type}</Badge>
                          </td>
                          <td className="py-2 px-2 text-right font-bold">{formatBRL(Number(e.amount))}</td>
                          <td className="py-2 px-2 text-right text-muted-foreground">{formatBRL(Number(e.platform_fee))}</td>
                          <td className="py-2 px-2 text-right text-muted-foreground">{formatBRL(Number(e.doctor_payout || 0))}</td>
                          <td className="py-2 px-2 text-center">
                            <Badge className={`text-[10px] ${
                              e.status === "released" ? "bg-emerald-500/20 text-emerald-400" :
                              e.status === "held" ? "bg-amber-500/20 text-amber-400" :
                              "bg-muted text-muted-foreground"
                            }`}>{e.status}</Badge>
                          </td>
                        </tr>
                      ))}
                      {(!escrows || escrows.length === 0) && (
                        <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Webhooks Recebidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2">Data</th>
                        <th className="text-left py-2 px-2">Payment ID</th>
                        <th className="text-right py-2 px-2">Valor</th>
                        <th className="text-center py-2 px-2">Status</th>
                        <th className="text-center py-2 px-2">Split</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(webhooks || []).map((w) => (
                        <tr key={w.id} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="py-2 px-2 text-muted-foreground">{new Date(w.created_at).toLocaleDateString("pt-BR")}</td>
                          <td className="py-2 px-2 font-mono text-[10px]">{w.payment_id}</td>
                          <td className="py-2 px-2 text-right font-bold">{w.amount ? formatBRL(Number(w.amount)) : "-"}</td>
                          <td className="py-2 px-2 text-center">
                            <Badge className={`text-[10px] ${
                              w.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                              w.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                              "bg-destructive/20 text-destructive"
                            }`}>{w.status}</Badge>
                          </td>
                          <td className="py-2 px-2 text-center">
                            {w.split_processed ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">✓</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">—</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!webhooks || webhooks.length === 0) && (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum webhook recebido</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Comissões de Afiliados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Total Gerado</p>
                    <p className="text-lg font-bold text-emerald-400">{formatBRL(totalCommissions)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Pendente</p>
                    <p className="text-lg font-bold text-amber-400">{formatBRL(totalCommissions - paidCommissions)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Pago</p>
                    <p className="text-lg font-bold text-blue-400">{formatBRL(paidCommissions)}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2">Data</th>
                        <th className="text-center py-2 px-2">Nível</th>
                        <th className="text-right py-2 px-2">Taxa</th>
                        <th className="text-right py-2 px-2">Valor</th>
                        <th className="text-center py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(commissions || []).slice(0, 20).map((c) => (
                        <tr key={c.id} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="py-2 px-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                          <td className="py-2 px-2 text-center">
                            <Badge variant="outline" className="text-[10px]">Nv. {c.level}</Badge>
                          </td>
                          <td className="py-2 px-2 text-right text-muted-foreground">{(Number(c.rate) * 100).toFixed(0)}%</td>
                          <td className="py-2 px-2 text-right font-bold">{formatBRL(Number(c.amount))}</td>
                          <td className="py-2 px-2 text-center">
                            <Badge className={`text-[10px] ${
                              c.status === "paid" ? "bg-emerald-500/20 text-emerald-400" :
                              "bg-amber-500/20 text-amber-400"
                            }`}>{c.status === "paid" ? "Pago" : "Pendente"}</Badge>
                          </td>
                        </tr>
                      ))}
                      {(!commissions || commissions.length === 0) && (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma comissão encontrada</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, trend }: { icon: any; label: string; value: string; color: string; trend?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  };
  const iconColor: Record<string, string> = {
    emerald: "text-emerald-400", blue: "text-blue-400", amber: "text-amber-400", purple: "text-purple-400",
  };
  return (
    <Card className={`bg-gradient-to-br ${colorMap[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${iconColor[color]}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-xl font-bold ${iconColor[color]}`}>{value}</p>
        {trend && <p className="text-[10px] text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
