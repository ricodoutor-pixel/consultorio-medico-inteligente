import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowRight, Leaf, Zap, Users, Shield, TrendingUp, Heart } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-emerald-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Planta & Raiz
            </span>
          </div>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/plans")}
              className="text-slate-300 hover:text-white"
            >
              Planos
            </Button>
            {isAuthenticated ? (
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
              >
                Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Saúde Inteligente
              </span>
              <br />
              <span className="text-white">para Todos</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              A plataforma que conecta pacientes, médicos e farmácias com tecnologia IA avançada. Triagem clínica automática, gestão financeira inteligente e sistema de afiliados multinível.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8"
              >
                Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/plans")}
                className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10"
              >
                Ver Planos
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            {[
              {
                icon: Heart,
                title: "Triagem Clínica IA",
                description: "Enfermeira Brisa analisa seus sintomas e conecta você com o profissional ideal",
              },
              {
                icon: TrendingUp,
                title: "Gestão Financeira",
                description: "Manus CEO automatiza pagamentos, comissões e divisão de receita em tempo real",
              },
              {
                icon: Shield,
                title: "Compliance ANVISA",
                description: "Guardião ANVISA valida receitas e garante conformidade regulatória automática",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300"
                >
                  <CardContent className="pt-6">
                    <Icon className="w-12 h-12 text-emerald-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section className="py-20 px-4 bg-slate-800/30 border-y border-slate-700/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Seus Agentes IA Pessoais
            </span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: "Enfermeira Brisa",
                role: "Triagem & Matching",
                description: "Realiza triagem clínica, matching geográfico com profissionais, pós-venda automatizado e Smart-Refill para recompra de medicamentos",
                features: ["Triagem 24/7", "Matching inteligente", "Pós-venda D+7/D+30", "Smart-Refill automático"],
              },
              {
                name: "Manus CEO",
                role: "CFO Inteligente",
                description: "Gerencia toda a financeira: pagamentos, cobrança de assinaturas, divisão automática de comissões em 3 níveis",
                features: ["Automação de pagamentos", "Divisão de comissões", "Relatórios financeiros", "Gestão de fluxo de caixa"],
              },
              {
                name: "Guardião ANVISA",
                role: "Compliance & Auditoria",
                description: "Auditoria OCR de receitas conforme RDC 660, validação de CRM médico e conformidade de laudos de produtos",
                features: ["OCR de receitas", "Validação CRM", "Conformidade de laudos", "Relatórios regulatórios"],
              },
              {
                name: "Verdinho",
                role: "Concierge & Suporte",
                description: "Concierge do shopping, suporte técnico 24/7 e gestão logística integrada para melhor experiência",
                features: ["Suporte 24/7", "Gestão logística", "Concierge service", "Resolução rápida"],
              },
            ].map((agent, idx) => (
              <Card
                key={idx}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{agent.name}</h3>
                  <p className="text-emerald-400 font-semibold mb-4">{agent.role}</p>
                  <p className="text-slate-300 mb-6">{agent.description}</p>
                  <div className="space-y-2">
                    {agent.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-center gap-2 text-slate-300">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Affiliate Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Ganhe com Afiliados
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-12">
            Indique usuários e ganhe comissões automáticas em 3 níveis
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { level: "Nível 1", rate: "50%", desc: "Referências diretas" },
              { level: "Nível 2", rate: "5%", desc: "Referências do seu nível 1" },
              { level: "Nível 3", rate: "2%", desc: "Referências do seu nível 2" },
            ].map((item, idx) => (
              <Card
                key={idx}
                className="bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300"
              >
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-400 mb-2">{item.level}</p>
                  <p className="text-4xl font-bold text-emerald-400 mb-2">{item.rate}</p>
                  <p className="text-slate-300">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            size="lg"
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
          >
            Ativar Programa de Afiliados
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-y border-emerald-500/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Pronto para Transformar Sua Saúde?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Junte-se a milhares de usuários que já estão usando a Planta & Raiz
          </p>
          <Button
            size="lg"
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-white text-emerald-600 hover:bg-slate-100 font-semibold px-8"
          >
            Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {[
              {
                title: "Produto",
                links: ["Planos", "Recursos", "Segurança", "Status"],
              },
              {
                title: "Empresa",
                links: ["Sobre", "Blog", "Carreiras", "Contato"],
              },
              {
                title: "Legal",
                links: ["Privacidade", "Termos", "Cookies", "Compliance"],
              },
              {
                title: "Suporte",
                links: ["Central de Ajuda", "Documentação", "Comunidade", "Chat"],
              },
            ].map((col, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, lidx) => (
                    <li key={lidx}>
                      <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800/50 pt-8 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-emerald-400" />
              <span className="font-bold text-white">Planta & Raiz 2026-2030</span>
            </div>
            <p className="text-slate-400 text-sm">© 2026 Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
