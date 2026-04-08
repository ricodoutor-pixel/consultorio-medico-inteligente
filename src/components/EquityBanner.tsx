import React, { useState } from "react";
import { Globe, Shield, X, ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

interface EquityBannerProps {
  className?: string;
}

export default function EquityBanner({ className = "" }: EquityBannerProps) {
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  return (
    <>
      {/* Banner de Equidade */}
      <div
        className={`w-full bg-gradient-to-r from-green-50 to-emerald-50 border-t-4 border-green-500 py-8 px-4 md:px-8 ${className}`}
      >
        <div className="max-w-6xl mx-auto">
          {/* Título */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Referência No Tratamento Com Cannabis Medicinal No Brasil
          </h2>

          {/* Conteúdo Principal */}
          <div className="space-y-4">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              A <span className="font-bold text-green-600">Planta & Raiz</span> está promovendo a{" "}
              <span className="font-bold">equidade</span> e realmente democratizando o acesso ao
              tratamento canabinoide oferecendo{" "}
              <span className="font-bold text-green-600">consultas com especialistas por apenas R$30</span>.
            </p>

            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              Venha você também fazer parte de{" "}
              <span className="font-bold">milhões de pessoas que mudaram a sua qualidade de vida!</span>
            </p>

            {/* CTAs Mobile Only - Iniciar Consulta + Abrir Shopping */}
            <div className="flex flex-col gap-3 mt-4 md:hidden">
              <Link
                to="/profissionais"
                className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-lg shadow-primary/20 text-base transition-all hover:scale-105 active:scale-95"
              >
                🎯 Iniciar Consulta <ArrowRight size={20} />
              </Link>
              <Link
                to="/shopping"
                className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-primary text-primary font-black rounded-2xl text-base transition-all hover:scale-105 active:scale-95 bg-white"
              >
                🛍️ Abrir Shopping <ShoppingBag size={18} />
              </Link>
            </div>

            {/* Selo de Conformidade e CTA */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-6 pt-4 border-t border-green-200">
              {/* Selo CFM + LGPD */}
              <button
                onClick={() => setShowComplianceModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-green-500 rounded-lg hover:bg-green-50 transition cursor-pointer group"
              >
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-bold text-gray-900">CFM 2314 + LGPD</span>
                <Globe className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition" />
              </button>

              {/* CTA Principal */}
              <a
                href="https://wa.me/5511991363154?text=Olá%20enfermeira%20Brisa%20gostaria%20de%20agendar%20uma%20consulta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition text-center"
              >
                Agendar Consulta Agora
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-green-200">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600">+50K</div>
                <div className="text-xs md:text-sm text-gray-600">Pacientes Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600">98%</div>
                <div className="text-xs md:text-sm text-gray-600">Satisfação</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600">24/7</div>
                <div className="text-xs md:text-sm text-gray-600">Atendimento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600">R$30</div>
                <div className="text-xs md:text-sm text-gray-600">Primeira Consulta</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Conformidade Legal */}
      {showComplianceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-green-600 text-white p-6 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                <h3 className="text-xl font-bold">Conformidade Legal</h3>
              </div>
              <button
                onClick={() => setShowComplianceModal(false)}
                className="p-1 hover:bg-green-700 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* CFM 2314 */}
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-bold text-gray-900 mb-2">📋 Resolução CFM 2314/2022</h4>
                <p className="text-sm text-gray-700">
                  A Planta & Raiz segue rigorosamente a Resolução CFM 2314/2022, que regulamenta o uso
                  medicinal da cannabis no Brasil. Todos os nossos especialistas são credenciados e
                  autorizados pelo Conselho Federal de Medicina.
                </p>
              </div>

              {/* LGPD */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-bold text-gray-900 mb-2">🔒 Lei Geral de Proteção de Dados (LGPD)</h4>
                <p className="text-sm text-gray-700">
                  Seus dados pessoais e de saúde são protegidos conforme a LGPD (Lei 13.709/2018).
                  Utilizamos criptografia de ponta a ponta e nunca compartilhamos informações com
                  terceiros sem seu consentimento explícito.
                </p>
              </div>

              {/* Segurança */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-bold text-gray-900 mb-2">🛡️ Segurança de Dados</h4>
                <p className="text-sm text-gray-700">
                  Implementamos as melhores práticas de segurança da indústria, incluindo:
                </p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4">
                  <li>✓ Criptografia AES-256</li>
                  <li>✓ Autenticação de dois fatores</li>
                  <li>✓ Auditoria de acesso contínua</li>
                  <li>✓ Backup automático diário</li>
                </ul>
              </div>

              {/* Privacidade */}
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-bold text-gray-900 mb-2">👤 Privacidade</h4>
                <p className="text-sm text-gray-700">
                  Você tem o direito de:
                </p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4">
                  <li>✓ Acessar seus dados pessoais</li>
                  <li>✓ Corrigir informações incorretas</li>
                  <li>✓ Solicitar exclusão de dados</li>
                  <li>✓ Revogar consentimento a qualquer momento</li>
                </ul>
              </div>

              {/* Contato */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Dúvidas sobre conformidade?</span>
                  <br />
                  Entre em contato: <a href="mailto:compliance@plantayraiz.com.br"
                    className="text-green-600 hover:underline">
                    compliance@plantayraiz.com.br
                  </a>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t flex gap-3">
              <button
                onClick={() => setShowComplianceModal(false)}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
              >
                Entendi
              </button>
              <a
                href="/privacy-policy"
                className="flex-1 px-4 py-2 border-2 border-green-600 text-green-600 font-bold rounded-lg hover:bg-green-50 transition text-center"
              >
                Política de Privacidade
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
