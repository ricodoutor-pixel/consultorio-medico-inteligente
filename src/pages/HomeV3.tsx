import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'react-router-dom';
import { Leaf, TrendingUp, Users, Lock, Smartphone, ArrowRight, Zap, BarChart3, Gift, Heart, Brain, Shield } from 'lucide-react';
import FrogHeadMetaMask from '@/components/FrogHeadMetaMask';

export default function HomeV3() {
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState('patients');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Sapo MetaMask Style */}
      <FrogHeadMetaMask />

      {/* Navigation */}
      <nav className="border-b border-green-500/20 sticky top-0 z-40 backdrop-blur-md bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Planta & Raiz
            </span>
          </div>
          <div className="flex items-center gap-4">
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                Cadastro
              </Button>
            </>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2 mb-6">
              <span className="text-green-400 text-sm font-semibold">🚀 Revolução em Saúde Digital</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Democratizando o acesso à <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">tele-medicina</span> e ao uso de medicamentos e suprimentos à base de cannabis no mundo
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Plataforma integrada com telemedicina, prescrição digital, marketplace e IA autônoma. Funciona 24/7 sem interação humana.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                onClick={() => navigate('/clinic24x7')}
              >
                Começar Agora <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
                Saiba Mais
              </Button>
            </div>
          </div>

          {/* Mockup Phone */}
          <div className="relative">
            <div className="bg-gradient-to-b from-green-500/20 to-emerald-500/20 rounded-3xl p-8 border border-green-500/30 backdrop-blur-sm">
              <div className="bg-slate-950 rounded-2xl p-4 border border-green-500/50 shadow-2xl">
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Leaf className="w-20 h-20 mx-auto mb-4 text-white" />
                    <p className="text-white font-bold text-lg">Planta & Raiz</p>
                    <p className="text-white/80 text-sm">Sua saúde, nossa missão</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-6">
        {[
          { icon: Users, label: 'Profissionais Verificados', value: '500+' },
          { icon: Heart, label: 'Consultas Realizadas', value: '10K+' },
          { icon: TrendingUp, label: 'Taxa de Satisfação', value: '98%' },
          { icon: Zap, label: 'Tempo Médio Atendimento', value: '5 min' },
        ].map((stat, i) => (
          <Card key={i} className="bg-slate-900/50 border-green-500/30 hover:border-green-500/60 transition-all">
            <CardContent className="pt-6">
              <stat.icon className="w-8 h-8 text-green-400 mb-4" />
              <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-green-400">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold mb-12 text-center">Funcionalidades Principais</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Brain,
              title: 'IA Autônoma 24/7',
              description: 'Triagem automática, diagnóstico e recomendações personalizadas sem interação humana',
            },
            {
              icon: Lock,
              title: 'Prescrição Digital ICP-Brasil',
              description: 'E-Receita certificada conforme ANVISA, assinatura eletrônica segura',
            },
            {
              icon: Smartphone,
              title: 'Telemedicina com Jitsi',
              description: 'Videoconferência criptografada E2E com gravação automática',
            },
            {
              icon: BarChart3,
              title: 'Dashboard Financeiro',
              description: 'Controle de ganhos, split automático 7%, saque PIX',
            },
            {
              icon: Gift,
              title: 'Marketplace Integrado',
              description: 'Compre medicamentos e suprimentos direto após consulta',
            },
            {
              icon: Shield,
              title: 'Compliance Brasil',
              description: 'LGPD, ANVISA, CFM, CRM/COREN, ICP-Brasil 100% conformes',
            },
          ].map((feature, i) => (
            <Card key={i} className="bg-slate-900/50 border-green-500/20 hover:border-green-500/50 transition-all group">
              <CardHeader>
                <feature.icon className="w-10 h-10 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold mb-12 text-center">Planos e Preços</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: 'Paciente',
              price: 'Grátis',
              features: ['Acesso a profissionais', 'Prescrição digital', 'Marketplace', 'Chat 24/7'],
            },
            {
              name: 'Profissional',
              price: '7%',
              description: 'por consulta',
              features: ['Dashboard financeiro', 'Receber consultas', 'Prescrever digital', 'Saque PIX'],
              highlighted: true,
            },
            {
              name: 'Premium',
              price: 'R$ 99',
              description: 'por mês',
              features: ['Tudo do Profissional', 'Análise genômica', 'IA avançada', 'Prioridade suporte'],
            },
          ].map((plan, i) => (
            <Card
              key={i}
              className={`border transition-all ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/60 scale-105'
                  : 'bg-slate-900/50 border-green-500/20 hover:border-green-500/50'
              }`}
            >
              <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-green-400">{plan.price}</span>
                  {plan.description && <p className="text-gray-400 text-sm">{plan.description}</p>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-300">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  Começar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Pronto para revolucionar sua saúde?</h2>
        <p className="text-xl text-gray-300 mb-8">Junte-se a milhares de pacientes e profissionais já usando Planta & Raiz</p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          onClick={() => navigate('/clinic24x7')}
        >
          Começar Agora <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-500/20 bg-slate-950/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-green-400" />
                <span className="font-bold">Planta & Raiz</span>
              </div>
              <p className="text-gray-400 text-sm">Democratizando a telemedicina e cannabis medicinal</p>
            </div>
            {[
              { title: 'Produto', links: ['Funcionalidades', 'Preços', 'Segurança'] },
              { title: 'Empresa', links: ['Sobre', 'Blog', 'Contato'] },
              { title: 'Legal', links: ['Privacidade', 'Termos', 'Compliance'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-gray-400 hover:text-green-400 transition-colors text-sm">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-green-500/20 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 Planta & Raiz. Todos os direitos reservados. LGPD | ANVISA | CFM Conformes</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
