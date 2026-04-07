import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, Users, Star, Download, TrendingUp, Shield } from 'lucide-react';

const HomeV2: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27] w-full overflow-x-hidden">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-[#0A0E27]/95 backdrop-blur-sm border-b border-[#00FF00]/20 w-full">
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-4 flex items-center justify-between max-w-full">
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-[#00FF00]">🌿</div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-white">Planta y Raiz</h1>
              <p className="text-xs text-gray-400">Mega Clínica Digital</p>
            </div>
          </div>

          {/* MOBILE: INICIAR CONSULTA BUTTON */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button className="sm:hidden bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold text-sm px-4 py-2 h-auto">
              Iniciar
            </Button>
            <Button className="hidden sm:flex bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold px-6 py-2">
              Iniciar Consulta
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto">
          {/* CFM-LGPD BADGE (Mobile Priority) */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield size={20} className="text-[#00FF00]" />
              <span className="px-4 py-2 rounded-full bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] text-sm font-bold">
                ✓ CFM-LGPD Certificado
              </span>
            </div>
            <div className="inline-block w-full sm:w-auto">
              <span className="px-4 py-2 rounded-full border border-[#00FF00]/30 text-[#00FF00] text-sm font-medium block sm:inline-block text-center">
                🌿 Plataforma Popular • Saúde • Shopping
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* LEFT: Text Content */}
            <div className="space-y-6 sm:space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-white">Democratizando o</span>
                <br />
                <span className="text-[#00FF00]">Acesso a Telemedicina</span>
                <span className="text-white">,</span>
                <br />
                <span className="text-yellow-400">Suprimentos</span>
                <span className="text-white"> e</span>
                <br />
                <span className="text-[#00FF00]">Medicamentos</span>
                <span className="text-white"> à Base De</span>
                <br />
                <span className="text-purple-400">Cannabis</span>
                <span className="text-white"> Em Todo</span>
                <br />
                <span className="text-yellow-400">o Mundo</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-xl">
                Conectamos pacientes a profissionais habilitados, usamos o que há de mais novo em tecnologia — inteligência artificial e teleatendimento via vídeo e chat, direto na plataforma — aliado ao Shopping de bem-estar com preços populares.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button className="bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold text-lg px-8 py-6 w-full sm:w-auto">
                  Ver Profissionais
                  <ChevronRight className="ml-2" size={20} />
                </Button>
                <Button variant="outline" className="border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00]/10 font-bold text-lg px-8 py-6 w-full sm:w-auto">
                  Abrir Shopping
                </Button>
              </div>

              <div className="pt-4">
                <Button className="bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold text-lg px-8 py-6 w-full sm:w-auto">
                  Começar agora
                </Button>
              </div>
            </div>

            {/* RIGHT: Visual - Mockup profissional */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-64 h-96 bg-gradient-to-b from-[#1a1f3a] to-[#0A0E27] rounded-3xl border-8 border-gray-800 shadow-2xl flex items-center justify-center">
                <div className="text-center space-y-4 p-6">
                  <div className="text-6xl font-bold text-[#00FF00]">✓</div>
                  <h3 className="text-[#00FF00] font-bold text-xl">Planta y Raiz</h3>
                  <p className="text-gray-300 text-sm">Mega Clínica Digital</p>
                  <p className="text-gray-400 text-xs">Consultas Seguras & Certificadas</p>
                  <Button className="w-full bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold">
                    Agendar Agora
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-12 bg-[#1a1f3a]/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: Users, label: 'Usuários Ativos', value: '45K+' },
              { icon: Star, label: 'Avaliação Média', value: '4.9★' },
              { icon: Download, label: 'Downloads App', value: '125K+' },
              { icon: TrendingUp, label: 'Projeção Anual', value: 'R$6.3M' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="mx-auto mb-3 text-[#00FF00]" size={32} />
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#00FF00]">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ECOSYSTEM SECTION */}
      <section className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 sm:mb-16">
            <span className="text-white">Ecossistema</span>
            <br />
            <span className="text-[#00FF00]">Completo</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { title: 'Telemedicina', desc: 'Chat + vídeo quando aplicável' },
              { title: 'Biblioteca', desc: 'Wiki de cepas com 100+ variedades' },
              { title: 'Shopping', desc: 'Farmácias e suplementos' },
              { title: 'Comunidade', desc: 'Rede de pacientes e profissionais' },
              { title: 'Afiliados', desc: 'Programa de renda compartilhada' },
              { title: 'Meu Painel', desc: 'Prontuário e histórico completo' },
            ].map((item, i) => (
              <Card key={i} className="bg-[#1a1f3a] border-[#00FF00]/30 p-6 hover:border-[#00FF00]/60 transition-all">
                <h3 className="text-[#00FF00] font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-300">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS SECTION */}
      <section className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-16 sm:py-20 bg-[#1a1f3a]/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 text-white">
            Siga o Passo a Passo
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { num: '1', title: 'Escolha o especialista', desc: 'Navegue por categorias e avaliações' },
              { num: '2', title: 'Pré-entrevista rápida', desc: 'Preencha formulário de 2 minutos' },
              { num: '3', title: 'Pague via Pix', desc: 'Pagamento instantâneo Mercado Pago' },
              { num: '4', title: 'Receba atendimento', desc: 'Chat ou vídeo com o profissional' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#00FF00] text-black rounded-full flex items-center justify-center font-bold text-2xl">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-300 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button className="bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold text-lg px-8 py-6">
              Quero iniciar agora
            </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16">
            <span className="text-white">De Paciente para</span>
            <br />
            <span className="text-[#00FF00]">Paciente</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { name: 'Marina', age: 29, issue: 'Sono • Rotina', quote: 'Com orientação certa, consegui organizar rotina de sono e reduzir ansiedade.' },
              { name: 'Carlos', age: 41, issue: 'Dor crônica • Mobilidade', quote: 'Passei a ter menos desconforto no dia a dia. A plataforma facilitou consulta.' },
              { name: 'Aline', age: 35, issue: 'Apetite • Bem-estar', quote: 'Com um plano acessível e acompanhamento, melhorei apetite e energia.' },
            ].map((testimonial, i) => (
              <Card key={i} className="bg-[#1a1f3a] border-[#00FF00]/30 p-6">
                <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                <p className="text-[#00FF00] font-bold">{testimonial.name}</p>
                <p className="text-gray-400 text-sm">{testimonial.age} anos • {testimonial.issue}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MARKET GROWTH SECTION */}
      <section className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-16 sm:py-20 bg-[#1a1f3a]/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12">
            <span className="text-white">Mercado em</span>
            <br />
            <span className="text-[#00FF00]">Crescimento</span>
          </h2>

          <Card className="bg-[#0A0E27] border-[#00FF00]/30 p-8 sm:p-12">
            <div className="h-64 sm:h-80 bg-gradient-to-t from-[#00FF00]/10 to-transparent rounded-lg flex items-end justify-center p-4">
              <div className="text-center text-gray-400">
                <p className="mb-2">Gráfico de Crescimento do Mercado</p>
                <p className="text-sm">2020-2028: Projeção de $0B a $80B+</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16">
            <span className="text-white">Dúvidas</span>
            <br />
            <span className="text-[#00FF00]">Frequentes</span>
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {[
              { q: 'A Planta y Raiz vende "cura"?', a: 'Não. Somos uma plataforma de telemedicina educativa.' },
              { q: 'Como funciona o pagamento via Pix?', a: 'QR code ou copia e cola. Confirmação automática via webhook.' },
              { q: 'Os profissionais são verificados?', a: 'Sim. Todos têm documentos e CRM verificados.' },
              { q: 'Posso usar sem prescrição?', a: 'Não. Prescrição é obrigatória por lei.' },
            ].map((faq, i) => (
              <Card key={i} className="bg-[#1a1f3a] border-[#00FF00]/30 p-6 hover:border-[#00FF00]/60 transition-all cursor-pointer">
                <h3 className="text-[#00FF00] font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-300">{faq.a}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <Button variant="outline" className="border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00]/10">
              Ver todas as perguntas
            </Button>
          </div>
        </div>
      </section>

      {/* CTA FINAL SECTION */}
      <section className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-16 sm:py-20 bg-gradient-to-r from-[#00FF00]/10 to-purple-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8">
            <span className="text-white">Comece sua jornada</span>
            <br />
            <span className="text-[#00FF00]">agora</span>
          </h2>

          <p className="text-lg text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto">
            Acesse profissionais habilitados, telemedicina com IA e o Shopping com preços populares. Pagamento 100% via Pix.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold text-lg px-8 py-6 w-full sm:w-auto">
              Iniciar Consulta IA
            </Button>
            <Button variant="outline" className="border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00]/10 font-bold text-lg px-8 py-6 w-full sm:w-auto">
              Cadastre-se Grátis
            </Button>
            <Button variant="outline" className="border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00]/10 font-bold text-lg px-8 py-6 w-full sm:w-auto">
              Seja Afiliado
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-12 sm:py-16 bg-[#0A0E27] border-t border-[#00FF00]/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
            <div>
              <h3 className="text-[#00FF00] font-bold mb-4">Navegação</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#00FF00]">Telemedicina</a></li>
                <li><a href="#" className="hover:text-[#00FF00]">Profissionais</a></li>
                <li><a href="#" className="hover:text-[#00FF00]">Shopping</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[#00FF00] font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#00FF00]">Termos de Serviço</a></li>
                <li><a href="#" className="hover:text-[#00FF00]">Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[#00FF00] font-bold mb-4">Contato</h3>
              <p className="text-gray-400 text-sm">📧 contato@plantayraiz.com.br</p>
              <p className="text-gray-400 text-sm">📱 +55 (11) 99136-3154</p>
            </div>
            <div>
              <h3 className="text-[#00FF00] font-bold mb-4">Localização</h3>
              <p className="text-gray-400 text-sm">São Paulo, SP — Brasil</p>
            </div>
          </div>

          <div className="border-t border-[#00FF00]/20 pt-8 text-center text-gray-400 text-sm">
            <p>© 2026 Planta y Raiz - Mega Clínica Digital. Feito com 💚 para quem mais precisa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeV2;
