import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { TrendingUp, Check, Lock } from 'lucide-react';

export default function Invest() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: plansData } = trpc.investments.getPlans.useQuery();
  const { data: summaryData } = trpc.investments.getSummary.useQuery();
  const createInvestmentMutation = trpc.investments.createInvestment.useMutation();

  const plans = plansData?.data || [];
  const summary = summaryData?.data;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar logado</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInvest = async () => {
    if (!selectedPlan || !amount) {
      toast.error('Selecione um plano e informe o valor');
      return;
    }

    const amountInCents = Math.floor(parseFloat(amount) * 100);

    if (!summary || summary.availableBalance < amountInCents) {
      toast.error('Saldo insuficiente');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createInvestmentMutation.mutateAsync({
        planId: selectedPlan,
        amount: amountInCents,
      });

      if (result.success) {
        toast.success('Investimento realizado com sucesso!');
        setAmount('');
        setSelectedPlan(null);
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        toast.error(result.error || 'Erro ao criar investimento');
      }
    } catch (error) {
      toast.error('Erro ao processar investimento');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Comece a Investir</h1>
          <p className="text-muted-foreground">Escolha um plano e ganhe rendimentos diários</p>
        </div>

        {/* Current Balance */}
        <Card className="bg-gradient-to-r from-accent/10 to-transparent border-accent/50 rounded-2xl">
          <CardContent className="p-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground mb-2">Saldo Disponível</p>
                <p className="text-4xl font-bold">
                  R$ {summary ? (summary.availableBalance / 100).toFixed(2) : '0.00'}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-accent opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Planos Disponíveis</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`rounded-2xl cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-accent/50 ring-2 ring-accent/30 bg-accent/5'
                    : 'border-border/50 hover:border-accent/50'
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    {selectedPlan === plan.id && (
                      <Check className="h-5 w-5 text-accent" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Mínimo</p>
                    <p className="text-xl font-bold">R$ {(plan.minAmount / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rendimento Diário</p>
                    <p className="text-2xl font-bold text-accent">{plan.dailyReturnPercentage}%</p>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Ganho diário: R$ {((plan.minAmount * plan.dailyReturnPercentage) / 100 / 100).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Investment Form */}
        {selectedPlanData && (
          <Card className="bg-card border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle>Configurar Investimento</CardTitle>
              <CardDescription>Informe o valor que deseja investir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor do Investimento (R$)</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">R$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={selectedPlanData.minAmount / 100}
                    max={selectedPlanData.maxAmount / 100}
                    step="0.01"
                    className="text-2xl font-bold bg-background border-border/50 rounded-lg"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo: R$ {(selectedPlanData.minAmount / 100).toFixed(2)} | Máximo: R$ {(selectedPlanData.maxAmount / 100).toFixed(2)}
                </p>
              </div>

              {/* Projection */}
              {amount && (
                <div className="bg-background rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold">Projeção de Ganhos</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ganho Diário</p>
                      <p className="text-xl font-bold text-green-500">
                        R$ {(parseFloat(amount) * (selectedPlanData.dailyReturnPercentage / 100)).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ganho Semanal</p>
                      <p className="text-xl font-bold text-green-500">
                        R$ {(parseFloat(amount) * (selectedPlanData.dailyReturnPercentage / 100) * 7).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ganho Mensal</p>
                      <p className="text-xl font-bold text-green-500">
                        R$ {(parseFloat(amount) * (selectedPlanData.dailyReturnPercentage / 100) * 30).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-yellow-600 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Informações Importantes
                </p>
                <ul className="text-xs text-yellow-600 space-y-1 ml-6 list-disc">
                  <li>Investimentos são bloqueados por 30 dias</li>
                  <li>Rendimentos são creditados diariamente</li>
                  <li>Você pode sacar após o período de bloqueio</li>
                </ul>
              </div>

              <Button
                size="lg"
                onClick={handleInvest}
                disabled={isLoading || !amount}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold h-10"
              >
                {isLoading ? 'Processando...' : 'Confirmar Investimento'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <Card className="bg-card border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle>Por que investir conosco?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Rendimentos Diários', desc: 'Ganhe automaticamente todos os dias' },
                { title: 'Segurança', desc: 'Seus fundos estão protegidos' },
                { title: 'Transparência', desc: 'Acompanhe tudo em tempo real' },
                { title: 'Sem Taxas', desc: 'Não cobramos taxas de investimento' },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <Check className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
