import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, FileText, Users, Clock, TrendingUp } from 'lucide-react';

interface Application {
  id: string;
  fullName: string;
  email: string;
  crm: string;
  crmState: string;
  specialty: string;
  yearsOfExperience: number;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: number;
  validationResults: {
    crmValid: boolean;
    certificateValid: boolean;
    documentsComplete: boolean;
    bankAccountValid: boolean;
  };
}

interface RecruitmentStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  averageReviewTime: number;
}

const RecruitmentDashboard: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<RecruitmentStats>({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    approvalRate: 0,
    averageReviewTime: 0,
  });
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Simulate loading applications
    const mockApplications: Application[] = [
      {
        id: 'app-001',
        fullName: 'Dr. João Silva',
        email: 'joao@example.com',
        crm: '654321',
        crmState: 'RJ',
        specialty: 'Psiquiatria',
        yearsOfExperience: 8,
        status: 'approved',
        submittedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        validationResults: {
          crmValid: true,
          certificateValid: true,
          documentsComplete: true,
          bankAccountValid: true,
        },
      },
      {
        id: 'app-002',
        fullName: 'Dra. Maria Santos',
        email: 'maria@example.com',
        crm: '789012',
        crmState: 'MG',
        specialty: 'Dermatologia',
        yearsOfExperience: 5,
        status: 'under_review',
        submittedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        validationResults: {
          crmValid: true,
          certificateValid: true,
          documentsComplete: true,
          bankAccountValid: false,
        },
      },
      {
        id: 'app-003',
        fullName: 'Dr. Carlos Oliveira',
        email: 'carlos@example.com',
        crm: '456789',
        crmState: 'BA',
        specialty: 'Cardiologia',
        yearsOfExperience: 12,
        status: 'pending',
        submittedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        validationResults: {
          crmValid: true,
          certificateValid: false,
          documentsComplete: true,
          bankAccountValid: true,
        },
      },
    ];

    setApplications(mockApplications);

    // Calculate stats
    const pending = mockApplications.filter((a) => a.status === 'pending' || a.status === 'under_review')
      .length;
    const approved = mockApplications.filter((a) => a.status === 'approved').length;
    const rejected = mockApplications.filter((a) => a.status === 'rejected').length;

    setStats({
      totalApplications: mockApplications.length,
      pendingReview: pending,
      approved,
      rejected,
      approvalRate: (approved / mockApplications.length) * 100,
      averageReviewTime: 24,
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
      case 'under_review':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400">✓ Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500/20 text-blue-400">⏳ Pendente</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-500/20 text-yellow-400">👁 Em Análise</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400">✗ Rejeitado</Badge>;
      default:
        return null;
    }
  };

  const getValidationColor = (valid: boolean) => {
    return valid ? 'text-green-400' : 'text-red-400';
  };

  const filteredApplications =
    filterStatus === 'all'
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-[#00FF00]" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Painel de Recrutamento de Médicos
            </h1>
          </div>
          <p className="text-gray-400">
            Gerenciar candidaturas, revisar documentos e aprovar novos médicos
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Applications */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Total de Candidaturas</h3>
              <FileText className="w-5 h-5 text-[#00FF00]" />
            </div>
            <p className="text-3xl font-bold text-[#00FF00]">{stats.totalApplications}</p>
          </Card>

          {/* Pending Review */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Aguardando Análise</h3>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats.pendingReview}</p>
          </Card>

          {/* Approved */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Aprovados</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
          </Card>

          {/* Rejected */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Rejeitados</h3>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
          </Card>

          {/* Approval Rate */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Taxa de Aprovação</h3>
              <TrendingUp className="w-5 h-5 text-[#00FF00]" />
            </div>
            <p className="text-3xl font-bold text-[#00FF00]">{stats.approvalRate.toFixed(1)}%</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            onClick={() => setFilterStatus('all')}
            className={`${
              filterStatus === 'all'
                ? 'bg-[#00FF00] text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Todas
          </Button>
          <Button
            onClick={() => setFilterStatus('pending')}
            className={`${
              filterStatus === 'pending'
                ? 'bg-[#00FF00] text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Pendentes
          </Button>
          <Button
            onClick={() => setFilterStatus('under_review')}
            className={`${
              filterStatus === 'under_review'
                ? 'bg-[#00FF00] text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Em Análise
          </Button>
          <Button
            onClick={() => setFilterStatus('approved')}
            className={`${
              filterStatus === 'approved'
                ? 'bg-[#00FF00] text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Aprovados
          </Button>
          <Button
            onClick={() => setFilterStatus('rejected')}
            className={`${
              filterStatus === 'rejected'
                ? 'bg-[#00FF00] text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Rejeitados
          </Button>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <Card
              key={app.id}
              className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6 cursor-pointer hover:border-[#00FF00]/40 transition"
              onClick={() => setSelectedApplication(app)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {getStatusIcon(app.status)}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{app.fullName}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {app.specialty} • CRM {app.crm}/{app.crmState} • {app.yearsOfExperience} anos
                    </p>
                    <p className="text-gray-500 text-xs mt-2">{app.email}</p>
                  </div>
                </div>
                <div className="ml-4">{getStatusBadge(app.status)}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-[#0A0E27] border-[#00FF00]/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedApplication.fullName}</h2>
                  <p className="text-gray-400 mt-2">{selectedApplication.specialty}</p>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6 mt-6">
                {/* Status */}
                <div>
                  <h3 className="text-[#00FF00] font-semibold mb-2">Status</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedApplication.status)}
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-[#00FF00] font-semibold mb-2">Informações de Contato</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>
                      <span className="text-white">Email:</span> {selectedApplication.email}
                    </p>
                    <p>
                      <span className="text-white">CRM:</span> {selectedApplication.crm}/
                      {selectedApplication.crmState}
                    </p>
                    <p>
                      <span className="text-white">Experiência:</span>{' '}
                      {selectedApplication.yearsOfExperience} anos
                    </p>
                  </div>
                </div>

                {/* Validation Results */}
                <div>
                  <h3 className="text-[#00FF00] font-semibold mb-2">Resultados de Validação</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">CRM Válido</span>
                      <span
                        className={`font-semibold ${getValidationColor(
                          selectedApplication.validationResults.crmValid
                        )}`}
                      >
                        {selectedApplication.validationResults.crmValid ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Certificado Válido</span>
                      <span
                        className={`font-semibold ${getValidationColor(
                          selectedApplication.validationResults.certificateValid
                        )}`}
                      >
                        {selectedApplication.validationResults.certificateValid ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Documentos Completos</span>
                      <span
                        className={`font-semibold ${getValidationColor(
                          selectedApplication.validationResults.documentsComplete
                        )}`}
                      >
                        {selectedApplication.validationResults.documentsComplete ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Conta Bancária Válida</span>
                      <span
                        className={`font-semibold ${getValidationColor(
                          selectedApplication.validationResults.bankAccountValid
                        )}`}
                      >
                        {selectedApplication.validationResults.bankAccountValid ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-[#00FF00]/20">
                  <Button className="flex-1 bg-green-500 text-black hover:bg-green-600">
                    Aprovar
                  </Button>
                  <Button className="flex-1 bg-red-500 text-white hover:bg-red-600">
                    Rejeitar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruitmentDashboard;
