import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpotlightShell } from '@/components/plantaeraiz/SpotlightShell';
import { BrandHeader } from '@/components/plantaeraiz/BrandHeader';
import { GrowthChartCard } from '@/components/plantaeraiz/GrowthChartCard';
import { ComplianceCard } from '@/components/plantaeraiz/ComplianceCard';
import { SupportChat } from '@/components/plantaeraiz/SupportChat';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { getLoginUrl } from '@/const';

export default function Auth() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('1234');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular login - em produção, isso seria uma chamada tRPC
    setTimeout(() => {
      navigate('/dashboard');
      setIsLoading(false);
    }, 1000);
  };

  const handleOAuthLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <SpotlightShell>
      <div className="min-h-screen bg-background text-foreground">
        {/* Navigation */}
        <nav className="border-b border-border/50 sticky top-0 z-40 backdrop-blur-md bg-background/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <BrandHeader />
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="rounded-lg"
            >
              Voltar
            </Button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Form */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">Bem-vindo de volta</h1>
                <p className="text-lg text-muted-foreground">Acesse sua conta ou crie uma nova</p>
              </div>

              <Card className="bg-card/50 border-border/50 rounded-2xl backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Conecte-se com suas credenciais</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Phone Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Telefone</label>
                      <Input
                        type="tel"
                        placeholder="Ex: 5511987654321"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        inputMode="tel"
                        autoComplete="tel"
                        className="bg-background border-border/50 rounded-lg"
                      />
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Senha</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          className="bg-background border-border/50 rounded-lg pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Referral Code Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Código de Indicação</label>
                      <Input
                        type="text"
                        placeholder="Digite o código"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        autoComplete="off"
                        className="bg-background border-border/50 rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Se você foi indicado por alguém, insira o código aqui para ganhar bônus
                      </p>
                    </div>

                    {/* Login Button */}
                    <Button
                      type="submit"
                      disabled={isLoading || !phone || !password}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold h-11 mt-6"
                    >
                      {isLoading ? 'Conectando...' : 'Conecte-se'}
                      {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/50"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card/50 text-muted-foreground">Ou continue com</span>
                      </div>
                    </div>

                    {/* OAuth Button */}
                    <Button
                      type="button"
                      onClick={handleOAuthLogin}
                      variant="outline"
                      className="w-full rounded-lg font-semibold h-11"
                    >
                      Login com Manus
                    </Button>
                  </form>

                  {/* Sign Up Link */}
                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    Não tem conta?{' '}
                    <button
                      onClick={() => navigate('/auth')}
                      className="text-accent hover:text-accent/90 font-semibold transition-colors"
                    >
                      Criar conta
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Card */}
              <ComplianceCard />
            </div>

            {/* Right Side - Growth Chart & Info */}
            <div className="hidden md:flex flex-col gap-6">
              {/* Growth Chart */}
              <Card className="bg-card/50 border-border/50 rounded-2xl backdrop-blur-xl">
                <CardContent className="p-6">
                  <GrowthChartCard />
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/50 rounded-2xl backdrop-blur-xl">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-lg">Por que escolher Planta & Raiz?</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">✓</span>
                      <span>Rendimentos diários de 1-3%</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">✓</span>
                      <span>Sistema de afiliados com até 40% de comissão</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">✓</span>
                      <span>Plataforma segura e regulamentada</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">✓</span>
                      <span>Suporte 24/7 em português</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-accent font-bold">✓</span>
                      <span>Depósitos e saques via Pix</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Support Chat */}
        <SupportChat />
      </div>
    </SpotlightShell>
  );
}
