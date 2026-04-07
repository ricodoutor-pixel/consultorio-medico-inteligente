import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandHeader } from '@/components/plantaeraiz/BrandHeader';
import { SupportChat } from '@/components/plantaeraiz/SupportChat';
import { SpotlightShell } from '@/components/plantaeraiz/SpotlightShell';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Play, TrendingUp, Users, Zap, Globe, Award, Heart, Leaf } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria Silva',
    age: 42,
    image: '👩‍🦰',
    benefit: 'Melhora do sono',
    quote: 'Uso há 2 anos e finalmente durmo bem. Qualidade de vida muito melhor!',
  },
  {
    name: 'João Santos',
    age: 55,
    image: '👨‍🦱',
    benefit: 'Alívio da dor crônica',
    quote: 'Reduzi significativamente o uso de analgésicos. Recomendo!',
  },
  {
    name: 'Ana Costa',
    age: 38,
    image: '👩‍🦳',
    benefit: 'Melhora do apetite',
    quote: 'Voltei a comer normalmente. Sinto-me muito melhor!',
  },
  {
    name: 'Carlos Oliveira',
    age: 60,
    image: '👨‍🦲',
    benefit: 'Redução da ansiedade',
    quote: 'Minha qualidade de vida melhorou drasticamente.',
  },
  {
    name: 'Patricia Mendes',
    age: 45,
    image: '👩',
    benefit: 'Bem-estar geral',
    quote: 'Sinto-me mais calma e relaxada no dia a dia.',
  },
];

const marketData = [
  { year: '2020', value: 7.5 },
  { year: '2021', value: 10.2 },
  { year: '2022', value: 14.8 },
  { year: '2023', value: 19.5 },
  { year: '2024', value: 26.9 },
  { year: '2025', value: 32.5 },
  { year: '2026', value: 39.2 },
  { year: '2027', value: 47.1 },
  { year: '2028', value: 56.8 },
  { year: '2029', value: 68.2 },
  { year: '2030', value: 81.5 },
];

const topCompanies = [
  { name: 'Canopy Growth', value: 45, growth: '+28%' },
  { name: 'Tilray', value: 38, growth: '+22%' },
  { name: 'Aurora Cannabis', value: 35, growth: '+18%' },
  { name: 'Cronos Group', value: 32, growth: '+15%' },
  { name: 'Trulieve', value: 28, growth: '+12%' },
];

const topFunds = [
  { name: 'Horizons Marijuana ETF', growth: '+45%', year: '2024' },
  { name: 'Global X Cannabis ETF', growth: '+38%', year: '2024' },
  { name: 'iShares Global Cannabis ETF', growth: '+32%', year: '2024' },
];

const usaGrowthData = [
  { state: 'California', value: 5.2, growth: '+15%' },
  { state: 'Colorado', value: 2.8, growth: '+12%' },
  { state: 'Florida', value: 2.1, growth: '+18%' },
  { state: 'New York', value: 1.9, growth: '+25%' },
  { state: 'Illinois', value: 1.7, growth: '+20%' },
];

const COLORS = ['#FCD34D', '#F59E0B', '#FBBF24', '#FDE047', '#FEF08A'];

