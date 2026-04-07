import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, CheckCircle2, Users, ShoppingBag, BookOpen, Lock, TrendingUp, MessageSquare, Video, FileText } from 'lucide-react';

export default function HomePremiumHub() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const steps = [
    {
      number: 1,
      title: 'Escolha o especialista',
      description: 'Navegue por categorias, veja avaliações, preços populares e perfis verificados.',
      icon: '👨‍⚕️',
    },
    {
      number: 2,
      title: 'Pré-entrevista rápida',
      description: 'Preencha um formulário de 2 minutos com seu objetivo e resumo do caso.',
      icon: '📋',
    },
    {
      number: 3,
      title: 'Pague via Pix',
      description: 'Pagamento instantâneo com QR code Mercado Pago. Confirmação automática.',
      icon: '💳',
    },
    {
      number: 4,
      title: 'Receba atendimento',
      description: 'O profissional recebe seu resumo e inicia o atendimento (chat ou vídeo).',
      icon: '💬',
    },
  ];

  const testimonials = [
    {
      name: 'Marina',
      age: 29,
      condition: 'Sono • Rotina',
      quote: 'Com orientação certa, consegui organizar rotina de sono e reduzir ansiedade. O acompanhamento foi essencial.',
      emoji: '👩',
    },
    {
      name: 'Carlos',
      age: 41,
      condition: 'Dor crônica • Mobilidade',
      quote: 'Passei a ter menos desconforto no dia a dia. A plataforma facilitou consulta e orientação com preço justo.',
      emoji: '👨',
    },
    {
      name: 'Aline',
      age: 35,
      condition: 'Apetite • Bem-estar',
      quote: 'Com um plano acessível e acompanhamento, melhorei apetite e energia. Tudo pelo celular.',
      emoji: '👩',
    },
    {
      name: 'Rafa',
      age: 26,
      condition: 'Foco • Estresse',
      quote: 'A triagem e a consulta rápida ajudaram a ajustar hábitos. Tudo ficou mais simples e acessível.',
      emoji: '👨',
    },
    {
      name: 'Joana',
      age: 52,
      condition: 'Qualidade de vida',
      quote: 'O suporte e os preços populares fizeram diferença. Mais clareza e menos insegurança no tratamento.',
      emoji: '👩',
    },
  ];

  const ecosystem = [
    {
      icon: <Video className="h-8 w-8 text-green-400" />,
      title: 'Teleatendimento',
      description: 'Chat + vídeo quando aplicável. Prontuário, anexos e recibos.',
    },
    {
      icon: <ShoppingBag className="h-8 w-8 text-green-400" />,
      title: 'Shopping Multi-vendor',
      description: 'Lojas, farmácias e suplementos. Checkout Pix com preços populares.',
    },
    {
      icon: <Users className="h-8 w-8 text-green-400" />,
      title: 'Profissionais Verificados',
      description: 'Documentos, especialidades, avaliações e ranking público.',
    },
    {
      icon: <Lock className="h-8 w-8 text-green-400" />,
      title: 'Segurança & LGPD',
      description: 'Dados protegidos, consentimentos e auditoria completa.',
    },
    {
      icon: <Badge className="h-8 w-8 text-green-400" />,
      title: 'Assinatura Popular',
      description: 'Planos acessíveis com descontos, suporte e benefícios exclusivos.',
    },
    {
      icon: <FileText className="h-8 w-8 text-green-400" />,
      title: 'Pix Mercado Pago',
      description: 'QR code, copia e cola. Confirmação automática via webhook.',
    },
  ];

  const faqs = [
    {
      question: 'A Planta & Raiz vende "cura" ou faz promessa de resultado?',
      answer: 'Não. Somos uma plataforma educativa. Prescrição e conduta clínica dependem de avaliação individual por profissional habilitado.',
    },
    {
      question: 'Como funciona o pagamento via Pix?',
      answer: 'Você recebe um QR code ou código copia-e-cola. O pagamento é processado pelo Mercado Pago com confirmação automática via webhook.',
    },
    {
      question: 'Os profissionais são verificados?',
      answer: 'Sim. Todos os profissionais passam por verificação de documentos, especialidades e avaliações de pacientes.',
    },
    {
      question: 'Posso usar a plataforma sem prescrição?',
      answer: 'A avaliação é feita exclusivamente por profissionais habilitados. Eles determinam a necessidade de prescrição.',
    },
    {
      question: 'O que é o Shopping?',
      answer: 'É um marketplace multi-vendor com farmácias, produtores e suplementos autorizados pela ANVISA, com preços populares e frete grátis.',
    },
    {
      question: 'A plataforma é defensável legalmente?',
      answer: 'Sim. Operamos conforme RDC 327/2019 da ANVISA, com conformidade legal completa e LGPD.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-green-500/20 text-green-400 w-fit">PLATAFORMA POPULAR • SAÚDE • SHOPPING</Badge>
              
              <h1 className="text-5xl md:text-6xl font-black leading-tight">
                Democratizando o acesso a <span className="text-green-400">medicamentos à base de cannabis</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Conectamos pacientes a profissionais habilitados, usamos o que há de mais novo em tecnologia — inteligência artificial e teleatendimento via vídeo e chat, direto na plataforma — aliado ao Shopping de bem-estar com preços populares.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-8 py-6">
                  Ver Profissionais
                </Button>
                <Button className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg px-8 py-6">
                  Abrir Shopping
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="text-sm">Preços populares</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="text-sm">Pix Mercado Pago</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="text-sm">Teleatendimento</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="text-sm">Shopping multi-vendor</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-green-500/20 to-purple-500/20 rounded-2xl p-8 border border-green-500/30">
                <div className="text-6xl mb-4">📱</div>
                <p className="text-sm text-muted-foreground mb-4">Aplicativo mobile disponível em breve</p>
                <div className="space-y-3">
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
                    <p className="text-sm font-semibold text-green-400">✓ Reclaiar</p>
                    <p className="text-xs text-muted-foreground">Receber uma consulta</p>
                  </div>
                  <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-500/30">
                    <p className="text-sm font-semibold text-purple-400">✓ Kedazo</p>
                    <p className="text-xs text-muted-foreground">Escolher especialista diferente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="px-6 py-20 bg-background/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black">SIGA O PASSO A PASSO</h2>
            <p className="text-muted-foreground">Processo simples e seguro em 4 etapas</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <Card className="bg-card/50 border-green-500/20 rounded-2xl h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-4xl">{step.icon}</div>
                      <div className="text-3xl font-black text-green-400">{step.number}</div>
                    </div>
                    <h3 className="font-bold text-lg">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-green-500/30" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <Button className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-8 py-6">
              Quero iniciar agora
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              ⚠️ A avaliação é feita exclusivamente por profissionais habilitados.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black">DE PACIENTE PARA PACIENTE</h2>
            <p className="text-muted-foreground">Histórias reais de transformação</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card/50 border-green-500/20 rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="text-4xl">{testimonial.emoji}</div>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.age} anos • {testimonial.condition}</p>
                  </div>
                  <p className="text-sm italic text-muted-foreground">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            * Nomes e fotos ilustrativos. Em produção, admin troca por depoimentos reais com consentimento.
          </p>
        </div>
      </section>

      {/* Market Graph Section */}
      <section className="px-6 py-20 bg-background/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-400" />
              Mercado em Crescimento
            </h2>
            <p className="text-muted-foreground">Projeções públicas indicam forte expansão do setor legal de cannabis medicinal globalmente.</p>
          </div>

          <Card className="bg-card/50 border-green-500/20 rounded-2xl p-8">
            <div className="h-64 flex items-end justify-around gap-2">
              {[20, 35, 45, 55, 65, 72, 78, 82, 85].map((height, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t" style={{ height: `${height}%` }} />
                  <span className="text-xs text-muted-foreground">202{index}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-8">
              * Gráfico ilustrativo com base em projeções públicas (Grand View Research, Fortune Business Insights).
            </p>
          </Card>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black">Ecossistema Completo</h2>
            <p className="text-muted-foreground">Tudo que você precisa em um só lugar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ecosystem.map((item, index) => (
              <Card key={index} className="bg-card/50 border-green-500/20 rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div>{item.icon}</div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-20 bg-background/50">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black">Dúvidas Frequentes</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="bg-card/50 border-green-500/20 rounded-2xl cursor-pointer hover:border-green-500/50 transition-all"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-lg flex-1">{faq.question}</h3>
                    <ChevronDown
                      className={`h-5 w-5 text-green-400 flex-shrink-0 transition-transform ${
                        expandedFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {expandedFaq === index && (
                    <p className="text-muted-foreground mt-4">{faq.answer}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button className="text-green-400 hover:text-green-300">Ver todas as perguntas</Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black">Comece sua jornada agora</h2>
            <p className="text-lg text-muted-foreground">
              Acesse profissionais habilitados e o Shopping com preços populares. Pagamento 100% via Pix.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-8 py-6">
              Falar com Especialista
            </Button>
            <Button className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg px-8 py-6">
              Ver Planos
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ Conteúdo educativo. Prescrição e conduta clínica dependem de avaliação individual por profissional habilitado.
          </p>
        </div>
      </section>
    </div>
  );
}
