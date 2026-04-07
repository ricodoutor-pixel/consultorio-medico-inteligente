import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'react-router-dom';
import { Leaf, TrendingUp, Users, Lock, Smartphone, ArrowRight, Zap, BarChart3, Gift, Play, Star } from 'lucide-react';
import { SpotlightShell } from '@/components/plantaeraiz/SpotlightShell';
import { BrandHeader } from '@/components/plantaeraiz/BrandHeader';
import { ComplianceCard } from '@/components/plantaeraiz/ComplianceCard';
import { SupportChat } from '@/components/plantaeraiz/SupportChat';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useState } from 'react';

export default function HomeNew() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [videoOpen, setVideoOpen] = useState(false);

  // Market data
  const cannabisMarketData = [
    { year: '2020', value: 7.7 },
    { year: '2021', value: 9.2 },
    { year: '2022', value: 11.5 },
    { year: '2023', value: 14.2 },
    { year: '2024', value: 17.8 },
    { year: '2025', value: 22.1 },
    { year: '2026', value: 26.9 },
    { year: '2027', value: 32.5 },
    { year: '2028', value: 39.2 },
    { year: '2029', value: 47.1 },
    { year: '2030', value: 56.8 },
  ];

  const topCompanies = [
    { name: 'Tilray', growth: 45, value: 2.1 },
    { name: 'Canopy', growth: 38, value: 1.8 },
    { name: 'Aurora', growth: 52, value: 2.4 },
    { name: 'Cronos', growth: 41, value: 1.9 },
    { name: 'Aphria', growth: 48, value: 2.2 },
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      age: 45,
      image: '👩‍🦰',
      text: 'Uso há 2 anos e minha qualidade de sono melhorou 100%. Recomendo para todos que sofrem com insônia.',
      benefit: 'Melhora do sono',
    },
    {
      name: 'João Santos',
      age: 38,
      image: '👨‍💼',
      text: 'Ganho de apetite e disposição. Sinto-me muito melhor depois que comecei a usar produtos naturais.',
      benefit: 'Apetite e disposição',
    },
    {
      name: 'Ana Costa',
      age: 52,
      image: '👩‍🦱',
      text: 'Redução significativa de dores crônicas. Vivo muito melhor agora, sem efeitos colaterais.',
      benefit: 'Redução de dores',
    },
    {
      name: 'Carlos Oliveira',
      age: 41,
      image: '👨‍🦲',
      text: 'Meu nível de ansiedade caiu drasticamente. Recomendo para quem busca bem-estar natural.',
      benefit: 'Redução de ansiedade',
    },
    {
      name: 'Lucia Ferreira',
      age: 55,
      image: '👵',
      text: 'Recuperei minha qualidade de vida. Produtos naturais foram a melhor decisão que tomei.',
      benefit: 'Qualidade de vida',
    },
  ];

  const investmentFunds = [
    { name: 'Horizons Cannabis ETF', growth: 156, value: '$2.3B' },
    { name: 'ETFMG Alternative Harvest', growth: 142, value: '$1.8B' },
    { name: 'iShares Global Cannabis', growth: 128, value: '$1.5B' },
  ];

  return (
    <SpotlightShell>
      <div className="min-h-screen bg-background text-foreground">
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

        {/* Video Section */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-border/50 backdrop-blur-xl">
            <div className="aspect-video bg-black relative group cursor-pointer max-h-96" onClick={() => setVideoOpen(true)}>
              <video
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674/FFWrYGNzoOKYdrHT.mp4"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all flex items-center justify-center">
                <button className="w-20 h-20 rounded-full bg-accent/90 hover:bg-accent flex items-center justify-center transition-all group-hover:scale-110">
                  <Play className="h-8 w-8 text-accent-foreground fill-accent-foreground" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold">
                Invista em <span className="text-accent">Cannabis Medicinal</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Plataforma premium para investimentos em cannabis medicinal com rendimentos diários, programa de afiliados robusto e experiência fintech de classe mundial.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold px-8"
              >
                Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="rounded-lg font-semibold px-8"
              >
                Ver Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Market Data Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Mercado Global de Cannabis</h2>
              <p className="text-lg text-muted-foreground">Dados financeiros e projeções até 2030</p>
            </div>

            {/* Market Growth Chart */}
            <Card className="bg-card/50 border-border/50 rounded-2xl backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Crescimento do Mercado Global (Bilhões USD)</CardTitle>
                <CardDescription>Projeção até 2030</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={cannabisMarketData}>
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" />
                    <YAxis stroke="rgba(255,255,255,0.3)" />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(217,119,6,0.5)' }}
                      formatter={(value) => `$${value}B`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="rgb(217, 119, 6)" 
                      strokeWidth={3}
                      dot={{ fill: 'rgb(217, 119, 6)', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Companies */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/50 rounded-2xl backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Top 5 Empresas Produtoras</CardTitle>
                  <CardDescription>Crescimento em valor de ações (%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topCompanies}>
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                      <YAxis stroke="rgba(255,255,255,0.3)" />
                      <Tooltip 
                        contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(217,119,6,0.5)' }}
                        formatter={(value) => `+${value}%`}
                      />
                      <Bar dataKey="growth" fill="rgb(217, 119, 6)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 rounded-2xl backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Principais Fundos de Investimento</CardTitle>
                  <CardDescription>Crescimento acumulado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {investmentFunds.map((fund, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{fund.name}</span>
                        <span className="text-accent font-bold">+{fund.growth}%</span>
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div 
                          className="bg-accent rounded-full h-2 transition-all" 
                          style={{ width: `${Math.min(fund.growth / 2, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">{fund.value} em AUM</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Depoimentos Reais</h2>
              <p className="text-lg text-muted-foreground">Histórias de pessoas que transformaram suas vidas</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              {testimonials.map((testimonial, i) => (
                <Card key={i} className="bg-card/50 border-border/50 rounded-2xl backdrop-blur-xl hover:border-accent/50 transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-5xl">{testimonial.image}</div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.age} anos</p>
                    </div>
                    <p className="text-sm italic text-muted-foreground">"{testimonial.text}"</p>
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full">
                        {testimonial.benefit}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Por que escolher Planta & Raiz?</h2>
              <p className="text-lg text-muted-foreground">Tudo que você precisa para investir com segurança</p>
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
                  description: 'Ganhe comissões até 40% indicando novos usuários',
                },
                {
                  icon: <Lock className="h-8 w-8 text-accent" />,
                  title: 'Segurança Total',
                  description: 'Sistema seguro com criptografia e alinhado às normas brasileiras',
                },
                {
                  icon: <Zap className="h-8 w-8 text-accent" />,
                  title: 'Transações Rápidas',
                  description: 'Depósitos e saques instantâneos via PIX',
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-accent" />,
                  title: 'Dashboard Avançado',
                  description: 'Gráficos e análises em tempo real',
                },
                {
                  icon: <Smartphone className="h-8 w-8 text-accent" />,
                  title: 'App Mobile',
                  description: 'Acesse de qualquer lugar, a qualquer hora',
                },
              ].map((feature, i) => (
                <Card key={i} className="bg-card/50 border-border/50 hover:border-accent/50 transition-colors rounded-2xl backdrop-blur-xl">
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

        {/* Compliance Card */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <ComplianceCard />
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