export default function HomeMegaPremium() {
  const [, navigate] = useLocation();
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <SpotlightShell>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80 text-foreground">
        {/* Navigation */}
        <nav className="border-b border-yellow-500/20 sticky top-0 z-40 backdrop-blur-md bg-background/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <BrandHeader />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-lg border-yellow-500/30 hover:bg-yellow-500/10">
                Dashboard
              </Button>
              <Button onClick={() => navigate('/plans')} className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-lg font-bold">
                Comprar Cota
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Planta & Raiz
            </h1>
            <p className="text-xl md:text-2xl text-yellow-300 font-bold">
              Ecossistema Premium de Cannabis Medicinal
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Participe de um movimento global de apoio a produtores de cannabis medicinal com retorno variável baseado em vendas reais
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => navigate('/plans')} className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-6 text-lg font-bold rounded-lg">
              Começar Agora
            </Button>
            <Button onClick={() => navigate('/affiliates')} variant="outline" className="border-yellow-500/50 hover:bg-yellow-500/10 px-8 py-6 text-lg font-bold rounded-lg">
              Programa de Afiliados
            </Button>
          </div>
        </section>

        {/* Video Section */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30 rounded-2xl overflow-hidden">
            <div className="relative aspect-video bg-black/50 flex items-center justify-center group cursor-pointer" onClick={() => setVideoPlaying(true)}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Play className="h-20 w-20 text-yellow-400 group-hover:scale-110 transition-transform" />
              <p className="absolute bottom-4 left-4 text-yellow-300 font-bold text-sm">Clique para assistir</p>
            </div>
          </Card>
        </section>

        {/* Testimonials Section */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="space-y-6 mb-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-black text-yellow-400 mb-2">Histórias Reais</h2>
              <p className="text-muted-foreground">Pessoas que transformaram suas vidas com cannabis medicinal</p>
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="bg-card/50 border-yellow-500/20 hover:border-yellow-500/50 transition-all rounded-2xl hover:shadow-lg hover:shadow-yellow-500/10">
                <CardContent className="p-6 space-y-4">
                  <div className="text-6xl text-center">{testimonial.image}</div>
                  <div>
                    <p className="font-bold text-yellow-400">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.age} anos</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                    <p className="text-xs font-bold text-yellow-300 mb-1">Benefício</p>
                    <p className="text-sm text-foreground">{testimonial.benefit}</p>
                  </div>
                  <p className="text-sm italic text-muted-foreground">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Market Data Section */}
        <section className="max-w-7xl mx-auto px-6 pb-16 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black text-yellow-400 mb-2">Mercado Global de Cannabis Medicinal</h2>
            <p className="text-muted-foreground">Dados e projeções até 2030</p>
          </div>

          {/* Market Growth Chart */}
          <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-yellow-400">Crescimento do Mercado Global (Bilhões USD)</CardTitle>
              <CardDescription>Projeção até 2030</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={marketData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FCD34D" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#FCD34D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #FCD34D' }} />
                  <Area type="monotone" dataKey="value" stroke="#FCD34D" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Companies */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-yellow-400">Top 5 Empresas Produtoras</CardTitle>
                <CardDescription>Capitalização de mercado</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topCompanies}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #FCD34D' }} />
                    <Bar dataKey="value" fill="#FCD34D" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-yellow-400">Crescimento nos EUA</CardTitle>
                <CardDescription>Por estado (2024)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={usaGrowthData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="state" type="category" width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #FCD34D' }} />
                    <Bar dataKey="value" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Funds */}
          <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-yellow-400">Top 3 Fundos de Investimento</CardTitle>
              <CardDescription>Crescimento em 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topFunds.map((fund, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-yellow-500/20 hover:border-yellow-500/50 transition-all">
                    <div>
                      <p className="font-bold text-yellow-400">{fund.name}</p>
                      <p className="text-sm text-muted-foreground">{fund.year}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-yellow-300">{fund.growth}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <Card className="bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 border-yellow-500/50 rounded-2xl">
            <CardContent className="p-12 text-center space-y-6">
              <h3 className="text-3xl font-black text-yellow-400">Pronto para Participar?</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Junte-se a milhares de pessoas que já estão apoiando produtores de cannabis medicinal e participando de um mercado em crescimento exponencial
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button onClick={() => navigate('/plans')} className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-6 text-lg font-bold rounded-lg">
                  Comprar Cota Agora
                </Button>
                <Button onClick={() => navigate('/affiliates')} variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 px-8 py-6 text-lg font-bold rounded-lg">
                  Ganhar com Afiliados
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <SupportChat />
      </div>
    </SpotlightShell>
  );
}
