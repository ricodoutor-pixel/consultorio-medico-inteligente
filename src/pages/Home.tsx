import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'react-router-dom';
import { Leaf, TrendingUp, Users, Lock, Smartphone, ArrowRight, Zap, BarChart3, Gift } from 'lucide-react';
import { SpotlightShell } from '@/components/plantaeraiz/SpotlightShell';
import { BrandHeader } from '@/components/plantaeraiz/BrandHeader';
import { GrowthChartCard } from '@/components/plantaeraiz/GrowthChartCard';
import { ComplianceCard } from '@/components/plantaeraiz/ComplianceCard';
import { SupportChat } from '@/components/plantaeraiz/SupportChat';
import FrogMascot from '@/components/FrogMascot';
import DoctorCard from '@/components/DoctorCard';
import ClubSection from '@/components/ClubSection';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <SpotlightShell>
      <div className="min-h-screen bg-background text-foreground">
        {/* Sapo Mascote */}
        <FrogMascot />
        {/* Navigation */}
        <nav className="border-b border-border/50 sticky top-0 z-40 backdrop-blur-md bg-background/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <BrandHeader />
            <div className="flex gap-3">
              {isAuthenticated ? (
                <>
                  <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-lg">
                    Dashboard
                  </Button>
                  <Button onClick={() => navigate('/dashboard')} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
                    Acessar Plataforma
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

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 pt-4 sm:pt-0">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-snug sm:leading-tight lg:leading-tight">
                  Democratizando o Acesso a <span className="text-accent">Tele-Medicina e Medicamentos a Base de Cannabis</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-xl text-muted-foreground leading-relaxed">
                  Plataforma inovadora conectando pacientes a médicos especializados em cannabis medicinal em todo o mundo. Telemedicina segura, legal e acessível com conformidade ANVISA, CFM e LGPD.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold px-6 sm:px-8 w-full sm:w-auto"
                >
                  Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="rounded-lg font-semibold px-6 sm:px-8 w-full sm:w-auto"
                >
                  Ver Demo
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2 sm:pt-4">
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-accent">10K+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Usuários Ativos</p>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-accent">R$ 50M+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Investidos</p>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-accent">1-3%</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Rendimento Diário</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent rounded-3xl blur-3xl"></div>
                <Card className="relative bg-card border-border/50 rounded-3xl overflow-hidden backdrop-blur-xl">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Saldo Total</span>
                        <Leaf className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-4xl font-bold">R$ 45.230,50</p>
                        <p className="text-sm text-green-500 mt-2">+12.5% este mês</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Investido</p>
                          <p className="text-xl font-bold mt-1">R$ 30.000</p>
                        </div>
                        <div className="bg-background rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Ganhos</p>
                          <p className="text-xl font-bold mt-1 text-green-500">R$ 15.230</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Growth Chart */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <Card className="bg-card border-border/50 rounded-2xl">
            <CardContent className="p-8">
              <GrowthChartCard />
            </CardContent>
          </Card>
        </section>

        {/* Compliance Card */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <ComplianceCard />
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Por que escolher Planta & Raiz?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tudo que você precisa para investir em cannabis medicinal com segurança e transparência
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <TrendingUp className="h-8 w-8 text-accent" />,
                  title: 'Rendimentos Diários',
                  description: 'Ganhe 1-3% ao dia com nossos planos de investimento automáticos',
                },
                {
                  icon: <Users className="h-8 w-8 text-accent" />,
                  title: 'Programa de Afiliados',
                  description: 'Ganhe comissões indicando novos usuários para a plataforma',
                },
                {
                  icon: <Lock className="h-8 w-8 text-accent" />,
                  title: 'Segurança Total',
                  description: 'Sistema seguro com criptografia e alinhado às normas brasileiras',
                },
                {
                  icon: <Zap className="h-8 w-8 text-accent" />,
                  title: 'Transações Rápidas',
                  description: 'Depósitos e saques instantâneos via PIX e cartão de crédito',
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-accent" />,
                  title: 'Dashboard Avançado',
                  description: 'Acompanhe seus investimentos com gráficos e análises em tempo real',
                },
                {
                  icon: <Smartphone className="h-8 w-8 text-accent" />,
                  title: 'App Mobile',
                  description: 'Acesse sua conta de qualquer lugar, a qualquer hora, em qualquer dispositivo',
                },
              ].map((feature, i) => (
                <Card key={i} className="bg-card border-border/50 hover:border-accent/50 transition-colors rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Investment Plans */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Planos de Investimento</h2>
              <p className="text-lg text-muted-foreground">Escolha o plano que melhor se adequa ao seu perfil</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Bronze', min: 100, max: 999, daily: '1%', color: 'from-amber-600/20 to-amber-700/20' },
                { name: 'Prata', min: 1000, max: 4999, daily: '1.5%', color: 'from-gray-400/20 to-gray-500/20' },
                { name: 'Ouro', min: 5000, max: 19999, daily: '2%', color: 'from-yellow-500/20 to-yellow-600/20' },
                { name: 'Diamante', min: 20000, max: 999999, daily: '3%', color: 'from-cyan-400/20 to-blue-500/20' },
              ].map((plan, i) => (
                <Card key={i} className={`bg-gradient-to-br ${plan.color} border-border/50 hover:border-accent/50 transition-all rounded-2xl overflow-hidden group backdrop-blur-sm`}>
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Mínimo</p>
                      <p className="text-2xl font-bold">R$ {plan.min.toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rendimento Diário</p>
                      <p className="text-3xl font-bold text-accent">{plan.daily}</p>
                    </div>
                    <Button 
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold group-hover:shadow-lg transition-all"
                      onClick={() => navigate('/auth')}
                    >
                      Investir Agora
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Investment CTA Button Section */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-accent/30 to-green-500/30 rounded-3xl blur-3xl"></div>
            <Card className="relative bg-gradient-to-br from-yellow-500/10 via-accent/10 to-green-500/10 border-2 border-yellow-400/50 rounded-3xl overflow-hidden backdrop-blur-xl hover:border-yellow-300/80 transition-all duration-300 shadow-2xl">
              <CardContent className="p-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <h3 className="text-3xl md:text-4xl font-bold text-foreground">
                      💰 <span className="bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent">Invista Em Cannabis Medicinal</span>
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                      Ganhe rendimentos diários de 1-3% investindo em produtos de cannabis medicinal. Plataforma segura, legal e com conformidade ANVISA.
                    </p>
                    <div className="flex gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        <span className="text-sm font-semibold">Rendimento Diário</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-green-400" />
                        <span className="text-sm font-semibold">100% Seguro</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 rounded-2xl font-bold px-10 h-14 text-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
                  >
                    Investir Agora <TrendingUp className="ml-2 h-6 w-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Doctors Section - Especialistas Internacionais */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold flex items-center justify-center gap-2">
                <Globe className="text-accent" /> Especialistas Internacionais
              </h2>
              <p className="text-lg text-muted-foreground">Médicos certificados em cannabis medicinal de diversos países</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <DoctorCard name="Dr. Bezerra" specialty="Clínico Geral" crm="10963" countries={["🇧🇷", "🇧🇴"]} />
              <DoctorCard name="Dra. Silva" specialty="Psiquiatria" crm="22341" countries={["🇧🇷", "🇻🇪"]} />
              <DoctorCard name="Dr. Santos" specialty="Neurologia" crm="15678" countries={["🇧🇷", "🇵🇹"]} />
              <DoctorCard name="Dra. Costa" specialty="Oncologia" crm="18934" countries={["🇧🇷", "🇲🇽"]} />
            </div>
          </div>
        </section>

        {/* Club Section - Ofertas Exclusivas */}
        <ClubSection />

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <Card className="bg-gradient-to-r from-accent/10 to-transparent border-accent/50 rounded-3xl overflow-hidden backdrop-blur-xl">
            <CardContent className="p-12 text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold">Pronto para começar?</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Junte-se a milhares de usuários que já estão ganhando com Planta & Raiz
                </p>
              </div>
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold px-8 h-10 text-lg"
              >
                Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-background/50 py-12 mt-20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-accent" />
                  Planta & Raiz
                </h3>
                <p className="text-sm text-muted-foreground">Investimentos em cannabis medicinal</p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Produto</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Dashboard</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Investimentos</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Afiliados</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Termos</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Disclaimer</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Contato</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="mailto:suporte@plantaeraiz.com" className="hover:text-foreground transition-colors">suporte@plantaeraiz.com</a></li>
                  <li><a href="tel:+5511999999999" className="hover:text-foreground transition-colors">+55 11 99999-9999</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2026 Planta & Raiz. Todos os direitos reservados.</p>
              <p className="mt-2 text-xs">Operação em conformidade com a RDC 327/2019 da ANVISA e normas de Tokenização de Ativos Reais (RWA).</p>
            </div>
          </div>
        </footer>

        {/* Support Chat */}
        <SupportChat />
      </div>
    </SpotlightShell>
  );
}
