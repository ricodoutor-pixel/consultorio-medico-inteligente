import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, ShieldCheck, TrendingUp, Clock, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function ConviteMedico() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200">
      <Helmet>
        <title>Convite Exclusivo - Sócio Prescritor Planta y Raíz</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white pt-24 pb-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160550-2173ff9e5eb3?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 text-sm font-semibold tracking-wide uppercase mb-8 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Vagas Limitadas para Sócios Prescritores
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Recupere sua <span className="text-emerald-400">Autonomia</span> e Multiplique seu <span className="text-emerald-400">Faturamento</span>
            </h1>
            
            <p className="text-lg md:text-xl text-emerald-100/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Junte-se à Planta y Raíz como Médico Sócio Prescritor. A única plataforma de telemedicina canabinoide do Brasil com taxa de apenas 7% e repasse financeiro instantâneo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 bg-emerald-500 hover:bg-emerald-400 text-white text-lg font-bold rounded-xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] transition-all hover:scale-105">
                <Link to="/cadastro-profissional">
                  Cadastre-se Agora <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm text-emerald-200/70 sm:hidden">Leva menos de 2 minutos. 100% gratuito.</p>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,119.21,189.65,108.6Z" className="fill-slate-50"></path>
          </svg>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">O Mercado Tradicional Suga Seus Lucros</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Entendemos a sua frustração com plataformas que cobram comissões abusivas e demoram meses para repassar o valor da sua consulta.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 transform rotate-180" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Taxas Abusivas</h3>
              <p className="text-slate-600">Plataformas tradicionais cobram entre 20% a 45% do valor da sua consulta. Isso é insustentável para o seu crescimento profissional.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Repasse Lento</h3>
              <p className="text-slate-600">Você atende hoje e recebe daqui a 30 ou 60 dias. Seu fluxo de caixa fica comprometido enquanto eles lucram com o seu dinheiro.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-6">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Tabela Engessada</h3>
              <p className="text-slate-600">Eles ditam quanto vale a sua consulta médica. Você não tem controle sobre a precificação do seu próprio conhecimento e especialidade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 max-w-6xl mx-auto">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">A Solução: Seja Sócio Prescritor</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                A Planta y Raíz foi desenvolvida por médicos, para médicos. Nós invertemos a lógica do mercado para garantir que a maior fatia do lucro fique com quem realmente importa: <strong className="text-emerald-700">você</strong>.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Taxa justa de apenas 7% por atendimento.",
                  "Repasse via PIX imediato após a consulta.",
                  "Liberdade total para definir o preço da sua consulta.",
                  "Inteligência Artificial Integrada para apoio diagnóstico.",
                  "Consultório digital completo e criptografado (HIPAA compliance).",
                  "Sem mensalidades, anuidades ou taxas escondidas."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-50 transform rotate-3 rounded-3xl -z-10"></div>
              <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl relative z-10">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Potencial de Ganhos</h3>
                    <p className="text-emerald-600 font-medium">Transparência Total</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-semibold text-slate-500 mb-2">
                      <span>Plataformas Tradicionais</span>
                      <span>Seu repasse: ~60%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div className="bg-slate-400 h-3 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm font-semibold text-emerald-700 mb-2">
                      <span>Planta y Raíz</span>
                      <span>Seu repasse: 93%</span>
                    </div>
                    <div className="w-full bg-emerald-100 rounded-full h-4">
                      <div className="bg-emerald-500 h-4 rounded-full relative" style={{ width: '93%' }}>
                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 rounded-r-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <p className="text-sm text-slate-600 text-center">
                    Simulação: Atendendo 10 pacientes por dia a R$ 200,00, você fatura <strong>R$ 37.200,00 líquidos</strong> por mês trabalhando de onde quiser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-900/20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Pronto para transformar sua carreira médica?</h2>
            <p className="text-xl text-slate-300 mb-10">Junte-se à revolução da medicina canabinoide no Brasil. O cadastro é rápido e a ativação da sua clínica digital é imediata.</p>
            <Button asChild size="lg" className="h-16 px-10 bg-emerald-500 hover:bg-emerald-400 text-white text-xl font-bold rounded-xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] transition-all hover:scale-105">
              <Link to="/cadastro-profissional">
                Quero ser Sócio Prescritor <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
