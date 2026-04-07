import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, FileText, Shield, Clock, TrendingUp } from 'lucide-react';

interface ComplianceRecord {
  id: string;
  type: 'prescription' | 'consultation' | 'certificate' | 'audit';
  status: 'compliant' | 'warning' | 'non-compliant';
  title: string;
  description: string;
  timestamp: number;
  doctorName: string;
  doctorCRM: string;
  patientId: string;
  details: Record<string, any>;
}

interface ComplianceStats {
  totalRecords: number;
  compliantCount: number;
  warningCount: number;
  nonCompliantCount: number;
  complianceRate: number;
  lastAudit: number;
  icpBrasilStatus: 'valid' | 'expiring' | 'expired';
  anvisaStatus: 'compliant' | 'warning' | 'non-compliant';
  cfmStatus: 'compliant' | 'warning' | 'non-compliant';
}

const ComplianceDashboard: React.FC = () => {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [stats, setStats] = useState<ComplianceStats>({
    totalRecords: 0,
    compliantCount: 0,
    warningCount: 0,
    nonCompliantCount: 0,
    complianceRate: 0,
    lastAudit: Date.now(),
    icpBrasilStatus: 'valid',
    anvisaStatus: 'compliant',
    cfmStatus: 'compliant',
  });
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    // Simulate loading compliance records
    const mockRecords: ComplianceRecord[] = [
      {
        id: 'rec-001',
        type: 'prescription',
        status: 'compliant',
        title: 'Prescrição Digital - Cannabis Medicinal',
        description: 'Prescrição assinada digitalmente com certificado ICP-Brasil',
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
        doctorName: 'Dr. Edilson Bezerra',
        doctorCRM: '123456/SP',
        patientId: 'pat-001',
        details: {
          prescriptionId: 'presc-001',
          medication: 'Cannabis Medicinal - THC 5% CBD 15%',
          dosage: '1 gota 3x ao dia',
          duration: '30 dias',
          signatureDate: new Date().toISOString(),
          icpBrasilCertificate: 'valid',
        },
      },
      {
        id: 'rec-002',
        type: 'consultation',
        status: 'compliant',
        title: 'Consulta Telemedicina - Triagem Completa',
        description: 'Consulta realizada via Jitsi com gravação e transcrição',
        timestamp: Date.now() - 4 * 60 * 60 * 1000,
        doctorName: 'Dr. Edilson Bezerra',
        doctorCRM: '123456/SP',
        patientId: 'pat-002',
        details: {
          consultationId: 'cons-001',
          duration: '45 minutos',
          recordingUrl: 'https://storage.example.com/cons-001.mp4',
          transcriptionUrl: 'https://storage.example.com/cons-001.txt',
          patientConsent: true,
        },
      },
      {
        id: 'rec-003',
        type: 'certificate',
        status: 'compliant',
        title: 'Certificado ICP-Brasil - Dr. Edilson Bezerra',
        description: 'Certificado digital válido para assinatura de documentos médicos',
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
        doctorName: 'Dr. Edilson Bezerra',
        doctorCRM: '123456/SP',
        patientId: '',
        details: {
          certificateId: 'cert-001',
          issuer: 'AC Raiz Brasileira',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          certificateType: 'e-CPF',
          keySize: '2048 bits',
        },
      },
      {
        id: 'rec-004',
        type: 'audit',
        status: 'compliant',
        title: 'Auditoria Mensal - Conformidade ANVISA/CFM/LGPD',
        description: 'Auditoria automática de conformidade com regulamentações',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        doctorName: 'Sistema Manus CEO',
        doctorCRM: 'SYSTEM',
        patientId: '',
        details: {
          auditId: 'audit-001',
          scope: 'ANVISA, CFM, LGPD, ICP-Brasil',
          recordsAudited: 1250,
          complianceRate: 99.2,
          issues: [],
        },
      },
    ];

    setRecords(mockRecords);

    // Calculate stats
    const compliant = mockRecords.filter((r) => r.status === 'compliant').length;
    const warning = mockRecords.filter((r) => r.status === 'warning').length;
    const nonCompliant = mockRecords.filter((r) => r.status === 'non-compliant').length;

    setStats({
      totalRecords: mockRecords.length,
      compliantCount: compliant,
      warningCount: warning,
      nonCompliantCount: nonCompliant,
      complianceRate: (compliant / mockRecords.length) * 100,
      lastAudit: Date.now() - 1 * 24 * 60 * 60 * 1000,
      icpBrasilStatus: 'valid',
      anvisaStatus: 'compliant',
      cfmStatus: 'compliant',
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'non-compliant':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-500/20 text-green-400">✓ Conforme</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400">⚠ Atenção</Badge>;
      case 'non-compliant':
        return <Badge className="bg-red-500/20 text-red-400">✗ Não Conforme</Badge>;
      default:
        return null;
    }
  };

  const filteredRecords =
    filterType === 'all' ? records : records.filter((r) => r.type === filterType);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-[#00FF00]" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Dashboard de Conformidade
            </h1>
          </div>
          <p className="text-gray-400">
            Auditoria completa de conformidade ANVISA, CFM, LGPD e ICP-Brasil
          </p>
        </div>

        {/* Compliance Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Compliance Rate */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Taxa de Conformidade</h3>
              <TrendingUp className="w-5 h-5 text-[#00FF00]" />
            </div>
            <p className="text-3xl font-bold text-[#00FF00]">{stats.complianceRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.compliantCount} de {stats.totalRecords} registros
            </p>
          </Card>

          {/* ICP-Brasil Status */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">ICP-Brasil</h3>
              {stats.icpBrasilStatus === 'valid' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            <p className="text-lg font-bold text-white capitalize">{stats.icpBrasilStatus}</p>
            <p className="text-xs text-gray-500 mt-2">Certificado digital válido</p>
          </Card>

          {/* ANVISA Status */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">ANVISA</h3>
              {stats.anvisaStatus === 'compliant' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            <p className="text-lg font-bold text-white capitalize">{stats.anvisaStatus}</p>
            <p className="text-xs text-gray-500 mt-2">Conformidade regulatória</p>
          </Card>

          {/* CFM Status */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">CFM</h3>
              {stats.cfmStatus === 'compliant' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            <p className="text-lg font-bold text-white capitalize">{stats.cfmStatus}</p>
            <p className="text-xs text-gray-500 mt-2">Conselho Federal de Medicina</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            onClick={() => setFilterType('all')}
            className={`${
              filterType === 'all'
                ? 'bg-[#00FF00] text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Todos
          </Button>
          <Button
            onClick={() => setFilterType('prescription')}
            className={`${
              filterType === 'prescription'
                ? 'bg-[#00FF00] text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Prescrições
          </Button>
          <Button
            onClick={() => setFilterType('consultation')}
            className={`${
              filterType === 'consultation'
                ? 'bg-[#00FF00] text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Consultas
          </Button>
          <Button
            onClick={() => setFilterType('certificate')}
            className={`${
              filterType === 'certificate'
                ? 'bg-[#00FF00] text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Certificados
          </Button>
          <Button
            onClick={() => setFilterType('audit')}
            className={`${
              filterType === 'audit'
                ? 'bg-[#00FF00] text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Auditorias
          </Button>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card
              key={record.id}
              className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6 cursor-pointer hover:border-[#00FF00]/40 transition"
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {getStatusIcon(record.status)}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{record.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{record.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>👨‍⚕️ {record.doctorName}</span>
                      <span>📅 {new Date(record.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">{getStatusBadge(record.status)}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-[#0A0E27] border-[#00FF00]/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedRecord.title}</h2>
                  <p className="text-gray-400 mt-2">{selectedRecord.description}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mt-6">
                <div>
                  <h3 className="text-[#00FF00] font-semibold mb-2">Status</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedRecord.status)}
                    {getStatusBadge(selectedRecord.status)}
                  </div>
                </div>

                <div>
                  <h3 className="text-[#00FF00] font-semibold mb-2">Informações</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>
                      <span className="text-white">Médico:</span> {selectedRecord.doctorName} (
                      {selectedRecord.doctorCRM})
                    </p>
                    <p>
                      <span className="text-white">Data:</span>{' '}
                      {new Date(selectedRecord.timestamp).toLocaleString('pt-BR')}
                    </p>
                    <p>
                      <span className="text-white">Tipo:</span> {selectedRecord.type}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-[#00FF00] font-semibold mb-2">Detalhes</h3>
                  <pre className="bg-black/30 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(selectedRecord.details, null, 2)}
                  </pre>
                </div>

                <Button className="w-full bg-[#00FF00] text-black hover:bg-[#00dd00]">
                  Exportar Relatório
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceDashboard;
