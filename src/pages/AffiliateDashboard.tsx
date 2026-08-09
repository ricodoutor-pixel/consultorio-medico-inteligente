import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Link2, Copy, Users, DollarSign, TrendingUp, Eye,
  ArrowUpRight, Wallet, Download, CheckCircle2, BarChart3,
  Sparkles, MessageCircle, ChevronRight, Star
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { EarningsNotificationBell } from "@/components/affiliates/EarningsNotificationBell";
import { AffiliateEarningsSimulator, AffiliateActionPlan } from "@/components/affiliates/AffiliateEarningsSimulator";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

const CHART_DATA = [
  { month: "Jan", clicks: 120, leads: 34, conversions: 12 },
  { month: "Fev", clicks: 180, leads: 52, conversions: 18 },
  { month: "Mar", clicks: 240, leads: 71, conversions: 28 },
  { month: "Abr", clicks: 310, leads: 89, conversions: 35 },
  { month: "Mai", clicks: 420, leads: 112, conversions: 48 },
  { month: "Jun", clicks: 380, leads: 98, conversions: 42 },
];

export default function AffiliateDashboard() {
  const [referralCode, setReferralCode] = useState("");
  const [userId, setUserId] = useState<string | undefined>();
  const [wallet, setWallet] = useState({ available: 0, pending: 0, total: 0, withdrawn: 0 });
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load wallet
      const { data: walletData } = await supabase
        .from("affiliate_wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (walletData) {
        setWallet({
          available: walletData.available_balance,
          pending: walletData.pending_balance,
          total: walletData.total_earnings,
          withdrawn: walletData.total_withdrawn,
        });
      }

      // Load commissions
      const { data: commData } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (commData) setCommissions(commData);

      // Generate ref code from user id
      const short = user.id.replace(/-/g, "").substring(0, 8).toUpperCase();
      setReferralCode(`PLR-${short}`);
    } catch (err) {
      console.error("Error loading affiliate data:", err);
    }
    setLoading(false);
  };

  const referralLink = `https://plantayraiz.com.br?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const requestWithdrawal = async () => {
    if (wallet.available < 10000) {
      toast.error("Saldo mínimo para saque: R$ 100,00");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("affiliate_withdrawals").insert({
        user_id: user.id,
        amount: wallet.available,
        status: "pending",
      });

      toast.success("Solicitação de saque enviada!");
    } catch {
      toast.error("Erro ao solicitar saque");
    }
  };

  const stats = [
    { label: "Cliques Totais", value: "1.650", icon: Eye, change: "+12%" },
    { label: "Leads Gerados", value: "456", icon: Users, change: "+8%" },
    { label: "Conversões", value: "183", icon: TrendingUp, change: "+23%" },
    { label: "Comissão Total", value: `R$ ${(wallet.total / 100).toFixed(2)}`, icon: DollarSign, change: "+15%" },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Portal do Afiliado</h1>
              <p className="text-sm text-muted-foreground">Acompanhe seus resultados e comissões</p>
            </div>
            <div className="flex items-center gap-2">
              <EarningsNotificationBell userId={userId} />
              <Badge variant="outline" className="border-primary/30 text-primary">
                Nível Bronze
              </Badge>
            </div>
          </div>

          {/* Link Generator */}
          <Card className="mb-6 bg-card/60 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-foreground">Seu Link de Indicação</h2>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-muted-foreground font-mono truncate">
                  {loading ? <Skeleton className="h-5 w-full" /> : referralLink}
                </div>
                <Button onClick={copyLink} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 gap-2">
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Influencer Special Conditions */}
          <Card className="mb-6 bg-gradient-to-br from-primary/10 via-card/60 to-accent/10 backdrop-blur-sm border-primary/30 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <Badge className="bg-primary/20 text-primary border-primary/30">Programa Influencer</Badge>
                  </div>
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    Condições Especiais para Influenciadores
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tem audiência nas redes? Ganhe comissões premium, materiais exclusivos e acompanhamento dedicado da nossa equipe.
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    {[
                      "Comissões de até 35% (vs. 25% padrão)",
                      "Materiais de divulgação personalizados com sua marca",
                      "Acompanhamento 1:1 com nossa equipe de growth",
                      "Pagamento prioritário toda terça-feira",
                      "Acesso antecipado a lançamentos e campanhas",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                        <Star className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:w-auto shrink-0">
                  <a
                    href={`https://wa.me/5511991363154?text=${encodeURIComponent("Olá! Sou influenciador/criador de conteúdo e quero conhecer as condições especiais de afiliado da Planta y Raiz. Pode me orientar?")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full md:w-auto gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white">
                      <MessageCircle className="h-4 w-4" />
                      Cadastre-se e fale com a Enfª Brisa
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </a>
                  <p className="text-[10px] text-muted-foreground text-center md:text-left mt-2">
                    Tire suas dúvidas agora pelo WhatsApp
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simulador de Ganhos + Plano de Ação */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <AffiliateEarningsSimulator />
            <AffiliateActionPlan />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-card/60 backdrop-blur-sm border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" /> {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{loading ? <Skeleton className="h-7 w-20" /> : stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Area Chart - Performance */}
              <Card className="bg-card/60 backdrop-blur-sm border-border/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Performance Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.1)" strokeWidth={2} />
                      <Area type="monotone" dataKey="leads" stroke="#60a5fa" fill="rgba(96,165,250,0.1)" strokeWidth={2} />
                      <Area type="monotone" dataKey="conversions" stroke="#f59e0b" fill="rgba(245,158,11,0.1)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Chart - Conversions */}
              <Card className="bg-card/60 backdrop-blur-sm border-border/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Conversões por Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Bar dataKey="conversions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Sidebar */}
            <div className="space-y-4">
              <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Sua Carteira
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Disponível para saque</p>
                    <p className="text-3xl font-bold text-primary">
                      R$ {loading ? "..." : (wallet.available / 100).toFixed(2)}
                    </p>
                  </div>
                  <Separator className="bg-border/20" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Pendente</p>
                      <p className="font-semibold text-foreground">R$ {(wallet.pending / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sacado</p>
                      <p className="font-semibold text-foreground">R$ {(wallet.withdrawn / 100).toFixed(2)}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={requestWithdrawal}
                    disabled={wallet.available < 10000}
                  >
                    <Download className="h-4 w-4" /> Solicitar Saque
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">Mínimo: R$ 100,00 • Via PIX</p>
                </CardContent>
              </Card>

              {/* Recent Commissions */}
              <Card className="bg-card/60 backdrop-blur-sm border-border/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Comissões Recentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                  ) : commissions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma comissão ainda</p>
                  ) : (
                    commissions.slice(0, 8).map((c) => (
                      <div key={c.id} className="flex justify-between items-center p-2 rounded-lg bg-background/30">
                        <div>
                          <p className="text-xs font-medium">Nível {c.level}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">R$ {(c.amount / 100).toFixed(2)}</p>
                          <Badge variant="outline" className="text-[9px]">{c.status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
