import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, DollarSign, Link2, Copy, CheckCircle } from "lucide-react";

export default function AffiliateDashboard() {
  const { user } = useAuth();

  const stats = [
    { label: "Referências Totais", value: "47", icon: Users, color: "text-emerald-400" },
    { label: "Comissão Pendente", value: "R$ 3.240", icon: DollarSign, color: "text-cyan-400" },
    { label: "Ganhos Totais", value: "R$ 12.850", icon: TrendingUp, color: "text-emerald-400" },
    { label: "Taxa de Conversão", value: "12.5%", icon: CheckCircle, color: "text-cyan-400" },
  ];

  const referrals = [
    { id: 1, name: "João Silva", date: "2 dias", plan: "Médico VIP", commission: "R$ 99", status: "Pago" },
    { id: 2, name: "Maria Santos", date: "5 dias", plan: "Lojista Pro", commission: "R$ 49", status: "Pendente" },
    { id: 3, name: "Pedro Oliveira", date: "1 semana", plan: "Usuário", commission: "R$ 29", status: "Pago" },
  ];

  const referralCode = "AFIL-ABC123XYZ";
  const referralLink = `https://plantaraiz.com.br?ref=${referralCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Bem-vindo, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{user?.name}</span>
        </h1>
        <p className="text-slate-400">Programa de Afiliados • Ganhe comissões em 3 níveis</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="referrals" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="referrals">Referências</TabsTrigger>
          <TabsTrigger value="link">Link de Afiliado</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Referências Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Suas Referências</CardTitle>
              <CardDescription>Usuários que você indicou</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.map((ref) => (
                  <div key={ref.id} className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{ref.name}</p>
                      <p className="text-sm text-slate-400">{ref.date} • {ref.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{ref.commission}</p>
                      <Badge
                        variant={ref.status === "Pago" ? "default" : "secondary"}
                        className={ref.status === "Pago" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" : ""}
                      >
                        {ref.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Link de Afiliado Tab */}
        <TabsContent value="link" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Seu Link de Afiliado</CardTitle>
              <CardDescription>Compartilhe este link para ganhar comissões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Código de Afiliado</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    readOnly
                    className="flex-1 bg-slate-800/50 border border-slate-600/50 rounded px-3 py-2 text-white"
                  />
                  <Button variant="outline" size="sm" className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Link de Referência</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-slate-800/50 border border-slate-600/50 rounded px-3 py-2 text-white text-sm"
                  />
                  <Button variant="outline" size="sm" className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <p className="text-sm text-emerald-300 mb-2">💡 Dica</p>
                <p className="text-sm text-emerald-200">
                  Compartilhe seu link em redes sociais, email e grupos. Cada referência que se inscrever através do seu link gerará comissões automáticas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comissões Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-2">Nível 1 (Diretas)</p>
                <p className="text-3xl font-bold text-emerald-400">50%</p>
                <p className="text-xs text-slate-400 mt-2">23 referências ativas</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-2">Nível 2 (Indiretas)</p>
                <p className="text-3xl font-bold text-cyan-400">5%</p>
                <p className="text-xs text-slate-400 mt-2">12 referências ativas</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-2">Nível 3 (Terciárias)</p>
                <p className="text-3xl font-bold text-emerald-400">2%</p>
                <p className="text-xs text-slate-400 mt-2">12 referências ativas</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Como Funcionam as Comissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Nível 1: 50% de comissão</p>
                    <p className="text-sm text-slate-400">Receba 50% do valor do plano para cada pessoa que se inscrever através do seu link</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Nível 2: 5% de comissão</p>
                    <p className="text-sm text-slate-400">Ganhe 5% quando seus referidos indicarem outras pessoas</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Nível 3: 2% de comissão</p>
                    <p className="text-sm text-slate-400">Receba 2% das indicações do nível 2</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Dados Bancários</CardTitle>
              <CardDescription>Para receber seus ganhos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Banco</label>
                <p className="text-white font-semibold">Banco do Brasil</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Agência</label>
                <p className="text-white font-semibold">1234</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Conta</label>
                <p className="text-white font-semibold">123456-7</p>
              </div>
              <Button variant="outline" className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10">
                Editar Dados Bancários
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
