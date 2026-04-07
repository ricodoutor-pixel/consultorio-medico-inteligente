import React, { useState } from "react";
import { ChevronDown, Shield, FileText, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * AGENTE 4 - JURÍDICO
 * Legal & Compliance Page
 * Conformidade ANVISA, LGPD, PCI-DSS, termos de serviço
 */

interface ComplianceSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  details: string[];
  status: "compliant" | "in-progress" | "pending";
}

export default function LegalCompliance() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const complianceSections: ComplianceSection[] = [
    {
      id: "anvisa",
      title: "Conformidade ANVISA",
      icon: <Shield className="w-6 h-6" />,
      content: "Planta & Raiz está em conformidade total com as regulações da ANVISA para prescrição digital de medicamentos à base de cannabis.",
      details: [
        "✅ Receita digital com assinatura eletrônica (ICP-Brasil)",
        "✅ Validação automática de CRM/CRMV de especialistas",
        "✅ Prescrição de medicamentos autorizados pela ANVISA",
        "✅ Rastreamento de medicamentos controlados",
        "✅ Relatórios periódicos à ANVISA",
        "✅ Armazenamento seguro de receitas por 5 anos",
        "✅ Integração com sistema de notificação de receita",
      ],
      status: "compliant",
    },
    {
      id: "lgpd",
      title: "Lei Geral de Proteção de Dados (LGPD)",
      icon: <Lock className="w-6 h-6" />,
      content: "Todos os dados pessoais são protegidos conforme a Lei 13.709/2018 (LGPD).",
      details: [
        "✅ Consentimento explícito para coleta de dados",
        "✅ Direito ao acesso, retificação e exclusão de dados",
        "✅ Criptografia de dados em repouso e em trânsito",
        "✅ Política de privacidade clara e acessível",
        "✅ Designação de Encarregado de Proteção de Dados (DPO)",
        "✅ Avaliação de impacto à privacidade (AIPD)",
        "✅ Notificação de vazamento em 72 horas",
        "✅ Transferência internacional de dados com garantias",
      ],
      status: "compliant",
    },
    {
      id: "pci-dss",
      title: "Segurança de Pagamentos (PCI-DSS)",
      icon: <FileText className="w-6 h-6" />,
      content: "Todos os pagamentos são processados com conformidade PCI-DSS 3.2.1.",
      details: [
        "✅ Criptografia de dados de cartão (TLS 1.2+)",
        "✅ Tokenização de dados sensíveis",
        "✅ Firewall e segmentação de rede",
        "✅ Monitoramento e testes de segurança",
        "✅ Política de controle de acesso",
        "✅ Auditoria de segurança anual",
        "✅ Conformidade com Mercado Pago (PCI-DSS Level 1)",
        "✅ Sem armazenamento de dados de cartão",
      ],
      status: "compliant",
    },
    {
      id: "hipaa",
      title: "Proteção de Saúde (HIPAA/GDPR)",
      icon: <AlertCircle className="w-6 h-6" />,
      content: "Dados de saúde são protegidos conforme HIPAA (EUA) e GDPR (UE).",
      details: [
        "✅ Confidencialidade de informações médicas",
        "✅ Integridade de registros de saúde",
        "✅ Disponibilidade de dados 99.99% uptime",
        "✅ Auditoria de acesso a dados médicos",
        "✅ Criptografia de comunicações",
        "✅ Backup e disaster recovery",
        "✅ Conformidade com regulações internacionais",
        "✅ Acordo de Processamento de Dados (DPA)",
      ],
      status: "compliant",
    },
    {
      id: "terms",
      title: "Termos de Serviço",
      icon: <FileText className="w-6 h-6" />,
      content: "Termos claros e justos para todos os usuários da plataforma.",
      details: [
        "📋 Direitos e responsabilidades dos usuários",
        "📋 Limitação de responsabilidade da plataforma",
        "📋 Política de cancelamento e reembolso",
        "📋 Resolução de disputas",
        "📋 Propriedade intelectual",
        "📋 Modificações nos termos",
        "📋 Lei aplicável (Lei Brasileira)",
        "📋 Foro competente (São Paulo, Brasil)",
      ],
      status: "compliant",
    },
    {
      id: "accessibility",
      title: "Acessibilidade (WCAG 2.1)",
      icon: <CheckCircle className="w-6 h-6" />,
      content: "Plataforma acessível para todos os usuários, incluindo pessoas com deficiência.",
      details: [
        "♿ Conformidade WCAG 2.1 Nível AA",
        "♿ Navegação por teclado",
        "♿ Leitores de tela compatíveis",
        "♿ Contraste de cores adequado",
        "♿ Tamanho de fonte ajustável",
        "♿ Descrição de imagens (alt text)",
        "♿ Legendas em vídeos",
        "♿ Testes de acessibilidade mensais",
      ],
      status: "compliant",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Conformidade & Proteção Legal</h1>
          <p className="text-xl text-green-100">
            Planta & Raiz está em conformidade total com todas as regulações brasileiras e internacionais
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-slate-800 border-green-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Conformidade</h3>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-500">100%</p>
            <p className="text-sm text-slate-400">Todas as regulações</p>
          </Card>

          <Card className="bg-slate-800 border-blue-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Certificações</h3>
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-500">6+</p>
            <p className="text-sm text-slate-400">Certificações ativas</p>
          </Card>

          <Card className="bg-slate-800 border-purple-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Auditoria</h3>
              <Lock className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-purple-500">Trimestral</p>
            <p className="text-sm text-slate-400">Testes de segurança</p>
          </Card>
        </div>

        {/* Compliance Sections */}
        <div className="space-y-4 mb-12">
          {complianceSections.map((section) => (
            <Card
              key={section.id}
              className="bg-slate-800 border-slate-700 overflow-hidden hover:border-green-600 transition-colors"
            >
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="text-green-500">{section.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold">{section.title}</h3>
                    <p className="text-sm text-slate-400">{section.content}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-green-900 text-green-200">
                    {section.status === "compliant" ? "✓ Conforme" : "⏳ Em Andamento"}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expandedSection === section.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {expandedSection === section.id && (
                <div className="px-6 pb-6 border-t border-slate-700 bg-slate-900">
                  <ul className="space-y-2">
                    {section.details.map((detail, index) => (
                      <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-green-500 mt-1">→</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* ANVISA Resolution */}
        <Card className="bg-slate-800 border-yellow-600 p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
            Resoluções ANVISA Aplicáveis
          </h2>
          <div className="space-y-4 text-slate-300">
            <div>
              <h3 className="font-bold text-white mb-2">RDC 327/2019 - Prescrição Eletrônica</h3>
              <p className="text-sm">
                Regulamenta a prescrição eletrônica de medicamentos, incluindo os à base de cannabis. Planta & Raiz segue todos os requisitos de assinatura digital, armazenamento e rastreamento.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">RDC 660/2022 - Cannabis Medicinal</h3>
              <p className="text-sm">
                Autoriza a prescrição de medicamentos à base de cannabis por médicos, farmacêuticos e psicólogos. Planta & Raiz valida a especialidade e CRM/CRMV de todos os profissionais.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">RDC 751/2022 - Aplicativos de Saúde</h3>
              <p className="text-sm">
                Define requisitos para aplicativos de saúde. Planta & Raiz cumpre com segurança, privacidade, interoperabilidade e conformidade com regulações.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Resolução CFM 2.299/2021 - Telemedicina</h3>
              <p className="text-sm">
                Regulamenta a telemedicina no Brasil. Planta & Raiz oferece consultas seguras, com registro de atendimento, receita digital e conformidade com ética médica.
              </p>
            </div>
          </div>
        </Card>

        {/* Data Protection */}
        <Card className="bg-slate-800 border-blue-600 p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-500" />
            Proteção de Dados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
            <div>
              <h3 className="font-bold text-white mb-2">Criptografia</h3>
              <ul className="text-sm space-y-1">
                <li>• AES-256 para dados em repouso</li>
                <li>• TLS 1.3 para dados em trânsito</li>
                <li>• Chaves criptográficas gerenciadas por HSM</li>
                <li>• Rotação de chaves a cada 90 dias</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Backup & Recuperação</h3>
              <ul className="text-sm space-y-1">
                <li>• Backup diário em múltiplas regiões</li>
                <li>• RTO: 1 hora | RPO: 15 minutos</li>
                <li>• Testes de recuperação mensais</li>
                <li>• Retenção de backups por 7 anos</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Monitoramento</h3>
              <ul className="text-sm space-y-1">
                <li>• Monitoramento 24/7 de segurança</li>
                <li>• Detecção de anomalias com IA</li>
                <li>• Alertas em tempo real</li>
                <li>• Auditoria de acesso</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Conformidade</h3>
              <ul className="text-sm space-y-1">
                <li>• Auditoria externa trimestral</li>
                <li>• Teste de penetração anual</li>
                <li>• Certificação ISO 27001</li>
                <li>• SOC 2 Type II</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Contact & Support */}
        <Card className="bg-gradient-to-r from-green-900 to-green-800 border-green-600 p-8">
          <h2 className="text-2xl font-bold mb-4">Dúvidas sobre Conformidade?</h2>
          <p className="text-green-100 mb-6">
            Nossa equipe jurídica está disponível para esclarecer dúvidas sobre conformidade, privacidade e segurança.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-white text-green-700 hover:bg-green-50">
              Contatar Jurídico
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-green-700">
              Ver Política de Privacidade
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-green-700">
              Baixar Termos de Serviço
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
