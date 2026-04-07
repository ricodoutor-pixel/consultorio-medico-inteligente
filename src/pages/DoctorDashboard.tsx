/**
 * Dashboard de Médicos - Dr. Edilson Bezerra
 * 
 * Funcionalidades:
 * - Histórico de triagens
 * - Prescrições autorizadas
 * - Estatísticas de conformidade
 * - Alertas críticos
 * - Relatórios em tempo real
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Triage {
  id: string;
  patientName: string;
  symptoms: string;
  specialty: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Date;
  responseTime: number; // em minutos
}

interface Prescription {
  id: string;
  patientName: string;
  medications: string[];
  dosage: string;
  status: 'authorized' | 'pending' | 'dispensed';
  authorizedBy: string;
  timestamp: Date;
  anvisaCode: string;
}

interface ComplianceStats {
  anvisa: number;
  cfm: number;
  lgpd: number;
  icpBrasil: number;
}

export default function DoctorDashboard() {
  const [triages, setTriages] = useState<Triage[]>([
    {
      id: 'TRIAGE-001',
      patientName: 'João Silva',
      symptoms: 'Insônia, ansiedade',
      specialty: 'Medicina Integrativa',
      status: 'accepted',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      responseTime: 3.5,
    },
    {
      id: 'TRIAGE-002',
      patientName: 'Maria Santos',
      symptoms: 'Dor crônica',
      specialty: 'Fisioterapia',
      status: 'accepted',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      responseTime: 2.1,
    },
    {
      id: 'TRIAGE-003',
      patientName: 'Pedro Costa',
      symptoms: 'Depressão, fadiga',
      specialty: 'Psicologia',
      status: 'pending',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      responseTime: 0,
    },
  ]);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: 'PRESC-001',
      patientName: 'João Silva',
      medications: ['Óleo CBD 10%', 'Chá de Camomila'],
      dosage: '10mg CBD, 2x ao dia',
      status: 'authorized',
      authorizedBy: 'Dr. Edilson Bezerra',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      anvisaCode: 'ANVISA-2026-001',
    },
    {
      id: 'PRESC-002',
      patientName: 'Maria Santos',
      medications: ['Óleo CBD 5%', 'Óleo de Coco'],
      dosage: '5mg CBD, 1x ao dia',
      status: 'dispensed',
      authorizedBy: 'Dr. Edilson Bezerra',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      anvisaCode: 'ANVISA-2026-002',
    },
  ]);

  const [complianceStats] = useState<ComplianceStats>({
    anvisa: 100,
    cfm: 100,
    lgpd: 100,
    icpBrasil: 100,
  });

  const chartData = [
    { name: 'Seg', triagens: 12, prescrições: 8, conformidade: 100 },
    { name: 'Ter', triagens: 15, prescrições: 10, conformidade: 100 },
    { name: 'Qua', triagens: 18, prescrições: 12, conformidade: 100 },
    { name: 'Qui', triagens: 14, prescrições: 9, conformidade: 100 },
    { name: 'Sex', triagens: 20, prescrições: 14, conformidade: 100 },
    { name: 'Sab', triagens: 8, prescrições: 5, conformidade: 100 },
    { name: 'Dom', triagens: 5, prescrições: 3, conformidade: 100 },
  ];

  const stats = [
    {
      label: 'Triagens Hoje',
      value: triages.filter((t) => {
        const today = new Date();
        return t.timestamp.toDateString() === today.toDateString();
      }).length,
      icon: '📋',
      color: 'bg-blue-900',
    },
    {
      label: 'Prescrições Autorizadas',
      value: prescriptions.filter((p) => p.status === 'authorized').length,
      icon: '💊',
      color: 'bg-green-900',
    },
    {
      label: 'Tempo Médio de Resposta',
      value: `${(triages.reduce((acc, t) => acc + t.responseTime, 0) / triages.length).toFixed(1)} min`,
      icon: '⏱️',
      color: 'bg-yellow-900',
    },
    {
      label: 'Taxa de Conformidade',
      value: '100%',
      icon: '✅',
      color: 'bg-purple-900',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            👨‍⚕️ Dashboard de Médicos
          </h1>
          <p className="text-gray-400">
            Dr. Edilson Bezerra - Autoridade Máxima do Sistema
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className={`${stat.color} border-slate-700 p-6`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-300 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Compliance Status */}
        <Card className="bg-slate-800 border-slate-700 mb-8 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🔒 Status de Conformidade</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'ANVISA', value: complianceStats.anvisa },
              { name: 'CFM', value: complianceStats.cfm },
              { name: 'LGPD', value: complianceStats.lgpd },
              { name: 'ICP-Brasil', value: complianceStats.icpBrasil },
            ].map((item) => (
              <div key={item.name} className="bg-slate-700 rounded p-4 text-center">
                <p className="text-gray-400 text-sm mb-2">{item.name}</p>
                <p className="text-2xl font-bold text-green-400">{item.value}%</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Gráficos */}
        <Card className="bg-slate-800 border-slate-700 mb-8 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📊 Atividade Semanal</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Legend />
              <Line type="monotone" dataKey="triagens" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="prescrições" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="triages" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="triages">📋 Triagens</TabsTrigger>
            <TabsTrigger value="prescriptions">💊 Prescrições</TabsTrigger>
            <TabsTrigger value="alerts">🚨 Alertas</TabsTrigger>
          </TabsList>

          {/* Triagens Tab */}
          <TabsContent value="triages">
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Paciente
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Sintomas
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Especialidade
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Tempo (min)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {triages.map((triage) => (
                      <tr key={triage.id} className="hover:bg-slate-700 transition">
                        <td className="px-6 py-4 text-sm text-gray-300">{triage.patientName}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{triage.symptoms}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{triage.specialty}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              triage.status === 'accepted'
                                ? 'bg-green-900 text-green-300'
                                : triage.status === 'rejected'
                                  ? 'bg-red-900 text-red-300'
                                  : 'bg-yellow-900 text-yellow-300'
                            }`}
                          >
                            {triage.status === 'accepted'
                              ? '✅ Aceita'
                              : triage.status === 'rejected'
                                ? '❌ Rejeitada'
                                : '⏳ Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {triage.responseTime > 0 ? triage.responseTime.toFixed(1) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Prescrições Tab */}
          <TabsContent value="prescriptions">
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Paciente
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Medicamentos
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Dosagem
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Código ANVISA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {prescriptions.map((prescription) => (
                      <tr key={prescription.id} className="hover:bg-slate-700 transition">
                        <td className="px-6 py-4 text-sm text-gray-300">{prescription.patientName}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {prescription.medications.join(', ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{prescription.dosage}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              prescription.status === 'authorized'
                                ? 'bg-green-900 text-green-300'
                                : prescription.status === 'dispensed'
                                  ? 'bg-blue-900 text-blue-300'
                                  : 'bg-yellow-900 text-yellow-300'
                            }`}
                          >
                            {prescription.status === 'authorized'
                              ? '✅ Autorizada'
                              : prescription.status === 'dispensed'
                                ? '📦 Dispensada'
                                : '⏳ Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{prescription.anvisaCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Alertas Tab */}
          <TabsContent value="alerts">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="space-y-4">
                <div className="bg-red-900 border border-red-700 rounded p-4 text-red-200">
                  <p className="font-semibold">🚨 Alerta Crítico</p>
                  <p className="text-sm mt-1">
                    Nenhum alerta crítico no momento. Sistema operacional 100%.
                  </p>
                </div>

                <div className="bg-yellow-900 border border-yellow-700 rounded p-4 text-yellow-200">
                  <p className="font-semibold">⚠️ Aviso</p>
                  <p className="text-sm mt-1">
                    Certificado ICP-Brasil válido até 31/12/2027. Renovação recomendada em 11/2027.
                  </p>
                </div>

                <div className="bg-green-900 border border-green-700 rounded p-4 text-green-200">
                  <p className="font-semibold">✅ Status Normal</p>
                  <p className="text-sm mt-1">
                    Conformidade 100% com ANVISA, CFM, LGPD e ICP-Brasil. Todas as operações normais.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ações */}
        <div className="mt-8 flex gap-4">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            📋 Gerar Relatório
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-300">
            📊 Exportar Dados
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-300">
            🔄 Sincronizar
          </Button>
        </div>
      </div>
    </div>
  );
}
