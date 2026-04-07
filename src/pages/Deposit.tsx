import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { CreditCard, Smartphone } from 'lucide-react';

export default function Deposit() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

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

  const handleDeposit = () => {
    if (!amount) {
      toast.error('Informe um valor');
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue < 10) {
      toast.error('Valor minimo de R$ 10.00');
      return;
    }

    toast.success('Redirecionando para pagamento...');
    setTimeout(() => {
      toast.success('Deposito realizado com sucesso!');
      setAmount('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Fazer Deposito</h1>
          <p className="text-muted-foreground">
            Adicione fundos a sua conta para comecara a investir
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Valor do Deposito</CardTitle>
            <CardDescription>Informe quanto deseja depositar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  step="0.01"
                  className="text-2xl font-bold"
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimo: R$ 10.00</p>
            </div>

            {amount && (
              <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Valor a depositar</p>
                <p className="text-2xl font-bold">R$ {parseFloat(amount).toFixed(2)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metodo de Pagamento</CardTitle>
            <CardDescription>Escolha como deseja pagar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === 'pix'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-border hover:border-green-500/50'
              }`}
              onClick={() => setPaymentMethod('pix')}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold">PIX</p>
                  <p className="text-sm text-muted-foreground">Transferencia instantanea</p>
                </div>
              </div>
            </div>

            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-border hover:border-blue-500/50'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-semibold">Cartao de Credito</p>
                  <p className="text-sm text-muted-foreground">Parcelado em ate 12x</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-semibold">R$ {amount ? parseFloat(amount).toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Metodo:</span>
              <span className="font-semibold">{paymentMethod === 'pix' ? 'PIX' : 'Cartao'}</span>
            </div>
            <div className="border-t pt-4 flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="text-xl font-bold">R$ {amount ? parseFloat(amount).toFixed(2) : '0.00'}</span>
            </div>

            <Button
              size="lg"
              onClick={handleDeposit}
              disabled={!amount}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Confirmar Deposito
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/50">
          <CardHeader>
            <CardTitle className="text-blue-600">Informacoes Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>PIX:</strong> Transferencia instantanea sem taxas adicionais
            </p>
            <p>
              <strong>Cartao:</strong> Parcelado em ate 12x com juros competitivos
            </p>
            <p>
              <strong>Seguranca:</strong> Todos os pagamentos sao criptografados e seguros
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
