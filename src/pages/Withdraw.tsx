import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function Withdraw() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [amount, setAmount] = useState('');
  const [bankData, setBankData] = useState({
    bankCode: '',
    accountNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
    accountHolder: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { data: summaryData } = trpc.investments.getSummary.useQuery();
  const requestWithdrawalMutation = trpc.transactions.requestWithdrawal.useMutation();

  const summary = summaryData?.data;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Voce precisa estar logado</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRequestWithdrawal = async () => {
    if (!amount || !bankData.bankCode || !bankData.accountNumber || !bankData.accountHolder) {
      toast.error('Preencha todos os campos');
      return;
    }

    const amountInCents = Math.floor(parseFloat(amount) * 100);

    if (!summary || summary.availableBalance < amountInCents) {
      toast.error('Saldo insuficiente para saque');
      return;
    }

    setIsLoading(true);
    try {
      const result = await requestWithdrawalMutation.mutateAsync({
        amount: amountInCents,
        bankData: {
          bankCode: bankData.bankCode,
          accountNumber: bankData.accountNumber,
          accountType: bankData.accountType,
          accountHolder: bankData.accountHolder,
        },
      });

      if (result.success) {
        toast.success('Solicitacao de saque criada com sucesso!');
        setAmount('');
        setBankData({
          bankCode: '',
          accountNumber: '',
          accountType: 'checking',
          accountHolder: '',
        });
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        toast.error(result.error || 'Erro ao solicitar saque');
      }
    } catch (error) {
      toast.error('Erro ao processar solicitacao');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Solicitar Saque</h1>
          <p className="text-muted-foreground">
            Retire seus ganhos para sua conta bancaria
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seu Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              R$ {summary ? (summary.availableBalance / 100).toFixed(2) : '0.00'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Disponivel para saque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valor do Saque</CardTitle>
            <CardDescription>Informe quanto deseja sacar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$)</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">R$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="10"
                  max={summary ? (summary.availableBalance / 100).toString() : '0'}
                  step="0.01"
                  className="text-2xl font-bold"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimo: R$ 10.00 | Maximo: R$ {summary ? (summary.availableBalance / 100).toFixed(2) : '0.00'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Bancarios</CardTitle>
            <CardDescription>Informe sua conta para receber o saque</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Codigo do Banco</label>
              <Input
                placeholder="Ex: 001"
                value={bankData.bankCode}
                onChange={(e) => setBankData({ ...bankData, bankCode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Conta</label>
              <select
                value={bankData.accountType}
                onChange={(e) =>
                  setBankData({
                    ...bankData,
                    accountType: e.target.value as 'checking' | 'savings',
                  })
                }
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="checking">Conta Corrente</option>
                <option value="savings">Conta Poupanca</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Numero da Conta</label>
              <Input
                placeholder="Ex: 123456-7"
                value={bankData.accountNumber}
                onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Titular da Conta</label>
              <Input
                placeholder="Ex: Seu Nome Completo"
                value={bankData.accountHolder}
                onChange={(e) => setBankData({ ...bankData, accountHolder: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/50">
          <CardHeader className="flex flex-row items-start gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <CardTitle className="text-amber-600">Informacoes Importantes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Tempo de processamento:</strong> Saques sao processados em ate 2 dias uteis
            </p>
            <p>
              <strong>Verificacao:</strong> Seus dados bancarios serao verificados antes do processamento
            </p>
            <p>
              <strong>Taxas:</strong> Nao cobramos taxas para saques
            </p>
          </CardContent>
        </Card>

        <Button
          size="lg"
          onClick={handleRequestWithdrawal}
          disabled={isLoading || !amount || !bankData.bankCode || !bankData.accountNumber || !bankData.accountHolder}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Processando...' : 'Confirmar Solicitacao de Saque'}
        </Button>
      </div>
    </div>
  );
}
