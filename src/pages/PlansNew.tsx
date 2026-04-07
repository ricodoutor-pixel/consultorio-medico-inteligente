import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BrandHeader } from '@/components/plantaeraiz/BrandHeader';
import { SupportChat } from '@/components/plantaeraiz/SupportChat';
import { SpotlightShell } from '@/components/plantaeraiz/SpotlightShell';
import { Check, Copy, Zap, TrendingUp, Shield, Smartphone, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PlansNew() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState('');
  const [copied, setCopied] = useState(false);

  const plans = [
    {
      id: 'bronze',
      name: 'Bronze',
      minAmount: 100,
      maxAmount: 999,
      dailyReturn: '1%',
      monthlyReturn: '30%',
      yearlyReturn: '365%',
      color: 'from-orange-600 to-orange-700',
      icon: '🥉',
      features: [
        'Rendimento diário de 1%',
        'Saque mínimo de R$ 100',
        'Suporte por email',
        'Dashboard básico',
        'Sistema de afiliados',
        'Comissões até 3 níveis',
      ],
    },
    {
      id: 'silver',
      name: 'Prata',
      minAmount: 1000,
      maxAmount: 4999,
      dailyReturn: '1.5%',
      monthlyReturn: '45%',
      yearlyReturn: '547%',
      color: 'from-gray-400 to-gray-500',
      icon: '🥈',
      features: [
        'Rendimento diário de 1.5%',
        'Saque mínimo de R$ 500',
        'Suporte prioritário',
        'Dashboard avançado',
        'Análises de mercado',
        'Comissões até 3 níveis',
        'Bônus de 5% na primeira compra',
      ],
      popular: true,
    },
    {
      id: 'gold',
      name: 'Ouro',
      minAmount: 5000,
      maxAmount: 19999,
      dailyReturn: '2%',
      monthlyReturn: '60%',
      yearlyReturn: '730%',
      color: 'from-yellow-500 to-yellow-600',
      icon: '🥇',
      features: [
        'Rendimento diário de 2%',
        'Saque mínimo de R$ 1.000',
        'Suporte VIP 24/7',
        'Dashboard premium',
        'Análises exclusivas',
        'Comissões até 3 níveis',
        'Bônus de 10% na primeira compra',
        'Acesso a webinars exclusivos',
      ],
    },
    {
      id: 'diamond',
      name: 'Diamante',
      minAmount: 20000,
      maxAmount: 999999,
      dailyReturn: '3%',
      monthlyReturn: '90%',
      yearlyReturn: '1095%',
      color: 'from-cyan-400 to-blue-500',
      icon: '💎',
      features: [
        'Rendimento diário de 3%',
        'Saque mínimo de R$ 2.000',
        'Suporte VIP dedicado',
        'Dashboard platinum',
        'Análises em tempo real',
        'Comissões até 3 níveis',
        'Bônus de 15% na primeira compra',
        'Acesso a eventos exclusivos',
        'Gestor de conta pessoal',
      ],
    },
  ];

  const handleBuyCota = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(planId);
      setPixCode(`PLANTA-${planId.toUpperCase()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openPixQR = () => {
    toast.info('QR Code PIX será exibido aqui após integração com Mercado Pago');
  };

  return (
    <SpotlightShell>
      <div className="min-h-screen bg-background text-foreground">
        {/* Navigation */}
        <nav className="border-b border-border/50 sticky top-0 z-40 backdrop-blur-md bg-background/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <BrandHeader />
            <div className="flex gap-3">
              {user ? (
                <>
                  <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-lg">
                    Dashboard
                  </Button>
                  <Button onClick={() => navigate('/dashboard')} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
                    Acessar
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/auth')} className="rounded-lg">
                    Entrar
                  </Button>
                  <Button onClick={() => navigate('/auth')} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
                    Cadastrar
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Header */}
        <section className="max-w-7xl mx-auto px-6 py-16 text-center space-y-4">
          <h1 className="text-5xl font-bold">Planos de Investimento</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano que melhor se adequa ao seu perfil de investidor e comece a ganhar rendimentos diários
          </p>
        </section>

        {/* Plans Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative bg-card/50 border-border/50 rounded-2xl overflow-hidden transition-all hover:border-accent/50 ${
                  plan.popular ? 'ring-2 ring-accent md:scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground py-2 text-center text-sm font-bold">
                    MAIS POPULAR
                  </div>
                )}
                
                <CardHeader className={`bg-gradient-to-r ${plan.color} bg-opacity-10 pt-8`}>
                  <div className="text-5xl mb-4">{plan.icon}</div>
                  <CardTitle className="text-3xl">{plan.name}</CardTitle>
                  <CardDescription>
                    Investimento: R$ {plan.minAmount.toLocaleString()} - R$ {plan.maxAmount.toLocaleString()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Returns */}
                  <div className="space-y-3 border-b border-border/50 pb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Rendimento Diário</span>
                      <span className="text-2xl font-bold text-accent">{plan.dailyReturn}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Rendimento Mensal</span>
                      <span className="text-lg font-semibold text-green-400">{plan.monthlyReturn}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Rendimento Anual</span>
                      <span className="text-lg font-semibold text-green-500">{plan.yearlyReturn}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex gap-3">
                        <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleBuyCota(plan.id)}
                    className={`w-full rounded-lg font-semibold h-11 ${
                      plan.popular
                        ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                        : 'bg-accent/20 text-accent hover:bg-accent/30'
                    }`}
                  >
                    Comprar Cota
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-card/50 border-border/50 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <Zap className="h-8 w-8 text-accent" />
                <h3 className="font-bold text-lg">Rendimentos Diários</h3>
                <p className="text-sm text-muted-foreground">Ganhe de 1% a 3% ao dia, dependendo do plano escolhido</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <Shield className="h-8 w-8 text-accent" />
                <h3 className="font-bold text-lg">Segurança Total</h3>
                <p className="text-sm text-muted-foreground">Plataforma segura com criptografia e conformidade regulatória</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <TrendingUp className="h-8 w-8 text-accent" />
                <h3 className="font-bold text-lg">Saques Rápidos</h3>
                <p className="text-sm text-muted-foreground">Solicite saques a qualquer momento via PIX</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Como funciona o rendimento?',
                a: 'O rendimento é calculado diariamente sobre o valor investido e creditado automaticamente na sua carteira.',
              },
              {
                q: 'Posso sacar a qualquer momento?',
                a: 'Sim! Você pode solicitar saques a qualquer momento. O processamento é feito em até 24 horas.',
              },
              {
                q: 'Qual é o valor mínimo para investir?',
                a: 'O valor mínimo é R$ 100 no plano Bronze. Cada plano tem seu próprio limite mínimo e máximo.',
              },
              {
                q: 'Como ganho com o programa de afiliados?',
                a: 'Compartilhe seu link de indicação e ganhe comissões de até 40% dos depósitos dos seus indicados em até 3 níveis.',
              },
            ].map((faq, i) => (
              <Card key={i} className="bg-card/50 border-border/50 rounded-xl">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <Card className="bg-gradient-to-r from-accent/10 to-transparent border-accent/50 rounded-2xl">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-3xl font-bold">Pronto para começar?</h2>
              <p className="text-muted-foreground">Junte-se a milhares de investidores que já estão ganhando</p>
              <Button
                onClick={() => navigate('/auth')}
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold px-8 h-11"
              >
                Criar Conta Grátis
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* PIX Payment Modal */}
        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Pagamento via PIX</DialogTitle>
              <DialogDescription>
                Escaneie o QR Code ou copie o código PIX para realizar o pagamento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* QR Code Placeholder */}
              <div className="bg-background border-2 border-border/50 rounded-xl p-8 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-6xl">📱</div>
                  <p className="text-sm text-muted-foreground">QR Code PIX</p>
                  <p className="text-xs text-muted-foreground">Será exibido após integração</p>
                </div>
              </div>

              {/* PIX Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Código PIX (Copia e Cola)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixCode}
                    readOnly
                    className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <Button
                    onClick={copyPixCode}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Valor</label>
                <input
                  type="text"
                  placeholder="Digite o valor"
                  className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Instructions */}
              <div className="bg-background/50 border border-border/50 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-semibold">Instruções:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Abra seu app bancário</li>
                  <li>Selecione "Transferência PIX"</li>
                  <li>Cole o código PIX acima</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={openPixQR}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg"
                >
                  Abrir QR Code
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Support Chat */}
        <SupportChat />
      </div>
    </SpotlightShell>
  );
}
