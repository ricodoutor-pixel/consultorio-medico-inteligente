import React from 'react';
import { Check, X } from 'lucide-react';
import { SAAS_PLANS, PlanType } from '../services/financial';

export function PlansComparison() {
  const plans = Object.values(SAAS_PLANS);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Planos SaaS Planta & Raiz
          </h1>
          <p className="text-xl text-emerald-400">
            Escolha o plano perfeito para seu negócio
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.type === PlanType.CLINIC_FAMILY
                  ? 'ring-2 ring-cyan-500 shadow-2xl shadow-cyan-500/50 lg:col-span-1'
                  : 'bg-slate-800/50 backdrop-blur border border-slate-700'
              }`}
              style={{
                background:
                  plan.type === PlanType.CLINIC_FAMILY
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
                    : undefined,
              }}
            >
              {plan.type === PlanType.CLINIC_FAMILY && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-2 text-center text-sm font-bold">
                  MAIS POPULAR
                </div>
              )}

              <div className={`p-6 ${plan.type === PlanType.CLINIC_FAMILY ? 'pt-14' : ''}`}>
                {/* Plan Name */}
                <h3 className="text-xl font-bold text-white mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-emerald-400">
                    R$ {plan.monthlyPrice}
                  </span>
                  <span className="text-slate-400 text-sm">/mês</span>
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-2 px-4 rounded-lg font-semibold mb-6 transition-all duration-300 ${
                    plan.type === PlanType.CLINIC_FAMILY
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/50'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  Assinar Agora
                </button>

                {/* Benefits */}
                <div className="space-y-3">
                  {plan.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Tax Info */}
                <div className="mt-6 pt-6 border-t border-slate-700 space-y-2 text-xs text-slate-400">
                  {plan.adminFeeExempt && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Isento de taxa admin</span>
                    </div>
                  )}
                  {plan.withdrawalFeeExempt && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Isento de taxa saque</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-6 py-4 text-left text-white font-semibold">
                  Recurso
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    className="px-6 py-4 text-center text-white font-semibold text-sm"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="px-6 py-4 text-slate-300">Preço Mensal</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center text-emerald-400 font-semibold">
                    R$ {plan.monthlyPrice}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="px-6 py-4 text-slate-300">Taxa de Administração</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.adminFeeExempt ? (
                      <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-slate-400">5%</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="px-6 py-4 text-slate-300">Taxa de Saque</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.withdrawalFeeExempt ? (
                      <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-slate-400">5%</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="px-6 py-4 text-slate-300">Suporte Prioritário</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.type === PlanType.CLINIC_FAMILY ? (
                      <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-slate-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-700/30">
                <td className="px-6 py-4 text-slate-300">Múltiplos Perfis</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.type === PlanType.CLINIC_FAMILY ? (
                      <span className="text-emerald-400">5 perfis</span>
                    ) : (
                      <span className="text-slate-400">1 perfil</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 mb-4">
            Todos os planos incluem acesso aos 4 agentes IA:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Enfermeira Brisa
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Manus CEO
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Guardião ANVISA
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Verdinho
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
