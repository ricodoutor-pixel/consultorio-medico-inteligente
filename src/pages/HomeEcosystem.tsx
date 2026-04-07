import React, { useState } from "react";
import { ArrowRight, Users, ShoppingBag, Heart, TrendingUp, Award, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import BLISS_COLORS from "@/styles/bliss-colors";

export default function HomeEcosystem() {
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${BLISS_COLORS.primary[500]} 0%, ${BLISS_COLORS.primary[700]} 100%)`
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-4">
              Planta & Raiz
            </h1>
            <p className="text-2xl text-white/90 font-light mb-2">
              Democratizando o acesso a medicamentos à base de cannabis
            </p>
          </div>

          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed">
            Conectamos pacientes a profissionais habilitados. Consulta, receita digital, compra segura e entrega em todo Brasil.
            Tudo em uma plataforma. Tudo legalizado. Tudo com preços irresistíveis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation("/specialists")}
              className="px-8 py-3 bg-white text-green-600 font-bold rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              Encontrar Especialista <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setLocation("/marketplace")}
              className="px-8 py-3 bg-white/20 text-white border-2 border-white font-bold rounded-lg hover:bg-white/30 transition flex items-center justify-center gap-2"
            >
              Explorar Marketplace <ShoppingBag className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-white">
              <div className="text-4xl font-bold">15+</div>
              <div className="text-sm text-white/80">Especialistas</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold">15</div>
              <div className="text-sm text-white/80">Produtos</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold">100%</div>
              <div className="text-sm text-white/80">Legalizado</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: BLISS_COLORS.primary[700] }}>
            Como Funciona
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                number: "1",
                title: "Escolha",
                description: "Escolha um especialista entre diversos profissionais verificados",
                icon: "👨‍⚕️"
              },
              {
                number: "2",
                title: "Consulta",
                description: "Faça pré-entrevista e consulta via chat ou vídeo na plataforma",
                icon: "💬"
              },
              {
                number: "3",
                title: "Receita",
                description: "Receba receita digital assinada e autorizada pela ANVISA",
                icon: "📋"
              },
              {
                number: "4",
                title: "Compra",
                description: "Compre em farmácias autorizadas com frete grátis para todo Brasil",
                icon: "🛒"
              }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div
                  className="p-6 rounded-lg text-center h-full"
                  style={{ backgroundColor: BLISS_COLORS.primary[50] }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
                    style={{ backgroundColor: BLISS_COLORS.primary[500] }}
                  >
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: BLISS_COLORS.primary[700] }}>
                    {step.number}. {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8" style={{ color: BLISS_COLORS.primary[500] }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem Pillars */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: BLISS_COLORS.primary[700] }}>
            Nossos Pilares
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-10 h-10" />,
                title: "Pacientes",
                description: "Acesso fácil e seguro a especialistas verificados. Consultas acessíveis de R$30 a R$150.",
                color: BLISS_COLORS.primary[500]
              },
              {
                icon: <Heart className="w-10 h-10" />,
                title: "Especialistas",
                description: "Plataforma para atender pacientes globalmente. Receba via PIX com apenas 10% de comissão.",
                color: BLISS_COLORS.primary[500]
              },
              {
                icon: <ShoppingBag className="w-10 h-10" />,
                title: "Marketplace",
                description: "Farmácias e produtores legalizados. Venda seus produtos com 10% de comissão.",
                color: BLISS_COLORS.primary[500]
              }
            ].map((pillar, idx) => (
              <div
                key={idx}
                className="p-8 rounded-lg border-2 hover:shadow-lg transition"
                style={{ borderColor: BLISS_COLORS.primary[200], backgroundColor: BLISS_COLORS.primary[50] }}
              >
                <div style={{ color: pillar.color }} className="mb-4">
                  {pillar.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: BLISS_COLORS.primary[700] }}>
                  {pillar.title}
                </h3>
                <p className="text-gray-600">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: BLISS_COLORS.primary[700] }}>
            Recursos Premium
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <Lock className="w-8 h-8" />,
                title: "100% Seguro e Legalizado",
                description: "Todos os produtos autorizados pela ANVISA. Dados criptografados. Privacidade garantida."
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Processo Rápido",
                description: "Consulta em minutos. Receita digital em segundos. Entrega em 2-3 dias úteis."
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Preços Irresistíveis",
                description: "Frete grátis para todo Brasil. Descontos exclusivos. Programa de fidelidade."
              },
              {
                icon: <Award className="w-8 h-8" />,
                title: "Especialistas Verificados",
                description: "CRM/CRMV validados. Avaliações reais. Histórico de consultas transparente."
              }
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4">
                <div style={{ color: BLISS_COLORS.primary[500] }} className="flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: BLISS_COLORS.primary[700] }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Program */}
      <section className="py-20 px-4" style={{ backgroundColor: BLISS_COLORS.primary[50] }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6" style={{ color: BLISS_COLORS.primary[700] }}>
            Sistema de Indicação Premiada
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Indique pacientes, especialistas ou farmácias e ganhe comissões recorrentes. Forme seu próprio ecossistema de saúde.
          </p>
          <Button
            onClick={() => setLocation("/referral")}
            className="px-8 py-3 font-bold rounded-lg flex items-center justify-center gap-2 mx-auto"
            style={{ backgroundColor: BLISS_COLORS.primary[500], color: "white" }}
          >
            Saiba Mais <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6" style={{ color: BLISS_COLORS.primary[700] }}>
            Pronto para Começar?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Junte-se a milhares de pacientes que já encontraram alívio e bem-estar através da Planta & Raiz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation("/specialists")}
              className="px-8 py-3 font-bold rounded-lg flex items-center justify-center gap-2"
              style={{ backgroundColor: BLISS_COLORS.primary[500], color: "white" }}
            >
              Encontrar Especialista <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setLocation("/marketplace")}
              className="px-8 py-3 font-bold rounded-lg border-2 flex items-center justify-center gap-2"
              style={{ borderColor: BLISS_COLORS.primary[500], color: BLISS_COLORS.primary[500] }}
            >
              Explorar Produtos <ShoppingBag className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Planta & Raiz</h3>
              <p className="text-gray-400">Democratizando o acesso a medicamentos à base de cannabis.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Especialistas</a></li>
                <li><a href="#" className="hover:text-white transition">Marketplace</a></li>
                <li><a href="#" className="hover:text-white transition">Sobre</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Termos</a></li>
                <li><a href="#" className="hover:text-white transition">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition">LGPD</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400">
                <li>contato@plantaeraiz.com.br</li>
                <li>(11) 9999-9999</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Planta & Raiz. Todos os direitos reservados. Autorizado pela ANVISA.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
