import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

const plansData = [
  {
    slug: "usuario",
    name: "Usuário",
    price: 29,
    description: "Perfeito para pacientes individuais",
    benefits: [
      { feature: "Acesso ao marketplace", included: true },
      { feature: "Isenção de taxa no checkout", included: true },
      { feature: "Prioridade de triagem", included: true },
      { feature: "Suporte por chat", included: true },
      { feature: "Histórico de compras", included: true },
      { feature: "Recomendações personalizadas", included: false },
      { feature: "Acesso a relatórios", included: false },
    ],
    cta: "Começar Agora",
    highlighted: false,
  },
  {
    slug: "lojista-pro",
    name: "Lojista Pro",
    price: 49,
    description: "Para farmácias e lojas de saúde",
    benefits: [
      { feature: "Acesso ao marketplace", included: true },
      { feature: "Taxa de venda 0%", included: true },
      { feature: "Destaque nas recomendações", included: true },
      { feature: "Dashboard de vendas", included: true },
      { feature: "Suporte prioritário", included: true },
      { feature: "Integração de estoque", included: true },
      { feature: "Relatórios de mercado", included: false },
    ],
    cta: "Ativar Plano",
    highlighted: false,
  },
  {
    slug: "medico-vip",
    name: "Médico VIP",
    price: 99,
    description: "Para profissionais de saúde",
    benefits: [
      { feature: "100% do valor da consulta", included: true },
      { feature: "Selo de verificação", included: true },
      { feature: "Perfil destacado", included: true },
      { feature: "Agendamento integrado", included: true },
      { feature: "Histórico de pacientes", included: true },
      { feature: "Prescrição digital", included: true },
      { feature: "Análise de desempenho", included: true },
    ],
    cta: "Ativar Plano",
    highlighted: true,
  },
  {
    slug: "empresa-parceiros",
    name: "Empresa/Parceiros",
    price: 149,
    description: "Para empresas e instituições",
    benefits: [
      { feature: "Banners publicitários", included: true },
      { feature: "Relatórios de mercado", included: true },
      { feature: "Análise de concorrência", included: true },
      { feature: "API de integração", included: true },
      { feature: "Suporte dedicado", included: true },
      { feature: "Múltiplos usuários", included: true },
      { feature: "Customização de marca", included: true },
    ],
    cta: "Contratar",
    highlighted: false,
  },
  {
    slug: "clinica-familia",
    name: "Clínica Família",
    price: 195,
    description: "Solução completa para clínicas",
    benefits: [
      { feature: "Todos os benefícios", included: true },
      { feature: "5 perfis de usuários", included: true },
      { feature: "Isenção de taxa de saque", included: true },
      { feature: "Gestão de pacientes", included: true },
      { feature: "Prontuário eletrônico", included: true },
      { feature: "Integração com farmácias", included: true },
      { feature: "Suporte 24/7", included: true },
    ],
    cta: "Solicitar Demo",
    highlighted: false,
  },
];

export default function Plans() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: plans } = trpc.plans.list.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Planos para Todos
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Escolha o plano ideal para seu perfil e comece a crescer com a Planta & Raiz
          </p>
          <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 rounded-full px-6 py-2">
            <span className="text-emerald-300 text-sm font-semibold">Sem compromisso • Cancele quando quiser</span>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {plansData.map((plan) => (
              <div
                key={plan.slug}
                className={`relative group transition-all duration-300 ${
                  plan.highlighted ? "lg:col-span-1 lg:scale-105" : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
                )}
                <Card
                  className={`relative h-full border-2 transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-b from-slate-800 to-slate-900 border-emerald-500/50 shadow-2xl"
                      : "bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30"
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500">
                      Mais Popular
                    </Badge>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">R${plan.price}</span>
                      <span className="text-slate-400 ml-2">/mês</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <Button
                      className={`w-full transition-all duration-300 ${
                        plan.highlighted
                          ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                          : "bg-slate-700 hover:bg-emerald-600 text-white"
                      }`}
                      onClick={() => {
                        if (!isAuthenticated) {
                          window.location.href = getLoginUrl();
                        } else {
                          setLocation(`/checkout/${plan.slug}`);
                        }
                      }}
                    >
                      {plan.cta}
                    </Button>

                    <div className="space-y-3">
                      {plan.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          {benefit.included ? (
                            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-sm ${
                              benefit.included ? "text-slate-200" : "text-slate-500 line-through"
                            }`}
                          >
                            {benefit.feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-800/30 border-t border-slate-700/50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">Perguntas Frequentes</h2>
          <div className="space-y-6">
            {[
              {
                q: "Posso mudar de plano a qualquer momento?",
                a: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações entram em vigor no próximo ciclo de cobrança.",
              },
              {
                q: "Há período de teste gratuito?",
                a: "Oferecemos 7 dias de teste gratuito para todos os planos. Nenhum cartão de crédito é necessário.",
              },
              {
                q: "Como funciona o sistema de afiliados?",
                a: "Ganhe comissões ao indicar novos usuários: 50% no nível 1, 5% no nível 2 e 2% no nível 3.",
              },
              {
                q: "Qual é a política de reembolso?",
                a: "Oferecemos reembolso total em até 30 dias se você não estiver satisfeito com o serviço.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-2">{item.q}</h3>
                <p className="text-slate-300">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
