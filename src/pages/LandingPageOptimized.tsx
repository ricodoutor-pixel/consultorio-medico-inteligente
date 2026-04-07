import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, Users, Zap, Shield, Star, TrendingUp, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function LandingPageOptimized() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* NAVBAR */}
      <nav className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-[#00FF00]">🌿 Planta & Raiz</div>
          <div className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition">Funcionalidades</a>
            <a href="#testimonials" className="text-gray-400 hover:text-white transition">Depoimentos</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition">Preços</a>
            <a href="#faq" className="text-gray-400 hover:text-white transition">FAQ</a>
          </div>
          <Button className="bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold">
            Começar Agora
          </Button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-[#00FF00]/20 border border-[#00FF00] rounded-full px-4 py-2 mb-6">
              <span className="text-[#00FF00] font-semibold text-sm">✨ Democratizando o acesso a medicamentos à base de cannabis</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Conectamos você aos <span className="text-[#00FF00]">melhores profissionais</span> de saúde
            </h1>

            <p className="text-xl text-gray-400 mb-8">
              Plataforma inteligente que conecta pacientes a especialistas verificados, oferecendo telemedicina, marketplace e IA para recomendações personalizadas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button className="bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold text-lg px-8 py-6 flex items-center gap-2">
                Agendar Consulta <ArrowRight className="w-5 h-5" />
              </Button>
              <Button className="bg-white/10 text-white hover:bg-white/20 font-bold text-lg px-8 py-6 border border-white/20">
                Explorar Marketplace
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#00FF00]" />
                <span>500+ Profissionais Verificados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#00FF00]" />
                <span>10k+ Pacientes Ativos</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-gradient-to-br from-[#00FF00]/10 to-[#9D4EDD]/10 border border-[#00FF00]/30 rounded-3xl p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="bg-white/5 border border-[#00FF00]/20 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-2">Pré-entrevista com IA</p>
                  <p className="text-white font-semibold">Responda 7 perguntas e receba recomendações personalizadas</p>
                </div>
                <div className="bg-white/5 border border-[#9D4EDD]/20 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-2">Consultas em Tempo Real</p>
                  <p className="text-white font-semibold">Videochamada, chat e suporte com profissionais verificados</p>
                </div>
                <div className="bg-white/5 border border-[#00FF00]/20 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-2">Marketplace Integrado</p>
                  <p className="text-white font-semibold">Compre produtos CBD com segurança e discrição</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Por que escolher <span className="text-[#00FF00]">Planta & Raiz</span>?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'Profissionais Verificados',
              description: 'Todos os especialistas passam por verificação rigorosa e possuem credenciais válidas',
              color: 'from-[#00FF00]',
            },
            {
              icon: Zap,
              title: 'Tecnologia IA Avançada',
              description: 'Pré-entrevista inteligente que recomenda o profissional ideal para seu caso',
              color: 'from-[#9D4EDD]',
            },
            {
              icon: Users,
              title: 'Comunidade Ativa',
              description: '10k+ pacientes já confiam em nós para suas necessidades de saúde',
              color: 'from-[#00FF00]',
            },
            {
              icon: TrendingUp,
              title: 'Análise de Saúde',
              description: 'Dashboard completo com gráficos e relatórios do seu progresso',
              color: 'from-[#9D4EDD]',
            },
            {
              icon: CheckCircle,
              title: 'Pagamento Seguro',
              description: 'Integração com Mercado Pago para transações 100% seguras',
              color: 'from-[#00FF00]',
            },
            {
              icon: Star,
              title: 'Suporte 24/7',
              description: 'Chat em tempo real com especialistas prontos para ajudar',
              color: 'from-[#9D4EDD]',
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card key={i} className="bg-white/5 border border-[#00FF00]/20 p-8 hover:border-[#00FF00]/50 transition-all group">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} to-transparent p-3 mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          O que nossos usuários dizem
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: 'João Silva',
              role: 'Paciente',
              text: 'Encontrei o profissional perfeito em minutos. A plataforma é intuitiva e segura.',
              rating: 5,
            },
            {
              name: 'Dra. Maria Santos',
              role: 'Especialista',
              text: 'Excelente plataforma para conectar com pacientes. Muito profissional!',
              rating: 5,
            },
            {
              name: 'Carlos Costa',
              role: 'Paciente',
              text: 'A pré-entrevista com IA foi muito útil. Recomendo para todos!',
              rating: 5,
            },
          ].map((testimonial, i) => (
            <Card key={i} className="bg-white/5 border border-[#9D4EDD]/20 p-8">
              <div className="flex gap-1 mb-4">
                {Array(testimonial.rating).fill(0).map((_, j) => (
                  <Star key={j} className="w-5 h-5 fill-[#00FF00] text-[#00FF00]" />
                ))}
              </div>
              <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
              <div>
                <p className="text-white font-bold">{testimonial.name}</p>
                <p className="text-gray-400 text-sm">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Planos Acessíveis
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: 'Básico',
              price: 29.90,
              features: ['2 consultas/mês', 'Chat com profissional', 'Acesso à biblioteca'],
              cta: 'Começar',
              popular: false,
            },
            {
              name: 'Premium',
              price: 79.90,
              features: ['Consultas ilimitadas', 'Prioridade no atendimento', 'Prescrições digitais', 'Análise de saúde'],
              cta: 'Começar Agora',
              popular: true,
            },
            {
              name: 'Profissional',
              price: 199.90,
              features: ['Tudo do Premium', 'Suporte dedicado', 'API de integração', 'Relatórios avançados'],
              cta: 'Contatar',
              popular: false,
            },
          ].map((plan, i) => (
            <Card
              key={i}
              className={`p-8 transition-all ${
                plan.popular
                  ? 'bg-gradient-to-br from-[#00FF00]/20 to-[#9D4EDD]/20 border border-[#00FF00] scale-105'
                  : 'bg-white/5 border border-[#00FF00]/20'
              }`}
            >
              {plan.popular && (
                <div className="bg-[#00FF00] text-[#0A0E27] px-4 py-1 rounded-full text-xs font-bold w-fit mb-4">
                  MAIS POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-4xl font-bold text-[#00FF00] mb-6">
                R$ {plan.price.toFixed(2)}
                <span className="text-lg text-gray-400">/mês</span>
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-[#00FF00]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full font-bold py-6 ${
                  plan.popular
                    ? 'bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-[#00FF00]/20 to-[#9D4EDD]/20 border border-[#00FF00]/30 p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para começar sua jornada de saúde?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Junte-se a milhares de pacientes que já confiam em nós
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white/10 border-[#00FF00]/30 text-white"
              required
            />
            <Button
              type="submit"
              className="bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold px-8"
            >
              {submitted ? '✓ Enviado!' : 'Inscrever-se'}
            </Button>
          </form>
        </Card>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Perguntas Frequentes
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              q: 'Como funciona a pré-entrevista com IA?',
              a: 'Você responde 7 perguntas sobre seus sintomas e preferências. A IA analisa e recomenda os 3 melhores profissionais para seu caso.',
            },
            {
              q: 'Os profissionais são realmente verificados?',
              a: 'Sim! Todos os especialistas passam por verificação de credenciais, educação e experiência antes de serem aprovados.',
            },
            {
              q: 'Posso cancelar minha assinatura a qualquer momento?',
              a: 'Sim, você pode cancelar sem multa ou taxa adicional. Basta acessar suas configurações.',
            },
            {
              q: 'Como funciona o pagamento?',
              a: 'Usamos Mercado Pago para processar pagamentos com segurança. Aceitamos PIX, cartão de crédito e débito.',
            },
          ].map((faq, i) => (
            <Card key={i} className="bg-white/5 border border-[#00FF00]/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">{faq.q}</h3>
              <p className="text-gray-400">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0E27]/80 border-t border-[#00FF00]/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-[#00FF00] font-bold mb-4">Planta & Raiz</h4>
              <p className="text-gray-400 text-sm">Democratizando o acesso a medicamentos à base de cannabis</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">Segurança</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Termos</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
                <li><a href="#" className="hover:text-white">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#00FF00]/20 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 Planta & Raiz. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
